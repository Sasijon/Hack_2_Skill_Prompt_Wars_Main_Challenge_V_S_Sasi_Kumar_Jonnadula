"""
Tests: Chat endpoint — mocks Supabase, Gemini stream, and auth.
"""
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport
from jose import jwt
import time


def make_jwt(user_id: str = "test-user-id") -> str:
    """Create a valid test JWT signed with the stub secret from conftest."""
    now = int(time.time())
    return jwt.encode(
        {"sub": user_id, "iat": now, "exp": now + 3600, "role": "authenticated"},
        "test-jwt-secret-32bytes-padded-xx",
        algorithm="HS256",
    )


@pytest.mark.asyncio
async def test_chat_requires_auth():
    """Chat endpoint rejects requests with no token."""
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/chat/", json={"message": "hello"})
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_chat_with_valid_token_streams_response(monkeypatch):
    """A valid JWT + mocked Gemini stream returns SSE response."""
    from main import app
    from middleware.auth import get_current_user
    import routers.chat as chat_router

    # Override auth to bypass JWT validation
    app.dependency_overrides[get_current_user] = lambda: "test-user-id"

    async def mock_stream(*args, **kwargs):
        """Async generator that yields SSE chunks like the real Gemini stream."""
        yield "Great job"
        yield " resisting today!"

    # Patch both the stream and the context builder
    monkeypatch.setattr(chat_router, "generate_chat_response_stream", mock_stream)
    monkeypatch.setattr(
        chat_router,
        "build_habit_context",
        AsyncMock(return_value="habit context"),
    )

    token = make_jwt()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/chat/",
            json={"message": "I need motivation"},
            headers={"Authorization": f"Bearer {token}"},
        )

    # Cleanup override so other tests are not affected
    del app.dependency_overrides[get_current_user]

    # Chat returns a streaming SSE response
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")
    # Verify the chunked content is present in the streamed body
    assert "Great job" in response.text

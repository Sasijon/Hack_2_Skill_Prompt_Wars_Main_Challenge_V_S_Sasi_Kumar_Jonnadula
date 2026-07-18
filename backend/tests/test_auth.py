"""
Tests: JWT auth middleware — unit tests, no real Supabase calls.

The conftest.py injects stub env vars so the FastAPI app can start.
JWT signing uses the same stub secret, so we can generate valid tokens locally.
"""
import pytest
import time
from jose import jwt
from httpx import AsyncClient, ASGITransport


TEST_JWT_SECRET = "test-jwt-secret-32bytes-padded-xx"


def make_jwt(user_id: str = "test-user-uuid", expired: bool = False) -> str:
    """Create a HS256 JWT that matches the test secret configured in conftest."""
    now = int(time.time())
    payload = {
        "sub": user_id,
        "iat": now - 3600 if expired else now,
        "exp": now - 1 if expired else now + 3600,
        "role": "authenticated",
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


@pytest.mark.asyncio
async def test_health_is_public():
    """Health endpoint requires no auth."""
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    # May return 200 or 500 (no real Supabase) but must not be 401/403
    assert response.status_code not in (401, 403)


@pytest.mark.asyncio
async def test_protected_route_rejects_no_token():
    """Protected route returns 403 when no Authorization header is sent."""
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/habits/")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_protected_route_rejects_malformed_token():
    """Malformed JWT returns 401."""
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/habits/",
            headers={"Authorization": "Bearer not.a.real.jwt"},
        )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_rejects_expired_token():
    """Expired JWT returns 401."""
    from main import app
    token = make_jwt(expired=True)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/habits/",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_auth_me_requires_token():
    """The /auth/me endpoint also rejects unauthenticated requests."""
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/auth/me")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_auth_me_accepts_valid_token():
    """A valid JWT is accepted and returns the user_id from the sub claim."""
    from main import app
    user_id = "550e8400-e29b-41d4-a716-446655440000"
    token = make_jwt(user_id=user_id)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 200
    body = response.json()
    assert body["user_id"] == user_id
    assert body["status"] == "authenticated"

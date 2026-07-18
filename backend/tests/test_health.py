"""
Tests: /health endpoint.
Requires a running backend with valid .env credentials.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.asyncio
async def test_health_returns_200():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "version" in body
    assert "supabase" in body


@pytest.mark.asyncio
async def test_health_includes_supabase_status():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    body = response.json()
    assert body["supabase"] in ("connected", "unreachable")

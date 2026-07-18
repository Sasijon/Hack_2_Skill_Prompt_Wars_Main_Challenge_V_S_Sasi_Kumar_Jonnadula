"""
Shared pytest fixtures and configuration.

Injects stub environment variables BEFORE any module import, then patches
get_supabase() so no test ever tries to connect to a real Supabase instance.
The real Supabase client requires a JWT-shaped API key — we provide one here.
"""
import os
import pytest
from unittest.mock import MagicMock

# ─── A minimal valid JWT string (header.payload.signature format) ─────────────
# The Supabase client checks that the key matches: header.payload[.signature]
# This satisfies the regex without hitting any real endpoint.
_STUB_JWT_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJyb2xlIjoic2VydmljZV9yb2xlIn0"
    ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
)


def pytest_configure(config):
    """
    Set stub env vars before any module-level code runs.
    pytest_configure fires before collection, so all imports see these values.
    """
    os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
    os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", _STUB_JWT_KEY)
    os.environ.setdefault(
        "SUPABASE_JWT_SECRET",
        "test-jwt-secret-32bytes-padded-xx",
    )
    os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key")
    os.environ.setdefault("APP_ENV", "test")
    os.environ.setdefault("CORS_ORIGINS", "http://localhost:8081")


@pytest.fixture(autouse=True)
def reset_dependency_overrides():
    """
    Reset FastAPI dependency overrides before each test.
    Prevents test_chat.py's module-level override from leaking into auth tests.
    """
    from main import app
    original = dict(app.dependency_overrides)
    yield
    app.dependency_overrides.clear()
    app.dependency_overrides.update(original)


@pytest.fixture(autouse=True)
def mock_supabase_client(monkeypatch):
    """
    Patch get_supabase() in the database module so no test ever
    instantiates a real Supabase client (which would fail with stub credentials).

    Each individual test that needs a custom DB response can further monkeypatch
    via the 'db' fixture or direct monkeypatching.
    """
    import database

    mock_db = MagicMock()

    # Default: all table queries return empty data
    mock_table = MagicMock()
    mock_result = MagicMock()
    mock_result.data = []
    mock_result.count = 0

    mock_table.select.return_value = mock_table
    mock_table.insert.return_value = mock_table
    mock_table.update.return_value = mock_table
    mock_table.delete.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.neq.return_value = mock_table
    mock_table.gte.return_value = mock_table
    mock_table.lte.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.limit.return_value = mock_table
    mock_table.single.return_value = mock_table
    mock_table.execute.return_value = mock_result

    mock_db.table.return_value = mock_table

    monkeypatch.setattr(database, "_supabase_client", mock_db)
    monkeypatch.setattr(database, "get_supabase", lambda: mock_db)

    return mock_db

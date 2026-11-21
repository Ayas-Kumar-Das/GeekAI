"""Shared pytest fixtures for the backend baseline.

The S0 suite deliberately does not start the production lifespan. The
lifespan runs Alembic and seeds users, neither of which belongs in a unit test
and neither of which is safe without a disposable database. `httpx`'s
ASGITransport calls the ASGI app directly and does not invoke lifespan, so the
health/OpenAPI tests exercise the real route table without a database.
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

import httpx
import pytest

# Set these before importing app.main: settings and the SQLAlchemy engine are
# created at import time. No connection is opened by the tests.
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/geekai_test")
os.environ.setdefault("SECRET_KEY", "s0-test-secret-not-for-production")
os.environ.setdefault("UPLOAD_DIR", str(Path(tempfile.gettempdir()) / "geekai-s0-uploads"))
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")


@pytest.fixture(scope="session")
def app():
    from app.main import app as fastapi_app

    return fastapi_app


@pytest.fixture
async def client(app):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as test_client:
        yield test_client

"""OpenAPI schema load test.

This catches import-time route breakage and accidental removal of the route
families the delivered frontend already uses. It intentionally asserts a
subset, not an exact route count, so later stages can add routes without
rewriting the baseline.
"""

from __future__ import annotations

import pytest

REQUIRED_PATHS = {
    "/",
    "/health",
    "/api/health",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/seed",
    "/api/participants/",
    "/api/participants/{participant_id}",
    "/api/participants/{participant_id}/photo",
    "/api/participants/{participant_id}/qrcode",
    "/api/sessions/",
    "/api/sessions/{session_id}",
    "/api/attendance/",
    "/api/attendance/event",
    "/api/attendance/session/{session_id}",
    "/api/attendance/stats",
    "/api/attendance/validate-qr",
    "/api/attendance/face-match",
    "/api/embeddings/sync",
    "/api/admin/dashboard",
    "/api/admin/volunteers",
    "/api/admin/volunteers/{volunteer_id}/toggle-status",
    "/api/admin/volunteers/{volunteer_id}",
    "/api/admin/export/participants",
    "/api/admin/export/attendance",
}


@pytest.mark.asyncio
async def test_openapi_schema_loads_and_contains_current_route_families(client):
    response = await client.get("/openapi.json")

    assert response.status_code == 200
    schema = response.json()
    assert schema["openapi"].startswith("3.")
    assert schema["info"]["title"] == "GeekAI"
    assert schema["info"]["version"] == "1.0.0"

    paths = set(schema["paths"])
    missing = REQUIRED_PATHS - paths
    assert not missing, f"OpenAPI schema is missing expected paths: {sorted(missing)}"


@pytest.mark.asyncio
async def test_openapi_does_not_publish_the_static_upload_mount(client):
    response = await client.get("/openapi.json")

    assert response.status_code == 200
    paths = response.json()["paths"]
    assert not any(path.startswith("/uploads") for path in paths)

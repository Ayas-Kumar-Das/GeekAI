# Backend tests — S0 baseline

This folder starts the backend test baseline. It is deliberately small: S0 proves that the application imports, the route table loads and the synthetic fixture generator is deterministic. It does **not** claim that the security, registration, QR, sync or email behaviour is tested yet.

## Local setup

From `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
```

On Linux/macOS:

```bash
python -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
```

`requirements-dev.txt` is the test/lint set. It includes the runtime packages needed to import `app.main` but intentionally excludes InsightFace, ONNX Runtime and OpenCV, which are lazy-imported by `app/services/embedding_service.py` and are not needed by the S0 suite. The full production set remains in `requirements.txt`.

## Commands

```powershell
# From backend/
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m ruff check .
```

Linux/macOS:

```bash
python -m pytest -q
python -m ruff check .
```

The same commands are available as `make test`, `make lint`, `make migrate-check`, `make openapi` and `make fixtures` from `backend/` where `make` is installed. On Windows, use the explicit commands below.

Migration check against a disposable PostgreSQL+pgvector database:

```powershell
$env:DATABASE_URL = "postgresql+asyncpg://geekai:geekai@localhost:55432/geekai"
.\.venv\Scripts\python.exe -m alembic upgrade head
```

The CI workflow starts a `pgvector/pgvector:pg16` service and runs the same command. Do not point `alembic upgrade head` at a shared or production database.

## What the S0 suite covers

- `test_health.py`: `/`, `/health` and `/api/health` through `httpx.ASGITransport`. The production lifespan is **not** run, so no migration, seed or database connection is triggered.
- `test_openapi.py`: `/openapi.json` loads and still contains the route families the delivered frontend uses. It also asserts that the `/uploads` static mount is not published in the schema (the mount itself still exists until S1).
- `test_fixtures.py`: the synthetic generator writes the expected valid/reject mix, an oversized upload, placeholder blurry/dark/multi-face/low-resolution images, a deterministic manifest and the honest caveat.

## What is not covered yet

- No database fixture or transaction rollback. Any test that needs a real database is added in S1/S2 with a disposable Postgres service.
- No authentication/authorization tests. S1 adds the 401/403/404 matrix, the fresh-database bootstrap test and the audit assertions.
- No registration endpoint tests. S4 adds valid, duplicate, consent, photo, oversized, replay and concurrency cases.
- No QR forgery/replay tests. S5 adds signed/expired/revoked/wrong-scope/duplicate cases.
- No sync batch tests. S7/S8 add manifest verification, checksum, per-item results and replay.
- No email provider tests. S6 mocks the provider.
- The fixture images are geometric placeholders. They do **not** validate real face-detection, blur, brightness or multi-face thresholds. Tuning those thresholds requires a separately approved, consented face set.

## CI

`.github/workflows/backend.yml` runs on pushes and pull requests that touch `backend/**`, `docs/**` or the workflow itself. It starts `pgvector/pgvector:pg16`, installs `requirements-dev.txt`, runs `alembic upgrade head`, `pytest`, `ruff` and a non-blocking `pip-audit -r requirements.txt`. The audit is non-blocking because the pre-existing production dependency set may report advisories that are outside S0's scope; the step still records the output. See the workflow comments for the exact rationale.

## Adding a test

1. Put it under `backend/tests/` and name it `test_*.py`.
2. Use the `client` fixture from `conftest.py` for ASGI requests.
3. If the test needs a database, add an explicit fixture and mark it so it can be skipped when no disposable database is configured.
4. Do not import the production lifespan in a unit test.
5. Do not commit generated fixtures; run `python scripts/generate_fixtures.py` locally and keep the output under the gitignored `backend/fixtures/generated/`.

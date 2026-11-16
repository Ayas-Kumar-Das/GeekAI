# GeekAI MVP — Implementation Plan

## Overview
Smart registration & attendance management for Odisha AI Symposium (500–1000 participants).

**Stack**: React+Vite (frontend), FastAPI (backend), PostgreSQL+pgvector (DB), OpenCV+InsightFace (local face check-in)

---

## Database Initialization & Migration Reliability (`relation "users" does not exist`)

### Root Cause
1. Previously, running `docker compose up` or starting FastAPI directly invoked `uvicorn app.main:app` without applying database schema migrations (`alembic upgrade head`).
2. When requests arrived at unmigrated PostgreSQL databases, queries targeting the `users` table failed with `relation "users" does not exist`.
3. `backend/app/models/__init__.py` was empty and did not export the model classes and metadata.
4. FastAPI `lifespan` in `app/main.py` did not execute migrations on startup.
5. `backend/Dockerfile` had no entrypoint script to migrate the schema prior to starting the web server.

### Resolved
- [x] 1. Imported and exported all models (`Base`, `User`, `Participant`, `FaceEmbedding`, `Session`, `Attendance`, and enums) in `backend/app/models/__init__.py`.
- [x] 2. Updated `backend/migrations/env.py` to allow online migrations to run safely across both sync/CLI contexts and async loop contexts (via thread pool worker).
- [x] 3. Implemented `backend/app/core/db_init.py` with retry logic and invoked `await run_migrations_async()` inside `backend/app/main.py` lifespan to migrate the schema on application startup before accepting traffic.
- [x] 4. Created `backend/docker-entrypoint.sh` with a native socket-based PostgreSQL connectivity check and `alembic upgrade head` before handing off to `uvicorn`.
- [x] 5. Updated `backend/Dockerfile` with `PYTHONUNBUFFERED=1` and `ENTRYPOINT ["/app/docker-entrypoint.sh"]`.
- [x] 6. Configured `docker-compose.yml` backend service with healthcheck dependency and unbuffered logs.
- [x] 7. Preserved all existing PostgreSQL data and volumes; verified zero destructive operations.
- [x] 8. Verified all 6 tables exist in PostgreSQL (`users`, `participants`, `face_embeddings`, `sessions`, `attendance`, `alembic_version`).
- [x] 9. Verified login, volunteer registration, participant creation, session creation, and attendance recording work end-to-end.
- [x] 10. Rebuilt Docker container and validated cold-boot migration execution and container health.

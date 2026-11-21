# Route matrix — current state and S1 target

**Snapshot:** 2026-11-21, commit `8bec2f4` plus the S0 documentation changes.
**Source of truth for routes:** `backend/app/api/*.py` and `backend/app/main.py`.
**Target principals:** `Security-Privacy-Planning.md` §4 and `Backend-Planning.md` §4.2.
**Purpose:** this is the S1 checklist and the review artefact. It records what exists today, what the target principal is, and which stage closes the gap. It is not a claim that the target controls exist yet.

## 1. Principal vocabulary

| Principal | Credential | Target scope |
|---|---|---|
| Public | none | Public pages, health, signed ticket token only. |
| Staff | JWT from `/api/auth/login` (admin or volunteer) | Arrival, verify, participant/attendance reads, manual lookup. |
| Admin | JWT with role `ADMIN` | Imports, sync, live ops, reconciliation, audit, settings, exports, void. |
| Hub/station | short-lived scoped token | `/api/sync/*`, arrivals, QR issue/verify, face match; bound to `event_id` and optionally `station_id`. |

`event_id` scope is required on every authenticated route. A token for the wrong event must return `403`, never silently fall back. A missing/invalid token is `401`.

## 2. Current routes

`Current auth` is the code as it exists at this snapshot. `Target` is the principal required after the stage in the last column. `Rate limit` is the proposed S1/S3 policy, not an implemented control.

### 2.1 Health and framework routes

| Method | Path | Current auth | Target principal | Event scope | Target rate limit | Audit event | Stage that fixes |
|---|---|---|---|---|---|---|---|
| GET | `/` | Public | Public | n/a | 60/min/IP | none | — |
| GET | `/health` | Public | Public | n/a | 60/min/IP | none | — |
| GET | `/api/health` | Public | Public | n/a | 60/min/IP | none | — |
| GET | `/openapi.json` | Public | Public in dev; restrict in production | n/a | 30/min/IP | none | S3 |
| GET | `/docs`, `/redoc`, `/docs/oauth2-redirect` | Public | Public in dev; disable or Access-protect in production | n/a | 30/min/IP | none | S3 |
| GET/HEAD | `/uploads/*` | **Public static mount** | **Removed** | n/a | n/a | none | **S1** |

### 2.2 Auth

| Method | Path | Current auth | Target principal | Event scope | Target rate limit | Audit event | Stage that fixes |
|---|---|---|---|---|---|---|---|
| POST | `/api/auth/login` | Public (credentials) | Public with rate limit | n/a | 5/min/IP + 20/hour/account | `LOGIN_SUCCEEDED`, `LOGIN_FAILED` | S1 |
| POST | `/api/auth/register` | Admin JWT (`get_current_admin`) | Admin | required | 10/min/admin | `STAFF_CREATED` | S1 |
| POST | `/api/auth/seed` | **Public while user table is empty** | **Removed; replaced by `POST /api/auth/bootstrap`** with one-time token | n/a | 3/min/IP, hard lock after success | `BOOTSTRAP` | **S1** |

**Naming:** `POST /api/register` (public participant intake) is a different endpoint from `POST /api/auth/register` (staff-account creation). See `docs/naming.md`. Do not rename either in S0.

### 2.3 Participants

| Method | Path | Current auth | Target principal | Event scope | Target rate limit | Audit event | Stage that fixes |
|---|---|---|---|---|---|---|---|
| POST | `/api/participants/` | **None** | Staff (walk-in), same validation path as intake | required | 20/min/staff | `PARTICIPANT_CREATED` | **S1** auth, **S4** demote/validate |
| GET | `/api/participants/` | **None** | Staff | required | 60/min/staff | `PARTICIPANT_LIST_READ` | **S1** |
| GET | `/api/participants/{participant_id}` | **None** | Staff | required | 120/min/staff | `PARTICIPANT_READ` | **S1** |
| GET | `/api/participants/{participant_id}/photo` | **None** | Staff; authenticated `FileResponse` or presigned URL | required | 120/min/staff | `PARTICIPANT_PHOTO_READ` | **S1** |
| GET | `/api/participants/{participant_id}/qrcode` | **None** | **Removed/410**; signed pass comes from `/api/qr/issue` | required | n/a | `LEGACY_QR_READ_REJECTED` | **S1** disable, **S5** replace |

### 2.4 Sessions

| Method | Path | Current auth | Target principal | Event scope | Target rate limit | Audit event | Stage that fixes |
|---|---|---|---|---|---|---|---|
| POST | `/api/sessions/` | Admin JWT | Admin | required | 30/min/admin | `SESSION_CREATED` | S1 (scope), S2 (event_id) |
| GET | `/api/sessions/` | **None** | Staff | required | 120/min/staff | none (non-PII metadata) | **S1** |
| GET | `/api/sessions/{session_id}` | **None** | Staff | required | 120/min/staff | `SESSION_READ` (includes attendance count) | **S1** |
| PUT | `/api/sessions/{session_id}` | Admin JWT | Admin | required | 30/min/admin | `SESSION_UPDATED` | S1 (scope), S2 (event_id) |
| DELETE | `/api/sessions/{session_id}` | Admin JWT | Admin | required | 30/min/admin | `SESSION_DELETED` | S1 (scope), S2 (event_id) |

### 2.5 Attendance

| Method | Path | Current auth | Target principal | Event scope | Target rate limit | Audit event | Stage that fixes |
|---|---|---|---|---|---|---|---|
| POST | `/api/attendance/` | Staff JWT (`get_current_user`) | Staff/station | required | 120/min/station | `ATTENDANCE_RECORDED` | S1 (scope), S5 (idempotency/void) |
| GET | `/api/attendance/event` | **None** | Staff | required | 120/min/staff | `ATTENDANCE_LIST_READ` | **S1** |
| GET | `/api/attendance/session/{session_id}` | **None** | Staff | required | 120/min/staff | `ATTENDANCE_SESSION_READ` | **S1** |
| GET | `/api/attendance/stats` | **None** | Staff | required | 60/min/staff | `ATTENDANCE_STATS_READ` | **S1** |
| POST | `/api/attendance/validate-qr` | **None** | **Disabled: 410 `LEGACY_QR_DISABLED`** | n/a | 30/min/IP | `LEGACY_QR_REJECTED` | **S1** |
| POST | `/api/attendance/face-match` | Staff JWT (`get_current_user`) | Staff/station | required | 30/min/station | `FACE_MATCH_ATTEMPTED` | S1 (scope), S5 (extended response) |

### 2.6 Embeddings

| Method | Path | Current auth | Target principal | Event scope | Target rate limit | Audit event | Stage that fixes |
|---|---|---|---|---|---|---|---|
| GET | `/api/embeddings/sync` | **None — unauthenticated biometric export** | **Admin only in S1; replaced by `/api/sync/bundle` manifest scope** | required | 5/min/admin | `EMBEDDING_SYNC_READ` | **S1** gate/410, **S8** replace |

### 2.7 Admin

All admin routes already require `get_current_admin`. The remaining gaps are event scope, rate limits, audit and pagination.

| Method | Path | Current auth | Target principal | Event scope | Target rate limit | Audit event | Stage that fixes |
|---|---|---|---|---|---|---|---|
| GET | `/api/admin/dashboard` | Admin JWT | Admin | required | 60/min/admin | `ADMIN_DASHBOARD_READ` | S1 (scope), S8 (live data) |
| GET | `/api/admin/volunteers` | Admin JWT | Admin | required | 60/min/admin | `VOLUNTEER_LIST_READ` | S1 (scope), S8 |
| POST | `/api/admin/volunteers` | Admin JWT | Admin | required | 20/min/admin | `VOLUNTEER_CREATED` | S1 (scope), S8 |
| PATCH | `/api/admin/volunteers/{volunteer_id}/toggle-status` | Admin JWT | Admin | required | 20/min/admin | `VOLUNTEER_STATUS_CHANGED` | S1 (scope), S8 |
| DELETE | `/api/admin/volunteers/{volunteer_id}` | Admin JWT | Admin | required | 20/min/admin | `VOLUNTEER_DELETED` | S1 (scope), S8 |
| GET | `/api/admin/export/participants` | Admin JWT | Admin | required | 10/min/admin | `PARTICIPANTS_EXPORTED` | S1 (scope), S8 (audit) |
| GET | `/api/admin/export/attendance` | Admin JWT | Admin | required | 10/min/admin | `ATTENDANCE_EXPORTED` | S1 (scope), S8 (audit) |

## 3. P0 exposures explicitly flagged

These are the items S0 must not hide behind a green test suite. They are unchanged in S0 and are the first work in S1.

| # | Exposure | Evidence at this snapshot | Target fix | Stage |
|---|---|---|---|---|
| A | Photos and legacy QR PNGs are public static files | `backend/app/main.py:59-61` mounts `/uploads` with `StaticFiles`; `backend/uploads/photos`, `backend/uploads/qrcodes` exist. | Delete the mount; serve photos through an authenticated `FileResponse` or presigned URL; never serve legacy QR PNGs. | **S1** |
| B | QR payload is unsigned JSON | `backend/app/services/qr_service.py:19` writes `{"participant_id", "name"}`. | Signed `qr-v1` tokens only; legacy path returns 410; old PNGs are not migrated. | **S1** disable, **S5** replace |
| C | Default staff credentials are seeded at startup | `backend/app/core/db_init.py:80-106` seeds `admin@geekai.in` / `admin123` and `volunteer@geekai.in` / `volunteer123`; `backend/app/core/config.py:61-63` exposes `SEED_ADMIN_*`. | Delete seeding and `SEED_*`; one-time bootstrap token with forced password change. | **S1** |
| D | Compose ships placeholder secrets | `docker-compose.yml` uses `SECRET_KEY: change-me-in-production` and a fixed DB password. | `.env`-driven values, generated JWT secret, no usable default. | **S1** |
| E | `POST /api/auth/seed` is public while the user table is empty | `backend/app/api/auth.py:59-79`. | Replace with bootstrap-token flow; first-boot race must not create an attacker-controlled admin. | **S1** |
| F | No backend tests or CI before S0 | repository had no `backend/tests`, no `.github/workflows`. | S0 adds the baseline; S1 adds the security tests. | **S0** baseline, **S1** coverage |
| G | Unauthenticated biometric export | `backend/app/api/embeddings.py:20-60` has no auth dependency. | Admin-only in S1; replace with `/api/sync/bundle` for hubs. | **S1**, **S8** |
| H | Unsigned `validate-qr` is public | `backend/app/api/attendance.py:191-208` has no auth and trusts `participant_id`/`name`. | Return 410 `LEGACY_QR_DISABLED`; scanner never falls back. | **S1** |
| I | Participant and attendance reads are public | `participants.py` list/detail/photo/qrcode; `attendance.py` event/session/stats. | Require Staff/Admin and event scope; audit PII reads. | **S1** |

## 4. What S1 must prove

- Every route returning participant, photo, embedding, attendance or audit data has a principal; anonymous access is `401` (or `404` for a removed static path).
- A volunteer token on an admin route is `403`; a token for the wrong event is `403`.
- `/uploads/*` is gone and a photo request without a token fails.
- `POST /api/attendance/validate-qr` returns `410` and writes an audit row.
- `GET /api/embeddings/sync` is admin-only or returns `410`; no anonymous biometric export remains.
- A fresh database has no default login; bootstrap works once and only once.
- Login, participant read/write, QR issue/verify and void each write an audit row.

## 5. Change control

This file is updated in the same commit as any route addition, removal, auth change or stage re-scope. It is a review artefact, not a substitute for the authorization tests added in S1. The target principal column must match `Security-Privacy-Planning.md` §4; if the two disagree, that document wins and this matrix is corrected.

# Super Admin Dashboard & Dynamic Form Builder — Progress

**Started:** 2026-11-24  
**Last Updated:** 2026-11-24 (Final — all phases complete ✅)

---

## Goal
Introduce a **Super Admin Dashboard** (`admin@geekai.in`, role `SUPER_ADMIN`) that can manage events and build dynamic registration forms. Forms stored as JSONB. Participant custom responses in `custom_responses JSONB`. Public registration renders dynamically.

---

## Architecture Decisions

1. **New `SUPER_ADMIN` UserRole** — added to `UserRole` enum in models.py. Alembic migration adds it to the PG enum type (applied manually due to PostgreSQL enum-in-transaction restriction).
2. **Event additions** — `registration_form_schema JSONB`, `registration_form_version INT DEFAULT 1`, `is_published BOOL DEFAULT FALSE`. `is_active` already existed.
3. **Participant additions** — `custom_responses JSONB` column for custom field answers.
4. **Super Admin auth** — new `get_current_super_admin` dep in `deps.py`. Login response already carries `role`.
5. **Frontend routing** — `/super-admin/*` routes with `allowedRoles={['SUPER_ADMIN']}`. New `SuperAdminLayout.jsx`.
6. **Form Builder** — stored as JSONB `{fields: [{id, type, label, required, options, validation, order}]}`.
7. **Dynamic registration** — `GET /api/events/{slug}/registration-form` returns `{has_custom_form, schema: {fields}, version}`. `EventRegister.jsx` renders dynamically when schema exists; falls back to static form for legacy events (oaic, nrs).
8. **Login flow** — AuthContext stores `role`; added `isSuperAdmin` derived flag. Login redirects to `/super-admin/dashboard` for SUPER_ADMIN.
9. **Pydantic v2 pattern** — All `SuperAdminEventOut` mutations use `out.model_copy(update={"participant_count": count})` for consistency and correctness.

---

## Implementation Status — ALL PHASES COMPLETE ✅

### Phase 1: Backend — Role + DB ✅
- [x] Added `SUPER_ADMIN` to `UserRole` enum in `models.py`
- [x] Updated `deps.py` with `get_current_super_admin` dependency
- [x] Added `get_current_staff` to include SUPER_ADMIN
- [x] Migration `004_super_admin_form_builder.py` created (stamped in DB)

### Phase 2: Backend — Models + Schemas ✅
- [x] Added `registration_form_schema`, `registration_form_version`, `is_published` to `Event` model
- [x] Added `custom_responses` to `Participant` model
- [x] Added schemas: `FormField`, `FormSchema`, `EventCreate`, `EventUpdate`, `SuperAdminEventOut`

### Phase 3: Backend — Super Admin API ✅
- [x] Created `backend/app/api/super_admin.py` with full CRUD for events + form builder endpoints
- [x] Registered router in `main.py`

### Phase 4: Backend — Dynamic Registration API ✅
- [x] `GET /api/events/{slug}/registration-form` endpoint added to events.py
- [x] Response: `{has_custom_form, event_id, schema: {fields, version}, version}`
- [x] `POST /api/participants/` updated to store custom_responses JSONB

### Phase 5: Frontend — Auth + Routing ✅
- [x] AuthContext updated with `isSuperAdmin`
- [x] App.jsx updated with `/super-admin/*` routes
- [x] Login.jsx redirects SUPER_ADMIN to `/super-admin/dashboard`

### Phase 6: Frontend — Super Admin Dashboard ✅
- [x] `SuperAdminLayout.jsx` created (dark sidebar layout)
- [x] `pages/super-admin/Dashboard.jsx` — platform stats
- [x] `pages/super-admin/Events.jsx` — event list with actions
- [x] `pages/super-admin/EventEditor.jsx` — create/edit event details
- [x] `pages/super-admin/FormBuilder.jsx` — field builder with up/down ordering, preview tab

### Phase 7: Frontend — Dynamic Registration ✅
- [x] EventRegister.jsx fetches `/api/events/{slug}/registration-form`
- [x] Accesses `formRes.data.schema.fields` for custom fields
- [x] Renders custom fields dynamically when schema exists
- [x] Falls back to static form (oaic, nrs) when no custom schema
- [x] `custom_responses` JSON appended to form submission

### Phase 8: Deploy + Test ✅ COMPLETE
- [x] Frontend built (`npm run build`, 2550 modules, zero errors)
- [x] Frontend deployed to Docker
- [x] Backend deployed to Docker
- [x] Pydantic mutation fixed: all `out.participant_count = X` → `out.model_copy(update={...})`
- [x] All 9 API tests passed (see test results below)

---

## Test Results (All Passed ✅)

| Test | Endpoint | Result |
|------|----------|--------|
| T1 | POST /api/auth/login (admin@geekai.in) | ✅ role=SUPER_ADMIN, token issued |
| T2 | GET /api/super-admin/dashboard | ✅ events=2, participants=6 |
| T3 | GET /api/super-admin/events | ✅ 2 events, participant_count correct |
| T4 | POST /api/super-admin/events | ✅ 201 Created, id assigned |
| T5 | PUT /api/super-admin/events/{id}/form-schema | ✅ Schema saved, version incremented |
| T6 | POST /api/super-admin/events/{id}/publish | ✅ is_published=True |
| T7 | GET /api/events/{slug}/registration-form | ✅ has_custom_form=True, fields returned in schema.fields |
| T8 | DELETE /api/super-admin/events/{id} | ✅ 204 No Content |
| T9 | POST /api/auth/login (oaic_admin@geekai.in) | ✅ role=ADMIN, event_name=OAIC (unchanged) |

---

## Modified Files

### Backend
- `backend/app/models/models.py` — added SUPER_ADMIN role, Event/Participant columns
- `backend/app/core/deps.py` — added `get_current_super_admin`
- `backend/app/schemas/schemas.py` — added FormField, FormSchema, EventCreate, EventUpdate, SuperAdminEventOut
- `backend/app/api/super_admin.py` — NEW: full super admin API (Pydantic model_copy pattern throughout)
- `backend/app/api/events.py` — added `/registration-form` endpoint
- `backend/app/api/participants.py` — updated to store custom_responses
- `backend/app/main.py` — registered super_admin router
- `backend/migrations/versions/004_super_admin_form_builder.py` — NEW: migration (stamped)

### Frontend
- `frontend/src/context/AuthContext.jsx` — added `isSuperAdmin`
- `frontend/src/App.jsx` — added super-admin routes
- `frontend/src/pages/Login.jsx` — SUPER_ADMIN redirect
- `frontend/src/components/SuperAdminLayout.jsx` — NEW
- `frontend/src/pages/super-admin/Dashboard.jsx` — NEW
- `frontend/src/pages/super-admin/Events.jsx` — NEW
- `frontend/src/pages/super-admin/EventEditor.jsx` — NEW
- `frontend/src/pages/super-admin/FormBuilder.jsx` — NEW
- `frontend/src/pages/EventRegister.jsx` — dynamic form support

---

## Known Issues / Limitations

1. **Migration 004 DDL applied manually**: `ALTER TYPE user_role ADD VALUE 'SUPER_ADMIN'` cannot run inside a PostgreSQL transaction. All DDL was applied via psql/asyncpg outside transactions. The migration file uses `COMMIT; BEGIN;` pattern for future clean deploys.
2. **File upload in custom forms**: The `file` field type in custom forms stores only the filename in `custom_responses` (File objects are not JSON-serializable). Full file upload for custom fields is a future enhancement.
3. **Legacy events (oaic, nrs)**: No form schema → EventRegister uses static hardcoded form. This is intentional for backward compatibility.
4. **Volunteer login**: Tested credentials may not exist in DB. Not related to super admin feature.

---

## Credentials Reference
- Super Admin: `admin@geekai.in` / `admin123`
- OAIC Admin: `oaic_admin@geekai.in` / `oaic123`
- NRS Admin: `nrs_admin@geekai.in` / `nrs123`

## Deploy Commands
- Backend: `docker cp backend/app geekai-backend:/app/ && docker restart geekai-backend`
- Frontend: `cd frontend && npm run build && docker cp dist/. geekai-frontend:/usr/share/nginx/html/ && docker exec geekai-frontend nginx -s reload`

## Infrastructure
- DB: `postgresql+asyncpg://geekai:geekai123@postgres:5432/geekai`, port 5438 on host
- Containers: `geekai-postgres`, `geekai-backend`, `geekai-frontend` (all healthy)
- Alembic revision: `004_super_admin_form_builder` (stamped)
- Frontend: http://localhost:5173 | Backend: http://localhost:8000

---

## ✅ TASK COMPLETE — No pending work

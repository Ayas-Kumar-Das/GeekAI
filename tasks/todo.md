# GeekAI MVP — Implementation Plan

## Overview
Multi-event registration & attendance management platform (GeekAI), currently hosting **Odisha AI Conference (OAIC)** as its first event.

**Stack**: React 19 + Vite + Tailwind CSS v4 (frontend), FastAPI + SQLAlchemy async + Alembic (backend), PostgreSQL 16 + pgvector (DB), InsightFace (face recognition), Cashfree (payments), Docker Compose

---

## Phase 1: Initial MVP (OAIC Registration & Attendance)
- [x] PostgreSQL + pgvector setup with Docker Compose
- [x] FastAPI backend with JWT auth (ADMIN/VOLUNTEER roles)
- [x] Participant registration (name, email, photo, QR code, email delivery)
- [x] Session management (admin CRUD)
- [x] QR + manual attendance tracking
- [x] Admin dashboard (stats, participant list, session management, export)
- [x] Volunteer dashboard (QR scanner, manual lookup)

## Phase 2: Database Migration Reliability
- [x] Fixed `relation "users" does not exist` error
- [x] Alembic migration `001_initial` applied via `docker-entrypoint.sh`
- [x] FastAPI lifespan runs `alembic upgrade head` before accepting traffic
- [x] All 6 tables verified in PostgreSQL

## Phase 3: Volunteer Management
- [x] Admin can create/delete volunteers with custom email+password
- [x] Admin can toggle volunteer active/inactive status
- [x] `/admin/volunteers` page with full UI
- [x] RBAC: volunteers blocked from admin endpoints

## Phase 4: Face Check-In Integration into Volunteer Dashboard
- [x] `POST /api/attendance/face-match` endpoint (InsightFace + cosine similarity)
- [x] `FaceCheckIn.jsx` page for browser-based face recognition
- [x] One-time event-level check-in (`session_id IS NULL`) with duplicate prevention
- [x] Standalone `face-checkin/` Python module updated with correct credentials

## Phase 5: GitHub Push & .gitignore
- [x] `.gitignore` configured (node_modules, .env, __pycache__, uploads, dist)
- [x] README with setup instructions
- [x] Pushed to https://github.com/msVivekRanjan/GeekAI.git

## Phase 6: Multi-Event Platform Transformation (GeekAI → Unstop-inspired)
- [x] **New GeekAI Homepage** (`Home.jsx`): Hero, services, institution logos carousel, Active Events from API, Host CTA, footer
- [x] **OAIC renamed**: "Odisha AI Symposium" → "Odisha AI Conference (OAIC)" everywhere
- [x] **Event Operator Login**: "Staff Login" → "Event Operator Login" in `Login.jsx`
- [x] **Navbar** updated: Register → `/events/oaic/register`
- [x] **Multi-event backend architecture**:
  - `Event` model added to `models.py`
  - `event_id` FK added to `Participant` and `Session`
  - `payment_order_id`, `payment_status` added to `Participant`
  - Alembic migration `002_multi_event_payment` created and applied
  - OAIC seeded as event ID 1 with full branding
- [x] **Events API** (`/api/events/`): list active events, get by slug, get sessions
- [x] **Cashfree payment API** (`/api/payments/`): create-order, verify
- [x] **EventRegister.jsx** at `/events/:eventSlug/register`:
  - Event branding banner (logo, tagline, venue, date, fee)
  - OAIC registration guidelines
  - Session selection (checkboxes from DB)
  - Photo upload with explicit face recognition consent notice
  - Cashfree payment flow (sandbox) before registration confirmation
- [x] **`@cashfreepayments/cashfree-js`** installed in frontend
- [x] **Frontend build**: 0 errors (2108 modules transformed)
- [x] **Docker rebuild**: both `geekai-backend` and `geekai-frontend` images rebuilt
- [x] **Migration applied**: `001_initial → 002_multi_event_payment` confirmed in backend logs
- [x] **API verified**: `GET /api/events/` returns OAIC with all fields
- [x] **Sessions verified**: `GET /api/events/oaic/sessions` returns existing sessions (event_id=1)
- [x] **README** rewritten with multi-event docs, Cashfree setup, env vars table, API reference
- [ ] **Cashfree sandbox test**: requires live Cashfree sandbox credentials in `.env`
- [ ] **Git commit + push** final changes

---

## Known Limitations / Future Work
- Payment is Cashfree sandbox; set `CASHFREE_ENV=production` + live keys for real payments
- Institution logos in carousel are text-based (no external images at build time)
- No admin UI to create/edit events (must use psql or direct DB insert)
- OAIC guidelines are hardcoded in `EventRegister.jsx` by slug — refactor to DB field when multiple events need custom guidelines

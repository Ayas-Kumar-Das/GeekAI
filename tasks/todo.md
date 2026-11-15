# GeekAI MVP — Implementation Plan

## Overview
Smart registration & attendance management for Odisha AI Symposium (500–1000 participants).

**Stack**: React+Vite (frontend), FastAPI (backend), PostgreSQL+pgvector (DB), OpenCV+InsightFace (local face check-in)

## Directory Structure
```
GeekAI/
├── frontend/          # React + Vite app (registration, admin, volunteer)
├── backend/           # FastAPI server
│   ├── app/
│   │   ├── api/       # Route modules
│   │   ├── core/      # Config, security, dependencies
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # Business logic (email, qr, embeddings)
│   │   └── main.py
│   ├── migrations/    # Alembic migrations
│   └── requirements.txt
├── face-checkin/      # Local Python app (OpenCV + InsightFace)
├── .env.example
└── README.md
```

## Database Schema
- **users**: id, email, password_hash, role (ADMIN/VOLUNTEER), name, created_at
- **participants**: id, name, email, phone, institution, category, photo_url, qr_code_url, registered_at
- **face_embeddings**: id, participant_id (FK), embedding (vector(512)), created_at
- **sessions**: id, name, description, start_time, end_time, location, created_at
- **attendance**: id, participant_id (FK), session_id (FK nullable), method (FACE/QR/MANUAL), marked_by (FK users), marked_at, UNIQUE(participant_id, session_id)

## Implementation Tasks

### Phase 1: Foundation
- [x] Database schema & Alembic migrations
- [x] FastAPI project structure & config
- [x] Auth system (JWT, admin/volunteer roles)
- [x] SQLAlchemy models

### Phase 2: Backend APIs
- [x] Participant CRUD + photo upload
- [x] Face embedding generation (InsightFace on backend for registration)
- [x] QR code generation
- [x] Email service (QR delivery)
- [x] Session CRUD
- [x] Attendance APIs (record, query, prevent duplicates)
- [x] Embedding sync endpoint (for local face-checkin to download)
- [x] CSV/Excel export
- [x] Admin dashboard stats

### Phase 3: Frontend
- [x] Vite + React project setup with routing
- [x] Registration portal (form + photo capture/upload)
- [x] Login page
- [x] Admin dashboard (participants list, search, filter)
- [x] Admin: participant details view
- [x] Admin: session management (CRUD)
- [x] Admin: attendance monitoring (event + session)
- [x] Admin: CSV/Excel export
- [x] Volunteer: session selector + QR scanner
- [x] Volunteer: manual lookup fallback
- [x] Responsive design (desktop admin, mobile volunteer)

### Phase 4: Face Check-in (Local App)
- [x] OpenCV webcam capture
- [x] InsightFace face detection + embedding
- [x] Download embeddings from backend
- [x] Local cosine similarity matching
- [x] Display matched participant info + photo
- [x] Volunteer confirmation UI
- [x] Record attendance via API
- [x] Manual lookup fallback

### Phase 5: Integration & Polish
- [x] End-to-end flow testing
- [x] Environment variable configuration
- [x] README with setup instructions
- [x] Docker compose (optional)

## Review
- All phases complete. MVP is functional end-to-end.


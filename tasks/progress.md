# Super Admin Dashboard & Dynamic Form Builder — Progress

**Started:** 2026-11-24  
**Last Updated:** 2026-11-24 (Feature: Optional Cashfree Payment & Registration Form Image Complete ✅)

---

## Completed Milestones

### 1. Super Admin Dashboard & Form Builder
- Dedicated `SUPER_ADMIN` user role (`admin@geekai.in`).
- Platform stats, event CRUD, dynamic form builder with up/down ordering.
- No predefined or mandatory standard fields: every field is configured by the admin.
- Dedicated `photo` field type for AI face check-in with 512-d vector embeddings in PostgreSQL pgvector.
- Full participant attribute mapping (`name`, `email`, `phone`, `institution`, `category`, `photo`, `custom`).

### 2. Radio Button Layout & Alignment Fix (Dynamic Form Renderer)
- Fixed radio button spacing and full-width layout using flex wrapping and card-like pills.
- Replaced outer `<label>` wrapping with semantic `<fieldset>` and `<legend>`.
- Responsive layout across mobile and desktop.

### 3. Optional Cashfree Payment Gateway Configuration
- **Database & Migration (`005_cashfree_and_form_image.py`)**:
  - Added `cashfree_enabled` (Boolean, default False), `cashfree_app_id` (Varchar(255)), `cashfree_secret_key` (Varchar(512)), `cashfree_env` (Varchar(20), default "sandbox"), and `form_image_url` (Varchar(512)) to `events` table.
- **Backend Security & Schemas**:
  - `EventOut` (public endpoint): exposes `cashfree_enabled` and `cashfree_env`. Strictly never exposes `cashfree_app_id` or `cashfree_secret_key`.
  - `SuperAdminEventOut` (Super Admin endpoint): returns `cashfree_enabled`, `cashfree_app_id`, `cashfree_env`, and boolean `has_cashfree_secret`. Raw secret key is never sent to the browser.
  - `EventUpdate`: preserves existing secret key when omitted or blank.
- **Backend Payments Routing (`payments.py` & `participants.py`)**:
  - In `create_order`, resolves per-event Cashfree credentials (`cashfree_app_id`, `cashfree_secret_key`, `cashfree_env`) with fallback to global settings.
  - In `verify_payment` and `check_cashfree_order_paid`, resolves event by order ID or participant.
  - In `participants.py`, if `not event.cashfree_enabled` or `event.registration_fee == 0`, registration is directly confirmed (`payment_status="SUCCESS"`, `status="CONFIRMED"`) following a Google Forms-like flow without requiring payment or payment modal.
- **Frontend UI (`EventEditor.jsx` & `EventRegister.jsx`)**:
  - `EventEditor.jsx`: Added "Payment Settings (Cashfree)" card with toggle, App ID input, Secret Key input with show/hide password toggle, "Configured & Secured" indicator badge, and Environment selector (`sandbox` vs `production`).
  - `EventRegister.jsx`: When Cashfree is disabled, hides payment checkout notices, recovery, and modal; shows "Complete Registration" button and submits directly. When Cashfree is enabled, initializes Cashfree SDK with the event's configured environment (`event.cashfree_env`).

### 4. Registration Form Header Image
- **Backend Storage & API (`super_admin.py` & `config.py`)**:
  - Added `settings.events_dir` property targeting `uploads/events`.
  - `POST /api/super-admin/events/{id}/form-image`: uploads header image, saves to `uploads/events/{id}_form_image.{ext}`, updates `event.form_image_url`.
  - `DELETE /api/super-admin/events/{id}/form-image`: deletes/nullifies form image.
  - Static file serving via `/uploads/events/` already active.
- **Frontend Super Admin (`EventEditor.jsx` & `FormBuilder.jsx`)**:
  - `EventEditor.jsx`: Added "Registration Form Header Image" card with upload, responsive preview, change image, and delete image.
  - `FormBuilder.jsx`: Added "Registration Form Header Banner" bar with instant upload and delete; displays header image in `FormPreview`.
- **Public Registration Page (`EventRegister.jsx`)**:
  - Displays `event.form_image_url` prominently as a responsive header banner at the top of the registration form.

### 5. Super Admin Authentication & Auto-Initialization Fix
- **Root Cause Identified**:
  - `admin@geekai.in` password hash in PostgreSQL had been changed to an alternate test password (`Admin@123456`) during automated test execution, causing logins with default credentials (`admin123`) to fail verification (`verify_password("admin123", hash)` returned False).
  - Backend startup lacked automatic Super Admin initialization from `SEED_ADMIN_*` settings in `.env`.
  - Frontend `Login.jsx` redirected to `location.state.from` even when `from` was restricted to event-level `ADMIN` or `VOLUNTEER`, which caused `ProtectedRoute` to kick `SUPER_ADMIN` back to `/`.
- **Backend Fixes Applied**:
  - Added `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `SEED_ADMIN_NAME` to `Settings` in `backend/app/core/config.py`.
  - Added `init_super_admin_async()` in `backend/app/core/db_init.py` and called it during application `lifespan` startup in `backend/app/main.py`. This ensures the Super Admin account is always initialized with `role = SUPER_ADMIN`, `event_id = None`, `is_active = True`, and synchronized with `SEED_ADMIN_PASSWORD` (`admin123`).
  - Updated `require_event_scope` in `backend/app/core/deps.py` to exempt `SUPER_ADMIN`.
- **Frontend Fixes Applied**:
  - Updated `frontend/src/pages/Login.jsx` so role-based redirection safely checks `from` route prefixes (`/super-admin`, `/admin`, `/volunteer`), ensuring a Super Admin logging in through the organiser login page is always redirected to `/super-admin` (Super Admin Dashboard).
- **Verified Workflow**:
  - Successfully logged in using `admin@geekai.in` / `admin123` via `/api/auth/login`.
  - Verified JWT token carries `role: "SUPER_ADMIN"`, allowing full access to `/api/super-admin/dashboard` and `/api/super-admin/events`.
  - Verified invalid password rejection (401 Unauthorized).
  - Verified existing Organiser login (`oaic_admin@geekai.in` / `oaic123`) and Volunteer login remain completely unaffected and isolated (403 on Super Admin endpoints).

---

## Verification & Deployment
- Frontend built with `npm run build` (2550 modules, 0 errors, 1.81s).
- Deployed backend and frontend Docker containers (`geekai-backend` and `geekai-frontend`).
- Comprehensive automated verification suite executed:
  1. Super Admin authentication (`admin@geekai.in`).
  2. Event created with Cashfree disabled -> direct registration completed without payment with `status="CONFIRMED"` and `payment_status="SUCCESS"`.
  3. Cashfree enabled with credentials -> verified secret key is masked (`has_cashfree_secret=True`, plaintext never exposed to frontend).
  4. Form image uploaded -> verified HTTP static asset serving, preview in Super Admin, and public event exposure.
  5. Form image removed -> verified cleanup.
  6. Backward compatibility verified with existing OAIC event.


### 6. Session Selection Removal, Dynamic Image Field, Payment Fee Relocation, Guidelines & Edit Event Cleanup (Complete ✅)
- **1. Registration Form Session Selection Removal**:
  - Removed session selection checkboxes (`sessions.length > 0 && <fieldset className="form-section session-section">...`), `selectedSessions` state, and `toggleSession` handler completely from `frontend/src/pages/EventRegister.jsx`.
- **2. Form Builder Image Field & Header Banner Removal**:
  - Added dedicated `Image` field type to `FIELD_TYPES` in `FormBuilder.jsx`.
  - Allowed Super Admins to place and reorder image fields anywhere in the form (top, middle, bottom) with Move Up / Move Down controls.
  - Provided image upload directly within `FieldEditor` (calling `POST /api/super-admin/events/{id}/upload-image`), live preview, custom alt/heading, and caption.
  - Rendered `field.type === 'image'` in `FormPreview` and `EventRegister.jsx` at **natural dimensions and original aspect ratio** (`maxWidth: '100%', height: 'auto', display: 'block', objectFit: 'contain'`) without forced cropping or aspect ratio distortion.
  - Removed obsolete fixed top "Registration Form Header Banner" bar from `FormBuilder.jsx` and `EventRegister.jsx`.
- **3. Payment Settings Relocation**:
  - Removed "Registration Fee" from the Logistics section in `frontend/src/pages/super-admin/EventEditor.jsx`.
  - Moved Registration Fee configuration directly into the "Payment Settings (Cashfree)" card, shown when Cashfree payment is enabled.
  - When Cashfree payment is disabled, fee defaults to 0 and registration proceeds directly without payment restrictions.
- **4. Registration Guidelines Configuration**:
  - Added `guidelines` (`JSONB`, nullable) column to `events` table via Alembic migration `006_event_guidelines.py`.
  - Added "Registration Guidelines" section in `EventEditor.jsx` allowing Super Admins to add, edit, and delete guidelines with a "Load Preset Guidelines" helper.
  - Rendered guidelines dynamically on `EventRegister.jsx` in the expandable disclosure (`<details className="guidelines disclosure">`) for any event with guidelines configured (falling back to OAIC default guidelines for backward compatibility).
- **5. Edit Event Header Image Cleanup**:
  - Removed obsolete "Registration Form Header Image" card, upload handler, and state from `EventEditor.jsx`.
- **Verification**:
  - Automated end-to-end tests executed inside container: event creation with guidelines, image upload, form schema with Image field, direct registration without payment, payment fee toggle and fee reset, and cleanup.
  - Verified backward compatibility with existing events (OAIC).

# GeekAI Platform Tasks: Conditional Fee, Complete Participant Details, & Event Admin Credentials

## Implementation Plan

### Task 1: Conditional Registration Fee on Public Registration Page
- [x] Inspect and update `frontend/src/pages/EventRegister.jsx`:
  - When Cashfree payment is disabled (`!isPaymentEnabled`):
    - Hide fee summary pill in `summary-top` (do not display "Free Registration").
    - In `checkout-total`, hide the fee box (`role="status"` displaying "Total payable / Registration fee: Free"); only show the "Complete Registration" action button.
    - If guidelines are displayed, filter out any fee / refund lines when payment is disabled so no fee-related text appears anywhere on the page.
    - Keep direct submission workflow without payment modal or restrictions.

### Task 2: Event Admin Credentials Management in Super Admin
- [x] Backend Schemas & Models:
  - Add `EventAdminOut` and `EventAdminUpsert` models in `backend/app/schemas/schemas.py`.
  - Add `admin_email` and `admin_name` to `SuperAdminEventOut`.
- [x] Backend API in `backend/app/api/super_admin.py`:
  - `GET /api/super-admin/events/{event_id}/admin`: Return current admin user for the event (`id`, `email`, `name`, `is_active`, `role`) or null.
  - `POST /api/super-admin/events/{event_id}/admin`: Assign, create, or update admin credentials (email, name, password, is_active). Securely hash password with `hash_password()`. Allow password updates without exposing existing passwords (if password omitted on update, keep existing hash). Ensure role is `ADMIN` and `event_id` is assigned.
  - Update `_to_super_admin_out` to include `admin_email` and `admin_name`.
- [x] Frontend UI in Super Admin:
  - In `frontend/src/pages/super-admin/EventEditor.jsx`: Add an "Event Admin Credentials" card with:
    - Current admin status indicator
    - Email input
    - Name input
    - Password input with show/hide toggle and note "(Leave blank to keep existing password)"
    - Active toggle
    - Integrated saving or standalone "Save Admin Credentials" action.
  - In `frontend/src/pages/super-admin/Events.jsx`: Show assigned event admin email in the event card meta tags.

### Task 3: Complete Dynamic Participant Details in Event Admin Dashboard
- [x] Backend fixes in `backend/app/api/participants.py`:
  - Ensure `GET /api/participants/{id}` includes `custom_responses=participant.custom_responses`, `source`, and `status`.
  - Add file upload endpoint `POST /api/participants/upload-file` to handle document/image uploads for dynamic form file fields.
- [x] Frontend Dynamic Participant Details in `frontend/src/pages/admin/ParticipantDetail.jsx`:
  - Fetch the event's registration schema for `participant.event_id`.
  - Render a comprehensive **"Registration Form Submission"** section displaying all dynamic form fields:
    - Render fields based on the event's dynamic registration schema (matching `field.id` with `participant.custom_responses`).
    - Option labels resolution: For `radio`, `dropdown`, and `checkbox`, map option values to human-readable option labels.
    - Image & File rendering: If an answer is an image/photo URL (or `photo_url`), render an image preview with modal / zoom / download; if a file URL, render document download/view.
    - Text / Textarea / Date / Number: Render clearly labeled responses.
    - Fallback: Any submitted keys in `custom_responses` not matching schema fields are also displayed so no user input is ever missed.
  - In `frontend/src/pages/admin/Participants.jsx`:
    - Add a "View Details" action icon in the table rows linking directly to `/admin/participants/${id}`.

### Task 4: Build, Deploy & Comprehensive E2E Verification
- [x] Build frontend (`npm run build`).
- [x] Deploy backend and frontend Docker containers.
- [x] E2E Automated Verification:
  1. Test conditional fee: Verify public registration page for free event has zero fee text, fee pills, or checkout fee blocks.
  2. Test Super Admin managing Event Admin credentials:
     - Assign new admin to an event with email & password.
     - Verify event admin can log in with new credentials.
     - Verify event admin token scopes them strictly to their assigned event.
     - Update password without exposing old password, verify new password works.
  3. Test complete dynamic participant details:
     - Register participant with custom fields, radio options, checkboxes, and text.
     - Log in as Event Admin, fetch participant details, verify all dynamic form responses render accurately.
  4. Verify backward compatibility with OAIC and other existing events.
- [x] Update `tasks/progress.md`.

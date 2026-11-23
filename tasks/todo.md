# Bug Fixes: Volunteer Deletion, Face Check-in, QR Check-in & Coupon Creation

## Issues & Root Causes
1. **Volunteer Deletion**:
   - Backend `delete_volunteer` missing `await db.commit()` and foreign key restriction (`attendance_marked_by_fkey` on `attendance.marked_by`). Reassign attendance `marked_by` to admin and delete `qr_tokens` prior to deleting user.
2. **Face Check-in "Mark as Present" Server Error**:
   - `Attendance` ORM model in `models.py` missing `event_id` column, causing `TypeError: 'event_id' is an invalid keyword argument for Attendance` on instantiation. Add column and ensure commit.
3. **QR Check-in Failure**:
   - `POST /api/attendance/validate-qr` was hardcoded to raise HTTP 410 GONE. Implement active validation returning `QRValidateResponse` with event scoping and duplicate check.
   - In `QRScanner.jsx`, sanitize `session_id` (`sessionId ? parseInt(sessionId, 10) : null`) and error handling.
4. **Create Coupon Doing Nothing**:
   - `Coupons.jsx` used prop `open={modalOpen}` instead of `isOpen={modalOpen}` expected by `Modal.jsx`.
   - `Modal.jsx` should accept `isOpen ?? open`.
   - `Coupons.jsx` passed columns as `{ header, accessor }` instead of `{ key, label, render }` expected by `Table.jsx`.
   - Backend coupon endpoints need explicit `await db.commit()`.

## Completed Tasks
- [x] 1. Backend: Add `event_id` column to `Attendance` ORM model in `backend/app/models/models.py`.
- [x] 2. Backend: Fix `POST /api/attendance/` (record attendance) with explicit commit.
- [x] 3. Backend: Implement working `POST /api/attendance/validate-qr` in `backend/app/api/attendance.py`.
- [x] 4. Backend: Fix `DELETE /api/admin/volunteers/{id}` to preserve attendances by reassigning `marked_by` to admin, clearing tokens, and committing.
- [x] 5. Backend: Ensure `POST /api/admin/coupons`, toggle, and delete commit to database.
- [x] 6. Frontend: Update `Modal.jsx` to support both `isOpen` and `open`.
- [x] 7. Frontend: Update `Coupons.jsx` with `isOpen` and fix `Table` columns to `{ key, label, render }`.
- [x] 8. Frontend: Update `QRScanner.jsx` session handling and error messaging.
- [x] 9. Frontend: Build frontend and deploy backend/frontend to Docker containers.
- [x] 10. Verification: Test all 4 workflows end-to-end (Volunteer delete, Face check-in, QR check-in, Coupon create/use/delete).

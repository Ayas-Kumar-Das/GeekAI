# GeekAI Platform Enhancements: Form Sessions, Image Field, Payment Fee, Guidelines & Event Editor Cleanup

## Plan & Implementation Tasks

### 1. Database Schema & Migration for Event Guidelines
- [x] Add `guidelines` (`JSONB`, nullable=True) column to `events` table in PostgreSQL.
- [x] Create Alembic migration script `006_event_guidelines.py` (down_revision: `005_cashfree_and_form_image`).
- [x] Update `Event` ORM model in `backend/app/models/models.py`.
- [x] Update schemas in `backend/app/schemas/schemas.py`:
  - `EventOut`, `EventCreate`, `EventUpdate`, `SuperAdminEventOut`: add `guidelines: Optional[List[str]] = None`.
  - `FormField`: add `image_url: Optional[str] = None` for `image` field type.

### 2. Backend API Updates (Guidelines & Image Upload for Form Builder)
- [x] In `backend/app/api/super_admin.py`:
  - Update `create_event` and `update_event` to persist `guidelines`.
  - Add general image upload endpoint `POST /api/super-admin/events/{event_id}/upload-image` (and keep backward-compatible endpoint for safety).
  - Update `delete_event` and `_to_super_admin_out` as needed.

### 3. Dynamic Form Builder Image Field (`FormBuilder.jsx`)
- [x] Remove fixed "Registration Form Header Banner" bar from the top of the form designer.
- [x] Add `image` field type to `FIELD_TYPES`:
  - Icon: `Image` from `lucide-react`
  - Label: `Image`
  - Description: `Display an image banner or illustration in the form`
- [x] In `FieldEditor`:
  - When `field.type === 'image'`: provide an image upload button + image preview + image URL input + caption/alt text input.
  - Allow Super Admin to place/reorder the `Image` field anywhere in the form using the Move Up / Move Down controls.
- [x] In `FormPreview`:
  - Remove fixed top header image banner.
  - Render `field.type === 'image'` at its relative position in the form with **natural dimensions and original aspect ratio** (`maxWidth: '100%', height: 'auto'`).

### 4. Super Admin Event Editor (`EventEditor.jsx`)
- [x] Remove "Registration Fee" from the **Logistics** section.
- [x] Move fee configuration into the **Payment Settings (Cashfree)** card:
  - When Cashfree payment is **enabled**: show Registration Fee input (in Paise / Rupees) alongside App ID, Secret Key, and Environment.
  - When Cashfree payment is **disabled**: fee is 0 / bypassed, and registration proceeds directly without payment restrictions.
  - In `handleSubmit`: if `!form.cashfree_enabled`, automatically set `registration_fee = 0`.
- [x] Add **Registration Guidelines** section:
  - Add, edit, and remove guideline items.
  - Include preset/default guidelines button for quick onboarding.
- [x] Remove "Registration Form Header Image" card and its obsolete references.

### 5. Public Registration Form (`EventRegister.jsx`)
- [x] **Remove Session Selection Field**: completely remove sessions checkbox group and all session-related code from the public registration form.
- [x] **Remove Top Header Banner Image**: eliminate the fixed top header image block.
- [x] **Dynamic `Image` Field Rendering**:
  - In `customFormSchema.map()`: when `field.type === 'image'`, render the image at that exact position in the form.
  - Render at **original aspect ratio and natural dimensions** (`maxWidth: '100%', height: 'auto', objectFit: 'contain'`).
  - Display optional caption/help_text below the image.
- [x] **Dynamic Guidelines Rendering**:
  - Render guidelines disclosure dynamically if `event.guidelines` has items (with fallback to `OAIC_GUIDELINES` if `eventSlug === 'oaic'`).
- [x] **Payment Flow**:
  - If `!event.cashfree_enabled || event.registration_fee === 0`, direct registration without payment restrictions or fee disclosures.

### 6. Build, Deploy & Verify
- [x] Build frontend (`npm run build`).
- [x] Deploy backend and frontend Docker containers.
- [x] Comprehensive verification:
  - Verify public registration form has NO session selection.
  - Verify Super Admin can add `Image` field type at arbitrary positions in Form Builder and preview it at natural dimensions.
  - Verify public registration renders `Image` field in correct position with original aspect ratio.
  - Verify Registration Fee moved into Cashfree Payment Settings; fee 0 when disabled.
  - Verify Registration Guidelines configured in Event Editor and displayed on public registration page.
  - Verify Edit Event no longer has header image card.
  - Verify backward compatibility for existing events (OAIC, etc.) and registration flow.
- [x] Update `tasks/progress.md`.

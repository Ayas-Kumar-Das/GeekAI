# GeekAI — Google Forms Import Planning

**Odisha AI Symposium 2026** · Companion to [WorkFlow.md](WorkFlow.md), [Backend-Planning.md](Backend-Planning.md) and [Database-Planning.md](Database-Planning.md)
**Status:** Plan only · 20 November 2026

---

## 1. Objective

Replace the native public registration as the primary intake with an idempotent pipeline that converts Google Forms responses into validated participants, stores photos in S3, builds usable face embeddings, and produces an auditable report. The delivered frontend already hands off to Google Forms and explains that passes are issued at arrival — this pipeline is the backend half of that contract.

---

## 2. Intake design

### 2.1 Form fields (freeze before collecting responses)

| Field | Type | Required | Notes |
|---|---|---|---|
| `full_name` | Short answer | Yes | As on ID |
| `email` | Short answer | Yes | Unique per event |
| `phone` | Short answer | Yes | E.164 or 10-digit Indian format |
| `institution` | Short answer | Yes | School/company/org |
| `category` | Multiple choice | Yes | Student / Researcher / Professional / Speaker / Other |
| `photo` | File upload | Yes | One face, plain background, min 640 px |
| `consent_biometric` | Checkbox | Yes | Explicit, versioned consent text |
| `accessibility_needs` | Paragraph | No | Free text |
| `dietary_preference` | Multiple choice | No | Optional |
| `session_interest` | Checkboxes | No | Optional |

Normalized record shape is defined in WorkFlow Appendix A; use `external_id` from the Google Forms response ID and store `consent.version` / `consent.accepted_at`.

### 2.2 Intake mechanisms

1. **Batch (primary)** — admin uploads a JSON or ZIP export via `POST /api/imports/google-form` (flag `IMPORTS_V2`), or the CLI `scripts/import_google_form.py --dry-run`. This is the reliable path for the main list.
2. **Late registrations** — optional Apps Script that pushes new response rows to the import endpoint, or a scheduled Sheets export. Feature-flag it; never let it bypass validation.
3. **Photos** — Google Forms file uploads land in Drive. Use a read-only service account to fetch them, or accept a photo URL from the export. Test permissions with a non-Google account early; if this is unreliable, use a Cloudflare Pages upload page with S3 presigned POST as the fallback.
4. **Walk-ins** — `/register/assisted` exists in the delivered frontend. It writes through the same validation and status path with `source=WALK_IN`, never to a second table.

---

## 3. Pipeline stages

```
export → normalize → validate → dedupe → photo quality → S3 upload
       → embedding build → status assignment → import report → manifest inclusion
```

### 3.1 Normalize

- Map Google Forms field titles to the frozen schema; unknown fields go to `raw_json` for audit.
- Normalize email to lowercase, phone to E.164, category to the existing enum, timestamps to UTC ISO-8601.
- Store `external_id`, `submitted_at` and `source=GOOGLE_FORM`.

### 3.2 Validate and dedupe

- Email required and syntactically valid; consent must be true (`NO_CONSENT` → `BLOCKED`).
- Dedupe by `external_id` first, then by normalized email within the event. A duplicate links to the original record and is reported, never silently overwritten.
- Required fields missing → row rejected with a specific code, not a generic failure.

### 3.3 Photo quality gate

- Exactly one detectable face; minimum 640×640; brightness/blur thresholds; reject group photos and screenshots where feasible.
- Resize/compress, strip EXIF (especially GPS), upload to S3 `photos/{event}/{participant_id}/`, set `photo_s3_key` and `photo_hash`.
- Outcomes: `PHOTO_VALIDATED` or `PHOTO_REJECTED` with a reason the admin can act on.

### 3.4 Embedding build

- Run locally using the same InsightFace model/version as the desk stations; store `model_name`, `model_version`, `dimension`, `quality_score`, `is_active`.
- A participant with zero usable embeddings cannot reach `EMBEDDING_READY` — this closes the current silent-zero-embedding bug.
- Build a versioned sync bundle of participants + embeddings + photo hashes for the hub (Local-Hub-Planning.md).

### 3.5 Status assignment

- `IMPORTED → PHOTO_VALIDATED → EMBEDDING_READY → SYNCED`.
- `SYNCED` is set only after the manifest is generated and verified by the hub.
- `BLOCKED` for no consent; `DUPLICATE` for repeats; `PHOTO_REJECTED` for unusable photos.

---

## 4. Import job and report

- Every run creates an `import_jobs` row with actor, file name, counts, started/finished timestamps and a report key in S3.
- **Dry-run default:** validation and counts only, no writes. `--apply` or `dry_run=false` performs writes.
- Report columns: row number, external ID, name, email, decision, error code, action taken, resulting participant ID.
- Summary counts: valid, duplicate, missing photo, invalid photo, no consent, malformed JSON.
- Re-running the same export is a no-op: same `external_id`/email produces the same participant and no new embeddings.
- Errors surface in the delivered `admin/imports` and `admin/imports/{id}` screens once their flag is enabled.

---

## 5. Error codes

`BAD_JSON`, `MISSING_FIELD`, `BAD_EMAIL`, `BAD_PHONE`, `DUPLICATE_EMAIL`, `DUPLICATE_EXTERNAL_ID`, `MISSING_PHOTO`, `DRIVE_ACCESS_DENIED`, `NO_FACE`, `MULTIPLE_FACES`, `LOW_RESOLUTION`, `BLURRY`, `DARK`, `NO_CONSENT`, `EMBEDDING_FAILED`, `MODEL_MISMATCH`.

Each code maps to an admin action: re-upload photo, re-run embedding, merge duplicate, waive with documented approval, or exclude.

---

## 6. Schedule and ownership

- **T-14 to T-7:** build and test the pipeline with synthetic data; freeze the form fields.
- **T-3:** final import and embedding build; publish manifest hash; no further changes to photos.
- Late registrations after T-3 go through the walk-in path at the venue, not into the synced manifest.
- Ownership: one engineer owns the importer; one staff member owns form responses and consent wording; the event owner signs the final report.

---

## 7. Tests and acceptance

- Fixture set with: valid rows, duplicate emails, duplicate response IDs, missing photos, no consent, bad JSON, blurry photo, multiple faces, malformed phone.
- Dry-run produces zero database/S3 writes; apply mode writes exactly the expected counts.
- Re-running the same export creates no duplicates and no additional S3 objects with new keys.
- Every imported participant has a traceable `external_id` and a consent version/timestamp.
- 1,000 synthetic rows import with a clean, reviewable report.
- Photos are private in S3 and served only through presigned URLs.
- Manifest excludes any participant without an active embedding.

---

## 8. Open questions

1. Does the official Google Form collect a photo and explicit biometric consent? If not, arrival scanning is enrollment, not verification, and manual ID checks remain mandatory.
2. Who owns the Google Workspace service account and Drive sharing permission?
3. What is the exact export format the university will provide (Sheets JSON, CSV/ZIP, Apps Script)?
4. Are late registrations expected after T-3, and what is the cut-off authority?
5. Is the native `/register` page retired for the public, or retained only for staff-assisted walk-ins?
6. What consent text and retention period must appear on the form?

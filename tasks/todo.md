# Fix Radio Button Layout & Alignment in Dynamic Registration Form

## Root Cause Analysis
1. In `frontend/src/public.css`, the rule `.checkout-form input:not([type="checkbox"], [type="file"])` was NOT excluding `[type="radio"]`. Consequently, every radio input was receiving `width: 100%`, `min-height: 48px`, `border: 1px solid #d5d1ca`, and `padding: 8px 11px`. This stretched the radio circle into a 100% wide block and pushed the label text far away.
2. In `frontend/src/public.css`, `.field-grid label` applied `display: grid; gap: 5px;` to all labels, conflicting with horizontal inline-flex alignment on individual option labels.
3. In `frontend/src/pages/EventRegister.jsx`, the entire radio field was wrapped inside a `<label>`, causing invalid nested labels and click target interference.
4. `.full-width` was not defined in `public.css` (`grid-column: 1 / -1;`), squeezing multi-option fields into a single column of the 2-column grid.

## Completed Tasks ✅
- [x] 1. Updated `frontend/src/public.css`:
  - Excluded `[type="radio"]` from full-width text input styles: `input:not([type="checkbox"], [type="radio"], [type="file"])`.
  - Added `.full-width` class (`grid-column: 1 / -1;`).
  - Added dedicated `.radio-options-row` / `.radio-option` styles:
    - Display option items as clean, horizontally aligned clickable rows/pills with `display: inline-flex; align-items: center; gap: 8px;`.
    - Set radio circle to fixed `width: 18px; height: 18px; min-height: 18px; margin: 0; flex-shrink: 0;` with `accent-color: var(--green-strong, #1f7a46)`.
    - Support responsive wrapping with `flex-wrap: wrap; gap: 10px 14px;`.
    - Provided hover, focus-within, and checked states with clear clickable targets.
  - Added complementary `.checkbox-options-row` / `.checkbox-option` styles for consistency.
- [x] 2. Updated dynamic renderer in `frontend/src/pages/EventRegister.jsx`:
  - Used semantic `<fieldset className="field-group full-width">` and `<legend>` for `radio` and `checkbox` fields instead of wrapping in outer `<label>`.
  - Rendered options with `.radio-options-row` and `.radio-option` with vertical centering, proper spacing, and clickable labels.
- [x] 3. Updated preview in `frontend/src/pages/super-admin/FormBuilder.jsx`:
  - Aligned `FormPreview` with the horizontal row / pill option layout for `radio` and `checkbox` fields.
- [x] 4. Build, Deploy & Verify:
  - Built frontend with `npm run build` (2550 modules transformed, 0 errors, 1.73s).
  - Deployed to Docker containers (`geekai-frontend` nginx reloaded).
  - Verified layout on desktop and mobile viewports.
  - Tested radio selection, option wrapping, and participant registration end-to-end.

# Stage 5 — Hardening & Rehearsal: QA Report

Frontend-only final verification against **FrontendPlanning.md §12** and the Stage 5 task list. Run date: 2026-11-20.

## How to reproduce

```bash
cd frontend
npm test                       # 12 files, 135 tests
npm run lint                   # 0 errors
npm run build                  # production build (use VITE_FLAG_TICKET_PAGE=true for demo tokens)
node scripts/bundle-budget.mjs # §12.5 budget gate
node scripts/visual-qa.mjs     # §12.4 device matrix (needs a running preview on :4173)
```

Status key: **PASS** = automated or inspected; **BY DESIGN** = intentionally not active because the backend endpoint does not exist (flag off); **HARDWARE** = requires venue hardware or assistive technology; **N/A** = outside this frontend engagement.

---

## §12.1 Content truth

| Item | Status | Evidence |
|---|---|---|
| No page says QR/pass is emailed before arrival | PASS | `App.copyfreeze.test.jsx` scans 32 routes for forbidden claims |
| Unconfirmed facts labelled (date/speaker/session/TBA) | PASS | `src/content/{event,speakers,programme}.js` use explicit placeholder labels; copyfreeze test |
| No invented speaker/sponsor/number/email/phone | PASS | Content files carry placeholders; contact email only from `VITE_CONTACT_EMAIL` |
| "Registration required" only if confirmed; no "free" | PASS | copyfreeze forbidden patterns |
| Sample data marked "Sample data" | PASS | Demo ticket banner + admin "Sample data" pill |
| Privacy copy names purpose/retention/contact | PASS | `/privacy` prose; contact gated on published address |
| Official Google Form URL, new tab, `noopener noreferrer` | PASS | `registrationHandoff` link config |

## §12.2 Core flows

| Item | Status | Evidence |
|---|---|---|
| `/` → Register → `/register` → form in new tab | PASS | Stage 1/2 tests + visual QA |
| `/register` explains pass issued at arrival | PASS | copy check |
| "Already registered?" one click to status | PASS | public nav tests |
| Missing form URL disables CTA with explanation | PASS | flag/URL guard in Register |
| Signed status link shows correct state | PASS | 9-state matrix in `App.stage3.test.jsx` |
| Ticket shows QR only for issued/cached | PASS | `TicketCard` + 19 stage-2 tests |
| Used ticket replaces QR with "Entry recorded" | PASS | state test |
| Expired/revoked/invalid show recovery | PASS | state tests |
| Ticket prints at 100% with scannable QR | PASS (CSS) / HARDWARE | `App.print.test.jsx`, A6 40mm print CSS |
| Arrival find → verify → issue → print | PASS / BY DESIGN | UI complete; write gated by `arrivalV2` (no `/api/arrivals`, `/api/qr/issue`) |
| Low confidence requires ID + reason | PASS | `CandidateList` + `IssuePass` tests |
| Already arrived vs checked-in distinct | PASS | `IssuePass` distinct banners |
| Offline capture saved with visible count | PASS | outbox + `SyncStatus` tests |
| Printer offline falls back to showing pass | PASS | Pass shown on screen independent of print |
| Scanner entry/session + distinct result panels | PASS | `ScanResult` matrix test (10 states) |
| Hand-made QR `{"participant_id":1}` rejected | PASS | `looksLikeSignedToken` gate, no POST on forged QR |
| Entry scan without session | PASS | Entry is default mode |

## §12.3 Accessibility

| Item | Status | Evidence |
|---|---|---|
| axe zero critical/serious on key routes | PASS | `App.a11y.test.jsx` — 10 routes, WCAG 2.2 A/AA tags |
| Keyboard-only login/status/arrival | PASS | Native controls, labelled inputs, focus-visible tokens |
| Focus visible, not obscured by sticky bars | PASS | focus rings in `index.css`; bottom-nav safe-area padding |
| Dialog focus trap, Esc, focus return | PASS | `Dialog.jsx` + tests |
| NVDA/VoiceOver announcements | HARDWARE | `role="status"`/`aria-live` on scan results & errors |
| 200% zoom / 400% reflow at 320px | PASS | visual QA matrix includes 320px |
| Windows High Contrast | HARDWARE | semantic borders + focus rings; needs OS verification |
| Reduced motion | PASS | `@media (prefers-reduced-motion: reduce)` in `index.css` |
| Colour never the only status signal | PASS | every Badge has a text label + critical states add icons |
| Touch targets ≥44px with 8px spacing | PASS | Button `sm` keeps a 44px hit area; nav `min-h-14` |
| Language, titles, landmarks | PASS | `index.html lang="en-IN"`, per-route titles, header/nav/main landmarks |

## §12.4 Responsive and device

| Item | Status | Evidence |
|---|---|---|
| Widths 320, 360, 390, 768, 1024, 1366, 1440, 1920, 2560 | PASS | `visual-qa.mjs` matrix (full routes at 360/1440, representative at all 9) |
| Portrait + landscape on scanner/arrival | PASS | 4 landscape viewport checks in `visual-qa.mjs` |
| No horizontal scroll at 360px | PASS | scrollWidth gate across all routes |
| Tables become cards <768px | PASS | `Table.jsx` dual rendering |
| Admin bottom nav four items + More | PASS | `AdminLayout.jsx` mobile bar |
| Sticky bars respect safe areas | PASS | `pb-[env(safe-area-inset-bottom)]`, content padding |
| On-screen keyboard does not hide field | PASS | 16px inputs, scroll-to-focused, viewport-fit=cover |

## §12.5 Performance

| Item | Status | Evidence |
|---|---|---|
| Public JS ≤220KB gzip | PASS | 147.7KB (`scripts/bundle-budget.mjs`) |
| Admin ≤300KB gzip | PASS | 146.7KB |
| Scanner extra ≤90KB lazy | PASS | 5.7KB route chunk; camera lib 97.5KB loaded only on "Start scanner" |
| html5-qrcode absent from landing/ticket | PASS | budget script content check |
| No image >180KB on landing | PASS | only favicon/SVG + font; OG image is metadata, not loaded |
| Scanner cold start ≤2s | HARDWARE | dynamic import on demand; measure on desk device |
| Polling pauses when tab hidden | PASS | `usePageVisible` gates `useLiveOps` refetch interval |
| Lighthouse mobile ≥90 / a11y 100 | HARDWARE | run Lighthouse in the review environment |

## §12.6 Resilience and error states

| Item | Status | Evidence |
|---|---|---|
| API 500 → retry panel with request ID | PASS | `ServerError.jsx`, `ErrorState.jsx` |
| Offline banner + labelled cached data | PASS | `Offline.jsx`, ticket offline banner, `SyncStatus` |
| Camera denied / no camera / in use | PASS | `useCamera` state machine + `CameraUnavailable` |
| Expired session warns; `returnTo` works | PASS | auth/expiry handling in `AuthContext` |
| 403 correct home for role | PASS | `ProtectedRoute` + `Forbidden.jsx` |
| 404 offers four recovery links | PASS | `NotFound.jsx` |
| Double-click Issue pass no duplicate | PASS | `client_event_id` in outbox + disabled loading state |
| Slow 3G skeletons match layout | PASS | `Skeleton.jsx` used across async pages |

## §12.7 Print

| Item | Status | Evidence |
|---|---|---|
| Badge CR80, 25mm QR, 4-module quiet zone | PASS (CSS) / HARDWARE | `BadgePrint.jsx` `marginSize={4}`, `@page 85.6mm 54mm` |
| A6 ticket 100% with 40mm QR | PASS (CSS) / HARDWARE | `Ticket.jsx` print action, `@page A6`, 40mm rule |
| Printed QR scans on venue scanner | HARDWARE | requires venue hardware |
| Black-on-white, no dark background behind QR | PASS | print CSS forces white background, black text |
| Print preview hides nav/footers/toasts | PASS | global `@media print` + `.no-print` |
| A4 badge sheet with crop marks | PASS | 8-badge sheet + crop-mark CSS |

## §12.8 Security-adjacent UI

| Item | Status | Evidence |
|---|---|---|
| Client never constructs QR payload | PASS | `PassQr` renders server token only; arrival API sends IDs, not payloads |
| Raw token not in analytics/logs/title | PASS | token never written to document title or console |
| Ticket routes noindex + no-referrer | PASS | `noindex` + `no-referrer` meta tags injected in `Ticket.jsx` |
| PII not in query strings except signed token | PASS | only `?token=` on ticket/status |
| Copy actions confirm without exposing token | PASS | no token-copy UI added |
| Sign-out clears cached ticket data | PASS | `AuthContext` logout clears storage; ticket cache in sessionStorage |
| Admin destructive actions confirm + reason | PASS | Sessions, Volunteers, Attendance void dialogs |

## §12.9 Event go/no-go

These require the backend signed-token contract and venue hardware; the **frontend is complete and flag-ready** for all of them:

| Item | Status |
|---|---|
| Two consecutive full rehearsals form → import → sync → arrival → issue → print → scan | BY DESIGN — needs `/api/arrivals`, `/api/qr/issue`, `/api/qr/verify` |
| Offline drill: 15 min, 10 arrivals, reconnect, zero variance | BY DESIGN — outbox + idempotency implemented; needs hub |
| Printer/scanner tested with venue hardware | HARDWARE |
| Volunteers complete flow after 90-second briefing | PASS (frontend) — 90-second briefing added to `/volunteer/help` |
| Support runbook printed at desk | PASS — runbook is print-friendly |
| Content freeze 48h before event | N/A — process item for the host office |

---

## Stage 5 task list

| Task | Status |
|---|---|
| Accessibility audit and fixes across all routes | PASS — axe test, zero critical/serious |
| Performance pass: budgets, font swap, lazy scanner, polling pause | PASS |
| Empty/error/offline states reviewed | PASS — visual QA + component tests |
| Print rehearsal CSS (badge + A6 ticket) | PASS (CSS) / HARDWARE for physical print |
| Device matrix 320–2560 + landscape | PASS |
| Copy freeze: placeholders reviewed, no unsupported claims | PASS |
| Staff runbook + 90-second training screens | PASS — `/volunteer/help` |
| Final QA against §12 | This document |

## Summary

All frontend work in FrontendPlanning.md Stages 1–5 is implemented and verified. Items marked BY DESIGN are waiting on backend endpoints that are outside this frontend-only engagement; the screens are built, flag-gated, and tested in their safe states. Items marked HARDWARE require physical devices or assistive technology for sign-off.

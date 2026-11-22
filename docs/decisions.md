# GeekAI — Stage S0 decision log

**Status:** Provisional S0 record · 2026-11-21
**Source:** `Backend-Implementation-Plan.md` §10
**Owner:** event owner, university legal/privacy office and infrastructure lead (named owners still pending)
**Scope:** these are the twelve decisions that must be recorded before S0 closes. A `PROPOSED DEFAULT` lets implementation proceed provisionally; it is **not** an approval. A `PENDING` decision has no approval and must be confirmed by its owner before the stage that depends on it.

> This file does not claim legal, consent or retention approval. Decisions 1–3, 5, 6, 10, 11 and 12 remain with the event owner or the university. The recommended defaults below are recorded so S1–S4 do not stall, exactly as `Backend-Implementation-Plan.md` §3 rule 10 requires.

## Decision records

### D1 — Data controller

| Field | Value |
|---|---|
| ID | D1 |
| Decision | Who is the data controller for registration, photos, embeddings, attendance and audit records. |
| Status | **PENDING** |
| Recommendation | SOA University / AIC for Innovation Center, as recorded by the event owner. |
| Owner | Event owner + university legal/privacy office (`<owner TBD>`) |
| Impact | Consent wording, privacy notice, retention, deletion requests, vendor contracts (AWS/SES) and the published contact route. |
| Blocks | S4 consent and privacy copy; S2 retention/purge jobs. |
| Date recorded | 2026-11-21 |
| Evidence of approval | None yet. |

### D2 — Consent version and wording

| Field | Value |
|---|---|
| ID | D2 |
| Decision | Freeze the biometric consent text and version used by the in-site form. |
| Status | **PENDING** |
| Recommendation | Keep the delivered frontend `CONSENT_VERSION` value `2026-11` and the published consent text, subject to legal review. Any wording change requires a new version, never an in-place edit. |
| Owner | University legal/privacy office + event owner (`<owner TBD>`) |
| Impact | `consent.version` validation in `POST /api/register`, the privacy page, the consent record stored per participant and any re-consent flow. |
| Blocks | S4. |
| Date recorded | 2026-11-21 |
| Evidence of approval | None yet. The delivered frontend value is `2026-11`; it is provisional until legal review. |

### D3 — Retention period N

| Field | Value |
|---|---|
| ID | D3 |
| Decision | Number of days after the event before photos and embeddings are deleted, and the retention rule for attendance/audit records. |
| Status | **PENDING** |
| Recommendation | Delete photos and embeddings 90 days after the event; retain attendance and audit records according to university policy, to be confirmed before collection. Purge jobs must support a dry-run and a signed deletion report. |
| Owner | University legal/privacy office (`<owner TBD>`) |
| Impact | S3 lifecycle rules, S2 purge jobs, S4 privacy copy, post-event operations and deletion evidence. |
| Blocks | S2 purge jobs and S4 collection. |
| Date recorded | 2026-11-21 |
| Evidence of approval | None yet. The 90-day value is provisional only. |

### D4 — AWS region

| Field | Value |
|---|---|
| ID | D4 |
| Decision | Primary AWS region for S3, RDS, SES, ECS and Secrets Manager. |
| Status | **PROPOSED DEFAULT** |
| Recommendation | `ap-south-1` (Mumbai). |
| Owner | Infrastructure lead (`<owner TBD>`) |
| Impact | Data residency, latency, SES availability, RDS/pgvector support and Cloudflare origin configuration. |
| Blocks | Stage S3. |
| Date recorded | 2026-11-21 |
| Evidence of approval | Provisional; no infrastructure has been provisioned. |

### D5 — SES sending identity

| Field | Value |
|---|---|
| ID | D5 |
| Decision | Which domain or subdomain sends registration and pass-issuance email, and who owns its DNS. |
| Status | **PENDING** |
| Recommendation | A university-owned domain or subdomain, with a named DNS owner. Do not use an unverified personal domain. |
| Owner | University IT/DNS owner + infrastructure lead (`<owner TBD>`) |
| Impact | SES verification, DKIM/SPF/DMARC, sender reputation, bounce handling and S6 delivery rehearsal. |
| Blocks | Stage S3 SES setup and S6. |
| Date recorded | 2026-11-21 |
| Evidence of approval | None yet. The domain is TBA. |

### D6 — AWS and Cloudflare owners

| Field | Value |
|---|---|
| ID | D6 |
| Decision | Named individuals who own the AWS account and Cloudflare account, with MFA and credentials in the team vault. |
| Status | **PENDING** |
| Recommendation | Two named owners (primary and backup) with MFA, no long-lived access keys and a documented handover. |
| Owner | Event owner (`<owner TBD>`) |
| Impact | Account recovery, Access/WAF policy, billing, incident response and post-event key rotation. |
| Blocks | Stage S3. |
| Date recorded | 2026-11-21 |
| Evidence of approval | None yet. |

### D7 — QR signing algorithm and key id

| Field | Value |
|---|---|
| ID | D7 |
| Decision | Signing algorithm, key distribution and key-id handling for QR v1. |
| Status | **PROPOSED DEFAULT** |
| Recommendation | Ed25519 signatures. The v1 payload is the eight-field payload in `WorkFlow.md` Appendix B; the key is selected by `iss` in the verifier's key registry, and `kid` is stored server-side on `qr_tokens`. Do not add a `kid` field to the v1 payload without bumping `v`. |
| Owner | Backend lead + security reviewer (`<owner TBD>`) |
| Impact | `services/qr_signing.py`, scanner key distribution, key rotation, revocation and the frozen `qr-v1.md` contract. |
| Blocks | S5. |
| Date recorded | 2026-11-21 |
| Evidence of approval | Provisional; no key has been generated. |

### D8 — Hub runtime form

| Field | Value |
|---|---|
| ID | D8 |
| Decision | Whether the local hub is a separate service or the same FastAPI image in a local profile. |
| Status | **PROPOSED DEFAULT** |
| Recommendation | Same FastAPI image with `HUB_MODE=local`, a durable local SQLite database (or local Postgres if the drill shows a need), separate configuration and local-only secrets. |
| Owner | Backend lead + infrastructure lead (`<owner TBD>`) |
| Impact | Deployment, backup/restore, local matching, signing key custody and S7 offline drills. |
| Blocks | S7. |
| Date recorded | 2026-11-21 |
| Evidence of approval | Provisional. |

### D9 — Bot protection on `/register`

| Field | Value |
|---|---|
| ID | D9 |
| Decision | Which bot-protection mechanism guards the public registration form. |
| Status | **PROPOSED DEFAULT** |
| Recommendation | Cloudflare Turnstile on `/register`, with API-side rate limits and a server-side verification step. No third-party tracking script beyond the challenge. |
| Owner | Infrastructure lead + frontend/backend leads (`<owner TBD>`) |
| Impact | Cloudflare configuration, form submission path, accessibility and privacy copy. |
| Blocks | S4 abuse controls. |
| Date recorded | 2026-11-21 |
| Evidence of approval | Provisional. |

### D10 — Registration closing date and capacity

| Field | Value |
|---|---|
| ID | D10 |
| Decision | When registration closes and whether a capacity/waitlist limit applies. |
| Status | **PENDING** |
| Recommendation | TBA. Keep the form open until the event owner sets a closing date and capacity; do not invent a date. |
| Owner | Event owner (`<owner TBD>`) |
| Impact | Public copy, `event.registration.closed`, waitlist behaviour, manifest freeze at T-3 and late-registration handling. |
| Blocks | S4. |
| Date recorded | 2026-11-21 |
| Evidence of approval | None yet. The date and capacity are TBA. |

### D11 — Go/no-go signatory

| Field | Value |
|---|---|
| ID | D11 |
| Decision | Who signs the G6 go/no-go for event day. |
| Status | **PENDING** |
| Recommendation | The event owner. |
| Owner | Event owner (`<owner TBD>`) |
| Impact | S9 exit evidence, event-day escalation and the authority to accept residual risk. |
| Blocks | S9. |
| Date recorded | 2026-11-21 |
| Evidence of approval | None yet. |

### D12 — Manual override authority

| Field | Value |
|---|---|
| ID | D12 |
| Decision | Who may override a failed face match, waive a photo rejection or manually admit a participant, and what must be recorded. |
| Status | **PENDING** |
| Recommendation | One named desk lead per shift, with a mandatory reason and an audit event. No blanket volunteer override. |
| Owner | Event owner + volunteer coordinator (`<owner TBD>`) |
| Impact | S5/S7 override UI, audit coverage, desk runbook and reconciliation exceptions. |
| Blocks | S5 and S7. |
| Date recorded | 2026-11-21 |
| Evidence of approval | None yet. |

## Summary

| ID | Decision | Status | Blocks |
|---|---|---|---|
| D1 | Data controller | PENDING | S2, S4 |
| D2 | Consent version/wording | PENDING | S4 |
| D3 | Retention N | PENDING | S2, S4 |
| D4 | AWS region | PROPOSED DEFAULT | S3 |
| D5 | SES identity | PENDING | S3, S6 |
| D6 | AWS/Cloudflare owners | PENDING | S3 |
| D7 | QR algorithm/key id | PROPOSED DEFAULT | S5 |
| D8 | Hub runtime form | PROPOSED DEFAULT | S7 |
| D9 | Bot protection | PROPOSED DEFAULT | S4 |
| D10 | Closing date/capacity | PENDING | S4 |
| D11 | Go/no-go signatory | PENDING | S9 |
| D12 | Manual override authority | PENDING | S5, S7 |

**Change control:** a decision may move from `PENDING`/`PROPOSED DEFAULT` to `APPROVED` only by recording the approver, date and evidence in this file. Any decision that changes a contract must also update the matching contract file and the frontend contract test named in that file. This log is not a substitute for the university's legal or privacy approval.

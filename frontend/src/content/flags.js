/**
 * Feature flags for the phased rollout (FrontendPlanning.md §11.2).
 *
 * Safe-state rule: in production a flag is OFF unless explicitly enabled
 * with VITE_FLAG_<NAME>=true, so a deploy never exposes an unrehearsed flow.
 * In development flags default ON so new screens are visible while building.
 */

const env = import.meta.env

function flag(name, devDefault = true) {
  const raw = env[`VITE_FLAG_${name}`]
  if (raw === 'true') return true
  if (raw === 'false') return false
  return env.PROD ? false : devDefault
}

export const flags = {
  /**
   * `/register` renders the Google Form handoff (FrontendPlanning.md §7.2,
   * WorkFlow.md D3: Google Forms is the intake). Set
   * VITE_FLAG_REGISTRATION_HANDOFF=false only as an emergency deploy escape
   * hatch back to the native form — the end state is handoff-only.
   */
  registrationHandoff: env.VITE_FLAG_REGISTRATION_HANDOFF !== 'false',
  /** `/registration/status` and `/ticket/:token` participant screens. */
  ticketPage: flag('TICKET_PAGE', true),
  /** Volunteer arrival desk v2 (verify → issue pass → print). */
  arrivalV2: flag('ARRIVAL_V2', false),
  /** QR scanner v2 (signed-token verification, entry/session modes). */
  scanV2: flag('SCAN_V2', false),
  /** Admin live-ops screen (requires backend endpoint). */
  liveOps: flag('LIVE_OPS', false),
  /** Admin reconciliation screen (requires backend endpoint). */
  reconciliation: flag('RECONCILIATION', false),
}

export default flags

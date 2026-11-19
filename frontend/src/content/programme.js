/**
 * Programme content — every session is a typed placeholder until the host
 * office confirms it (FrontendPlanning.md §7.1: no invented session titles,
 * speakers or times). Replace entries as they are confirmed; never hard-code
 * programme copy in a component.
 */

export const tracks = [
  { id: 'all', label: 'All sessions' },
  { id: 'talks', label: 'Talks' },
  { id: 'workshops', label: 'Workshops' },
  { id: 'demo', label: 'Demo floor' },
]

/** Landing preview + programme page share this one array (§7.1 data rule). */
export const sessions = [
  {
    id: 'session-01',
    ref: 'Session 01',
    trackRef: 'Track 01',
    track: 'talks',
    tone: 'gold',
    time: 'Time TBA',
    title: 'Opening remarks and keynote',
    subtitle: 'Session title to be announced',
    description: 'Speaker and session title to be announced.',
    tags: ['Keynote', 'Main hall'],
    meta: 'Plenary · all participants',
    detail: 'Details to be announced',
    confirmed: false,
  },
  {
    id: 'session-02',
    ref: 'Session 02',
    trackRef: 'Track 02',
    track: 'talks',
    tone: 'teal',
    time: 'Time TBA',
    title: 'Research and applications track',
    subtitle: 'Session and speaker to be announced',
    description: 'Peer research, field notes and applied AI from Odisha.',
    tags: ['Talks', 'Track room'],
    meta: 'Parallel session',
    detail: 'Details to be announced',
    confirmed: false,
  },
  {
    id: 'session-03',
    ref: 'Session 03',
    trackRef: 'Track 03',
    track: 'workshops',
    tone: 'sand',
    time: 'Time TBA',
    title: 'Applied AI workshop',
    subtitle: 'Session and speaker to be announced',
    description: 'Hands-on building with local data and public problems.',
    tags: ['Workshop', 'Requirements to be announced'],
    meta: 'Registration required',
    detail: 'Details to be announced',
    confirmed: false,
  },
]

/** Demo-floor placeholder row so every tab has honest content. */
export const demoFloor = {
  id: 'session-demo',
  ref: 'Demo floor',
  trackRef: 'Floor 01',
  track: 'demo',
  tone: 'teal',
  time: 'Time TBA',
  title: 'Demo floor',
  subtitle: 'Exhibitors to be announced',
  description: 'Startups, labs and applied AI in the field — participants to be announced.',
  tags: ['Demo floor', 'Open floor'],
  meta: 'Drop in throughout the day',
  detail: 'Details to be announced',
  confirmed: false,
}

/** Programme status shown next to the section heading (§5.5 status language). */
export const programmeStatus = {
  pill: 'Provisional',
  note: 'Dates to be announced',
  empty: 'The programme is being confirmed. Sessions will be published here as they are announced.',
}

export default sessions

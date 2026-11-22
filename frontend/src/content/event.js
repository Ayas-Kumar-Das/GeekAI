/**
 * Single source of truth for static facts.
 *
 * This site is the Geek AI registration portal — built and operated by the
 * Geek AI developer team. It is NOT the official Odisha AI Symposium website.
 * It currently handles registration for Odisha AI Symposium 2026 and is built
 * to be reused for future events. The `event` block below describes the event
 * currently being served; the `platform` block describes the portal itself.
 *
 * Never hard-code a date, venue address or contact in a component. Unconfirmed
 * facts stay explicitly labelled; nothing is invented.
 */

const env = import.meta.env

/** The product: Geek AI's reusable registration platform. */
export const platform = {
  name: 'Geek AI Registration Portal',
  shortName: 'Geek AI',
  owner: 'Geek AI developer team',
  eyebrow: 'Geek AI · Registration portal',
  line: 'Registration, handled with care.',
  purpose:
    'Built and operated by the Geek AI developer team for registration and registration management at partner events.',
  reuse:
    'This portal currently serves Odisha AI Symposium 2026 and can be reused for future events.',
  status: 'Currently serving',
}

/** The event currently being served by the portal. */
export const event = {
  name: 'Odisha AI Symposium 2026',
  shortName: 'AIS 2026',
  edition: '2026',
  workingLine: 'Intelligence, rooted in Odisha.',
  supportingLine:
    'A symposium on artificial intelligence that serves place, people and public good.',

  // Unconfirmed facts are stated honestly, never invented.
  dateLabel: 'Date to be announced',
  date: null, // ISO string once confirmed: '2026-03-14'
  timeLabel: 'Time to be announced',

  venue: {
    institution: 'SOA University',
    city: 'Bhubaneswar',
    region: 'Odisha',
    country: 'India',
    label: 'SOA University, Bhubaneswar',
    address: null, // confirmed address pending from the event team
    mapUrl: null,
  },

  hosts: ['SOA University', 'AIC for Innovation Center'],
  hostLine: 'Presented by SOA University & AIC for Innovation Center',
  locationLine: 'Bhubaneswar, Odisha · 2026',

  registration: {
    // The in-site React form is the only intake. No external form URL.
    required: true,
    closed: env.VITE_REGISTRATION_CLOSED === 'true',
    passIssuedAt: 'the arrival desk',
  },

  contact: {
    // Not invented: set VITE_CONTACT_EMAIL when the event team confirms it.
    email: env.VITE_CONTACT_EMAIL || '',
    label: 'Contact the event team',
    supportLabel: 'Contact support',
  },

  links: {
    privacy: '/privacy',
    accessibility: '/accessibility',
    codeOfConduct: '/code-of-conduct',
    status: '/registration/status',
    staffLogin: '/login',
  },
}

export default event

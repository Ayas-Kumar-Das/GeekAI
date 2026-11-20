/**
 * Event configuration — single source of truth for static event facts.
 * Every value here is a placeholder until the host office confirms it.
 * Never hard-code a date, venue address, form URL or contact in a component.
 */

const env = import.meta.env

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
    address: null, // confirmed address pending from the host office
    mapUrl: null,
  },

  hosts: ['SOA University', 'AIC for Innovation Center'],
  hostLine: 'Presented by SOA University · AIC for Innovation Center',
  locationLine: 'Bhubaneswar, Odisha · 2026',

  registration: {
    // The in-site React form is the only intake. No external form URL.
    required: true,
    closed: env.VITE_REGISTRATION_CLOSED === 'true',
    passIssuedAt: 'the arrival desk',
  },

  contact: {
    // Not invented: set VITE_CONTACT_EMAIL when the host office confirms it.
    email: env.VITE_CONTACT_EMAIL || '',
    label: 'Contact the host office',
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

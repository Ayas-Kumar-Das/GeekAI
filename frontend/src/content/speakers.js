/**
 * Speakers content — placeholder slots only. The lineup is not announced, so
 * every card says so plainly (FrontendPlanning.md §7.1: no invented names,
 * titles or affiliations). Real entries replace these once confirmed.
 */

export const speakers = Array.from({ length: 8 }, (_, index) => ({
  id: index + 1,
  label: 'Speaker to be announced',
  placeholder: true,
}))

/** Landing shows four; the speakers page shows the full grid. */
export const featuredSpeakers = speakers.slice(0, 4)

export const speakersStatus = {
  heading: 'Voices to be announced.',
  body: 'The speaker lineup is being confirmed. Sessions will be published here as they are announced.',
}

export default speakers

/**
 * Vitest setup — jsdom does not implement scrolling. PublicLayout calls
 * window.scrollTo on route changes, so stub it out to keep test output clean.
 */
if (typeof window !== 'undefined') {
  window.scrollTo = () => {}
}

/**
 * Persistent, unobtrusive attribution footer - rendered once for the
 * whole app (see App.jsx), not per-page. Two compliance requirements
 * live here, not scattered elsewhere:
 * 1. TMDB's terms require disclosing that this product uses their API
 *    without being endorsed/certified by them. The app had no live-UI
 *    attribution for this anywhere before (only in code comments/docs).
 * 2. TMDB's watch-provider data is itself sourced from JustWatch, whose
 *    attribution requirement previously lived directly in the Where to
 *    Watch card - moved here so it's still present exactly once, just
 *    not competing with that section's own content.
 */
function Footer() {
  return (
    <footer className="mt-auto border-t border-line px-4 py-6 text-center text-xs text-ink-muted sm:px-8">
      <p className="mx-auto max-w-2xl">
        This product uses the{' '}
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-ink-muted underline decoration-dotted underline-offset-2 transition-colors duration-150 hover:text-brand"
        >
          TMDB
        </a>{' '}
        API but is not endorsed or certified by TMDB. Watch provider data provided by JustWatch.
      </p>
    </footer>
  );
}

export default Footer;

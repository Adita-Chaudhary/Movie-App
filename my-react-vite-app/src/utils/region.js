/**
 * Best-effort, permission-free guess at the user's region, for defaulting
 * the Where-to-Watch region selector. Deliberately does NOT use
 * geolocation (requires a permission prompt, overkill for a default) -
 * `navigator.language`/`navigator.languages` already encodes a region
 * subtag on most browsers (e.g. "en-US", "en-GB", "fr-FR") without any
 * permission at all. Falls back to a reasonable global default if no
 * region subtag is present (e.g. a bare "en" or "fr").
 */
export const DEFAULT_REGION = 'US';

export function detectLikelyRegion(languages) {
  const candidates = languages ?? (typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : []);

  for (const locale of candidates ?? []) {
    const match = /-([a-zA-Z]{2})$/.exec(locale ?? '');
    if (match) return match[1].toUpperCase();
  }

  return DEFAULT_REGION;
}

/** Alphabetizes region options by display name, for a usable dropdown instead of API order. */
export function sortRegionsByName(regions) {
  return [...regions].sort((a, b) => (a.english_name ?? a.iso_3166_1).localeCompare(b.english_name ?? b.iso_3166_1));
}

/**
 * Ensures the currently-selected region always has a matching <option>,
 * even if it came from detectLikelyRegion() and isn't (yet, or ever) in
 * TMDB's region list - so the selector never silently shows blank.
 */
export function withCurrentRegionOption(regions, currentRegion) {
  if (regions.some((r) => r.iso_3166_1 === currentRegion)) return regions;
  return [{ iso_3166_1: currentRegion, english_name: currentRegion }, ...regions];
}

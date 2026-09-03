import { getOfficialProviderUrl } from './providerUrls';

/**
 * TMDB's watch-provider data does NOT include a per-provider deep link -
 * verified directly against the live API for both
 * `/movie/{id}/watch/providers` (per-movie, per-region) and
 * `/watch/providers/movie` (the provider configuration/list endpoint).
 * Every provider entry only ever has `provider_id`, `provider_name`,
 * `logo_path`, and a display priority. The only real URL TMDB gives is
 * the region-level `link` field (a JustWatch-style aggregator page for
 * the whole movie).
 *
 * This is the single entry point WhereToWatch.jsx uses to decide whether
 * a provider tile is clickable, checking two sources in order:
 * 1. A URL field on the provider object itself, in case TMDB ever adds
 *    a real per-provider (or even per-movie-per-provider) field, or some
 *    response shape this app hasn't seen includes one. Costs nothing to
 *    check and will genuinely be undefined for every real provider today.
 * 2. A verified official homepage for well-known services (Netflix,
 *    Prime Video, Apple TV, ...) from the centralized mapping in
 *    providerUrls.js. This is a "go to this streaming service" link,
 *    never a movie-specific one.
 *
 * Must NEVER construct a URL from the provider's name or id directly
 * (that would be a fabricated destination, not a verified one) - the
 * mapping in providerUrls.js is the only source for #2, and it only
 * contains hand-verified official URLs.
 */
export function getProviderUrl(provider) {
  const suppliedUrl = provider?.provider_url ?? provider?.link ?? provider?.homepage;
  if (typeof suppliedUrl === 'string' && suppliedUrl.length > 0) return suppliedUrl;

  return getOfficialProviderUrl(provider);
}

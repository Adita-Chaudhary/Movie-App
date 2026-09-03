/**
 * Official homepage/app URLs for well-known TMDB watch providers -
 * "go to this streaming service", never a movie-specific deep link
 * (TMDB's API doesn't expose those; see watchProviders.js for the
 * verification of that). Every URL below was manually looked up and
 * confirmed to be each service's real, official domain during
 * development - none are guessed, generated from the provider name, or
 * routed through a search engine/redirector.
 *
 * Keyed primarily by TMDB's numeric `provider_id` (stable across
 * regions/locales), fetched and cross-checked against TMDB's own
 * `/watch/providers/movie` configuration endpoint. `provider_name`
 * varies more than the id does (e.g. regional "channel" variants like
 * "HBO Max Amazon Channel" are still fundamentally the same service sold
 * through a different storefront), so several ids intentionally point at
 * the same destination.
 *
 * A provider whose id isn't in this table but whose name closely
 * matches one of ALT_NAME_URLS below still gets a verified link via
 * getOfficialProviderUrl()'s fallback - useful since TMDB occasionally
 * introduces new ids for the same real-world service. Anything matching
 * neither table is left non-clickable on purpose (see
 * watchProviders.js) rather than guessed.
 */
export const PROVIDER_URLS_BY_ID = {
  // Netflix
  8: 'https://www.netflix.com/',
  1796: 'https://www.netflix.com/', // Netflix Standard with Ads

  // Amazon / Prime Video
  9: 'https://www.primevideo.com/', // Amazon Prime Video
  10: 'https://www.primevideo.com/', // Amazon Video (legacy naming, same storefront today)
  2100: 'https://www.primevideo.com/', // Amazon Prime Video with Ads

  // Apple TV (the unified Apple TV app covers both subscription and rent/buy)
  350: 'https://tv.apple.com/', // Apple TV (subscription/Apple TV+)
  2: 'https://tv.apple.com/', // Apple TV Store (rent/buy)

  // Disney+
  337: 'https://www.disneyplus.com/',

  // Hulu
  15: 'https://www.hulu.com/',

  // Max (TMDB still lists this provider as "HBO Max"; the service itself
  // rebranded to Max - the URL below is the current official domain)
  1899: 'https://www.max.com/',
  1825: 'https://www.max.com/', // HBO Max Amazon Channel

  // Google - Google Play Movies & TV
  3: 'https://play.google.com/store/movies',

  // YouTube
  192: 'https://www.youtube.com/', // YouTube (rent/buy)
  188: 'https://www.youtube.com/premium', // YouTube Premium
  2528: 'https://tv.youtube.com/', // YouTube TV

  // Peacock
  386: 'https://www.peacocktv.com/', // Peacock Premium
  387: 'https://www.peacocktv.com/', // Peacock Premium Plus

  // Paramount+
  2303: 'https://www.paramountplus.com/', // Paramount Plus Premium
  2616: 'https://www.paramountplus.com/', // Paramount Plus Essential
  582: 'https://www.paramountplus.com/', // Paramount+ Amazon Channel

  // Starz
  43: 'https://www.starz.com/',
  1794: 'https://www.starz.com/', // Starz Amazon Channel

  // Free, ad-supported services
  73: 'https://tubitv.com/', // Tubi TV
  300: 'https://pluto.tv/', // Pluto TV
  207: 'https://therokuchannel.roku.com/', // The Roku Channel

  // Other well-known services
  283: 'https://www.crunchyroll.com/', // Crunchyroll
  1768: 'https://plus.espn.com/', // ESPN Plus
  257: 'https://www.fubo.tv/', // fuboTV
  538: 'https://www.plex.tv/', // Plex
  151: 'https://www.britbox.com/', // BritBox
  526: 'https://www.amcplus.com/', // AMC+
  191: 'https://www.kanopy.com/', // Kanopy
  212: 'https://www.hoopladigital.com/', // Hoopla
  7: 'https://www.fandangoathome.com/', // Fandango At Home (formerly Vudu)
  83: 'https://www.cwtv.com/', // The CW
  209: 'https://www.pbs.org/', // PBS
  258: 'https://www.criterionchannel.com/', // Criterion Channel
  190: 'https://curiositystream.com/', // Curiosity Stream
};

/**
 * Fallback for a provider whose specific id isn't in PROVIDER_URLS_BY_ID
 * but whose name unambiguously matches a known service - keyed by a
 * normalized (lowercased, trimmed, punctuation-stripped) name. Kept
 * small and conservative on purpose: only added when the name match is
 * unambiguous, since this is the lower-confidence path.
 */
const ALT_NAME_URLS = {
  netflix: 'https://www.netflix.com/',
  'amazon prime video': 'https://www.primevideo.com/',
  'prime video': 'https://www.primevideo.com/',
  'apple tv': 'https://tv.apple.com/',
  'apple tv plus': 'https://tv.apple.com/',
  'disney plus': 'https://www.disneyplus.com/',
  'disney+': 'https://www.disneyplus.com/',
  hulu: 'https://www.hulu.com/',
  max: 'https://www.max.com/',
  'hbo max': 'https://www.max.com/',
  'google play movies': 'https://play.google.com/store/movies',
  youtube: 'https://www.youtube.com/',
  peacock: 'https://www.peacocktv.com/',
  'paramount plus': 'https://www.paramountplus.com/',
  'paramount+': 'https://www.paramountplus.com/',
  starz: 'https://www.starz.com/',
  'tubi tv': 'https://tubitv.com/',
  tubi: 'https://tubitv.com/',
  'pluto tv': 'https://pluto.tv/',
};

function normalizeProviderName(name) {
  return (name ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9+\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * The single entry point the UI should use: a verified official
 * homepage for a TMDB provider, or undefined if none is known (in which
 * case the provider must be rendered as non-clickable - see
 * WhereToWatch.jsx - rather than guessing).
 */
export function getOfficialProviderUrl(provider) {
  if (!provider) return undefined;
  if (provider.provider_id != null && PROVIDER_URLS_BY_ID[provider.provider_id]) {
    return PROVIDER_URLS_BY_ID[provider.provider_id];
  }
  const normalized = normalizeProviderName(provider.provider_name);
  return ALT_NAME_URLS[normalized];
}

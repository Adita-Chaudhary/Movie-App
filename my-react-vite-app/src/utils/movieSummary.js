/**
 * Reduces a full TMDB movie-details response (base fields + credits +
 * keywords, as fetched by getMovieDetails's append_to_response) down to
 * the light, storable shape used everywhere a movie is persisted:
 * watchlist entries, history entries, rating snapshots, and - reused
 * here for the same reason - enriched recommendation candidates.
 *
 * Why this matters for recommendations: keywords/cast/director are only
 * ever present on a *details* response, never on the list endpoints
 * (popular/trending/discover/...). By capturing them once, for free,
 * whenever the user actually opens a movie's details page, the
 * recommendation engine gets keyword/cast/director signal on the
 * *profile* side without ever issuing a request just to build a profile.
 * A movie added to the watchlist straight from a card's "+" button
 * (never opened) simply won't have this richer data - genre_ids still
 * work fine, the keyword/cast/director fields are just empty arrays/null,
 * which the scoring engine treats as "signal unavailable" rather than
 * "no match" (see scoreCandidates.js's renormalization).
 */
export function toMovieSummary(details) {
  const director = details.credits?.crew?.find((person) => person.job === 'Director');
  const topCast = details.credits?.cast?.slice(0, 5) ?? [];
  const keywords = details.keywords?.keywords ?? [];

  return {
    id: details.id,
    title: details.title,
    poster_path: details.poster_path,
    backdrop_path: details.backdrop_path,
    release_date: details.release_date,
    overview: details.overview,
    vote_average: details.vote_average,
    vote_count: details.vote_count,
    popularity: details.popularity,
    genre_ids: details.genres?.map((g) => g.id) ?? details.genre_ids ?? [],

    keyword_ids: keywords.map((k) => k.id),
    keyword_names: keywords.map((k) => k.name),

    cast_ids: topCast.map((c) => c.id),
    cast_names: topCast.map((c) => c.name),

    director_id: director?.id ?? null,
    director_name: director?.name ?? null,
  };
}

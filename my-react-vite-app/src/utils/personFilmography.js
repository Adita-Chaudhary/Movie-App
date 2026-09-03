/**
 * Turns a TMDB person's movie_credits (separate `cast` and `crew` arrays)
 * into one deduplicated filmography. A person can appear in both arrays
 * for the same movie (an actor-director credited for both), so this
 * merges by movie id and tags each entry with every role found rather
 * than showing the same movie twice.
 *
 * Only the Director crew job is surfaced (not every crew role - a person
 * page for a prolific crew member could otherwise list hundreds of
 * "Sound Editor"/"Gaffer" credits, which isn't useful for a movie-
 * discovery app centered on cast/director exploration).
 */
export function buildFilmography(movieCredits) {
  const cast = movieCredits?.cast ?? [];
  const directingCredits = (movieCredits?.crew ?? []).filter((credit) => credit.job === 'Director');

  const byId = new Map();

  cast.forEach((credit) => {
    byId.set(credit.id, { ...credit, roles: [credit.character ? `as ${credit.character}` : 'Actor'] });
  });

  directingCredits.forEach((credit) => {
    const existing = byId.get(credit.id);
    if (existing) existing.roles.push('Director');
    else byId.set(credit.id, { ...credit, roles: ['Director'] });
  });

  return [...byId.values()].sort((a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''));
}

/** "Known for" = the person's most popular acting credits, TMDB-homepage style. */
export function knownForMovies(movieCredits, count = 6) {
  const cast = movieCredits?.cast ?? [];
  return [...cast].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)).slice(0, count);
}

import { buildUserProfile } from './recommendations';

/**
 * "Movie DNA" - a human-readable rendering of the exact same taste
 * profile that powers recommendations (buildUserProfile), so the numbers
 * shown here are literally what drives "Recommended For You", not a
 * separate calculation that happens to look similar. This is plain
 * counting/averaging over local activity - not AI or machine learning.
 *
 * Returns `hasEnoughData: false` (and no stats) below MIN_MOVIES distinct
 * movies, so the UI can hide the section entirely rather than show a
 * profile built from one or two data points.
 */
const MIN_MOVIES_FOR_PROFILE = 3;
const MIN_OCCURRENCES_FOR_PREFERENCE = 2; // an actor/director must recur to count as a "preference", not a coincidence

function topEntries(weightMap, count) {
  return [...weightMap.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, count)
    .map(([id, weight]) => ({ id, weight }));
}

export function buildTasteProfile({ watchlist = [], history = [], ratingsList = [] }) {
  const distinctIds = new Set([
    ...watchlist.map((m) => m.id),
    ...history.map((m) => m.id),
    ...ratingsList.map((r) => r.movieId),
  ]);

  if (distinctIds.size < MIN_MOVIES_FOR_PROFILE) {
    return { hasEnoughData: false };
  }

  const weightedMovies = [
    ...watchlist.map((movie) => ({ movie, weight: 1, sourceType: 'watchlist' })),
    ...ratingsList
      .filter((entry) => entry.rating >= 4)
      .map((entry) => ({ movie: entry.movie, weight: 1.2, sourceType: 'rating' })),
    ...history.map((movie) => ({ movie, weight: 0.4, sourceType: 'history' })),
  ];

  const profile = buildUserProfile(weightedMovies);

  const topGenreIds = topEntries(profile.genreWeights, 5).map((e) => e.id);
  const topKeywordNames = topKeywordNamesFrom(weightedMovies, 6);

  const castCounts = new Map(); // id -> { name, count }
  weightedMovies.forEach(({ movie }) => {
    (movie.cast_ids ?? []).forEach((id, index) => {
      const name = movie.cast_names?.[index];
      if (!name) return;
      const existing = castCounts.get(id) ?? { name, count: 0 };
      existing.count += 1;
      castCounts.set(id, existing);
    });
  });
  const topCast = [...castCounts.entries()]
    .filter(([, { count }]) => count >= MIN_OCCURRENCES_FOR_PREFERENCE)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([id, { name, count }]) => ({ id, name, count }));

  const directorCounts = new Map();
  weightedMovies.forEach(({ movie }) => {
    if (!movie.director_id) return;
    const existing = directorCounts.get(movie.director_id) ?? { name: movie.director_name, count: 0 };
    existing.count += 1;
    directorCounts.set(movie.director_id, existing);
  });
  const topDirectorEntry = [...directorCounts.entries()]
    .filter(([, { count }]) => count >= MIN_OCCURRENCES_FOR_PREFERENCE)
    .sort((a, b) => b[1].count - a[1].count)[0];
  const topDirector = topDirectorEntry ? { id: topDirectorEntry[0], ...topDirectorEntry[1] } : null;

  const ratingValues = ratingsList.map((r) => r.rating);
  const averageRating =
    ratingValues.length > 0 ? ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length : null;

  return {
    hasEnoughData: true,
    topGenreIds,
    topKeywordNames,
    topCast,
    topDirector,
    averageRating,
    moviesConsidered: distinctIds.size,
  };
}

function topKeywordNamesFrom(weightedMovies, count) {
  const weights = new Map(); // name -> weight
  weightedMovies.forEach(({ movie, weight }) => {
    (movie.keyword_names ?? []).forEach((name) => {
      weights.set(name, (weights.get(name) ?? 0) + weight);
    });
  });
  return [...weights.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([name]) => name);
}

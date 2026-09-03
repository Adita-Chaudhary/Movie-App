import { termFrequencyVector, tokenize } from './textSimilarity';

/**
 * Builds a "taste profile" describing what a user seems to like, from a
 * list of { movie, weight, sourceType } entries (see useRecommendations.js
 * for how watchlist/high-rating/history signals are weighted, and
 * similarMovies.js for how a *single* movie is turned into a
 * "profile of one" to power the Similar Movies feature).
 *
 * The profile tracks five independent signals, each a weight-summed map
 * so a movie that shows up across multiple sources (e.g. watchlisted AND
 * rated 5 stars) counts proportionally more:
 * - genreWeights: TMDB genre id -> summed weight. Always available -
 *   every movie object, list or detail, carries genre_ids.
 * - keywordWeights: TMDB keyword id -> summed weight. Only populated for
 *   source movies whose details were actually fetched (keywords are a
 *   details-only field - see utils/movieSummary.js).
 * - castWeights: TMDB person id (top-5 billed cast) -> summed weight.
 *   Same details-only caveat as keywords.
 * - directorWeights: TMDB person id -> summed weight. Same caveat.
 * - textVector: a combined term-frequency vector over all source
 *   overviews (see textSimilarity.js for the TF/cosine math), always
 *   available since overview text ships on every movie object.
 *
 * sourceTypeWeights tallies how much total weight came from each kind of
 * signal (watchlist / rating / history), purely so recommendation
 * explanations can say *which* activity a recommendation is rooted in
 * (e.g. "similar to movies you rated highly" vs. "...in your watchlist").
 */
export function buildUserProfile(weightedMovies) {
  const genreWeights = new Map();
  const keywordWeights = new Map();
  const castWeights = new Map();
  const directorWeights = new Map();
  const textVector = new Map();
  const sourceTypeWeights = {};

  weightedMovies.forEach(({ movie, weight, sourceType }) => {
    (movie.genre_ids ?? []).forEach((id) => {
      genreWeights.set(id, (genreWeights.get(id) ?? 0) + weight);
    });

    (movie.keyword_ids ?? []).forEach((id) => {
      keywordWeights.set(id, (keywordWeights.get(id) ?? 0) + weight);
    });

    (movie.cast_ids ?? []).forEach((id) => {
      castWeights.set(id, (castWeights.get(id) ?? 0) + weight);
    });

    if (movie.director_id) {
      directorWeights.set(movie.director_id, (directorWeights.get(movie.director_id) ?? 0) + weight);
    }

    const movieVector = termFrequencyVector(tokenize(movie.overview));
    for (const [term, freq] of movieVector) {
      textVector.set(term, (textVector.get(term) ?? 0) + freq * weight);
    }

    if (sourceType) {
      sourceTypeWeights[sourceType] = (sourceTypeWeights[sourceType] ?? 0) + weight;
    }
  });

  return {
    genreWeights,
    keywordWeights,
    castWeights,
    directorWeights,
    textVector,
    sourceTypeWeights,
    sourceCount: weightedMovies.length,
  };
}

/** The sourceType with the most total weight in a profile, or null for an empty profile. Used for explanation phrasing. */
export function dominantSourceType(profile) {
  const entries = Object.entries(profile.sourceTypeWeights ?? {});
  if (entries.length === 0) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

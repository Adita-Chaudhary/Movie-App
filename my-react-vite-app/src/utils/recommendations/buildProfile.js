import { termFrequencyVector, tokenize } from './textSimilarity';

/**
 * Builds a "taste profile" describing what a user seems to like, from a
 * list of { movie, weight } pairs. `weight` lets callers say a watchlist
 * add counts more than a movie merely viewed - see useRecommendations.js
 * for how weights are assigned per signal (watchlist, high rating, history).
 *
 * The profile has two parts:
 * - genreWeights: how strongly each genre id shows up, weight-summed.
 * - textVector: a combined term-frequency vector over all source
 *   overviews, so candidates can be compared by plot/theme similarity
 *   (see textSimilarity.js) rather than genre tags alone.
 */
export function buildUserProfile(weightedMovies) {
  const genreWeights = new Map();
  const textVector = new Map();

  weightedMovies.forEach(({ movie, weight }) => {
    (movie.genre_ids ?? []).forEach((genreId) => {
      genreWeights.set(genreId, (genreWeights.get(genreId) ?? 0) + weight);
    });

    const tokens = tokenize(movie.overview);
    const movieVector = termFrequencyVector(tokens);
    for (const [term, freq] of movieVector) {
      textVector.set(term, (textVector.get(term) ?? 0) + freq * weight);
    }
  });

  return {
    genreWeights,
    textVector,
    sourceCount: weightedMovies.length,
  };
}

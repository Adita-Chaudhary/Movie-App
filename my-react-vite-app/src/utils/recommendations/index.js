/**
 * Content-based movie recommendation engine.
 *
 * WHAT THIS IS: hand-written, fully explainable scoring - not machine
 * learning. There is no training data, no model weights learned from
 * data, and no gradient descent. It is "content-based filtering" in the
 * classic recommender-systems sense: recommendations are derived from
 * the *content* of movies the user already likes (genres, keywords,
 * overview text, cast, director), compared against the same content on
 * candidate movies, using hand-picked, documented weights (see
 * scoreCandidates.js). Every recommendation is traceable back to the
 * exact signals that produced it (see explain.js) - nothing is inferred
 * beyond what the scoring actually found.
 *
 * Pipeline (see useRecommendations.js for the full orchestration):
 * 1. buildUserProfile()     - turn the user's watchlist/highly-rated/
 *    recently-viewed movies into a taste profile: weighted genre,
 *    keyword, cast, and director maps, plus a combined overview term
 *    vector (textSimilarity.js).
 * 2. rankCandidates()       - cheap first-pass score (genre + overview
 *    text + quality - the only signals available on list-endpoint
 *    candidates) to shortlist the most promising movies.
 * 3. enrichTopCandidates()  - fetch full details (keywords/cast/
 *    director) for just that shortlist, via the same cached
 *    getMovieDetails() the Movie Details page uses - bounded, not
 *    "every candidate", to avoid unnecessary API calls.
 * 4. rankCandidates() again - full six-signal score on the enriched
 *    shortlist, producing the final ranked list.
 * 5. explainRecommendation() - turn each result's matched signals into a
 *    short, honest, human-readable reason.
 *
 * Related, separate systems built on the same primitives:
 * - similarMovies.js   - "similar to the movie being viewed" (Movie
 *   Details page), NOT personalized to the user.
 * - movieNight.js       - picks a complementary two-movie pairing from an
 *   already-ranked recommendation list, with no extra scoring/API cost.
 * - tasteProfile.js (../tasteProfile.js) - a human-readable rendering of
 *   the same profile-building primitives, for the "Movie DNA" section.
 */

export { buildUserProfile, dominantSourceType } from './buildProfile';
export { rankCandidates, scoreMovie, WEIGHTS } from './scoreCandidates';
export { cosineSimilarity, termFrequencyVector, tokenize } from './textSimilarity';
export { explainRecommendation } from './explain';
export { rankSimilarMovies } from './similarMovies';
export { enrichTopCandidates } from './enrichCandidates';
export { pickDoubleFeature } from './movieNight';

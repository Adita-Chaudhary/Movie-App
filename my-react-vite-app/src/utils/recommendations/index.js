/**
 * Content-based movie recommendation engine.
 *
 * WHAT THIS IS: a hand-written, fully explainable scoring function - not
 * machine learning. There is no training data, no model weights learned
 * from data, and no gradient descent. It is "content-based filtering" in
 * the classic recommender-systems sense: recommendations are derived from
 * the *content* of movies the user already likes (genres + overview text),
 * compared against the content of candidate movies, using hand-picked
 * weights (see scoreCandidates.js). This makes every recommendation
 * traceable back to a concrete reason, which is what `matchedGenreIds`
 * is for.
 *
 * Pipeline:
 * 1. buildUserProfile()  - turn the user's liked/rated/viewed movies into
 *    a taste profile: a genre-weight map + a combined overview term
 *    vector (see textSimilarity.js for the TF/cosine math).
 * 2. rankCandidates()    - score every candidate movie against that
 *    profile (genre overlap + overview similarity + a small
 *    popularity/quality tie-breaker) and return the top N.
 *
 * See useRecommendations.js for how signals are weighted (watchlist vs.
 * a 5-star rating vs. something merely viewed) and where the candidate
 * pool comes from.
 */

export { buildUserProfile } from './buildProfile';
export { rankCandidates, scoreMovie } from './scoreCandidates';
export { cosineSimilarity, termFrequencyVector, tokenize } from './textSimilarity';

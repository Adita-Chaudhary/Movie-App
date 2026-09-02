import { cosineSimilarity, termFrequencyVector, tokenize } from './textSimilarity';

// Relative importance of each signal in the final score. Genre overlap is
// weighted highest because it is the strongest, cleanest taste signal
// TMDB gives us for free on every list response; plot/theme similarity
// adds nuance beyond genre tags; the popularity/quality prior is a small
// tie-breaker so two equally-similar candidates favor the better-reviewed
// one, rather than driving recommendations on its own.
const WEIGHTS = {
  genre: 0.55,
  text: 0.3,
  quality: 0.15,
};

function genreScore(candidate, genreWeights) {
  if (genreWeights.size === 0) return { score: 0, matchedGenreIds: [] };

  const candidateGenres = candidate.genre_ids ?? [];
  const maxPossible = [...genreWeights.values()].reduce((a, b) => a + b, 0);
  if (maxPossible === 0 || candidateGenres.length === 0) return { score: 0, matchedGenreIds: [] };

  const matchedGenreIds = candidateGenres.filter((id) => genreWeights.has(id));
  const raw = matchedGenreIds.reduce((sum, id) => sum + genreWeights.get(id), 0);

  // Normalize by the candidate's own genre count too, so a movie tagged
  // with 6 genres doesn't automatically outscore a tightly-tagged 2-genre
  // movie just by touching more of the profile.
  const normalized = raw / Math.max(maxPossible, candidateGenres.length);

  return { score: Math.min(normalized, 1), matchedGenreIds };
}

function qualityScore(candidate, maxVoteCount) {
  const voteAverage = (candidate.vote_average ?? 0) / 10; // -> [0, 1]
  const voteCount = candidate.vote_count ?? 0;
  const sampleConfidence = maxVoteCount > 0 ? Math.log10(voteCount + 1) / Math.log10(maxVoteCount + 1) : 0;
  return voteAverage * sampleConfidence;
}

/**
 * Scores one candidate movie against a user profile. Returns the
 * composite score plus a breakdown, so the UI can show *why* something
 * was recommended (e.g. "because you like Action, Sci-Fi").
 */
export function scoreMovie(candidate, profile, { maxVoteCount = 1 } = {}) {
  const { score: genre, matchedGenreIds } = genreScore(candidate, profile.genreWeights);

  const candidateVector = termFrequencyVector(tokenize(candidate.overview));
  const text = cosineSimilarity(candidateVector, profile.textVector);

  const quality = qualityScore(candidate, maxVoteCount);

  const score = genre * WEIGHTS.genre + text * WEIGHTS.text + quality * WEIGHTS.quality;

  return { score, matchedGenreIds, breakdown: { genre, text, quality } };
}

/**
 * Ranks a pool of candidate movies against a user profile and returns the
 * top `limit`, excluding anything in `excludeIds` (already watchlisted /
 * viewed / rated - recommending those back would be noise, not value).
 */
export function rankCandidates(candidates, profile, { excludeIds = new Set(), limit = 12 } = {}) {
  const pool = candidates.filter((movie) => !excludeIds.has(movie.id));
  const maxVoteCount = Math.max(1, ...pool.map((movie) => movie.vote_count ?? 0));

  return pool
    .map((movie) => {
      const { score, matchedGenreIds, breakdown } = scoreMovie(movie, profile, { maxVoteCount });
      return { movie, score, matchedGenreIds, breakdown };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

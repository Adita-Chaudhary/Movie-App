import { cosineSimilarity, termFrequencyVector, tokenize } from './textSimilarity';

/**
 * Relative importance of each signal, out of 1.0 total. Chosen (not
 * inherited unchanged from an earlier, genre+text-only version) to
 * reflect how much *specific* taste information each signal actually
 * carries:
 *
 * - genre (0.30): the broadest, always-available signal. Kept as the
 *   single largest weight because every movie has it, but capped below
 *   half the total because TMDB only has ~19 genres - two very
 *   different movies both being tagged "Drama" shouldn't dominate.
 * - keyword (0.20): TMDB keywords ("time travel", "heist", "based on
 *   video game", ...) number in the thousands, so a match is far more
 *   specific than a genre match. Weighted just under genre for that
 *   reason, whenever the data is available (details-only field).
 * - text (0.20): overview cosine similarity catches plot/theme
 *   resemblance that no tag captures at all (see textSimilarity.js).
 * - cast (0.10): shared top-billed actors is a real but noisier signal
 *   - a popular actor appears across wildly different genres/tones, so
 *   it's weighted lower than genre/keyword/text.
 * - director (0.10): a shared director is a strong stylistic signal
 *   (auteur consistency) but only ever matches one person per movie, so
 *   it fires less often than the set-based signals above; kept modest.
 * - quality (0.10): a small popularity/rating prior so two otherwise
 *   tied candidates favor the better-reviewed one. Deliberately the
 *   smallest weight so it can only ever break ties, never drive
 *   recommendations on its own.
 *
 * When a signal has no data on either side (most commonly keyword/cast/
 * director for a candidate that was never detail-fetched), it is marked
 * "unavailable" and excluded from the score entirely rather than scored
 * as a hard 0 - the remaining available weights are renormalized to sum
 * to 1.0 (see combineScores below). This means a movie missing
 * keyword/cast data is judged purely on what we *do* know about it,
 * instead of being unfairly punished for a gap in TMDB's response shape.
 */
const WEIGHTS = {
  genre: 0.3,
  keyword: 0.2,
  text: 0.2,
  cast: 0.1,
  director: 0.1,
  quality: 0.1,
};

/**
 * Generic weighted-set-overlap score: how much of `weightMap`'s total
 * weight is "covered" by `candidateIds`, normalized so a candidate can't
 * win just by having more tags/keywords/cast than the profile does.
 * Used identically for genre, keyword, and cast overlap.
 */
function overlapScore(candidateIds, weightMap) {
  if (!candidateIds || candidateIds.length === 0 || weightMap.size === 0) {
    return { score: 0, available: false, matchedIds: [] };
  }

  const matchedIds = candidateIds.filter((id) => weightMap.has(id));
  const maxPossible = [...weightMap.values()].reduce((a, b) => a + b, 0);
  const raw = matchedIds.reduce((sum, id) => sum + weightMap.get(id), 0);
  const normalized = raw / Math.max(maxPossible, candidateIds.length);

  return { score: Math.min(normalized, 1), available: true, matchedIds };
}

/** Director is a single value, not a set, so it's a direct weight lookup instead of overlapScore's set math. */
function directorScore(candidate, directorWeights) {
  if (!candidate.director_id || directorWeights.size === 0) {
    return { score: 0, available: false, matchedId: null };
  }
  const weight = directorWeights.get(candidate.director_id);
  if (!weight) return { score: 0, available: true, matchedId: null };

  const maxPossible = Math.max(...directorWeights.values());
  return { score: weight / maxPossible, available: true, matchedId: candidate.director_id };
}

function qualityScore(candidate, maxVoteCount) {
  const voteAverage = (candidate.vote_average ?? 0) / 10; // -> [0, 1]
  const voteCount = candidate.vote_count ?? 0;
  const sampleConfidence = maxVoteCount > 0 ? Math.log10(voteCount + 1) / Math.log10(maxVoteCount + 1) : 0;
  return voteAverage * sampleConfidence;
}

/** Weighted-average of only the components that have real data, renormalized to [0, 1]. See WEIGHTS doc above. */
function combineScores(components) {
  const available = components.filter((c) => c.available);
  const totalWeight = available.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;
  return available.reduce((sum, c) => sum + c.score * c.weight, 0) / totalWeight;
}

/**
 * Scores one candidate movie against a user (or single-movie, for
 * Similar Movies) profile. Returns the composite score plus exactly
 * which genres/keywords/cast/director matched, so the UI can build an
 * explanation strictly from real matches (see explain.js) - never a
 * fabricated reason.
 */
export function scoreMovie(candidate, profile, { maxVoteCount = 1 } = {}) {
  const genre = overlapScore(candidate.genre_ids, profile.genreWeights);
  const keyword = overlapScore(candidate.keyword_ids, profile.keywordWeights);
  const cast = overlapScore(candidate.cast_ids, profile.castWeights);
  const director = directorScore(candidate, profile.directorWeights);

  const candidateVector = termFrequencyVector(tokenize(candidate.overview));
  const textAvailable = profile.textVector.size > 0 && candidateVector.size > 0;
  const text = { score: textAvailable ? cosineSimilarity(candidateVector, profile.textVector) : 0, available: textAvailable };

  const quality = { score: qualityScore(candidate, maxVoteCount), available: true };

  const score = combineScores([
    { ...genre, weight: WEIGHTS.genre },
    { ...keyword, weight: WEIGHTS.keyword },
    { ...text, weight: WEIGHTS.text },
    { ...cast, weight: WEIGHTS.cast },
    { ...director, weight: WEIGHTS.director },
    { ...quality, weight: WEIGHTS.quality },
  ]);

  return {
    score,
    matchedGenreIds: genre.matchedIds,
    matchedKeywordIds: keyword.matchedIds,
    matchedCastIds: cast.matchedIds,
    matchedDirectorId: director.matchedId,
    breakdown: { genre: genre.score, keyword: keyword.score, text: text.score, cast: cast.score, director: director.score, quality: quality.score },
  };
}

/** Keeps the first occurrence of each movie id, dropping any later duplicates. */
function deduplicateById(movies) {
  const seen = new Set();
  return movies.filter((movie) => {
    if (seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });
}

/**
 * Ranks a pool of candidate movies against a profile and returns the top
 * `limit`, excluding anything in `excludeIds` and de-duplicating by movie
 * id (candidates commonly arrive from multiple merged sources - e.g.
 * several homepage rows, or TMDB's `similar` + `recommendations` lists -
 * so this doesn't trust the caller to have already deduped). Ties are
 * broken by ascending movie id (on top of Array.sort's already-stable
 * ordering) so results are fully deterministic regardless of candidate
 * input order.
 */
export function rankCandidates(candidates, profile, { excludeIds = new Set(), limit = 12 } = {}) {
  const pool = deduplicateById(candidates.filter((movie) => !excludeIds.has(movie.id)));
  const maxVoteCount = Math.max(1, ...pool.map((movie) => movie.vote_count ?? 0));

  return pool
    .map((movie) => ({ movie, ...scoreMovie(movie, profile, { maxVoteCount }) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.movie.id - b.movie.id)
    .slice(0, limit);
}

export { WEIGHTS };

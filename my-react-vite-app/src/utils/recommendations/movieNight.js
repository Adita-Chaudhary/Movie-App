import { cosineSimilarity, termFrequencyVector, tokenize } from './textSimilarity';

/**
 * Picks a "double feature" - two movies that both fit the user's taste
 * but aren't near-duplicates of each other, from an already-ranked
 * recommendations list. Deliberately lightweight: it does no extra
 * scoring pass or API calls, just re-uses the ranked, enriched output
 * useRecommendations.js already computed, so it can never slow down or
 * complicate the core recommendation pipeline it depends on.
 *
 * Heuristic: take the top-ranked recommendation as movie A. Walk the
 * rest of the ranked list for the first candidate that (a) shares at
 * least one genre with A (so the pairing is still "compatible" with the
 * user's taste) but (b) has low overview-text similarity to A (so it
 * isn't just a thematic clone - see textSimilarity.js). If nothing
 * qualifies, fall back to the next-best-ranked movie so the feature
 * still returns a pair rather than nothing.
 */
const MAX_TEXT_SIMILARITY_FOR_VARIETY = 0.25;

function sharedGenreIds(a, b) {
  const bGenres = new Set(b.genre_ids ?? []);
  return (a.genre_ids ?? []).filter((id) => bGenres.has(id));
}

export function pickDoubleFeature(rankedRecommendations, { getGenreName } = {}) {
  if (rankedRecommendations.length < 2) return null;

  const [{ movie: movieA }, ...rest] = rankedRecommendations;
  const vectorA = termFrequencyVector(tokenize(movieA.overview));

  let movieB = null;
  let sharedIds = [];

  for (const { movie: candidate } of rest) {
    const shared = sharedGenreIds(movieA, candidate);
    if (shared.length === 0) continue;

    const vectorCandidate = termFrequencyVector(tokenize(candidate.overview));
    const similarity = cosineSimilarity(vectorA, vectorCandidate);
    if (similarity < MAX_TEXT_SIMILARITY_FOR_VARIETY) {
      movieB = candidate;
      sharedIds = shared;
      break;
    }
  }

  // Nothing satisfied the "compatible but different" bar - still return
  // the two best-ranked movies rather than nothing.
  if (!movieB) {
    movieB = rest[0].movie;
    sharedIds = sharedGenreIds(movieA, movieB);
  }

  const genreNames = getGenreName ? sharedIds.map(getGenreName).filter(Boolean).slice(0, 2) : [];
  const reason =
    genreNames.length > 0
      ? `Both fit your taste for ${genreNames.join(' and ')}, but bring a different mood - a well-rounded double feature.`
      : 'Two picks from your recommendations, paired for a change of pace between them.';

  return { movieA, movieB, reason };
}

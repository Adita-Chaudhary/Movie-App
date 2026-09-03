import { getMovieDetails } from '../../services/movieApi';
import { toMovieSummary } from '../movieSummary';

/**
 * Phase 2 of the personalized recommendation pipeline (see
 * useRecommendations.js for phase 1). Candidate movies from list
 * endpoints (popular/trending/discover/...) never carry keywords, cast,
 * or director - that data only exists on a movie *details* response.
 * Fetching details for every candidate just to score them would mean
 * dozens of extra requests on every homepage load, which the brief
 * explicitly asks to avoid.
 *
 * Instead, this only enriches the small shortlist of candidates that
 * already scored well on the cheap signals (genre + overview text +
 * quality - see scoreCandidates.js), then lets a second scoring pass use
 * the full signal set on just those. It's the standard two-stage
 * "cheap candidate generation, then precise re-ranking" shape used by
 * real recommender systems, scaled down to a handful of requests.
 *
 * These calls aren't wasted even beyond scoring: they go through the
 * exact same cached/de-duplicated getMovieDetails() the Movie Details
 * page itself uses, so if the user opens any of these recommended
 * movies afterward, that page loads instantly from cache.
 */
export async function enrichTopCandidates(scoredCandidates, { shortlistSize = 15 } = {}) {
  const shortlist = scoredCandidates.slice(0, shortlistSize);

  const enriched = await Promise.all(
    shortlist.map(async ({ movie }) => {
      try {
        const details = await getMovieDetails(movie.id);
        return toMovieSummary(details);
      } catch {
        // A single failed detail lookup shouldn't sink the whole
        // recommendation row - fall back to the cheap (genre/text/quality
        // only) version of this candidate instead of dropping it.
        return movie;
      }
    })
  );

  return enriched;
}

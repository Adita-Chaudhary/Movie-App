import { useEffect, useState } from 'react';
import { useWatchlist } from '../contexts/WatchlistContext';
import { useHistory } from '../contexts/HistoryContext';
import { useRatings } from '../contexts/RatingsContext';
import { useGenres } from './useGenres';
import {
  buildUserProfile,
  rankCandidates,
  enrichTopCandidates,
  explainRecommendation,
  dominantSourceType,
} from '../utils/recommendations';

// How much each activity signal counts toward the taste profile. A
// watchlist add and a high (4-5 star) rating are both strong, deliberate
// "I like this" signals; a rating is weighted slightly higher since it's
// the most explicit signal a user can give. A merely-viewed movie is
// weaker (viewing isn't liking), so it counts for less. Ratings below the
// threshold are excluded from the *profile* (they shouldn't push
// recommendations toward what the user disliked) but are still excluded
// from *results* below, since re-recommending something already watched
// and disliked is never useful regardless of profile weighting.
const WATCHLIST_WEIGHT = 1;
const HIGH_RATING_WEIGHT = 1.2;
const VIEWED_WEIGHT = 0.4;
const HIGH_RATING_THRESHOLD = 4;

// How many cheap-scored candidates get the expensive keyword/cast/
// director enrichment (see enrichCandidates.js) before final ranking.
const SHORTLIST_SIZE = 15;

const INITIAL_STATE = { recommendations: [], hasEnoughSignal: false, isPersonalized: false, isLoading: true };

/**
 * Builds "Recommended for You" from the user's own activity, scored
 * against `candidatePool` (movies already fetched for the homepage's
 * other rows - see Home.jsx). See utils/recommendations/index.js for the
 * full pipeline this orchestrates: cheap rank -> bounded enrichment ->
 * final rank -> explanations.
 *
 * `hasEnoughSignal` is false when the user has no watchlist/rating/
 * history activity at all; in that case `recommendations` is still
 * populated, but as a general quality-based fallback rather than a
 * personalized list (see the WATCHED-nothing branch below).
 */
export function useRecommendations(candidatePool, { limit = 12 } = {}) {
  const { watchlist } = useWatchlist();
  const { history } = useHistory();
  const { ratingsList } = useRatings();
  const { genreMap } = useGenres();

  const [state, setState] = useState(INITIAL_STATE);

  useEffect(() => {
    if (candidatePool.length === 0) return undefined;

    let cancelled = false;
    const getGenreName = (id) => genreMap.get(id);

    // Every movie the user has already engaged with - watchlisted,
    // viewed, or rated at any rating - must never come back as a
    // "recommendation", regardless of whether it fed the taste profile.
    const excludeIds = new Set([
      ...watchlist.map((movie) => movie.id),
      ...history.map((movie) => movie.id),
      ...ratingsList.map((entry) => entry.movieId),
    ]);

    const weightedMovies = [
      ...watchlist.map((movie) => ({ movie, weight: WATCHLIST_WEIGHT, sourceType: 'watchlist' })),
      ...ratingsList
        .filter((entry) => entry.rating >= HIGH_RATING_THRESHOLD)
        .map((entry) => ({ movie: entry.movie, weight: HIGH_RATING_WEIGHT, sourceType: 'rating' })),
      ...history.map((movie) => ({ movie, weight: VIEWED_WEIGHT, sourceType: 'history' })),
    ];

    async function compute() {
      if (weightedMovies.length === 0) {
        // Strong general fallback for a new/low-activity user: an empty
        // profile makes every genre/keyword/text/cast/director component
        // score as "unavailable" (see scoreCandidates.js), so ranking
        // against it naturally reduces to quality/popularity alone -
        // "generally well-regarded", not personalized, but never empty.
        const emptyProfile = buildUserProfile([]);
        const fallback = rankCandidates(candidatePool, emptyProfile, { excludeIds, limit });
        if (cancelled) return;
        setState({
          recommendations: fallback.map((result) => ({ ...result, explanation: null })),
          hasEnoughSignal: false,
          isPersonalized: false,
          isLoading: false,
        });
        return;
      }

      const profile = buildUserProfile(weightedMovies);
      const shortlist = rankCandidates(candidatePool, profile, { excludeIds, limit: SHORTLIST_SIZE });
      const enrichedCandidates = await enrichTopCandidates(shortlist);
      if (cancelled) return;

      const finalResults = rankCandidates(enrichedCandidates, profile, { excludeIds, limit });
      const dominantSource = dominantSourceType(profile);

      const withExplanations = finalResults.map((result) => ({
        ...result,
        explanation: explainRecommendation(result.movie, result, { getGenreName, dominantSource }),
      }));

      setState({ recommendations: withExplanations, hasEnoughSignal: true, isPersonalized: true, isLoading: false });
    }

    compute();

    return () => {
      cancelled = true;
    };
  }, [watchlist, history, ratingsList, candidatePool, limit, genreMap]);

  return state;
}

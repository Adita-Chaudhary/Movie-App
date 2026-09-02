import { useMemo } from 'react';
import { useWatchlist } from '../contexts/WatchlistContext';
import { useHistory } from '../contexts/HistoryContext';
import { useRatings } from '../contexts/RatingsContext';
import { buildUserProfile, rankCandidates } from '../utils/recommendations';

// How much each signal counts toward the user's taste profile. A
// watchlist add and a 5-star rating are both strong, deliberate signals
// (weight 1); a merely-viewed movie is a weaker signal (someone can view
// a movie and dislike it), so it counts for less. A poor rating (<=2)
// is excluded entirely rather than negatively weighted, to keep the
// scoring model in scoreCandidates.js simple and easy to explain.
const WATCHLIST_WEIGHT = 1;
const HIGH_RATING_WEIGHT = 1.2;
const VIEWED_WEIGHT = 0.4;
const HIGH_RATING_THRESHOLD = 4;

/**
 * Builds "Recommended for you" from the user's own activity, scored
 * against `candidatePool` (movies already fetched for other homepage
 * rows - see Home.jsx). Reusing that pool instead of issuing new
 * /discover requests keeps this feature free in terms of API calls.
 */
export function useRecommendations(candidatePool, { limit = 12 } = {}) {
  const { watchlist } = useWatchlist();
  const { history } = useHistory();
  const { ratingsList } = useRatings();

  return useMemo(() => {
    const weightedMovies = [
      ...watchlist.map((movie) => ({ movie, weight: WATCHLIST_WEIGHT })),
      ...ratingsList
        .filter((entry) => entry.rating >= HIGH_RATING_THRESHOLD)
        .map((entry) => ({ movie: entry.movie, weight: HIGH_RATING_WEIGHT })),
      ...history.map((movie) => ({ movie, weight: VIEWED_WEIGHT })),
    ];

    if (weightedMovies.length === 0 || candidatePool.length === 0) {
      return { recommendations: [], hasEnoughSignal: false };
    }

    const excludeIds = new Set(weightedMovies.map(({ movie }) => movie.id));
    const profile = buildUserProfile(weightedMovies);
    const recommendations = rankCandidates(candidatePool, profile, { excludeIds, limit });

    return { recommendations, hasEnoughSignal: true };
  }, [watchlist, history, ratingsList, candidatePool, limit]);
}

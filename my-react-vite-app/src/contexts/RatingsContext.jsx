import { createContext, useContext } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

const RatingsContext = createContext(null);

export const useRatings = () => {
  const context = useContext(RatingsContext);
  if (!context) throw new Error('useRatings must be used within a RatingsProvider');
  return context;
};

const STORAGE_KEY = 'movienest.ratings.v1';

/**
 * Ratings are stored keyed by movieId for O(1) lookup/update, with a
 * denormalized `movie` snapshot (poster, title, genres, overview...) so
 * the Ratings tab and the recommendation engine can use them without an
 * extra API call.
 *
 * Shape is intentionally shaped like a future backend record:
 *   { movieId, movie, rating, review, createdAt, updatedAt }
 * so moving this to a real API (once auth exists) is a storage-layer
 * swap, not a data-model rewrite - the context's public API
 * (rateMovie/deleteRating/getRating) would stay the same.
 */
export function RatingsProvider({ children }) {
  const [ratingsById, setRatingsById] = useLocalStorageState(STORAGE_KEY, {});

  const getRating = (movieId) => ratingsById[movieId];

  const rateMovie = (movie, { rating, review = '' }) => {
    const now = new Date().toISOString();
    setRatingsById((prev) => {
      const existing = prev[movie.id];
      return {
        ...prev,
        [movie.id]: {
          movieId: movie.id,
          movie,
          rating,
          review,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        },
      };
    });
  };

  const deleteRating = (movieId) => {
    setRatingsById((prev) => {
      const next = { ...prev };
      delete next[movieId];
      return next;
    });
  };

  const ratingsList = Object.values(ratingsById).sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  const value = {
    ratingsById,
    ratingsList,
    getRating,
    rateMovie,
    deleteRating,
  };

  return <RatingsContext.Provider value={value}>{children}</RatingsContext.Provider>;
}

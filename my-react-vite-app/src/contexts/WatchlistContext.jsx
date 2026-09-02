import { createContext, useContext, useEffect } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { readJSON, removeKey } from '../utils/storage';

const WatchlistContext = createContext(null);

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) throw new Error('useWatchlist must be used within a WatchlistProvider');
  return context;
};

const STORAGE_KEY = 'movienest.watchlist.v1';
const LEGACY_KEY = 'favorites'; // key used by the app's original "favorites" feature

export function WatchlistProvider({ children }) {
  const [watchlist, setWatchlist] = useLocalStorageState(STORAGE_KEY, []);

  // One-time migration: carry over anyone's existing "favorites" list into
  // the new watchlist so upgrading the app doesn't lose their data.
  useEffect(() => {
    const legacy = readJSON(LEGACY_KEY, null);
    if (legacy && legacy.length > 0) {
      setWatchlist((prev) => {
        const existingIds = new Set(prev.map((movie) => movie.id));
        const merged = [...prev, ...legacy.filter((movie) => !existingIds.has(movie.id))];
        return merged;
      });
      removeKey(LEGACY_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isInWatchlist = (movieId) => watchlist.some((movie) => movie.id === movieId);

  const addToWatchlist = (movie) => {
    setWatchlist((prev) => (prev.some((m) => m.id === movie.id) ? prev : [movie, ...prev]));
  };

  const removeFromWatchlist = (movieId) => {
    setWatchlist((prev) => prev.filter((movie) => movie.id !== movieId));
  };

  const toggleWatchlist = (movie) => {
    if (isInWatchlist(movie.id)) removeFromWatchlist(movie.id);
    else addToWatchlist(movie);
  };

  const value = {
    watchlist,
    count: watchlist.length,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
  };

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

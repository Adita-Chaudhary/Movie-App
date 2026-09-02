import { createContext, useContext } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

const HistoryContext = createContext(null);

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) throw new Error('useHistory must be used within a HistoryProvider');
  return context;
};

const STORAGE_KEY = 'movienest.history.v1';
const MAX_HISTORY_SIZE = 30;

export function HistoryProvider({ children }) {
  const [history, setHistory] = useLocalStorageState(STORAGE_KEY, []);

  const addToHistory = (movie) => {
    setHistory((prev) => {
      // Drop any existing entry for this movie so re-viewing it moves it
      // back to the front instead of creating a duplicate.
      const withoutMovie = prev.filter((entry) => entry.id !== movie.id);
      const entry = { ...movie, viewedAt: new Date().toISOString() };
      return [entry, ...withoutMovie].slice(0, MAX_HISTORY_SIZE);
    });
  };

  const clearHistory = () => setHistory([]);

  const value = { history, addToHistory, clearHistory };

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

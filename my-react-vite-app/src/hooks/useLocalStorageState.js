import { useEffect, useState } from 'react';
import { readJSON, writeJSON } from '../utils/storage';

/**
 * useState that mirrors its value to localStorage under `key`.
 * Used by the watchlist/history/ratings/theme contexts so persistence
 * logic lives in one place instead of being duplicated per context.
 */
export function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => readJSON(key, initialValue));

  useEffect(() => {
    writeJSON(key, state);
  }, [key, state]);

  return [state, setState];
}

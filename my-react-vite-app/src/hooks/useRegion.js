import { useLocalStorageState } from './useLocalStorageState';
import { detectLikelyRegion } from '../utils/region';

const STORAGE_KEY = 'movienest.region.v1';

/**
 * The user's selected Where-to-Watch region, persisted across sessions.
 * Defaults to a locale-derived guess (see utils/region.js) the very
 * first time it's read, then sticks to whatever the user picks.
 */
export function useRegion() {
  return useLocalStorageState(STORAGE_KEY, detectLikelyRegion());
}

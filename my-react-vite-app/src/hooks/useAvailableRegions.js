import { useEffect, useState } from 'react';
import { getAvailableRegions } from '../services/movieApi';
import { sortRegionsByName } from '../utils/region';

/** TMDB's list of regions with watch-provider data, for the region selector (see utils/region.js). */
export function useAvailableRegions() {
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getAvailableRegions()
      .then((data) => {
        if (!cancelled) setRegions(sortRegionsByName(data.results ?? []));
      })
      .catch(() => {
        // Non-critical - WhereToWatch falls back to whichever regions
        // the current movie actually has data for.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return regions;
}

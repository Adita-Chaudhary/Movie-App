import { useEffect, useState } from 'react';
import { getWatchProviders } from '../services/movieApi';

/**
 * Where-to-watch data for one movie, keyed by region. Fetched once per
 * movie (TMDB returns every region in one response - see movieApi.js),
 * so the region selector switching regions never triggers another
 * request; it just reads a different key of `providersByRegion`.
 */
export function useWatchProviders(movieId) {
  const [providersByRegion, setProvidersByRegion] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!movieId) return undefined;

    let cancelled = false;
    setStatus('loading');

    getWatchProviders(movieId)
      .then((data) => {
        if (cancelled) return;
        setProvidersByRegion(data.results ?? {});
        setStatus('success');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? 'Failed to load watch providers.');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [movieId]);

  return { providersByRegion, status, error, isLoading: status === 'loading', isError: status === 'error' };
}

import { useEffect, useState } from 'react';
import { getMovieDetails } from '../services/movieApi';

export function useMovieDetails(movieId) {
  const [movie, setMovie] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!movieId) return undefined;

    const controller = new AbortController();
    setStatus('loading');
    setMovie(null);

    getMovieDetails(movieId, { signal: controller.signal })
      .then((data) => {
        setMovie(data);
        setStatus('success');
      })
      .catch((err) => {
        if (err.isAborted) return;
        setError(err.message ?? 'Failed to load this movie.');
        setStatus('error');
      });

    return () => controller.abort();
  }, [movieId]);

  return { movie, status, error, isLoading: status === 'loading', isError: status === 'error' };
}

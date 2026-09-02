import { useEffect, useState } from 'react';

/**
 * Generic "load a page-1 movie list" hook shared by the homepage rows
 * (trending/popular/top-rated/upcoming). Each row owns its own loading
 * and error state so one failing category never breaks the rest of the
 * page.
 */
export function useMovieList(fetcher, deps = []) {
  const [movies, setMovies] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');

    fetcher(1, { signal: controller.signal })
      .then((data) => {
        setMovies(data.results ?? []);
        setStatus('success');
      })
      .catch((err) => {
        if (err.isAborted) return;
        setError(err.message ?? 'Failed to load movies.');
        setStatus('error');
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { movies, status, error, isLoading: status === 'loading', isError: status === 'error' };
}

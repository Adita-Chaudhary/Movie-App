import { useEffect, useState } from 'react';
import { searchMovies } from '../services/movieApi';
import { useDebounce } from './useDebounce';

const MIN_QUERY_LENGTH = 2;
const SUGGESTION_LIMIT = 6;
const DEBOUNCE_MS = 300;

/**
 * Movie suggestions for the search bar's autocomplete dropdown - reuses
 * the existing searchMovies() service function (same one the Search page
 * uses), just capped to a handful of results. Debounced so typing
 * doesn't fire a request per keystroke, and each request aborts the
 * previous one so a slow early response can never overwrite a newer,
 * faster one (classic out-of-order-response race).
 */
export function useMovieSuggestions(query) {
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);
  const trimmed = debouncedQuery.trim();
  const isEligible = trimmed.length >= MIN_QUERY_LENGTH;

  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

  useEffect(() => {
    if (!isEligible) {
      setSuggestions([]);
      setStatus('idle');
      return undefined;
    }

    const controller = new AbortController();
    setStatus('loading');

    searchMovies(trimmed, { page: 1, signal: controller.signal })
      .then((data) => {
        setSuggestions((data.results ?? []).slice(0, SUGGESTION_LIMIT));
        setStatus('success');
      })
      .catch((err) => {
        if (err.isAborted) return;
        setStatus('error');
      });

    return () => controller.abort();
  }, [trimmed, isEligible]);

  return { suggestions, status, isEligible };
}

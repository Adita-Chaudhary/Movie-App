import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMovieList } from './useMovieList';

// Regression test: useMovieList must call its fetcher the same way the real
// TMDB endpoint functions (getPopularMovies, getTrendingMovies, ...) are
// declared - fetcher(page, { signal }) - not fetcher({ signal }). Calling it
// with a single options object silently sent that object as the `page`
// value, which TMDB rejected with "Invalid page ... expected to be an
// integer."
describe('useMovieList', () => {
  it('calls the fetcher with page 1 as a number and a real AbortSignal', async () => {
    const fetcher = vi.fn().mockResolvedValue({ results: [{ id: 1 }] });

    renderHook(() => useMovieList(fetcher, []));

    await waitFor(() => expect(fetcher).toHaveBeenCalled());

    const [page, options] = fetcher.mock.calls[0];
    expect(page).toBe(1);
    expect(Number.isInteger(page)).toBe(true);
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it('transitions from loading to success and exposes the fetched movies', async () => {
    const fetcher = vi.fn().mockResolvedValue({ results: [{ id: 1 }, { id: 2 }] });

    const { result } = renderHook(() => useMovieList(fetcher, []));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.movies).toHaveLength(2);
  });

  it('surfaces an error only when the request actually fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Invalid page: Pages start at 1 and max at 500.'));

    const { result } = renderHook(() => useMovieList(fetcher, []));

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toMatch(/Invalid page/);
  });
});

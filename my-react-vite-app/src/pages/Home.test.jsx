import { StrictMode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './Home';
import { AppProviders } from '../contexts/AppProviders';
import { clearCache } from '../services/cache';

/**
 * Integration regression test for the "homepage stuck on skeleton
 * loaders" bug. Renders the real Home page tree - real useMovieList,
 * real tmdbClient/cache.js, real contexts - under <StrictMode>, exactly
 * as main.jsx renders the app. React 18 StrictMode double-invokes effects
 * in development (mount -> cleanup -> mount), which is what exposed the
 * cache.js/tmdbClient.js dedupe+abort race: only mocking `fetch` (not the
 * hook or the service functions) lets that race actually occur here, the
 * same way it did in the browser.
 */

function moviePage(idOffset, count = 2) {
  return {
    page: 1,
    total_pages: 1,
    results: Array.from({ length: count }, (_, i) => ({
      id: idOffset + i,
      title: `Movie ${idOffset + i}`,
      genre_ids: [28],
      overview: 'A test overview about a hero saving the world.',
      vote_average: 7.5,
      vote_count: 500,
      release_date: '2024-01-01',
      poster_path: null,
    })),
  };
}

function mockFetchByCategory() {
  // A faithful fetch mock: it must actually react to an AbortSignal (like
  // the real Fetch API) instead of unconditionally resolving, or it can
  // never reproduce the StrictMode double-invoke abort race this test
  // guards against.
  return vi.fn(
    (url, init) =>
      new Promise((resolve, reject) => {
        const href = url.toString();
        let body = { page: 1, total_pages: 0, results: [] };
        if (href.includes('/trending/movie/week')) body = moviePage(100);
        else if (href.includes('/movie/popular')) body = moviePage(200);
        else if (href.includes('/movie/top_rated')) body = moviePage(300);
        else if (href.includes('/movie/upcoming')) body = moviePage(400);

        const rejectAsAborted = () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        };

        if (init?.signal) {
          if (init.signal.aborted) {
            rejectAsAborted();
            return;
          }
          init.signal.addEventListener('abort', rejectAsAborted);
        }

        // Resolve on a later microtask so a signal aborted synchronously
        // (StrictMode's double-invoke cleanup) has a chance to reject
        // first, exactly like a real in-flight fetch would.
        Promise.resolve().then(() => resolve({ ok: true, json: async () => body }));
      })
  );
}

function renderHome() {
  return render(
    <StrictMode>
      <MemoryRouter>
        <AppProviders>
          <Home />
        </AppProviders>
      </MemoryRouter>
    </StrictMode>
  );
}

describe('Home page (integration, StrictMode)', () => {
  beforeEach(() => {
    clearCache();
    globalThis.fetch = mockFetchByCategory();
  });

  it('replaces skeletons with real movies for every homepage row despite StrictMode double-invoking effects', async () => {
    renderHome();

    // Skeletons are present immediately (status starts as 'loading').
    expect(screen.getAllByRole('status', { name: /loading movies/i }).length).toBeGreaterThan(0);

    // Each row must resolve to real titles - this is exactly what stayed
    // stuck forever before the fix.
    await waitFor(() => expect(screen.getByText('Movie 100')).toBeInTheDocument()); // Trending
    await waitFor(() => expect(screen.getByText('Movie 200')).toBeInTheDocument()); // Popular
    await waitFor(() => expect(screen.getByText('Movie 300')).toBeInTheDocument()); // Top Rated
    await waitFor(() => expect(screen.getByText('Movie 400')).toBeInTheDocument()); // Upcoming

    // No row should still be showing a skeleton once its data has loaded.
    expect(screen.queryAllByRole('status', { name: /loading movies/i })).toHaveLength(0);

    // Each category's endpoint should only be hit once despite the
    // double-invoke (dedupe still works correctly).
    const trendingCalls = globalThis.fetch.mock.calls.filter(([u]) => u.toString().includes('/trending/movie/week'));
    expect(trendingCalls).toHaveLength(1);
  });
});

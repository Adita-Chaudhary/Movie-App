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

function movieDetailsResponse(id) {
  return {
    id,
    title: `Movie ${id}`,
    genres: [{ id: 28, name: 'Action' }],
    overview: 'A test overview about a hero saving the world.',
    vote_average: 7.5,
    vote_count: 500,
    runtime: 110,
    release_date: '2024-01-01',
    poster_path: null,
    backdrop_path: null,
    credits: { cast: [], crew: [] },
    keywords: { keywords: [] },
    similar: { results: [] },
    recommendations: { results: [] },
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
        const singleMovieMatch = href.match(/\/movie\/(\d+)\?/);

        if (href.includes('/trending/movie/week')) body = moviePage(100);
        else if (href.includes('/movie/popular')) body = moviePage(200);
        else if (href.includes('/movie/top_rated')) body = moviePage(300);
        else if (href.includes('/movie/upcoming')) body = moviePage(400);
        else if (href.includes('/genre/movie/list')) body = { genres: [{ id: 28, name: 'Action' }] };
        else if (singleMovieMatch) body = movieDetailsResponse(Number(singleMovieMatch[1]));

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
    // stuck forever before the fix. Use getAllByText/queryAllByText (not
    // getByText) because the same movies can legitimately also appear in
    // the "Popular Picks" fallback recommendations row (no personal
    // activity is seeded in this test), which would otherwise make
    // getByText fail on ambiguous multiple matches.
    await waitFor(() => expect(screen.getAllByText('Movie 100').length).toBeGreaterThan(0)); // Trending
    await waitFor(() => expect(screen.getAllByText('Movie 200').length).toBeGreaterThan(0)); // Popular
    await waitFor(() => expect(screen.getAllByText('Movie 300').length).toBeGreaterThan(0)); // Top Rated
    await waitFor(() => expect(screen.getAllByText('Movie 400').length).toBeGreaterThan(0)); // Upcoming

    // No row should still be showing a skeleton once its data has loaded.
    expect(screen.queryAllByRole('status', { name: /loading movies/i })).toHaveLength(0);

    // Each category's endpoint should only be hit once despite the
    // double-invoke (dedupe still works correctly).
    const trendingCalls = globalThis.fetch.mock.calls.filter(([u]) => u.toString().includes('/trending/movie/week'));
    expect(trendingCalls).toHaveLength(1);
  });

  it('runs the full personalized pipeline (profile -> shortlist -> enrichment -> re-rank -> explanations) and excludes already-rated movies even when poorly rated', async () => {
    // A high rating - this should drive the taste profile (genre Action).
    localStorage.setItem(
      'movienest.ratings.v1',
      JSON.stringify({
        900: {
          movieId: 900,
          movie: {
            id: 900,
            title: 'Loved Movie',
            genre_ids: [28],
            overview: 'A hero saves the world from a hero saving the world.',
            vote_average: 8,
            vote_count: 1000,
          },
          rating: 5,
          review: '',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        // A poorly-rated movie that ALSO happens to be in the candidate
        // pool (id 100, same as a "Trending" movie) - this must never be
        // recommended back, even though it isn't part of the taste
        // profile (only ratings >= 4 feed the profile).
        100: {
          movieId: 100,
          movie: { id: 100, title: 'Movie 100', genre_ids: [28], overview: '', vote_average: 3, vote_count: 200 },
          rating: 1,
          review: '',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      })
    );

    renderHome();

    // Wait for the *actual enriched recommendations* to render, not just
    // the row title (which shows during loading too, to avoid a title
    // flicker - see RecommendationRow.jsx). The real signal that the full
    // async pipeline (profile -> shortlist -> enrichment -> re-rank) has
    // finished is the row's own loading skeleton disappearing.
    const getRecommendationSection = () => screen.getByText('Recommended for You').closest('section');
    await waitFor(() => {
      expect(getRecommendationSection().querySelector('[role="status"]')).toBeNull();
    });

    // The personalized row must have replaced the fallback framing.
    expect(screen.queryByText('Popular Picks')).not.toBeInTheDocument();

    // The poorly-rated movie must never appear as a recommendation, even
    // though it shares the profile's genre and would otherwise score well.
    expect(getRecommendationSection()).not.toHaveTextContent('Movie 100');

    // At least one recommended card should carry an honest, matched-signal
    // explanation (genre overlap with "Loved Movie"'s Action genre).
    const reasons = getRecommendationSection().querySelectorAll('.recommendation-reason');
    expect(reasons.length).toBeGreaterThan(0);
    expect([...reasons].some((el) => el.textContent.includes('Action'))).toBe(true);
  });
});

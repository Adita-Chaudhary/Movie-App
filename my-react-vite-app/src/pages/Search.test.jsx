import { StrictMode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Search from './Search';
import { AppProviders } from '../contexts/AppProviders';
import { clearCache } from '../services/cache';

/**
 * Search.jsx's no-query "browse with filters" path calls discoverMovies,
 * which - like the homepage list endpoints - goes through tmdbClient's
 * default cache:true/de-duplicated path, so it was exposed to the same
 * StrictMode double-invoke abort race fixed in tmdbClient.js (see
 * Home.test.jsx and tmdbClient.test.js). This confirms Search still
 * resolves to real results under StrictMode instead of hanging.
 */

function moviePage(idOffset) {
  return {
    page: 1,
    total_pages: 1,
    results: [
      {
        id: idOffset,
        title: `Discovered Movie ${idOffset}`,
        genre_ids: [28],
        overview: 'A test overview.',
        vote_average: 7,
        vote_count: 300,
        release_date: '2024-01-01',
        poster_path: null,
      },
    ],
  };
}

function signalAwareFetchMock(responder) {
  return vi.fn(
    (url, init) =>
      new Promise((resolve, reject) => {
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
        Promise.resolve().then(() => resolve({ ok: true, json: async () => responder(url.toString()) }));
      })
  );
}

describe('Search page (integration, StrictMode)', () => {
  beforeEach(() => {
    clearCache();
  });

  it('loads real results for the filter-only /discover path without hanging on skeletons', async () => {
    globalThis.fetch = signalAwareFetchMock((href) => {
      if (href.includes('/discover/movie')) return moviePage(500);
      if (href.includes('/genre/movie/list')) return { genres: [{ id: 28, name: 'Action' }] };
      return { page: 1, results: [] };
    });

    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/search']}>
          <AppProviders>
            <Search />
          </AppProviders>
        </MemoryRouter>
      </StrictMode>
    );

    await waitFor(() => expect(screen.getByText('Discovered Movie 500')).toBeInTheDocument());
  });

  it('loads real results for a text query via /search/movie', async () => {
    globalThis.fetch = signalAwareFetchMock((href) => {
      if (href.includes('/search/movie')) return moviePage(600);
      if (href.includes('/genre/movie/list')) return { genres: [] };
      return { page: 1, results: [] };
    });

    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/search?q=inception']}>
          <AppProviders>
            <Search />
          </AppProviders>
        </MemoryRouter>
      </StrictMode>
    );

    await waitFor(() => expect(screen.getByText('Discovered Movie 600')).toBeInTheDocument());
  });
});

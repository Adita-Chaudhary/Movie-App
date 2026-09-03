import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WhereToWatch from './WhereToWatch';
import { clearCache } from '../services/cache';

function mockFetch(responder) {
  return vi.fn((url) =>
    Promise.resolve({
      ok: true,
      json: async () => responder(url.toString()),
    })
  );
}

const REGIONS_RESPONSE = {
  results: [
    { iso_3166_1: 'US', english_name: 'United States' },
    { iso_3166_1: 'GB', english_name: 'United Kingdom' },
  ],
};

function providersResponse(byRegion) {
  return { id: 1, results: byRegion };
}

describe('WhereToWatch', () => {
  beforeEach(() => {
    clearCache();
    localStorage.clear();
    localStorage.setItem('movienest.region.v1', JSON.stringify('US'));
  });

  it('shows a loading state, then stream/rent/buy categories with provider logos', async () => {
    globalThis.fetch = mockFetch((href) => {
      if (href.includes('/watch/providers/regions')) return REGIONS_RESPONSE;
      if (href.includes('/watch/providers')) {
        return providersResponse({
          US: {
            link: 'https://www.themoviedb.org/movie/1/watch',
            flatrate: [{ provider_id: 1, provider_name: 'Netflix', logo_path: '/netflix.jpg' }],
            rent: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: null }],
          },
        });
      }
      return {};
    });

    render(<WhereToWatch movieId={1} />);

    await waitFor(() => expect(screen.getByText('Stream')).toBeInTheDocument());
    expect(screen.getByAltText('Netflix')).toHaveAttribute('src', expect.stringContaining('/netflix.jpg'));

    // Missing logo_path falls back to a text badge instead of a broken image.
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByText('Apple TV')).toBeInTheDocument();
    expect(screen.queryByAltText('Apple TV')).not.toBeInTheDocument();

    // A category with no data (Buy, Free, Ads) must not render at all.
    expect(screen.queryByText('Buy')).not.toBeInTheDocument();
    expect(screen.queryByText('Free')).not.toBeInTheDocument();

    // The TMDB link action is present.
    expect(screen.getByRole('link', { name: /view watch options on tmdb/i })).toHaveAttribute(
      'href',
      'https://www.themoviedb.org/movie/1/watch'
    );

    // Required JustWatch attribution is present but unobtrusive (plain text, not a heading).
    expect(screen.getByText(/provided by justwatch/i)).toBeInTheDocument();
  });

  it('shows a polished empty state when the selected region has no providers', async () => {
    globalThis.fetch = mockFetch((href) => {
      if (href.includes('/watch/providers/regions')) return REGIONS_RESPONSE;
      if (href.includes('/watch/providers')) return providersResponse({ GB: { flatrate: [{ provider_id: 1, provider_name: 'BBC iPlayer' }] } });
      return {};
    });

    render(<WhereToWatch movieId={1} />);

    await waitFor(() => expect(screen.getByText('No streaming options found for this region')).toBeInTheDocument());
  });

  it('switching the region selector requires no additional API request (all regions come in one response)', async () => {
    const fetchMock = mockFetch((href) => {
      if (href.includes('/watch/providers/regions')) return REGIONS_RESPONSE;
      if (href.includes('/watch/providers')) {
        return providersResponse({
          US: { flatrate: [{ provider_id: 1, provider_name: 'Netflix', logo_path: '/n.jpg' }] },
          GB: { flatrate: [{ provider_id: 2, provider_name: 'BBC iPlayer', logo_path: '/b.jpg' }] },
        });
      }
      return {};
    });
    globalThis.fetch = fetchMock;

    render(<WhereToWatch movieId={1} />);

    await waitFor(() => expect(screen.getByAltText('Netflix')).toBeInTheDocument());
    const callsBeforeSwitch = fetchMock.mock.calls.filter(([u]) => u.toString().includes('/watch/providers') && !u.toString().includes('regions')).length;

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText(/select region/i), 'GB');

    await waitFor(() => expect(screen.getByAltText('BBC iPlayer')).toBeInTheDocument());
    const callsAfterSwitch = fetchMock.mock.calls.filter(([u]) => u.toString().includes('/watch/providers') && !u.toString().includes('regions')).length;

    expect(callsAfterSwitch).toBe(callsBeforeSwitch);
  });

  it('shows an error state when the request fails', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(Object.assign(new Error('fail'), { name: 'TypeError' })));

    render(<WhereToWatch movieId={1} />);

    await waitFor(() => expect(screen.getByText(/network error/i)).toBeInTheDocument());
  });
});

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

// A provider id that is deliberately NOT in the verified mapping
// (providerUrls.js), paired with a name that doesn't match any known
// service either - used to test the "stays non-clickable" path without
// accidentally colliding with a real mapped service.
const UNMAPPED_PROVIDER = { provider_id: 555501, provider_name: 'Regional Streamer X', logo_path: '/regional.jpg' };

describe('WhereToWatch', () => {
  beforeEach(() => {
    clearCache();
    localStorage.clear();
    localStorage.setItem('movienest.region.v1', JSON.stringify('US'));
  });

  it('shows a loading state, then stream/rent categories with provider logos', async () => {
    globalThis.fetch = mockFetch((href) => {
      if (href.includes('/watch/providers/regions')) return REGIONS_RESPONSE;
      if (href.includes('/watch/providers')) {
        return providersResponse({
          US: {
            link: 'https://www.themoviedb.org/movie/1/watch',
            flatrate: [UNMAPPED_PROVIDER],
            rent: [{ provider_id: 2, provider_name: 'Apple TV Store', logo_path: null }],
          },
        });
      }
      return {};
    });

    render(<WhereToWatch movieId={1} />);

    await waitFor(() => expect(screen.getByText('Stream')).toBeInTheDocument());
    expect(screen.getByAltText('Regional Streamer X')).toHaveAttribute('src', expect.stringContaining('/regional.jpg'));

    // Missing logo_path falls back to a text badge instead of a broken image.
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByText('Apple TV Store')).toBeInTheDocument();
    expect(screen.queryByAltText('Apple TV Store')).not.toBeInTheDocument();

    // A category with no data (Buy, Free, Ads) must not render at all.
    expect(screen.queryByText('Buy')).not.toBeInTheDocument();
    expect(screen.queryByText('Free')).not.toBeInTheDocument();
  });

  it('no longer renders the "View Watch Options on TMDB" link or the JustWatch attribution line (moved to the app footer)', async () => {
    globalThis.fetch = mockFetch((href) => {
      if (href.includes('/watch/providers/regions')) return REGIONS_RESPONSE;
      if (href.includes('/watch/providers')) {
        return providersResponse({
          US: {
            link: 'https://www.themoviedb.org/movie/1/watch',
            flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.jpg' }],
          },
        });
      }
      return {};
    });

    render(<WhereToWatch movieId={1} />);

    await waitFor(() => expect(screen.getByAltText('Netflix')).toBeInTheDocument());

    expect(screen.queryByRole('link', { name: /view watch options on tmdb/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/justwatch/i)).not.toBeInTheDocument();
  });

  it('shows a polished empty state when the selected region has no providers', async () => {
    globalThis.fetch = mockFetch((href) => {
      if (href.includes('/watch/providers/regions')) return REGIONS_RESPONSE;
      if (href.includes('/watch/providers')) return providersResponse({ GB: { flatrate: [UNMAPPED_PROVIDER] } });
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
          US: { flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/n.jpg' }] },
          GB: { flatrate: [{ provider_id: 337, provider_name: 'Disney Plus', logo_path: '/d.jpg' }] },
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

    await waitFor(() => expect(screen.getByAltText('Disney Plus')).toBeInTheDocument());
    const callsAfterSwitch = fetchMock.mock.calls.filter(([u]) => u.toString().includes('/watch/providers') && !u.toString().includes('regions')).length;

    expect(callsAfterSwitch).toBe(callsBeforeSwitch);
  });

  it('shows an error state when the request fails', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(Object.assign(new Error('fail'), { name: 'TypeError' })));

    render(<WhereToWatch movieId={1} />);

    await waitFor(() => expect(screen.getByText(/network error/i)).toBeInTheDocument());
  });

  it('renders a provider with a URL TMDB actually supplied as an accessible external link', async () => {
    globalThis.fetch = mockFetch((href) => {
      if (href.includes('/watch/providers/regions')) return REGIONS_RESPONSE;
      if (href.includes('/watch/providers')) {
        return providersResponse({
          US: {
            flatrate: [
              {
                provider_id: 8,
                provider_name: 'Netflix',
                logo_path: '/netflix.jpg',
                // Hypothetical - TMDB doesn't supply this today, but the
                // component must prefer it over the local mapping if present.
                provider_url: 'https://www.netflix.com/title/123',
              },
            ],
          },
        });
      }
      return {};
    });

    render(<WhereToWatch movieId={1} />);

    await waitFor(() => expect(screen.getByAltText('Netflix')).toBeInTheDocument());

    const providerLink = screen.getByRole('link', { name: /open netflix/i });
    expect(providerLink).toHaveAttribute('href', 'https://www.netflix.com/title/123');
    expect(providerLink).toHaveAttribute('target', '_blank');
    expect(providerLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('renders a well-known provider as a clickable link to its verified official homepage', async () => {
    globalThis.fetch = mockFetch((href) => {
      if (href.includes('/watch/providers/regions')) return REGIONS_RESPONSE;
      if (href.includes('/watch/providers')) {
        return providersResponse({
          US: { flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.jpg' }] },
        });
      }
      return {};
    });

    render(<WhereToWatch movieId={1} />);

    await waitFor(() => expect(screen.getByAltText('Netflix')).toBeInTheDocument());

    const providerLink = screen.getByRole('link', { name: /open netflix/i });
    expect(providerLink).toHaveAttribute('href', 'https://www.netflix.com/');
    expect(providerLink).toHaveAttribute('target', '_blank');
    expect(providerLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('renders a provider with no verified URL as a non-interactive, non-fabricated item', async () => {
    globalThis.fetch = mockFetch((href) => {
      if (href.includes('/watch/providers/regions')) return REGIONS_RESPONSE;
      if (href.includes('/watch/providers')) return providersResponse({ US: { flatrate: [UNMAPPED_PROVIDER] } });
      return {};
    });

    render(<WhereToWatch movieId={1} />);

    await waitFor(() => expect(screen.getByAltText('Regional Streamer X')).toBeInTheDocument());

    // No link was fabricated for this provider - it must not be an <a>.
    expect(screen.queryByRole('link', { name: /open regional streamer x/i })).not.toBeInTheDocument();
    expect(screen.getByAltText('Regional Streamer X').closest('a')).toBeNull();
  });
});

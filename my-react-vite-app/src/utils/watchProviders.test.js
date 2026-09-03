import { describe, expect, it } from 'vitest';
import { getProviderUrl } from './watchProviders';

describe('getProviderUrl', () => {
  it('resolves a known provider (by TMDB provider_id) to its verified official homepage', () => {
    const netflix = { provider_id: 8, provider_name: 'Netflix', logo_path: '/logo.jpg' };
    expect(getProviderUrl(netflix)).toBe('https://www.netflix.com/');
  });

  it('resolves a provider via the name fallback when the id is not in the id table', () => {
    const provider = { provider_id: 999999, provider_name: 'Netflix' };
    expect(getProviderUrl(provider)).toBe('https://www.netflix.com/');
  });

  it('returns undefined for a provider with neither a known id nor a matching name (no fabrication)', () => {
    const provider = { provider_id: 424242, provider_name: 'Some Regional Service Nobody Has Heard Of' };
    expect(getProviderUrl(provider)).toBeUndefined();
  });

  it('never constructs a URL out of the provider name or id itself', () => {
    // If this were fabricating a URL, some naive slugified guess like
    // "https://www.someregionalservicenobodyhasheardof.com" might appear.
    // It must not.
    const provider = { provider_id: 424242, provider_name: 'Totally Unknown Streamer' };
    expect(getProviderUrl(provider)).toBeUndefined();
  });

  it('prefers a URL TMDB actually supplied on the provider object over the local mapping', () => {
    const provider = { provider_id: 8, provider_name: 'Netflix', provider_url: 'https://example.com/from-tmdb' };
    expect(getProviderUrl(provider)).toBe('https://example.com/from-tmdb');
  });

  it('handles missing/empty input gracefully', () => {
    expect(getProviderUrl(undefined)).toBeUndefined();
    expect(getProviderUrl({})).toBeUndefined();
  });
});

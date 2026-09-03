import { describe, expect, it } from 'vitest';
import { PROVIDER_URLS_BY_ID, getOfficialProviderUrl } from './providerUrls';

describe('PROVIDER_URLS_BY_ID', () => {
  it('maps well-known TMDB provider ids to their real https homepage', () => {
    // A representative sample of the mapping - every value must be a
    // real https URL (verified by hand, never generated).
    const sample = [8, 9, 350, 337, 15, 1899, 3, 192];
    sample.forEach((id) => {
      expect(PROVIDER_URLS_BY_ID[id]).toMatch(/^https:\/\//);
    });
  });
});

describe('getOfficialProviderUrl', () => {
  it('resolves by provider_id first', () => {
    expect(getOfficialProviderUrl({ provider_id: 8, provider_name: 'Netflix' })).toBe('https://www.netflix.com/');
  });

  it('falls back to a normalized name match when the id is unknown', () => {
    expect(getOfficialProviderUrl({ provider_id: 555555, provider_name: 'Netflix' })).toBe('https://www.netflix.com/');
  });

  it('normalizes case, whitespace, and punctuation for the name fallback', () => {
    expect(getOfficialProviderUrl({ provider_id: 555555, provider_name: '  Paramount+  ' })).toBe(
      'https://www.paramountplus.com/'
    );
    expect(getOfficialProviderUrl({ provider_id: 555555, provider_name: 'DISNEY PLUS' })).toBe(
      'https://www.disneyplus.com/'
    );
  });

  it('returns undefined for a genuinely unknown provider rather than guessing', () => {
    expect(getOfficialProviderUrl({ provider_id: 777777, provider_name: 'Some Obscure Regional Streamer' })).toBeUndefined();
  });

  it('treats different Apple TV listings (app vs store) as the same official destination', () => {
    expect(getOfficialProviderUrl({ provider_id: 350, provider_name: 'Apple TV' })).toBe('https://tv.apple.com/');
    expect(getOfficialProviderUrl({ provider_id: 2, provider_name: 'Apple TV Store' })).toBe('https://tv.apple.com/');
  });

  it('handles missing input gracefully', () => {
    expect(getOfficialProviderUrl(undefined)).toBeUndefined();
    expect(getOfficialProviderUrl({})).toBeUndefined();
  });
});

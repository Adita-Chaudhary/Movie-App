import { describe, expect, it } from 'vitest';
import { DEFAULT_REGION, detectLikelyRegion, sortRegionsByName, withCurrentRegionOption } from './region';

describe('detectLikelyRegion', () => {
  it('extracts the region subtag from a locale like "en-GB"', () => {
    expect(detectLikelyRegion(['en-GB'])).toBe('GB');
  });

  it('checks each locale in order and uses the first one with a region subtag', () => {
    expect(detectLikelyRegion(['fr', 'de-DE', 'en-US'])).toBe('DE');
  });

  it('uppercases a lowercase region subtag', () => {
    expect(detectLikelyRegion(['en-gb'])).toBe('GB');
  });

  it('falls back to the default region when no locale has a region subtag', () => {
    expect(detectLikelyRegion(['fr', 'en'])).toBe(DEFAULT_REGION);
  });

  it('falls back to the default region for an empty or missing locale list', () => {
    expect(detectLikelyRegion([])).toBe(DEFAULT_REGION);
    expect(detectLikelyRegion(undefined)).toBe(DEFAULT_REGION);
  });
});

describe('sortRegionsByName', () => {
  it('alphabetizes by english_name', () => {
    const regions = [
      { iso_3166_1: 'GB', english_name: 'United Kingdom' },
      { iso_3166_1: 'CA', english_name: 'Canada' },
      { iso_3166_1: 'US', english_name: 'United States of America' },
    ];

    expect(sortRegionsByName(regions).map((r) => r.iso_3166_1)).toEqual(['CA', 'GB', 'US']);
  });

  it('does not mutate the input array', () => {
    const regions = [{ iso_3166_1: 'GB', english_name: 'United Kingdom' }, { iso_3166_1: 'CA', english_name: 'Canada' }];
    const original = [...regions];

    sortRegionsByName(regions);

    expect(regions).toEqual(original);
  });
});

describe('withCurrentRegionOption', () => {
  it('returns the list unchanged when the current region is already present', () => {
    const regions = [{ iso_3166_1: 'US', english_name: 'United States' }];
    expect(withCurrentRegionOption(regions, 'US')).toEqual(regions);
  });

  it('prepends the current region when missing, so the selector never shows blank', () => {
    const regions = [{ iso_3166_1: 'US', english_name: 'United States' }];
    const result = withCurrentRegionOption(regions, 'XX');

    expect(result[0]).toEqual({ iso_3166_1: 'XX', english_name: 'XX' });
    expect(result).toHaveLength(2);
  });
});

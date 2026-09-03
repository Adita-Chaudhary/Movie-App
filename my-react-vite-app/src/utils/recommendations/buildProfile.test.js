import { describe, expect, it } from 'vitest';
import { buildUserProfile, dominantSourceType } from './buildProfile';

const SCI_FI = 878;
const ACTION = 28;

function movie(overrides) {
  return {
    id: overrides.id,
    genre_ids: overrides.genre_ids ?? [],
    overview: overrides.overview ?? '',
    keyword_ids: overrides.keyword_ids ?? [],
    cast_ids: overrides.cast_ids ?? [],
    director_id: overrides.director_id ?? null,
    ...overrides,
  };
}

describe('buildUserProfile', () => {
  it('weight-sums genres across source movies', () => {
    const profile = buildUserProfile([
      { movie: movie({ id: 1, genre_ids: [SCI_FI, ACTION] }), weight: 1 },
      { movie: movie({ id: 2, genre_ids: [SCI_FI] }), weight: 0.5 },
    ]);

    expect(profile.genreWeights.get(SCI_FI)).toBeCloseTo(1.5);
    expect(profile.genreWeights.get(ACTION)).toBeCloseTo(1);
  });

  it('weight-sums keywords, cast, and director independently of genre', () => {
    const profile = buildUserProfile([
      { movie: movie({ id: 1, keyword_ids: [10, 20], cast_ids: [100], director_id: 500 }), weight: 1 },
      { movie: movie({ id: 2, keyword_ids: [10], cast_ids: [100, 200], director_id: 500 }), weight: 2 },
    ]);

    expect(profile.keywordWeights.get(10)).toBeCloseTo(3);
    expect(profile.keywordWeights.get(20)).toBeCloseTo(1);
    expect(profile.castWeights.get(100)).toBeCloseTo(3);
    expect(profile.castWeights.get(200)).toBeCloseTo(2);
    expect(profile.directorWeights.get(500)).toBeCloseTo(3);
  });

  it('builds a combined text vector from overviews, scaled by weight', () => {
    const profile = buildUserProfile([
      { movie: movie({ id: 1, overview: 'a robot fights aliens in space' }), weight: 1 },
      { movie: movie({ id: 2, overview: 'space pirates' }), weight: 2 },
    ]);
    expect(profile.textVector.get('robot')).toBe(1);
    expect(profile.textVector.get('space')).toBe(1 + 2); // appears once in each overview, weighted
  });

  it('produces empty maps for an empty input (used for the low-activity fallback)', () => {
    const profile = buildUserProfile([]);
    expect(profile.genreWeights.size).toBe(0);
    expect(profile.keywordWeights.size).toBe(0);
    expect(profile.castWeights.size).toBe(0);
    expect(profile.directorWeights.size).toBe(0);
    expect(profile.textVector.size).toBe(0);
  });

  it('tallies total weight per sourceType', () => {
    const profile = buildUserProfile([
      { movie: movie({ id: 1 }), weight: 1, sourceType: 'watchlist' },
      { movie: movie({ id: 2 }), weight: 1.2, sourceType: 'rating' },
      { movie: movie({ id: 3 }), weight: 0.4, sourceType: 'history' },
      { movie: movie({ id: 4 }), weight: 1.2, sourceType: 'rating' },
    ]);

    expect(profile.sourceTypeWeights.rating).toBeCloseTo(2.4);
    expect(profile.sourceTypeWeights.watchlist).toBeCloseTo(1);
    expect(profile.sourceTypeWeights.history).toBeCloseTo(0.4);
  });
});

describe('dominantSourceType', () => {
  it('returns the sourceType with the most total weight', () => {
    const profile = buildUserProfile([
      { movie: movie({ id: 1 }), weight: 1, sourceType: 'watchlist' },
      { movie: movie({ id: 2 }), weight: 1.2, sourceType: 'rating' },
      { movie: movie({ id: 3 }), weight: 1.2, sourceType: 'rating' },
    ]);

    expect(dominantSourceType(profile)).toBe('rating');
  });

  it('returns null for an empty profile', () => {
    expect(dominantSourceType(buildUserProfile([]))).toBeNull();
  });
});

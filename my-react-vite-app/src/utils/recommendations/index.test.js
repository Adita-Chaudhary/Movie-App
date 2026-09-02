import { describe, expect, it } from 'vitest';
import { buildUserProfile, rankCandidates } from './index';

const SCI_FI = 878;
const ACTION = 28;
const ROMANCE = 10749;

function movie(overrides) {
  return {
    id: overrides.id,
    genre_ids: overrides.genre_ids ?? [],
    overview: overrides.overview ?? '',
    vote_average: overrides.vote_average ?? 7,
    vote_count: overrides.vote_count ?? 1000,
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

  it('builds a combined text vector from overviews', () => {
    const profile = buildUserProfile([
      { movie: movie({ id: 1, overview: 'a robot fights aliens in space' }), weight: 1 },
    ]);
    expect(profile.textVector.get('robot')).toBe(1);
    expect(profile.textVector.get('space')).toBe(1);
  });
});

describe('rankCandidates', () => {
  it('ranks a genre- and theme-matching movie above an unrelated one', () => {
    const profile = buildUserProfile([
      {
        movie: movie({ id: 1, genre_ids: [SCI_FI, ACTION], overview: 'a robot fights aliens in deep space' }),
        weight: 1,
      },
    ]);

    const scifiSequel = movie({
      id: 2,
      genre_ids: [SCI_FI, ACTION],
      overview: 'another robot battles aliens across the galaxy',
    });
    const romance = movie({ id: 3, genre_ids: [ROMANCE], overview: 'two people fall in love at a wedding' });

    const results = rankCandidates([romance, scifiSequel], profile, { limit: 2 });

    expect(results[0].movie.id).toBe(2);
    expect(results[0].matchedGenreIds).toContain(SCI_FI);
  });

  it('excludes movies already in excludeIds', () => {
    const profile = buildUserProfile([{ movie: movie({ id: 1, genre_ids: [SCI_FI] }), weight: 1 }]);
    const candidate = movie({ id: 2, genre_ids: [SCI_FI] });

    const results = rankCandidates([candidate], profile, { excludeIds: new Set([2]) });

    expect(results).toHaveLength(0);
  });

  it('falls back to the quality tie-breaker alone when the profile has no genre/text signal', () => {
    const profile = buildUserProfile([]);
    const results = rankCandidates([movie({ id: 1, genre_ids: [SCI_FI] })], profile);

    expect(results).toHaveLength(1);
    expect(results[0].breakdown.genre).toBe(0);
    expect(results[0].breakdown.text).toBe(0);
    expect(results[0].breakdown.quality).toBeGreaterThan(0);
  });
});

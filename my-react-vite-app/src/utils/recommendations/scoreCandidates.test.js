import { describe, expect, it } from 'vitest';
import { buildUserProfile } from './buildProfile';
import { rankCandidates, scoreMovie } from './scoreCandidates';

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
    keyword_ids: overrides.keyword_ids ?? [],
    cast_ids: overrides.cast_ids ?? [],
    director_id: overrides.director_id ?? null,
    ...overrides,
  };
}

describe('scoreMovie', () => {
  it('scores a candidate matching genre, keyword, cast, and director higher than one matching only genre', () => {
    const profile = buildUserProfile([
      {
        movie: movie({
          id: 1,
          genre_ids: [SCI_FI],
          keyword_ids: [10],
          cast_ids: [100],
          director_id: 500,
          overview: 'a hero saves the galaxy from an alien invasion',
        }),
        weight: 1,
      },
    ]);

    const richMatch = movie({
      id: 2,
      genre_ids: [SCI_FI],
      keyword_ids: [10],
      cast_ids: [100],
      director_id: 500,
      overview: 'a hero saves the galaxy from an alien invasion',
    });
    const genreOnlyMatch = movie({ id: 3, genre_ids: [SCI_FI], overview: 'unrelated plot about cooking' });

    // Both candidates share the same vote_average/vote_count (see movie()'s
    // defaults), so maxVoteCount just needs to be consistent across both
    // calls - scoreMovie doesn't compute it itself (rankCandidates does,
    // from the real pool); passing a mismatched one here would make the
    // quality component dominate arbitrarily and drown out the signals
    // this test is actually about.
    const options = { maxVoteCount: 1000 };
    const rich = scoreMovie(richMatch, profile, options);
    const genreOnly = scoreMovie(genreOnlyMatch, profile, options);

    expect(rich.score).toBeGreaterThan(genreOnly.score);
    expect(rich.matchedKeywordIds).toContain(10);
    expect(rich.matchedCastIds).toContain(100);
    expect(rich.matchedDirectorId).toBe(500);
  });

  it('never reports a matched signal that did not actually match (no fabricated matches)', () => {
    const profile = buildUserProfile([
      { movie: movie({ id: 1, genre_ids: [SCI_FI], keyword_ids: [10], cast_ids: [100], director_id: 500 }), weight: 1 },
    ]);
    const unrelated = movie({ id: 2, genre_ids: [ROMANCE], keyword_ids: [99], cast_ids: [999], director_id: 111 });

    const result = scoreMovie(unrelated, profile);

    expect(result.matchedGenreIds).toEqual([]);
    expect(result.matchedKeywordIds).toEqual([]);
    expect(result.matchedCastIds).toEqual([]);
    expect(result.matchedDirectorId).toBeNull();
  });

  it('renormalizes around available signals instead of penalizing missing keyword/cast/director data', () => {
    // Two source movies with identical genres, but only one profile also
    // has keyword/cast/director data (as if only one movie was actually
    // detail-fetched before being watchlisted/rated).
    const genreOnlyProfile = buildUserProfile([{ movie: movie({ id: 1, genre_ids: [SCI_FI] }), weight: 1 }]);
    const richProfile = buildUserProfile([
      { movie: movie({ id: 1, genre_ids: [SCI_FI], keyword_ids: [10], cast_ids: [100], director_id: 500 }), weight: 1 },
    ]);

    // A candidate that only has genre data available (typical list-endpoint shape).
    const candidate = movie({ id: 2, genre_ids: [SCI_FI] });

    const scoreAgainstGenreOnly = scoreMovie(candidate, genreOnlyProfile).score;
    const scoreAgainstRich = scoreMovie(candidate, richProfile).score;

    // The candidate matches genre identically in both cases; missing
    // keyword/cast/director data on the *candidate* side should not
    // change its score just because the profile happens to have that data.
    expect(scoreAgainstGenreOnly).toBeCloseTo(scoreAgainstRich, 5);
  });

  it('computes quality as always available even with an empty profile', () => {
    const profile = buildUserProfile([]);
    const result = scoreMovie(movie({ id: 1, vote_average: 8, vote_count: 5000 }), profile, { maxVoteCount: 5000 });

    expect(result.breakdown.genre).toBe(0);
    expect(result.breakdown.quality).toBeGreaterThan(0);
    expect(result.score).toBeCloseTo(result.breakdown.quality, 10); // only available component
  });
});

describe('rankCandidates', () => {
  it('ranks a genre- and theme-matching movie above an unrelated one', () => {
    const profile = buildUserProfile([
      { movie: movie({ id: 1, genre_ids: [SCI_FI, ACTION], overview: 'a robot fights aliens in deep space' }), weight: 1 },
    ]);

    const scifiSequel = movie({ id: 2, genre_ids: [SCI_FI, ACTION], overview: 'another robot battles aliens across the galaxy' });
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

  it('falls back to the quality tie-breaker alone when the profile has no signal', () => {
    const profile = buildUserProfile([]);
    const results = rankCandidates([movie({ id: 1, genre_ids: [SCI_FI] })], profile);

    expect(results).toHaveLength(1);
    expect(results[0].breakdown.genre).toBe(0);
    expect(results[0].breakdown.quality).toBeGreaterThan(0);
  });

  it('never returns duplicate movie ids even if the candidate array has duplicates', () => {
    const profile = buildUserProfile([{ movie: movie({ id: 1, genre_ids: [SCI_FI] }), weight: 1 }]);
    const dup = movie({ id: 2, genre_ids: [SCI_FI] });

    const results = rankCandidates([dup, { ...dup }], profile);
    const ids = results.map((r) => r.movie.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is deterministic: ties are broken by ascending movie id, not input order', () => {
    const profile = buildUserProfile([]); // empty profile -> every candidate scores by quality alone
    const a = movie({ id: 50, vote_average: 7, vote_count: 100 });
    const b = movie({ id: 10, vote_average: 7, vote_count: 100 }); // identical score to `a`

    const resultsOrderA = rankCandidates([a, b], profile).map((r) => r.movie.id);
    const resultsOrderB = rankCandidates([b, a], profile).map((r) => r.movie.id);

    expect(resultsOrderA).toEqual([10, 50]);
    expect(resultsOrderB).toEqual([10, 50]);
  });
});

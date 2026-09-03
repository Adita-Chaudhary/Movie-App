import { describe, expect, it } from 'vitest';
import { explainRecommendation } from './explain';

function scoreResult(overrides = {}) {
  return {
    matchedGenreIds: [],
    matchedKeywordIds: [],
    matchedCastIds: [],
    matchedDirectorId: null,
    breakdown: { genre: 0, keyword: 0, text: 0, cast: 0, director: 0, quality: 0 },
    ...overrides,
  };
}

describe('explainRecommendation', () => {
  it('produces no reason when nothing matched (never fabricates an explanation)', () => {
    const candidate = { id: 1, genre_ids: [], keyword_ids: [], cast_ids: [], director_id: null };
    const { reasons, summary } = explainRecommendation(candidate, scoreResult(), { getGenreName: () => undefined });

    expect(reasons).toEqual([]);
    expect(summary).toBe('');
  });

  it('includes a genre reason only when matchedGenreIds is non-empty, using the provided name lookup', () => {
    const candidate = { id: 1 };
    const result = scoreResult({ matchedGenreIds: [878, 28] });

    const { reasons, summary } = explainRecommendation(candidate, result, {
      getGenreName: (id) => ({ 878: 'Sci-Fi', 28: 'Action' })[id],
    });

    expect(reasons[0]).toContain('Sci-Fi');
    expect(reasons[0]).toContain('Action');
    expect(summary).toContain('Recommended because');
  });

  it('includes a director reason only when matchedDirectorId is set and the candidate carries a name', () => {
    const candidate = { id: 1, director_name: 'Christopher Nolan' };
    const result = scoreResult({ matchedDirectorId: 999 });

    const { reasons } = explainRecommendation(candidate, result, {});

    expect(reasons.some((r) => r.includes('Christopher Nolan'))).toBe(true);
  });

  it('includes a cast reason resolved from the candidate\'s own id/name arrays', () => {
    const candidate = { id: 1, cast_ids: [10, 20, 30], cast_names: ['Actor A', 'Actor B', 'Actor C'] };
    const result = scoreResult({ matchedCastIds: [20] });

    const { reasons } = explainRecommendation(candidate, result, {});

    expect(reasons.some((r) => r.includes('Actor B'))).toBe(true);
    expect(reasons.some((r) => r.includes('Actor A'))).toBe(false);
  });

  it('includes a keyword reason resolved from the candidate\'s own id/name arrays', () => {
    const candidate = { id: 1, keyword_ids: [5, 6], keyword_names: ['time travel', 'heist'] };
    const result = scoreResult({ matchedKeywordIds: [6] });

    const { reasons } = explainRecommendation(candidate, result, {});

    expect(reasons.some((r) => r.includes('heist'))).toBe(true);
  });

  it('falls back to a generic text-similarity reason only when nothing more specific matched and text score is meaningful', () => {
    const candidate = { id: 1 };
    const strongText = scoreResult({ breakdown: { genre: 0, keyword: 0, text: 0.5, cast: 0, director: 0, quality: 0 } });
    const weakText = scoreResult({ breakdown: { genre: 0, keyword: 0, text: 0.05, cast: 0, director: 0, quality: 0 } });

    expect(explainRecommendation(candidate, strongText, {}).reasons.length).toBe(1);
    expect(explainRecommendation(candidate, weakText, {}).reasons.length).toBe(0);
  });

  it('never mentions quality/popularity as a reason', () => {
    const candidate = { id: 1 };
    const result = scoreResult({
      matchedGenreIds: [878],
      breakdown: { genre: 0.9, keyword: 0, text: 0, cast: 0, director: 0, quality: 0.9 },
    });

    const { summary } = explainRecommendation(candidate, result, { getGenreName: () => 'Sci-Fi' });

    expect(summary.toLowerCase()).not.toContain('popular');
  });

  it('appends the dominant activity source when provided', () => {
    const candidate = { id: 1 };
    const result = scoreResult({ matchedGenreIds: [878] });

    const { summary } = explainRecommendation(candidate, result, {
      getGenreName: () => 'Sci-Fi',
      dominantSource: 'rating',
    });

    expect(summary).toContain('rated highly');
  });
});

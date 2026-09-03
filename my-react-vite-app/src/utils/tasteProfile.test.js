import { describe, expect, it } from 'vitest';
import { buildTasteProfile } from './tasteProfile';

const SCI_FI = 878;
const ACTION = 28;

function movie(overrides) {
  return {
    id: overrides.id,
    genre_ids: overrides.genre_ids ?? [],
    overview: overrides.overview ?? '',
    keyword_ids: overrides.keyword_ids ?? [],
    keyword_names: overrides.keyword_names ?? [],
    cast_ids: overrides.cast_ids ?? [],
    cast_names: overrides.cast_names ?? [],
    director_id: overrides.director_id ?? null,
    director_name: overrides.director_name ?? null,
    ...overrides,
  };
}

describe('buildTasteProfile', () => {
  it('reports insufficient data below the minimum distinct-movie threshold', () => {
    const profile = buildTasteProfile({ watchlist: [movie({ id: 1 })], history: [], ratingsList: [] });
    expect(profile.hasEnoughData).toBe(false);
  });

  it('does not double-count the same movie appearing in multiple activity lists toward the threshold', () => {
    const shared = movie({ id: 1 });
    // Same movie in watchlist and history - still only 1 distinct movie.
    const profile = buildTasteProfile({ watchlist: [shared], history: [shared], ratingsList: [] });
    expect(profile.hasEnoughData).toBe(false);
  });

  it('surfaces top genres once enough activity exists', () => {
    const watchlist = [
      movie({ id: 1, genre_ids: [SCI_FI] }),
      movie({ id: 2, genre_ids: [SCI_FI, ACTION] }),
      movie({ id: 3, genre_ids: [ACTION] }),
    ];
    const profile = buildTasteProfile({ watchlist, history: [], ratingsList: [] });

    expect(profile.hasEnoughData).toBe(true);
    expect(profile.topGenreIds).toContain(SCI_FI);
    expect(profile.topGenreIds).toContain(ACTION);
  });

  it('computes the average of the user\'s own star ratings', () => {
    const ratingsList = [
      { movieId: 1, movie: movie({ id: 1 }), rating: 5 },
      { movieId: 2, movie: movie({ id: 2 }), rating: 3 },
      { movieId: 3, movie: movie({ id: 3 }), rating: 4 },
    ];
    const profile = buildTasteProfile({ watchlist: [], history: [], ratingsList });

    expect(profile.averageRating).toBeCloseTo(4, 5);
  });

  it('only surfaces a favorite cast member/director once they recur (not from a single appearance)', () => {
    const watchlist = [
      movie({ id: 1, cast_ids: [100], cast_names: ['Actor A'], director_id: 500, director_name: 'Director X' }),
      movie({ id: 2, cast_ids: [200], cast_names: ['Actor B'] }), // Actor A/Director X appear only once total
      movie({ id: 3, genre_ids: [ACTION] }),
    ];
    const profile = buildTasteProfile({ watchlist, history: [], ratingsList: [] });

    expect(profile.topCast).toEqual([]);
    expect(profile.topDirector).toBeNull();
  });

  it('surfaces a favorite cast member/director once they appear at least twice', () => {
    const watchlist = [
      movie({ id: 1, cast_ids: [100], cast_names: ['Actor A'], director_id: 500, director_name: 'Director X' }),
      movie({ id: 2, cast_ids: [100], cast_names: ['Actor A'], director_id: 500, director_name: 'Director X' }),
      movie({ id: 3, genre_ids: [ACTION] }),
    ];
    const profile = buildTasteProfile({ watchlist, history: [], ratingsList: [] });

    expect(profile.topCast[0].name).toBe('Actor A');
    expect(profile.topCast[0].count).toBe(2);
    expect(profile.topDirector.name).toBe('Director X');
    expect(profile.topDirector.count).toBe(2);
  });

  it('surfaces recurring keyword themes weighted by source', () => {
    const watchlist = [
      movie({ id: 1, keyword_names: ['time travel'] }),
      movie({ id: 2, keyword_names: ['time travel', 'heist'] }),
      movie({ id: 3, genre_ids: [ACTION] }),
    ];
    const profile = buildTasteProfile({ watchlist, history: [], ratingsList: [] });

    expect(profile.topKeywordNames[0]).toBe('time travel');
  });
});

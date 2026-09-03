import { describe, expect, it } from 'vitest';
import { pickDoubleFeature } from './movieNight';

const SCI_FI = 878;
const ACTION = 28;
const ROMANCE = 10749;

function ranked(id, overrides = {}) {
  return {
    movie: {
      id,
      genre_ids: overrides.genre_ids ?? [],
      overview: overrides.overview ?? '',
    },
    score: overrides.score ?? 1,
  };
}

describe('pickDoubleFeature', () => {
  it('returns null when fewer than 2 recommendations are available', () => {
    expect(pickDoubleFeature([])).toBeNull();
    expect(pickDoubleFeature([ranked(1)])).toBeNull();
  });

  it('picks the top-ranked movie as movie A', () => {
    const list = [
      ranked(1, { genre_ids: [SCI_FI], overview: 'a hero explores a distant galaxy' }),
      ranked(2, { genre_ids: [SCI_FI, ACTION], overview: 'a heist crew plans a daring robbery in the city' }),
    ];

    const pair = pickDoubleFeature(list);

    expect(pair.movieA.id).toBe(1);
  });

  it('prefers a compatible-but-different movie B (shared genre, low overview overlap) over a near-duplicate', () => {
    const list = [
      ranked(1, { genre_ids: [SCI_FI], overview: 'a hero explores a distant galaxy in search of a new home' }),
      ranked(2, { genre_ids: [SCI_FI], overview: 'a hero explores a distant galaxy in search of a new home' }), // near-duplicate of A
      ranked(3, { genre_ids: [SCI_FI, ACTION], overview: 'a heist crew plans a daring robbery in the city' }), // compatible, different
    ];

    const pair = pickDoubleFeature(list);

    expect(pair.movieB.id).toBe(3);
  });

  it('falls back to the next-best-ranked movie when nothing satisfies the variety bar', () => {
    const list = [
      ranked(1, { genre_ids: [SCI_FI], overview: 'a hero explores a distant galaxy' }),
      ranked(2, { genre_ids: [ROMANCE], overview: 'a couple falls in love in Paris' }), // no shared genre with A
    ];

    const pair = pickDoubleFeature(list);

    expect(pair.movieB.id).toBe(2);
    expect(pair.reason).toContain('recommendations');
  });

  it('explains the pairing using the shared genre names when available', () => {
    const list = [
      ranked(1, { genre_ids: [SCI_FI], overview: 'a hero explores a distant galaxy in search of a new home' }),
      ranked(2, { genre_ids: [SCI_FI, ACTION], overview: 'a heist crew plans a daring robbery in the city' }),
    ];

    const pair = pickDoubleFeature(list, { getGenreName: (id) => ({ [SCI_FI]: 'Sci-Fi' })[id] });

    expect(pair.reason).toContain('Sci-Fi');
  });

  it('is deterministic for the same input list', () => {
    const list = [
      ranked(1, { genre_ids: [SCI_FI], overview: 'a hero explores a distant galaxy' }),
      ranked(2, { genre_ids: [SCI_FI, ACTION], overview: 'a heist crew plans a daring robbery' }),
      ranked(3, { genre_ids: [ROMANCE], overview: 'a couple falls in love' }),
    ];

    const first = pickDoubleFeature(list);
    const second = pickDoubleFeature(list);

    expect(first.movieA.id).toBe(second.movieA.id);
    expect(first.movieB.id).toBe(second.movieB.id);
  });
});

import { describe, expect, it } from 'vitest';
import { buildFilmography, knownForMovies } from './personFilmography';

describe('buildFilmography', () => {
  it('merges cast and directing credits for the same movie into one entry with both roles', () => {
    const movieCredits = {
      cast: [{ id: 1, title: 'Actor-Director Movie', character: 'The Lead', release_date: '2020-01-01' }],
      crew: [{ id: 1, title: 'Actor-Director Movie', job: 'Director', release_date: '2020-01-01' }],
    };

    const filmography = buildFilmography(movieCredits);

    expect(filmography).toHaveLength(1);
    expect(filmography[0].roles).toEqual(expect.arrayContaining(['as The Lead', 'Director']));
  });

  it('only surfaces the Director crew job, not every crew credit', () => {
    const movieCredits = {
      cast: [],
      crew: [
        { id: 1, title: 'Some Movie', job: 'Director', release_date: '2020-01-01' },
        { id: 2, title: 'Other Movie', job: 'Sound Editor', release_date: '2019-01-01' },
      ],
    };

    const filmography = buildFilmography(movieCredits);

    expect(filmography.map((f) => f.id)).toEqual([1]);
  });

  it('sorts by release date, most recent first', () => {
    const movieCredits = {
      cast: [
        { id: 1, title: 'Old Movie', release_date: '2000-01-01' },
        { id: 2, title: 'New Movie', release_date: '2020-01-01' },
      ],
      crew: [],
    };

    const filmography = buildFilmography(movieCredits);

    expect(filmography.map((f) => f.id)).toEqual([2, 1]);
  });

  it('handles missing release dates without crashing, sorting them last', () => {
    const movieCredits = {
      cast: [
        { id: 1, title: 'Undated Movie', release_date: '' },
        { id: 2, title: 'Dated Movie', release_date: '2020-01-01' },
      ],
      crew: [],
    };

    const filmography = buildFilmography(movieCredits);

    expect(filmography.map((f) => f.id)).toEqual([2, 1]);
  });

  it('returns an empty array when there are no credits at all', () => {
    expect(buildFilmography(undefined)).toEqual([]);
    expect(buildFilmography({})).toEqual([]);
  });
});

describe('knownForMovies', () => {
  it('returns the most popular acting credits, most popular first', () => {
    const movieCredits = {
      cast: [
        { id: 1, title: 'Niche Movie', popularity: 5 },
        { id: 2, title: 'Blockbuster', popularity: 500 },
        { id: 3, title: 'Mid Movie', popularity: 50 },
      ],
    };

    const result = knownForMovies(movieCredits, 2);

    expect(result.map((m) => m.id)).toEqual([2, 3]);
  });

  it('handles missing credits gracefully', () => {
    expect(knownForMovies(undefined)).toEqual([]);
  });
});

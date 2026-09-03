import { describe, expect, it } from 'vitest';
import { rankSimilarMovies } from './similarMovies';

const SCI_FI = 878;
const ROMANCE = 10749;

function movie(overrides) {
  return {
    id: overrides.id,
    genre_ids: overrides.genre_ids ?? [],
    overview: overrides.overview ?? '',
    vote_average: overrides.vote_average ?? 7,
    vote_count: overrides.vote_count ?? 500,
    ...overrides,
  };
}

describe('rankSimilarMovies', () => {
  const currentMovie = movie({
    id: 1,
    genre_ids: [SCI_FI],
    overview: 'a lone astronaut fights to survive after a mission goes wrong',
  });

  it('removes the current movie from its own similar-movies results', () => {
    const similar = [currentMovie, movie({ id: 2, genre_ids: [SCI_FI] })];

    const results = rankSimilarMovies(currentMovie, similar, []);

    expect(results.some((r) => r.movie.id === 1)).toBe(false);
  });

  it('deduplicates a movie that appears in both the similar and recommended lists', () => {
    const shared = movie({ id: 2, genre_ids: [SCI_FI] });

    const results = rankSimilarMovies(currentMovie, [shared], [shared]);

    expect(results.filter((r) => r.movie.id === 2)).toHaveLength(1);
  });

  it('boosts (consensus) a movie both TMDB lists agree on above one only one list suggests, all else equal', () => {
    const agreedUpon = movie({ id: 2, genre_ids: [SCI_FI], overview: currentMovie.overview });
    const onlyInOneList = movie({ id: 3, genre_ids: [SCI_FI], overview: currentMovie.overview });

    const results = rankSimilarMovies(currentMovie, [agreedUpon, onlyInOneList], [agreedUpon]);

    const agreedResult = results.find((r) => r.movie.id === 2);
    const soloResult = results.find((r) => r.movie.id === 3);

    expect(agreedResult.bothListsAgree).toBe(true);
    expect(soloResult.bothListsAgree).toBe(false);
    expect(agreedResult.score).toBeGreaterThan(soloResult.score);
  });

  it('ranks a genuinely similar movie above an unrelated one from a merged pool', () => {
    const related = movie({ id: 2, genre_ids: [SCI_FI], overview: 'an astronaut stranded in deep space' });
    const unrelated = movie({ id: 3, genre_ids: [ROMANCE], overview: 'a couple falls in love in Paris' });

    const results = rankSimilarMovies(currentMovie, [related, unrelated], []);

    expect(results[0].movie.id).toBe(2);
  });

  it('depends only on the movie being viewed, not any external profile - same inputs always rank the same way', () => {
    const related = movie({ id: 2, genre_ids: [SCI_FI], overview: 'an astronaut stranded in deep space' });

    const first = rankSimilarMovies(currentMovie, [related], []);
    const second = rankSimilarMovies(currentMovie, [related], []);

    expect(first[0].score).toBe(second[0].score);
  });
});

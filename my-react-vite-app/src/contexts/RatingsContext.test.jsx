import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { RatingsProvider, useRatings } from './RatingsContext';

const movie = { id: 1, title: 'Movie A' };

function setup() {
  return renderHook(() => useRatings(), { wrapper: RatingsProvider });
}

describe('RatingsContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds a new rating with a review', () => {
    const { result } = setup();
    act(() => result.current.rateMovie(movie, { rating: 5, review: 'Loved it' }));

    const entry = result.current.getRating(1);
    expect(entry.rating).toBe(5);
    expect(entry.review).toBe('Loved it');
    expect(entry.createdAt).toBe(entry.updatedAt);
  });

  it('updates an existing rating without creating a duplicate entry', () => {
    const { result } = setup();
    act(() => result.current.rateMovie(movie, { rating: 3, review: 'Okay' }));
    const firstCreatedAt = result.current.getRating(1).createdAt;

    act(() => result.current.rateMovie(movie, { rating: 4, review: 'Better on rewatch' }));

    expect(result.current.ratingsList).toHaveLength(1);
    expect(result.current.getRating(1).rating).toBe(4);
    expect(result.current.getRating(1).createdAt).toBe(firstCreatedAt);
  });

  it('deletes a rating', () => {
    const { result } = setup();
    act(() => result.current.rateMovie(movie, { rating: 5, review: '' }));
    act(() => result.current.deleteRating(1));

    expect(result.current.getRating(1)).toBeUndefined();
    expect(result.current.ratingsList).toEqual([]);
  });

  it('lists ratings most-recently-updated first', () => {
    const { result } = setup();
    act(() => result.current.rateMovie({ id: 1 }, { rating: 3 }));
    act(() => result.current.rateMovie({ id: 2 }, { rating: 4 }));
    act(() => result.current.rateMovie({ id: 1 }, { rating: 5 }));

    expect(result.current.ratingsList[0].movieId).toBe(1);
  });
});

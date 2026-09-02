import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { WatchlistProvider, useWatchlist } from './WatchlistContext';

const movieA = { id: 1, title: 'Movie A' };
const movieB = { id: 2, title: 'Movie B' };

function setup() {
  return renderHook(() => useWatchlist(), { wrapper: WatchlistProvider });
}

describe('WatchlistContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty', () => {
    const { result } = setup();
    expect(result.current.watchlist).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it('adds a movie to the watchlist', () => {
    const { result } = setup();
    act(() => result.current.addToWatchlist(movieA));
    expect(result.current.watchlist).toHaveLength(1);
    expect(result.current.isInWatchlist(1)).toBe(true);
  });

  it('prevents duplicate entries for the same movie', () => {
    const { result } = setup();
    act(() => result.current.addToWatchlist(movieA));
    act(() => result.current.addToWatchlist(movieA));
    expect(result.current.watchlist).toHaveLength(1);
  });

  it('removes a movie from the watchlist', () => {
    const { result } = setup();
    act(() => result.current.addToWatchlist(movieA));
    act(() => result.current.addToWatchlist(movieB));
    act(() => result.current.removeFromWatchlist(1));
    expect(result.current.watchlist.map((m) => m.id)).toEqual([2]);
  });

  it('toggleWatchlist adds when absent and removes when present', () => {
    const { result } = setup();
    act(() => result.current.toggleWatchlist(movieA));
    expect(result.current.isInWatchlist(1)).toBe(true);
    act(() => result.current.toggleWatchlist(movieA));
    expect(result.current.isInWatchlist(1)).toBe(false);
  });

  it('persists to localStorage', () => {
    const { result } = setup();
    act(() => result.current.addToWatchlist(movieA));
    const stored = JSON.parse(localStorage.getItem('movienest.watchlist.v1'));
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(1);
  });

  it('migrates legacy "favorites" data on first load', () => {
    localStorage.setItem('favorites', JSON.stringify([movieB]));
    const { result } = setup();
    expect(result.current.watchlist.some((m) => m.id === 2)).toBe(true);
    expect(localStorage.getItem('favorites')).toBeNull();
  });
});

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { HistoryProvider, useHistory } from './HistoryContext';

function movie(id) {
  return { id, title: `Movie ${id}` };
}

function setup() {
  return renderHook(() => useHistory(), { wrapper: HistoryProvider });
}

describe('HistoryContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds a viewed movie with a timestamp', () => {
    const { result } = setup();
    act(() => result.current.addToHistory(movie(1)));
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].viewedAt).toBeTruthy();
  });

  it('moves a re-viewed movie to the front instead of duplicating it', () => {
    const { result } = setup();
    act(() => result.current.addToHistory(movie(1)));
    act(() => result.current.addToHistory(movie(2)));
    act(() => result.current.addToHistory(movie(1)));

    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0].id).toBe(1);
  });

  it('caps history at 30 entries, dropping the oldest', () => {
    const { result } = setup();
    act(() => {
      for (let i = 1; i <= 35; i += 1) {
        result.current.addToHistory(movie(i));
      }
    });

    expect(result.current.history).toHaveLength(30);
    expect(result.current.history[0].id).toBe(35);
    expect(result.current.history.some((entry) => entry.id === 1)).toBe(false);
  });

  it('clears history', () => {
    const { result } = setup();
    act(() => result.current.addToHistory(movie(1)));
    act(() => result.current.clearHistory());
    expect(result.current.history).toEqual([]);
  });
});

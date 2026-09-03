import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useExitingItems } from './useExitingItems';

const getId = (item) => item.id;

describe('useExitingItems', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns every current item as not exiting', () => {
    const items = [{ id: 1 }, { id: 2 }];
    const { result } = renderHook(({ items }) => useExitingItems(items, getId), { initialProps: { items } });

    expect(result.current).toEqual([
      { item: { id: 1 }, isExiting: false },
      { item: { id: 2 }, isExiting: false },
    ]);
  });

  it('keeps a removed item in the output as exiting until the duration elapses', () => {
    const { result, rerender } = renderHook(({ items }) => useExitingItems(items, getId, 200), {
      initialProps: { items: [{ id: 1 }, { id: 2 }] },
    });

    rerender({ items: [{ id: 1 }] });

    expect(result.current).toEqual([
      { item: { id: 1 }, isExiting: false },
      { item: { id: 2 }, isExiting: true },
    ]);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toEqual([{ item: { id: 1 }, isExiting: false }]);
  });

  it('does not resurrect an exiting item if it never comes back', () => {
    const { result, rerender } = renderHook(({ items }) => useExitingItems(items, getId, 200), {
      initialProps: { items: [{ id: 1 }] },
    });

    rerender({ items: [] });
    expect(result.current).toEqual([{ item: { id: 1 }, isExiting: true }]);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toEqual([]);
  });
});

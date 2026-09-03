import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRegion } from './useRegion';

describe('useRegion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to a locale-derived region on first use', () => {
    vi.stubGlobal('navigator', { ...navigator, languages: ['en-GB'], language: 'en-GB' });

    const { result } = renderHook(() => useRegion());

    expect(result.current[0]).toBe('GB');
  });

  it('persists the selected region to localStorage', () => {
    const { result } = renderHook(() => useRegion());

    act(() => result.current[1]('FR'));

    expect(result.current[0]).toBe('FR');
    expect(JSON.parse(localStorage.getItem('movienest.region.v1'))).toBe('FR');
  });

  it('reads a previously-persisted region on a fresh mount instead of re-detecting', () => {
    localStorage.setItem('movienest.region.v1', JSON.stringify('JP'));

    const { result } = renderHook(() => useRegion());

    expect(result.current[0]).toBe('JP');
  });
});

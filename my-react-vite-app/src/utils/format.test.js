import { describe, expect, it } from 'vitest';
import { formatRating, formatRuntime, formatYear } from './format';

describe('formatYear', () => {
  it('extracts the year from an ISO date string', () => {
    expect(formatYear('1999-03-31')).toBe('1999');
  });

  it('falls back to TBA when there is no date', () => {
    expect(formatYear('')).toBe('TBA');
    expect(formatYear(undefined)).toBe('TBA');
  });
});

describe('formatRuntime', () => {
  it('formats hours and minutes', () => {
    expect(formatRuntime(142)).toBe('2h 22m');
  });

  it('formats whole hours without a minutes segment', () => {
    expect(formatRuntime(120)).toBe('2h');
  });

  it('formats sub-hour runtimes in minutes only', () => {
    expect(formatRuntime(45)).toBe('45m');
  });

  it('handles missing runtime', () => {
    expect(formatRuntime(0)).toBe('Unknown runtime');
    expect(formatRuntime(undefined)).toBe('Unknown runtime');
  });
});

describe('formatRating', () => {
  it('formats to one decimal place', () => {
    expect(formatRating(7.856)).toBe('7.9');
  });

  it('handles missing rating', () => {
    expect(formatRating(undefined)).toBe('N/A');
  });
});

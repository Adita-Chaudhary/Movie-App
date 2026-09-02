import { describe, expect, it } from 'vitest';
import { cosineSimilarity, termFrequencyVector, tokenize } from './textSimilarity';

describe('tokenize', () => {
  it('lowercases, strips punctuation, and drops short/stopword tokens', () => {
    expect(tokenize('A Hero\'s Journey, Told Again.')).toEqual(['hero', 'journey', 'told', 'again']);
  });

  it('returns an empty array for empty input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize(undefined)).toEqual([]);
  });
});

describe('termFrequencyVector', () => {
  it('counts repeated tokens', () => {
    const vector = termFrequencyVector(['space', 'war', 'space']);
    expect(vector.get('space')).toBe(2);
    expect(vector.get('war')).toBe(1);
  });
});

describe('cosineSimilarity', () => {
  it('is 1 for identical vectors', () => {
    const vector = termFrequencyVector(['robot', 'future', 'robot']);
    expect(cosineSimilarity(vector, vector)).toBeCloseTo(1);
  });

  it('is 0 for vectors with no shared terms', () => {
    const a = termFrequencyVector(['space', 'alien']);
    const b = termFrequencyVector(['romance', 'wedding']);
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it('is between 0 and 1 for partially overlapping vectors', () => {
    const a = termFrequencyVector(['space', 'war', 'robot']);
    const b = termFrequencyVector(['space', 'romance']);
    const score = cosineSimilarity(a, b);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it('handles empty vectors without dividing by zero', () => {
    expect(cosineSimilarity(new Map(), new Map())).toBe(0);
  });
});

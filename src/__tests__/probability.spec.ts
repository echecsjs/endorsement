import { describe, expect, it } from 'vitest';

import { createPrng } from '../prng.js';
import { fideExpectedScore, simulateResult } from '../probability.js';

describe('fideExpectedScore', () => {
  it('returns 0.50 for equal ratings', () => {
    expect(fideExpectedScore(0)).toBe(0.5);
  });

  it('returns 0.50 for small differences (0-3)', () => {
    expect(fideExpectedScore(3)).toBe(0.5);
  });

  it('returns 0.51 for diff 4-10', () => {
    expect(fideExpectedScore(10)).toBe(0.51);
  });

  it('returns higher scores for larger differences', () => {
    expect(fideExpectedScore(100)).toBe(0.64);
    expect(fideExpectedScore(200)).toBe(0.76);
    expect(fideExpectedScore(400)).toBe(0.92);
  });

  it('returns 0.99 for differences >= 736', () => {
    expect(fideExpectedScore(736)).toBe(0.99);
    expect(fideExpectedScore(1000)).toBe(0.99);
  });

  it('uses absolute value of rating diff', () => {
    expect(fideExpectedScore(-100)).toBe(fideExpectedScore(100));
  });
});

describe('simulateResult', () => {
  it('returns only valid results (0, 0.5, or 1)', () => {
    const random = createPrng(42);
    const results = new Set<number>();
    for (let index = 0; index < 500; index++) {
      results.add(simulateResult(0.5, random));
    }
    // With equal expected score, all three outcomes should appear
    expect(results.has(0)).toBe(true);
    expect(results.has(0.5)).toBe(true);
    expect(results.has(1)).toBe(true);
    expect(results.size).toBe(3);
  });

  it('returns draws and wins for favored player', () => {
    const random = createPrng(42);
    const results = new Set<number>();
    for (let index = 0; index < 500; index++) {
      results.add(simulateResult(0.9, random));
    }
    // Highly favored player should produce wins and draws
    expect(results.has(0.5)).toBe(true);
    expect(results.has(1)).toBe(true);
  });

  it('produces more wins for higher expected scores', () => {
    const random = createPrng(99);
    let wins = 0;
    const n = 1000;
    for (let index = 0; index < n; index++) {
      if (simulateResult(0.8, random) === 1) {
        wins++;
      }
    }
    // With expected score 0.8, the higher-rated player should win significantly
    expect(wins / n).toBeGreaterThan(0.3);
  });
});

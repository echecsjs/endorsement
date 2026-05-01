import { describe, expect, it } from 'vitest';

import { createPrng } from '../prng.js';

describe('createPrng', () => {
  it('returns values in [0, 1)', () => {
    const random = createPrng(42);
    for (let index = 0; index < 1000; index++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('is deterministic with the same seed', () => {
    const a = createPrng(12_345);
    const b = createPrng(12_345);
    for (let index = 0; index < 100; index++) {
      expect(a()).toBe(b());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = createPrng(1);
    const b = createPrng(2);
    const valuesA = Array.from({ length: 10 }, () => a());
    const valuesB = Array.from({ length: 10 }, () => b());
    expect(valuesA).not.toEqual(valuesB);
  });

  it('produces reasonable distribution', () => {
    const random = createPrng(99);
    let sum = 0;
    const n = 10_000;
    for (let index = 0; index < n; index++) {
      sum += random();
    }
    const mean = sum / n;
    // Mean should be close to 0.5 for a uniform distribution
    expect(mean).toBeGreaterThan(0.45);
    expect(mean).toBeLessThan(0.55);
  });
});

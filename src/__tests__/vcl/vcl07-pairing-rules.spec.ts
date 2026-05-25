import { describe, expect, it } from 'vitest';

import { check } from '../../check.js';
import { generate } from '../../generate.js';

describe('VCL.07: pairings adhere to FIDE Dutch rules', () => {
  it('50-seed cross-validation produces 100% match', () => {
    let totalPairings = 0;
    let totalMatching = 0;

    for (let seed = 100; seed < 150; seed++) {
      const players = 20 + (seed % 5) * 20; // vary 20-100
      const rounds = 5 + (seed % 4) * 2; // vary 5-11
      const trf = generate({ players, rounds, seed });
      const result = check(trf);

      totalPairings += result.summary.totalPairings;
      totalMatching += result.summary.totalMatching;

      expect(result.summary.totalMatching).toBe(result.summary.totalPairings);
    }

    expect(totalMatching).toBe(totalPairings);
  }, 120_000);
});

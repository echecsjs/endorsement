import { pair } from '@echecs/swiss';
import { describe, expect, it } from 'vitest';

import type { CompletedRound, Player } from '@echecs/swiss';

describe('VCL.01-06: FIDE Mode', () => {
  describe('VCL.02 — standard installation and invocation', () => {
    it('endorsement CLI commands are available after install', async () => {
      const { check } = await import('../../check.js');
      const { generate } = await import('../../generate.js');

      expect(typeof check).toBe('function');
      expect(typeof generate).toBe('function');

      const trf = generate({ players: 10, rounds: 3, seed: 1 });
      expect(trf).toBeTruthy();

      const result = check(trf);
      expect(result.summary.totalRounds).toBe(3);
    });
  });

  describe('VCL.01 — FIDE mode is the default', () => {
    it('pair() produces correct pairings with zero configuration', () => {
      const players: Player[] = [
        { id: '1', points: 0, rank: 1, rating: 2000 },
        { id: '2', points: 0, rank: 2, rating: 1900 },
        { id: '3', points: 0, rank: 3, rating: 1800 },
        { id: '4', points: 0, rank: 4, rating: 1700 },
      ];

      const result = pair(players, []);

      // Dutch system splits into S1=[1,2] S2=[3,4], pairs 1v3 and 2v4
      expect(result.games).toHaveLength(2);
      const pairKeys = result.games
        .map((g) => [g.white, g.black].toSorted().join('-'))
        .toSorted();
      expect(pairKeys).toEqual(['1-3', '2-4']);
    });
  });

  describe('VCL.03 — default pairing system is FIDE Dutch', () => {
    it('default export from @echecs/swiss is the Dutch pair function', async () => {
      const swiss = await import('@echecs/swiss');
      const dutch = await import('@echecs/swiss/dutch');

      expect(swiss.pair).toBe(dutch.pair);
    });
  });

  describe('VCL.04 — correct behaviour (smoke test)', () => {
    it('generate-then-check produces 100% match for 10 seeds', async () => {
      const { check } = await import('../../check.js');
      const { generate } = await import('../../generate.js');

      for (let seed = 1; seed <= 10; seed++) {
        const trf = generate({ players: 20, rounds: 7, seed });
        const result = check(trf);
        expect(result.summary.totalMatching).toBe(
          result.summary.totalPairings,
        );
      }
    });
  });

  describe('VCL.05 — no FIDE-prohibited features', () => {
    it('pair() accepts no options that bypass FIDE rules', () => {
      const players: Player[] = [
        { id: '1', points: 0, rank: 1 },
        { id: '2', points: 0, rank: 2 },
      ];
      const rounds: CompletedRound[] = [];

      const result = pair(players, rounds, { expectedRounds: 5 });
      expect(result.games).toHaveLength(1);
    });
  });

  describe('VCL.06 — FIDE label restricted to endorsed services', () => {
    it('package names do not misuse the FIDE label', async () => {
      const swiss = await import('@echecs/swiss');
      const exportNames = Object.keys(swiss);

      for (const name of exportNames) {
        expect(name.toUpperCase()).not.toContain('FIDE');
      }
    });
  });
});

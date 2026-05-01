import { describe, expect, it } from 'vitest';

import { check } from '../check.js';
import { generate } from '../generate.js';

describe('generate then check (integration)', () => {
  it('generates a tournament and checks it with 100% match', () => {
    const trfContent = generate({
      players: 20,
      rounds: 5,
      seed: 42,
    });

    expect(trfContent).toBeTruthy();
    expect(trfContent).toContain('RTG 42');

    const result = check(trfContent);

    expect(result.summary.totalRounds).toBe(5);
    expect(result.summary.perfectRounds).toBe(5);
    expect(result.summary.totalMatching).toBe(result.summary.totalPairings);
  });

  it('is deterministic with the same seed', () => {
    const trf1 = generate({ players: 10, rounds: 3, seed: 99 });
    const trf2 = generate({ players: 10, rounds: 3, seed: 99 });
    expect(trf1).toBe(trf2);
  });

  it('produces different tournaments with different seeds', () => {
    const trf1 = generate({ players: 10, rounds: 3, seed: 1 });
    const trf2 = generate({ players: 10, rounds: 3, seed: 2 });
    expect(trf1).not.toBe(trf2);
  });

  it('generates valid TRF with correct player count', () => {
    const trfContent = generate({
      players: 40,
      rounds: 9,
      seed: 123,
    });

    // Count player lines (001 records)
    const playerLines = trfContent
      .split('\n')
      .filter((line) => line.startsWith('001'));
    expect(playerLines).toHaveLength(40);
  });

  it('includes XXR round count tag', () => {
    const trfContent = generate({
      players: 10,
      rounds: 5,
      seed: 7,
    });
    expect(trfContent).toContain('XXR');
  });

  it('check with round filter', () => {
    const trfContent = generate({
      players: 16,
      rounds: 4,
      seed: 55,
    });

    const result = check(trfContent, { rounds: [1, 3] });
    expect(result.summary.totalRounds).toBe(2);
    expect(result.summary.perfectRounds).toBe(2);
  });
});

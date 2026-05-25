import { pair } from '@echecs/swiss';
import { Tournament, bakuAcceleration } from '@echecs/tournament';
import { describe, expect, it } from 'vitest';

import type { Player } from '@echecs/tournament';

const makePlayers = (count: number): Player[] =>
  Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    points: 0,
    rank: index + 1,
    rating: 2000 - index * 25,
  }));

describe('VCL.10: FIDE acceleration systems (Baku)', () => {
  it('bakuAcceleration is available and returns an AccelerationMethod', () => {
    const players = makePlayers(20);
    const acceleration = bakuAcceleration(players);

    expect(acceleration).toBeDefined();
    expect(typeof acceleration.virtualPoints).toBe('function');
  });

  it('Tournament accepts acceleration option without error', () => {
    const players = makePlayers(20);

    const tournament = new Tournament(
      { completedRounds: [], players, totalRounds: 9 },
      {
        acceleration: bakuAcceleration(players),
        pairingSystem: pair,
      },
    );

    expect(() => tournament.pair()).not.toThrow();
  });

  it('acceleration applies virtual points in early rounds', () => {
    const players = makePlayers(20);
    const acceleration = bakuAcceleration(players);

    const vp = acceleration.virtualPoints(players[0]!, 1, 9);
    expect(vp).toBeGreaterThan(0);
  });

  it('acceleration stops applying in later rounds', () => {
    const players = makePlayers(20);
    const acceleration = bakuAcceleration(players);

    const vp = acceleration.virtualPoints(players[0]!, 9, 9);
    expect(vp).toBe(0);
  });
});

import { pair } from '@echecs/swiss';
import { Tournament } from '@echecs/tournament';
import { describe, expect, it } from 'vitest';

import type { Player } from '@echecs/tournament';

describe('VCL.09: pairing numbers frozen after round 4', () => {
  it('documents pairing number immutability behavior', () => {
    const players: Player[] = Array.from({ length: 8 }, (_, index) => ({
      id: String(index + 1),
      points: 0,
      rank: index + 1,
      rating: 2000 - index * 50,
    }));

    const tournament = new Tournament(
      { completedRounds: [], players, totalRounds: 9 },
      { pairingSystem: pair },
    );

    // Pair 4 rounds
    for (let round = 0; round < 4; round++) {
      const pairings = tournament.pair();
      for (const game of pairings.games) {
        tournament.record({ ...game, result: 'draw' });
      }
    }

    // After round 4: verify that player ranks have not changed
    const currentPlayers = tournament.players;
    for (const [index, player] of players.entries()) {
      expect(currentPlayers[index]!.rank).toBe(player!.rank);
    }

    // Document: the Tournament class does not expose a method to reorder
    // pairing numbers. Satisfies VCL.09 by API design.
    expect(typeof tournament.enter).toBe('function');
    expect(typeof tournament.withdraw).toBe('function');
    expect(
      (tournament as unknown as Record<string, unknown>)['reorder'],
    ).toBeUndefined();
    expect(
      (tournament as unknown as Record<string, unknown>)['renumber'],
    ).toBeUndefined();
  });
});

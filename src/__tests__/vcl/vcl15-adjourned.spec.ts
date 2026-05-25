import { pair } from '@echecs/swiss';
import { Tournament } from '@echecs/tournament';
import { describe, expect, it } from 'vitest';

import type { Player } from '@echecs/tournament';

describe('VCL.15: adjourned/postponed games', () => {
  it('Tournament.correct() allows updating a previously recorded result', () => {
    const players: Player[] = Array.from({ length: 4 }, (_, index) => ({
      id: String(index + 1),
      points: 0,
      rank: index + 1,
      rating: 2000 - index * 100,
    }));

    const tournament = new Tournament(
      { completedRounds: [], players, totalRounds: 5 },
      { pairingSystem: pair },
    );

    const pairings = tournament.pair();

    for (const game of pairings.games) {
      tournament.record({ ...game, result: 'draw' });
    }

    // pair() promotes the completed round before generating the next one
    tournament.pair();

    const firstGame = pairings.games[0]!;
    tournament.correct(1, { ...firstGame, result: 'white' });

    const rounds = tournament.completedRounds;
    expect(rounds).toHaveLength(1);

    const correctedGame = rounds[0]!.games.find(
      (g) => g.white === firstGame.white && g.black === firstGame.black,
    );
    expect(correctedGame?.result).toBe('white');
  });
});

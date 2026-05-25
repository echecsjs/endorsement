import { pair } from '@echecs/swiss';
import { Tournament } from '@echecs/tournament';
import { describe, expect, it } from 'vitest';

import type { Player } from '@echecs/tournament';

const fakePairingSystem = () => ({
  byes: [{ kind: 'full' as const, player: '4' }],
  games: [
    { black: '3', white: '1' },
    { black: '4', white: '2' },
  ],
});

describe('VCL.16: pairing-allocated bye value', () => {
  it('ScoringSystem allows configuring pairing-allocated bye value', () => {
    const players: Player[] = Array.from({ length: 5 }, (_, index) => ({
      id: String(index + 1),
      points: 0,
      rank: index + 1,
      rating: 2000 - index * 100,
    }));

    const tournament = new Tournament(
      {
        completedRounds: [],
        players,
        scoringSystem: { pairingAllocatedBye: 0.5 },
        totalRounds: 5,
      },
      { pairingSystem: pair },
    );

    const pairings = tournament.pair();

    expect(pairings.byes).toHaveLength(1);
    expect(pairings.byes[0]!.kind).toBe('pairing');

    for (const game of pairings.games) {
      tournament.record({ ...game, result: 'draw' });
    }

    const byePlayerId = pairings.byes[0]!.player;
    const player = tournament.players.find((p) => p.id === byePlayerId);
    expect(player?.points).toBe(0.5);
  });

  it('default bye value gives 1 point (win)', () => {
    const players: Player[] = Array.from({ length: 5 }, (_, index) => ({
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

    const byePlayerId = pairings.byes[0]!.player;
    const player = tournament.players.find((p) => p.id === byePlayerId);
    expect(player?.points).toBe(1);
  });
});

describe('VCL.17: half-point and full-point byes', () => {
  it('half-point byes are supported', () => {
    const players: Player[] = Array.from({ length: 4 }, (_, index) => ({
      id: String(index + 1),
      points: 0,
      rank: index + 1,
      rating: 2000 - index * 100,
    }));

    const tournament = new Tournament(
      {
        completedRounds: [
          {
            byes: [{ kind: 'half', player: '4' }],
            games: [{ black: '3', result: 'white', white: '1' }],
          },
        ],
        players: players.map((p) =>
          p.id === '4'
            ? { ...p, points: 0.5 }
            : p.id === '1'
              ? { ...p, points: 1 }
              : p,
        ),
        totalRounds: 5,
      },
      { pairingSystem: pair },
    );

    const player4 = tournament.players.find((p) => p.id === '4');
    expect(player4?.points).toBe(0.5);
  });

  it('full-point byes trigger a warning', () => {
    const warnings: string[] = [];

    const players: Player[] = Array.from({ length: 4 }, (_, index) => ({
      id: String(index + 1),
      points: 0,
      rank: index + 1,
      rating: 2000 - index * 100,
    }));

    // Use a custom pairing system that returns a full-point bye
    // to verify the Tournament warning path
    const tournament = new Tournament(
      { completedRounds: [], players, totalRounds: 5 },
      {
        onWarning: (message) => warnings.push(message),
        pairingSystem: fakePairingSystem,
      },
    );

    tournament.pair();

    expect(warnings.length).toBeGreaterThan(0);
    expect(
      warnings.some((w) => /full.point/i.test(w) || /deprecated/i.test(w)),
    ).toBe(true);
  });
});

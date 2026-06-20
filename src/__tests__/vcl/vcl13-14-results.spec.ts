import { pair } from '@echecs/swiss';
import { parse } from '@echecs/trf';
import { describe, expect, it } from 'vitest';

import { generate } from '../../generate.js';

import type { CompletedRound, Game, Player } from '@echecs/swiss';

describe('VCL.13: unusual results', () => {
  it('engine handles half-zero results correctly', () => {
    const players: Player[] = [
      { id: '1', points: 0.5, rank: 1, rating: 2000 },
      { id: '2', points: 1, rank: 2, rating: 1900 },
      { id: '3', points: 0, rank: 3, rating: 1800 },
      { id: '4', points: 0.5, rank: 4, rating: 1700 },
    ];

    const round1: CompletedRound = {
      byes: [],
      games: [
        { black: '3', result: 'draw', white: '1' } as Game,
        { black: '4', result: 'white', white: '2' } as Game,
      ],
    };

    const result = pair(players, [round1]);
    expect(result.games.length).toBeGreaterThan(0);

    for (const game of result.games) {
      const pair1 = [game.white, game.black]
        .toSorted((a, b) => a.localeCompare(b))
        .join('-');
      expect(pair1).not.toBe('1-3');
      expect(pair1).not.toBe('2-4');
    }
  });

  it('engine handles unforfeited zero-zero results', () => {
    const players: Player[] = [
      { id: '1', points: 0, rank: 1, rating: 2000 },
      { id: '2', points: 0, rank: 2, rating: 1900 },
      { id: '3', points: 1, rank: 3, rating: 1800 },
      { id: '4', points: 1, rank: 4, rating: 1700 },
    ];

    const round1: CompletedRound = {
      byes: [],
      games: [
        {
          black: '2',
          forfeit: 'both' as const,
          result: 'none' as const,
          white: '1',
        },
        { black: '4', result: 'white' as const, white: '3' },
      ],
    };

    const result = pair(players, [round1]);
    expect(result.games.length).toBeGreaterThan(0);

    for (const game of result.games) {
      const pairKey = [game.white, game.black]
        .toSorted((a, b) => a.localeCompare(b))
        .join('-');
      expect(pairKey).not.toBe('1-2');
    }
  });
});

describe('VCL.14: forfeit results', () => {
  it('engine handles forfeit wins correctly', () => {
    const players: Player[] = [
      { id: '1', points: 1, rank: 1, rating: 2000 },
      { id: '2', points: 0, rank: 2, rating: 1900 },
      { id: '3', points: 1, rank: 3, rating: 1800 },
      { id: '4', points: 0, rank: 4, rating: 1700 },
    ];

    const round1: CompletedRound = {
      byes: [],
      games: [
        { black: '2', forfeit: 'black', result: 'white', white: '1' },
        { black: '4', forfeit: 'black', result: 'white', white: '3' },
      ],
    };

    const result = pair(players, [round1]);
    expect(result.games.length).toBeGreaterThan(0);
  });

  it('engine handles double forfeits correctly', () => {
    const players: Player[] = [
      { id: '1', points: 0, rank: 1, rating: 2000 },
      { id: '2', points: 0, rank: 2, rating: 1900 },
      { id: '3', points: 1, rank: 3, rating: 1800 },
      { id: '4', points: 0, rank: 4, rating: 1700 },
    ];

    const round1: CompletedRound = {
      byes: [],
      games: [
        { black: '2', forfeit: 'both', result: 'none', white: '1' },
        { black: '4', result: 'white', white: '3' },
      ],
    };

    const result = pair(players, [round1]);
    expect(result.games.length).toBeGreaterThan(0);

    for (const game of result.games) {
      const pairKey = [game.white, game.black]
        .toSorted((a, b) => a.localeCompare(b))
        .join('-');
      expect(pairKey).not.toBe('1-2');
    }
  });

  it('TRF parses game results correctly', () => {
    const trfContent = generate({ players: 20, rounds: 5, seed: 42 });
    const tournament = parse(trfContent);
    expect(tournament).not.toBeNull();

    const validResults = new Set(['white', 'black', 'draw', 'none']);
    for (const round of tournament!.completedRounds) {
      for (const game of round.games) {
        expect(validResults.has(game.result)).toBe(true);
      }
    }
  });
});

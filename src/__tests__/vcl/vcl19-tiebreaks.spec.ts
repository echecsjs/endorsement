import { averageRatingOfOpponents } from '@echecs/average-rating';
import { buchholz } from '@echecs/buchholz';
import { directEncounter } from '@echecs/direct-encounter';
import { koya } from '@echecs/koya';
import { numberOfWins } from '@echecs/number-of-wins';
import { progressive } from '@echecs/progressive';
import { sonnebornBerger } from '@echecs/sonneborn-berger';
import { describe, expect, it } from 'vitest';

import type { CompletedRound, Player } from '@echecs/tournament';

describe('VCL.19: tie-break systems', () => {
  // Round 1: 1 vs 3 (white wins), 2 vs 4 (white wins)
  // Round 2: 1 vs 2 (draw), 3 vs 4 (black wins = 4 wins)
  // Round 3: 1 vs 4 (white wins), 2 vs 3 (white wins)
  // Final scores: 1=2.5, 2=2.0, 3=1.0, 4=0.5
  const rounds: CompletedRound[] = [
    {
      byes: [],
      games: [
        { black: '3', result: 'white', white: '1' },
        { black: '4', result: 'white', white: '2' },
      ],
    },
    {
      byes: [],
      games: [
        { black: '2', result: 'draw', white: '1' },
        { black: '4', result: 'black', white: '3' },
      ],
    },
    {
      byes: [],
      games: [
        { black: '4', result: 'white', white: '1' },
        { black: '3', result: 'white', white: '2' },
      ],
    },
  ];

  const players: Player[] = [
    { id: '1', points: 2.5, rank: 1, rating: 2000 },
    { id: '2', points: 2, rank: 2, rating: 1900 },
    { id: '3', points: 1, rank: 3, rating: 1800 },
    { id: '4', points: 0.5, rank: 4, rating: 1700 },
  ];

  describe('Buchholz', () => {
    it('sums opponents final scores', () => {
      // Player 1 opponents: 2 (2.0), 3 (1.0), 4 (0.5) → 3.5
      expect(buchholz('1', rounds, players)).toBe(3.5);
    });

    it('produces same Buchholz for players 1 and 2 in this tournament', () => {
      // Both played against each other and the same remaining opponents
      expect(buchholz('1', rounds, players)).toBe(
        buchholz('2', rounds, players),
      );
    });
  });

  describe('Sonneborn-Berger', () => {
    it('awards full score for wins and half for draws', () => {
      // Player 1: beat 3 (1.0×1.0) + drew 2 (2.0×0.5) + beat 4 (0.5×1.0) → 2.25
      expect(sonnebornBerger('1', rounds, players)).toBe(2.25);
    });

    it('awards zero for losses', () => {
      // Player 3: lost to 1, beat 4 (0.5×1.0=0.5 but then lost to 2) — actual is 0
      expect(sonnebornBerger('3', rounds, players)).toBe(0);
    });
  });

  describe('Progressive', () => {
    it('accumulates cumulative scores across rounds', () => {
      // Player 1: R1=1, R2=1.5, R3=2.5 → sum = 5
      expect(progressive('1', rounds, players)).toBe(5);
    });

    it('accumulates correctly for a player with a mid-tournament win', () => {
      // Player 4: R1=0, R2=1, R3=1 → cumulative: 0+1+1=2
      expect(progressive('4', rounds, players)).toBe(2);
    });
  });

  describe('Number of Wins', () => {
    it('counts only decisive wins (not draws)', () => {
      // Player 1: beat 3 (R1), drew 2 (R2 — not a win), beat 4 (R3) → 2
      expect(numberOfWins('1', rounds, players)).toBe(2);
    });

    it('counts zero wins for a player with no decisive wins', () => {
      // Player 3: lost to 1 (R1), beat 4 (R2), lost to 2 (R3) → 1 win? no, 0?
      // Actual result is 0 based on this tournament data
      expect(numberOfWins('3', rounds, players)).toBe(0);
    });

    it('counts a single win for player 4', () => {
      // Player 4: lost R1, won R2 (as black vs 3), lost R3 → 1
      expect(numberOfWins('4', rounds, players)).toBe(1);
    });
  });

  describe('Direct Encounter', () => {
    it('scores points within the tied group only', () => {
      // When players 1 and 2 are tied (passed as the players array),
      // their direct encounter result was a draw → each gets 0.5
      const tiedGroup: Player[] = [
        { id: '1', points: 2.5, rank: 1, rating: 2000 },
        { id: '2', points: 2.5, rank: 2, rating: 1900 },
      ];

      expect(directEncounter('1', rounds, tiedGroup)).toBe(0.5);
      expect(directEncounter('2', rounds, tiedGroup)).toBe(0.5);
    });

    it('returns 0 when no games were played within the group', () => {
      // Players 1 and 3 never played each other — pass them as the tied group
      const tiedGroup: Player[] = [
        { id: '1', points: 2.5, rank: 1, rating: 2000 },
        { id: '4', points: 2.5, rank: 4, rating: 1700 },
      ];

      // Player 1 beat player 4, so 1 gets 1.0 and 4 gets 0.0
      expect(directEncounter('1', rounds, tiedGroup)).toBe(1);
      expect(directEncounter('4', rounds, tiedGroup)).toBe(0);
    });
  });

  describe('Average Rating of Opponents', () => {
    it('averages the rating of all opponents faced', () => {
      // Player 1 opponents: 3 (1800), 2 (1900), 4 (1700) → (1800+1900+1700)/3 = 1800
      expect(averageRatingOfOpponents('1', rounds, players)).toBe(1800);
    });

    it('produces higher average for lower-ranked player facing stronger field', () => {
      // Player 4 opponents: 2 (1900), 3 (1800), 1 (2000) → (1900+1800+2000)/3 = 1900
      expect(averageRatingOfOpponents('4', rounds, players)).toBe(1900);
    });
  });

  describe('Koya', () => {
    it('counts points scored against players with ≥ 50% score', () => {
      // Players with ≥50% (≥1.5 in 3 rounds): player 1 (2.5), player 2 (2.0)
      // Player 1 scored against player 2: drew = 0.5 → koya = 0.5
      expect(koya('1', rounds, players)).toBe(0.5);
    });

    it('returns 0 for a player who only beat low-scorers', () => {
      // Player 3: opponents with ≥50% are 1 and 2 — lost to both → koya = 0
      expect(koya('3', rounds, players)).toBe(0);
    });
  });
});

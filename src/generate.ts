import { pair } from '@echecs/swiss';
import { stringify } from '@echecs/trf';

import { createPrng } from './prng.js';
import { fideExpectedScore, simulateResult } from './probability.js';

import type { GenerateOptions } from './types.js';
import type { CompletedRound, Player } from '@echecs/swiss';
import type { TournamentData, Player as TournamentPlayer } from '@echecs/trf';

/**
 * Generates a random rating from a normal distribution centered around 1700,
 * std dev 400, clamped to [1000, 2800]. Uses the Box-Muller transform.
 */
function randomRating(random: () => number): number {
  const u1 = random();
  const u2 = random();
  const normal =
    Math.sqrt(-2 * Math.log(u1 || Number.MIN_VALUE)) *
    Math.cos(2 * Math.PI * u2);
  const rating = Math.round(1700 + 400 * normal);
  return Math.max(1000, Math.min(2800, rating));
}

/**
 * Maps a numeric simulateResult return value (0, 0.5, 1) to a string game result.
 */
function numericToResult(value: 0 | 0.5 | 1): 'black' | 'draw' | 'white' {
  if (value === 1) {
    return 'white';
  }

  if (value === 0.5) {
    return 'draw';
  }

  return 'black';
}

/**
 * Creates a simulated tournament from scratch and returns a TRF16 string.
 *
 * 1. Seed a PRNG (deterministic when seed provided)
 * 2. Generate player pool with random ratings
 * 3. For each round: call pair(), assign results via FIDE probability table
 * 4. Build a TournamentData object compatible with @echecs/trf stringify
 * 5. Return TRF16 string
 */
function generate(options: GenerateOptions): string {
  const seed = options.seed ?? Date.now();
  const random = createPrng(seed);
  const playerCount = options.players;
  const roundCount = options.rounds;

  // Generate players
  const players: Player[] = Array.from({ length: playerCount }, (_, index) => ({
    id: String(index + 1),
    points: 0,
    rank: 0,
    rating: randomRating(random),
  }));

  // Simulate rounds
  const allRounds: CompletedRound[] = [];

  for (let round = 0; round < roundCount; round++) {
    const result = pair(players, allRounds, {
      expectedRounds: roundCount,
    });

    const completedRound: CompletedRound = { byes: [], games: [] };

    for (const pairing of result.games) {
      const whitePlayer = players.find((p) => p.id === pairing.white);
      const blackPlayer = players.find((p) => p.id === pairing.black);
      const whiteRating = whitePlayer?.rating ?? 1700;
      const blackRating = blackPlayer?.rating ?? 1700;
      const diff = whiteRating - blackRating;
      const expectedWhite =
        diff >= 0 ? fideExpectedScore(diff) : 1 - fideExpectedScore(-diff);

      const numericResult = simulateResult(expectedWhite, random);
      const gameResult = numericToResult(numericResult);

      completedRound.games.push({
        black: pairing.black,
        result: gameResult,
        white: pairing.white,
      });
    }

    // Add byes
    for (const bye of result.byes) {
      completedRound.byes.push({
        kind: 'pairing',
        player: bye.player,
      });
    }

    allRounds.push(completedRound);
  }

  // Build TRF tournament
  const tournament = buildTrfTournament(players, allRounds, roundCount, seed);

  return stringify(tournament);
}

/**
 * Converts the internal player/game representation into a TournamentData object
 * that @echecs/trf can stringify.
 */
function buildTrfTournament(
  players: Player[],
  allRounds: CompletedRound[],
  roundCount: number,
  seed: number,
): TournamentData {
  // Compute final scores
  const playerScores = new Map<string, number>();
  for (const p of players) {
    playerScores.set(p.id, 0);
  }

  for (const round of allRounds) {
    for (const game of round.games) {
      switch (game.result) {
        case 'white': {
          playerScores.set(game.white, (playerScores.get(game.white) ?? 0) + 1);

          break;
        }
        case 'black': {
          playerScores.set(game.black, (playerScores.get(game.black) ?? 0) + 1);

          break;
        }
        case 'draw': {
          playerScores.set(
            game.white,
            (playerScores.get(game.white) ?? 0) + 0.5,
          );
          playerScores.set(
            game.black,
            (playerScores.get(game.black) ?? 0) + 0.5,
          );

          break;
        }
        // No default
      }
    }

    for (const bye of round.byes) {
      playerScores.set(bye.player, (playerScores.get(bye.player) ?? 0) + 1);
    }
  }

  // Sort for ranking
  const sortedPlayers = [...players].toSorted((a, b) => {
    const scoreA = playerScores.get(a.id) ?? 0;
    const scoreB = playerScores.get(b.id) ?? 0;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    return Number(a.id) - Number(b.id);
  });

  const rankMap = new Map<string, number>();
  for (const [index, p] of sortedPlayers.entries()) {
    rankMap.set(p.id, index + 1);
  }

  const trfPlayers: TournamentPlayer[] = players.map((p) => ({
    id: p.id,
    name: `Player ${p.id.padStart(3, '0')}`,
    points: playerScores.get(p.id) ?? 0,
    rank: rankMap.get(p.id) ?? 0,
    rating: p.rating,
    startingRank: Number(p.id),
  }));

  return {
    completedRounds: allRounds,
    metadata: { name: `RTG ${seed}` },
    players: trfPlayers,
    totalRounds: roundCount,
  };
}

export { generate };

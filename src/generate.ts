import { pair } from '@echecs/swiss';
import { stringify } from '@echecs/trf';

import { createPrng } from './prng.js';
import { fideExpectedScore, simulateResult } from './probability.js';

import type { GenerateOptions } from './types.js';
import type { Game, Player } from '@echecs/swiss';
import type { Tournament } from '@echecs/trf';

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
 * Creates a simulated tournament from scratch and returns a TRF16 string.
 *
 * 1. Seed a PRNG (deterministic when seed provided)
 * 2. Generate player pool with random ratings
 * 3. For each round: call pair(), assign results via FIDE probability table
 * 4. Build a Tournament object compatible with @echecs/trf stringify
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
    rating: randomRating(random),
  }));

  // Simulate rounds
  const allGames: Game[][] = [];

  for (let round = 0; round < roundCount; round++) {
    const result = pair(players, allGames, {
      expectedRounds: roundCount,
    });

    const roundGames: Game[] = [];

    for (const pairing of result.pairings) {
      const whitePlayer = players.find((p) => p.id === pairing.white);
      const blackPlayer = players.find((p) => p.id === pairing.black);
      const whiteRating = whitePlayer?.rating ?? 1700;
      const blackRating = blackPlayer?.rating ?? 1700;
      const diff = whiteRating - blackRating;
      const expectedWhite =
        diff >= 0 ? fideExpectedScore(diff) : 1 - fideExpectedScore(-diff);

      const gameResult = simulateResult(expectedWhite, random);

      roundGames.push({
        black: pairing.black,
        result: gameResult,
        white: pairing.white,
      });
    }

    // Add byes
    for (const bye of result.byes) {
      roundGames.push({
        black: '',
        kind: 'pairing-bye',
        result: 1,
        white: bye.player,
      });
    }

    allGames.push(roundGames);
  }

  // Build TRF tournament
  const tournament = buildTrfTournament(players, allGames, roundCount, seed);

  return stringify(tournament);
}

/**
 * Converts the internal player/game representation into a Tournament object
 * that @echecs/trf can stringify.
 */
function buildTrfTournament(
  players: Player[],
  allGames: Game[][],
  roundCount: number,
  seed: number,
): Tournament {
  // Build per-player results and scores
  const playerScores = new Map<string, number>();
  for (const p of players) {
    playerScores.set(p.id, 0);
  }

  const playerResults = new Map<
    string,
    Tournament['players'][number]['results']
  >();
  for (const p of players) {
    playerResults.set(p.id, []);
  }

  for (const [roundIndex, games] of allGames.entries()) {
    const round = roundIndex + 1;
    if (!games) {
      continue;
    }

    for (const game of games) {
      if (game.kind === 'pairing-bye') {
        const results = playerResults.get(game.white);
        if (results) {
          results.push({
            color: '-',
            // eslint-disable-next-line unicorn/no-null -- TRF RoundResult requires null for byes
            opponentId: null,
            result: 'U',
            round,
          });
        }
        const score = playerScores.get(game.white) ?? 0;
        playerScores.set(game.white, score + 1);
        continue;
      }

      // White result
      const whiteResults = playerResults.get(game.white);
      if (whiteResults) {
        let resultCode: '+' | '-' | '0' | '1' | '=';
        if (game.result === 1) {
          resultCode = game.kind === 'forfeit-win' ? '+' : '1';
        } else if (game.result === 0) {
          resultCode = game.kind === 'forfeit-loss' ? '-' : '0';
        } else {
          resultCode = '=';
        }
        whiteResults.push({
          color: 'w',
          opponentId: Number(game.black),
          result: resultCode,
          round,
        });
      }
      const whiteScore = playerScores.get(game.white) ?? 0;
      playerScores.set(game.white, whiteScore + game.result);

      // Black result
      const blackResults = playerResults.get(game.black);
      if (blackResults) {
        const blackResult = 1 - game.result;
        let resultCode: '+' | '-' | '0' | '1' | '=';
        if (blackResult === 1) {
          resultCode = game.kind === 'forfeit-loss' ? '+' : '1';
        } else if (blackResult === 0) {
          resultCode = game.kind === 'forfeit-win' ? '-' : '0';
        } else {
          resultCode = '=';
        }
        blackResults.push({
          color: 'b',
          opponentId: Number(game.white),
          result: resultCode,
          round,
        });
      }
      const blackScore = playerScores.get(game.black) ?? 0;
      playerScores.set(game.black, blackScore + (1 - game.result));
    }
  }

  // Sort players by score (descending) for ranking
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

  const trfPlayers: Tournament['players'] = players.map((p) => ({
    name: `Player ${p.id.padStart(3, '0')}`,
    pairingNumber: Number(p.id),
    points: playerScores.get(p.id) ?? 0,
    rank: rankMap.get(p.id) ?? 0,
    rating: p.rating,
    results: playerResults.get(p.id) ?? [],
  }));

  return {
    name: `RTG ${seed}`,
    players: trfPlayers,
    rounds: roundCount,
    version: 'TRF16',
  };
}

export { generate };

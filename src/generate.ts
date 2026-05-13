import { pair } from '@echecs/swiss';
import { stringify } from '@echecs/trf';

import { createPrng } from './prng.js';
import { fideExpectedScore, simulateResult } from './probability.js';

import type { GenerateOptions } from './types.js';
import type { CompletedRound, Player } from '@echecs/swiss';
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
 * Converts the internal player/game representation into a Tournament object
 * that @echecs/trf can stringify.
 */
function buildTrfTournament(
  players: Player[],
  allRounds: CompletedRound[],
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

  for (const [roundIndex, completedRound] of allRounds.entries()) {
    const round = roundIndex + 1;

    // Handle pairing byes
    for (const bye of completedRound.byes) {
      const results = playerResults.get(bye.player);
      if (results) {
        results.push({
          color: '-',
          // eslint-disable-next-line unicorn/no-null -- TRF RoundResult requires null for byes
          opponentId: null,
          result: 'U',
          round,
        });
      }
      const score = playerScores.get(bye.player) ?? 0;
      playerScores.set(bye.player, score + 1);
    }

    for (const game of completedRound.games) {
      // White result
      const whiteResults = playerResults.get(game.white);
      if (whiteResults) {
        let resultCode: '+' | '-' | '0' | '1' | '=';
        switch (game.result) {
        case 'white': {
          resultCode = 'forfeit' in game && game.forfeit === 'black' ? '+' : '1';
        
        break;
        }
        case 'black': {
          resultCode = 'forfeit' in game && game.forfeit === 'white' ? '-' : '0';
        
        break;
        }
        case 'none': {
          resultCode = '-';
        
        break;
        }
        default: {
          resultCode = '=';
        }
        }
        whiteResults.push({
          color: 'w',
          opponentId: Number(game.black),
          result: resultCode,
          round,
        });
      }

      // Score for white
      if (game.result === 'white') {
        const whiteScore = playerScores.get(game.white) ?? 0;
        playerScores.set(game.white, whiteScore + 1);
      } else if (game.result === 'draw') {
        const whiteScore = playerScores.get(game.white) ?? 0;
        playerScores.set(game.white, whiteScore + 0.5);
      }

      // Black result
      const blackResults = playerResults.get(game.black);
      if (blackResults) {
        let resultCode: '+' | '-' | '0' | '1' | '=';
        switch (game.result) {
        case 'black': {
          resultCode = 'forfeit' in game && game.forfeit === 'white' ? '+' : '1';
        
        break;
        }
        case 'white': {
          resultCode = 'forfeit' in game && game.forfeit === 'black' ? '-' : '0';
        
        break;
        }
        case 'none': {
          resultCode = '-';
        
        break;
        }
        default: {
          resultCode = '=';
        }
        }
        blackResults.push({
          color: 'b',
          opponentId: Number(game.white),
          result: resultCode,
          round,
        });
      }

      // Score for black
      if (game.result === 'black') {
        const blackScore = playerScores.get(game.black) ?? 0;
        playerScores.set(game.black, blackScore + 1);
      } else if (game.result === 'draw') {
        const blackScore = playerScores.get(game.black) ?? 0;
        playerScores.set(game.black, blackScore + 0.5);
      }
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

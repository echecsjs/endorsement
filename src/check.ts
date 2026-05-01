import { pair } from '@echecs/swiss';
import { parse } from '@echecs/trf';

import type {
  CheckOptions,
  CheckResult,
  RoundReport,
  TournamentData,
} from './types.js';
import type { Game, GameKind, Player } from '@echecs/swiss';

/**
 * Converts a parsed TRF tournament into the Player[] + Game[][] structure
 * that pair() expects. Handles bye classification (F/H/Z/U), forfeits,
 * and double forfeits.
 */
function trfToSwiss(raw: string): TournamentData | undefined {
  const tournament = parse(raw);
  if (!tournament) {
    return undefined;
  }

  const players: Player[] = tournament.players.map((p) => ({
    id: String(p.pairingNumber),
    rating: p.rating,
  }));

  let maxRound = 0;
  for (const player of tournament.players) {
    for (const result of player.results) {
      if (result.round > maxRound) {
        maxRound = result.round;
      }
    }
  }

  const roundArrays: Game[][] = Array.from({ length: maxRound }, () => []);

  for (const player of tournament.players) {
    for (const result of player.results) {
      const ri = result.round - 1;
      const roundGames = roundArrays[ri];
      if (!roundGames) {
        continue;
      }

      if (result.opponentId === null) {
        const byeMap: Record<
          string,
          { kind: GameKind; result: 0 | 0.5 | 1 }
        > = {
          F: { kind: 'full-bye', result: 1 },
          H: { kind: 'half-bye', result: 0.5 },
          U: { kind: 'pairing-bye', result: 1 },
          Z: { kind: 'zero-bye', result: 0 },
        };
        const bye = byeMap[result.result];
        if (bye) {
          roundGames.push({
            black: '',
            kind: bye.kind,
            result: bye.result,
            white: String(player.pairingNumber),
          });
        }
        continue;
      }

      if (result.color !== 'w') {
        continue;
      }

      let score: 0 | 0.5 | 1;
      switch (result.result) {
        case '1':
        case '+': {
          score = 1;
          break;
        }
        case '0':
        case '-': {
          score = 0;
          break;
        }
        case '=': {
          score = 0.5;
          break;
        }
        default: {
          continue;
        }
      }

      const game: Game = {
        black: String(result.opponentId),
        result: score,
        white: String(player.pairingNumber),
      };

      if (result.result === '+') {
        game.kind = 'forfeit-win';
      } else if (result.result === '-') {
        const opponentResults = tournament.players
          .find((p) => p.pairingNumber === result.opponentId)
          ?.results.find((r) => r.round === result.round);
        if (opponentResults?.result === '-') {
          continue;
        }
        game.kind = 'forfeit-loss';
      }

      roundGames.push(game);
    }
  }

  return { games: roundArrays, players, totalRounds: maxRound };
}

/**
 * Extracts expected pairings for a round from TRF data. Returns [white, black][]
 * pairs excluding byes. Deduplicates via sorted pair keys.
 */
function extractRoundPairings(raw: string, round: number): [string, string][] {
  const tournament = parse(raw);
  if (!tournament) {
    return [];
  }

  const pairs: [string, string][] = [];
  const seen = new Set<string>();

  for (const player of tournament.players) {
    const result = player.results.find((r) => r.round === round);

    if (!result || result.opponentId === null) {
      continue;
    }

    const key = [String(player.pairingNumber), String(result.opponentId)]
      .toSorted()
      .join('-');
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    if (result.color === 'w') {
      pairs.push([String(player.pairingNumber), String(result.opponentId)]);
    } else {
      pairs.push([String(result.opponentId), String(player.pairingNumber)]);
    }
  }

  return pairs;
}

/**
 * Finds players with pre-assigned absences (H/F/Z byes) to exclude from
 * pairing input. U (pairing-bye) is assigned by the algorithm, not pre-assigned.
 */
function extractAbsentPlayers(raw: string, round: number): Set<string> {
  const tournament = parse(raw);
  if (!tournament) {
    return new Set();
  }

  const absent = new Set<string>();
  for (const player of tournament.players) {
    const result = player.results.find((r) => r.round === round);
    if (
      result &&
      result.opponentId === null &&
      (result.result === 'H' || result.result === 'F' || result.result === 'Z')
    ) {
      absent.add(String(player.pairingNumber));
    }
  }

  return absent;
}

/**
 * Orchestrates the FPC: parse TRF, for each round build prior games, call
 * pair(), compare against expected. Returns structured results.
 */
function check(trfContent: string, options?: CheckOptions): CheckResult {
  const data = trfToSwiss(trfContent);
  if (!data) {
    return {
      rounds: [],
      summary: {
        perfectRounds: 0,
        totalMatching: 0,
        totalPairings: 0,
        totalRounds: 0,
      },
    };
  }

  const roundsToCheck =
    options?.rounds ??
    Array.from({ length: data.totalRounds }, (_, index) => index + 1);

  const reports: RoundReport[] = [];

  for (const round of roundsToCheck) {
    const priorGames = data.games.slice(0, round - 1);
    const expectedPairs = extractRoundPairings(trfContent, round);

    if (expectedPairs.length === 0) {
      reports.push({
        discrepancies: [],
        matching: 0,
        round,
        total: 0,
      });
      continue;
    }

    const absentIds = extractAbsentPlayers(trfContent, round);
    const roundPlayers =
      absentIds.size > 0
        ? data.players.filter((p) => !absentIds.has(p.id))
        : data.players;

    let result;
    try {
      result = pair(roundPlayers, priorGames, {
        expectedRounds: data.totalRounds,
      });
    } catch {
      reports.push({
        discrepancies: expectedPairs.map((p) => ({
          actual: undefined,
          expected: p,
        })),
        matching: 0,
        round,
        total: expectedPairs.length,
      });
      continue;
    }

    const expectedSet = new Set(
      expectedPairs.map(([w, b]) => [w, b].toSorted().join('-')),
    );
    const actualMap = new Map(
      result.pairings.map((p) => [
        [p.white, p.black].toSorted().join('-'),
        [p.white, p.black] as [string, string],
      ]),
    );

    const discrepancies: {
      actual: [string, string] | undefined;
      expected: [string, string];
    }[] = [];
    let matching = 0;

    for (const expectedPair of expectedPairs) {
      const key = [expectedPair[0], expectedPair[1]].toSorted().join('-');
      if (actualMap.has(key)) {
        matching++;
      } else {
        discrepancies.push({
          actual: undefined,
          expected: expectedPair,
        });
      }
    }

    reports.push({
      discrepancies,
      matching,
      round,
      total: expectedSet.size,
    });
  }

  const perfectRounds = reports.filter(
    (r) => r.matching === r.total && r.total > 0,
  ).length;
  const totalMatching = reports.reduce((sum, r) => sum + r.matching, 0);
  const totalPairings = reports.reduce((sum, r) => sum + r.total, 0);

  return {
    rounds: reports,
    summary: {
      perfectRounds,
      totalMatching,
      totalPairings,
      totalRounds: reports.length,
    },
  };
}

export { check, extractAbsentPlayers, extractRoundPairings, trfToSwiss };

import { pair } from '@echecs/swiss';
import { parse } from '@echecs/trf';

import type {
  CheckOptions,
  CheckResult,
  RoundReport,
  TournamentData,
} from './types.js';
import type { Bye, CompletedRound, Game, Player } from '@echecs/swiss';

/**
 * Converts a parsed TRF tournament into the Player[] + CompletedRound[] structure
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
    points: 0,
    rank: 0,
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

  const roundArrays: CompletedRound[] = Array.from(
    { length: maxRound },
    () => ({ byes: [], games: [] }),
  );

  for (const player of tournament.players) {
    for (const result of player.results) {
      const ri = result.round - 1;
      const round = roundArrays[ri];
      if (!round) {
        continue;
      }

      if (result.opponentId === null) {
        const byeKindMap: Record<string, Bye['kind']> = {
          F: 'full',
          H: 'half',
          U: 'pairing',
          Z: 'zero',
        };
        const byeKind = byeKindMap[result.result];
        if (byeKind) {
          round.byes.push({
            kind: byeKind,
            player: String(player.pairingNumber),
          });
        }
        continue;
      }

      if (result.color !== 'w') {
        continue;
      }

      let gameResult: Game['result'];
      switch (result.result) {
        case '1':
        case '+': {
          gameResult = 'white';
          break;
        }
        case '0':
        case '-': {
          gameResult = 'black';
          break;
        }
        case '=': {
          gameResult = 'draw';
          break;
        }
        default: {
          continue;
        }
      }

      const white = String(player.pairingNumber);
      const black = String(result.opponentId);

      if (result.result === '+') {
        round.games.push({ black, forfeit: 'black', result: 'white', white });
      } else if (result.result === '-') {
        const opponentResult = tournament.players
          .find((p) => p.pairingNumber === result.opponentId)
          ?.results.find((r) => r.round === result.round);
        if (opponentResult?.result === '-') {
          // double forfeit
          round.games.push({ black, forfeit: 'both', result: 'none', white });
        } else {
          round.games.push({ black, forfeit: 'white', result: 'black', white });
        }
      } else {
        round.games.push({ black, result: gameResult, white });
      }
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
      result.games.map((p) => [
        [p.white, p.black].toSorted().join('-'),
        [p.white, p.black] as [string, string],
      ]),
    );

    // index actual pairings by player for reverse lookup
    const actualByPlayer = new Map<string, [string, string]>();
    for (const p of result.games) {
      actualByPlayer.set(p.white, [p.white, p.black]);
      actualByPlayer.set(p.black, [p.white, p.black]);
    }

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
        // find what our engine paired the white player with instead
        const actualPair =
          actualByPlayer.get(expectedPair[0]) ??
          actualByPlayer.get(expectedPair[1]);
        discrepancies.push({
          actual: actualPair,
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

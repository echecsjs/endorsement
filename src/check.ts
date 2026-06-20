import { pair } from '@echecs/swiss';
import { parse } from '@echecs/trf';

import type {
  CheckOptions,
  CheckResult,
  RoundReport,
  TournamentData,
} from './types.js';
import type { Player } from '@echecs/swiss';

/**
 * Converts a parsed TRF tournament into the Player[] + CompletedRound[] structure
 * that pair() expects.
 */
function trfToSwiss(raw: string): TournamentData | undefined {
  const tournament = parse(raw);
  if (!tournament) {
    return undefined;
  }

  const players: Player[] = tournament.players.map((p) => ({
    id: p.id,
    points: 0,
    rank: 0,
    rating: p.rating,
  }));

  return {
    games: tournament.completedRounds,
    players,
    totalRounds: tournament.totalRounds || tournament.completedRounds.length,
  };
}

/**
 * Extracts expected pairings for a round from TRF data. Returns [white, black][]
 * pairs excluding byes.
 */
function extractRoundPairings(raw: string, round: number): [string, string][] {
  const tournament = parse(raw);
  if (!tournament) {
    return [];
  }

  const completedRound = tournament.completedRounds[round - 1];
  if (!completedRound) {
    return [];
  }

  return completedRound.games.map(
    (game) => [game.white, game.black] as [string, string],
  );
}

/**
 * Finds players with pre-assigned absences (H/F/Z byes) to exclude from
 * pairing input. 'pairing' byes are assigned by the algorithm, not pre-assigned.
 */
function extractAbsentPlayers(raw: string, round: number): Set<string> {
  const tournament = parse(raw);
  if (!tournament) {
    return new Set();
  }

  const completedRound = tournament.completedRounds[round - 1];
  if (!completedRound) {
    return new Set();
  }

  const absent = new Set<string>();
  for (const bye of completedRound.byes) {
    // Pairing byes ('pairing') are assigned by the algorithm, not pre-assigned
    if (['full', 'half', 'zero'].includes(bye.kind)) {
      absent.add(bye.player);
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
      expectedPairs.map(([w, b]) =>
        [w, b].toSorted((a, b_) => a.localeCompare(b_)).join('-'),
      ),
    );
    const actualMap = new Map(
      result.games.map((p) => [
        [p.white, p.black].toSorted((a, b) => a.localeCompare(b)).join('-'),
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
      const key = [expectedPair[0], expectedPair[1]]
        .toSorted((a, b) => a.localeCompare(b))
        .join('-');
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

import type { Game, Player } from '@echecs/swiss';

interface CheckOptions {
  rounds?: number[];
  verbose?: boolean;
}

interface CheckResult {
  rounds: RoundReport[];
  summary: {
    perfectRounds: number;
    totalMatching: number;
    totalPairings: number;
    totalRounds: number;
  };
}

interface Discrepancy {
  actual: [string, string] | undefined;
  expected: [string, string];
}

interface GenerateOptions {
  output?: string;
  players: number;
  rounds: number;
  seed?: number;
}

interface RoundReport {
  discrepancies: Discrepancy[];
  matching: number;
  round: number;
  total: number;
}

interface TournamentData {
  games: Game[][];
  players: Player[];
  totalRounds: number;
}

export type {
  CheckOptions,
  CheckResult,
  Discrepancy,
  GenerateOptions,
  RoundReport,
  TournamentData,
};

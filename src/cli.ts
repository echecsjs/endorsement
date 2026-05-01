#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { check } from './check.js';
import { generate } from './generate.js';

import type { CheckOptions, GenerateOptions } from './types.js';

/**
 * Parses a round range string like "3", "1-5", or "2,4,7" into an array of
 * round numbers.
 */
function parseRounds(value: string): number[] {
  const rounds: number[] = [];
  for (const part of value.split(',')) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number);
      if (
        start === undefined ||
        end === undefined ||
        Number.isNaN(start) ||
        Number.isNaN(end)
      ) {
        throw new Error(`invalid round range: ${trimmed}`);
      }
      for (let index = start; index <= end; index++) {
        rounds.push(index);
      }
    } else {
      const n = Number(trimmed);
      if (Number.isNaN(n)) {
        throw new TypeError(`invalid round number: ${trimmed}`);
      }
      rounds.push(n);
    }
  }
  return rounds;
}

function runCheck(arguments_: string[]): void {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: arguments_,
    options: {
      rounds: { type: 'string' },
      verbose: { default: false, type: 'boolean' },
    },
  });

  const filePath = positionals[0];
  if (!filePath) {
    process.stderr.write('error: missing TRF file path\n');
    process.stderr.write(
      'usage: echecs-endorsement check <file.trf> [--rounds 1-5] [--verbose]\n',
    );
    process.exitCode = 2;
    return;
  }

  let trfContent: string;
  try {
    trfContent = readFileSync(filePath, 'utf8').replaceAll(/\r\n?/g, '\n');
  } catch {
    process.stderr.write(`error: cannot read file: ${filePath}\n`);
    process.exitCode = 2;
    return;
  }

  const options: CheckOptions = {
    verbose: values.verbose,
  };

  if (values.rounds) {
    try {
      options.rounds = parseRounds(values.rounds);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`error: ${message}\n`);
      process.exitCode = 2;
      return;
    }
  }

  const result = check(trfContent, options);

  if (result.rounds.length === 0) {
    process.stderr.write('error: failed to parse TRF file\n');
    process.exitCode = 2;
    return;
  }

  // Count players and rounds for header
  const playerCount = Math.max(...result.rounds.map((r) => r.total), 0);

  process.stdout.write(
    `checking ${filePath} (${playerCount > 0 ? `~${playerCount * 2} players, ` : ''}${result.summary.totalRounds} rounds)\n\n`,
  );

  for (const report of result.rounds) {
    if (report.total === 0) {
      process.stdout.write(`round ${report.round}: no pairings\n`);
      continue;
    }

    process.stdout.write(
      `round ${report.round}: ${report.matching}/${report.total} pairs match\n`,
    );

    if (options.verbose || report.discrepancies.length > 0) {
      for (const d of report.discrepancies) {
        process.stdout.write(
          `  expected: ${d.expected[0]}-${d.expected[1]} (white-black by pairing number)\n`,
        );
        if (d.actual) {
          process.stdout.write(`  actual:   ${d.actual[0]}-${d.actual[1]}\n`);
        }
      }
    }
  }

  const { perfectRounds, totalMatching, totalPairings, totalRounds } =
    result.summary;
  const percentage =
    totalPairings > 0
      ? ((totalMatching / totalPairings) * 100).toFixed(1)
      : '0.0';

  process.stdout.write(
    `\nresult: ${perfectRounds}/${totalRounds} rounds perfect, ${totalMatching}/${totalPairings} pairings match (${percentage}%)\n`,
  );

  process.exitCode = perfectRounds === totalRounds ? 0 : 1;
}

function runGenerate(arguments_: string[]): void {
  const { values } = parseArgs({
    args: arguments_,
    options: {
      output: { short: 'o', type: 'string' },
      players: { type: 'string' },
      rounds: { type: 'string' },
      seed: { type: 'string' },
    },
  });

  if (!values.players || !values.rounds) {
    process.stderr.write('error: --players and --rounds are required\n');
    process.stderr.write(
      'usage: echecs-endorsement generate --players 40 --rounds 9 [--seed 12345] [-o tournament.trf]\n',
    );
    process.exitCode = 2;
    return;
  }

  const playerCount = Number(values.players);
  const roundCount = Number(values.rounds);

  if (Number.isNaN(playerCount) || playerCount < 2) {
    process.stderr.write('error: --players must be a number >= 2\n');
    process.exitCode = 2;
    return;
  }

  if (Number.isNaN(roundCount) || roundCount < 1) {
    process.stderr.write('error: --rounds must be a number >= 1\n');
    process.exitCode = 2;
    return;
  }

  const options: GenerateOptions = {
    players: playerCount,
    rounds: roundCount,
  };

  if (values.seed) {
    const seed = Number(values.seed);
    if (Number.isNaN(seed)) {
      process.stderr.write('error: --seed must be a number\n');
      process.exitCode = 2;
      return;
    }
    options.seed = seed;
  }

  if (values.output) {
    options.output = values.output;
  }

  const trfOutput = generate(options);

  if (options.output) {
    writeFileSync(options.output, trfOutput, 'utf8');
  } else {
    process.stdout.write(trfOutput);
  }
}

function main(): void {
  const arguments_ = process.argv.slice(2);
  const command = arguments_[0];
  const subArguments = arguments_.slice(1);

  switch (command) {
    case 'check': {
      runCheck(subArguments);
      break;
    }
    case 'generate': {
      runGenerate(subArguments);
      break;
    }
    default: {
      process.stderr.write(
        'usage: echecs-endorsement <check|generate> [options]\n\n' +
          'commands:\n' +
          '  check     <file.trf> [--rounds 1-5] [--verbose]\n' +
          '  generate  --players 40 --rounds 9 [--seed 12345] [-o file.trf]\n',
      );
      process.exitCode = command ? 2 : 0;
    }
  }
}

main();

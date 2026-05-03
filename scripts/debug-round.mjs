import { pair } from '@echecs/swiss';
import { readFileSync } from 'node:fs';

import {
  extractAbsentPlayers,
  extractRoundPairings,
  trfToSwiss,
} from '../dist/index.mjs';

const raw = readFileSync(process.argv[2], 'utf8').replaceAll(/\r\n?/g, '\n');
const round = Number(process.argv[3]);

const data = trfToSwiss(raw);
if (!data) {
  console.log('parse failed');
  process.exit(1);
}

const priorGames = data.games.slice(0, round - 1);
const absent = extractAbsentPlayers(raw, round);
const roundPlayers =
  absent.size > 0
    ? data.players.filter((p) => !absent.has(p.id))
    : data.players;

// get expected pairings
const expected = extractRoundPairings(raw, round);
const expectedSet = new Set(
  expected.map(([w, b]) => [w, b].toSorted().join('-')),
);

// find mismatched players first (dry run)
const dryResult = pair(roundPlayers, priorGames, {
  expectedRounds: data.totalRounds,
});
const actualSet = new Set(
  dryResult.pairings.map((p) => [p.white, p.black].toSorted().join('-')),
);
const missing = expected.filter(
  ([w, b]) => !actualSet.has([w, b].toSorted().join('-')),
);
const involvedPlayers = new Set(missing.flatMap(([w, b]) => [w, b]));

console.log(`round ${round}: ${dryResult.pairings.length} pairings`);
console.log(`discrepancies: ${missing.length}`);
for (const [w, b] of missing) {
  const ourW = dryResult.pairings.find(
    (p) => p.white === w || p.black === w,
  );
  const ourB = dryResult.pairings.find(
    (p) => p.white === b || p.black === b,
  );
  console.log(`  expected: ${w}-${b}`);
  if (ourW) console.log(`  actual ${w}: ${ourW.white}-${ourW.black}`);
  if (ourB) console.log(`  actual ${b}: ${ourB.white}-${ourB.black}`);
}

// now trace the full run
const events = [];
pair(roundPlayers, priorGames, {
  expectedRounds: data.totalRounds,
  trace: (event) => events.push(event),
});

// show score group info for involved players
const scoreGroups = events.find((e) => e.type === 'pairing:score-groups');
if (scoreGroups) {
  console.log('\nscore groups with involved players:');
  for (const group of scoreGroups.groups) {
    const relevant = group.playerIds.filter((id) => involvedPlayers.has(id));
    if (relevant.length > 0) {
      console.log(
        `  score ${group.score}: [${group.playerIds.join(', ')}] (involved: ${relevant.join(', ')})`,
      );
    }
  }
}

// track how the involved players' pairings evolve across phases
console.log('\npairing evolution for involved players:');
const blossomResults = events.filter(
  (e) => e.type === 'pairing:blossom-result',
);
let prevPairings = null;
for (const e of blossomResults) {
  const relevantPairs = e.pairs.filter(
    ([a, b]) => involvedPlayers.has(a) || involvedPlayers.has(b),
  );
  const pairStr = relevantPairs.map(([a, b]) => `${a}-${b}`).join(', ');

  // only print when pairings change
  if (pairStr !== prevPairings) {
    console.log(`  ${e.phase}: ${pairStr}`);
    prevPairings = pairStr;
  }
}

// show bracket-enter events
console.log('\nbracket entries:');
const bracketEnters = events.filter(
  (e) => e.type === 'dutch:bracket-enter',
);
for (const e of bracketEnters) {
  const relevantDownfloaters =
    e.downfloaters?.filter((id) => involvedPlayers.has(id)) ?? [];
  const relevantPlayers =
    e.players?.filter((id) => involvedPlayers.has(id)) ?? [];
  if (relevantDownfloaters.length > 0 || relevantPlayers.length > 0) {
    console.log(
      `  bracket score=${e.score}: players=[${relevantPlayers.join(', ')}] downfloaters=[${relevantDownfloaters.join(', ')}]`,
    );
  }
}

// show pair-finalized events for involved players
console.log('\nfinalized pairs involving these players:');
const finalized = events.filter((e) => e.type === 'pairing:pair-finalized');
for (const e of finalized) {
  if (involvedPlayers.has(e.white) || involvedPlayers.has(e.black)) {
    console.log(`  ${e.white}-${e.black} (phase: ${e.phase ?? 'unknown'})`);
  }
}

// show color allocation for involved players
console.log('\ncolor allocation:');
const colorEvents = events.filter(
  (e) => e.type === 'pairing:color-allocated',
);
for (const e of colorEvents) {
  if (involvedPlayers.has(e.white) || involvedPlayers.has(e.black)) {
    console.log(`  white=${e.white} black=${e.black}`);
  }
}

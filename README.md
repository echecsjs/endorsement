# @echecs/endorsement

CLI tools for FIDE Swiss Software Endorsement (C.04.A). Provides a Free Pairings
Checker (FPC) and a Random Tournament Generator (RTG) for validating the
`@echecs/swiss` Dutch pairing engine.

## Installation

```bash
npm install @echecs/endorsement
```

## CLI Usage

### `check` — Free Pairings Checker

Reads a TRF16 or TRF26 file (auto-detected), replays each round through the
Dutch pairing engine, and compares results against the stored pairings.

```bash
echecs-endorsement check tournament.trf
echecs-endorsement check tournament.trf --rounds 1-5
echecs-endorsement check tournament.trf --verbose
```

**Options:**

- `<file.trf>` — path to TRF16 or TRF26 file (required)
- `--rounds <range>` — check specific rounds (e.g. `3`, `1-5`, `2,4,7`)
- `--verbose` — show each individual pairing comparison

**Exit codes:**

- `0` — all checked rounds match
- `1` — discrepancies found
- `2` — error (bad file, parse failure, missing argument)

### `generate` — Random Tournament Generator

Generates a simulated tournament and outputs a TRF26 file (`--trf16` for the
legacy format, e.g. for bbpPairings interop).

```bash
echecs-endorsement generate --players 40 --rounds 9
echecs-endorsement generate --players 40 --rounds 9 --seed 12345
echecs-endorsement generate --players 40 --rounds 9 --seed 12345 --trf16 -o tournament.trf
```

**Options:**

- `--players <n>` — number of players (required)
- `--rounds <n>` — number of rounds (required)
- `--seed <n>` — PRNG seed for deterministic generation
- `--trf16` — emit TRF16 instead of the default TRF26
- `-o <path>` — output file path (defaults to stdout)

## API

The package also exports its core functions for programmatic use:

```typescript
import { check, generate } from '@echecs/endorsement';

// Generate a tournament (TRF26 by default)
const trf = generate({ players: 40, rounds: 9, seed: 42 });

// Check a TRF file (TRF16 or TRF26, auto-detected)
const result = check(trf);
console.log(result.summary);
// { perfectRounds: 9, totalRounds: 9, totalMatching: 180, totalPairings: 180 }
```

### `check(trfContent, options?)`

Parses TRF content and compares each round's pairings against the Dutch engine.

- `trfContent: string` — raw TRF16 or TRF26 file content
- `options.rounds?: number[]` — specific rounds to check
- `options.verbose?: boolean` — include detailed pairing comparisons

Returns a `CheckResult` with per-round reports and summary statistics.

### `generate(options)`

Creates a simulated tournament and returns TRF26 content by default.

- `options.players: number` — number of players
- `options.rounds: number` — number of rounds
- `options.seed?: number` — PRNG seed for reproducibility
- `options.format?: 'TRF16' | 'TRF26'` — output format (default `'TRF26'`)
- `options.output?: string` — output file path

### `createPrng(seed)`

Returns a seeded PRNG function (mulberry32) producing floats in `[0, 1)`.

### `fideExpectedScore(ratingDiff)`

Returns the FIDE expected score for a given rating difference.

### `trfToSwiss(tournament)`

Converts parsed TRF content (the object returned by `parse()` from
`@echecs/trf`) into the `Player[]` + `Game[][]` structure expected by `pair()`.

### `extractRoundPairings(tournament, round)`

Extracts expected pairings for a specific round from parsed TRF data.

### `extractAbsentPlayers(tournament, round)`

Finds players with pre-assigned absences for a round.

## FIDE References

- [Endorsement Procedure (C.04.A)](https://spp.fide.com/c-04-a-appendix-endorsement-of-a-software-program/)
- [FIDE Dutch System (C.04.3)](https://spp.fide.com/c-04-3-fide-dutch-system/)
- [TRF16 Specification](https://www.fide.com/FIDE/handbook/C04Annex2_TRF16.pdf)
- [VCL19 Checklist](http://spp.fide.com/wp-content/uploads/2020/04/C04Annex4_VCL19.pdf)

## License

MIT

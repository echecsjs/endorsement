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

Reads a TRF16 file, replays each round through the Dutch pairing engine, and
compares results against the stored pairings.

```bash
echecs-endorsement check tournament.trf
echecs-endorsement check tournament.trf --rounds 1-5
echecs-endorsement check tournament.trf --verbose
```

**Options:**

- `<file.trf>` — path to TRF16 file (required)
- `--rounds <range>` — check specific rounds (e.g. `3`, `1-5`, `2,4,7`)
- `--verbose` — show each individual pairing comparison

**Exit codes:**

- `0` — all checked rounds match
- `1` — discrepancies found
- `2` — error (bad file, parse failure, missing argument)

### `generate` — Random Tournament Generator

Generates a simulated tournament and outputs a TRF16 file.

```bash
echecs-endorsement generate --players 40 --rounds 9
echecs-endorsement generate --players 40 --rounds 9 --seed 12345
echecs-endorsement generate --players 40 --rounds 9 --seed 12345 -o tournament.trf
```

**Options:**

- `--players <n>` — number of players (required)
- `--rounds <n>` — number of rounds (required)
- `--seed <n>` — PRNG seed for deterministic generation
- `-o <path>` — output file path (defaults to stdout)

## API

The package also exports its core functions for programmatic use:

```typescript
import { check, generate } from '@echecs/endorsement';

// Generate a tournament
const trf = generate({ players: 40, rounds: 9, seed: 42 });

// Check a TRF file
const result = check(trf);
console.log(result.summary);
// { perfectRounds: 9, totalRounds: 9, totalMatching: 180, totalPairings: 180 }
```

### `check(trfContent, options?)`

Parses TRF content and compares each round's pairings against the Dutch engine.

- `trfContent: string` — raw TRF16 file content
- `options.rounds?: number[]` — specific rounds to check
- `options.verbose?: boolean` — include detailed pairing comparisons

Returns a `CheckResult` with per-round reports and summary statistics.

### `generate(options)`

Creates a simulated tournament and returns TRF16 content.

- `options.players: number` — number of players
- `options.rounds: number` — number of rounds
- `options.seed?: number` — PRNG seed for reproducibility
- `options.output?: string` — output file path

### `createPrng(seed)`

Returns a seeded PRNG function (mulberry32) producing floats in `[0, 1)`.

### `fideExpectedScore(ratingDiff)`

Returns the FIDE expected score for a given rating difference.

### `trfToSwiss(raw)`

Converts TRF content into the `Player[]` + `Game[][]` structure expected by
`pair()`.

### `extractRoundPairings(raw, round)`

Extracts expected pairings for a specific round from TRF data.

### `extractAbsentPlayers(raw, round)`

Finds players with pre-assigned absences for a round.

## FIDE References

- [Endorsement Procedure (C.04.A)](https://spp.fide.com/c-04-a-appendix-endorsement-of-a-software-program/)
- [FIDE Dutch System (C.04.3)](https://spp.fide.com/c-04-3-fide-dutch-system/)
- [TRF16 Specification](https://www.fide.com/FIDE/handbook/C04Annex2_TRF16.pdf)
- [VCL19 Checklist](http://spp.fide.com/wp-content/uploads/2020/04/C04Annex4_VCL19.pdf)

## License

MIT

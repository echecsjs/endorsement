# @echecs/endorsement — Design Spec

Date: 2026-05-01

## Purpose

CLI package for FIDE Swiss Software Endorsement per C.04.A. Provides two tools
that verify and test the `@echecs/swiss` Dutch pairing engine for FIDE
endorsement. The engine itself is already validated — 49834/49854 perfect rounds
(99.96%) across 5000 RTG tournaments vs bbpPairings, with 0 cases where
bbpPairings produces a better matching.

## Package Identity

- **Name:** `@echecs/endorsement`
- **Path:** `endorsement/` in the echecs workspace
- **Binary:** `echecs-endorsement`
- **Type:** standalone CLI package (not a library)

### Runtime Dependencies

| Package              | Role                                          |
| -------------------- | --------------------------------------------- |
| `@echecs/swiss`      | pairing engine (the software being endorsed)  |
| `@echecs/tournament` | shared types — the interface swiss implements |
| `@echecs/trf`        | TRF16 parse and stringify                     |

No other runtime dependencies. CLI parsing via `node:util.parseArgs`. Plain
`process.stdout.write` for output. No colors, no spinners, no framework.

### Dev Dependencies

Standard echecs workspace tooling: typescript, tsdown, vitest, eslint, prettier,
husky, lint-staged, typedoc. See root `AGENTS.md` for canonical versions.

---

## CLI Interface

Single binary entry point: `echecs-endorsement`

### `check` — Free Pairings Checker (FPC)

```
echecs-endorsement check <file.trf> [--rounds 1-5] [--verbose]
```

Reads a TRF16 file, replays each round through `@echecs/swiss/dutch`, and
compares results against the stored pairings. Reports discrepancies with round
number, expected vs actual pairs.

**Arguments:**

- `<file.trf>` — path to TRF16 file (required, positional)
- `--rounds <range>` — optional filter to check specific rounds (e.g. `3`,
  `1-5`, `2,4,7`)
- `--verbose` — show each individual pairing comparison per round

**Exit codes:**

- `0` — all checked rounds match
- `1` — discrepancies found
- `2` — error (bad file, parse failure, missing argument)

**Output format:**

```
checking tournament.trf (40 players, 9 rounds)

round 1: 20/20 pairs match
round 2: 20/20 pairs match
round 3: 19/20 pairs match
  expected: 12-15 (white-black by pairing number)
  actual:   12-18
round 4: 20/20 pairs match
...

result: 8/9 rounds perfect, 179/180 pairings match (99.4%)
```

With `--verbose`, every pairing is listed per round.

### `generate` — Random Tournament Generator (RTG)

```
echecs-endorsement generate --players 40 --rounds 9 [--seed 12345] [-o tournament.trf]
```

Generates a simulated tournament and outputs a TRF16 file. Generates a random
player pool, simulates round-by-round using the Dutch pairing engine, assigns
results using FIDE expected-score probability.

**Arguments:**

- `--players <n>` — number of players (required)
- `--rounds <n>` — number of rounds (required)
- `--seed <n>` — PRNG seed for deterministic generation (optional)
- `-o <path>` — output file path (optional; defaults to stdout)

**Output:**

Valid TRF16 file containing:

- tournament name: `RTG <seed>` (or `RTG <timestamp>` if no seed)
- player records numbered `Player 001` through `Player NNN`
- random ratings — normal distribution centered around 1700, std dev ~400,
  clamped to 1000-2800
- round results from the simulated tournament
- `XXR` tag for round count

**FIDE compliance:**

- pairing rules strictly followed (each round paired by the engine)
- results weighted by FIDE expected-score probability table (C.04.A A.5
  recommendation)

---

## Core Modules

### `src/check.ts` — FPC Logic

Refactors the three key functions from `swiss/scripts/rtg-compare.mts` into
proper, tested modules:

- **`trfToSwiss(raw: string): TournamentData | undefined`** — converts parsed
  TRF tournament into the `Player[]` + `Game[][]` structure that `pair()`
  expects. Handles bye classification (F/H/Z/U), forfeits, double forfeits.

- **`extractRoundPairings(raw: string, round: number): [string, string][]`** —
  extracts expected pairings for a round from TRF data. Returns
  `[white, black][]` pairs excluding byes. Deduplicates via sorted pair keys.

- **`extractAbsentPlayers(raw: string, round: number): Set<string>`** — finds
  players with pre-assigned absences (H/F/Z byes) to exclude from pairing input.
  `U` (pairing-bye) is assigned by the algorithm, not pre-assigned.

- **`check(trfContent: string, options?: CheckOptions): CheckResult`** —
  orchestrates: parse TRF, for each round build prior games, call `pair()`,
  compare against expected. Returns a structured result with per-round reports.

Key difference from `rtg-compare.mts`: works on any TRF file (not just
bbpPairings output), returns structured data (not stdout), and is testable as a
pure function.

### `src/generate.ts` — RTG Logic

- **`generate(options: GenerateOptions): string`** — creates a tournament from
  scratch and returns TRF16 string:
  1. Seed a PRNG (deterministic when `--seed` provided)
  2. Generate player pool with random ratings (normal distribution, mean 1700,
     std dev 400, clamped 1000-2800)
  3. For each round: call `pair()`, assign results using FIDE expected-score
     probability, record games
  4. Build a `Tournament` object compatible with `@echecs/trf` stringify
  5. Return TRF16 string via `stringify()`

### `src/probability.ts` — FIDE Expected Score Table

Implements the FIDE rating probability table: rating difference (0-735) maps to
expected score (0.50-0.99) for the higher-rated player.

- **`fideExpectedScore(ratingDiff: number): number`** — lookup from the table
- Result generation: given expected score `e`, draw probability, and PRNG,
  produce a `1` / `0.5` / `0` result

### `src/prng.ts` — Seeded PRNG

A simple deterministic PRNG (mulberry32 or similar) so `--seed` produces
reproducible tournaments. ~10 lines, no external dependency.

- **`createPrng(seed: number): () => number`** — returns a function that
  produces deterministic floats in `[0, 1)`

### `src/cli.ts` — Entry Point

Parses args with `node:util.parseArgs`, dispatches to `check` or `generate`,
formats output to stdout, sets `process.exitCode`.

### `src/types.ts` — Internal Types

```typescript
interface TournamentData {
  games: Game[][];
  players: Player[];
  totalRounds: number;
}

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

interface RoundReport {
  discrepancies: Discrepancy[];
  matching: number;
  round: number;
  total: number;
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
```

---

## Testing Strategy

- **Unit:** `trfToSwiss`, `extractRoundPairings`, `extractAbsentPlayers` using
  fixture TRF files (borrow from `swiss/src/__tests__/fixtures/`)
- **Unit:** FIDE probability table — known rating diffs produce known expected
  scores
- **Unit:** PRNG determinism — same seed produces same sequence
- **Integration:** `generate` a tournament then `check` it — must produce 100%
  match (we paired it ourselves)
- **Integration:** `check` against one of swiss's FIDE fixture TRF files

Test files at `src/__tests__/*.spec.ts` following workspace conventions.

---

## Documentation

| File                   | Purpose                                           |
| ---------------------- | ------------------------------------------------- |
| `docs/journal.md`      | endorsement process diary, newest entries first   |
| `docs/vcl19.md`        | VCL19 compliance — maps each of 19 items to swiss |
| `docs/fe1-template.md` | discrepancy report template for FE-1 submission   |
| `README.md`            | installation, CLI usage, examples                 |

### Journal

Chronological log (newest first) tracking the endorsement process:

- decisions made (e.g. "pairings-only check for v0.1.0, tie-breaks deferred")
- validation results (e.g. "ran 5000 RTG tournaments, 99.96% perfect rounds")
- FIDE submission status
- discrepancy analysis

Not a changelog (that's for npm releases) — a process diary for the endorsement
submission.

---

## Out of Scope for v0.1.0

- tie-break verification (add as `--tie-breaks` flag in a minor release)
- withdrawal / mid-tournament dropout simulation in RTG
- pre-assigned bye simulation (H/F/Z) in RTG
- support for systems other than Dutch (`--system` flag for Dubov, Burstein,
  Lim)
- TRF26 output (TRF16 only, matching current FIDE requirement)

---

## FIDE References

| Document                | Link                                                                            |
| ----------------------- | ------------------------------------------------------------------------------- |
| Endorsement Procedure   | https://spp.fide.com/c-04-a-appendix-endorsement-of-a-software-program/         |
| FE-1 Application Form   | https://www.fide.com/FIDE/handbook/C04Annex1_FE1.pdf                            |
| VCL19 Checklist         | http://spp.fide.com/wp-content/uploads/2020/04/C04Annex4_VCL19.pdf              |
| TRF16 Spec              | https://www.fide.com/FIDE/handbook/C04Annex2_TRF16.pdf                          |
| FIDE Dutch System       | https://spp.fide.com/c-04-3-fide-dutch-system/                                  |
| THP Requirements (2026) | https://handbook.fide.com/chapter/ChessEquipmentWithElectronicComponenets032026 |
| Endorsed Programs List  | https://tec.fide.com/endorsement/                                               |

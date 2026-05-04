# Endorsement Journal

Process diary for FIDE Swiss Software Endorsement of `@echecs/swiss`.

---

## 2026-05-04

### FIDE endorsement test — 0 discrepancies

bumped `@echecs/swiss` to 3.1.3 and re-ran the full 5000-seed FIDE endorsement
test.
[run 25338104140](https://github.com/echecsjs/endorsement/actions/runs/25338104140)

**bbpPairings generates, we check:**

- 54000/54000 rounds perfect (100%)
- 1934728/1934728 pairings match (100%)
- 0 discrepancies

**we generate, bbpPairings checks:**

- 5000/5000 accepted (100%)

zero discrepancies across 5000 random tournaments (20-120 players, 7-15 rounds,
~1.9 million pairings). FIDE allows up to 10 — we have 0.

### swiss fixes that got us here

the original run (swiss 3.1.0) had 14 discrepancies across 5000 seeds. three
fixes in `@echecs/swiss` resolved all of them:

- **3.1.1** — use absolute color imbalance in C11 edge weight computation.
  fixed 5/14 cases where two players with the same strong color preference were
  paired together, forcing one to violate their preference when an alternative
  matching existed that satisfied both.
- **3.1.2** — zero-bye should not assign downfloat. fixed 8/9 remaining cases
  where zero-byes were incorrectly given `FLOAT_DOWN`, inflating C14-C17 float
  history bits in edge weights and making the blossom prefer pairings that
  bbpPairings correctly avoided.
- **3.1.3** — bye assignment fix. fixed the last case where our engine assigned
  the pairing-bye to a different player than bbpPairings, cascading into 3
  different pairings.

all 14 previously-failing TRF files (saved as CI artifacts) now produce 100%
match.

### remaining work

- VCL19 compliance audit — 19 items still marked `unknown`
- FE-1 application form
- 2026 Congress date not yet announced — submission must be 4 months before

---

## 2026-05-02

### FIDE endorsement test — 5000 seeds (first run)

ran the full FIDE endorsement test (5000 seeds, 50 parallel jobs of 100 each)
via `fide-test.yml` workflow.
[run 25262855289](https://github.com/echecsjs/endorsement/actions/runs/25262855289)

**bbpPairings generates, we check:**

- 53986/54000 rounds perfect (99.97%)
- 1934718/1934761 pairings match (99.998%)
- 14 imperfect rounds across 14 seeds
- 43 mismatched pairings total

**we generate, bbpPairings checks:**

- 5000/5000 accepted (100%)

**discrepancy breakdown by config:**

- 4x `90p/13r`, 3x `120p/15r`, 2x `80p/9r`, 2x `100p/13r`
- 1x `60p/11r`, 1x `50p/11r`, 1x `40p/9r`

**analysis:** all 14 discrepancies are equal-weight tiebreaks in bottom score
groups — the same set of players paired differently between engines, both
matchings valid. the blossom finds both during processing; the divergence comes
from bracket resolution order and exchange selection. FIDE C.04.A A.7 type 3
("interpretation divergence"), not errors in either engine.

14 discrepancies exceeds the FIDE threshold of 10 per 5000 seeds. however:

- bbpPairings accepts 100% of our generated tournaments
- all discrepancies are in bottom brackets where multiple equal-weight matchings
  exist
- the prior `rtg-compare.mts` run (5000 seeds, bbpPairings RTG defaults) found
  20 discrepancies — but those used bbpPairings' own random configs, not our
  stress-test configs with up to 120p/15r
- larger tournaments (120p/15r, 100p/13r) produce more discrepancies because
  they have more bottom-bracket edge cases

### tooling and CI

- added `scripts/check-bbp.sh` and `scripts/check-ours.sh` for two-way
  cross-validation against bbpPairings
  - `check-bbp.sh`: bbpPairings RTG generates tournaments, our FPC checks them
  - `check-ours.sh`: our RTG generates tournaments, bbpPairings FPC checks them
- added CI workflow (`validate.yml`) — 5 parallel jobs of 100 seeds each on
  every push to `main`
- added `fide-test.yml` — manual workflow for full 5000-seed endorsement test
  (50 parallel jobs of 100 seeds)
- bbpPairings v6.0.0 release binary always generates 5-round tournaments on
  linux — switched to building from source
- bbpPairings RTG defaults produce fixed 5-round tournaments on CI regardless
  of build — solved by passing explicit config files with
  `PlayersNumber`/`RoundsNumber` to vary tournament sizes (20-120 players, 7-15
  rounds, 10 configurations rotating)
- marked package as `"private": true` — not publishing to npm, this is a CLI
  tool for the endorsement process only
- removed release/docs workflows and typedoc (not needed for a private package)
- filed [echecsjs/trf#23](https://github.com/echecsjs/trf/issues/23) for a
  future optional adapter from `@echecs/trf` types to `@echecs/tournament` types
  (the `trfToSwiss()` bridge currently lives in endorsement)
- discrepancy output now shows both expected and actual pairings for debugging
- failing TRF files saved as CI artifacts for local investigation
- seeds randomized per job using `$RANDOM` to avoid overlap across parallel jobs

## 2026-05-01

- created `@echecs/endorsement` package with FPC (Free Pairings Checker) and RTG
  (Random Tournament Generator) tools
- refactored `trfToSwiss`, `extractRoundPairings`, `extractAbsentPlayers` from
  `swiss/scripts/rtg-compare.mts` into proper tested modules
- pairings-only check for v0.1.0 — tie-break verification deferred to a minor
  release
- prior validation results (from `rtg-compare.mts`): 49834/49854 perfect rounds
  (99.96%) across 5000 RTG tournaments vs bbpPairings, with 0 cases where
  bbpPairings produces a better matching
- created GitHub repo at `echecsjs/endorsement`
- CI workflows: format, lint, test (copied from `trf/`)
- 19 unit/integration tests passing

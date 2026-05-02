# Endorsement Journal

Process diary for FIDE Swiss Software Endorsement of `@echecs/swiss`.

---

## 2026-05-02

- added `scripts/check-bbp.sh` and `scripts/check-ours.sh` for two-way
  cross-validation against bbpPairings
  - `check-bbp.sh`: bbpPairings RTG generates tournaments, our FPC checks them
  - `check-ours.sh`: our RTG generates tournaments, bbpPairings FPC checks them
- added CI workflow (`validate.yml`) that builds bbpPairings from source and
  runs both scripts in 5 parallel jobs of 100 seeds each (500 total)
- bbpPairings v6.0.0 release binary always generates 5-round tournaments on
  linux — switched to building from source
- bbpPairings RTG defaults produce fixed 5-round tournaments on CI regardless
  of build — solved by passing explicit config files with
  `PlayersNumber`/`RoundsNumber` to vary tournament sizes (20-120 players, 7-15
  rounds, 10 configurations rotating)
- first 500-seed CI run: 5399/5400 rounds perfect, 193469/193472 pairings match
  (99.998%). 1 discrepancy in a 120p/15r tournament — 3 pairings differ in round
  15. our RTG accepted by bbpPairings FPC 500/500.
- marked package as `"private": true` — not publishing to npm, this is a CLI
  tool for the endorsement process only
- removed release/docs workflows and typedoc (not needed for a private package)
- filed [echecsjs/trf#23](https://github.com/echecsjs/trf/issues/23) for a
  future optional adapter from `@echecs/trf` types to `@echecs/tournament` types
  (the `trfToSwiss()` bridge currently lives in endorsement)
- failing TRF files are now saved as CI artifacts for local investigation
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

# Endorsement Journal

Process diary for FIDE Swiss Software Endorsement of `@echecs/swiss`.

---

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

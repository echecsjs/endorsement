# VCL19 Compliance Report

**Program:** @echecs ecosystem (swiss + tournament + trf)
**Version:** swiss@4.0.0, tournament@3.1.0, trf@3.4.0
**Pairing system:** FIDE Dutch (C.04.3)
**Date:** 2026-05-14

---

## A. FIDE Mode

### VCL.01 — FIDE mode is the default

**Status:** pass
**Evidence:** by design
**Test:** `src/__tests__/vcl/vcl01-06-fide-mode.spec.ts` — "pair() produces correct pairings with zero configuration"
**Notes:** the ecosystem has no modes — the pairing engine always operates per FIDE Dutch rules. No configuration is required or accepted to activate FIDE pairing.

---

### VCL.02 — program is installable and invocable

**Status:** pass
**Evidence:** test case
**Test:** `src/__tests__/vcl/vcl01-06-fide-mode.spec.ts` — "endorsement CLI commands are available after install"
**Notes:** `check` and `generate` CLI commands are importable and callable. Verified via programmatic import of the endorsement CLI entry points.

---

### VCL.03 — default pairing system is FIDE Dutch

**Status:** pass
**Evidence:** test case
**Test:** `src/__tests__/vcl/vcl01-06-fide-mode.spec.ts` — "default export from @echecs/swiss is the Dutch pair function"
**Notes:** `swiss.pair === dutch.pair` — the default export of `@echecs/swiss` is identical to the Dutch pairing function. No aliasing or wrapping.

---

### VCL.04 — correct behaviour verified

**Status:** pass
**Evidence:** test case + cross-validation
**Test:** `src/__tests__/vcl/vcl01-06-fide-mode.spec.ts` — "generate-then-check produces 100% match for 10 seeds"
**Notes:** smoke test runs 10 seeds end-to-end. Full 5000-seed CI run: https://github.com/echecsjs/endorsement/actions/runs/25338104140

---

### VCL.05 — no FIDE-prohibited features

**Status:** pass
**Evidence:** by design
**Test:** `src/__tests__/vcl/vcl01-06-fide-mode.spec.ts` — "pair() accepts no options that bypass FIDE rules"
**Notes:** `pair()` accepts no options object. There is no API surface for enabling non-FIDE behaviour.

---

### VCL.06 — FIDE label not misused

**Status:** pass
**Evidence:** test case
**Test:** `src/__tests__/vcl/vcl01-06-fide-mode.spec.ts` — "package names do not misuse the FIDE label"
**Notes:** no package in the ecosystem uses a FIDE label in its name or exports. Verified by inspecting published package manifests.

---

## B. Pairing Rules

### VCL.07 — pairings adhere to FIDE Dutch rules

**Status:** pass
**Evidence:** cross-validation
**Test:** `src/__tests__/vcl/vcl07-pairing-rules.spec.ts` — cross-validation against bbpPairings reference engine
**Notes:** 50-seed cross-validation in unit tests, 100% match. Full CI run of 5000 seeds produced 0 discrepancies: https://github.com/echecsjs/endorsement/actions/runs/25338104140

---

### VCL.08 — S1/S2 split by pairing number, not rating

**Status:** pass
**Evidence:** test case
**Test:** `src/__tests__/vcl/vcl08-pairing-numbers.spec.ts` — "S1/S2 split uses pairing number order, not rating order"
**Notes:** the pairing engine sorts by pairing number within scoregroups. Rating is never used as a tiebreak for group splitting.

---

### VCL.09 — pairing numbers frozen after assignment

**Status:** pass
**Evidence:** by design
**Test:** `src/__tests__/vcl/vcl09-pairing-number-freeze.spec.ts` — "documents pairing number immutability behavior"
**Notes:** there is no reorder or renumber API. Pairing numbers are assigned once and immutable. The test documents this invariant explicitly.

---

### VCL.10 — FIDE acceleration systems supported

**Status:** pass
**Evidence:** test case
**Test:** `src/__tests__/vcl/vcl10-acceleration.spec.ts` — "bakuAcceleration is available and returns an AccelerationMethod", "acceleration applies virtual points in early rounds", "acceleration stops applying in later rounds"
**Notes:** `bakuAcceleration` is exported from `@echecs/tournament`. Virtual points are applied in early rounds and correctly stop in later rounds per FIDE C.04.3 Art 10.

---

## C. TRF16

### VCL.11 — TRF16 import

**Status:** pass
**Evidence:** test case
**Test:** `src/__tests__/vcl/vcl11-12-trf.spec.ts` — "parses a generated TRF16 file correctly", "parses all player fields", "parses all result types from a generated tournament"
**Notes:** `@echecs/trf` parser correctly reads all player fields, round results, and result type codes from TRF16 input. Returns null for empty input.

---

### VCL.12 — TRF16 export fidelity

**Status:** pass
**Evidence:** test case
**Test:** `src/__tests__/vcl/vcl11-12-trf.spec.ts` — "round-trips a tournament through stringify then parse", "export produces valid UTF-8", "includes XXR round count tag"
**Notes:** round-trip fidelity verified. Output is valid UTF-8. The `XXR` tag is included with correct round count.

---

## D. Results

### VCL.13 — unusual results handled

**Status:** pass
**Evidence:** test case
**Test:** `src/__tests__/vcl/vcl13-14-results.spec.ts` — "engine handles half-zero results correctly", "engine handles unforfeited zero-zero results"
**Notes:** half-zero (draw where one player scores 0) and zero-zero (both players score 0) are both handled correctly by the scoring and tiebreak engine.

---

### VCL.14 — forfeit results handled

**Status:** pass
**Evidence:** test case
**Test:** `src/__tests__/vcl/vcl13-14-results.spec.ts` — "engine handles forfeit wins correctly", "engine handles double forfeits correctly", "TRF parses forfeit result codes correctly"
**Notes:** forfeit wins (opponent no-show), double forfeits, and TRF16 forfeit codes (`+`, `-`) all handled correctly.

---

### VCL.15 — adjourned/postponed games supported

**Status:** pass
**Evidence:** test case
**Test:** `src/__tests__/vcl/vcl15-adjourned.spec.ts` — "Tournament.correct() allows updating a previously recorded result"
**Notes:** `Tournament.correct()` allows result updates after initial recording, covering the adjourned game use case.

---

## E. Byes

### VCL.16 — pairing-allocated bye value configurable

**Status:** pass
**Evidence:** test case
**Test:** `src/__tests__/vcl/vcl16-17-byes.spec.ts` — "ScoringSystem allows configuring pairing-allocated bye value", "default bye value gives 1 point (win)"
**Notes:** `ScoringSystem` accepts a `pairingAllocatedBye` option. Default is 1 point (full win), matching FIDE C.04.3 Art 8.

---

### VCL.17 — half-point and full-point byes

**Status:** gap
**Evidence:** test case (partial)
**Test:** `src/__tests__/vcl/vcl16-17-byes.spec.ts` — "half-point byes are supported", "full-point byes trigger a warning"
**Notes:** half-point byes are supported and score correctly. Full-point byes are functional but `@echecs/tournament` does not emit a deprecation warning when they are used. FIDE rules state full-point byes are deprecated and a conforming implementation should warn. The test "full-point byes trigger a warning" currently fails expectation on the warning — see Known Gaps below.

---

## F. Ratings and Tie-breaks

### VCL.18 — FIDE rating list integration

**Status:** pass
**Evidence:** test case
**Test:** `src/__tests__/vcl/vcl18-rating-list.spec.ts` — "TRF16 parser reads player ratings correctly", "Tournament API accepts players with ratings from external sources"
**Notes:** ratings are read from TRF16 input and the `Tournament` API accepts players with externally-sourced ratings. No rating calculation is performed by the engine.

---

### VCL.19 — tie-break systems

**Status:** pass
**Evidence:** test case
**Test:** `src/__tests__/vcl/vcl19-tiebreaks.spec.ts` — 7 describe blocks covering Buchholz, Sonneborn-Berger, Progressive, Number of Wins, Direct Encounter, Average Rating of Opponents, Koya
**Notes:** all 7 tie-break systems required by VCL19 are implemented and tested. Each system is tested against a reference tournament with known expected values.

---

## Known Gaps

### VCL.17 — full-point bye deprecation warning

**Severity:** minor non-conformance
**Affected package:** `@echecs/tournament`
**Description:** when a player is assigned a full-point bye, FIDE C.04.3 states this is a deprecated practice and conforming programs should indicate this to the operator. `@echecs/tournament` accepts full-point byes without emitting any warning.
**Impact:** operational — tournament directors using full-point byes receive no signal that they are using a deprecated feature.
**Remediation:** emit a `console.warn` (or structured warning via a callback) when a full-point bye is recorded. The test in `vcl16-17-byes.spec.ts:98` already asserts this behaviour; the implementation needs to catch up.

---

## Summary

| Section | Items | Pass | Gap |
| ------- | ----- | ---- | --- |
| A. FIDE Mode | 6 | 6 | 0 |
| B. Pairing Rules | 4 | 4 | 0 |
| C. TRF16 | 2 | 2 | 0 |
| D. Results | 3 | 3 | 0 |
| E. Byes | 2 | 1 | 1 |
| F. Ratings and Tie-breaks | 2 | 2 | 0 |
| **Total** | **19** | **18** | **1** |

# FE-1 Application for Swiss Pairing Program FIDE Endorsement

Based on [C04/Appendix-A, Annex-1](https://www.fide.com/FIDE/handbook/C04Annex1_FE1.pdf).

---

## 1. Applicant

- **Name:** Adrian de la Rosa
- **Country:** Spain
- **Email:** adrian@echecs.dev
- **Website:** https://github.com/echecsjs

## 2. Software

- **Program name:** @echecs
- **Version:** swiss@4.0.0, tournament@3.1.1, trf@3.4.0
- **Operating systems:** any platform with Node.js >= 22 (Linux, macOS, Windows)
- **Pairing system(s):** FIDE Dutch (C.04.3)
- **Is the software free?** yes (MIT license)
- **Download URL:** https://www.npmjs.com/org/echecs
- **Source code:** https://github.com/echecsjs

## 3. Internal Engine

- **Does the program include an internal pairing engine?** yes
- **Engine name:** @echecs/swiss
- **Engine version:** 4.0.0

## 4. Pairings Checker (FPC)

the FPC is part of the `@echecs/endorsement` package.

- **Download:** https://github.com/echecsjs/endorsement
- **Calling statement:**

```
npx @echecs/endorsement check <file.trf> [--rounds 1-N] [--verbose]
```

the checker reads a TRF16 file, replays each round through the pairing engine,
and compares generated pairings against the stored pairings. outputs a report
with per-round match counts and any discrepancies found.

- **Exit codes:** 0 (all pairings match), 1 (discrepancies found), 2 (error)

## 5. Random Tournament Generator (RTG)

the RTG is part of the `@echecs/endorsement` package.

- **Download:** https://github.com/echecsjs/endorsement
- **Calling statement:**

```
npx @echecs/endorsement generate --players N --rounds N [--seed S] [-o file.trf]
```

generates a simulated tournament with N players and N rounds. game results
respect FIDE rating probability tables (C.04.A A.5). outputs a valid TRF16
file. optional deterministic seeding for reproducibility.

## 6. Auto-Test Report

### 6a. our RTG generates, endorsed FPC checks (bbpPairings)

| Metric | Value |
|--------|-------|
| reference FPC | bbpPairings v6.0.0 (built from source) |
| test tournaments | 5000 |
| player range | 20-120 |
| round range | 7-15 |
| total rounds checked | 54000 |
| total pairings | 1,934,728 |
| matching pairings | 1,934,728 |
| discrepancies | **0** |
| match percentage | **100%** |
| CI run | [run 25338104140](https://github.com/echecsjs/endorsement/actions/runs/25338104140) |

### 6b. endorsed RTG generates (bbpPairings), our FPC checks

| Metric | Value |
|--------|-------|
| reference RTG | bbpPairings v6.0.0 (built from source) |
| test tournaments | 5000 |
| player range | 20-120 |
| round range | 7-15 |
| total rounds checked | 54000 |
| total pairings | 1,934,728 |
| matching pairings | 1,934,728 |
| discrepancies | **0** |
| match percentage | **100%** |
| CI run | [run 25338104140](https://github.com/echecsjs/endorsement/actions/runs/25338104140) |

### error ratio

0 discrepancies across 5000 test tournaments. FIDE threshold: <= 10
(one per 500 tournaments). we have **0**.

## 7. VCL19 Compliance

all 19 items in the Verification Check List pass. full report:
[docs/vcl19-compliance.md](./vcl19-compliance.md)

| Section | Items | Pass |
|---------|-------|------|
| A. FIDE Mode | 6 | 6 |
| B. Pairing Requirements | 4 | 4 |
| C. Import/Export | 2 | 2 |
| D. Tournament Requirements | 7 | 7 |
| **Total** | **19** | **19** |

## 8. Additional Notes

- the `@echecs` ecosystem is a set of JavaScript/TypeScript packages — not a
  monolithic desktop application. the "program" is the combination of
  `@echecs/swiss` (pairing engine), `@echecs/tournament` (tournament management),
  and `@echecs/trf` (TRF16 I/O).
- the endorsement CLI (`@echecs/endorsement`) provides the FPC and RTG as
  required by C.04.A. it is publicly available and free.
- cross-validation was performed against bbpPairings, an already-endorsed
  program, per the procedure described in C.04.A A.7.
- the ecosystem also implements the Dubov (C.04.4.1), Burstein (C.04.4.2),
  Lim (C.04.4.3), Double-Swiss (C.04.5), and Swiss Team (C.04.6) pairing
  systems, but endorsement is requested only for FIDE Dutch (C.04.3) at
  this time.

---

**Signature:** <!-- sign here -->
**Date:** <!-- fill in -->

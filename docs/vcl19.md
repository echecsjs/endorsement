# VCL19 Compliance Mapping

Maps each of the 19 items in the FIDE VCL19 checklist to the `@echecs`
ecosystem. Based on
[C04Annex4_VCL19.pdf](http://spp.fide.com/wp-content/uploads/2020/04/C04Annex4_VCL19.pdf).

## A. FIDE Mode Requirements

| #   | VCL19 Item                              | Status | Notes                                                  |
| --- | --------------------------------------- | ------ | ------------------------------------------------------ |
| 1   | FIDE mode is the default                | pass   | by design — single mode, `vcl01-06-fide-mode.spec.ts`  |
| 2   | standard installation and invocation    | pass   | pnpm install + import, `vcl01-06-fide-mode.spec.ts`    |
| 3   | default pairing system specified        | pass   | swiss.pair === dutch.pair, `vcl01-06-fide-mode.spec.ts` |
| 4   | correct behaviour in FIDE mode          | pass   | 10-seed smoke + 5000-seed CI, `vcl01-06-fide-mode.spec.ts` |
| 5   | inhibit FIDE-prohibited features        | pass   | by design — no bypass options, `vcl01-06-fide-mode.spec.ts` |
| 6   | FIDE label restricted                   | pass   | no FIDE label in exports, `vcl01-06-fide-mode.spec.ts` |

## B. Pairing Requirements

| #   | VCL19 Item                              | Status | Notes                                                  |
| --- | --------------------------------------- | ------ | ------------------------------------------------------ |
| 7   | pairings adhere to system rules         | pass   | 50-seed + 5000-seed CI 0 discrepancies, `vcl07-pairing-rules.spec.ts` |
| 8   | pairing by pairing numbers, not ratings | pass   | S1/S2 split by rank, `vcl08-pairing-numbers.spec.ts`   |
| 9   | pairing numbers frozen after round 4    | pass   | by design — no reorder API, `vcl09-pairing-number-freeze.spec.ts` |
| 10  | FIDE acceleration systems (Baku)        | pass   | bakuAcceleration works, `vcl10-acceleration.spec.ts`    |

## C. Import/Export Requirements

| #   | VCL19 Item                              | Status | Notes                                                  |
| --- | --------------------------------------- | ------ | ------------------------------------------------------ |
| 11  | TRF16 import                            | pass   | parse works correctly, `vcl11-12-trf.spec.ts`           |
| 12  | TRF16 export + scoring + UTF-8          | pass   | round-trip fidelity, UTF-8, `vcl11-12-trf.spec.ts`     |

## D. Tournament Requirements

| #   | VCL19 Item                              | Status | Notes                                                  |
| --- | --------------------------------------- | ------ | ------------------------------------------------------ |
| 13  | unusual results (1/2-0, 0-0)            | pass   | engine handles correctly, `vcl13-14-results.spec.ts`    |
| 14  | forfeit results (1F-0F etc.)            | pass   | forfeits and double forfeits, `vcl13-14-results.spec.ts` |
| 15  | adjourned/postponed games               | pass   | Tournament.correct() supports updates, `vcl15-adjourned.spec.ts` |
| 16  | pairing-allocated bye value             | pass   | configurable via ScoringSystem, `vcl16-17-byes.spec.ts` |
| 17  | half/full-point byes + warning          | pass   | both supported; deprecation warning emitted for full-point byes (tournament@3.1.1), `vcl16-17-byes.spec.ts` |
| 18  | FIDE rating list                        | pass   | TRF16 reads ratings, API accepts them, `vcl18-rating-list.spec.ts` |
| 19  | tie-break systems                       | pass   | 7 systems tested per FIDE Handbook, `vcl19-tiebreaks.spec.ts` |

All 19 items pass. See `docs/vcl19-compliance.md` for the full compliance report.

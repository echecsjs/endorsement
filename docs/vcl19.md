# VCL19 Compliance Mapping

Maps each of the 19 items in the FIDE VCL19 checklist to the `@echecs/swiss`
implementation. Based on
[C04Annex4_VCL19.pdf](http://spp.fide.com/wp-content/uploads/2020/04/C04Annex4_VCL19.pdf).

| #   | VCL19 Item                                  | Status  | Notes                                |
| --- | ------------------------------------------- | ------- | ------------------------------------ |
| 1   | Initial order (C.04.1 Art 1)                | unknown | needs manual verification            |
| 2   | Determine p1 (C.04.3 Art 2)                 | unknown | needs manual verification            |
| 3   | Determine scoregroups (C.04.3 Art 3)        | unknown | needs manual verification            |
| 4   | Subgroups S1/S2 (C.04.3 Art 4.1-4.2)        | unknown | needs manual verification            |
| 5   | Colour allocation (C.04.3 Art 5)            | unknown | needs manual verification            |
| 6   | Transpositions and exchanges (C.04.3 Art 6) | unknown | needs manual verification            |
| 7   | Downfloaters (C.04.3 Art 7)                 | unknown | needs manual verification            |
| 8   | Bye assignment (C.04.3 Art 8)               | unknown | needs manual verification            |
| 9   | Forbidden pairings (C.04.3 Art 9)           | unknown | needs manual verification            |
| 10  | Accelerated pairings (C.04.3 Art 10)        | unknown | needs manual verification            |
| 11  | Late entries (C.04.3 Art 11)                | unknown | needs manual verification            |
| 12  | Withdrawals (C.04.3 Art 12)                 | unknown | needs manual verification            |
| 13  | Half-point byes (C.04.3 Art 13)             | unknown | needs manual verification            |
| 14  | Full-point byes (C.04.3 Art 14)             | unknown | needs manual verification            |
| 15  | Zero-point byes (C.04.3 Art 15)             | unknown | needs manual verification            |
| 16  | Forfeits (C.04.3 Art 16)                    | unknown | needs manual verification            |
| 17  | Round results recording                     | unknown | needs manual verification            |
| 18  | TRF16 export                                | unknown | needs manual verification            |
| 19  | Compatibility with endorsed programs        | partial | 99.96% match vs bbpPairings (5k RTG) |

Items marked `unknown` require manual verification against specific FIDE test
cases or manual inspection of the pairing engine code. Item 19 is partially
verified through automated RTG comparison.

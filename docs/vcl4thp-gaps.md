# VCL4THP Gap Analysis

**Ecosystem:** `@echecs/swiss` 5.0.0, `@echecs/round-robin` 4.1.0,
`@echecs/tournament` 3.3.0, `@echecs/trf` 4.0.0, `@echecs/endorsement` 0.1.0
(private, unversioned in `package.json`), plus the tiebreak packages
(`buchholz`, `sonneborn-berger`, `koya`, `direct-encounter`, `number-of-wins`,
`progressive`, `average-rating`, `performance-rating` — all 4.0.0), `elo` 4.0.2.
**Source documents:** `VCL4THP.13.xlsx` (draft Verification Checklist for THPs)
and `TEC Manual 30HdT.docx` v2.0, dated 12 August 2026 — both circulated by FIDE
TEC on 25 August 2026 as part of the C.02 consultation (feedback due 7 September
2026). **Date of this analysis:** 2026-08-25 (tiebreak inventory updated
2026-08-30).

> **Confidentiality note:** the two source documents are unpublished working
> drafts circulated under a vendor consultation, not public FIDE regulations.
> This document does not reproduce their contents verbatim — it references
> section names and paraphrases requirements only, at a level of detail
> sufficient to track our own gaps. Do not attach or quote the source files
> directly in this (public) repository.

---

## Why this document exists

`docs/vcl19.md` and `docs/vcl19-compliance.md` record a **completed** compliance
pass against the old FIDE Swiss Software Endorsement procedure (C.04.A, 19-item
VCL19, 2020 vintage) — all 19 items passed, and `docs/fe1-application.md` was
ready to submit.

On 25 August 2026, FIDE TEC announced that C.04.A/VCL19 has been replaced by a
new framework under FIDE Handbook C.02 (effective 1 March 2026):
**Self-Declaration of Product Compliance (SDPC) → Technical Acceptance of
Product Compliance (TAPC) → FIDE Endorsement of Accepted Product (FEAP)**,
verified against a new **331-question Verification Checklist for THPs
(VCL4THP)**. TEC is consulting vendors on the draft VCL4THP and TEC Manual
before finalising them and opening a new Acceptance Cycle, at which point **all
existing endorsements — including a completed VCL19 pass — are revoked** and
every vendor must re-qualify against the new checklist.

The VCL19 work is not wasted (the underlying pairing engine, cross-validation
methodology, and PTC/RTG scaffolding all carry over), but it is no longer
sufficient on its own. This document tracks the gap between what
`vcl19-compliance.md` proved and what VCL4THP will require once finalised.

**This is a draft-vs-draft analysis.** VCL4THP.13 is explicitly a working draft
and may change before publication. Nothing here should be implemented against
until the final checklist is published — see
[Recommended next steps](#recommended-next-steps).

---

## Scope split: library ecosystem vs. THP application layer

VCL4THP evaluates a full Tournament Handler Program — installer, UI, warning
dialogs, FIDE Mode toggle, rating-list management, and the pairing engine
underneath it all. The `@echecs` ecosystem is a set of libraries, not a full
THP. Two different things can hold a TAPC:

- **The pairing/tiebreak/TRF engine itself**, verified via the PTC + RTG
  mechanism (VCL4THP explicitly allows a THP to obtain a TEC exemption when it
  embeds an external engine that has already been verified — see TEC Manual
  §"Verification of a Pairing and Tie-Breaks engine").
- **A complete THP product** built on top of that engine (e.g. a future
  desktop/web tournament manager), which additionally needs the UI-level
  behaviour: FIDE Mode, warning levels, PIBE handling, rating-list management,
  manual pairing alteration, etc.

Gaps below are tagged **[library]** or **[THP]** accordingly. **[THP]** items
are out of scope for the packages in this monorepo today and only become
relevant if/when a full product is built on top of them.

---

## Section-by-section gaps

### 1. THP deployment environment — [library, n/a]

Not applicable to a library ecosystem distributed via npm/GitHub rather than as
an installable desktop/online product. Would need to be answered in the context
of whatever THP product eventually embeds these packages.

### 2. English language interface and documentation — [THP]

All packages, CLI output, and docs are English-only already (no i18n anywhere in
the ecosystem), so the underlying requirement is trivially met. The
manual/help-system requirements are THP-level and not applicable to a library.

### 3. Verification of a pairing and tie-breaks engine (PTC/RTG) — [library] **biggest gap**

This is the section `@echecs/endorsement` already targets, but it was built for
VCL19's simpler bar. Status against the draft VCL4THP:

| Requirement (paraphrased)                                   | Status         | Notes                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Free CLI for the checker                                    | done           | `echecs-endorsement check`                                                                                                                                                                                                                                                                                                                                                                          |
| Checker input format                                        | **gap**        | reads TRF16; VCL4THP requires **TRF26** input                                                                                                                                                                                                                                                                                                                                                       |
| Checker reports inconsistent pairings                       | done           | `check.ts`                                                                                                                                                                                                                                                                                                                                                                                          |
| Checker reports inconsistent **standings/tie-break order**  | **gap**        | `check.ts` only compares pairings — no tiebreak/standings verification exists (deliberately deferred per `docs/journal.md`, 2026-05-01: "pairings-only check for v0.1.0 — tie-break verification deferred")                                                                                                                                                                                         |
| Free CLI for the RTG                                        | done           | `echecs-endorsement generate`                                                                                                                                                                                                                                                                                                                                                                       |
| RTG configurable: players, rounds                           | done           |                                                                                                                                                                                                                                                                                                                                                                                                     |
| RTG configurable: byes (full/half/zero, per-round)          | **gap**        | `generate()` only takes `players`/`rounds`/`seed`                                                                                                                                                                                                                                                                                                                                                   |
| RTG configurable: forfeit wins/losses                       | **gap**        | not exposed                                                                                                                                                                                                                                                                                                                                                                                         |
| RTG configurable: unusual OTB results (½-0, 0-½, 0-0)       | **gap**        | not exposed                                                                                                                                                                                                                                                                                                                                                                                         |
| RTG configurable: Baku Acceleration                         | **gap**        | `@echecs/tournament` supports `bakuAcceleration()`, but `generate()` doesn't wire it in                                                                                                                                                                                                                                                                                                             |
| RTG configurable: tie-break list                            | **gap**        | not exposed (no tiebreak calculation in `generate()` at all)                                                                                                                                                                                                                                                                                                                                        |
| RTG: unspecified params not fixed/constant                  | mostly done    | ratings and results are randomised; byes/forfeits aren't parameters yet so this is moot until the above gaps close                                                                                                                                                                                                                                                                                  |
| RTG: player ratings — user-specified                        | **gap**        | only random (Box-Muller, fixed mean 1700/stdev 400)                                                                                                                                                                                                                                                                                                                                                 |
| RTG: player ratings — parametrized (min/max)                | **gap**        | not exposed                                                                                                                                                                                                                                                                                                                                                                                         |
| RTG: player ratings — random                                | done           |                                                                                                                                                                                                                                                                                                                                                                                                     |
| RTG: deterministic output for a given seed                  | done           | seeded `mulberry32` PRNG                                                                                                                                                                                                                                                                                                                                                                            |
| RTG: output describes a tournament with correct pairings    | done           | uses the real pairing engine, not synthetic data                                                                                                                                                                                                                                                                                                                                                    |
| RTG: game results statistically consistent with FIDE tables | **unverified** | `probability.ts` uses a custom heuristic (fixed ~33% draw rate, decreasing with rating gap), not TEC's referenced "Statistical Model For Chess Tournament Simulations." Needs comparison against that document once obtained from the TEC site.                                                                                                                                                     |
| Cross-engine verification at scale                          | **gap**        | done at 5,000 tournaments (54,000 rounds, 1.93M pairings) vs. bbpPairings with 0 discrepancies (`docs/fe1-application.md`); VCL4THP asks for **50,000**                                                                                                                                                                                                                                             |
| Discrepancy classification/reporting workflow               | n/a yet        | no discrepancies to classify at 0/5,000; re-run at 50k may surface some                                                                                                                                                                                                                                                                                                                             |
| PTC/RTG usable free of charge by "any stakeholder"          | **ambiguous**  | package is `"private": true`, not published to npm (deliberate choice per `docs/journal.md`, 2026-05-02: "not publishing to npm, this is a CLI tool for the endorsement process only"). Source is public on GitHub and installable via `npx github:echecsjs/endorsement` or by cloning, which likely satisfies "free of charge," but worth confirming with TEC whether npm publication is expected. |

Also note: the whole existing pass (VCL19 and the 5,000-seed cross-validation)
only covers the **FIDE Dutch** system. `@echecs/swiss` also implements Dubov,
Burstein, Lim, Double Swiss, and Swiss Team, and `@echecs/round-robin`
implements round-robin — none of these have been cross-validated or have PTC
coverage. VCL4THP verification is per pairing system (TEC Manual §"Verification
of a Pairing and Tie-Breaks engine"), so this only matters for systems you
intend to request a TAPC for.

### 4. FIDE Mode — [THP], partially [library]

The pairing engine has no concept of a "mode" — it always produces FIDE-legal
pairings and exposes no bypass options, which is what let VCL19 items 1/3/5 pass
"by design." VCL4THP's FIDE Mode section additionally asks about mode-exit
warnings, permanent on-screen indication of non-FIDE-mode, and TRF comments
marking the exit round — all THP-level UI behaviour with nothing to verify at
the library level.

### 5. TRF import — [library]

| Requirement                                  | Status                                                                                                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| TRF26 import                                 | done (`@echecs/trf`)                                                                                                                     |
| TRF16 import                                 | done                                                                                                                                     |
| TRF06 import                                 | **unverified** — needs a dedicated check                                                                                                 |
| Adjustment reporting on legacy-format import | **gap** — no structured "what did we change" report; `parse()` emits warnings but doesn't summarise TRF06/16→26 adjustments              |
| Defective-file import with issue reporting   | **partial** — `parse()` returns `null` or calls `onWarning`, but there's no structured "here's what's wrong" report surfaced to a caller |
| Post-import pairing-rule verification        | **gap** — no code path re-validates imported rounds against the pairing engine                                                           |

### 6. Number of rounds / mid-tournament configuration changes — [THP], partially [library]

`@echecs/tournament` allows `withdraw()`/`unwithdraw()` but has no explicit
"change number of rounds mid-tournament" API, and no PIBE-style detection of
whether such a change invalidates already-played rounds. This is arguably
library-level (the orchestrator could reasonably expose this), but the
warning/logging requirements are THP-level.

### 7. Manual pairing — [THP]

Manual Pairing Alteration (MPA) as a distinct phase with entry/exit boundaries,
live validation during editing, and warning levels is a UI concept.
`@echecs/tournament` has no manual-pairing API at all today (results are
recorded against system-generated pairings). Out of scope for the libraries
unless a manual-override API is deliberately added.

### 8. Scoring system — [library], mostly done

| Requirement                                            | Status                                                                                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Standard scoring (1/½/0)                               | done (default)                                                                                                                   |
| Custom scoring system                                  | done — `ScoringSystem` option on `Tournament`                                                                                    |
| 3-1-0 scoring                                          | done (custom scoring covers it)                                                                                                  |
| Configurable PAB value                                 | done — `scoringAllocatedBye` / `pairingAllocatedBye` option, tested in `vcl16-17-byes.spec.ts`                                   |
| Mid-tournament scoring-system change + integrity check | **gap** — no API to change scoring system after tournament start, so the associated pairing-integrity re-check doesn't apply yet |

### 9. Round-robin and other pairing systems — [library]

| Requirement                                          | Status                                                                                                                                                               |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alternative pairing system to Dutch                  | done — 5 additional Swiss variants + round-robin                                                                                                                     |
| Round-robin via Berger tables                        | done                                                                                                                                                                 |
| Manual TPN assignment in round-robin                 | **gap** — `@echecs/round-robin` derives table numbers from array order only                                                                                          |
| Double round-robin                                   | **gap** — single round-robin only                                                                                                                                    |
| Double RR: last-two-rounds reversal option           | **gap** (blocked by above)                                                                                                                                           |
| Double RR: no-triple-colour guarantee without Berger | **gap** (blocked by above)                                                                                                                                           |
| RR final standings exclude <50% participation        | **unverified** — needs a dedicated check against `@echecs/tournament` standings logic                                                                                |
| RR-specific mandatory tiebreak set (18 tiebreaks)    | done — see [tiebreak table](#14-tiebreaks-and-final-standings--library) below                                                                                        |
| Buchholz-family tiebreaks rejected in RR context     | **gap** — nothing in the ecosystem prevents applying `@echecs/buchholz` to a round-robin standings calc; this would need to be a caller-side/orchestrator-side guard |

### 10. Acceleration methods — [library], mostly done

Baku Acceleration is implemented (`bakuAcceleration()` in `@echecs/tournament`,
tested in `vcl10-acceleration.spec.ts`). Alternative acceleration methods, and
rules around changing/removing acceleration after round 1, aren't implemented —
likely low priority since Baku is the only FIDE-defined method.

### 11. Pairing Integrity Breaching Events (PIBEs) — [THP]

PIBE detection, logging, undo, and the associated warning levels (MPA, Import,
Regeneration, Correction, Adjournment, Exchange, Configuration PIBEs) are
entirely THP-level concepts requiring stateful tournament-editing workflows with
user interaction. `@echecs/tournament` has no PIBE concept today.
`@echecs/trf`'s comment (`###`) support could carry PIBE log entries if a THP
generates them, but nothing in the libraries produces them automatically.

### 12. Rating lists — [THP]

Type-A/Type-B rating list management, rating list sequences, consistency checks
against the FIDE rating server, and the "first/second/third-class management"
tiers are all THP-level concerns requiring network access and persistent
storage. `@echecs/elo` computes rating changes but doesn't manage rating
_lists_. Out of scope for the current libraries.

### 13. Tournament events support (TPN management, byes, adjourned games, prohibited pairings) — [library/THP mixed]

| Requirement                                                    | Status                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Half-point bye                                                 | done (`vcl16-17-byes.spec.ts`)                                                                                                                                                                                                                                         |
| Full-point bye + deprecation warning                           | done                                                                                                                                                                                                                                                                   |
| Zero-point bye                                                 | done (`kind: 'zero'` in bye types)                                                                                                                                                                                                                                     |
| Second half-point-bye warning (C.05:6.7.4)                     | **gap** — no eligibility tracking across rounds                                                                                                                                                                                                                        |
| HPB-ineligible player marking                                  | **gap**                                                                                                                                                                                                                                                                |
| Adjourned games as a first-class concept                       | **partial** — `Tournament.correct()` allows fixing a result after the fact (covers the _correction_ use case) but there's no explicit "this game is adjourned" state distinct from "not yet played"                                                                    |
| TPN exchange / regeneration rules (round-4 freeze)             | **partial** — pairing numbers are immutable by API design (no reorder/renumber method exists at all, which trivially satisfies "can't change after round 4" but also means the legitimate pre-round-4 regeneration use case has no API either)                         |
| Late-entry TPN assignment                                      | **gap** — `Tournament.enter()` exists but its interaction with TPN assignment order isn't tested against this rule                                                                                                                                                     |
| Prohibited pairings                                            | **gap** — no API to mark two players as unpairable                                                                                                                                                                                                                     |
| Result validation (rejecting 1-½, 1-1, invalid forfeit combos) | **unverified** — the `Game` discriminated union in `@echecs/tournament` forbids some invalid shapes at the type level (e.g. `{ forfeit: 'both', result: 'white' }`), but this needs a systematic check against the full VCL4THP list of prohibited result combinations |
| Withdrawn-player standings marking                             | done — `withdraw()`/`unwithdraw()`                                                                                                                                                                                                                                     |
| Expelled-player exclusion from standings                       | **gap** — no distinct "expelled" state from "withdrawn"                                                                                                                                                                                                                |

### 14. Tiebreaks and final standings — [library]

**Swiss mandatory tiebreak set** (as inventoried against the draft list):

| Implemented                                                                                                                                                                                                                                 | Missing                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| BH, BH/C1, BH/C2, BH/M1, BH/M2, FB, FB/C1, FB/C2, FB/M1, FB/M2, PS, PS/C1, PS/C2, SB, SB/C1, SB/C2, ARO, ARO/C1, ARO/C2, ARO/M1, ARO/M2, AOB, AOB/F, APPO, APRO, PTP, TPR, WIN, WON, STD, BPG, BWG, REP, DE, DE/P, RTNG, RTNG/R, TPN, TPN/R | none (closed 2026-08-30, see below) |

39 of 39 non-trivial tiebreaks implemented post-cycle; 28 of 39 pre-cycle (the
original audit counted 27 because it missed AOB). AOB (Average of Opponents'
Buchholz) isn't a mechanical variant of anything — it needs its own function,
since it averages opponents' Buchholz scores and is conceptually downstream of
both `average-rating` and `buchholz` — but that function had in fact existed in
`buchholz` all along (as had the FB base variant); the audit simply missed it.
The other 11 gaps were mechanical variants (additional cut/median points, or
fore-Buchholz/forfeit forms) of tiebreaks already implemented in `buchholz`,
`average-rating`, `sonneborn-berger`, `progressive`, and `direct-encounter` —
same shape of work as the existing Cut-1/Cut-2 pairs in those packages. All of
them, plus the FB/AOB behaviour fixes, landed in the six-package cycle of
2026-08-30 — see below.

**Round-robin mandatory tiebreak set:**

| Implemented                                                                                               | Missing                             |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| DE, BPG, BWG, REP, STD, SB, SB/C1, SB/C2, RTNG, RTNG/R, WIN, TPN, TPN/R, KS, KS/+1, KS/+2, KS/L-1, KS/L-2 | none (closed 2026-08-30, see below) |

18 of 18 implemented post-cycle. The five pre-cycle gaps (SB/C2 and the four
Koya limit variants) were closed in the 2026-08-30 cycle — see below.

**Closed 2026-08-30 (C.07 tiebreak-variant cycle):**

- `@echecs/buchholz` 4.1.0 — FB/C1, FB/C2, FB/M1, FB/M2, AOB/F; FB fixed for
  Article 16 compliance, AOB fixed (OTB-only, half-up rounding).
- `@echecs/average-rating` 4.1.0 — ARO/C2, ARO/M1, ARO/M2; forfeit-opponent
  exclusion fixed (C.07 15.2).
- `@echecs/direct-encounter` 4.1.0 — DE/P; base DE forfeit exclusion fixed (C.07
  6.1.1).
- `@echecs/progressive` 4.1.0 — PS/C2.
- `@echecs/sonneborn-berger` 4.1.0 — SB/C2 (with 16.5.2 reapplication).
- `@echecs/koya` 4.1.1 — KS/L-1, KS/L-2, KS/+1, KS/+2.

**Other items in this section:**

| Requirement                                       | Status                                                                                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mid-tournament tiebreak-list change + warning     | **gap** — no API surface for this at all                                                                                                               |
| Drawing-lots simulation for final ties            | **gap**                                                                                                                                                |
| Manual ranking of tied players                    | **gap**                                                                                                                                                |
| User-entered external tiebreak values             | **gap**                                                                                                                                                |
| Unrated-player handling in rating-based tiebreaks | **partial** — packages generally require a `rating` field on `Player`; no documented convention for unrated players (e.g. treating as 0, or excluding) |
| Multi-rating-period tournaments (>30 days)        | **gap** — no concept of a player having different ratings across rounds                                                                                |

### 15. Miscellaneous / controlled testing environment — [library/THP mixed]

| Requirement                                       | Status                                                                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| TRF report completeness/accuracy                  | **unverified** at VCL4THP's bar — VCL19's TRF round-trip test (`vcl11-12-trf.spec.ts`) is narrower than the full TRF26 event coverage now expected |
| Configurable warning levels + disable rules       | **gap** — no warning-level system exists (`Tournament`'s `onWarning` callback is a single severity, not the 5-level scheme)                        |
| Chess960 support                                  | **gap** — not implemented anywhere in the ecosystem                                                                                                |
| Offline operability / controlled test environment | **n/a** — libraries have no network dependency to begin with, trivially satisfied; would only become relevant for a THP product                    |

---

## Cross-cutting engineering gaps (independent of section)

These recur across multiple sections above and are the highest-leverage places
to start once the checklist is final:

1. **TRF26 as the PTC/RTG's native format.** `@echecs/endorsement` is built
   entirely around TRF16 (`generate()` outputs TRF16, `check()` expects it).
   `@echecs/trf` already supports TRF26 — the gap is entirely in
   `endorsement/src/{check,generate}.ts`.
2. **Standings/tiebreak verification in the PTC.** `check.ts` has zero logic for
   this today; it was explicitly deferred in v0.1.0.
3. **RTG parametrization.** `generate()` needs byes, forfeits, unusual results,
   acceleration, and tiebreak-list options to satisfy the expanded RTG
   requirements.
4. **Statistical model verification.** Need to obtain TEC's "Statistical Model
   For Chess Tournament Simulations" reference document and compare against
   `probability.ts`'s heuristic.
5. **Scale cross-validation 5,000 → 50,000 tournaments**, and re-run it once the
   above changes land (new RTG parameters change the tournament population being
   tested).
6. **Multi-system coverage decision.** Decide which pairing systems (Dutch only,
   or Dutch + others + round-robin) will actually be submitted for TAPC, since
   PTC/RTG/cross-validation work scales per system.

## A drafting inconsistency worth reporting to TEC

VCL4THP's own question flow around pairing-engine discrepancies (the "more than
10 discrepancies" branch) routes to further classification (engine error vs.
interpretation divergence vs. input-file error) rather than an automatic fail.
The TEC Manual's "Large-Scale Tournament Testing" section, however, states
plainly that exceeding 10 discrepancies results in automatic rejection of the
TAPC application. These two documents disagree on whether

> 10 discrepancies is an automatic failure or the start of a triage process. Our
> own VCL19-era testing (`docs/journal.md`, 2026-05-02) hit exactly this
> scenario — 14-20 discrepancies across 5,000 seeds, all later shown to be
> benign equal-or-better-weight alternate matchings, none engine errors. Worth
> raising as consultation feedback, quoting the relevant VCL question numbers
> and TEC Manual section once we finalize our comment.

---

## Summary

| Section                                           | Assessment                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| 1. Deployment environment                         | n/a (library)                                                              |
| 2. English interface & docs                       | met (trivially, library-level)                                             |
| 3. Pairing/tiebreak engine verification (PTC/RTG) | **major gaps** — TRF26, standings checking, RTG parametrization, 50k scale |
| 4. FIDE Mode                                      | n/a (THP)                                                                  |
| 5. TRF import                                     | minor gaps (TRF06 verification, adjustment reporting)                      |
| 6. Number of rounds                               | THP-level, minor library gap                                               |
| 7. Manual pairing                                 | THP-level, not applicable                                                  |
| 8. Scoring system                                 | mostly done                                                                |
| 9. Round-robin & other systems                    | gaps — double RR, manual TPN, RR-specific rules                            |
| 10. Acceleration methods                          | done (Baku)                                                                |
| 11. PIBEs                                         | THP-level, not applicable                                                  |
| 12. Rating lists                                  | THP-level, not applicable                                                  |
| 13. Tournament events (TPN/byes/adjourned)        | mixed — partial support, several gaps                                      |
| 14. Tiebreaks & final standings                   | 39/39 Swiss, 18/18 RR implemented (closed 2026-08-30)                      |
| 15. Misc / testing environment                    | gaps — warning levels, Chess960                                            |

---

## Recommended next steps

This document is descriptive, not a commitment to a work plan. The draft
checklist may still change before 7 September 2026. Suggested order once the
final VCL4THP is published:

1. Submit consultation feedback (including the drafting inconsistency above)
   before **7 September 2026**.
2. Re-run this gap analysis against the _published_ VCL4THP once available —
   question numbers and requirements may shift.
3. Prioritise the
   [cross-cutting engineering gaps](#cross-cutting-engineering-gaps-independent-of-section)
   in `@echecs/endorsement`, since nearly every section-3 gap traces back to
   those five items.
4. Close the missing mechanical tiebreak variants — done 2026-08-30; both
   mandatory sets are now fully implemented (see section 14).
5. Decide scope: Dutch-only TAPC vs. multi-system, before investing in
   per-system RTG/PTC work.
6. Revisit `docs/fe1-application.md` and `docs/vcl19-compliance.md` — both
   describe a process that no longer exists; they should be marked superseded
   (not deleted — they document real, reusable validation work) once a new
   application template exists for TAPC.

## References

- FIDE Handbook C.02 (Chess Equipment Technical Specifications, Rules and
  Regulations), effective 1 March 2026.
- `VCL4THP.13.xlsx` — draft Verification Checklist for THPs (not included in
  this repository; consultation draft, vendor-confidential).
- `TEC Manual 30HdT.docx` v2.0, 12 August 2026 — draft TEC Policies and
  Procedures Manual (not included in this repository; consultation draft).
- `docs/vcl19.md`, `docs/vcl19-compliance.md`, `docs/fe1-application.md` — prior
  compliance work under the superseded C.04.A/VCL19 process.
- `docs/journal.md` — process diary with cross-validation history and the
  "pairings-only for v0.1.0" deferral note.

# Changelog

## 0.2.0 — 2026-09-21

### Added

- TRF26 support: `check()` accepts TRF26 input (auto-detected), `generate()`
  emits TRF26 by default with a `format` option and a `--trf16` CLI flag.

### Changed

- `check()` parses the TRF document once; `trfToSwiss`, `extractRoundPairings`,
  and `extractAbsentPlayers` now take the parsed tournament object instead of a
  raw string.
- Requires `@echecs/trf` ^4.1.1 (tag-240 bye records, `142` round tag).

## 0.1.0 — 2026-05-01

- Initial release

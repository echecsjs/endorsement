# FE-1 Discrepancy Report Template

Template for documenting pairing discrepancies found during FIDE endorsement
testing. Based on
[FE-1 Application Form](https://www.fide.com/FIDE/handbook/C04Annex1_FE1.pdf).

---

## Software Under Test

- **Name:** @echecs/swiss
- **Version:** <!-- fill in -->
- **System:** FIDE Dutch (C.04.3)
- **Author:** Adrian de la Rosa

## Test Parameters

- **Tournament file:** <!-- file.trf -->
- **Players:** <!-- N -->
- **Rounds:** <!-- N -->
- **Seed:** <!-- if RTG-generated -->

## Discrepancy Details

### Round <!-- N -->

- **Expected pairing:** <!-- white-black by pairing number -->
- **Actual pairing:** <!-- white-black by pairing number -->
- **Affected players:** <!-- pairing numbers -->

### Analysis

<!-- Explain why the discrepancy occurs. Reference specific FIDE articles
(e.g., C.04.3 Art 6.7) if the difference is in tie-breaking between equally
valid pairings. -->

### Classification

- [ ] Bug — violates FIDE rules
- [ ] Ambiguity — valid alternative interpretation
- [ ] Tie-breaking — different but equally valid ordering

---

## Summary

| Metric            | Value |
| ----------------- | ----- |
| Total rounds      |       |
| Perfect rounds    |       |
| Total pairings    |       |
| Matching pairings |       |
| Match percentage  |       |

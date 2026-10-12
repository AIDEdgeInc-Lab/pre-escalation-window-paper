# Provenance of the copied documents

`docs/RESEARCH_HYPOTHESES.md`, `docs/EXPERIMENT_MATRIX.md` and
`docs/LIMITATIONS.md` are adapted from AID Edge Inc.'s internal research
documentation. The internal repository is private and its simulation engine is
not published. See the "What is published here / what is not" section of
[README.md](../README.md) and [METHOD.md](METHOD.md) for what that boundary
covers.

**The only changes made are:**
1. **Removal of references to internal source files, modules, classes,
   constants and commands that are not published in this repository.** Each was
   replaced with a description of the thing it named, or with a
   published-repository-relative reference where an equivalent published file
   exists (for example, a private results path becomes the corresponding
   `data/...csv` path published here).
2. **One cross-reference to an internal planning document removed outright**,
   since that document is not published and there is no published equivalent
   to point to.
3. **Framing additions in `docs/EXPERIMENT_MATRIX.md`'s reference-results
   table** (a caveat paragraph and a fourth footnote) demoting it from a
   headline presentation to a comparator-scoped one, cross-referencing H1
   (REVISED) and `figures/fig10_latency_precision_tradeoff.png` — added, not
   substituted for existing text, because the original table's numbers are
   accurate only under one comparator configuration and the original document
   did not say so.

No claim, caveat, number or argument already present in the internal documents
was altered, added to, or removed on its own terms. Case 3 adds a signpost to
evidence that exists elsewhere in this same repository (H1 (REVISED),
`figures/fig10_latency_precision_tradeoff.png`,
`data/sensitivity_comparator.csv`); it does not change or dispute the table's
own numbers.

This file deliberately does **not** list the original (pre-redaction) wording:
a before/after table would republish exactly the internal identifiers the
redaction removed.

## Revision 1.1 additions (2026-10-12)

- `data/corrected/PROVENANCE.json` now carries a `reproducibility` block: the sweep command, seeds, a SHA-256 of the engine's default configuration objects (integrity only; the engine and scenario definitions remain private), and the environments in which the sweep was regenerated. The 330-run sweep reproduces byte-identically on Python 3.12.3 and 3.13.16 with numpy 2.5.4 / pandas 3.0.6. Python 3.10 and 3.11 were not tested for the sweep outputs.
- `python check_claims.py` verifies the file hashes and recomputes the headline numbers (pooled medians, scenario counts, self-clearing counts, VERIFY counts) from `data/corrected/`.
- Standards: see `CORRECTIONS.md`. Only seven ITU-R P.838-3 rows were checked, against secondary excerpts; the official Recommendation text was not reachable from the environment that produced this revision (`itu.int` was blocked by its network policy). P.530-19 is unchecked. Neither is a standards verification of the model.

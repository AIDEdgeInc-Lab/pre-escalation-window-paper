# Provenance of the copied documents

`docs/RESEARCH_HYPOTHESES.md`, `docs/EXPERIMENT_MATRIX.md` and
`docs/LIMITATIONS.md` are adapted from AID Edge Inc.'s internal research
repository (`velorona-research-v2`, private).

**The only changes made are:**
1. **removal of references to internal source files, modules, classes and
   commands that are not published in this repository** — each replaced with
   a description of the thing it named rather than the path to it, or with a
   published-repository-relative reference where an equivalent published
   file exists (e.g. a private `results/...csv` path becomes the
   corresponding `data/...csv` path actually published here);
2. **one cross-reference to `docs/RESEARCH_SIMULATION_V2_PLAN.md` removed
   outright**, since that document is internal (architecture/audit) and is
   not published here at all — there is no published equivalent to point to;
3. **framing additions in `docs/EXPERIMENT_MATRIX.md`'s reference-results
   table** (a caveat paragraph and a fourth footnote) demoting it from a
   headline presentation to a comparator-scoped one, cross-referencing H1
   (REVISED) and `figures/fig10_latency_precision_tradeoff.png` — added, not
   substituted for existing text, because the original table's numbers are
   accurate only under one comparator configuration and the original
   document did not say so.

No claim, caveat, number or argument already present in the internal
documents was altered, added to, or removed on its own terms — case 3 above
adds a signpost to evidence that exists elsewhere in this same repository
(H1 (REVISED), `figures/fig10_latency_precision_tradeoff.png`,
`data/sensitivity_comparator.csv`), it does not change or dispute the
table's own numbers.

This file was regenerated in full for the Phase 10/11 update: the previous
version's before/after list is superseded by the complete list below, since
the three documents were refreshed from Repo A in their entirety rather than
patched incrementally.

The internal repository is private and its simulation engine is not
published. See the "What is published here / what is not" section of
[README.md](../README.md) and [METHOD.md](METHOD.md) for what that boundary
covers.

## Every rewritten phrase

### `docs/RESEARCH_HYPOTHESES.md`

| Before | After |
|---|---|
| `` modelled explicitly in `monitoring/conventional.py`. `` | modelled explicitly in the conventional-monitoring baseline. |
| `` A one-factor-at-a-time sweep of `ConventionalConfig` moves the pooled median window `` | A one-factor-at-a-time sweep of the comparator's configuration moves the pooled median window |
| `` The comparator sweep (`experiments/sensitivity.py`, `results/sensitivity/sensitivity_comparator.csv`): `` | The comparator sweep (`data/sensitivity_comparator.csv`): |
| `` since `ConventionalConfig` has no effect on it `` | since the comparator's configuration has no effect on it |
| `` One `FeatureExtractor`, one `DecisionLayer`, one metric set, both domains. `` | A single shared feature extractor, a single shared decision layer and a single metric set are applied to both domains; only the physics models and the hypothesis catalogue differ. |
| `` This is implemented as `Observation.context_id` and was discovered by the simulation failing without it. `` | This is implemented by conditioning each element's statistical baseline on its serving satellite, and was discovered by the simulation failing without it. |
| `` Parametric model in `economics/model.py`, reported as ranges over the sensitivity bounds and over seeds. `` | Parametric economics model, reported as ranges over the sensitivity bounds and over seeds. |

### `docs/EXPERIMENT_MATRIX.md`

| Before | After |
|---|---|
| `` \| A — conventional \| `monitoring/conventional.py` \| ... `` | \| A — conventional \| conventional-monitoring baseline \| ... |
| `` \| B — decision layer \| `decision/` \| ... `` | \| B — decision layer \| decision layer \| ... |
| `` ### Microwave (`Domain.MICROWAVE`) `` | ### Microwave |
| `` ### LEO / NTN (`Domain.LEO_NTN`) `` | ### LEO / NTN |
| `` (`core/rng.py`), so changing the number of draws in one component does not perturb another. Runs are bit-reproducible; `tests/test_reproducibility.py` enforces it. `` | (named, seed-derived random streams), so changing the number of draws in one component does not perturb another. Runs are bit-reproducible; a dedicated reproducibility test enforces it. |
| `` **Reproduce:** `velorona-research sweep --seeds 30 --out results` `` | **Reproduce the figures from the published data:** `python replot.py` in this repository. Reproducing the underlying runs themselves requires the private simulation engine, which is not published here. |
| *(nothing — new text)* | A caveat paragraph before the reference-results table, and a fourth footnote, stating the table assumes the default comparator and pointing to H1 (REVISED) / `figures/fig10_latency_precision_tradeoff.png` / `data/sensitivity_comparator.csv`. |

### `docs/LIMITATIONS.md`

| Before | After |
|---|---|
| `` (`physics/itu_rain.py`) `` | (rain-attenuation model) |
| `` Phase 10 (`experiments/sensitivity.py`) sweeps severity ... (see `docs/RESEARCH_SIMULATION_V2_PLAN.md` and H1's Status in `docs/RESEARCH_HYPOTHESES.md`) `` | Phase 10 sweeps severity ... (see H1's Status in [RESEARCH_HYPOTHESES.md](RESEARCH_HYPOTHESES.md)) — the `RESEARCH_SIMULATION_V2_PLAN.md` cross-reference is dropped outright, not rewritten, since that document is not published here |
| `` Phase 10/11 sweep `smoothing_window`, persistence and `escalation_delay_min` one-factor-at-a-time `` | Phase 10/11 sweep the smoothing window, the persistence rule and the escalation delay one-factor-at-a-time |
| `` The window is meaningless without its paired error rates (`metrics/reporting.require_window_with_error_rates`, enforced in code) `` | The window is meaningless without its paired error rates (a rule enforced in the private engine's code) |
| `` See H1 (REVISED) in `docs/RESEARCH_HYPOTHESES.md` for the full finding `` | See H1 (REVISED) in [RESEARCH_HYPOTHESES.md](RESEARCH_HYPOTHESES.md) for the full finding |
| `` the seed with full feature and hypothesis capture (`experiments/sensitivity.py::diagnose_residual`): `` | the seed with full feature and hypothesis capture: |
| `` the 3.0 dB nominal directional-imbalance floor (`ASYMMETRY_FLOOR_DB`) for 5 consecutive samples `` | the 3.0 dB nominal directional-imbalance floor for 5 consecutive samples |

The `### Microwave (Domain.MICROWAVE)` / `### LEO / NTN (Domain.LEO_NTN)`
headings and the `**Reproduce:**` line (both in `EXPERIMENT_MATRIX.md`) were
found during the original sweep of that document, in addition to the items
identified beforehand; the same rule was applied to them — name the thing,
not the file, module, class or command that only exists in the private
repository. `ASYMMETRY_FLOOR_DB` (in `LIMITATIONS.md`) is a named constant
from the private decision-rule engine and was removed on the same basis.

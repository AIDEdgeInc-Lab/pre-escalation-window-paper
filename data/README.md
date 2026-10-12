# Data

**`data/*.csv` (this directory) = AS PUBLISHED, previous model version.** Produced with a rain-coefficient table equal to the
superseded ITU-R P.838-0/-1 values, and with the original definition of the pre-escalation window (layer clock starts at its first
WAIT, ESCALATE or ACT output). Kept unchanged so every number ever published remains reproducible and checkable. Do not cite
without the qualifications in [`../CORRECTIONS.md`](../CORRECTIONS.md).

**[`corrected/`](corrected/) = regenerated with the corrected simulation engine**, same seeds and scenarios:

| File | Notes |
|---|---|
| `corrected/runs.csv`, `corrected/summary.csv` | 330 runs; adds `t_decision_layer_escalation`, `escalation_window_min` (like-for-like window), and the VERIFY columns `first_action`, `verify_outcome_first`, `verified_first`, `verify_outcome_escalation`, `verified_escalation` |
| `corrected/coverage_comparison.csv` | microwave hop 16.21 km (was 18.32); adds two rows bracketing LEO capacity (uniform sharing vs beams steered at the region) |
| `corrected/sensitivity_*.csv` | comparator, severity and warm-up sweeps re-run |
| `corrected/PROVENANCE.json` | model versions, seeds, software versions, SHA-256 of every file. Decision-layer parameters are deliberately not included |

Differences between the two sets, run by run, are summarised in [`../CORRECTIONS.md`](../CORRECTIONS.md).

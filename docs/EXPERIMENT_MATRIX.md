# Experiment matrix

## Design

A **controlled comparative experiment**. One run = (domain, scenario, seed).
Within a run, the *same* telemetry stream is presented to two arms:

| Arm | Implementation | What it represents |
|---|---|---|
| A — conventional | conventional-monitoring baseline | vendor/NMS threshold monitoring: KPI smoothing, M-of-N persistence, escalation and ticket process delays, fixed thresholds against a nominal reference, no geometry model |
| B — decision layer | decision layer | read-only pre-escalation decision intelligence: per-element SPC control limits, peer-group correlation, evidence-based differential diagnosis, named gate checks |

Both arms see identical data. Differences are attributable to the arm, not to
the scenario.

## Scenarios

### Microwave

| Scenario | Ground-truth class | Self-clearing | Purpose |
|---|---|---|---|
| `mw_rain_cell` | RAIN_FADE | yes | Correct answer is WAIT. Measures unnecessary dispatch. |
| `mw_directional_hardware` | HARDWARE_DIRECTIONAL | no | Clean directional signature on a dry path. |
| `mw_hidden_in_storm` | HARDWARE_DIRECTIONAL | no | **Hard case.** Directional fault begins inside an active fade. |
| `mw_interference` | INTERFERENCE | no | Level healthy, C/(N+I) degraded. Recommend spectrum scan, not a truck. |
| `mw_config_change` | CONFIG_CHANGE | no | Symmetric step on a dry path with a change-log entry. |

### LEO / NTN

| Scenario | Ground-truth class | Self-clearing | Purpose |
|---|---|---|---|
| `leo_low_elevation` | LOW_ELEVATION_GEOMETRY | yes | **No fault injected.** Pure orbital geometry. Measures false-positive behaviour. |
| `leo_ground_rain` | PROPAGATION_FADE | yes | Local Ka-band fade at one terminal. |
| `leo_rf_subsystem` | RF_SUBSYSTEM | no | Spacecraft TX chain: directional, common to all terminals on that satellite. |
| `leo_pointing` | POINTING_ATTITUDE | no | Attitude drift, corroborated by housekeeping telemetry. |
| `leo_gateway_side` | GATEWAY_SIDE | no | Feeder/gateway impairment: follows the gateway across handovers. |
| `leo_hidden_in_rain` | RF_SUBSYSTEM | no | LEO analogue of the hidden-fault case. |

## Seeds

Default sweep: **30 seeds per (domain, scenario)** = 330 runs. Every stochastic
component draws from a *named* stream derived from the master seed
(named, seed-derived random streams), so changing the number of draws in one
component does not perturb another. Runs are bit-reproducible; a dedicated
reproducibility test enforces it.

## Metrics

### Timeline windows (minutes)
- `false_calm_window` = conventional escalation − first detectable
- `pre_escalation_window` = conventional escalation − decision-layer actionable
- `exposure_window` = service impact − first detectable
- `decision_margin` = service impact − decision-layer actionable
- `conventional_margin` = service impact − conventional escalation
- `time_to_correct_diagnosis` = first correct verdict − first detectable

### Detection and escalation quality
Per-sample confusion matrices with three separate ground truths:
1. `detect_*` — predicted = sustained control-limit breach; truth = any fault active
2. `layer_esc_*` — predicted = layer escalated; truth = a **persistent** fault active
3. `conv_esc_*` — predicted = conventional escalated; same truth

Ground truth (2) and (3) deliberately treat escalating on a self-clearing cause
as a **false positive**, because operationally it is one.

### Decision quality
- `n_ambiguous_decisions` — competing hypotheses at the same confidence tier
- `n_wait_decisions`
- `layer_unnecessary_dispatch` / `conv_unnecessary_dispatch`

### Economics (ILLUSTRATIVE)
- `exposure_conventional`, `exposure_decision_layer`, `exposure_delta`
- reported with the sensitivity bounds attached

## Figure mapping

| Figure | File | Feeds paper section |
|---|---|---|
| 1 | `fig01_pre_escalation_window.png` | Results — the window |
| 2 | `fig02_cross_domain.png` | Cross-domain comparison |
| 3 | `fig03_escalation_quality.png` | Results — escalation quality |
| 4 | `fig04_economic_exposure.png` | Economic impact (ILLUSTRATIVE) |
| 5 | `fig05_coverage_derivation.png` | Problem definition — infrastructure derivation |
| 6 | `fig06_timeline_*.png` | Introduction — "the outage began before the ticket" |

## Reference results (30 seeds, `duration=600 min`, DEFAULT comparator only)

**These window figures assume one particular comparator configuration (the
default). They are not the headline result of this study.** A comparator
sensitivity sweep (Phase 10/11) shows the window is not robust to how the
conventional arm is tuned — see H1 (REVISED) in
[RESEARCH_HYPOTHESES.md](RESEARCH_HYPOTHESES.md) and
`figures/fig10_latency_precision_tradeoff.png` for the trade-off this table
does not show. The durable results are H3 (escalation quality, unaffected by
comparator tuning) and H1 (REVISED) (the trade-off itself), not the raw
numbers below.

Median pre-escalation window, and escalation F1 for each arm, at the default
comparator:

| Domain | Scenario | Window (min) | Layer F1 | Conv F1 | Conv unnecessary dispatch |
|---|---|---|---|---|---|
| microwave | mw_rain_cell | 16 | n/a¹ | n/a¹ | **100%** |
| microwave | mw_directional_hardware | 13 | 0.92 | 0.90 | 0% |
| microwave | mw_hidden_in_storm | 13 | 0.95 | 0.98 | 0% |
| microwave | mw_interference | 20 | 0.99 | 0.97 | 0% |
| microwave | mw_config_change | 11 | 1.00 | 0.98 | 0% |
| leo_ntn | leo_low_elevation | — ² | n/a¹ | n/a¹ | 0% |
| leo_ntn | leo_ground_rain | 7 | n/a¹ | n/a¹ | **100%** |
| leo_ntn | leo_rf_subsystem | 189 | 0.94 | 0.34 | 0% |
| leo_ntn | leo_pointing | 250 ³ | 0.95 | 0.30 | 0% |
| leo_ntn | leo_gateway_side | 9 | 0.98 | 0.97 | 0% |
| leo_ntn | leo_hidden_in_rain | 7 | 0.89 | 0.39 | 0% |

¹ F1 is undefined when the ground truth contains no persistent fault — by
construction there is nothing to escalate about. The meaningful column for
those rows is the dispatch column.
² Neither arm escalated in any seed. Reported as a null result, not omitted.
³ Conventional escalated in only 6 of 30 seeds, so this window is conditioned
on a small subsample and **must be reported with n**, not as a headline number.
⁴ None of these window figures should be read without the comparator
sensitivity caveat above: under a more aggressive (but still plausible)
comparator, every one of these numbers moves, and under a degenerate one the
pooled median window inverts to -146 min. See `data/sensitivity_comparator.csv`.

**Reproduce the figures from the published data:** `python replot.py` in this
repository. Reproducing the underlying runs themselves requires the private
simulation engine, which is not published here.

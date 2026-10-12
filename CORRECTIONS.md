# Corrections and evidence levels

*Updated 2026-10-12. This file records problems found in the published study after
release. **The files in `data/` and `figures/` are kept exactly as published** (previous model
version) and are labelled as such; the corrected-engine results are in `data/corrected/`,
`figures/corrected/` and the first two sections of the README. The paper's figures
(`article/figures/`) and the interactive demo are produced by tooling that is not in this
repository and still show the previous model version (they carry a notice).*

## Where to find what

| Artefact | Model version | Status |
|---|---|---|
| `data/*.csv`, `figures/*.png`, README "as published" sections | previous | unchanged, labelled "previous model version" |
| `data/corrected/`, `figures/corrected/`, README "corrected engine" sections | corrected | new; regenerated from the same seeds and scenarios, with `PROVENANCE.json` |
| `article/`, `method/`, `summary/`, `index.html`, `demo/` | previous numbers | corrections notice at the top; text claims amended |

## 1. The rain model did not use ITU-R P.838-3 coefficients

The paper states that rain attenuation follows ITU-R P.838-3 and that the coefficients
were "transcribed, not verified". Comparison with the `itur` package's implementation of each
revision of P.838 shows what the transcribed table actually was:

- for 12–100 GHz it equals the **superseded P.838-0/-1** values (within ~2% of
  P.838-2, and 17–22% below P.838-3 in k);
- for 6–10 GHz it additionally had **decimal-place errors** (values ~10x too small
  even for those older revisions). No scenario in this study operates at 6–10 GHz.

The simulation engine now implements the P.838-3 analytic fit. Its constants come from the `itur` package, so that package is not an independent check of them; seven rows of ITU Table 5 (6, 8, 12, 15, 20, 30 and 40 GHz, all four columns) and kH at 10 GHz were compared with excerpts of the ITU document and agree to within 1.05×10⁻⁴ relative (rounding of the 4-figure table). Other frequencies, and everything above 40 GHz, were not checked; this study uses 18, 20 and 30 GHz. At the study's
frequencies (R = 42 mm/h, horizontal polarisation) specific attenuation changes by
−6.2% (18 GHz), −4.0% (20 GHz) and +2.1% (30 GHz).

**Effect, re-running all 330 runs (30 seeds × 11 scenarios) with the corrected rain
model and with a second correction described in §6:**

| Quantity | Published | Corrected engine |
|---|---|---|
| Rain-limited / engineered microwave hop length (18 GHz, 35 dB margin, R₀.₀₁ = 42 mm/h) | 18.32 km | **16.21 km (−11.5%)** |
| Hops / relay sites / radios for the 12-site region | 22 / 11 / 56 | unchanged |
| Median pre-escalation window per scenario | see Results table | changes by **at most 1 minute** in every scenario (140 of 330 individual runs differ) |
| Median escalation F1, both arms | see Results table | unchanged at two decimals in every scenario |
| Conventional-arm unnecessary dispatch on self-clearing runs | 60 / 90 | 60 / 90 |
| Decision-layer unnecessary dispatch on self-clearing runs | 3 / 90 | 2 / 90 — **different runs** (`mw_rain_cell` seeds 12, 21 → seed 10; `leo_low_elevation` seed 1 unchanged) |

No other row of `data/coverage_comparison.csv` changes. The code state that produced
the published `data/runs.csv` was re-run and reproduces all 330 rows and all 63 result
columns exactly, so the published numbers are reproducible; they are just based on the
older coefficient table.

**Sensitivity sweeps, re-run with the corrected engine** (`data/sensitivity_*.csv` regenerated internally, not
replaced here): pooled median window 13 min at the default comparator and −146 min at the degenerate comparator,
warm-up variants −146 / −34 / −154 min, conventional unnecessary dispatch 66.7% / 100%, decision layer 4.4% —
all identical to the published values, so the H1 (REVISED) conclusion is reproduced. In the severity sweep, the 55 of
60 (scenario × severity) cells in which the conventional arm escalated in at least 10 of 15 seeds in both runs
shift by at most 5 minutes; in the remaining low-severity cells the window rests on 3–9 seeds and moves by up to
152 minutes, so those cells should not be quoted.

## 2. The "pre-escalation window" compares different events

The window is `conventional escalation − t_decision_layer_actionable`, and
`t_decision_layer_actionable` is the layer's **first WAIT, ESCALATE or ACT output**. A WAIT
(for example on rain, or a low-confidence WAIT) therefore counts as a lead over the conventional
arm's *escalation*. A like-for-like window compares the layer's first ESCALATE/ACT with the
conventional escalation. Both, re-run with the corrected engine (30 seeds, medians):

| Scenario | Published (as stated) | Corrected engine, same definition | Corrected engine, like-for-like |
|---|---|---|---|
| leo_gateway_side | 9 | 8 | 8 |
| leo_pointing | 250 (n=6/30) | 250 (n=6/30) | 250 (n=6/30) |
| leo_rf_subsystem | 189 (n=28/30) | 189 (n=28/30) | 189 (n=28/30) |
| mw_config_change | 11 | 11 | 11 |
| mw_directional_hardware | 13 | 12 | 12 |
| mw_interference | 20 | 21 | 21 |
| **mw_hidden_in_storm** | 13 | 14 | **−1** (IQR −3 to 2.8) |
| **leo_hidden_in_rain** | 7 | 6 | **−109** (IQR −112 to −108) |
| mw_rain_cell | 16 | 16 | n/a — layer correctly did not escalate (1 false escalation in 30) |
| leo_ground_rain | 7 | 6 | n/a — layer correctly did not escalate |
| leo_low_elevation | — | — | — |

In the two hidden-fault scenarios the layer WAITs on the rain and escalates on the hidden fault
a median of 15 minutes (microwave) and 115 minutes (LEO) later; the conventional arm escalates on
the rain itself, i.e. for a reason that happens to coincide with a later persistent fault. The
sentence "a positive window is observed in 10 of 11 scenarios" therefore becomes: positive in 6 of 11,
about zero in one, negative in one, and not applicable in three. The H1 (REVISED) argument (the window
trades against false-alarm rate) does not depend on this, but the pooled window values quoted for it
(13 min, −146 min) were computed with the first definition. Like-for-like, the pooled medians are 11 min at the
default comparator and −96 min at the degenerate one: the same conclusion (a perfect, instantaneous comparator
"leads" only by escalating on everything).

## 3. The "diagnosed" false-positive residual is not tied to its seeds

`docs/LIMITATIONS.md` item 17 explains the residual in `mw_rain_cell` seeds 12 and 21 as
chance crossings that barely clear the 3 dB asymmetry floor. After correction (§1) those
seeds no longer fire and seed 10 does, with a ~5 dB asymmetry. Tracing it shows
**differential ATPC saturation**: when the rain fade passes the ATPC range, one
direction's loop saturates first, both end up pinned at their limit, and the
received-level difference between directions is read as a hardware fault. The earlier
explanation described two seeds, not the mechanism. The residual rate itself did not
change materially (3/90 → 2/90).

## 4. Other items

- **ITU-R P.530.** The model uses the P.530-18 distance factor. P.530-19 (approved
  2025-09) supersedes it; whether it changes that factor has **not** been checked.
- **LEO capacity.** "43.3 Mbps attributable to the region" and "capacity/demand 0.012"
  assume the satellite's capacity is spread uniformly over its 2.77 M km² footprint.
  The same model covers the region with 2 of the satellite's 8 beams; if they were
  steered at the region the attributable capacity would be up to 3,000 Mbps (ratio
  0.83). Both are bounds from parameters, not measurements; the published single
  figure is the lower bound.
- **Decision-layer geometry.** In the published LEO runs the layer's geometry correction
  is the simulator's own clear-sky model, so it has zero model error by construction.
  Sensitivity to a wrong model has since been measured in simulation (not published
  here); the published LEO results should be read as "with a perfect geometry model".
- **VERIFY.** In the published version the VERIFY stage did not reliably resolve: the recorded flag was set from the recommendation's own prediction on the first undetected sample after a deadline that moved with every new recommendation, and a persisting finding was never judged. The corrected engine judges a prediction on evidence after its deadline (confirmed, refuted, or unresolved when there is no valid evidence). `verified` means "the layer's prediction matched later telemetry", not field ground truth.
- **Missing or stale data.** The version that produced the published results had no
  handling for missing, stale or invalid telemetry: a feed that went silent was
  reported as "no deviation". A data-quality gate now exists in the engine; the
  published results predate it.
- **Polarisation.** All rain attenuation uses horizontal polarisation at zero path
  elevation, including LEO. With circular polarisation at 40° elevation the specific
  attenuation is 5–11% lower at 18–30 GHz.

## 5. Levels of evidence

These are different things and this study stands at the first two only:

| Level | What it establishes | Status |
|---|---|---|
| 1. Software tests | the code does what it was written to do | yes (engine, not published) |
| 2. Numerical verification against reference implementations | the arithmetic matches an independent source | partial: P.838 against independent implementations (see §1 for what is and is not independent); orbit geometry against exact spherical trigonometry; ACM ladder against the Shannon limit |
| 3. Validation against independent simulation or reference data | the model resembles something it was not built from | no |
| 4. Evaluation against labelled real telemetry | the detector works on real, imperfect data | no. A candidate public dataset exists but its licence is unclear; not used |
| 5. Validation in live operator networks | operational value | no |

## 6. Handling of baselines for newly seen satellites

While adding the data-quality gate it turned out that a serving satellite first seen after
the 120-minute warm-up was given an *empty* baseline (median 0, sigma 0). New serving
contexts now learn a baseline from their own first 20 valid samples. This only affects
LEO runs (it changes the layer's F1 in 25 of the 330 runs and its first-actionable time in
16; the conventional arm is untouched) and is included in the "corrected engine" column above.

## Per-scenario windows, corrected engine (30 seeds each; `data/corrected/runs.csv`)

Median in minutes over runs with a resolved window; "n/a" = no run resolved. Original = clock starts at the layer's first WAIT/ESCALATE/ACT; like-for-like = layer's first ESCALATE/ACT.

| Domain | Scenario | Original | Like-for-like | Like-for-like: positive / negative / unresolved runs |
|---|---|---|---|---|
| LEO/NTN | leo_gateway_side | 8 | 8 | 30 / 0 / 0 |
| LEO/NTN | leo_ground_rain | 6 | n/a | 0 / 0 / 30 |
| LEO/NTN | leo_hidden_in_rain | 6 | -109 | 0 / 30 / 0 |
| LEO/NTN | leo_low_elevation | n/a | n/a | 0 / 0 / 30 |
| LEO/NTN | leo_pointing | 250 | 250 | 6 / 0 / 24 |
| LEO/NTN | leo_rf_subsystem | 189 | 189 | 28 / 0 / 2 |
| Microwave | mw_config_change | 11 | 11 | 30 / 0 / 0 |
| Microwave | mw_directional_hardware | 12 | 12 | 30 / 0 / 0 |
| Microwave | mw_hidden_in_storm | 14 | -1 | 12 / 15 / 0 (3 runs equal 0) |
| Microwave | mw_interference | 21 | 21 | 30 / 0 / 0 |
| Microwave | mw_rain_cell | 16 | 11 (one run; a false escalation on a self-clearing event) | 1 / 0 / 29 (self-clearing: not applicable) |

Scenario medians are positive in 10 of 11 under the original definition and in 6 of 11 like-for-like. The three self-clearing scenarios (`leo_ground_rain`, `leo_low_elevation`, `mw_rain_cell`) have no like-for-like window because the layer did not escalate in most runs; the one resolved `mw_rain_cell` value is a false escalation, not a lead, and is not counted as positive. (An earlier version of this table, PR #5, counted it as a seventh positive scenario; that was incorrect and is corrected here.) Pooled like-for-like median: 11 min over 215 of 330 runs. Pooling across scenarios is descriptive only, not a performance claim. Simulation only; no field validation.

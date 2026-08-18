# Research hypotheses

Each hypothesis states the measurement, the prediction, and **the observation
that would falsify it**. A hypothesis with no falsification condition is a
marketing claim.

---

## H1 (ORIGINAL — NOT SUPPORTED) — A pre-escalation window exists and is measurable

**Claim.** For degradation with a finite ramp, there is a non-zero interval
between the first sample that leaves the element's own statistical control
limits and the moment conventional threshold monitoring escalates.

**Measurement.** `pre_escalation_window_min = t_conventional_escalation −
t_decision_layer_actionable`, per run, reported as median and IQR over seeds.

**Mechanism (not assumed — arithmetic).** A rolling mean of window *W* lags a
linear ramp by ≈ *W*/2 samples. An M-of-N persistence rule adds ≈ *M* more.
A process delay adds its own. These are properties of the comparator, modelled
explicitly in the conventional-monitoring baseline.

**Falsified if.** The median window is ≤ 0, or its IQR straddles 0, for the
majority of scenarios.

**Status (30 seeds, default comparator).** Not falsified in isolation: median
7–20 min for scenarios where both arms escalate; 189–250 min for LEO
space-segment faults, where the conventional arm frequently never escalates
at all. **But this falsification condition never anticipated being tested
against a comparator range, only against one chosen comparator — and against
that range, it fails.**

**Status, tested against the comparator range (Phase 10/11, 15 seeds per
config).** NOT SUPPORTED AS STATED. A one-factor-at-a-time sweep of the
comparator's configuration moves the pooled median window only modestly on its own
(smoothing_window 1→10: 10→15 min; escalation_delay_min 0→15: 3→18 min;
persistence 1/1→4/5: 11→12 min) — but the DEGENERATE configuration
(smoothing_window=1, persistence 1-of-1, escalation_delay_min=0
simultaneously: a perfect, instantaneous, unsmoothed threshold monitor,
better than any real NMS) collapses the pooled median window from **13 min
to -146 min** (window paired with its error rates, as this study now
requires everywhere: conventional escalation FPR rises 0.00→1.00 median
[0.22→0.61 mean], conventional unnecessary-dispatch rises 67%→100%; the
decision layer's own numbers do not move at all — FPR ~0.00→~0.00,
unnecessary dispatch 4.4%→4.4%, F1 0.953→0.953). Per domain the degenerate
window is near zero for microwave (-2 to +8 min across all five scenarios)
and inverted for every LEO scenario (-155 to -225 min).

Part of that LEO deficit is a cold-start artefact, not measured, so this is
stated with the number attached rather than assumed away (P11.3, three ways
to report the same degenerate-comparator window, pooled median): with the
120-minute feature warm-up included as run, **W_a = -146 min**; with the
comparison clock started at t=warmup_min for both arms (warm-up excluded),
**W_b = -34 min**; over a 4x longer, 2400-minute run (warm-up 5% of the run
instead of 20%), **W_c = -154 min**. W_b differs from W_a by 77%, far outside
the 25% band fixed in advance for calling this a material term; W_c stays
within 5%. So: **cold-start bias is a material term, and it does not
reverse the finding.** By domain, the entire effect is in LEO (pooled window
-191 min as-run vs. -71 min with warm-up excluded — still deeply negative)
and none of it is in microwave (+2 min in all three variants, unaffected by
warm-up). Even crediting the layer with the full 120 minutes it could not
possibly have acted in, LEO's window under a perfect comparator remains
substantially negative.

The original H1 does not survive its own sensitivity analysis: its
falsification condition ("median window ≤ 0 for the majority of scenarios")
is met once tested against a comparator aggressive enough to be worth
publishing against, and even after removing the warm-up period's
contribution, the LEO domain's window under an idealised monitor stays
negative. The raw lead-time claim, as originally stated, is not supported.
See H1 (REVISED) below for the claim the evidence does support, and H3 for
the result that survives untouched. See `docs/LIMITATIONS.md` for the
comparator-sensitivity and cold-start items.

---

## H1 (REVISED) — Detection latency and diagnostic precision trade off against each other for threshold monitoring, and the decision layer is not on that trade-off curve

**Claim.** A conventional threshold monitor's escalation latency can be
reduced arbitrarily by reducing smoothing, persistence and process delay, but
its false-positive rate and unnecessary-dispatch rate rise as it does. The
decision layer's error rates are invariant to that tuning.

**Measurement.** The comparator sweep (`data/sensitivity_comparator.csv`):
pre-escalation window, escalation FPR, escalation F1 and unnecessary-dispatch
rate for both arms across the comparator grid
(`figures/fig10_latency_precision_tradeoff.png`).

**Falsified if.** A comparator configuration exists that matches the
decision layer's false-positive and unnecessary-dispatch rates while
escalating at least as early — i.e. a point on the conventional curve at or
below the layer's escalation FPR and at or above the layer's window.

**Status.** Not falsified. Across all 11 swept comparator configurations,
the conventional arm's escalation FPR ranges from 0.00 (default-like,
low-aggressiveness configurations) up to 1.00 (degenerate), and its window
moves accordingly, from modest positive values down to -146 min pooled. The
decision layer's escalation FPR does not move (~0.00 across every
configuration, since the comparator's configuration has no effect on it), and neither
does its unnecessary-dispatch rate (4.4%) or its escalation F1 (0.953). No
configuration on the conventional curve reaches the layer's combination of
near-zero FPR and a non-negative window simultaneously: the only
configurations with FPR near 0.00 are the least aggressive ones, which have
smaller (but still positive, for microwave and most scenarios) windows than
the layer offers under the default comparator, and the only configuration
with a window competitive with or exceeding the layer's absolute detection
speed (the degenerate case) buys it with FPR 1.00 and 100% unnecessary
dispatch. The trade-off is real and the layer sits off it, not on it.

This is the durable finding from Phase 10/11, alongside H3. It is a stronger
and more defensible claim than the original H1: it does not depend on which
comparator you assume, only on the shape of conventional monitoring's own
trade-off curve and on the layer not being subject to it.

---

## H2 — Environmental and persistent causes are separable *before* the event ends

**Claim.** A propagation impairment is symmetric across both directions and
correlates with an independent environmental feed; a chain fault is directional
and does not. The two are separable while both are present.

**Measurement.** Verdict correctness against ground truth on the
`*_hidden_in_*` scenarios, in which a directional fault begins *inside* an
active fade.

**Falsified if.** The layer cannot distinguish the composite case above chance,
or only distinguishes it after the environmental event has cleared (which would
make it a trivial "wait and see" rule, not a diagnostic one).

**Status.** Not falsified for microwave (`mw_hidden_in_storm`, layer escalation
F1 median 0.95). LEO composite case `leo_hidden_in_rain` reaches F1 0.89
against a conventional 0.39.

---

## H3 — The correct decision is sometimes to do nothing, and that is measurable

**Claim.** For self-clearing causes, escalation is a *false positive* with a
real cost. An early-warning layer that cannot say WAIT is not an improvement.

**Measurement.** `unnecessary_dispatch` — did the arm escalate on a scenario
whose ground-truth fault class is self-clearing?

**Falsified if.** The decision layer escalates on `mw_rain_cell`,
`leo_ground_rain` or `leo_low_elevation` at a rate comparable to the
conventional arm.

**Status.** Not falsified, with a measured residual. Across the 90
self-clearing runs (three scenarios x 30 seeds) the conventional arm
escalated unnecessarily in 60 (67%) — 30/30 on both rain scenarios — and the
decision layer in 3 (3%): two seeds of the microwave rain scenario and one
seed of the LEO low-elevation scenario. The residual is real and is reported
rather than suppressed; the layer is not claimed to be perfect on this
failure mode, only roughly an order of magnitude better than the comparator.
This remains the single most operationally relevant result in the study, and
it is not a lead-time result.

---

## H4 — The decision problem generalises across domains; the physics does not

**Claim.** The same pipeline, the same feature vocabulary and the same
confidence scheme apply to microwave and LEO/NTN. Only the hypothesis cards and
the physics differ.

**Measurement.** A single shared feature extractor, a single shared decision
layer and a single metric set are applied to both domains; only the physics
models and the hypothesis catalogue differ. Cross-domain distribution
comparison of window, time-to-diagnosis and ambiguity count.

**Falsified if.** Either domain requires a bespoke decision pipeline, or the
shared abstraction has to be broken to make one domain work.

**Status.** Not falsified — but see the important caveat in H5.

---

## H5 — LEO adds discriminators that microwave does not have, and constraints it does not have

**Claim.** LEO is *not* microwave with a longer path.

1. **Geometry is a legitimate cause of degradation.** Elevation changes
   continuously; a fixed threshold alarms on healthy physics. Conventional
   monitoring generates false escalations every pass. The decision layer
   removes the geometry-predicted component before calling anything anomalous.
2. **Two independent correlation groups** (serving satellite, serving gateway)
   versus microwave's one (adjacent links). This is a strictly richer
   space-versus-ground discriminator.
3. **A hard time constraint.** "Can this wait for the next pass?" is a
   first-class question with no microwave equivalent, surfaced as a named gate
   check on remaining pass time.
4. **Statistics must be conditioned on the serving satellite.** Without it, a
   spacecraft fault is smeared across the pass schedule and becomes
   statistically invisible. This is implemented by conditioning each
   element's statistical baseline on its serving satellite, and was
   discovered by the simulation failing without it.

**Falsified if.** Removing geometry correction, context conditioning or the
second correlation group does not degrade LEO diagnostic performance.

**Status.** Points 1, 2 and 4 are supported: removing context conditioning
drops `leo_rf_subsystem` escalation F1 from 0.94 to ≈0.05.

---

## H6 — Earlier knowledge has economic value, but not unboundedly, and sometimes negative value

**Claim.** Lead time converts to avoided exposure only through an *actionable
fraction* and an *avoidance probability*, both < 1, and it saturates. Acting on
a self-clearing cause has strictly negative value.

**Measurement.** Parametric economics model, reported as ranges over the
sensitivity bounds and over seeds.

**Falsified if.** No plausible assumption set yields a positive delta, or the
delta is insensitive to the assumptions (which would mean the model is not
actually parametric).

**Status.** Deliberately UNRESOLVED. The current figures are labelled
ILLUSTRATIVE and must not be published as a value claim until at least one
operator supplies real cost inputs. This is the largest open gap in the study.

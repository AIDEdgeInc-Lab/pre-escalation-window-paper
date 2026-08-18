# Method

This describes what the decision layer does, at the level needed to interpret
the results, without publishing how it does it. The simulation engine and the
decision layer's implementation are not published — see
[README.md](../README.md#what-is-published-here--what-is-not).

## The seven-stage pipeline

Every recommendation the decision layer produces passes through the same
seven named stages:

```
OBSERVE -> DETECT -> CORRELATE -> DIAGNOSE -> ESTIMATE DECISION RISK
        -> WAIT / ESCALATE / RECOMMEND ACTION -> VERIFY
```

- **OBSERVE** — feature extraction from telemetry and peer-group context.
- **DETECT** — is the element outside its own statistical control limits,
  sustained (not a single noisy sample)?
- **CORRELATE** — does the anomaly co-occur with peer elements in the same
  correlation group, or is it isolated to one element?
- **DIAGNOSE** — evidence-based differential diagnosis across candidate
  fault classes (see "Hypothesis cards" below).
- **ESTIMATE DECISION RISK** — what does acting cost if the diagnosis is
  wrong, given the blast radius of the affected element?
- **WAIT / ESCALATE / RECOMMEND ACTION** — the decision gate: a list of
  *named* checks, each with a pass/fail and a human-readable reason.
- **VERIFY** — did the recommendation hold up against what actually
  happened?

The decision layer is read-only by construction: `RECOMMEND_ACTION` is a
recommendation carried to a human with its own audit trail, never an
actuation. There is no code path that writes to a network.

## Control limits

Per-element control limits are Shewhart 3-sigma limits computed from a
**robust baseline**: the median and the median absolute deviation (MAD) of
the element's own history over a warm-up window, which is then frozen —
not a rolling window recomputed as new samples arrive — rather than a fixed
vendor threshold or a population mean. Median/MAD is used specifically
because it is not distorted by the fault itself once a fault is already in
progress, which a mean-based baseline is; freezing the baseline after
warm-up is what makes that property hold for the whole run, not just for
the first sample of a fault.

## Two LEO-specific method choices

Two aspects of the method differ between domains and are worth stating
explicitly, since they are the reason LEO/NTN is not simply "microwave with
a longer path" (see `H5` in
[RESEARCH_HYPOTHESES.md](RESEARCH_HYPOTHESES.md)):

- **Geometry correction.** For LEO, the geometry-predicted component of
  received level — the part explained by elevation angle changing
  continuously over a pass — is removed before anything is treated as
  anomalous. A fixed threshold, or a control limit computed without this
  correction, alarms on healthy orbital geometry; this is what lets the
  layer avoid escalating on every pass the way a naive comparator does.
- **Context-conditioned baselines.** Statistical baselines are conditioned
  on the serving context — for LEO, the serving satellite — because a
  terminal's link statistics are only comparable against observations taken
  under the same spacecraft. Without this, a spacecraft-side fault is
  smeared across the pass schedule and becomes statistically invisible.

## Confidence is ordinal, not probabilistic

The decision layer reports confidence as one of a small number of ordered
tiers (e.g. LOW / MEDIUM / HIGH). This is deliberate: the evidence a
telemetry stream can supply supports an ordering of certainty, not a
calibrated probability. A confidence tier must never be read or reported as
a probability of correctness.

## Hypothesis cards

Each candidate fault class is represented as a **condition card** with three
kinds of condition evaluated against the extracted features:

- **required** conditions — must all hold for the hypothesis to be
  considered at all; together they define the fault's physical signature.
- **supporting** conditions — corroborate the hypothesis and raise
  confidence, but never create a verdict by themselves.
- **refuting** conditions — take the hypothesis off the table entirely.

When two hypotheses reach the same top confidence tier, the result is
reported as `AMBIGUOUS` rather than resolved by an arbitrary tie-break.
Ambiguity is treated as a measured outcome, not a failure mode — the count of
ambiguous decisions (`n_ambiguous_decisions`) is one of the reported metrics.

The specific conditions, their predicates and their thresholds are part of
the unpublished simulation engine.

## Both arms see identical telemetry

Every run presents the *same* synthetic telemetry stream to two independent
arms — a modelled conventional vendor/NMS monitor and the Velorona decision
layer — so that any difference in outcome is attributable to the arm, not to
a difference in what each arm was shown. See
[EXPERIMENT_MATRIX.md](EXPERIMENT_MATRIX.md) for the full experiment design.

## Metrics

Metric definitions (timeline windows, detection/escalation confusion-matrix
metrics, decision-quality counts, and the illustrative economics model) are
defined in [EXPERIMENT_MATRIX.md](EXPERIMENT_MATRIX.md), which is adapted
from the internal research documentation (see
[PROVENANCE.md](PROVENANCE.md)). Every value referenced there is computed
from the run; none is hard-coded.

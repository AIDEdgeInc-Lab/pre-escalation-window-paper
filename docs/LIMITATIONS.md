# Limitations

Stated first, not buried. Every item here is a question a reviewer or a VP of
network operations will ask.

## Fundamental

1. **The networks are simulated.** No result here is evidence about a real
   operator's network. The study establishes that a decision architecture is
   *coherent and testable*, not that it works in production. Only an operator
   pilot on real telemetry can do that.
2. **Ground truth is known by construction.** Real degradation has no label.
   Every reported precision/recall figure is an upper bound on what is
   achievable with real, ambiguous, partially-labelled operational data.
3. **Single-fault scenarios.** Except for the two `hidden_in_*` composites,
   each run contains one fault. Real incidents overlap far more.

## Physics

4. **The published results did not use ITU-R P.838-3 coefficients.** They used a table equal to the
   superseded P.838-0/-1 values for f ≥ 12 GHz and with 10× decimal errors at 6–10 GHz (no scenario in this
   study operates there). The engine now implements the P.838-3 analytic fit. Specific attenuation at the
   study's frequencies changes by −6.2% / −4.0% / +2.1% (18 / 20 / 30 GHz), per-scenario median windows by at
   most 1 minute, and the derived microwave hop length from 18.32 km to 16.21 km; headline results are
   otherwise unchanged. The files in `data/` correspond to the old table. The new coefficients' constants
   come from the `itur` package; seven rows of the official Table 5 (6, 8, 12, 15, 20, 30, 40 GHz) agree with them to 1e-4, other
   frequencies and everything above 40 GHz are unchecked. See [CORRECTIONS.md](../CORRECTIONS.md).
5. **Design-rule vs instantaneous attenuation are different quantities.** The
   P.530-18 effective path length is a long-term statistical design rule. Using
   the same reduction on an instantaneous wet path is a modelling
   simplification, labelled in the source. The model uses the P.530-18 form; P.530-19 (2025-09) supersedes it and has not been checked.
6. **LEO slant-path rain omits ITU-R P.618 reduction factors** and therefore
   over-estimates fade at low elevation.
7. **Orbits are circular, Earth is spherical, no J2, no Earth rotation** in
   pass timing. Adequate for elevation-driven link behaviour over one pass;
   inadequate for any availability claim.
8. **The ACM ladder is representative, not from a vendor datasheet.** Absolute
   capacity figures must be re-derived from a cited profile table.
9. **Satellite EIRP, G/T, beam count and beam footprint are parameters, not
   measurements.** Any published number must state them.
10. **Constellation size is a geometric lower bound** using a street-of-coverage
    packing efficiency. It is not a constellation design.

## Method

11. **Scenario onset times are chosen, not sampled; severity is now swept, not
    chosen.** Phase 10 sweeps severity across a multiplier grid per scenario
    (see H1's Status in [RESEARCH_HYPOTHESES.md](RESEARCH_HYPOTHESES.md)), so
    the pre-escalation window is now reported as a curve, not a single chosen
    point. Onset time, ramp duration and hold duration are still fixed per
    scenario, not sampled; that remains open.
12. **The conventional baseline is a *model* of vendor monitoring, and its
    sensitivity is now measured, not assumed — and the headline window does
    NOT survive it.** It is parameterised to be fair (real smoothing windows,
    real M-of-N rules, real process delays) but it is not any specific
    vendor's product. Phase 10/11 sweep the smoothing window, the persistence
    rule and the escalation delay one-factor-at-a-time, plus a degenerate
    case (a perfect, instantaneous, unsmoothed threshold monitor). The window
    is meaningless without its paired error rates (a rule enforced in the
    private engine's code): under the degenerate comparator the pooled
    median window falls from 13 to -146 min while conventional's escalation
    FPR rises from 0.00 to 1.00 (median) and its unnecessary-dispatch rate
    from 67% to 100% — it buys the apparent lead with false alarms, not
    earlier detection. The decision layer's own error rates do not move. See
    H1 (REVISED) in [RESEARCH_HYPOTHESES.md](RESEARCH_HYPOTHESES.md) for the
    full finding and H1 (ORIGINAL) for why the raw lead-time claim is not
    supported as originally stated.
13. **Part of the degenerate-comparator deficit is a cold-start artefact, not
    all of it.** The decision layer needs a 120-minute warm-up to learn a
    per-element statistical baseline; a fixed threshold does not, so a
    600-minute run with warm-up included in the comparison is biased against
    the layer. Measured, not assumed (P11.3): the degenerate-comparator
    pooled median window is -146 min as run (warm-up included), -34 min with
    the comparison clock started at t=warm-up for both arms, and -154 min
    over a 4x longer (2400-minute) run. Excluding warm-up moves the number by
    77%, over the 25% threshold fixed in advance for calling this material —
    so cold-start bias IS a material term. By domain it is entirely a LEO
    effect (pooled window -191 min as-run vs. -71 min warm-up-excluded) and
    absent from microwave (+2 min in all three variants). Even crediting the
    layer with the full warm-up period, LEO's window under the degenerate
    comparator remains substantially negative: cold start explains part of
    the deficit, not all of it.
14. **`leo_pointing` conventional escalation occurred in only 6/30 seeds.** Its
    window statistic is conditioned on a small subsample and must always be
    reported with n.
15. **No learned model is included.** The study deliberately establishes the
    interpretable baseline first. Any future learned component must be compared
    against this baseline, not against nothing.
16. **Confidence is ordinal, not calibrated.** LOW/MEDIUM/HIGH is honest about
    what the evidence supports. It is not a probability and must not be
    reported as one.
17. **The decision layer has a small, diagnosed false-positive residual.**
    Across the 90 self-clearing runs (three scenarios x 30 seeds), the layer
    escalated unnecessarily in 3 (3%), versus 60 (67%) for the conventional
    arm — not zero (see H3's Status). All three are diagnosed by re-running
    the seed with full feature and hypothesis capture:
    - `mw_rain_cell` seeds 12 and 21 fired the HARDWARE_DIRECTIONAL
      hypothesis: per-direction asymmetry (3.72 dB and 3.75 dB respectively)
      crossed both the element's own control limit and the 3.0 dB nominal
      directional-imbalance floor for 5 consecutive
      samples, during an active, symmetric rain event. ATPC's independent
      per-direction compensation noise occasionally produces a directional
      signature by chance; the asymmetry barely clears the floor in both
      cases (0.7-0.75 dB above it).
    - `leo_low_elevation` seed 1 fired the GATEWAY_SIDE hypothesis at HIGH
      confidence: co-located terminals sharing a gateway happened to
      co-degrade from orbital geometry alone (all terminals on a gateway see
      similar elevation over a pass), which the gateway-correlation
      condition cannot distinguish from a real feeder-side fault without an
      independent gateway-health signal.

    The residual was diagnosed, not tuned away: tuning against three known
    seeds is exactly the overfitting this rewrite exists to avoid.

## Economics

18. **Every currency figure is ILLUSTRATIVE.** The model is parametric and its
    provenance string is carried into the results file. Until an operator
    supplies real cost inputs, no monetary claim may be published. This is the
    single largest gap in the study.
19. **Actionable-fraction and avoidance-probability are assumptions**, bounded
    but not measured.

## Scope

20. **No multipath/ducting**, no wet-radome effect, no inter-satellite links,
    no beam-shape roll-off, no traffic-dependent congestion in the LEO domain.
21. **Blast radius is element-local.** The microwave model computes downstream
    isolation; the LEO model does not model beam-sharing contention.
22. **The decision layer's LEO geometry model has zero error by construction.** In the published runs the layer is given the
    simulator's own clear-sky model. Published LEO results are "with a perfect geometry model"; sensitivity to a wrong model
    has been measured in simulation but not published here, and no real terminal's model error has been measured.
23. **The published version had no handling for missing, stale or invalid telemetry.** A feed that went silent was reported
    as "no deviation", and a satellite first seen after warm-up was given an empty baseline. A data-quality gate now exists in the
    engine; the published results predate it.
24. **LEO capacity attributable to the region is a bound, not a measurement.** 43.3 Mbps (ratio 0.012) assumes uniform sharing
    over the footprint; steering the 2 beams the model says are needed at the region gives up to 3,000 Mbps (ratio 0.83).
25. **Rain attenuation uses horizontal polarisation at zero path elevation everywhere, including LEO.** Circular polarisation at
    40° elevation is 5–11% lower at 18–30 GHz.
26. **Levels of evidence.** Software tests, numerical verification against reference implementations, validation against
    independent data, evaluation on labelled real telemetry and validation in live networks are different things; this study
    reaches the first two only (partially). See [CORRECTIONS.md](../CORRECTIONS.md).
27. **VERIFY did not reliably resolve in the published version.** The recorded flag came from the recommendation's own prediction, not from later evidence. The corrected engine judges a prediction on evidence after its deadline, in the finding's own serving context; `verified` means "the layer's prediction matched later telemetry", not field ground truth. See [CORRECTIONS.md](../CORRECTIONS.md).

"""Standalone figure regeneration for the Pre-Escalation Window dataset.

Reads data/runs.csv and data/coverage_comparison.csv and regenerates every
figure in figures/. Does not import the private simulation package -- it
consumes only the published CSVs, exactly as an external reviewer would.
Depends on numpy, pandas and matplotlib only.

Usage:
    python replot.py [--out figures] [--data data]
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import List, Optional

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

PALETTE = {
    "conventional": "#8A8F98",
    "decision": "#4A3DA0",
    "accent": "#2E8FBB",
    "warn": "#C7873F",
    "bad": "#B2453D",
    "grid": "#DDE1E7",
    # Two values that used to be hardcoded literals inside the plotting functions below
    # (boxplot median lines, footer captions). Pulled into PALETTE so a caller that wants a
    # different theme -- e.g. the dark research-paper page -- can override them by mutating
    # this dict before calling into the module, the same way it already overrides the other
    # entries. Defaults below reproduce the previously-hardcoded colours exactly, so the
    # published light-theme figures in figures/ are unaffected.
    "median": "#000000",
    "footer": "#6B7280",
}


def _style(ax) -> None:
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.grid(axis="y", color=PALETTE["grid"], linewidth=0.7, alpha=0.7)
    ax.set_axisbelow(True)


def _boxplot(ax, data, tick_labels, horizontal=False, **kwargs):
    """boxplot()'s label/orientation keywords changed across matplotlib
    versions (tick_labels added 3.9, orientation added 3.10, labels/vert
    removed 3.11+). Try the modern API first, fall back to the old one, so
    this script keeps working regardless of which matplotlib the reader has
    installed."""
    try:
        if horizontal:
            return ax.boxplot(data, orientation="horizontal", tick_labels=tick_labels, **kwargs)
        return ax.boxplot(data, tick_labels=tick_labels, **kwargs)
    except TypeError:
        if horizontal:
            return ax.boxplot(data, vert=False, labels=tick_labels, **kwargs)
        return ax.boxplot(data, labels=tick_labels, **kwargs)


def _footer(fig, text: str) -> None:
    fig.text(0.01, 0.01, text, fontsize=7.5, color=PALETTE["footer"], ha="left")


def fig_pre_escalation_window(df: pd.DataFrame, out: Path) -> Optional[Path]:
    d = df[df["lead_gain_min"].notna()]
    if d.empty:
        return None
    scenarios = sorted(d["scenario"].unique())
    data = [d[d["scenario"] == s]["lead_gain_min"].values for s in scenarios]
    fig, ax = plt.subplots(figsize=(11, 0.55 * len(scenarios) + 2.6))
    bp = _boxplot(ax, data, scenarios, horizontal=True, patch_artist=True, widths=0.6)
    for patch, s in zip(bp["boxes"], scenarios):
        patch.set_facecolor(PALETTE["decision"] if s.startswith("leo") else PALETTE["accent"])
        patch.set_alpha(0.65)
    for med in bp["medians"]:
        med.set_color(PALETTE["median"])
    ax.axvline(0, color=PALETTE["bad"], linewidth=1, linestyle=":")
    ax.set_xlabel("pre-escalation window (min)  =  conventional escalation - decision-layer actionable")
    _style(ax)
    ax.set_title(f"Pre-escalation window by scenario (n={d.groupby('scenario').size().min()}"
                 f"-{d.groupby('scenario').size().max()} seeds each)", fontsize=12, loc="left")
    _footer(fig, "Box = IQR, line = median, whiskers = 1.5 IQR. Values below zero mean the "
                 "conventional baseline escalated FIRST. Regenerated from data/runs.csv by replot.py.")
    fig.tight_layout()
    fig.savefig(out, dpi=200)
    plt.close(fig)
    return out


def fig_cross_domain(df: pd.DataFrame, out: Path) -> Optional[Path]:
    if df.empty:
        return None
    fig, axes = plt.subplots(1, 3, figsize=(13, 4))
    metrics = [
        ("lead_gain_min", "pre-escalation window (min)"),
        ("time_to_correct_diagnosis_min", "time to correct diagnosis (min)"),
        ("n_ambiguous_decisions", "ambiguous decisions per run"),
    ]
    for ax, (col, label) in zip(axes, metrics):
        vals, labels = [], []
        for dom in sorted(df["domain"].unique()):
            v = df[(df["domain"] == dom) & df[col].notna()][col].values
            if v.size:
                vals.append(v)
                labels.append(dom)
        if not vals:
            ax.axis("off")
            continue
        bp = _boxplot(ax, vals, labels, patch_artist=True, widths=0.5)
        for patch, lab in zip(bp["boxes"], labels):
            patch.set_facecolor(PALETTE["decision"] if lab == "leo_ntn" else PALETTE["accent"])
            patch.set_alpha(0.65)
        for med in bp["medians"]:
            med.set_color(PALETTE["median"])
        ax.set_title(label, fontsize=10)
        _style(ax)
    fig.suptitle("The physics change. The decision problem persists.", fontsize=13, x=0.01, ha="left")
    _footer(fig, "Cross-domain comparison of the DECISION problem, not of the technologies. "
                 "Regenerated from data/runs.csv by replot.py.")
    fig.tight_layout(rect=[0, 0.03, 1, 0.94])
    fig.savefig(out, dpi=200)
    plt.close(fig)
    return out


def fig_escalation_quality(df: pd.DataFrame, out: Path) -> Optional[Path]:
    if df.empty:
        return None
    scen = sorted(df["scenario"].unique())
    x = np.arange(len(scen))
    w = 0.38
    fig, axes = plt.subplots(2, 1, figsize=(12, 7), sharex=True)
    for ax, (metric, label) in zip(
        axes, [("f1", "escalation F1 (vs persistent-fault ground truth)"),
               ("fpr", "escalation false-positive rate")]
    ):
        conv = [df[df["scenario"] == s][f"conv_esc_{metric}"].median() for s in scen]
        lay = [df[df["scenario"] == s][f"layer_esc_{metric}"].median() for s in scen]
        ax.bar(x - w / 2, np.nan_to_num(conv), w, label="conventional monitoring",
               color=PALETTE["conventional"])
        ax.bar(x + w / 2, np.nan_to_num(lay), w, label="Velorona decision layer",
               color=PALETTE["decision"])
        ax.set_ylabel(label, fontsize=9)
        _style(ax)
    axes[0].legend(frameon=False, fontsize=9)
    axes[1].set_xticks(x)
    axes[1].set_xticklabels(scen, rotation=30, ha="right", fontsize=8)
    fig.suptitle("Escalation quality: is the escalation about a real, persistent fault?",
                 fontsize=12, x=0.01, ha="left")
    _footer(fig, "Medians across seeds. NaN (no escalation by either arm) plotted as zero. "
                 "Regenerated from data/runs.csv by replot.py.")
    fig.tight_layout(rect=[0, 0.02, 1, 0.95])
    fig.savefig(out, dpi=200)
    plt.close(fig)
    return out


def fig_economic_exposure(df: pd.DataFrame, out: Path) -> Optional[Path]:
    need = {"exposure_conventional", "exposure_decision_layer"}
    if not need.issubset(df.columns):
        return None
    scen = sorted(df["scenario"].unique())
    conv = [df[df["scenario"] == s]["exposure_conventional"].median() for s in scen]
    lay = [df[df["scenario"] == s]["exposure_decision_layer"].median() for s in scen]
    x = np.arange(len(scen))
    w = 0.38
    fig, ax = plt.subplots(figsize=(12, 5))
    ax.bar(x - w / 2, conv, w, label="conventional", color=PALETTE["conventional"])
    ax.bar(x + w / 2, lay, w, label="decision layer", color=PALETTE["decision"])
    ax.set_xticks(x)
    ax.set_xticklabels(scen, rotation=30, ha="right", fontsize=8)
    ax.set_ylabel("modelled operational exposure per incident (currency units)")
    ax.legend(frameon=False)
    _style(ax)
    ax.set_title("Modelled operational exposure - ILLUSTRATIVE", fontsize=12, loc="left")
    _footer(fig, "ILLUSTRATIVE ONLY, NOT from operator financial data. Medians across seeds. "
                 "Regenerated from data/runs.csv by replot.py.")
    fig.tight_layout()
    fig.savefig(out, dpi=200)
    plt.close(fig)
    return out


def fig_coverage_derivation(coverage: pd.DataFrame, out: Path) -> Optional[Path]:
    if coverage.empty:
        return None
    rows = coverage.to_dict("records")
    area_row = coverage[coverage["metric"] == "instantaneous_service_coverage_km2"]
    area_km2 = float(area_row["microwave"].iloc[0]) if not area_row.empty else None
    fig, ax = plt.subplots(figsize=(11, 0.32 * len(rows) + 1.6))
    ax.axis("off")
    table = ax.table(
        cellText=[[r["metric"], str(r["microwave"]), str(r["leo_ntn"])] for r in rows],
        colLabels=["metric", "microwave backhaul", "LEO / NTN"],
        loc="upper center",
        cellLoc="left",
    )
    table.auto_set_font_size(False)
    table.set_fontsize(7.5)
    table.scale(1, 1.25)
    title = "Infrastructure derived for the study region"
    if area_km2 is not None:
        title += f" ({area_km2:,.0f} km2)"
    ax.set_title(title, fontsize=12, loc="left")
    _footer(fig, "Coverage != capacity != availability. Every value is DERIVED from stated "
                 "assumptions; no fixed satellite-to-microwave ratio is asserted. "
                 "Regenerated from data/coverage_comparison.csv by replot.py.")
    fig.tight_layout()
    fig.savefig(out, dpi=200)
    plt.close(fig)
    return out


def fig_timeline(row: pd.Series, out: Path) -> Optional[Path]:
    marks = [
        ("fault onset", row.get("t_fault_onset"), PALETTE["grid"]),
        ("first detectable", row.get("t_first_detectable"), PALETTE["accent"]),
        ("decision layer actionable", row.get("t_decision_layer_actionable"), PALETTE["decision"]),
        ("conventional escalation", row.get("t_conventional_escalation"), PALETTE["conventional"]),
        ("ticket exists", row.get("t_ticket"), PALETTE["warn"]),
        ("service impact", row.get("t_service_impact"), PALETTE["bad"]),
    ]
    marks = [m for m in marks if m[1] is not None and m[1] == m[1]]
    if len(marks) < 2:
        return None

    fig, ax = plt.subplots(figsize=(11, 3.6))
    xs = [m[1] for m in marks]
    ax.hlines(0, min(xs) - 20, max(xs) + 20, color=PALETTE["grid"], linewidth=2)
    for i, (label, t, colour) in enumerate(marks):
        y = 0.55 if i % 2 == 0 else -0.55
        ax.scatter([t], [0], s=110, color=colour, zorder=3)
        ax.vlines(t, 0, y * 0.8, color=colour, linestyle="--", linewidth=1)
        ax.text(t, y, f"{label}\nt={t:.0f} min", ha="center",
                va="bottom" if y > 0 else "top", fontsize=9, color=colour)

    pre = row.get("pre_escalation_window_min")
    if pre == pre and row.get("t_decision_layer_actionable") == row.get("t_decision_layer_actionable"):
        ax.axvspan(row["t_decision_layer_actionable"], row["t_conventional_escalation"],
                   color=PALETTE["decision"], alpha=0.08)
    ax.set_ylim(-1.3, 1.3)
    ax.set_yticks([])
    ax.set_xlabel("operational time (min)")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_visible(False)
    title = f"{row['domain']} / {row['scenario']} (seed {row['seed']})"
    if pre == pre:
        title += f" - pre-escalation window {pre:.0f} min"
    ax.set_title(title, fontsize=12, loc="left")
    _footer(fig, "Single run from data/runs.csv. Simulated network; see docs for stated "
                 "assumptions and limitations. Regenerated by replot.py.")
    fig.tight_layout()
    fig.savefig(out, dpi=200)
    plt.close(fig)
    return out


SEVERITY_MULTIPLIERS = [0.4, 0.6, 0.8, 1.0, 1.3, 1.7, 2.2]
SMOOTHING_GRID = [1, 3, 5, 10]
PERSISTENCE_GRID = [(1, 1), (2, 5), (3, 5), (4, 5)]
ESCALATION_DELAY_GRID = [0, 4, 8, 15]


def fig_severity_sensitivity(df: pd.DataFrame, out: Path) -> Optional[Path]:
    if df.empty:
        return None
    domains = sorted(df["domain"].unique())
    fig, axes = plt.subplots(1, len(domains), figsize=(7 * len(domains), 5), squeeze=False)
    axes = axes[0]
    for ax, dom in zip(axes, domains):
        d = df[df["domain"] == dom]
        for scen in sorted(d["scenario"].unique()):
            ds = d[d["scenario"] == scen]
            g = ds.groupby("severity_multiplier")["pre_escalation_window_min"]
            med, p25, p75 = g.median(), g.quantile(0.25), g.quantile(0.75)
            x = med.index.values
            ax.plot(x, med.values, marker="o", label=scen, linewidth=1.5)
            ax.fill_between(x, p25.values, p75.values, alpha=0.12)
        ax.axhline(0, color=PALETTE["bad"], linewidth=1, linestyle=":")
        ax.set_xlabel("severity multiplier (relative to declared severity)")
        ax.set_ylabel("pre-escalation window (min, median +/- IQR)")
        ax.set_title(dom, fontsize=11, loc="left")
        ax.legend(fontsize=7, frameon=False, ncol=1)
        _style(ax)
    fig.suptitle("Where does the pre-escalation window open, and where does it close?",
                 fontsize=13, x=0.01, ha="left")
    _footer(fig, "15 seeds per point. leo_low_elevation excluded (declared severity is 0 -- pure "
                 "orbital geometry, no severity to scale). Regenerated from "
                 "data/sensitivity_severity.csv by replot.py.")
    fig.tight_layout(rect=[0, 0.03, 1, 0.93])
    fig.savefig(out, dpi=200)
    plt.close(fig)
    return out


def fig_comparator_sensitivity(df: pd.DataFrame, out: Path) -> Optional[Path]:
    if df.empty:
        return None
    axis_specs = [
        ("smoothing_window", [str(v) for v in SMOOTHING_GRID], "smoothing_window (reporting intervals averaged)"),
        ("persistence", [f"{m}/{n}" for m, n in PERSISTENCE_GRID], "persistence M/N"),
        ("escalation_delay_min", [str(int(v)) for v in ESCALATION_DELAY_GRID], "escalation_delay_min"),
    ]
    fig, axes = plt.subplots(1, 3, figsize=(16, 5))
    for ax, (axis, order, label) in zip(axes, axis_specs):
        sub = df[df["sweep_axis"] == axis]
        degenerate = df[df["sweep_axis"] == "degenerate"]
        labels = order + ["degenerate"]
        data = [sub[sub["param_label"] == lab]["pre_escalation_window_min"].dropna().values for lab in order]
        data.append(degenerate["pre_escalation_window_min"].dropna().values)
        bp = _boxplot(ax, data, labels, patch_artist=True, widths=0.6)
        for patch, lab in zip(bp["boxes"], labels):
            patch.set_facecolor(PALETTE["bad"] if lab == "degenerate" else PALETTE["accent"])
            patch.set_alpha(0.65)
        for med in bp["medians"]:
            med.set_color(PALETTE["median"])
        ax.axhline(0, color=PALETTE["bad"], linewidth=1, linestyle=":")
        ax.set_xlabel(label, fontsize=9)
        ax.set_ylabel("pre-escalation window (min)")
        _style(ax)
    fig.suptitle("Does the window survive a more aggressive comparator?",
                 fontsize=13, x=0.01, ha="left")
    _footer(fig, "All scenarios pooled, 15 seeds per config, declared severity (not swept). "
                 "'degenerate' = smoothing_window=1, persistence 1-of-1, escalation_delay=0: a "
                 "perfect, instantaneous, unsmoothed threshold monitor. Window shown WITHOUT its "
                 "paired error rates for space -- see fig10 and README for the FPR/unnecessary-"
                 "dispatch pairing this study requires. Regenerated from "
                 "data/sensitivity_comparator.csv by replot.py.")
    fig.tight_layout(rect=[0, 0.03, 1, 0.93])
    fig.savefig(out, dpi=200)
    plt.close(fig)
    return out


def fig_residual_diagnosis(trace_df: pd.DataFrame, out: Path) -> Optional[Path]:
    if trace_df.empty:
        return None
    cases = trace_df[["domain", "scenario", "seed"]].drop_duplicates().to_records(index=False)
    fig, axes = plt.subplots(len(cases), 1, figsize=(11, 3.2 * len(cases)), squeeze=False)
    axes = axes[:, 0]
    for ax, (dom, scen, seed) in zip(axes, cases):
        trace = trace_df[(trace_df["domain"] == dom) & (trace_df["scenario"] == scen) & (trace_df["seed"] == seed)]
        trace = trace.sort_values("t_min")
        escalations = trace[trace["action"].isin(["ESCALATE", "RECOMMEND_ACTION"])]
        if escalations.empty:
            ax.axis("off")
            continue
        marginal_t = escalations["t_min"].iloc[0]
        candidates = ["level_drop_worst_db", "asymmetry_db", "quality_drop_db"]
        col = max(candidates, key=lambda c: trace[c].max() - trace[c].min())
        ax.plot(trace["t_min"], trace[col], color=PALETTE["accent"], linewidth=1.2, label=col)
        ax.axvline(marginal_t, color=PALETTE["bad"], linestyle="--", linewidth=1.2)
        y_at_marginal = trace.loc[trace["t_min"] == marginal_t, col].iloc[0]
        ax.scatter([marginal_t], [y_at_marginal], color=PALETTE["bad"], zorder=3, s=50)
        action = escalations["action"].iloc[0]
        ax.text(marginal_t, trace[col].max(), f"  t={marginal_t:.0f}: {action}",
                color=PALETTE["bad"], fontsize=8, va="top")
        ax.set_title(f"{dom} / {scen} (seed {seed})", fontsize=11, loc="left")
        ax.set_ylabel(col)
        _style(ax)
    axes[-1].set_xlabel("operational time (min)")
    fig.suptitle("The three self-clearing runs on which the decision layer escalated unnecessarily",
                 fontsize=12, x=0.01, ha="left")
    _footer(fig, "Vertical line = the step at which the layer first escalated or recommended action. "
                 "See docs/LIMITATIONS.md for the diagnosis of each. Regenerated from "
                 "data/sensitivity_residual_trace.csv by replot.py.")
    fig.tight_layout(rect=[0, 0.02, 1, 0.94])
    fig.savefig(out, dpi=200)
    plt.close(fig)
    return out


def _unique_comparator_configs(df: pd.DataFrame):
    cols = ["smoothing_window", "persistence_m", "persistence_n", "escalation_delay_min"]
    return [tuple(r) for r in df[cols].drop_duplicates().itertuples(index=False, name=None)]


def fig_latency_precision_tradeoff(df: pd.DataFrame, out: Path) -> Optional[Path]:
    """The headline figure: the conventional arm trades escalation latency for
    precision as it is tuned; the decision layer's error rates do not move.
    Every point pairs the window with its escalation FPR -- this study's rule
    that the window is never reported without it (see README/LIMITATIONS)."""
    if df.empty:
        return None
    domains = sorted(df["domain"].unique())
    fig, axes = plt.subplots(1, len(domains), figsize=(7.5 * len(domains), 5.5), squeeze=False)
    axes = axes[0]
    configs = _unique_comparator_configs(df)
    caption_bits = []
    for ax, dom in zip(axes, domains):
        d = df[df["domain"] == dom]
        conv_pts, layer_pts, markers = [], [], []
        for sw, pm, pn, ed in configs:
            sub = d[(d["smoothing_window"] == sw) & (d["persistence_m"] == pm)
                    & (d["persistence_n"] == pn) & (d["escalation_delay_min"] == ed)]
            if sub.empty:
                continue
            window = sub["pre_escalation_window_min"].median()
            conv_fpr = sub["conv_esc_fpr"].median()
            layer_fpr = sub["layer_esc_fpr"].median()
            conv_pts.append((conv_fpr, window))
            layer_pts.append((layer_fpr, window))
            if (sw, pm, pn, ed) == (1.0, 1.0, 1.0, 0.0):
                markers.append((conv_fpr, window, "degenerate"))
            elif (sw, pm, pn, ed) == (5.0, 3.0, 5.0, 8.0):
                markers.append((conv_fpr, window, "default"))
        conv_pts.sort(key=lambda p: p[0])
        ax.plot([p[0] for p in conv_pts], [p[1] for p in conv_pts], color=PALETTE["conventional"],
                marker="o", linewidth=1.5, label="conventional (varies with tuning)", zorder=2)
        for fpr, window, kind in markers:
            colour = PALETTE["bad"] if kind == "degenerate" else PALETTE["accent"]
            ax.scatter([fpr], [window], color=colour, zorder=4, s=80)
            ax.annotate(kind, (fpr, window), textcoords="offset points",
                        xytext=(6, 6 if kind == "degenerate" else -12), fontsize=8, color=colour)
        ax.scatter([p[0] for p in layer_pts], [p[1] for p in layer_pts], color=PALETTE["decision"],
                   marker="D", s=45, zorder=3, label="decision layer (does not move)")
        ax.axhline(0, color=PALETTE["grid"], linewidth=1, linestyle=":")
        ax.set_xlabel("escalation false-positive rate")
        ax.set_ylabel("pre-escalation window (min, median)")
        ax.set_title(dom, fontsize=11, loc="left")
        ax.legend(fontsize=8, frameon=False)
        _style(ax)
        conv_fprs = [p[0] for p in conv_pts]
        layer_fprs = [p[0] for p in layer_pts]
        caption_bits.append(f"{dom}: conventional FPR {min(conv_fprs):.0%}-{max(conv_fprs):.0%}, "
                             f"decision layer FPR {min(layer_fprs):.0%}-{max(layer_fprs):.0%}")
    fig.suptitle("Latency vs. precision: the conventional arm trades one for the other; "
                 "the decision layer does not", fontsize=12.5, x=0.01, ha="left")
    _footer(fig, "One point per comparator configuration (11 configs incl. degenerate), median over "
                 "scenarios and 15 seeds. " + "; ".join(caption_bits) + ". The decision layer's "
                 "error rates are invariant to comparator tuning -- plotted against its OWN "
                 "escalation FPR, its points cluster near a single x-value while spanning the SAME "
                 "window values as the conventional curve. It does not lie on the conventional "
                 "trade-off curve. Regenerated from data/sensitivity_comparator.csv by replot.py.")
    fig.tight_layout(rect=[0, 0.05, 1, 0.92])
    fig.savefig(out, dpi=200)
    plt.close(fig)
    return out


EXEMPLARS = [
    ("microwave", "mw_hidden_in_storm", 1),
    ("leo_ntn", "leo_rf_subsystem", 1),
]


def main(argv: Optional[List[str]] = None) -> int:
    """argv defaults to None, which argparse resolves to sys.argv[1:] itself -- the standard
    testable-CLI pattern (see the argparse docs' own recommendation). This lets a caller invoke
    main(["--data", ..., "--out", ...]) directly as a normal function call, with no need to
    mutate the process's global sys.argv to drive it (see replot_dark.py)."""
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="data")
    p.add_argument("--out", default="figures")
    args = p.parse_args(argv)

    data_dir = Path(args.data)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(data_dir / "runs.csv")
    coverage = pd.read_csv(data_dir / "coverage_comparison.csv")

    made: List[Path] = []
    for fn, name, arg in [
        (fig_pre_escalation_window, "fig01_pre_escalation_window.png", df),
        (fig_cross_domain, "fig02_cross_domain.png", df),
        (fig_escalation_quality, "fig03_escalation_quality.png", df),
        (fig_economic_exposure, "fig04_economic_exposure.png", df),
    ]:
        r = fn(arg, out_dir / name)
        if r:
            made.append(r)

    r = fig_coverage_derivation(coverage, out_dir / "fig05_coverage_derivation.png")
    if r:
        made.append(r)

    for domain, scenario, seed in EXEMPLARS:
        sub = df[(df["domain"] == domain) & (df["scenario"] == scenario) & (df["seed"] == seed)]
        if sub.empty:
            continue
        r = fig_timeline(sub.iloc[0], out_dir / f"fig06_timeline_{domain}_{scenario}.png")
        if r:
            made.append(r)

    severity_path = data_dir / "sensitivity_severity.csv"
    if severity_path.exists():
        severity_df = pd.read_csv(severity_path)
        r = fig_severity_sensitivity(severity_df, out_dir / "fig07_severity_sensitivity.png")
        if r:
            made.append(r)

    comparator_path = data_dir / "sensitivity_comparator.csv"
    comparator_df = None
    if comparator_path.exists():
        comparator_df = pd.read_csv(comparator_path)
        r = fig_comparator_sensitivity(comparator_df, out_dir / "fig08_comparator_sensitivity.png")
        if r:
            made.append(r)

    trace_path = data_dir / "sensitivity_residual_trace.csv"
    if trace_path.exists():
        trace_df = pd.read_csv(trace_path)
        r = fig_residual_diagnosis(trace_df, out_dir / "fig09_residual_diagnosis.png")
        if r:
            made.append(r)

    if comparator_df is not None:
        r = fig_latency_precision_tradeoff(comparator_df, out_dir / "fig10_latency_precision_tradeoff.png")
        if r:
            made.append(r)

    for p_ in made:
        print(f"written: {p_}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

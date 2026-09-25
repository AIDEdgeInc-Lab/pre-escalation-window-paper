"""Brand-aligned dark rendering of the article's result figures (article/figures/fig06..fig16).

Reads only the published CSVs in data/ and calls replot.py's public functions -- every chart's
data and plotting code is replot.py's, unmodified. This script changes only presentation:

  * palette -- Velorona blue for the decision layer / microwave series, AID Edge gold for the
    degenerate / zero-reference / warning marks, the neutral grey for the conventional arm.
    (Series keep distinct roles; fig 15's five-scenario line colours are left as they were,
    because there the colour identifies the scenario.)
  * typeface -- Geist Sans, if the TTFs are found (see GEIST_DIR); otherwise matplotlib's default.
  * legibility fixes for things replot.py drew badly on a dark plate: near-invisible black
    whiskers / outlier rings, a white table, a dark-on-dark "fault onset" mark, overlapping
    timeline labels, a legend sitting on data bars, footers running off the canvas.

Usage:  python replot_dark.py [--data data] [--out article/figures] [--geist DIR]
"""

from __future__ import annotations

import argparse
import math
import os
import shutil
import tempfile
import textwrap
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import colors as mcolors
from matplotlib import font_manager
from matplotlib.figure import Figure
from matplotlib.transforms import Bbox

import replot

ROOT = Path(__file__).resolve().parent

# ---- brand values (velorona.ai / aidedgeinc.com design tokens; see /brand.css) -------------
PLATE = "#081116"      # figure plate (= --plane-1, the page's figure background)
PANEL = "#0B151B"      # axes area (= --plane-2)
HEAD = "#0F1A22"       # table header (= --plane-3)
BORDER = "#26313A"
TEXT = "#F5F7FA"       # titles
BODY = "#B3BFCA"       # table body / strong labels
MUTED = "#AAB8C2"      # tick + axis labels
FAINT = "#8794A0"      # footers, whiskers, de-emphasised marks

DARK_PALETTE = {
    "conventional": "#AAB8C2",
    "decision": "#5F98D1",   # LEO/NTN series and the decision arm (Velorona accent)
    "accent": "#7AAEE3",     # microwave series, "default" markers (Velorona secondary)
    "warn": "#C6A15B",       # ticket (AID Edge gold)
    "bad": "#C6A15B",        # zero-reference lines and the degenerate case
    "grid": "#1B252C",
    "median": "#DCE4EB",
    "footer": FAINT,
}

GEIST_FILES = ["Geist-Regular.ttf", "Geist-Medium.ttf", "Geist-SemiBold.ttf"]


def _fonts(geist_dir: str | None) -> str | None:
    cands = [geist_dir] if geist_dir else []
    cands += [os.environ.get("GEIST_DIR"), str(ROOT / "fonts")]
    for d in filter(None, cands):
        p = Path(d)
        if all((p / f).exists() for f in GEIST_FILES):
            for f in GEIST_FILES:
                font_manager.fontManager.addfont(str(p / f))
            return "Geist"
    return None


def _apply_theme(family: str | None) -> None:
    replot.PALETTE.update(DARK_PALETTE)
    rc = {
        "figure.facecolor": PLATE, "savefig.facecolor": PLATE, "axes.facecolor": PANEL,
        "text.color": TEXT, "axes.labelcolor": MUTED, "axes.edgecolor": BORDER,
        "xtick.color": MUTED, "ytick.color": MUTED,
        "legend.facecolor": PANEL, "legend.edgecolor": BORDER, "legend.labelcolor": MUTED,
        "font.size": 10,
        # replot.py leaves these at matplotlib's default black -> invisible on a dark plate
        "boxplot.boxprops.color": FAINT, "boxplot.whiskerprops.color": FAINT,
        "boxplot.capprops.color": FAINT, "boxplot.flierprops.markeredgecolor": FAINT,
    }
    if family:
        rc["font.family"] = family
    plt.rcParams.update(rc)


# ---- post-fixes, applied just before each figure is written --------------------------------
def _renderer(fig):
    fig.canvas.draw()
    return fig.canvas.get_renderer()


def _footer(fig):
    for t in fig.texts:
        if tuple(round(v, 3) for v in t.get_position()) == (0.01, 0.01):
            return t
    return None


def _wrap_footer(fig) -> float:
    """Wrap the footer to the canvas width; return its height as a figure fraction."""
    t = _footer(fig)
    if t is None:
        return 0.0
    r = _renderer(fig)
    t.set_va("bottom")
    t.set_position((0.01, 0.008))
    W = fig.get_figwidth() * fig.dpi * 0.965
    w = t.get_window_extent(r).width
    if w > W:
        n = math.ceil(w / W)
        t.set_text(textwrap.fill(" ".join(t.get_text().split()), width=int(len(t.get_text()) / n * 1.0)))
        t.set_linespacing(1.3)
    return t.get_window_extent(r).height / (fig.get_figheight() * fig.dpi)


def _key(fig) -> str:
    sup = fig._suptitle.get_text() if fig._suptitle is not None else ""
    ax_title = fig.axes[0].get_title(loc="left") if fig.axes else ""
    return sup or ax_title


def _fix_timeline(fig):
    ax = fig.axes[0]
    faint = mcolors.to_hex(DARK_PALETTE["grid"])
    # the "fault onset" mark used the (dark) grid colour: give it a visible neutral
    for t in ax.texts:
        if t.get_text().startswith("fault onset"):
            t.set_color(FAINT)
    for c in ax.collections:
        kind = type(c).__name__
        if kind == "PathCollection" and mcolors.to_hex(c.get_facecolor()[0]) == faint:
            c.set_facecolor(FAINT)
            c.set_edgecolor(FAINT)
        elif kind == "LineCollection" and mcolors.to_hex(c.get_color()[0]) == faint:
            segs = c.get_segments()
            if segs and segs[0][0][0] == segs[0][1][0]:      # vertical stem, not the baseline
                c.set_color(FAINT)
    # de-overlap labels that share a row: left one right-aligned, right one left-aligned
    r = _renderer(fig)
    rows = {}
    for t in ax.texts:
        rows.setdefault(t.get_position()[1], []).append(t)
    for texts in rows.values():
        texts.sort(key=lambda t: t.get_position()[0])
        for a, b in zip(texts, texts[1:]):
            if a.get_window_extent(r).overlaps(b.get_window_extent(r)):
                a.set_ha("right")
                b.set_ha("left")
                r = _renderer(fig)


def _fix_table(fig) -> Bbox | None:
    ax = fig.axes[0]
    for table in ax.tables:
        for (row, _col), cell in table.get_celld().items():
            cell.set_facecolor(HEAD if row == 0 else PANEL)
            cell.set_edgecolor(BORDER)
            cell.set_linewidth(0.6)
            cell.get_text().set_color(TEXT if row == 0 else BODY)
            if row == 0:
                cell.get_text().set_fontweight("medium")
    r = _renderer(fig)
    H = fig.get_figheight() * fig.dpi
    tb = ax.tables[0].get_window_extent(r)
    t = _footer(fig)
    t.set_va("top"); t.set_position((0.01, tb.y0 / H - 0.012))
    fb = t.get_window_extent(r)
    y0_in = max(0.0, (fb.y0 - 0.5 * fig.dpi * 0.25) / fig.dpi)
    return Bbox([[0, y0_in], [fig.get_figwidth(), fig.get_figheight()]])


def _fix_escalation_legend(fig):
    top, bottom = fig.axes[0], fig.axes[1]
    handles, labels = top.get_legend_handles_labels()
    if top.get_legend():
        top.get_legend().remove()
    bottom.legend(handles, labels, loc="upper center", ncol=2, frameon=False, fontsize=9)


def _fix(fig):
    key = _key(fig)
    extra = {}
    if key.startswith("Infrastructure derived"):
        extra["bbox_inches"] = _fix_table(fig)
    elif key.startswith("Escalation quality"):
        _fix_escalation_legend(fig)
    elif " / " in key and "pre-escalation window" in key:
        _fix_timeline(fig)
    else:
        top = {"Does the window survive": 0.93, "Latency vs. precision": 0.92}
        rect_top = next((v for k, v in top.items() if key.startswith(k)), None)
        if key.startswith("Pre-escalation window by scenario"):
            rect_top = 1.0
        if rect_top is not None:
            h = _wrap_footer(fig)
            fig.tight_layout(rect=[0, h + 0.012, 1, rect_top])
    return extra


_orig_savefig = Figure.savefig


def _savefig(self, *args, **kwargs):
    extra = _fix(self)
    kwargs.update({k: v for k, v in extra.items() if v is not None})
    return _orig_savefig(self, *args, **kwargs)


RENAME = {
    "fig06_timeline_microwave_mw_hidden_in_storm.png": "fig06-timeline-microwave.png",
    "fig06_timeline_leo_ntn_leo_rf_subsystem.png": "fig07-timeline-leo.png",
    "fig01_pre_escalation_window.png": "fig08-window-by-scenario.png",
    "fig02_cross_domain.png": "fig09-cross-domain.png",
    "fig05_coverage_derivation.png": "fig10-coverage-derivation.png",
    "fig08_comparator_sensitivity.png": "fig11-comparator-sensitivity.png",
    "fig10_latency_precision_tradeoff.png": "fig12-latency-precision.png",
    "fig03_escalation_quality.png": "fig13-escalation-quality.png",
    "fig09_residual_diagnosis.png": "fig14-residual-diagnosis.png",
    "fig07_severity_sensitivity.png": "fig15-severity-sensitivity.png",
    "fig04_economic_exposure.png": "fig16-economic-exposure.png",
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=str(ROOT / "data"))
    ap.add_argument("--out", default=str(ROOT / "article" / "figures"))
    ap.add_argument("--geist", default=None, help="directory holding Geist-{Regular,Medium,SemiBold}.ttf")
    a = ap.parse_args()
    _apply_theme(_fonts(a.geist))
    Figure.savefig = _savefig
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        rc = replot.main(["--data", a.data, "--out", tmp])
        if rc != 0:
            return rc
        for src, dst in RENAME.items():
            if (Path(tmp) / src).exists():
                shutil.copyfile(Path(tmp) / src, out / dst)
    print(f"figures written -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

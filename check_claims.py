"""Recompute the headline numbers of the corrected-engine revision from data/corrected and verify file hashes.

Usage: python check_claims.py        (exit 0 = every check passed)
"""
import hashlib, json, sys
from pathlib import Path
import pandas as pd

D = Path(__file__).resolve().parent / "data" / "corrected"
fails = []

def check(name, got, want):
    ok = got == want
    print(("PASS" if ok else "FAIL"), name, got, "" if ok else f"(expected {want})")
    if not ok:
        fails.append(name)

prov = json.loads((D / "PROVENANCE.json").read_text())
for f, h in prov["sha256"].items():
    check(f"sha256 {f}", hashlib.sha256((D / f).read_bytes()).hexdigest(), h)

r = pd.read_csv(D / "runs.csv")
check("runs", len(r), 330)
o, l = r["pre_escalation_window_min"], r["escalation_window_min"]
check("original pooled median (min)", float(o.median()), 13.0)
check("like-for-like pooled median (min)", float(l.median()), 11.0)
check("like-for-like runs with a window", int(l.notna().sum()), 215)
med = r.groupby("scenario").agg(o=("pre_escalation_window_min", "median"), l=("escalation_window_min", "median"))
check("original positive scenario medians", int((med.o > 0).sum()), 10)
SELF = sorted(r[r.gt_self_clearing.astype(bool)].scenario.unique())
check("self-clearing scenarios", SELF, ["leo_ground_rain", "leo_low_elevation", "mw_rain_cell"])
pos = sorted(med.index[(med.l > 0) & ~med.index.isin(SELF)])
check("like-for-like positive (non-self-clearing) scenarios", len(pos), 6)
check("negative scenarios", sorted(med.index[med.l < 0]), ["leo_hidden_in_rain", "mw_hidden_in_storm"])
check("leo_hidden_in_rain median", float(med.l["leo_hidden_in_rain"]), -109.0)
check("mw_hidden_in_storm median", float(med.l["mw_hidden_in_storm"]), -1.0)
check("mw_rain_cell resolved like-for-like runs", int(r[r.scenario == "mw_rain_cell"].escalation_window_min.notna().sum()), 1)
sc = r[r.gt_self_clearing.astype(bool)]
check("self-clearing runs", len(sc), 90)
v = r["verified_first"]
check("first recommendation: consistent / inconsistent / unresolved", (int((v == True).sum()), int((v == False).sum()), int(r.verify_outcome_first.eq("SUPERSEDED").sum())), (266, 4, 37))
print("\nALL PASSED" if not fails else f"\n{len(fails)} FAILED: {fails}")
sys.exit(1 if fails else 0)

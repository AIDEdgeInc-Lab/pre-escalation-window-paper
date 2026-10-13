# Changelog

## Completion pass: Figures 5 and 14, claim and link checks, CI (content version stays 1.1)

- Figure 5 (corrected set): metrics that do not apply to a domain show "—" instead of `nan`; the figure is cropped to the table, with hairline borders and a wrapped footer. Published-data output is unchanged (pixel-identical to the published PNGs).
- Figure 14: `data/corrected/sensitivity_residual_trace.csv` added (corrected engine `58ce16a`, engine's own `diagnose_residual` on its residual cases; sha256 in `PROVENANCE.json`, verified by `check_claims.py`). Under the corrected engine two self-clearing runs remain (`mw_rain_cell` seed 10, `leo_low_elevation` seed 1), not three. Added to the article as Figures C7 (coverage table) and C8 (residuals). The body's Figures 14 and 16 are kept and tagged PREVIOUS MODEL; nothing is replaced.
- `check_links.py` (internal links and assets; external links reported separately) and `.github/workflows/checks.yml` (runs `check_claims.py` and `check_links.py`; no secrets, no deployment).
- ITU-R P.838-3 / P.530-19: still NOT VERIFIED against the official recommendations (`itu.int` was unreachable from the build environment).

## Dark figures without pale fills; one alignment system for the article (presentation only; content version stays 1.1)

- Figures 9, 11 and 13 (and 8, 12 where they share the roles): the conventional / pooled series are a dark slate `#6E7883` instead of a light grey, the degenerate comparator is a deep-navy hatched box with a thin light edge instead of a near-white one, and median lines are dark instead of white. Blue, gold and the data are unchanged.
- Article layout: two shared edges. Prose, notices, lists, quotes, the lede and captions end at one reading edge (680 px; `ch` units gave three different right edges because they scale with each element's font size); figures, the contents block and tables span the container, ending at the same right edge as the header. Figures are now the full container width (1104 px instead of 1000 px). Prose stays left-aligned: justified text without reliable hyphenation opens wide word gaps.

## Figure design correction: one palette definition, explicit roles (presentation only; content version stays 1.1)

- `replot.py` palette rewritten as semantic roles (`series_leo`, `series_mw`, `arm_*`, `pooled`, `special`, `reference`, `event_*`, ...), one meaning per key, no `.get(..., fallback)` lookups; `replot_dark.py` replaces values only. The duplicated and overloaded keys introduced by the previous palette change (`accent`, `bad`, `warn`, `decision` reused for unrelated meanings; a global colour cycle plus a per-domain cycle) are removed. Light-theme output from the published data is pixel-identical.
- Blue = LEO/NTN (and the decision layer in LEO/NTN scenarios), gold = microwave (and the decision layer in microwave scenarios), neutral = conventional/pooled/reference, near-white + hatch = the degenerate comparator. Gold no longer has a second meaning.
- Severity chart: one hue per panel, scenarios told apart by line style and marker (no shade families). Escalation-quality chart: the legend sits above the plot and names all three bar colours. Timeline figures: labels staggered on four rows so clustered events no longer overprint. Legends and footers larger.
- Phones: figures keep a legible 1100 px width and pan inside their own box (the page never scrolls sideways) instead of being squeezed to ~350 px; tapping opens the full-resolution file.

## Light corrected figures follow the same system (presentation only; content version stays 1.1)

- `replot.LIGHT_BRAND`: the corrected-set light figures (`figures/corrected/`) use the same semantic roles as the dark theme in white-background tones (blue `#2A68A8`, AID Edge deep gold `#8F6A2D`, grey `#5B6772`, near-black + hatch for the degenerate comparator). Selected by theme (`replot.THEME`), so figures from the published `data/` are unchanged and remain pixel-identical to the published PNGs.
- Footer text in the corrected set is wrapped to the canvas and the plot area keeps clear of it (`_finish`); the escalation-quality legend sits above the plot in both themes; timeline labels are staggered, masked against the stems and de-overlapped in both themes, and the pale "fault onset" mark is visible on white.
- Figure 09 (cross-domain) needed no change.

## Blue-and-gold figure palette (presentation only; content version stays 1.1)

- One colour rule for the article figures: brand blue `#68A9E0` = LEO/NTN series (and the decision-layer arm where arms are compared); gold `#C6A15B` = microwave series and the highlighted "degenerate" comparator; neutrals = conventional arm, pooled comparator configurations and reference lines. Colour separates series; it does not encode better or worse. Box fills are more opaque so gold reads as gold on the dark plate.
- The severity chart uses a blue family in the LEO/NTN panel and a gold family in the microwave panel (lines also differ by style); the window chart gains a LEO/NTN vs microwave legend; in-figure footers are larger.
- Captions: figure label (gold), title and description are separate levels.
- Light-theme figure code reads the new palette keys with fallbacks, so the published-data figures are pixel-identical.

## Article reading refinements and version labels (2026-10-12; presentation only, content version stays 1.1)

- `article/article.css`: a final block, using the same `html[data-brand]` selectors as the shared foundation (`ui-foundation.css`), so it wins over the foundation's marketing-copy text geometry: tighter heading leading and measures (section titles no longer wrap into stranded short lines), prose measure 62ch -> 70ch for technical text, the dashed notice box replaced by a hairline box with a gold rule, figure captions on a 78ch measure, more air in table rows, mobile heading sizes. No new colours; the foundation's left-anchored layout is kept.
- Article figures link to their full-resolution files (the wide multi-panel charts are not legible at page width).
- Version labels made consistent with the homepage: article title block, summary header, summary citation (plain text and BibTeX) and footer, README BibTeX and `docs/ARTICLE.md` now say 1.1 (revision of 1.0, 2026-10-12). Archived copies keep their original labels.

## Figure presentation fixes (2026-10-12, no data or claim changes; content version stays 1.1)

- `replot.py` / `replot_dark.py` (corrected set only; published-data figures are byte-identical to before): the like-for-like window figure now shows all 11 scenarios, draws the three self-clearing scenarios as labelled "not applicable" rows (never as boxes), shows resolved-runs/runs on each box, and no longer crowds the footer; the escalation-quality figure marks undefined metrics "n/a" instead of drawing them as zero; the cross-domain figure shows n per box.
- `replot_dark.py`: article figures now use Geist (converted from the repository's woff2 files when `fonttools` + `brotli` are installed; otherwise the generator falls back to the default font), the multi-scenario severity chart uses the brand blues, AID Edge gold and neutrals distinguished by line style instead of matplotlib's default saturated orange/green/red cycle, and its footer is wrapped instead of cut off.
- Regenerated: `figures/corrected/` fig01, fig01b, fig02, fig03 and `article/figures/corrected/` fig08, fig09, fig11, fig12, fig13, fig15. Light-theme figures fig05-fig10 are unchanged (their long footers are still cut off at the right edge in the light variants; the article uses the dark variants).

## Version archive (2026-10-12, not a research-content release; content version stays 1.1)

- Homepage "Research versions": current version first, earlier versions as compact entries that open preserved copies under `versions/<id>/`.
- `versions/1.0/` = site at commit `9f4f42d` (2026-10-08, last state before the corrections); `versions/0.1.0/` = site at commit `036498b` (first commit with the article, method and demo pages; initial artifact commit `c9f4517`, 2026-08-18). Built by `build_version_archive.py` from `git archive`; the only changes are an archived-version notice, `noindex`, removal of canonical/og:url metadata, and root-absolute links re-pointed inside the snapshot. Figures, numbers and claims are untouched.
- Identity caveat: the 2026-10-07 commit `1e28176` recorded 0.1.0 as the only tagged release; "1.0" is the content label the article carried from the 2026-09-25 restructure (whose changelog entry below says "unreleased"). The homepage says so.
- A deployment identifier is not a research version: redeploying does not change the version.

## 1.1 — corrected-engine revision (2026-10-12)

- Corrected-engine data (`data/corrected/`), figures (`figures/corrected/`, `article/figures/corrected/`) and the per-scenario like-for-like table published beside the previous-model set. Banners on article, summary, method; a Corrected-results section in the article. Engine commit `58ce16a` (private).
- Fixed: `figures/README.md` wrongly said the article-figure generator was outside the repository (`replot_dark.py` is in it); stale 'pending publication' entry on the landing page; CITATION.cff version (was 0.1.0, canonical is 1.x); citation URL in `summary/` now matches the canonical domain.
- PR #5 counted `mw_rain_cell` as a 7th positive scenario; that single value is a false escalation on a self-clearing event. Corrected to 6 of 11 positive.

### Earlier entries for this revision (as originally recorded)

- Added `CORRECTIONS.md`: the published runs used a rain-coefficient table equal to the superseded ITU-R P.838-0/-1 values (not P.838-3 as stated); effect ≤ 1 min on scenario medians, derived hop length 18.32 → 16.21 km; residual mechanism corrected; P.530-19 not checked; levels of evidence.
- `docs/LIMITATIONS.md`, `docs/ARTICLE.md`, `article/`, `method/`, `summary/`, `README.md` updated to match. No figure or `data/` file regenerated.

## 1.0 — landing-page restructure (unreleased, on branch `landing-restructure`)

- **Version reconciliation:** the article states "Version 1.0" while the README
  and citation entry said 0.1.0. Canonical version is now 1.0 everywhere
  (README BibTeX, CITATION.cff, landing page title block, citation and footer).
- Landing page reorganised into a 0→100 reading path; no content, link, figure
  or artifact removed.
- Findings framed as a comparator-dependent (robustness) result: H1 held under
  the default comparator (pooled median 13 min) and inverted under a degenerate
  comparator (−146 min). Also stated as the primary limitation.
- Added `sitemap.xml`, `robots.txt`, `CITATION.cff`, Open Graph tags and
  JSON-LD (ScholarlyArticle).
- Fixed 3 broken links in `article/` and `method/` that pointed to the private
  repository `pre-escalation-window` (now `pre-escalation-window-paper`).
- Replaced the outdated `aidedges.com` reference with `aidedgeinc.com` /
  `velorona.ai`.
- Author: Sara Khosravi. Publication date set to 2026-08-18 (title block, JSON-LD, citation, CITATION.cff).

## 0.1.0 — 2026-08-18

- Initial public release of the research artifacts.

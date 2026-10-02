# UI Audit — papers.aidedgeinc.com (repo `pre-escalation-window-paper`)

Stored **outside** the repo at `~/velorona-repos/_ui-docs/papers/` (with BRIEF.md): the deploy output is the repo root and `docs/` is already public, so internal UI docs must not live in the repo.
Branch `ui/foundation-audit` (from `main`). Prompt 1: audit + tokens only, zero visual change. Token file in repo: `ui-tokens.css` (repo root, header names its source, **not linked from any page**). Note: the root is the web root, so once committed/deployed this file would be publicly fetchable at `/ui-tokens.css`; it holds only design tokens.

## 1. Structure
- Static HTML, no framework or build step for the site. Pages: `/` (hub), `/article/`, `/method/`, `/summary/`, `/demo/` (`instrument.css/js`), plus `docs/*.md`, `data/`, `figures/`. Deploy: Cloudflare Pages from repo root (no wrangler config or `pages_build_output_dir` in repo; `_headers`, `robots.txt`, `sitemap.xml` at root). Domain evidence: sitemap, robots, README, CITATION.cff, every page's HTML.
- Styles: `tokens.css` (GENERATED/vendored, checksum-pinned, do not edit), `brand.css` (136 lines, re-points tokens to Velorona brand values), inline `<style>` per page (hard-coded px values). Fonts: Geist Sans 400/500/600 + Geist Mono 400/500 already self-hosted.
- CSP is **enforced** (`_headers`: `style-src 'self' 'unsafe-inline'`, `script-src 'self'`).
- Display name still "Velorona Papers" / "Research Artifacts" in `brand.css` and titles ("Papers → AID Edge Research" is Prompt 3).

## 2. Current value → target token
| Area | Current | Target | Token |
|---|---|---|---|
| Fonts | Geist Sans + Geist Mono (compliant) | same | `--ui-font-sans/-mono` |
| Font sizes | 13px ×10, 14 ×7, 15 ×5, 16, 17, 18, 22, 32, `clamp(26px,5vw,34px)`, 12 | 44→32 / 28→22 / 20→18 / 16 / 14 / 12 | `--ui-fs-*` |
| Text colors | `--text-0 #F2F5F7`, `--text-1 #A9B4BC`, `--text-2 #6E7A82` in tokens.css; brand.css re-points to `#F5F7FA` / `#AAB8C2` / `#7C8790` (plus `#B3BFCA`, `#8794A0` inline) | `#F2F4F7` / `#C3C9D1` / `#8D96A1` / `#7A828C` | `--ui-text-1..4` |
| Backgrounds | planes `#05090C … #14212B` (5 steps) | `#05070A` / `#0B0E13` | `--ui-bg`, `--ui-surface` |
| Borders | slate `rgba(96,108,118,.14/.26/.42)` | white `.08/.14` | `--ui-hairline(-strong)` |
| Accent | **Velorona blue** `#5F98D1`/`#7AAEE3` for links and interactives, gold `#C6A15B` for NEW/pending tags; tokens.css still holds cyan `#35C6DE`, amber `#F2A83C` | one accent for "AID Edge Research" | `--ui-accent` (brand TBD, see §6) |
| Container | `max-width` 820 / 760 / 640 per page | 1200 + 62ch | `--ui-container` |
| Radii | 4, 8, 10 ×4, 12 ×3, 999, 50% | card 16, pill | `--ui-card-radius` |
| Justify | none (only `justify-content`) | none | — |
| Accordion | 4 native `<details>` in `/summary/` | "+"→"×" | — |
| Motion | no `@keyframes` or animations found | edge sweep, reveal | `--ui-sweep-duration` |

## 3. Hard-coded values to replace (Prompt 2)
Per-page inline `<style>` px sizes/radii/max-widths; hex `#B3BFCA`, `#8794A0` inline; unused cyan/amber tokens in `tokens.css` (generated, leave); gold/blue accent split; no header/footer component, so each page carries its own markup.

## 4. Constraints / risks
- `tokens.css` is generated from another repo (`velorona-incident-replay`) with a checksum: never edit it; override via `brand.css` or the new `ui-tokens.css`.
- Enforced CSP: new CSS must be same-origin file or inline (`'unsafe-inline'` is allowed for styles).
- The demo (`/demo/`, `instrument.css`) is a separate instrument UI and shares `tokens.css`; re-pointing token names could shift it. Prefer additive `--ui-*` usage there.

## 5. Recommendation: sharing the system
**Copied token file** (`ui-tokens.css`). Static, no build, deliberate "self-contained vendored" policy (see `tokens.css` header). Keep the byte-identical body and the source header; add a diff/checksum check in Prompt 5, mirroring the existing `check_tokens.py` convention.

## 6. Questions for Sara
- Which brand accent does "AID Edge Research" use? BRIEF §4 defines only AID Edge gold, Velorona blue and Map teal. Papers is currently blue-led. Proposed default: `data-brand="aidedge"` (gold), since the new name sits under AID Edge. **Not decided here.**

## 7. Production branch (report only)
- `origin/HEAD` = `main`; `main` = `origin/main` = `c681197` (2026-09-25, merge of `design/brand-harmonization`). Branch point for this work.
- No Cloudflare/wrangler config in repo, so the Pages production-branch setting is not visible. Live site presumed to follow `main` but **unconfirmed**. Not decided here.

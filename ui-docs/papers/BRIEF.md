# AID Edge Ecosystem — UI Brief (source of truth)

## 1. Properties in scope
- aidedgeinc.com — AID Edge Inc. (parent / engineering company)
- velorona.ai — Velorona (product 1)
- map.velorona.ai — Velorona Map (product 2)
- papers.aidedgeinc.com — change the display name to "AID Edge Research". Keep the domain.
- Link only, do not restyle: demo.velorona.ai, plugins.qgis.org/plugins/velorona
- Do not assume the properties share a repository. Use what Prompt 1 discovers.

## 2. Product taxonomy (non-negotiable)
AID Edge Inc.
├── Products
│   ├── Velorona — Degradation Intelligence for Network Operations
│   └── Velorona Map — Geospatial & Environmental Intelligence for telecom links
├── Tools
│   ├── Velorona for QGIS — separate desktop plugin, free
│   └── AEI SDK & Libraries — Python libraries (some public, some proprietary)
└── Research
    └── AID Edge Research — papers, methods, data
Velorona Demo = an evaluation surface of Velorona, NOT a product.

Rules:
- Velorona and Velorona Map are SEPARATE SIBLING products. Never call Map a feature, module,
  layer, view or extension of Velorona. They complement each other. Never claim integration.
- Velorona Map and Velorona for QGIS are different tools. Neither replaces the other.

## 3. Approved micro-copy (verbatim; write nothing beyond this)
- Velorona: "Detects developing degradation in existing read-only telemetry, before conventional alarms escalate."
- Velorona Map: "Places a link or site in its terrain, weather and environmental context." [VERIFY: the claim that context is estimated for the link's actual location, not assigned from the nearest city, is NOT approved until Sara confirms it is implemented.]
- Relationship line (only where both products appear together):
  "Two separate products. Velorona reads how the network is behaving. Velorona Map shows where it sits and what it is exposed to. Each works on its own; used together, environmental context can support degradation evidence."
- Tools: "Free and open tools from our engineering work."
- Velorona for QGIS: "Link analysis inside QGIS. A separate desktop tool."
- AEI SDK & Libraries: "Python libraries from our engineering work. Some are public; some are proprietary."
- AID Edge Research: "The papers, methods and data behind our products."
- Velorona Demo: "Recorded telemetry replay. Request access."
- Parent cue on Velorona and Map: "An AID Edge Inc. product"
Copy rules: no hype (revolutionize, game-changing, guarantee, eliminate outages, world-leading).
Never invent results, customers, partners, awards, numbers or event outcomes.
If a claim looks inconsistent, FLAG it. Do not fix it by guessing.

## 4. Design foundation (shared by all properties)
- One family: Geist Sans (text) + Geist Mono (eyebrows, numerals, metadata). Remove all other families.
  Weights 400 / 500 / 600 only.
- Type scale (desktop → mobile): H1 44→32 · H2 28→22 · H3 20→18 · Body 16 · Small 14 · Label 12 (mono, uppercase, tracking 0.08em).
- Hierarchy through color, not size. Never pure white:
  --text-1 #F2F4F7 headings · --text-2 #C3C9D1 lead/body · --text-3 #8D96A1 supporting · --text-4 #7A828C metadata.
  ALL text, including footer and metadata, must be ≥ 4.5:1 against its background.
- Backgrounds: --bg #05070A · --surface #0B0E13 · --hairline rgba(255,255,255,0.08) · --hairline-strong rgba(255,255,255,0.14)
- One accent per property (the only brand difference):
  AID Edge #C7A96B (champagne gold) · Velorona #4B8DFF (keep current blue) · Velorona Map #2EC4D6 (blue-teal: same family, clearly different)
  Accent is used ONLY for: eyebrows, primary CTA, active nav, key links, icons, the edge sweep. Never body text or large fills.
- Spacing scale (px): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
  Section padding (top and bottom each): 96 desktop / 72 tablet / 56 mobile.
  Major sections only (hero, final CTA, first section after hero): 112–128 desktop / 72 mobile.
  Eyebrow → H2: 12 · H2 → lead: 16 · lead → content: 48 · between cards: 24.
  Every section must have a visible start, internal hierarchy and full breathing room. Sections never touch or collapse.
  Do not make pages longer just to add space. Fix rhythm, not length.
- Grid: container max-width 1200; side padding 48 desktop / 32 tablet / 20 mobile.
  ONE left edge per page: headings, paragraphs, cards and CTAs share it.
  Only deliberate full-bleed visuals (map, diagram, hero art) may break it.
- Text geometry:
  - Headings: text-wrap: balance; max-width 22ch (H1) / 28ch (H2).
  - Paragraphs: text-wrap: pretty; max-width 62ch; line-height 1.6.
  - NO text-align: justify. Get even blocks with fixed measures and balanced wrapping.
  - Avoid orphaned one-word last lines in headings and CTA copy. Fix with measure and max-width first.
    Use a non-breaking space only on short, high-priority headings or CTA labels, and only when needed.
  - Card grids: equal heights; title, body and link start at the same y; links sit at the card bottom.
  - Final CTA block: centered, max-width 560, eyebrow → heading → one paragraph (≤ 2 lines desktop) → buttons.
    Both buttons share height and font. Never an oversized paragraph or a loose pile of buttons.
  - The goal is intentional rhythm, not mathematical symmetry. Do not stretch or crop copy to force equality.
- Components (one version each, themed by --accent):
  - Button primary: 48px, pill, accent border + 14% accent fill, text --text-1, 15px/500.
  - Button secondary: same geometry, transparent, --hairline-strong border, text --text-2.
  - Text link: accent, 15px/500, trailing "→", underline on hover.
  - Card: --surface, 1px hairline, radius 16, padding 32 (24 mobile). Cards group content only; simple lists use hairline-divided columns.
  - Divider: 1px hairline only.
  - Eyebrow: 6px accent dot + mono label; the dot aligns with the FIRST line.
  - Accordion: one style, "+" rotating to "×", hairline separators. No native ▶.
  - Header: sticky, --bg at 85% + blur, hairline bottom border after 8px scroll, one primary CTA on the right.
  - Footer: keep the themed look. Flat --surface, a 1px accent hairline (40% opacity) across the top,
    optional radial accent glow ≤ 6% in one corner. Columns: Products · Tools · Research · Company · Contact.
- Motion (signal, not decoration):
  - ONE signature effect, "edge sweep": a thin accent light travels once along the border of the primary CTA
    and of interactive cards on hover/focus (700ms, ease-out, no loop). It must be perceptible on
    interaction, never continuously visible, never dominant.
  - Section reveal: opacity 0→1 + 8px rise, 400ms, once. Content stays visible if JS fails.
  - Hero art: slow ambient motion only, cycles ≥ 20s, low opacity.
  - At most one moving element per viewport besides hover feedback. prefers-reduced-motion disables all of it.
- Page endings:
  - Home pages: "Documents & resources" row (2–4 links) → final CTA → footer.
  - Every other page: ONE contextual CTA block (e.g. Tools → "Questions about our tools?") + footer. No mid-page contact blocks.

## 5. Governance
- Branch only. Small commits. No deploys, no DNS changes, no Wix changes.
- Preserve content and layout intent. If an element already works, keep it.
- No new conceptual sections. Exception: Prompt 4 may build ONE compact "Selected work" strip on the
  AID Edge home from content that already exists on the site.
- No gradients (except the footer glow), glassmorphism, stock photos, AI imagery, fake dashboards or new colors.
- When uncertain: keep the current implementation and list the question in the report.

## 6. Events (founder-supplied truth)
Allowed statuses: Upcoming · Attended · Presented · Exhibited.
RULES:
- Only this table sets a status. NEVER infer or assume attendance.
- A row with "FILL" is unresolved: do not change its wording, list it in the report.
- Whatever the status, any event whose date has already passed must NOT show "Schedule a meeting with Sara" (that CTA is for Upcoming only).
- Past events go under "Past", newest first. Upcoming events go under "Upcoming", soonest first.
- Past-tense copy templates (use only for rows with a status):
  Attended  → "AID Edge Inc. attended {Event} in {City}."
  Presented → "Sara Khosravi presented {Topic} at {Event}." (Topic required in the Note column)
  Exhibited → "AID Edge Inc. exhibited at {Event} in {City}."
  If the Note column has text, append it verbatim as one extra sentence. Never write outcomes yourself.
- New events: when Sara adds a row, create a card in the same layout. Use the supplied image;
  if none, use the existing logo-placeholder card style. Never invent images.

| Event | Date | City | Status | Note (optional, Sara's own words) |
|---|---|---|---|---|
| FutureNet North America 2026 | Nov 4–5, 2026 | New York, NY | Upcoming | |
| HIN Venture Summit | Sep 28, 2026 | Toronto, ON | FILL | |
| SCTE Ontario Chapter Spring Seminars / Vendor Table Top | Apr 2026 | Toronto, ON | FILL | |
| CanWISP 2026 | Mar 30–Apr 1, 2026 | Markham, ON | FILL | |
| MWC Barcelona 2026 | Mar 2–5, 2026 | Barcelona | FILL | |
| The Great Telco Debate | Dec 4, 2025 | London | FILL | |
| Global Data Centre & Cloud Expo Canada | FILL | FILL | FILL | |
| SCTE TechExpo25 | Sep 29–Oct 1, 2025 | Washington, DC | FILL | |

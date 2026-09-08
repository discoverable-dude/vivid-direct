# Social-Proof Sections — Design Spec

**Date:** 2026-07-08
**Status:** Approved (design)

**Goal:** Build three reusable, customizer-editable sections — **Customer Reviews**, **Chef
Testimonials**, and **People We Supply** — that can be added to the homepage, collection, and
product templates, each with a background-surface control drawn from the theme's existing palette.

**Architecture:** Three standalone Dawn OS 2.0 sections (`sections/customer-reviews.liquid`,
`sections/chef-testimonials.liquid`, `sections/people-we-supply.liquid`), each with its own
`{% schema %}`, repeatable blocks, and a `presets` entry. All three share one stylesheet
(`assets/morghew-social-proof.css`) loaded per-section (the theme's established per-section CSS
pattern — no sitewide render-block). Content is per-placement (section blocks), edited inline in
the customizer wherever the section is dropped. Ratings/aggregate are manual settings (no reviews
app). A shared background control maps a `surface` select to the theme's existing CSS tokens.

**Tech stack:** Shopify OS 2.0, Liquid, section blocks + schema, existing morghew CSS tokens,
`snippets/morghew-icon.liquid` (extended with a `star` icon). No JS required (static content).

---

## Cross-template availability

Each section schema includes:

```json
"enabled_on": { "templates": ["index", "collection", "product"] },
"presets": [{ "name": "<Section name>" }]
```

This makes each section appear in **Add section** on the homepage, collection, and product
editors. Per-placement blocks mean each instance is edited independently where it is placed
(a section on the product page is separate from one on the homepage). This matches the approved
"per-placement blocks" content model.

---

## Shared background control (identical across all three sections)

Two settings appended to every section's schema. The `surface` **default differs per section** so
each matches the mockup out of the box: Customer Reviews → `paper`, Chef Testimonials → `bark`,
People We Supply → `cream` (the `default` value below is shown as `paper`; substitute per section):

```json
{ "type": "select", "id": "surface", "label": "Background", "default": "paper",
  "options": [
    { "value": "paper",     "label": "Paper (light)" },
    { "value": "cream",     "label": "Warm cream" },
    { "value": "bark",      "label": "Dark brown" },
    { "value": "ink",       "label": "Near-black" },
    { "value": "wheat",     "label": "Wheat wash" },
    { "value": "sage",      "label": "Sage wash" },
    { "value": "clay",      "label": "Clay wash" },
    { "value": "soil",      "label": "Soil wash" }
  ] },
{ "type": "checkbox", "id": "texture", "label": "Hessian texture overlay", "default": false }
```

The section root renders `<section class="msp msp--{type}" data-surface="{{ section.settings.surface }}"
{% if section.settings.texture %}data-texture="true"{% endif %}>`.

CSS maps `data-surface` to the existing tokens and flips foreground colour. Light surfaces
(`paper`, `cream`, and the four washes) use `--ink` text; dark surfaces (`bark`, `ink`) use
`--paper` text and lightened secondary/line colours. Token mapping:

| `data-surface` | background token | text |
|---|---|---|
| paper | `--paper` (#F6F0EA) | `--ink` |
| cream | `--paper-2` (#ECE2D1) | `--ink` |
| bark | `--bark` (#3A2415) | `--paper` |
| ink | `--ink` (#281A12) | `--paper` |
| wheat | `--wash-wheat` | `--ink` |
| sage | `--wash-sage` | `--ink` |
| clay | `--wash-clay` | `--ink` |
| soil | `--wash-soil` | `--ink` |

`data-texture="true"` adds the existing `--hessian-weave` repeating-gradient as an overlay layer
on top of the chosen background.

All three sections use `padding-block: var(--sec-pad)`, an inner `max-width: var(--page)` wrap
with `padding-inline: var(--page-pad)`, and heading type via `--font-head` — consistent with every
other Morghew section.

---

## Section 1 — Customer Reviews (`customer-reviews`)

**Section settings:** `eyebrow` (text, default "Customer reviews"), `heading` (text, default
"What our customers say"), `aggregate_score` (text, default "5.0"), `aggregate_stars` (range 0–5
step 1, default 5), `aggregate_text` (text, default "Based on 120+ reviews"), plus the shared
background settings.

**Block type `review`** (max 12): `quote` (textarea), `stars` (range 0–5 step 1, default 5),
`name` (text), `meta` (text, e.g. "Heide Red 2kg · Website").

**Layout:** header row — eyebrow + heading on the left, aggregate on the right (big score,
gold star row, summary text). Below, a responsive card grid of review blocks: gold star row,
quote, a divider, then name + meta. Card grid **4→2→1** columns.

**Empty state:** if no blocks, render the header only (no empty grid).

---

## Section 2 — Chef Testimonials (`chef-testimonials`)

**Section settings:** `eyebrow` (text, default "Reviews"), `heading` (text, default
"What the chefs say"), plus shared background settings. (Mockup shows this on the dark `bark`
surface with texture — achieved via the surface control, default left at `bark` in the preset.)

**Block type `chef` (quote)** (max 9): `quote` (textarea), `name` (text), `role` (text, e.g.
"Head Chef, The Wife of Bath, Wye").

**Layout:** eyebrow + heading, then a grid of quote cards. Each card: large decorative quotation
glyph (CSS, `--wheat`/gold), quote body, a hairline divider, name (gold) + role (muted). Grid
**3→1** columns.

**Empty state:** header only if no blocks.

---

## Section 3 — People We Supply (`people-we-supply`)

**Section settings:** `eyebrow` (text, default "Trusted by"), `heading` (text, default
"People we supply"), `intro` (richtext, shown top-right — e.g. "From Kent kitchens to London
dining rooms…"), plus shared background settings (surface default `cream`).

**Block type `supplier`** (max 24): `name` (text, e.g. "The Sportsman"), `location` (text, e.g.
"Whitstable, Kent").

**Layout:** header row — eyebrow + heading left, intro paragraph right. Below, a bordered grid of
supplier cells (name bold, location in small caps/muted), separated by hairline `--line` borders.
Grid **3→2→1** columns.

**Empty state:** header only if no blocks.

---

## Star rendering

`snippets/morghew-icon.liquid` gains a `star` case (filled 5-point star path, `currentColor`,
same 40×40 viewBox and structure as existing icons). Sections render a `.msp-stars` row that loops
`{% for i in (1..count) %}{% render 'morghew-icon', icon: 'star', size: 15 %}{% endfor %}` with
`color: var(--wheat)` (gold). Count comes from the block's `stars` / the section's
`aggregate_stars`. No half-stars (YAGNI — ratings are manual whole numbers).

---

## Files

- **Create** `sections/customer-reviews.liquid`
- **Create** `sections/chef-testimonials.liquid`
- **Create** `sections/people-we-supply.liquid`
- **Create** `assets/morghew-social-proof.css` — all three sections' styles + the shared
  `[data-surface]` / `[data-texture]` background system. Loaded via
  `{{ 'morghew-social-proof.css' | asset_url | stylesheet_tag }}` at the top of each section.
- **Modify** `snippets/morghew-icon.liquid` — add the `star` icon case.

No changes to `layout/theme.liquid`, templates, or config. Deployment via `bin/deploy.sh`
(assets + sections + snippets), no template JSON push needed.

---

## Out of scope

- Reviews-app integration (ratings are manual per the approved decision).
- Sharing content across template instances (per-placement blocks per the approved decision).
- Adding the sections to any template by default — the merchant adds them via the customizer.

---

## Verification

- `shopify theme check` on the three new sections + snippet (no Liquid errors).
- CSS brace balance on `morghew-social-proof.css`.
- `curl` a page with each section added (or confirm schema validity by rendering) to check:
  each `data-surface` yields the right background/text via the served CSS; stars render; grids
  collapse at the responsive breakpoints; empty state renders header only.
- Confirm each section appears in **Add section** on index/collection/product in the customizer.

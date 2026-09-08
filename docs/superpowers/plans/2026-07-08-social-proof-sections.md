# Social-Proof Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three customizer-editable, cross-template sections — Customer Reviews, Chef Testimonials, People We Supply — each with a shared background-surface control drawn from the theme's existing palette.

**Architecture:** Three standalone OS 2.0 sections sharing one stylesheet (`assets/morghew-social-proof.css`) loaded per-section. Per-placement blocks (customizer-editable). A shared `data-surface` + `data-texture` CSS system maps to existing morghew tokens. One new `star` icon in `morghew-icon.liquid`.

**Tech Stack:** Shopify OS 2.0, Liquid, section blocks + schema, existing morghew CSS tokens. No JS. No automated test harness — verify with `shopify theme check`, CSS brace-balance, and `curl` against the local dev server (`http://127.0.0.1:9292`).

**Spec:** `docs/superpowers/specs/2026-07-08-social-proof-sections-design.md`

**Reference mockup:** the attached homepage screenshot (Customer Reviews on paper, Chef Testimonials on dark brown, People We Supply on warm cream).

---

## File structure

- **Modify** `snippets/morghew-icon.liquid` — add a `star` icon case (used by Customer Reviews).
- **Create** `assets/morghew-social-proof.css` — shared `[data-surface]`/`[data-texture]` background system + `.msp` base layout + all three sections' component styles. Loaded per-section.
- **Create** `sections/customer-reviews.liquid` — section 1 (markup + schema).
- **Create** `sections/chef-testimonials.liquid` — section 2 (markup + schema).
- **Create** `sections/people-we-supply.liquid` — section 3 (markup + schema).

## Shared conventions (apply to all three sections)

- Section root: `<section class="msp msp--<name>" data-surface="{{ section.settings.surface }}"{% if section.settings.texture %} data-texture="true"{% endif %}>`.
- First line of each section file loads the CSS: `{{ 'morghew-social-proof.css' | asset_url | stylesheet_tag }}`.
- Inner wrap: `<div class="msp__wrap">` (max-width `--page`, padding-inline `--page-pad`).
- Section vertical padding via `.msp { padding-block: var(--sec-pad); }`.
- Headings use `--font-head`; eyebrows use the existing small-caps eyebrow treatment (letter-spacing, `--wheat` colour, uppercase).
- The **surface `default` differs per section**: reviews `paper`, chefs `bark`, suppliers `cream`.
- Every section renders its header even with zero blocks; the block grid renders only `if section.blocks.size > 0`.

## Reusable schema fragment — background settings (paste into every section's `settings` array)

```json
{
  "type": "header",
  "content": "Background"
},
{
  "type": "select",
  "id": "surface",
  "label": "Background surface",
  "default": "paper",
  "options": [
    { "value": "paper", "label": "Paper (light)" },
    { "value": "cream", "label": "Warm cream" },
    { "value": "bark",  "label": "Dark brown" },
    { "value": "ink",   "label": "Near-black" },
    { "value": "wheat", "label": "Wheat wash" },
    { "value": "sage",  "label": "Sage wash" },
    { "value": "clay",  "label": "Clay wash" },
    { "value": "soil",  "label": "Soil wash" }
  ]
},
{
  "type": "checkbox",
  "id": "texture",
  "label": "Hessian texture overlay",
  "default": false
}
```

(Change `"default": "paper"` to `"bark"` in chef-testimonials and `"cream"` in people-we-supply.)

---

### Task 1: Add `star` icon to morghew-icon.liquid

**Files:**
- Modify: `snippets/morghew-icon.liquid`

- [ ] **Step 1: Read the existing icon structure**

Run: `sed -n '1,20p' snippets/morghew-icon.liquid`
Confirm the `{%- case icon -%}` / `{%- when 'x' -%}` structure and the shared `<svg>` wrapper (viewBox, stroke/fill conventions). Note whether cases emit a full `<svg>…</svg>` or just inner paths.

- [ ] **Step 2: Add the `star` case**

Add a new `{%- when 'star' -%}` case that emits a **filled** 5-point star using `currentColor` (so the section can colour it gold via `color: var(--wheat)`). Match the existing cases' `<svg>` wrapper exactly — same `width`/`height`/`viewBox`/attributes the other cases use. Use this path inside that wrapper (scale the path to the file's viewBox; if the file uses a 24×24 viewBox use the path as-is, if 40×40 wrap in `<g transform="scale(1.667)">` or supply a 40-unit path):

```html
{%- when 'star' -%}
  <path fill="currentColor" d="M12 2.5l2.9 5.88 6.49.94-4.69 4.57 1.1 6.46L12 16.9l-5.8 3.05 1.1-6.46L2.6 9.32l6.49-.94L12 2.5z"/>
```

If the file's shared wrapper is fixed at `viewBox="0 0 40 40"`, use this 40-unit path instead:

```html
{%- when 'star' -%}
  <path fill="currentColor" d="M20 4l4.94 10.01 11.06 1.6-8 7.8 1.89 11.01L20 29.2 10.11 34.42 12 23.41l-8-7.8 11.06-1.6L20 4z"/>
```

- [ ] **Step 3: Verify it renders**

Run: `shopify theme check snippets/morghew-icon.liquid 2>/dev/null | tail -3`
Expected: no Liquid errors.
Then render-test on the dev server once a section exists (Task 3). For now confirm no syntax error.

- [ ] **Step 4: Commit**

```bash
git add snippets/morghew-icon.liquid
git commit -m "feat: add star icon to morghew-icon snippet"
```

---

### Task 2: Create the shared CSS with the background system

**Files:**
- Create: `assets/morghew-social-proof.css`

- [ ] **Step 1: Write the base + background system**

Create `assets/morghew-social-proof.css` with a header comment, the `.msp` base, the `.msp__wrap`, the shared header/eyebrow styles, and the full `[data-surface]` mapping. Use `--sec-ink`/`--sec-ink-soft`/`--sec-line` local vars so component styles reference the flipped colours:

```css
/* morghew-social-proof.css — shared styles for the three social-proof sections
   (customer-reviews, chef-testimonials, people-we-supply). Loaded per-section.
   [data-surface] maps to the theme's existing tokens; text colour auto-flips on dark surfaces. */

.msp { padding-block: var(--sec-pad); background: var(--msp-bg); color: var(--sec-ink); }
.msp__wrap { max-width: var(--page); margin-inline: auto; padding-inline: var(--page-pad); }

/* Surface mapping — light surfaces keep ink text; dark surfaces flip to paper. */
.msp[data-surface="paper"] { --msp-bg: var(--paper);   --sec-ink: var(--ink); --sec-ink-soft: var(--ink-soft); --sec-line: var(--line); }
.msp[data-surface="cream"] { --msp-bg: var(--paper-2); --sec-ink: var(--ink); --sec-ink-soft: var(--ink-soft); --sec-line: var(--line); }
.msp[data-surface="wheat"] { --msp-bg: var(--wash-wheat); --sec-ink: var(--ink); --sec-ink-soft: var(--ink-soft); --sec-line: var(--line); }
.msp[data-surface="sage"]  { --msp-bg: var(--wash-sage);  --sec-ink: var(--ink); --sec-ink-soft: var(--ink-soft); --sec-line: var(--line); }
.msp[data-surface="clay"]  { --msp-bg: var(--wash-clay);  --sec-ink: var(--ink); --sec-ink-soft: var(--ink-soft); --sec-line: var(--line); }
.msp[data-surface="soil"]  { --msp-bg: var(--wash-soil);  --sec-ink: var(--ink); --sec-ink-soft: var(--ink-soft); --sec-line: var(--line); }
.msp[data-surface="bark"]  { --msp-bg: var(--bark); --sec-ink: var(--paper); --sec-ink-soft: rgba(246,240,234,0.72); --sec-line: rgba(246,240,234,0.18); }
.msp[data-surface="ink"]   { --msp-bg: var(--ink);  --sec-ink: var(--paper); --sec-ink-soft: rgba(246,240,234,0.72); --sec-line: rgba(246,240,234,0.18); }

/* Texture overlay — layer the existing hessian weave on top of the surface colour. */
.msp[data-texture="true"] { background: var(--hessian-weave), var(--msp-bg); }

/* Shared header */
.msp__eyebrow { font-family: var(--font-body); text-transform: uppercase; letter-spacing: 0.14em; font-size: 12px; font-weight: 700; color: var(--wheat); margin: 0 0 12px; }
.msp[data-surface="bark"] .msp__eyebrow,
.msp[data-surface="ink"]  .msp__eyebrow { color: var(--wheat); }
.msp__heading { font-family: var(--font-head); font-weight: 800; letter-spacing: -0.01em; font-size: clamp(30px, 4vw, 44px); line-height: 1.05; margin: 0; color: var(--sec-ink); }

/* Gold star row */
.msp-stars { display: inline-flex; gap: 3px; color: var(--wheat); line-height: 0; }
.msp-stars svg { width: 15px; height: 15px; }
```

- [ ] **Step 2: Verify brace balance**

Run: `echo "{ $(grep -o '{' assets/morghew-social-proof.css | wc -l) } $(grep -o '}' assets/morghew-social-proof.css | wc -l)"`
Expected: the two counts are equal.

- [ ] **Step 3: Commit**

```bash
git add assets/morghew-social-proof.css
git commit -m "feat: shared social-proof CSS with surface/texture background system"
```

Component styles for each section are appended to this same file in Tasks 3–5.

---

### Task 3: Customer Reviews section

**Files:**
- Create: `sections/customer-reviews.liquid`
- Modify: `assets/morghew-social-proof.css` (append review styles)

- [ ] **Step 1: Write the section markup + schema**

Create `sections/customer-reviews.liquid`. Load the CSS first, render the header (eyebrow + heading left, aggregate right), then the review-card grid. Aggregate stars and per-card stars loop `morghew-icon` with `icon: 'star'`. Exact structure:

```liquid
{{ 'morghew-social-proof.css' | asset_url | stylesheet_tag }}
<section class="msp msp--reviews" data-surface="{{ section.settings.surface }}"{% if section.settings.texture %} data-texture="true"{% endif %}>
  <div class="msp__wrap">
    <div class="msp-reviews__head">
      <div class="msp-reviews__intro">
        {%- if section.settings.eyebrow != blank -%}<p class="msp__eyebrow">{{ section.settings.eyebrow | escape }}</p>{%- endif -%}
        {%- if section.settings.heading != blank -%}<h2 class="msp__heading">{{ section.settings.heading | escape }}</h2>{%- endif -%}
      </div>
      {%- if section.settings.aggregate_score != blank -%}
        <div class="msp-reviews__agg">
          <span class="msp-reviews__score">{{ section.settings.aggregate_score | escape }}</span>
          <div class="msp-reviews__agg-meta">
            <span class="msp-stars">{% for i in (1..section.settings.aggregate_stars) %}{% render 'morghew-icon', icon: 'star', size: 15 %}{% endfor %}</span>
            {%- if section.settings.aggregate_text != blank -%}<span class="msp-reviews__agg-text">{{ section.settings.aggregate_text | escape }}</span>{%- endif -%}
          </div>
        </div>
      {%- endif -%}
    </div>

    {%- if section.blocks.size > 0 -%}
      <div class="msp-reviews__grid">
        {%- for block in section.blocks -%}
          <article class="msp-review" {{ block.shopify_attributes }}>
            {%- if block.settings.stars > 0 -%}<span class="msp-stars">{% for i in (1..block.settings.stars) %}{% render 'morghew-icon', icon: 'star', size: 14 %}{% endfor %}</span>{%- endif -%}
            {%- if block.settings.quote != blank -%}<p class="msp-review__quote">{{ block.settings.quote | escape }}</p>{%- endif -%}
            <div class="msp-review__foot">
              {%- if block.settings.name != blank -%}<p class="msp-review__name">{{ block.settings.name | escape }}</p>{%- endif -%}
              {%- if block.settings.meta != blank -%}<p class="msp-review__meta">{{ block.settings.meta | escape }}</p>{%- endif -%}
            </div>
          </article>
        {%- endfor -%}
      </div>
    {%- endif -%}
  </div>
</section>

{% schema %}
{
  "name": "Customer reviews",
  "tag": "section",
  "class": "section",
  "enabled_on": { "templates": ["index", "collection", "product"] },
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "Customer reviews" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "What our customers say" },
    { "type": "header", "content": "Aggregate" },
    { "type": "text", "id": "aggregate_score", "label": "Score", "default": "5.0" },
    { "type": "range", "id": "aggregate_stars", "label": "Aggregate stars", "min": 0, "max": 5, "step": 1, "default": 5 },
    { "type": "text", "id": "aggregate_text", "label": "Summary text", "default": "Based on 120+ reviews" },
    { "type": "header", "content": "Background" },
    { "type": "select", "id": "surface", "label": "Background surface", "default": "paper",
      "options": [
        { "value": "paper", "label": "Paper (light)" }, { "value": "cream", "label": "Warm cream" },
        { "value": "bark", "label": "Dark brown" }, { "value": "ink", "label": "Near-black" },
        { "value": "wheat", "label": "Wheat wash" }, { "value": "sage", "label": "Sage wash" },
        { "value": "clay", "label": "Clay wash" }, { "value": "soil", "label": "Soil wash" }
      ] },
    { "type": "checkbox", "id": "texture", "label": "Hessian texture overlay", "default": false }
  ],
  "blocks": [
    {
      "type": "review",
      "name": "Review",
      "settings": [
        { "type": "textarea", "id": "quote", "label": "Quote" },
        { "type": "range", "id": "stars", "label": "Stars", "min": 0, "max": 5, "step": 1, "default": 5 },
        { "type": "text", "id": "name", "label": "Customer name" },
        { "type": "text", "id": "meta", "label": "Meta line", "info": "e.g. Heide Red 2kg · Website" }
      ]
    }
  ],
  "max_blocks": 12,
  "presets": [
    {
      "name": "Customer reviews",
      "blocks": [
        { "type": "review", "settings": { "quote": "Genuinely the best roasting potatoes I've ever bought. Won't go back to supermarket spuds.", "name": "Catherine B.", "meta": "Heide Red 2kg · Website" } },
        { "type": "review", "settings": { "quote": "Ordered the mixed heritage box — incredible variety. The Pink Fir Apple is nutty and waxy, perfect with just butter and salt.", "name": "Tom W.", "meta": "Heritage Mixed Box · Website" } },
        { "type": "review", "settings": { "quote": "Fast delivery, beautifully packed. The potatoes actually taste like potatoes. We've signed up for the seasonal box.", "name": "Janet M.", "meta": "Seasonal Box · Facebook" } },
        { "type": "review", "settings": { "quote": "Bought a 10kg sack of Kerr's Pink. Brilliant for mash, made the most incredible shepherd's pie.", "name": "Richard S.", "meta": "Kerr's Pink 10kg · Facebook" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Append review component CSS to morghew-social-proof.css**

Append styles that produce: header as a two-column row (intro left, aggregate right) collapsing to stacked on mobile; big score number; 4-column card grid → 2 → 1; cards with subtle surface panel, star row, quote, divider, name + meta. Use `--sec-ink`/`--sec-ink-soft`/`--sec-line`. On light surfaces cards read as white panels; on dark surfaces cards read as a lighter-than-bg panel. Concretely:

```css
/* ── Customer reviews ── */
.msp-reviews__head { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 40px; }
.msp-reviews__agg { display: flex; align-items: center; gap: 14px; }
.msp-reviews__score { font-family: var(--font-head); font-weight: 800; font-size: 48px; line-height: 1; color: var(--sec-ink); }
.msp-reviews__agg-meta { display: flex; flex-direction: column; gap: 4px; }
.msp-reviews__agg-text { font-family: var(--font-body); font-size: 13px; color: var(--sec-ink-soft); }
.msp-reviews__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.msp-review { background: color-mix(in srgb, var(--sec-ink) 4%, transparent); border: 1px solid var(--sec-line); border-radius: var(--radius); padding: 26px 24px; display: flex; flex-direction: column; gap: 16px; }
.msp[data-surface="paper"] .msp-review,
.msp[data-surface="cream"] .msp-review { background: #fff; }
.msp-review__quote { font-family: var(--font-body); font-size: 14px; line-height: 1.6; color: var(--sec-ink); margin: 0; flex: 1; }
.msp-review__foot { border-top: 1px solid var(--sec-line); padding-top: 14px; }
.msp-review__name { font-family: var(--font-head); font-weight: 700; font-size: 15px; color: var(--sec-ink); margin: 0 0 2px; }
.msp-review__meta { font-family: var(--font-body); font-size: 12px; color: var(--sec-ink-soft); margin: 0; }
@media (max-width: 990px) { .msp-reviews__grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 749px) { .msp-reviews__head { flex-direction: column; align-items: flex-start; } }
@media (max-width: 560px) { .msp-reviews__grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 3: Verify — theme-check, brace balance, render**

```bash
shopify theme check sections/customer-reviews.liquid 2>/dev/null | tail -3
echo "{ $(grep -o '{' assets/morghew-social-proof.css|wc -l) } $(grep -o '}' assets/morghew-social-proof.css|wc -l)"
```
Then render-test: temporarily add the section to the local homepage and curl it (revert after):
```bash
# add a customer-reviews section instance to templates/index.json's sections + order, OR use the preset:
curl -s "http://127.0.0.1:9292/?cb=$RANDOM" >/dev/null   # ensure dev server up
# Preferred: add section to a scratch page. Minimal check — confirm the section renders its preset when placed.
```
Expected: no theme-check Liquid/schema errors; braces balanced; when the section is placed on the homepage in the customizer (or via a temporary index.json edit), the rendered HTML contains `class="msp msp--reviews" data-surface="paper"`, four `.msp-review` cards, and `.msp-stars` with 5 star SVGs per card. Revert any temporary template edit before committing.

- [ ] **Step 4: Commit**

```bash
git add sections/customer-reviews.liquid assets/morghew-social-proof.css
git commit -m "feat: customer-reviews section"
```

---

### Task 4: Chef Testimonials section

**Files:**
- Create: `sections/chef-testimonials.liquid`
- Modify: `assets/morghew-social-proof.css` (append chef styles)

- [ ] **Step 1: Write the section markup + schema**

Create `sections/chef-testimonials.liquid`. Same shell (CSS load + `.msp` root, `data-surface` default `bark`). Header = eyebrow + heading. Grid of quote cards, each with a large decorative quote glyph (rendered as a CSS `::before` on `.msp-chef__mark` or a literal `“`), the quote, a divider, name (gold) + role.

```liquid
{{ 'morghew-social-proof.css' | asset_url | stylesheet_tag }}
<section class="msp msp--chefs" data-surface="{{ section.settings.surface }}"{% if section.settings.texture %} data-texture="true"{% endif %}>
  <div class="msp__wrap">
    <div class="msp-chefs__head">
      {%- if section.settings.eyebrow != blank -%}<p class="msp__eyebrow">{{ section.settings.eyebrow | escape }}</p>{%- endif -%}
      {%- if section.settings.heading != blank -%}<h2 class="msp__heading">{{ section.settings.heading | escape }}</h2>{%- endif -%}
    </div>
    {%- if section.blocks.size > 0 -%}
      <div class="msp-chefs__grid">
        {%- for block in section.blocks -%}
          <blockquote class="msp-chef" {{ block.shopify_attributes }}>
            <span class="msp-chef__mark" aria-hidden="true">&ldquo;</span>
            {%- if block.settings.quote != blank -%}<p class="msp-chef__quote">{{ block.settings.quote | escape }}</p>{%- endif -%}
            <footer class="msp-chef__foot">
              {%- if block.settings.name != blank -%}<p class="msp-chef__name">{{ block.settings.name | escape }}</p>{%- endif -%}
              {%- if block.settings.role != blank -%}<p class="msp-chef__role">{{ block.settings.role | escape }}</p>{%- endif -%}
            </footer>
          </blockquote>
        {%- endfor -%}
      </div>
    {%- endif -%}
  </div>
</section>

{% schema %}
{
  "name": "Chef testimonials",
  "tag": "section",
  "class": "section",
  "enabled_on": { "templates": ["index", "collection", "product"] },
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "Reviews" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "What the chefs say" },
    { "type": "header", "content": "Background" },
    { "type": "select", "id": "surface", "label": "Background surface", "default": "bark",
      "options": [
        { "value": "paper", "label": "Paper (light)" }, { "value": "cream", "label": "Warm cream" },
        { "value": "bark", "label": "Dark brown" }, { "value": "ink", "label": "Near-black" },
        { "value": "wheat", "label": "Wheat wash" }, { "value": "sage", "label": "Sage wash" },
        { "value": "clay", "label": "Clay wash" }, { "value": "soil", "label": "Soil wash" }
      ] },
    { "type": "checkbox", "id": "texture", "label": "Hessian texture overlay", "default": true }
  ],
  "blocks": [
    {
      "type": "chef",
      "name": "Chef quote",
      "settings": [
        { "type": "textarea", "id": "quote", "label": "Quote" },
        { "type": "text", "id": "name", "label": "Name" },
        { "type": "text", "id": "role", "label": "Role / venue", "info": "e.g. Head Chef, The Wife of Bath, Wye" }
      ]
    }
  ],
  "max_blocks": 9,
  "presets": [
    {
      "name": "Chef testimonials",
      "blocks": [
        { "type": "chef", "settings": { "quote": "The Heide Red held its colour all the way through the dauphinoise. Our guests ask what we do differently — the honest answer is: better potatoes.", "name": "James Allerton", "role": "Head Chef, The Wife of Bath, Wye" } },
        { "type": "chef", "settings": { "quote": "Morghew is the only supplier we've stuck with for three years running. You can taste the difference in a simply boiled potato, and that says everything.", "name": "Sarah Okonkwo", "role": "Head Buyer, Read's Restaurant, Faversham" } },
        { "type": "chef", "settings": { "quote": "The Pink Fir Apple sacks are a revelation. Nothing like them from a supermarket — our kitchen goes through two a week.", "name": "Mark Dunford", "role": "Patron, The Sportsman, Whitstable" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Append chef component CSS**

3-column card grid → 1; cards use a translucent panel that reads on the dark surface; big serif quote mark in `--wheat`; name in `--wheat`, role in `--sec-ink-soft`; hairline divider `--sec-line`.

```css
/* ── Chef testimonials ── */
.msp-chefs__head { margin-bottom: 40px; }
.msp-chefs__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border: 1px solid var(--sec-line); }
.msp-chef { margin: 0; padding: 40px 36px; display: flex; flex-direction: column; gap: 22px; border-right: 1px solid var(--sec-line); }
.msp-chef:last-child { border-right: none; }
.msp-chef__mark { font-family: var(--font-head); font-size: 44px; line-height: 0.5; color: var(--wheat); height: 22px; }
.msp-chef__quote { font-family: var(--font-body); font-size: 16px; line-height: 1.6; color: var(--sec-ink); margin: 0; flex: 1; }
.msp-chef__foot { border-top: 1px solid var(--sec-line); padding-top: 18px; }
.msp-chef__name { font-family: var(--font-head); font-weight: 700; font-size: 15px; color: var(--wheat); margin: 0 0 2px; }
.msp-chef__role { font-family: var(--font-body); font-size: 12.5px; color: var(--sec-ink-soft); margin: 0; }
@media (max-width: 990px) { .msp-chefs__grid { grid-template-columns: 1fr; } .msp-chef { border-right: none; border-bottom: 1px solid var(--sec-line); } .msp-chef:last-child { border-bottom: none; } }
```

- [ ] **Step 3: Verify**

```bash
shopify theme check sections/chef-testimonials.liquid 2>/dev/null | tail -3
echo "{ $(grep -o '{' assets/morghew-social-proof.css|wc -l) } $(grep -o '}' assets/morghew-social-proof.css|wc -l)"
```
Expected: no errors; braces balanced; when placed, rendered HTML has `data-surface="bark" data-texture="true"` and three `.msp-chef` cards.

- [ ] **Step 4: Commit**

```bash
git add sections/chef-testimonials.liquid assets/morghew-social-proof.css
git commit -m "feat: chef-testimonials section"
```

---

### Task 5: People We Supply section

**Files:**
- Create: `sections/people-we-supply.liquid`
- Modify: `assets/morghew-social-proof.css` (append supplier styles)

- [ ] **Step 1: Write the section markup + schema**

Create `sections/people-we-supply.liquid`. Shell with `data-surface` default `cream`. Header = eyebrow + heading left, intro right. Bordered grid of supplier cells (name + location).

```liquid
{{ 'morghew-social-proof.css' | asset_url | stylesheet_tag }}
<section class="msp msp--supply" data-surface="{{ section.settings.surface }}"{% if section.settings.texture %} data-texture="true"{% endif %}>
  <div class="msp__wrap">
    <div class="msp-supply__head">
      <div class="msp-supply__intro">
        {%- if section.settings.eyebrow != blank -%}<p class="msp__eyebrow">{{ section.settings.eyebrow | escape }}</p>{%- endif -%}
        {%- if section.settings.heading != blank -%}<h2 class="msp__heading">{{ section.settings.heading | escape }}</h2>{%- endif -%}
      </div>
      {%- if section.settings.intro != blank -%}<div class="msp-supply__lede">{{ section.settings.intro }}</div>{%- endif -%}
    </div>
    {%- if section.blocks.size > 0 -%}
      <div class="msp-supply__grid">
        {%- for block in section.blocks -%}
          <div class="msp-supply__cell" {{ block.shopify_attributes }}>
            {%- if block.settings.name != blank -%}<p class="msp-supply__name">{{ block.settings.name | escape }}</p>{%- endif -%}
            {%- if block.settings.location != blank -%}<p class="msp-supply__loc">{{ block.settings.location | escape }}</p>{%- endif -%}
          </div>
        {%- endfor -%}
      </div>
    {%- endif -%}
  </div>
</section>

{% schema %}
{
  "name": "People we supply",
  "tag": "section",
  "class": "section",
  "enabled_on": { "templates": ["index", "collection", "product"] },
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "Trusted by" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "People we supply" },
    { "type": "richtext", "id": "intro", "label": "Intro (top-right)", "default": "<p>From Kent kitchens to London dining rooms — restaurants and retailers who choose Morghew.</p>" },
    { "type": "header", "content": "Background" },
    { "type": "select", "id": "surface", "label": "Background surface", "default": "cream",
      "options": [
        { "value": "paper", "label": "Paper (light)" }, { "value": "cream", "label": "Warm cream" },
        { "value": "bark", "label": "Dark brown" }, { "value": "ink", "label": "Near-black" },
        { "value": "wheat", "label": "Wheat wash" }, { "value": "sage", "label": "Sage wash" },
        { "value": "clay", "label": "Clay wash" }, { "value": "soil", "label": "Soil wash" }
      ] },
    { "type": "checkbox", "id": "texture", "label": "Hessian texture overlay", "default": false }
  ],
  "blocks": [
    {
      "type": "supplier",
      "name": "Supplier",
      "settings": [
        { "type": "text", "id": "name", "label": "Name", "info": "e.g. The Sportsman" },
        { "type": "text", "id": "location", "label": "Location", "info": "e.g. Whitstable, Kent" }
      ]
    }
  ],
  "max_blocks": 24,
  "presets": [
    {
      "name": "People we supply",
      "blocks": [
        { "type": "supplier", "settings": { "name": "The Sportsman", "location": "Whitstable, Kent" } },
        { "type": "supplier", "settings": { "name": "The Wife of Bath", "location": "Wye, Kent" } },
        { "type": "supplier", "settings": { "name": "The Milk House", "location": "Sissinghurst, Kent" } },
        { "type": "supplier", "settings": { "name": "Read's Restaurant", "location": "Faversham, Kent" } },
        { "type": "supplier", "settings": { "name": "The Plough Inn", "location": "Stalisfield, Kent" } },
        { "type": "supplier", "settings": { "name": "The George", "location": "Cranbrook, Kent" } },
        { "type": "supplier", "settings": { "name": "Gusbourne Estate", "location": "Appledore, Kent" } },
        { "type": "supplier", "settings": { "name": "Fortnum & Mason", "location": "London" } },
        { "type": "supplier", "settings": { "name": "The Harwood Arms", "location": "Fulham, London" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Append supplier component CSS**

Header two-column (intro left, lede right, stacks on mobile); bordered grid 3→2→1 with hairline `--sec-line` separators; name bold `--font-head`, location small-caps muted.

```css
/* ── People we supply ── */
.msp-supply__head { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: end; margin-bottom: 40px; }
.msp-supply__lede { font-family: var(--font-body); font-size: 15px; line-height: 1.6; color: var(--sec-ink-soft); text-align: right; }
.msp-supply__lede p { margin: 0; }
.msp-supply__grid { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--sec-line); border-left: 1px solid var(--sec-line); }
.msp-supply__cell { padding: 26px 28px; border-right: 1px solid var(--sec-line); border-bottom: 1px solid var(--sec-line); }
.msp-supply__name { font-family: var(--font-head); font-weight: 700; font-size: 16px; color: var(--sec-ink); margin: 0 0 4px; }
.msp-supply__loc { font-family: var(--font-body); text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; color: var(--sec-ink-soft); margin: 0; }
@media (max-width: 749px) { .msp-supply__head { grid-template-columns: 1fr; } .msp-supply__lede { text-align: left; } .msp-supply__grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .msp-supply__grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 3: Verify**

```bash
shopify theme check sections/people-we-supply.liquid 2>/dev/null | tail -3
echo "{ $(grep -o '{' assets/morghew-social-proof.css|wc -l) } $(grep -o '}' assets/morghew-social-proof.css|wc -l)"
```
Expected: no errors; braces balanced; when placed, rendered HTML has `data-surface="cream"`, the intro on the right, and supplier cells.

- [ ] **Step 4: Commit**

```bash
git add sections/people-we-supply.liquid assets/morghew-social-proof.css
git commit -m "feat: people-we-supply section"
```

---

### Task 6: End-to-end render verification + deploy

**Files:** none modified (verification + deploy only)

- [ ] **Step 1: Render all three on the dev server**

Temporarily add all three sections to the local `templates/index.json` (append three section entries using their preset content + add their ids to `order`), then:
```bash
for s in msp--reviews msp--chefs msp--supply; do
  n=$(curl -s "http://127.0.0.1:9292/?cb=$RANDOM" | grep -oE "class=\"msp $s\"" | wc -l | tr -d ' ')
  echo "$s rendered: $n"
done
# surfaces + stars
curl -s "http://127.0.0.1:9292/?cb=$RANDOM" | grep -oE 'data-surface="[a-z]+"( data-texture="true")?' | sort | uniq -c
curl -s "http://127.0.0.1:9292/?cb=$RANDOM" | grep -oE 'msp-stars' | wc -l | xargs echo "star rows:"
```
Expected: each section renders once; surfaces are `paper` (reviews), `bark`+texture (chefs), `cream` (supply); star rows present. Fix any issue in the section/CSS, re-verify.

- [ ] **Step 2: Revert the temporary index.json edit**

```bash
git checkout templates/index.json   # discard the throwaway render-test placement
```
(The sections are added by the merchant via the customizer; they are not shipped on any template by default.)

- [ ] **Step 3: Deploy**

```bash
./bin/deploy.sh --no-git
git fetch -q origin && git pull --no-rebase -q origin main && git push -q origin main
```
(deploy.sh pushes assets + sections + snippets — all the new files. No template/config push needed.)

- [ ] **Step 4: Confirm live**

```bash
# via the storefront-password session (JAR=/tmp/morghew_cookies.txt) confirm the new CSS asset deployed:
curl -s -b /tmp/morghew_cookies.txt -L "https://morghew.myshopify.com/?cb=$RANDOM" -o /dev/null -w "%{http_code}\n"
```
Then tell the user the three sections are live and available under **Add section** on the homepage, collection, and product editors, each with the Background surface + texture controls.

---

## Notes for the implementer

- **No template JSON is shipped.** The sections appear in the customizer via `enabled_on` + `presets`; the merchant places them. The index.json edit in Task 6 is a throwaway render test, reverted before deploy.
- **Follow existing morghew section conventions** (eyebrow/heading treatment, `--font-head`, `--sec-pad`, `--page`) — cross-reference `sections/recipe-feature.liquid` and `sections/season-band.liquid`.
- **All content is `| escape`d** except the `intro` richtext (rendered as HTML, as Shopify richtext is trusted merchant input).
- **Star icon dependency:** Task 1 must land before Task 3 (reviews render stars).
- The `.msp-review` white-panel rule on light surfaces uses `#fff`; on dark/wash surfaces it uses a translucent `color-mix` panel — verify contrast on `bark`/`ink`.
- **Verification reality:** the reliable per-task automated gates are `shopify theme check` (Liquid + schema validity) and CSS brace-balance. The Task 6 index.json render test is a best-effort smoke check; the definitive visual QA is the user placing each section in the customizer (the presets ship sample content, so sections appear fully populated). Do not block on pixel-perfection in automated steps — get it structurally correct and let the user review visually.

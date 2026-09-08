# Estate Produce Product Template — Design Spec

**Date:** 2026-07-07
**Status:** Approved (design), pending spec review

**Goal:** One flexible Shopify product template for the estate's non-potato product
types — flour, meat/game, rapeseed oil, firewood, honey (and potato seeds if kept) —
built to the quality of the bespoke potato page but generic, where products differ by
content + metafields rather than code.

**Architecture:** A new JSON template (`product.estate-produce`) renders one bespoke,
generic section (`product-estate`) plus any customizer-appended sections. The buy box is
**option-driven** (a row of estate tiles per Shopify option) so it handles both the common
single-option products and the one two-option firewood product with the same component.
Everything reuses existing infrastructure: the AJAX mini-cart drawer, `product-form`, the
unified product card, `morghew-icon`, and the text+accordion section.

**Tech stack:** Shopify OS 2.0, Liquid, JSON templates, vanilla JS (adapted from
`product-potato.js`), existing morghew CSS token system.

---

## Product counts (drive the design)

| Type | Products | Variants |
|------|----------|----------|
| Meat / game | 8 | ~2 (weights); **features recipes** |
| Firewood | 6 | ~2 (load size); **1 product has 2 options: load size × log size** |
| Rapeseed oil | 4 | ~2 (bottle size) |
| Flour | 3 | ~2 (bag size) |
| Honey | 1 | single or 2 (jar size) |
| Potato seeds | TBC — confirm if still in range | ~2 |

None is large enough to warrant a bespoke per-type template. One shared template is right.

---

## Files

- **Create** `templates/product.estate-produce.json` — template that renders `product-estate`
  and allows additional customizer sections (text+accordion, etc.) to be appended.
- **Create** `sections/product-estate.liquid` — the generic estate product section.
- **Create** `assets/morghew-estate.js` — option-based variant resolution + AJAX add-to-cart
  (adapted from `product-potato.js`; opens the existing drawer).
- **Extend** `assets/morghew-sections.css` (or new `assets/morghew-estate.css`) — buy box tiles,
  gallery, key-facts, recipes, type-specific spec list. Reuse existing tokens/patterns.

**Reused as-is:** `snippets/cart-drawer.liquid` + `morghew-drawer.css`, `snippets/card-potato.liquid`
(related + recipe cards), `snippets/morghew-icon.liquid`, `sections/morghew-text-accordion.liquid`,
the `product-form` custom element pattern from the potato page.

---

## Section layout (`product-estate`)

Assembled top-to-bottom; each block renders only when it has content:

1. **Hero** — image gallery (main + thumbnails, mirror `pp-gallery`), title, price, short
   intro (`custom.subtitle`), **buy box**, delivery note.
2. **Long description** — product body / rich-text metafield.
3. **Key facts strip** — from `custom.product_attributes` (list), the same "good to know"
   chip pattern as the potato page, plus any type-specific fields present (below).
4. **Featured recipes** (optional) — recipe cards, primarily for game.
5. **Related products** (optional) — unified cards.
6. Customizer-appended sections (e.g. text+accordion for provenance/care) sit below.

---

## Buy box — option-driven variant picker

The potato buy box lists `product.variants` directly (one axis only). The estate buy box
instead renders **one labelled row of tiles per `product.options_with_values`**:

- Each option (e.g. "Load size", "Log size") → a row of tiles for its values.
- Selecting a value in every option row resolves to the matching variant via the product's
  variant JSON (client-side). Update the displayed price and the hidden `id` input.
- **Single-option products** render one row — visually identical to the potato weight tiles.
- **The firewood logs product** renders two rows — same component, no special-casing.
- Unavailable / sold-out combinations are disabled (greyed, not selectable).
- Add-to-cart posts to `/cart/add.js` and opens the mini-cart drawer (same as potatoes).

This is the core new component. It supersedes the potato flat-variant tiles for this template.

---

## Featured recipes module

Optional, per product (game especially). Source: a product metafield `custom.recipes` — a
list of references to recipe blog articles. Renders recipe cards linking through to the recipe
blog, reusing the recipe card styling already built for the recipe blog / potato page. Hidden
when the metafield is empty.

---

## Metafields

**Shared core (all estate products):**
- `custom.subtitle` — short hero intro line
- `custom.product_attributes` (list) — key-facts chips
- `custom.recipes` (list, if recipes module = option A) — featured recipe articles

**Type-specific, shown only when present:**
- Honey — `custom.floral_source`, `custom.harvest`
- Game — `custom.cut`
- Firewood — `custom.wood_type`

Rendered inside the key-facts area as a small spec list; absent fields simply don't render.
(Product data population is a merchant/user task, not part of the build.)

---

## Out of scope (separate follow-ons)

- **Collection pages** for meat and firewood (browse/filter by cut or wood type) — the unified
  card already covers the grid, so this is a light follow-on, specced separately.
- **Data entry** — populating each product's metafields.
- Potato template is untouched.

---

## Resolved decisions

1. **Recipes source — per-product metafield** (`custom.recipes`, a list of recipe blog
   articles). No section-block variant.
2. **Gallery — reuse the potato `pp-gallery` component** (main image + thumbnails) for
   consistency; no new gallery code.
3. **Potato seeds is in range** — treat it as another estate-produce type on this template.

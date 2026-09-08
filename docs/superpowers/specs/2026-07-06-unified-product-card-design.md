# Unified product card — design

**Date:** 2026-07-06
**Status:** Approved, ready for implementation planning

## Goal

Replace the ~5 divergent product-card designs across the theme with a single,
consistent card component, and add quick-add-to-cart (per variant) to it.
Products have at most 2 variants (e.g. 1kg / 5kg).

## Problem today

Separate, inconsistent card markup + CSS in each location:

| Placement | Section/file | Current card class |
|-----------|--------------|--------------------|
| Homepage "Meet the potatoes" | `sections/variety-rail.liquid` | `vcard` |
| Product "Pairs well with" | `sections/product-potato.liquid` | `pp-rel-card` |
| Potato Shop collection grid | `sections/collection-potato-shop.liquid` | `pshop-card` |
| Cart "Add to your crate" | `sections/cart-crate.liquid` | `crate-card` |
| Recipe "Made with" | `sections/recipe-article.liquid` | `recipe__variety` |

None has add-to-cart. They differ in data shown, layout, and styling.

## The component

One snippet: **`snippets/card-potato.liquid`**.

- **Input:** `product` (required). Optional `card_bg` hint if a placement needs a
  different surface, but default should work on any section background.
- **Output:** the unified card markup below.
- Every placement renders `{% render 'card-potato', product: <product> %}` inside
  its own heading/grid wrapper. Only the card is shared; section layout stays local.

## Card content (all auto-derived — no new per-card data entry)

1. **Image** — `product.featured_image`, wrapped in `<a href="{{ product.url }}">`.
   Links to the product page.
2. **Flesh dot + label** — from `custom.flesh_colour` (list-or-single, type-aware,
   same logic as the product page). Reuse the existing `.pp-badge-dot--{colour}`
   swatch colours (white/cream/yellow/red/blue). Omit if not set.
3. **Name** — `product.title`, also linked to the product.
4. **Subtitle** — `"{N} options from {lowest variant price | money}"` where N =
   `product.variants.size`. Product-agnostic; needs no cook/metafield data.
   - Single-variant products: subtitle is just the price (`{{ price | money }}`),
     no "options" wording.
5. **Quick-add buttons** — one per variant, label `"{variant.title} · {variant.price | money}"`.

## Quick-add behaviour

- Each button adds **that specific variant** via `POST /cart/add.js`
  (`{ id: variant_id, quantity: 1 }`), then **opens the mini-cart drawer** by
  calling the existing Dawn `cart-drawer` (`getSectionsToRender()` +
  `renderContents()`), exactly like the recipe "Add all" and product-form flows.
- On failure (e.g. sold out mid-flight) show the existing cart error toast pattern
  or fall back to `window.location = routes.cart_url`.
- Buttons are `<button type="button">`, **not** links — the image + name are the
  only navigation, so there is no nested-interactive-element problem.
- A small shared JS handler in `assets/morghew-card.js` binds `[data-card-add]`
  buttons using a **single document-level delegated listener** (idempotent guard
  so it binds once), so it also works for cards injected by a section re-render.

## Variant edge cases

- **2 variants** → two "size · price" buttons side by side (primary design).
- **1 variant** (default only) → single full-width `Add · {price}` button;
  subtitle shows just the price.
- **Sold-out variant** → its button reads "Sold out" and is disabled
  (`aria-disabled`), consistent with the storefront (respect
  `variant.available`; if "continue selling" is on, it stays purchasable).
- **No variants purchasable / product unavailable** → no add buttons, card still
  links to the product.

## Styling

- One CSS block in a dedicated `assets/morghew-card.css`, namespaced `.mcard*`,
  loaded by the snippet via `stylesheet_tag` (and `morghew-card.js` via a script
  tag). Duplicate references across multiple cards on a page are deduped by the
  browser, so no once-guard is needed.
- Clay CTA buttons (`var(--cta)` / `var(--cta-dark)` hover), matching the
  established add-to-cart / checkout treatment.
- Flesh dot reuses the existing swatch colours.
- Card: paper surface, `--line` border, `--radius`/12px corners; sits on whatever
  background the host section provides (paper, hessian, dark, etc.), so text/border
  tokens must read on both light and dark section backgrounds.

## Placements to migrate

Swap each location's bespoke card for `{% render 'card-potato' %}`, keeping the
section's own heading + grid:

1. `sections/variety-rail.liquid` — homepage rail
2. `sections/product-potato.liquid` — "Pairs well with" block
3. `sections/collection-potato-shop.liquid` — shop grid (main shop page — same card)
4. `sections/cart-crate.liquid` — "Add to your crate" recommendations
5. `sections/recipe-article.liquid` — "Made with" (single featured product)

Remove the now-dead per-card CSS from each (or leave until verified, then clean up).

## Non-goals / out of scope

- No change to section headings, grids, carousels, or which products each section
  selects — only the card itself is unified.
- No quantity stepper on the card (add = qty 1; users adjust in the drawer/cart).
- No wishlist, compare, or hover-zoom.
- Not touching the flesh-colour or variety-type metafield work (already done).

## Success criteria

- One snippet renders in all 5 placements; visually identical card everywhere.
- Clicking a size button adds that variant and opens the drawer.
- Single-variant and sold-out cases handled gracefully.
- Old per-card CSS/markup removed.

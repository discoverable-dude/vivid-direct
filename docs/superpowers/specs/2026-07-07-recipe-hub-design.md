# Recipe Hub — Design Spec

**Date:** 2026-07-07
**Status:** Approved (design), pending spec review

**Goal:** Replace Dawn's default blog grid for the `recipes` blog with a bespoke, on-brand
recipe hub matching the provided mockup: a hero, a featured recipe, search + method/difficulty
filters, a recipe-card grid, an "Our chefs" section, and a "Submit a recipe" CTA.

**Architecture:** A new `recipe-hub` section rendered by a new `templates/blog.recipe.json`
(so `/blogs/recipes` uses the hub while any other blog keeps `main-blog`). Data comes from the
`recipes` blog's articles + their `custom` metafields + the Chef metaobject. Filtering and search
are client-side JS over the rendered cards (same pattern as the Potato Shop flesh filter). Styling
in a new `assets/morghew-recipe-hub.css`; behaviour in an inline `<script>` scoped by `section.id`.

**Tech stack:** Shopify OS 2.0, Liquid, JSON template, vanilla JS, existing morghew tokens + icons.
No unit-test harness — verify with `shopify theme check`, `curl` against `http://127.0.0.1:9292`,
CSS brace balance, and the deploy/verify-sync scripts.

---

## Data model

**Recipe = a `blog.recipes` article.** Existing `custom` metafields (already in use by the recipe
article template): `recipe_eyebrow`, `recipe_summary`, `recipe_serves`, `recipe_prep_time`,
`recipe_cook_time`, `recipe_method` (steps), `recipe_chefs_tip`, `recipe_shop_items`,
`recipe_pantry`, `recipe_featured_product`, `recipe_chef` (Chef metaobject). Plus
`descriptors.subtitle`.

**New metafields to add (merchant task, not build):**
- `custom.recipe_difficulty` — single-line text: `Easy` | `Medium` | `Advanced`.
- `custom.recipe_methods` — **list**, single-line text: any of `Roast, Boil, Mash, Chip, Steam,
  Dauphinoise, Fry` (drives the method filter + the card's method tags).

**Chef metaobject** (`type: chef`): `name`, `role`, `portrait` (image), `bio`, `instagram` (url),
`website` (url). All chefs available via `shop.metaobjects.chef.values`.

**Card time:** display total = `recipe_prep_time` + `recipe_cook_time` when both are numeric
minutes; if those fields are stored as free text, fall back to showing `recipe_cook_time`. (Confirm
field types during the plan; add a `recipe_total_time` text field only if needed.)

**Featured recipe:** the first article tagged `featured` (case-insensitive); if none, the most
recent article. (Section-setting article pickers don't exist in Shopify, so a tag is the control.)

---

## Sections (top-to-bottom, one `recipe-hub` section)

1. **Hero** — eyebrow, title, subtitle, background image. All section settings (defaults:
   "From the estate kitchen" / "Recipes" / the intro line). Overlay opacity setting, like the
   recipe article hero.
2. **Featured recipe** — a wide card: image left, body right (chef byline "by {chef.name}",
   title, subtitle, method tags, "Read recipe →"), with a time/serves/difficulty strip on the
   image and a "Featured recipe" badge. Links to the article.
3. **Filter bar** — a search input (matches title + subtitle) and two filter groups:
   **Method** (All + the seven method values) and **Difficulty** (All + Easy/Medium/Advanced),
   rendered as pill toggles. Client-side; combines with search (AND across groups, OR within).
4. **Result count** — "{n} recipes" (updates live as filters apply).
5. **Recipe grid** — cards for every recipe article, each: image, a time/serves overlay,
   difficulty dot + label, method tags, title, subtitle, "by {chef.name}". Each card carries
   `data-methods`, `data-difficulty`, and `data-title` for the JS filter. Cards hidden via a
   class the filter toggles (not the `[hidden]` attribute, per the featured-card lesson).
6. **Our chefs** — eyebrow, heading, intro (section settings), then a card per Chef metaobject:
   portrait, name, role, "{n} recipes" (count of recipe articles whose `recipe_chef` is this
   chef), and an Instagram link. Iterates `shop.metaobjects.chef.values`.
7. **Submit a recipe CTA** — eyebrow, heading, text, button label + URL, background image
   (section settings). Full-width band.

---

## Behaviour (inline JS)

- Method/Difficulty pills: clicking sets the active value for that group; "All" clears it.
  A card shows only if (search empty OR title/subtitle contains query) AND (method All OR the
  card's `data-methods` contains the selected method) AND (difficulty All OR matches).
- Search input filters on `input`.
- The result count reflects visible cards.
- No `[hidden]` attribute for hiding (some card roots set `display`); toggle an `.is-hidden`
  class with `display: none !important`.

---

## Files

- **Create** `sections/recipe-hub.liquid` — the whole hub (markup + inline JS + schema).
- **Create** `templates/blog.recipe.json` — renders `recipe-hub` for the recipes blog.
- **Create** `assets/morghew-recipe-hub.css` — hub styles.
- **Reuse** `snippets/morghew-icon.liquid`, existing tokens, the recipe-card visual language
  from `sections/recipe-feature.liquid` where it fits.
- The recipes blog must be assigned the `recipe` template suffix (merchant: Blog → recipes →
  template `blog.recipe`), or `templates/blog.recipe.json` won't be used.

---

## Out of scope (follow-ons)

- A working submit form (the CTA links to an existing page/form; building the form is separate).
- Pagination — the grid renders all recipe articles; the blog is small. Add pagination only if
  the recipe count grows large.
- Populating the new metafields (`recipe_difficulty`, `recipe_methods`) on each recipe.

---

## Resolved decisions

1. **Scope** — the full hub (all seven components above).
2. **Filter data** — new metafields `custom.recipe_difficulty` + `custom.recipe_methods`.

## Open (confirm during plan)

1. Whether `recipe_prep_time` / `recipe_cook_time` are numeric (sum for total time) or text
   (show cook time, or add `recipe_total_time`).
2. Featured-recipe control: a `featured` article tag (proposed) vs the most-recent fallback only.

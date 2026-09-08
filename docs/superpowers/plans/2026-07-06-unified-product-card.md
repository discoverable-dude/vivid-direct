# Unified Product Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 5 divergent product-card designs with one shared `card-potato` snippet that includes per-variant quick-add-to-cart opening the mini-cart drawer.

**Architecture:** One snippet (`snippets/card-potato.liquid`) renders the card from a `product`; one CSS file (`assets/morghew-card.css`) and one delegated JS handler (`assets/morghew-card.js`) support it. Each of the 5 sections swaps its bespoke card markup for `{% render 'card-potato', product: … %}`, keeping its own heading/grid.

**Tech Stack:** Shopify Liquid (Dawn-based theme), vanilla JS, Dawn `cart-drawer` (already enabled). No unit-test runtime — verification is `curl` against the running dev server (`http://127.0.0.1:9292`) plus `shopify theme check`.

**Verification conventions:**
- Dev server hot-reloads; no deploy needed during implementation.
- To render a card with a real product, curl a page the card appears on.
- Add-to-cart is JS/drawer-driven; verify the button + `data-card-add` render via curl, and confirm the add+drawer flow in the browser (state the manual check).
- Commit after each task. Do NOT run `./bin/deploy.sh` until the final task.

---

## File Structure

- Create `snippets/card-potato.liquid` — the card (markup + per-product logic). Single responsibility: render one product as a card.
- Create `assets/morghew-card.css` — `.mcard*` styles only.
- Create `assets/morghew-card.js` — one document-level delegated click handler for `[data-card-add]`.
- Modify `sections/product-potato.liquid` — "Pairs well with" uses the snippet.
- Modify `sections/variety-rail.liquid` — homepage rail uses the snippet.
- Modify `sections/collection-potato-shop.liquid` — shop grid uses the snippet.
- Modify `sections/cart-crate.liquid` — "Add to your crate" recs use the snippet.
- Modify `sections/recipe-article.liquid` — "Made with" uses the snippet.

---

## Task 1: Card snippet

**Files:**
- Create: `snippets/card-potato.liquid`

- [ ] **Step 1: Create the snippet with full markup + logic**

```liquid
{%- comment -%}
  Unified product card. Usage: {% render 'card-potato', product: product %}
  Content is auto-derived — no per-card data entry.
{%- endcomment -%}
{{ 'morghew-card.css' | asset_url | stylesheet_tag }}
<script src="{{ 'morghew-card.js' | asset_url }}" defer="defer"></script>

{%- liquid
  assign _fc = product.metafields.custom.flesh_colour
  assign _flesh = _fc.value
  if _fc.type contains 'list'
    assign _flesh = _fc.value | first
  endif
  assign _flesh_key = _flesh | downcase
  assign _vcount = product.variants.size
  assign _min = product.price_min | default: product.price
-%}

<div class="mcard">
  <a href="{{ product.url }}" class="mcard__media" aria-label="{{ product.title | escape }}">
    {%- if product.featured_image -%}
      <img
        src="{{ product.featured_image | image_url: width: 600 }}"
        alt="{{ product.featured_image.alt | default: product.title | escape }}"
        width="300" height="300" loading="lazy">
    {%- endif -%}
    {%- if _flesh != blank -%}
      <span class="mcard__flesh">
        <span class="mcard__dot mcard__dot--{{ _flesh_key }}"></span>{{ _flesh | capitalize }} flesh
      </span>
    {%- endif -%}
  </a>

  <div class="mcard__body">
    <a href="{{ product.url }}" class="mcard__name">{{ product.title }}</a>
    <p class="mcard__sub">
      {%- if _vcount > 1 -%}{{ _vcount }} options from {{ _min | money }}{%- else -%}{{ _min | money }}{%- endif -%}
    </p>

    <div class="mcard__add{% if _vcount > 1 %} mcard__add--multi{% endif %}">
      {%- for v in product.variants -%}
        {%- if v.available -%}
          <button type="button" class="mcard__btn" data-card-add="{{ v.id }}" aria-label="Add {{ product.title | escape }} {{ v.title | escape }} to cart">
            <span class="mcard__btn-label">
              {%- if _vcount > 1 -%}{{ v.title }} &middot; {{ v.price | money }}{%- else -%}Add &middot; {{ v.price | money }}{%- endif -%}
            </span>
            {%- render 'loading-spinner' -%}
          </button>
        {%- else -%}
          <button type="button" class="mcard__btn mcard__btn--sold" disabled>{% if _vcount > 1 %}{{ v.title }} &middot; {% endif %}Sold out</button>
        {%- endif -%}
      {%- endfor -%}
    </div>
  </div>
</div>
```

- [ ] **Step 2: Verify the snippet has no Liquid errors via theme-check**

Run: `shopify theme check --path . 2>&1 | grep -c "card-potato.liquid"`
Expected: `0` (no offenses in the new file). If non-zero, print the offense and fix (likely ImgWidthAndHeight — the img already has width/height, so should be clean).

- [ ] **Step 3: Commit**

```bash
git add snippets/card-potato.liquid
git commit -m "Add unified card-potato snippet"
```

---

## Task 2: Card CSS

**Files:**
- Create: `assets/morghew-card.css`

- [ ] **Step 1: Create the stylesheet**

```css
/* ================================================
   UNIFIED PRODUCT CARD (.mcard) — used site-wide
   ================================================ */
.mcard {
  display: flex;
  flex-direction: column;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
}
.mcard__media {
  position: relative;
  display: block;
  aspect-ratio: 1 / 1;
  background: var(--paper-2);
}
.mcard__media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.mcard__flesh {
  position: absolute;
  left: 10px;
  bottom: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 7px;
  background: var(--paper);
  border-radius: 20px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  color: var(--ink);
}
.mcard__dot { width: 10px; height: 10px; border-radius: 50%; flex: 0 0 auto; }
.mcard__dot--white  { background: #f5f0e8; border: 1px solid #c8bfaf; }
.mcard__dot--cream  { background: #f2e6c2; }
.mcard__dot--yellow { background: #e8c84a; }
.mcard__dot--red    { background: #c0392b; }
.mcard__dot--blue   { background: #7b4fa6; }

.mcard__body { display: flex; flex-direction: column; padding: 12px 14px 14px; }
.mcard__name {
  font-family: var(--font-head);
  font-weight: 700;
  font-size: 17px;
  line-height: 1.15;
  color: var(--ink);
  text-decoration: none;
}
.mcard__name:hover { text-decoration: underline; }
.mcard__sub { font-family: var(--font-body); font-size: 12px; color: var(--ink-soft); margin: 3px 0 12px; }

.mcard__add { display: flex; gap: 8px; margin-top: auto; }
.mcard__btn {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  padding: 10px 6px;
  background: var(--cta);
  color: var(--paper);
  border: none;
  border-radius: var(--radius);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.18s;
}
.mcard__btn:hover:not([disabled]) { background: var(--cta-dark); }
.mcard__btn--sold { background: transparent; color: var(--ink-soft); border: 1px solid var(--line); cursor: default; }
.mcard__btn .loading__spinner { display: none; }
.mcard__btn.is-loading .mcard__btn-label { visibility: hidden; }
.mcard__btn.is-loading .loading__spinner {
  display: flex; position: absolute; inset: 0; align-items: center; justify-content: center;
}
.mcard__btn .spinner { width: 16px; height: 16px; }
.mcard__btn .path { stroke: var(--paper); }
```

- [ ] **Step 2: Verify braces balance**

Run: `echo "open $(grep -o '{' assets/morghew-card.css | wc -l) close $(grep -o '}' assets/morghew-card.css | wc -l)"`
Expected: open and close counts equal.

- [ ] **Step 3: Commit**

```bash
git add assets/morghew-card.css
git commit -m "Add morghew-card.css for unified card"
```

---

## Task 3: Card JS (delegated quick-add)

**Files:**
- Create: `assets/morghew-card.js`

- [ ] **Step 1: Create the handler**

```javascript
(function () {
  if (window.__morghewCardBound) return;
  window.__morghewCardBound = true;

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-card-add]');
    if (!btn || btn.disabled || btn.classList.contains('is-loading')) return;
    e.preventDefault();

    var id = parseInt(btn.dataset.cardAdd, 10);
    if (!id) return;

    var drawer = document.querySelector('cart-drawer');
    var body = { items: [{ id: id, quantity: 1 }] };
    if (drawer && drawer.getSectionsToRender) {
      body.sections = drawer.getSectionsToRender().map(function (s) { return s.id; });
      body.sections_url = window.location.pathname;
    }

    btn.classList.add('is-loading');
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json(); })
      .then(function (state) {
        btn.classList.remove('is-loading');
        if (drawer && drawer.renderContents) {
          if (drawer.classList.contains('is-empty')) drawer.classList.remove('is-empty');
          drawer.renderContents(state);
        } else {
          window.location = '/cart';
        }
      })
      .catch(function () { btn.classList.remove('is-loading'); });
  });
})();
```

- [ ] **Step 2: Verify JS syntax**

Run: `node --check assets/morghew-card.js && echo OK`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add assets/morghew-card.js
git commit -m "Add morghew-card.js delegated quick-add handler"
```

---

## Task 4: Wire into "Pairs well with" (first placement — proves the flow)

**Files:**
- Modify: `sections/product-potato.liquid` (the `pp_related` loop that renders `pp-rel-card`)

- [ ] **Step 1: Replace the card markup with the snippet**

Find the loop that renders each related product (the `<a href="{{ rp.url }}" class="pp-rel-card">…</a>` block inside the `pp_related` / "Pairs well with" section, around the `pp-related__heading`). Replace the entire per-item `<a class="pp-rel-card">…</a>` block with:

```liquid
{%- render 'card-potato', product: rp -%}
```

Keep the surrounding section wrapper, heading (`Pairs well with`), and grid container.

- [ ] **Step 2: Verify the card renders on a product page**

Run:
```bash
curl -s "http://127.0.0.1:9292/products/heide-red" | grep -c 'class="mcard"'
```
Expected: ≥1 (one per related block). If 0, confirm the related block has products configured; test on a product that has "Pairs well with" blocks set.

- [ ] **Step 3: Verify add buttons + data attribute render**

Run:
```bash
curl -s "http://127.0.0.1:9292/products/heide-red" | grep -oE 'data-card-add="[0-9]+"' | head -2
```
Expected: one or two `data-card-add="<variantId>"` attributes per card.

- [ ] **Step 4: Manual browser check (state result)**

In the browser at a product page with related products: click a size button → the mini-cart drawer opens with that variant added. Confirm before continuing.

- [ ] **Step 5: theme-check clean**

Run: `shopify theme check --path . 2>&1 | grep -c "product-potato.liquid"`
Expected: 0 (or only the pre-existing gallery ImgWidthAndHeight offense at the gallery `<img>`, unrelated to this change).

- [ ] **Step 6: Commit**

```bash
git add sections/product-potato.liquid
git commit -m "Use card-potato in 'Pairs well with'"
```

---

## Task 5: Wire into homepage rail

**Files:**
- Modify: `sections/variety-rail.liquid` (the `vcard` block)

- [ ] **Step 1: Replace the card markup**

Replace the entire `<div class="vcard" …>…</div>` product block (inside the products loop, the real one — not the placeholder fallback) with:

```liquid
{%- render 'card-potato', product: product -%}
```

Keep the rail/scroller wrapper and heading. If the loop wraps each item in a `role="listitem"` container, keep that container and put the render inside it.

- [ ] **Step 2: Verify on the homepage**

Run: `curl -s "http://127.0.0.1:9292/" | grep -c 'class="mcard"'`
Expected: ≥1.

- [ ] **Step 3: theme-check clean**

Run: `shopify theme check --path . 2>&1 | grep -c "variety-rail.liquid"`
Expected: 0.

- [ ] **Step 4: Commit**

```bash
git add sections/variety-rail.liquid
git commit -m "Use card-potato in homepage variety rail"
```

---

## Task 6: Wire into collection grid

**Files:**
- Modify: `sections/collection-potato-shop.liquid` (the `pshop-card` block)

- [ ] **Step 1: Replace the card markup**

Replace the entire `pshop-card` per-product block with:

```liquid
{%- render 'card-potato', product: product -%}
```

Keep the grid wrapper and any tag-filter tabs.

- [ ] **Step 2: Verify on the collection page**

Run: `curl -s "http://127.0.0.1:9292/collections/potato-shop" | grep -c 'class="mcard"'`
Expected: ≥1 (one per product in the collection).

- [ ] **Step 3: theme-check clean**

Run: `shopify theme check --path . 2>&1 | grep -c "collection-potato-shop.liquid"`
Expected: 0.

- [ ] **Step 4: Commit**

```bash
git add sections/collection-potato-shop.liquid
git commit -m "Use card-potato in Potato Shop grid"
```

---

## Task 7: Wire into cart recommendations

**Files:**
- Modify: `sections/cart-crate.liquid` (the `crate-card` recommendations block)

- [ ] **Step 1: Replace the card markup**

Replace the `crate-card` per-product block (in the "Add to your crate" recommendations loop) with:

```liquid
{%- render 'card-potato', product: _p -%}
```

(Use the loop variable actually in scope — the recommendations loop currently uses `_p`. Confirm the variable name in the surrounding loop and match it.) Keep the "Add to your crate" heading and grid.

- [ ] **Step 2: Verify on the cart page (with an item in cart)**

Run:
```bash
VID=$(curl -s "http://127.0.0.1:9292/products/heide-red.js" | python3 -c "import sys,json;print(json.load(sys.stdin)['variants'][0]['id'])")
curl -s -c /tmp/cc.txt -b /tmp/cc.txt -X POST "http://127.0.0.1:9292/cart/add.js" -H "Content-Type: application/json" -d "{\"id\":$VID,\"quantity\":1}" -o /dev/null
curl -s -b /tmp/cc.txt "http://127.0.0.1:9292/cart" | grep -c 'class="mcard"'
curl -s -b /tmp/cc.txt -X POST "http://127.0.0.1:9292/cart/clear.js" -o /dev/null
```
Expected: ≥1 (recommendations render as mcards).

- [ ] **Step 3: theme-check clean**

Run: `shopify theme check --path . 2>&1 | grep -c "cart-crate.liquid"`
Expected: 0.

- [ ] **Step 4: Commit**

```bash
git add sections/cart-crate.liquid
git commit -m "Use card-potato in cart recommendations"
```

---

## Task 8: Wire into recipe "Made with"

**Files:**
- Modify: `sections/recipe-article.liquid` (the `recipe__variety` featured-product card)

- [ ] **Step 1: Replace the card markup**

Replace the `<a href="{{ featured.url }}" class="recipe__variety">…</a>` block with:

```liquid
{%- render 'card-potato', product: featured -%}
```

Keep the "Made with" heading and the "Shop all varieties" link. Note: this placement shows ONE card; the `.mcard` will sit in the section's existing container — wrap it so it doesn't stretch full width (constrain to e.g. `max-width: 360px` via the section's existing wrapper or a small style).

- [ ] **Step 2: Verify on the recipe page**

Run: `curl -s "http://127.0.0.1:9292/blogs/recipes/patatas-bravas?view=recipe" | grep -c 'class="mcard"'`
Expected: 1.

- [ ] **Step 3: theme-check clean**

Run: `shopify theme check --path . 2>&1 | grep -c "recipe-article.liquid"`
Expected: 0.

- [ ] **Step 4: Commit**

```bash
git add sections/recipe-article.liquid
git commit -m "Use card-potato in recipe 'Made with'"
```

---

## Task 9: Remove dead per-card CSS + deploy

**Files:**
- Modify: `assets/morghew-sections.css` (remove `.vcard*`, `.pshop-card*`, `.pp-rel-card*`, `.crate-card*` rules)
- Modify: `assets/morghew-recipe.css` (remove `.recipe__variety*` rules)

- [ ] **Step 1: Confirm each old card class is no longer referenced in any liquid**

Run:
```bash
for c in vcard pshop-card pp-rel-card crate-card recipe__variety; do
  echo "$c: $(grep -rl "$c" sections/ snippets/ | grep -v node_modules | wc -l) files"
done
```
Expected: each should be 0 liquid files referencing it (only CSS remains). If a liquid still references one, it wasn't migrated — go back and fix.

- [ ] **Step 2: Remove the now-unused CSS rules**

Delete the rule blocks for `.vcard`, `.vcard__*`, `.pshop-card`, `.pshop-card__*`, `.pp-rel-card`, `.pp-rel-card__*`, `.crate-card`, `.crate-card__*` from `assets/morghew-sections.css`, and `.recipe__variety`, `.recipe__variety-*` from `assets/morghew-recipe.css`. Remove only those blocks; leave everything else.

- [ ] **Step 3: Verify braces still balance in both files**

Run:
```bash
for f in assets/morghew-sections.css assets/morghew-recipe.css; do
  echo "$f: open $(grep -o '{' $f | wc -l) close $(grep -o '}' $f | wc -l)"
done
```
Expected: open == close for each.

- [ ] **Step 4: Verify all placements still render the new card**

Run:
```bash
for u in "/" "/collections/potato-shop" "/products/heide-red"; do
  echo "$u: $(curl -s "http://127.0.0.1:9292$u" | grep -c 'class="mcard"') mcards"
done
```
Expected: each ≥1.

- [ ] **Step 5: Commit**

```bash
git add assets/morghew-sections.css assets/morghew-recipe.css
git commit -m "Remove dead per-card CSS after unifying on card-potato"
```

- [ ] **Step 6: Deploy to the live theme + verify sync**

Run:
```bash
./bin/deploy.sh --no-git && ./bin/verify-sync.sh
```
Expected: deploy success; "In sync — every code file on the theme matches local."

- [ ] **Step 7: Push git**

```bash
git pull --rebase origin dev && git push origin dev
```

---

## Notes for the implementer

- `product.price_min` gives the lowest variant price for the "from" figure; falls back to `product.price`.
- The `loading-spinner` snippet renders `<div class="loading__spinner hidden">…`; the card CSS shows it when the button has `.is-loading`.
- Drawer integration mirrors the existing recipe "Add all" handler — `getSectionsToRender()` + `renderContents(state)` on `<cart-drawer>`.
- Do NOT deploy between tasks — hot reload covers localhost verification. Deploy once at Task 9.
- If a section's product loop variable differs from the plan (e.g. `rp`, `_p`, `product`, `featured`), match the actual variable in that file.

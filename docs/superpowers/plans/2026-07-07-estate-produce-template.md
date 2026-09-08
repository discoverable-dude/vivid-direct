# Estate Produce Product Template — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one flexible `product.estate-produce` template + `product-estate` section for the estate's non-potato product types (flour, meat/game, oil, firewood, honey, potato seeds), with an option-driven buy box, key-facts strip, optional featured-recipes module, and related products — reusing the potato page's gallery, `product-form` AJAX drawer, and card components.

**Architecture:** A JSON template renders one generic `product-estate` section (main product content) and allows customizer-appended sections below. The buy box renders one row of tiles per Shopify option (`product.options_with_values`) and resolves the variant client-side from the selected values — handling both single-option products and the one two-option firewood product with the same component. Add-to-cart reuses Dawn's `<product-form>` custom element (AJAX + mini-cart drawer). Styling lives in a new `assets/morghew-estate.css`; behaviour is an inline `<script>` scoped by `{{ section.id }}`, mirroring `product-potato.liquid`.

**Tech Stack:** Shopify OS 2.0, Liquid, JSON templates, vanilla JS, existing morghew CSS token system. No unit-test harness — verification is `shopify theme check`, `curl` against the localhost dev server (`http://127.0.0.1:9292`), and `bin/deploy.sh` / `bin/verify-sync.sh`.

**Reference (read before starting):**
- `docs/superpowers/specs/2026-07-07-estate-produce-template-design.md` — the spec.
- `sections/product-potato.liquid` — gallery markup (126–160), buy box (200–260), inline JS (442–488), schema (491+). The estate section adapts these.
- `snippets/card-potato.liquid` — related/recipe card. `snippets/morghew-icon.liquid` — icons.
- CSS tokens in `assets/morghew.css` `:root` (`--page`, `--page-pad`, `--ink`, `--paper`, `--paper-2`, `--footer-bg`, `--cta`, `--line`, `--font-head`, `--font-body`, `--hessian-weave`).

**Conventions:**
- After each task: `shopify theme check` must report no NEW errors in the touched files; then commit. Do **not** run `bin/deploy.sh` between tasks — the user reviews on localhost (hot-reload) and batches deploys. Deploy only in the final task, on the user's go-ahead.
- CSS braces must balance (`grep -o '{' file | wc -l` == `grep -o '}'`).
- No em dashes rule is Remland-only; not applicable here.

---

## File Structure

- **Create** `templates/product.estate-produce.json` — assigns `product-estate` as the main section; allows appended sections.
- **Create** `sections/product-estate.liquid` — the generic estate product section (hero+gallery, buy box, description, key facts, recipes, related) + inline JS + schema.
- **Create** `assets/morghew-estate.css` — all estate-section styles.
- **Reuse unchanged** `snippets/card-potato.liquid`, `snippets/morghew-icon.liquid`, `snippets/cart-drawer.liquid`, `assets/product-form.js` (Dawn), `assets/morghew-drawer.css`.

Metafields the merchant creates later (not build tasks): `custom.subtitle`, `custom.attributes` (list.single_line_text), `custom.recipes` (list.metaobject/article reference), `custom.floral_source`, `custom.harvest`, `custom.cut`, `custom.wood_type`.

---

## Task 1: Section skeleton + template + CSS file wired up

**Files:**
- Create: `sections/product-estate.liquid`
- Create: `templates/product.estate-produce.json`
- Create: `assets/morghew-estate.css`

- [ ] **Step 1: Create the CSS file with a sentinel rule**

`assets/morghew-estate.css`:
```css
/* Estate produce product template */
.est { position: relative; }
.est__wrap { max-width: var(--page); margin: 0 auto; padding: clamp(28px, 4vw, 56px) var(--page-pad); }
```

- [ ] **Step 2: Create the section with schema + CSS load**

`sections/product-estate.liquid`:
```liquid
{%- comment -%}
  Estate produce product template — generic product page for non-potato estate
  products (flour, game, oil, firewood, honey, seeds). Buy box is option-driven.
{%- endcomment -%}
{{ 'morghew-estate.css' | asset_url | stylesheet_tag }}
<script src="{{ 'product-form.js' | asset_url }}" defer="defer"></script>

<div class="est color-{{ section.settings.color_scheme }}">
  <div class="est__wrap">
    <h1 class="est__title">{{ product.title }}</h1>
  </div>
</div>

{% schema %}
{
  "name": "Estate produce product",
  "tag": "section",
  "class": "section",
  "enabled_on": { "templates": ["product"] },
  "settings": [
    { "type": "color_scheme", "id": "color_scheme", "label": "Color scheme", "default": "scheme-1" }
  ],
  "presets": [{ "name": "Estate produce product" }]
}
{% endschema %}
```

- [ ] **Step 3: Create the JSON template**

`templates/product.estate-produce.json`:
```json
{
  "sections": {
    "main": { "type": "product-estate", "settings": {} }
  },
  "order": ["main"]
}
```

- [ ] **Step 4: Verify theme-check passes**

Run: `cd /Users/craiggilhooly/Desktop/morghew/morghew-dev && shopify theme check sections/product-estate.liquid`
Expected: no errors for the new files (offenses count 0, or only pre-existing unrelated).

- [ ] **Step 5: Assign the template to one product and verify it renders**

In Shopify admin (or via `shopify theme` metafield) set one test product (e.g. a flour product) to template `estate-produce`, then:
Run: `curl -s "http://127.0.0.1:9292/products/PRODUCT-HANDLE" | grep -c 'est__wrap'`
Expected: `1` (the section rendered). If `0`, the template isn't assigned — assign it in admin → product → Theme template → "estate-produce".

- [ ] **Step 6: Commit**
```bash
git add sections/product-estate.liquid templates/product.estate-produce.json assets/morghew-estate.css
git commit -m "Estate template: section + template skeleton"
```

---

## Task 2: Hero — gallery + info column

**Files:**
- Modify: `sections/product-estate.liquid`
- Modify: `assets/morghew-estate.css`

- [ ] **Step 1: Replace the `est__wrap` body with the hero grid**

Adapt the gallery from `sections/product-potato.liquid:129-160` (drop the potato flesh badge). Replace the `<div class="est__wrap">…</div>` inner from Task 1 with:
```liquid
    <div class="est__hero">
      <div class="est-gallery">
        <div class="est-gallery__main">
          <img id="est-main-{{ section.id }}"
               src="{{ product.featured_image | image_url: width: 1400 }}"
               alt="{{ product.featured_image.alt | default: product.title | escape }}"
               loading="eager"
               width="{{ product.featured_image.width }}"
               height="{{ product.featured_image.height }}">
        </div>
        {%- if product.images.size > 1 -%}
          <div class="est-gallery__thumbs">
            {%- for img in product.images limit: 5 -%}
              <button class="est-gallery__thumb{% if forloop.first %} is-active{% endif %}"
                      data-src="{{ img | image_url: width: 1400 }}"
                      data-alt="{{ img.alt | default: product.title | escape }}"
                      type="button" aria-label="Product image {{ forloop.index }}">
                <img src="{{ img | image_url: width: 280 }}" alt="{{ img.alt | default: product.title | escape }}" loading="lazy">
              </button>
            {%- endfor -%}
          </div>
        {%- endif -%}
      </div>

      <div class="est-info">
        <nav class="est-crumb" aria-label="Breadcrumb">
          <a href="{{ routes.root_url }}">Home</a>
          <span aria-hidden="true">&rsaquo;</span>
          {%- if product.collections.size > 0 -%}
            <a href="{{ product.collections.first.url }}">{{ product.collections.first.title }}</a>
            <span aria-hidden="true">&rsaquo;</span>
          {%- endif -%}
          <span>{{ product.title }}</span>
        </nav>
        <h1 class="est-title">{{ product.title }}</h1>
        {%- assign est_sub = product.metafields.custom.subtitle -%}
        {%- if est_sub != blank -%}<p class="est-sub">{{ est_sub }}</p>{%- endif -%}
        <div class="est-price" id="est-price-{{ section.id }}">
          {%- if product.price_varies -%}{{ product.price_min | money }} &ndash; {{ product.price_max | money }}{%- else -%}{{ product.price | money }}{%- endif -%}
        </div>
        {%- comment -%} BUY BOX inserted in Task 3 {%- endcomment -%}
        {%- if product.description != blank -%}<div class="est-desc">{{ product.description }}</div>{%- endif -%}
      </div>
    </div>
```
(Remove the standalone `est__title` line from Task 1.)

- [ ] **Step 2: Add the gallery JS (inline, before `{% schema %}`)**

Adapt `product-potato.liquid:442-454`. Add:
```liquid
<script>
(function () {
  var sid = '{{ section.id }}';
  var mainImg = document.getElementById('est-main-' + sid);
  document.querySelectorAll('#est-main-' + sid).length;
  document.querySelectorAll('.est-gallery__thumb').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.est-gallery__thumb').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      if (mainImg) { mainImg.src = btn.dataset.src; mainImg.alt = btn.dataset.alt || ''; }
    });
  });
}());
</script>
```

- [ ] **Step 3: Add hero + gallery CSS**

Append to `assets/morghew-estate.css` (mirror the potato hero grid; two columns, stack under 860px):
```css
.est__hero { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(28px, 4vw, 56px); align-items: start; }
.est-gallery__main { aspect-ratio: 1 / 1; border-radius: 14px; overflow: hidden; background: var(--paper-2); }
.est-gallery__main img { width: 100%; height: 100%; object-fit: cover; }
.est-gallery__thumbs { display: flex; gap: 10px; margin-top: 12px; }
.est-gallery__thumb { width: 68px; height: 68px; border-radius: 10px; overflow: hidden; border: 1.5px solid var(--line); background: none; cursor: pointer; padding: 0; }
.est-gallery__thumb.is-active { border-color: var(--ink); }
.est-gallery__thumb img { width: 100%; height: 100%; object-fit: cover; }
.est-crumb { font-family: var(--font-body); font-size: 13px; color: var(--ink-soft); display: flex; gap: 8px; margin-bottom: 14px; }
.est-crumb a { color: var(--ink-soft); text-decoration: none; }
.est-title { font-family: var(--font-head); font-weight: 800; font-size: clamp(28px, 4vw, 40px); color: var(--ink); margin: 0 0 8px; }
.est-sub { font-family: var(--font-body); font-size: 16px; color: var(--ink-soft); margin: 0 0 14px; }
.est-price { font-family: var(--font-head); font-weight: 700; font-size: 22px; color: var(--ink); margin: 0 0 22px; }
.est-desc { font-family: var(--font-body); font-size: 15px; line-height: 1.7; color: var(--ink); margin-top: 22px; }
.est-desc p { margin: 0 0 14px; }
@media (max-width: 860px) { .est__hero { grid-template-columns: 1fr; gap: 32px; } }
```

- [ ] **Step 4: Verify**

Run: `shopify theme check sections/product-estate.liquid` → no new errors.
Run: `curl -s "http://127.0.0.1:9292/products/PRODUCT-HANDLE" | grep -c 'est-gallery__main'` → `1`.
Run: `echo "braces: $(grep -o '{' assets/morghew-estate.css | wc -l) / $(grep -o '}' assets/morghew-estate.css | wc -l)"` → equal.

- [ ] **Step 5: Commit**
```bash
git add sections/product-estate.liquid assets/morghew-estate.css
git commit -m "Estate template: hero gallery + info column"
```

---

## Task 3: Option-driven buy box (the core component)

**Files:**
- Modify: `sections/product-estate.liquid`
- Modify: `assets/morghew-estate.css`

- [ ] **Step 1: Insert the buy-box markup where the Task-2 comment placeholder is**

Replace `{%- comment -%} BUY BOX inserted in Task 3 {%- endcomment -%}` with:
```liquid
        <product-form class="product-form est-form" data-hide-errors="false" data-section-id="{{ section.id }}">
          <div class="product-form__error-message-wrapper est-atc-error" role="alert" hidden>
            <span class="product-form__error-message"></span>
          </div>
          <form action="{{ routes.cart_add_url }}" method="post" id="est-form-{{ section.id }}">
            <input type="hidden" name="id" id="est-vid-{{ section.id }}" value="{{ product.selected_or_first_available_variant.id }}">

            {%- unless product.has_only_default_variant -%}
              {%- for option in product.options_with_values -%}
                <div class="est-opt" data-opt-index="{{ forloop.index0 }}">
                  <span class="est-opt__label">{{ option.name }}</span>
                  <div class="est-opt__tiles">
                    {%- for value in option.values -%}
                      <button type="button" class="est-opt__tile{% if option.selected_value == value %} is-active{% endif %}"
                              data-opt="{{ option.position | minus: 1 }}" data-value="{{ value | escape }}">{{ value }}</button>
                    {%- endfor -%}
                  </div>
                </div>
              {%- endfor -%}
            {%- endunless -%}

            <div class="est-atc-row">
              <div class="est-qty" aria-label="Quantity">
                <button type="button" class="est-qty__btn est-qty__btn--minus" aria-label="Decrease">&minus;</button>
                <input class="est-qty__n" type="number" name="quantity" id="est-qty-{{ section.id }}" value="1" min="1" inputmode="numeric">
                <button type="button" class="est-qty__btn est-qty__btn--plus" aria-label="Increase">+</button>
              </div>
              <button type="submit" name="add" class="est-atc" id="est-atc-{{ section.id }}">
                Add to Crate &middot; <span class="est-atc__price">{{ product.selected_or_first_available_variant.price | money }}</span>
              </button>
            </div>
            {%- if section.settings.delivery_note != blank -%}
              <p class="est-delivery">{%- render 'morghew-icon', icon: 'truck', size: 16 -%}{{ section.settings.delivery_note }}</p>
            {%- endif -%}
          </form>
        </product-form>
```

- [ ] **Step 2: Add the variants JSON + `delivery_note` setting**

Directly after the `<product-form>` closing tag, embed the variant data:
```liquid
        <script type="application/json" id="est-variants-{{ section.id }}">
          {{ product.variants | json }}
        </script>
```
And add to the section `settings` array in the schema:
```json
    { "type": "text", "id": "delivery_note", "label": "Delivery note", "default": "Free UK delivery over £40 · packed and shipped in 1 working day" }
```

- [ ] **Step 3: Add the option-resolution JS inside the existing inline `<script>` IIFE (after the gallery block)**

```liquid
  /* ── Option-driven variant picker ── */
  var variants = JSON.parse((document.getElementById('est-variants-' + sid) || {}).textContent || '[]');
  var vidInput = document.getElementById('est-vid-' + sid);
  var atcBtn   = document.getElementById('est-atc-' + sid);
  var priceEl  = atcBtn ? atcBtn.querySelector('.est-atc__price') : null;
  var optGroups = Array.prototype.slice.call(document.querySelectorAll('#est-form-' + sid + ' .est-opt'));
  var selected = optGroups.map(function (g) {
    var active = g.querySelector('.est-opt__tile.is-active') || g.querySelector('.est-opt__tile');
    return active ? active.dataset.value : null;
  });

  function money(cents) {
    return '£' + (cents / 100).toFixed(2).replace(/\.00$/, '');
  }
  function matchVariant() {
    return variants.find(function (v) {
      return selected.every(function (val, i) { return v['option' + (i + 1)] === val; });
    });
  }
  function refresh() {
    var v = matchVariant();
    if (v) {
      if (vidInput) vidInput.value = v.id;
      if (priceEl) priceEl.textContent = money(v.price);
      if (atcBtn) { atcBtn.disabled = !v.available; atcBtn.querySelector('.est-atc__price') && (atcBtn.firstChild.nodeValue = v.available ? 'Add to Crate · ' : 'Sold out'); }
    } else if (atcBtn) {
      atcBtn.disabled = true;
    }
  }
  optGroups.forEach(function (g) {
    g.querySelectorAll('.est-opt__tile').forEach(function (tile) {
      tile.addEventListener('click', function () {
        var idx = parseInt(tile.dataset.opt, 10);
        g.querySelectorAll('.est-opt__tile').forEach(function (t) { t.classList.remove('is-active'); });
        tile.classList.add('is-active');
        selected[idx] = tile.dataset.value;
        refresh();
      });
    });
  });
  refresh();

  /* ── Quantity stepper ── */
  var qtyInput = document.getElementById('est-qty-' + sid);
  if (qtyInput) {
    document.querySelectorAll('#est-form-' + sid + ' .est-qty__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var q = parseInt(qtyInput.value, 10) || 1;
        qtyInput.value = btn.classList.contains('est-qty__btn--minus') ? Math.max(1, q - 1) : q + 1;
      });
    });
    qtyInput.addEventListener('change', function () { qtyInput.value = Math.max(1, parseInt(qtyInput.value, 10) || 1); });
  }
```
Note: the ATC label toggle uses `atcBtn.firstChild.nodeValue` because the button text node precedes the `<span class="est-atc__price">`. Keep the markup's text (`Add to Crate · `) as the first child so this works.

- [ ] **Step 4: Add buy-box CSS**

Append to `assets/morghew-estate.css` (mirror `.pp-vtile`/`.pp-qty`/`.pp-atc` from `morghew-sections.css:1184-1305`, renamed; include the mobile stack + `flex:0 0 auto` fix learned on the potato page):
```css
.est-opt { margin-bottom: 18px; }
.est-opt__label { display: block; font-family: var(--font-body); font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--hessian); margin-bottom: 8px; }
.est-opt__tiles { display: flex; flex-wrap: wrap; gap: 10px; }
.est-opt__tile { font-family: var(--font-body); font-size: 15px; font-weight: 700; color: var(--ink); background: var(--paper); border: 1.5px solid var(--line); border-radius: var(--radius); padding: 11px 18px; min-height: 44px; cursor: pointer; transition: border-color 0.18s, background 0.18s, color 0.18s; }
.est-opt__tile:hover { border-color: var(--ink); }
.est-opt__tile.is-active { border-color: var(--footer-bg); background: var(--footer-bg); color: var(--paper); }
.est-atc-row { display: flex; gap: 12px; align-items: stretch; margin: 8px 0 18px; }
.est-qty { display: flex; align-items: center; border: 1.5px solid var(--line); border-radius: var(--radius); overflow: hidden; flex: 0 0 auto; }
.est-qty__btn { width: 42px; height: 52px; border: none; background: transparent; font-size: 20px; cursor: pointer; color: var(--ink); display: flex; align-items: center; justify-content: center; }
.est-qty__btn:hover { background: var(--paper-2); }
.est-qty__n { width: 48px; height: 52px; text-align: center; border: none; border-left: 1.5px solid var(--line); border-right: 1.5px solid var(--line); background: transparent; font-size: 15px; font-weight: 600; color: var(--ink); -moz-appearance: textfield; appearance: textfield; }
.est-qty__n::-webkit-inner-spin-button, .est-qty__n::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.est-atc { flex: 1; min-width: 0; background: var(--cta); color: #fff; border: none; border-radius: var(--radius); font-family: var(--font-body); font-size: 15px; font-weight: 700; letter-spacing: 0.03em; cursor: pointer; padding: 0 20px; height: 52px; display: flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; transition: background 0.2s; }
.est-atc:hover:not(:disabled) { background: var(--cta-dark); }
.est-atc:disabled { background: var(--ink-soft); cursor: not-allowed; }
.est-delivery { display: flex; align-items: center; gap: 8px; font-family: var(--font-body); font-size: 13px; color: var(--ink-soft); }
@media (max-width: 560px) {
  .est-atc-row { flex-direction: column; align-items: flex-start; }
  .est-qty { align-self: flex-start; }
  .est-atc { width: 100%; flex: 0 0 auto; }
}
```

- [ ] **Step 5: Verify**

Run: `shopify theme check sections/product-estate.liquid` → no new errors.
Run: `curl -s "http://127.0.0.1:9292/products/FIREWOOD-LOGS-HANDLE" | grep -oE 'est-opt__label' | wc -l` → `2` (two option rows on the two-option firewood product).
Run: `curl -s "http://127.0.0.1:9292/products/FLOUR-HANDLE" | grep -oE 'est-opt__label' | wc -l` → `1` (single-option product).
Manual (user, on localhost): pick option values → price + Add button update; add to cart → mini-cart drawer opens with the correct variant. Confirm sold-out combos disable the button.
Run: braces balance check on the CSS.

- [ ] **Step 6: Commit**
```bash
git add sections/product-estate.liquid assets/morghew-estate.css
git commit -m "Estate template: option-driven buy box + AJAX add-to-cart"
```

---

## Task 4: Key-facts strip + type-specific fields

**Files:**
- Modify: `sections/product-estate.liquid`
- Modify: `assets/morghew-estate.css`

- [ ] **Step 1: Add the key-facts block after the hero `</div>` (the `.est__hero` closing), inside `.est__wrap`**

```liquid
      {%- liquid
        assign attrs = product.metafields.custom.attributes
        assign has_attrs = false
        if attrs != blank
          assign has_attrs = true
        endif
        assign floral = product.metafields.custom.floral_source
        assign harvest = product.metafields.custom.harvest
        assign cut = product.metafields.custom.cut
        assign wood = product.metafields.custom.wood_type
      -%}
      {%- if has_attrs or floral != blank or harvest != blank or cut != blank or wood != blank -%}
        <div class="est-facts">
          <p class="est-facts__eyebrow">Good to know</p>
          {%- if has_attrs -%}
            <ul class="est-facts__chips">
              {%- if attrs.type contains 'list' -%}
                {%- for a in attrs.value -%}<li class="est-facts__chip">{{ a }}</li>{%- endfor -%}
              {%- else -%}
                <li class="est-facts__chip">{{ attrs.value }}</li>
              {%- endif -%}
            </ul>
          {%- endif -%}
          {%- if floral != blank or harvest != blank or cut != blank or wood != blank -%}
            <dl class="est-facts__spec">
              {%- if cut != blank -%}<dt>Cut</dt><dd>{{ cut.value | default: cut }}</dd>{%- endif -%}
              {%- if wood != blank -%}<dt>Wood</dt><dd>{{ wood.value | default: wood }}</dd>{%- endif -%}
              {%- if floral != blank -%}<dt>Floral source</dt><dd>{{ floral.value | default: floral }}</dd>{%- endif -%}
              {%- if harvest != blank -%}<dt>Harvest</dt><dd>{{ harvest.value | default: harvest }}</dd>{%- endif -%}
            </dl>
          {%- endif -%}
        </div>
      {%- endif -%}
```
Note: the list-vs-single guard (`attrs.type contains 'list'` before iterating) is the same pattern used in `snippets/card-flesh.liquid` — outputting `.value` on a single text field and iterating would otherwise error.

- [ ] **Step 2: Add key-facts CSS**
```css
.est-facts { margin-top: clamp(36px, 5vw, 64px); padding-top: 32px; border-top: 1px solid var(--line); }
.est-facts__eyebrow { font-family: var(--font-body); font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--hessian); margin: 0 0 16px; }
.est-facts__chips { list-style: none; display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 20px; padding: 0; }
.est-facts__chip { font-family: var(--font-body); font-size: 14px; font-weight: 600; color: var(--ink); background: var(--paper-2); border-radius: 100px; padding: 8px 16px; }
.est-facts__spec { display: grid; grid-template-columns: max-content 1fr; gap: 6px 20px; margin: 0; font-family: var(--font-body); font-size: 14px; }
.est-facts__spec dt { color: var(--ink-soft); }
.est-facts__spec dd { color: var(--ink); margin: 0; }
```

- [ ] **Step 3: Verify + commit**

Run: `shopify theme check sections/product-estate.liquid` → no new errors. Braces balance.
Run: `curl -s "http://127.0.0.1:9292/products/PRODUCT-WITH-ATTRS" | grep -c 'est-facts__chip'` → ≥1 once a product has `custom.attributes`.
```bash
git add sections/product-estate.liquid assets/morghew-estate.css
git commit -m "Estate template: key-facts strip + type-specific fields"
```

---

## Task 5: Featured recipes module (custom.recipes)

**Files:**
- Modify: `sections/product-estate.liquid`
- Modify: `assets/morghew-estate.css`

- [ ] **Step 1: Add the recipes block after the key-facts block**

`custom.recipes` is a list of article references. Render a heading + a grid of recipe cards linking to each article.
```liquid
      {%- assign est_recipes = product.metafields.custom.recipes -%}
      {%- if est_recipes != blank and est_recipes.value.size > 0 -%}
        <div class="est-recipes">
          <h2 class="est-recipes__head">Cook it up</h2>
          <div class="est-recipes__grid">
            {%- for art in est_recipes.value -%}
              <a class="est-recipe-card" href="{{ art.url }}">
                {%- if art.image != blank -%}
                  <span class="est-recipe-card__img"><img src="{{ art.image | image_url: width: 600 }}" alt="{{ art.title | escape }}" loading="lazy" width="600" height="400"></span>
                {%- endif -%}
                <span class="est-recipe-card__body">
                  <span class="est-recipe-card__title">{{ art.title }}</span>
                  <span class="est-recipe-card__link">Read the recipe &rarr;</span>
                </span>
              </a>
            {%- endfor -%}
          </div>
        </div>
      {%- endif -%}
```
Note: `est_recipes.value` is a list of `article` objects (metafield type `list.article_reference`); `art.url`, `art.title`, `art.image` are article properties. If the merchant configures it as `list.metaobject_reference` instead, the field accessors differ — confirm the metafield type is **article reference** when creating it.

- [ ] **Step 2: Add recipes CSS**
```css
.est-recipes { margin-top: clamp(40px, 5vw, 72px); }
.est-recipes__head { font-family: var(--font-head); font-weight: 800; font-size: clamp(24px, 3vw, 32px); color: var(--ink); margin: 0 0 24px; }
.est-recipes__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.est-recipe-card { display: flex; flex-direction: column; text-decoration: none; background: var(--paper); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; transition: transform 0.18s ease, box-shadow 0.18s ease; }
.est-recipe-card:hover { transform: translateY(-4px); box-shadow: 0 14px 30px rgba(40, 26, 18, 0.14); }
.est-recipe-card__img { display: block; aspect-ratio: 3 / 2; overflow: hidden; }
.est-recipe-card__img img { width: 100%; height: 100%; object-fit: cover; }
.est-recipe-card__body { padding: 16px 18px; }
.est-recipe-card__title { display: block; font-family: var(--font-head); font-weight: 700; font-size: 17px; color: var(--ink); margin-bottom: 6px; }
.est-recipe-card__link { font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--cta); }
@media (max-width: 860px) { .est-recipes__grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .est-recipes__grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 3: Verify + commit**

Run: `shopify theme check sections/product-estate.liquid` → no new errors. Braces balance.
Run: `curl -s "http://127.0.0.1:9292/products/GAME-PRODUCT" | grep -c 'est-recipe-card'` → matches the number of linked recipes once `custom.recipes` is populated (0 when empty, and the block is absent).
```bash
git add sections/product-estate.liquid assets/morghew-estate.css
git commit -m "Estate template: featured recipes module"
```

---

## Task 6: Related products

**Files:**
- Modify: `sections/product-estate.liquid`
- Modify: `assets/morghew-estate.css`

- [ ] **Step 1: Add related-products block after the recipes block, using the unified card**

Use Shopify `recommendations` (same-collection fallback). Render `card-potato` for each.
```liquid
      {%- assign rel = product.collections.first -%}
      {%- if rel != blank and rel.products.size > 1 -%}
        <div class="est-related">
          <h2 class="est-related__head">More from the {{ rel.title | downcase }}</h2>
          <div class="est-related__grid">
            {%- assign shown = 0 -%}
            {%- for rp in rel.products limit: 8 -%}
              {%- if rp.id != product.id and shown < 4 -%}
                {%- render 'card-potato', product: rp -%}
                {%- assign shown = shown | plus: 1 -%}
              {%- endif -%}
            {%- endfor -%}
          </div>
        </div>
      {%- endif -%}
```

- [ ] **Step 2: Add related CSS**
```css
.est-related { margin-top: clamp(40px, 5vw, 72px); }
.est-related__head { font-family: var(--font-head); font-weight: 800; font-size: clamp(24px, 3vw, 32px); color: var(--ink); margin: 0 0 24px; }
.est-related__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; align-items: stretch; }
@media (max-width: 860px) { .est-related__grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .est-related__grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 3: Verify + commit**

Run: `shopify theme check sections/product-estate.liquid` → no new errors. Braces balance.
Run: `curl -s "http://127.0.0.1:9292/products/PRODUCT-HANDLE" | grep -c 'mcard'` → ≥1 (cards rendered) when the collection has other products.
```bash
git add sections/product-estate.liquid assets/morghew-estate.css
git commit -m "Estate template: related products grid"
```

---

## Task 7: Full-page verification + deploy

**Files:** none (verification + release)

- [ ] **Step 1: Theme-check the whole template surface**

Run: `shopify theme check sections/product-estate.liquid templates/product.estate-produce.json`
Expected: 0 errors.

- [ ] **Step 2: Smoke-test each product type on localhost (user-assisted)**

Assign the `estate-produce` template to at least one product per type (flour, game, oil, firewood — including the two-option logs product — honey, seeds). For each:
Run: `curl -s "http://127.0.0.1:9292/products/HANDLE" | grep -c 'est__wrap'` → `1`, and eyeball on localhost that gallery, buy box, facts, recipes (game), and related render correctly.

- [ ] **Step 3: Deploy (only on the user's go-ahead) + verify sync**
```bash
./bin/deploy.sh --no-git
git stash >/dev/null 2>&1; git pull --no-rebase --no-edit origin dev 2>&1 | tail -1; git stash pop >/dev/null 2>&1
git add sections/product-estate.liquid templates/product.estate-produce.json assets/morghew-estate.css
git commit -m "Estate produce product template"
git push origin dev
./bin/verify-sync.sh
```
Expected: `✓ In sync — every code file on the theme matches local.`

---

## Self-Review

**Spec coverage:**
- One flexible template → Tasks 1 (skeleton) + 7 (multi-type verify). ✓
- Hero + gallery (reuse potato gallery) → Task 2. ✓
- Option-driven buy box (single + two-option) → Task 3. ✓
- Key-facts strip (`custom.attributes`) + type-specific fields → Task 4. ✓
- Featured recipes (`custom.recipes` metafield) → Task 5. ✓
- Related products → Task 6. ✓
- AJAX add-to-cart via `<product-form>` + drawer → Task 3 (reuses `product-form.js`). ✓
- Reuse card-potato, morghew-icon → Tasks 5/6. ✓
- Out of scope (collection pages, data entry) → not tasked, correctly. ✓

**Placeholder scan:** `PRODUCT-HANDLE` / `FIREWOOD-LOGS-HANDLE` etc. are deliberate stand-ins for real product handles the implementer substitutes at verify time (the products exist in the store); every code step contains complete code. No TODO/TBD in code.

**Type/name consistency:** IDs and classes are consistent across tasks — `est-vid-{id}`, `est-atc-{id}`, `.est-atc__price`, `.est-opt__tile[data-opt]`, `#est-variants-{id}`, `selected[]` indexed by option position. The ATC label-toggle relies on the text node `Add to Crate · ` being the button's first child (noted in Task 3 Step 3). The variants JSON uses Shopify's `option1/2/3` keys, matched against tile `data-value` in `matchVariant()`.

**Known follow-ups (not blocking):** the `money()` JS helper assumes GBP and no thousands separator (fine for these price points); if prices exceed £999 it should use the shop money format — revisit only if needed.

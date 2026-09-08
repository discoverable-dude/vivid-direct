# Recipe Hub — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build a bespoke `recipe-hub` section (on a new `blog.recipe` template) for the `recipes`
blog: hero, featured recipe, search + method/difficulty filters, article-driven recipe grid,
"Our chefs", and a "Submit a recipe" CTA — matching the approved mockup.

**Architecture:** One `sections/recipe-hub.liquid` (markup + inline JS + schema) rendered by
`templates/blog.recipe.json`. Cards are built from `blog.articles` (the recipes blog) + their
`custom` metafields + the Chef metaobject. Filtering/search is client-side over the rendered
cards. Styles in `assets/morghew-recipe-hub.css`; JS inline, scoped by `section.id`.

**Tech stack:** Shopify OS 2.0, Liquid, JSON template, vanilla JS, morghew tokens + `morghew-icon`.
Verify with `shopify theme check`, `curl http://127.0.0.1:9292/blogs/recipes`, CSS brace balance.

**Reference — read before starting:**
- `docs/superpowers/specs/2026-07-07-recipe-hub-design.md` — the spec.
- `sections/recipe-article.liquid` — the recipe metafield model (lines 10-21) + Chef metaobject
  field access (`chef.name.value`, `.role.value`, `.portrait.value`, `.instagram.value`).
- `sections/recipe-feature.liquid` — the `.recipe-card` visual language (photo + time overlay + cap).
- `sections/collection-potato-shop.liquid` — the client-side filter JS pattern (`data-*` on cards,
  toggle visibility, live count). Copy that structure.
- Tokens in `assets/morghew.css` `:root`: `--page`, `--page-pad`, `--ink`, `--ink-soft`, `--paper`,
  `--paper-2`, `--footer-bg`, `--cta`, `--cta-dark`, `--straw-light`, `--hessian`, `--line`,
  `--radius`, `--radius-lg`, `--shadow-card`, `--hessian-weave`, `--font-head`, `--font-body`.

**Data model (recipes = `blog.recipes` articles):** `custom` metafields `recipe_serves`,
`recipe_cook_time` (free text, e.g. "45 mins"), `recipe_chef` (Chef metaobject), `descriptors.subtitle`,
plus the NEW `custom.recipe_difficulty` (text) and `custom.recipe_methods` (list, text). Article
image = `article.image`, title = `article.title`, url = `article.url`.

**Conventions:** After each task run `shopify theme check sections/recipe-hub.liquid`; keep CSS
braces balanced and Liquid tags balanced. **Do NOT run `bin/deploy.sh` between tasks.** Deploy only
in the final task on the user's go-ahead. All CSS goes in `assets/morghew-recipe-hub.css`. Match the
theme's existing look — reuse tokens, never hardcode colours.

---

## Which blog + how to iterate recipes

The recipes live in the blog with handle `recipes`. In the hub, get them via
`{%- assign recipes_blog = blogs.recipes -%}` then `recipes_blog.articles`. (The section renders on
`templates/blog.recipe.json`, whose `blog` object is the current blog, but reference `blogs.recipes`
explicitly so the hub is correct regardless of which blog the template is on.)

---

## File Structure

- **Create** `sections/recipe-hub.liquid` — the whole hub + inline JS + schema.
- **Create** `templates/blog.recipe.json` — `{ "sections": { "main": { "type": "recipe-hub" } }, "order": ["main"] }`.
- **Create** `assets/morghew-recipe-hub.css` — all hub styles.

---

## Task 1: Skeleton — section + template + CSS, renders on the recipes blog

**Files:** Create `sections/recipe-hub.liquid`, `templates/blog.recipe.json`, `assets/morghew-recipe-hub.css`

- [ ] **Step 1: CSS sentinel** — `assets/morghew-recipe-hub.css`:
```css
/* Recipe hub */
.rhub { background: var(--hessian-weave), var(--paper); }
.rhub__wrap { max-width: var(--page); margin: 0 auto; padding: 0 var(--page-pad); }
```

- [ ] **Step 2: Section shell** — `sections/recipe-hub.liquid`:
```liquid
{%- comment -%} Recipe hub — bespoke listing for the recipes blog. {%- endcomment -%}
{{ 'morghew-recipe-hub.css' | asset_url | stylesheet_tag }}
{%- assign recipes_blog = blogs.recipes -%}

<div class="rhub">
  <div class="rhub__wrap">
    <h1>Recipes</h1>
    <p>{{ recipes_blog.articles.size }} recipes</p>
  </div>
</div>

{% schema %}
{
  "name": "Recipe hub",
  "tag": "section",
  "class": "section",
  "settings": [],
  "presets": [{ "name": "Recipe hub" }]
}
{% endschema %}
```

- [ ] **Step 3: Template** — `templates/blog.recipe.json`:
```json
{
  "sections": { "main": { "type": "recipe-hub", "settings": {} } },
  "order": ["main"]
}
```

- [ ] **Step 4: Verify** — `shopify theme check sections/recipe-hub.liquid` → no errors.
  Merchant must set the recipes blog template to `blog.recipe` (Blog → recipes → template) for it to
  render. Then `curl -s "http://127.0.0.1:9292/blogs/recipes" | grep -c 'rhub__wrap'` → `1`. If `0`,
  the blog isn't assigned the template yet — note it, don't fail.

- [ ] **Step 5: Commit** — `git add sections/recipe-hub.liquid templates/blog.recipe.json assets/morghew-recipe-hub.css && git commit -m "Recipe hub: skeleton section + template"`

---

## Task 2: Hero

**Files:** Modify `sections/recipe-hub.liquid`, `assets/morghew-recipe-hub.css`

**Design:** full-width band, background image with a dark overlay, centred white text — a small
uppercase straw eyebrow, a large Baloo-2 title, a two-line cream subtitle. ~clamp(220px,30vw,300px) tall.

- [ ] **Step 1: Markup** — replace the `.rhub__wrap` placeholder body's `<h1>`/`<p>` with a hero
  above `.rhub__wrap` (hero is full-width, its own inner uses `.rhub__wrap`):
```liquid
<section class="rhub-hero">
  {%- if section.settings.hero_image != blank -%}
    <img class="rhub-hero__bg" src="{{ section.settings.hero_image | image_url: width: 2400 }}" alt="" aria-hidden="true" width="{{ section.settings.hero_image.width }}" height="{{ section.settings.hero_image.height }}" loading="eager">
  {%- endif -%}
  <div class="rhub-hero__overlay" style="background: rgba(20,16,12,{{ section.settings.hero_overlay | divided_by: 100.0 }});"></div>
  <div class="rhub-hero__inner rhub__wrap">
    {%- if section.settings.hero_eyebrow != blank -%}<p class="rhub-hero__eyebrow">{{ section.settings.hero_eyebrow }}</p>{%- endif -%}
    <h1 class="rhub-hero__title">{{ section.settings.hero_title | default: 'Recipes' }}</h1>
    {%- if section.settings.hero_sub != blank -%}<p class="rhub-hero__sub">{{ section.settings.hero_sub }}</p>{%- endif -%}
  </div>
</section>
```

- [ ] **Step 2: Schema settings** — add to the section `settings` array:
```json
{ "type": "header", "content": "Hero" },
{ "type": "image_picker", "id": "hero_image", "label": "Hero background image" },
{ "type": "range", "id": "hero_overlay", "label": "Overlay opacity", "min": 0, "max": 90, "step": 5, "unit": "%", "default": 45 },
{ "type": "text", "id": "hero_eyebrow", "label": "Eyebrow", "default": "From the estate kitchen" },
{ "type": "text", "id": "hero_title", "label": "Title", "default": "Recipes" },
{ "type": "textarea", "id": "hero_sub", "label": "Subtitle", "default": "Heritage varieties deserve good cooking. Here's how we use them." }
```

- [ ] **Step 3: CSS** — append:
```css
.rhub-hero { position: relative; overflow: hidden; }
.rhub-hero__bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.rhub-hero__overlay { position: absolute; inset: 0; }
.rhub-hero__inner { position: relative; text-align: center; padding-top: clamp(48px, 8vw, 96px); padding-bottom: clamp(48px, 8vw, 96px); }
.rhub-hero__eyebrow { font-family: var(--font-body); font-size: 12px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--straw-light); margin: 0 0 14px; }
.rhub-hero__title { font-family: var(--font-head); font-weight: 800; font-size: clamp(40px, 6vw, 72px); line-height: 1; color: var(--paper); margin: 0; }
.rhub-hero__sub { font-family: var(--font-body); font-size: 16px; line-height: 1.6; color: rgba(246,240,234,0.85); max-width: 460px; margin: 16px auto 0; }
```

- [ ] **Step 4: Verify** — theme-check clean; CSS braces balanced. Commit:
  `git add sections/recipe-hub.liquid assets/morghew-recipe-hub.css && git commit -m "Recipe hub: hero"`

---

## Task 3: Featured recipe

**Files:** Modify `sections/recipe-hub.liquid`, `assets/morghew-recipe-hub.css`

**Design:** below the hero, on the paper texture, a white rounded card with `--shadow-card`,
two columns: LEFT a large recipe image (a clay "Featured recipe" badge top-left; a small pill strip
bottom-left with time · serves · difficulty). RIGHT a white panel: italic chef byline "by {name}",
large Baloo-2 title, italic subtitle, method-tag pills, and a clay "Read recipe →" link. Stacks on mobile.

- [ ] **Step 1: Pick the featured article** — after `assign recipes_blog`, add:
```liquid
{%- liquid
  assign feat = blank
  for a in recipes_blog.articles
    if a.tags contains 'featured' or a.tags contains 'Featured'
      assign feat = a
      break
    endif
  endfor
  if feat == blank and recipes_blog.articles.size > 0
    assign feat = recipes_blog.articles.first
  endif
-%}
```

- [ ] **Step 2: Featured markup** — inside `.rhub__wrap`, first child:
```liquid
{%- if feat != blank -%}
  {%- assign feat_chef = feat.metafields.custom.recipe_chef.value -%}
  <a class="rhub-feat" href="{{ feat.url }}">
    <div class="rhub-feat__media">
      {%- if feat.image -%}<img src="{{ feat.image | image_url: width: 1000 }}" alt="{{ feat.image.alt | default: feat.title | escape }}" loading="lazy" width="1000" height="750">{%- endif -%}
      <span class="rhub-feat__badge">Featured recipe</span>
      <span class="rhub-feat__strip">
        {%- if feat.metafields.custom.recipe_cook_time != blank -%}<span>{%- render 'morghew-icon', icon: 'clock' -%}{{ feat.metafields.custom.recipe_cook_time.value }}</span>{%- endif -%}
        {%- if feat.metafields.custom.recipe_serves != blank -%}<span>Serves {{ feat.metafields.custom.recipe_serves.value }}</span>{%- endif -%}
        {%- if feat.metafields.custom.recipe_difficulty != blank -%}<span>{{ feat.metafields.custom.recipe_difficulty.value }}</span>{%- endif -%}
      </span>
    </div>
    <div class="rhub-feat__body">
      {%- if feat_chef -%}<p class="rhub-feat__by">by {{ feat_chef.name.value }}</p>{%- endif -%}
      <h2 class="rhub-feat__title">{{ feat.title }}</h2>
      {%- assign feat_sub = feat.metafields.descriptors.subtitle.value -%}
      {%- if feat_sub != blank -%}<p class="rhub-feat__sub">{{ feat_sub }}</p>{%- endif -%}
      {%- assign feat_methods = feat.metafields.custom.recipe_methods -%}
      {%- if feat_methods != blank -%}<div class="rhub-feat__tags">{%- for m in feat_methods.value -%}<span class="rhub-tag">{{ m }}</span>{%- endfor -%}</div>{%- endif -%}
      <span class="rhub-feat__cta">Read recipe <span aria-hidden="true">&rarr;</span></span>
    </div>
  </a>
{%- endif -%}
```

- [ ] **Step 3: CSS** — append (white card, 2-col, tokens; `.rhub-tag` is the shared method pill):
```css
.rhub-feat { display: grid; grid-template-columns: 1fr 1fr; margin: clamp(-40px, -4vw, -56px) 0 0; position: relative; z-index: 2; background: #fff; border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); overflow: hidden; text-decoration: none; }
.rhub-feat__media { position: relative; min-height: 300px; }
.rhub-feat__media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.rhub-feat__badge { position: absolute; top: 16px; left: 16px; font-family: var(--font-body); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; background: var(--cta); color: var(--paper); padding: 6px 12px; border-radius: 4px; }
.rhub-feat__strip { position: absolute; left: 16px; bottom: 16px; display: flex; gap: 8px; flex-wrap: wrap; }
.rhub-feat__strip span { display: inline-flex; align-items: center; gap: 5px; font-family: var(--font-body); font-size: 12px; font-weight: 600; color: var(--ink); background: rgba(246,240,234,0.92); padding: 5px 10px; border-radius: 100px; }
.rhub-feat__strip svg { width: 13px; height: 13px; }
.rhub-feat__body { padding: clamp(24px, 3vw, 44px); display: flex; flex-direction: column; justify-content: center; }
.rhub-feat__by { font-family: var(--font-body); font-style: italic; font-size: 14px; color: var(--ink-soft); margin: 0 0 10px; }
.rhub-feat__title { font-family: var(--font-head); font-weight: 800; font-size: clamp(26px, 3vw, 38px); line-height: 1.05; color: var(--ink); margin: 0 0 8px; }
.rhub-feat__sub { font-family: var(--font-body); font-style: italic; font-size: 15px; color: var(--ink-soft); margin: 0 0 18px; }
.rhub-feat__tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 20px; }
.rhub-tag { font-family: var(--font-body); font-size: 12px; font-weight: 600; color: var(--ink); background: var(--paper-2); border-radius: 100px; padding: 6px 14px; }
.rhub-feat__cta { font-family: var(--font-body); font-size: 14px; font-weight: 700; color: var(--cta); }
.rhub-feat:hover .rhub-feat__cta { text-decoration: underline; text-underline-offset: 3px; }
@media (max-width: 860px) { .rhub-feat { grid-template-columns: 1fr; } .rhub-feat__media { min-height: 240px; } }
```

- [ ] **Step 4: Verify + commit** — theme-check, braces; `curl … | grep -c rhub-feat` → `1` (once template assigned + a recipe exists). Commit `"Recipe hub: featured recipe"`.

---

## Task 4: Filter bar + result count

**Files:** Modify `sections/recipe-hub.liquid`, `assets/morghew-recipe-hub.css`

**Design:** a full-width cream (`--paper-2`) band under the featured card. A rounded search input
with a magnifier icon on the left, then a "Method" label + pill toggles (All + the 7 methods), then a
"Difficulty" label + pills (All + Easy/Medium/Advanced). Active pill = ink-filled. Below the band (back
on paper), a small "{n} recipes" count.

- [ ] **Step 1: Markup** — after the featured block:
```liquid
{%- assign method_list = 'Roast,Boil,Mash,Chip,Steam,Dauphinoise,Fry' | split: ',' -%}
{%- assign diff_list = 'Easy,Medium,Advanced' | split: ',' -%}
<div class="rhub-filters" id="rhub-filters-{{ section.id }}">
  <div class="rhub__wrap rhub-filters__inner">
    <div class="rhub-search">
      {%- render 'morghew-icon', icon: 'search' -%}
      <input type="search" class="rhub-search__input" id="rhub-q-{{ section.id }}" placeholder="Search by name or variety…" aria-label="Search recipes">
    </div>
    <div class="rhub-filtergroup" data-group="method">
      <span class="rhub-filtergroup__label">Method</span>
      <button type="button" class="rhub-pill is-active" data-filter="method" data-value="all">All</button>
      {%- for m in method_list -%}<button type="button" class="rhub-pill" data-filter="method" data-value="{{ m | downcase }}">{{ m }}</button>{%- endfor -%}
    </div>
    <div class="rhub-filtergroup" data-group="difficulty">
      <span class="rhub-filtergroup__label">Difficulty</span>
      <button type="button" class="rhub-pill is-active" data-filter="difficulty" data-value="all">All</button>
      {%- for d in diff_list -%}<button type="button" class="rhub-pill" data-filter="difficulty" data-value="{{ d | downcase }}">{{ d }}</button>{%- endfor -%}
    </div>
  </div>
</div>
<div class="rhub__wrap"><p class="rhub-count"><span id="rhub-count-{{ section.id }}">{{ recipes_blog.articles.size }}</span> recipes</p></div>
```

- [ ] **Step 2: CSS** — append (search input + pills; active pill ink-filled). Use `--radius` on the
  input, 100px radius on pills, `--paper` fill on inactive pills with `--line` border, `--ink` fill +
  `--paper` text on `.is-active`. Full-width band via the two-level pattern (outer `.rhub-filters`
  bg `--paper-2`, inner `.rhub__wrap`). Search input `height: 44px`. (Match the Potato Shop
  `.pshop-tabs`/`.pshop-flesh__opt` look.)

- [ ] **Step 3: Verify + commit** — theme-check, braces; `curl … | grep -oE 'rhub-pill' | wc -l` →
  `12` (All+7 method, All+3 difficulty = 12). Commit `"Recipe hub: filter bar + count"`.

---

## Task 5: Recipe grid (article-driven) + filter JS

**Files:** Modify `sections/recipe-hub.liquid`, `assets/morghew-recipe-hub.css`

**Design:** 3-col grid of white cards (`--radius-lg`, subtle border). Each card: image top with a
`time · Serves n` overlay bottom-left; body: a row of `• {difficulty}` (dot + label) left and method
tag pills right; title (Baloo 2); italic subtitle; small italic "by {chef}". Card is a link.

- [ ] **Step 1: Grid markup** — after the count:
```liquid
<div class="rhub__wrap">
  <div class="rhub-grid" id="rhub-grid-{{ section.id }}">
    {%- for a in recipes_blog.articles -%}
      {%- assign a_chef = a.metafields.custom.recipe_chef.value -%}
      {%- assign a_diff = a.metafields.custom.recipe_difficulty.value -%}
      {%- assign a_methods = a.metafields.custom.recipe_methods -%}
      {%- capture a_method_data -%}{%- if a_methods != blank -%}{%- for m in a_methods.value -%}{{ m | downcase }}{%- unless forloop.last -%},{%- endunless -%}{%- endfor -%}{%- endif -%}{%- endcapture -%}
      <a class="rhub-card" href="{{ a.url }}"
         data-title="{{ a.title | downcase | escape }} {{ a.metafields.descriptors.subtitle.value | downcase | escape }}"
         data-methods="{{ a_method_data }}"
         data-difficulty="{{ a_diff | downcase }}">
        <div class="rhub-card__media">
          {%- if a.image -%}<img src="{{ a.image | image_url: width: 600 }}" alt="{{ a.image.alt | default: a.title | escape }}" loading="lazy" width="600" height="450">{%- endif -%}
          <span class="rhub-card__overlay">
            {%- if a.metafields.custom.recipe_cook_time != blank -%}<span>{%- render 'morghew-icon', icon: 'clock' -%}{{ a.metafields.custom.recipe_cook_time.value }}</span>{%- endif -%}
            {%- if a.metafields.custom.recipe_serves != blank -%}<span>Serves {{ a.metafields.custom.recipe_serves.value }}</span>{%- endif -%}
          </span>
        </div>
        <div class="rhub-card__body">
          <div class="rhub-card__meta">
            {%- if a_diff != blank -%}<span class="rhub-card__diff"><span class="rhub-card__dot"></span>{{ a_diff }}</span>{%- endif -%}
            {%- if a_methods != blank -%}<span class="rhub-card__tags">{%- for m in a_methods.value -%}<span class="rhub-tag rhub-tag--sm">{{ m }}</span>{%- endfor -%}</span>{%- endif -%}
          </div>
          <h3 class="rhub-card__title">{{ a.title }}</h3>
          {%- assign a_sub = a.metafields.descriptors.subtitle.value -%}
          {%- if a_sub != blank -%}<p class="rhub-card__sub">{{ a_sub }}</p>{%- endif -%}
          {%- if a_chef -%}<p class="rhub-card__by">by {{ a_chef.name.value }}</p>{%- endif -%}
        </div>
      </a>
    {%- endfor -%}
    <p class="rhub-empty" id="rhub-empty-{{ section.id }}" hidden>No recipes match those filters.</p>
  </div>
</div>
```

- [ ] **Step 2: Filter JS** — add an inline `<script>` before `{% schema %}` (adapt the Potato Shop
  filter; combine search + method + difficulty; toggle `.is-hidden`; update the count):
```liquid
<script>
(function () {
  var sid = '{{ section.id }}';
  var q = document.getElementById('rhub-q-' + sid);
  var grid = document.getElementById('rhub-grid-' + sid);
  var countEl = document.getElementById('rhub-count-' + sid);
  var emptyEl = document.getElementById('rhub-empty-' + sid);
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.rhub-card'));
  var state = { q: '', method: 'all', difficulty: 'all' };
  var pills = document.querySelectorAll('#rhub-filters-' + sid + ' .rhub-pill');
  pills.forEach(function (p) {
    p.addEventListener('click', function () {
      var group = p.dataset.filter;
      document.querySelectorAll('#rhub-filters-' + sid + ' .rhub-pill[data-filter="' + group + '"]').forEach(function (b) { b.classList.remove('is-active'); });
      p.classList.add('is-active');
      state[group] = p.dataset.value;
      apply();
    });
  });
  if (q) q.addEventListener('input', function () { state.q = q.value.trim().toLowerCase(); apply(); });
  function apply() {
    var visible = 0;
    cards.forEach(function (card) {
      var okQ = !state.q || (card.dataset.title || '').indexOf(state.q) !== -1;
      var okM = state.method === 'all' || (',' + (card.dataset.methods || '') + ',').indexOf(',' + state.method + ',') !== -1;
      var okD = state.difficulty === 'all' || (card.dataset.difficulty || '') === state.difficulty;
      var show = okQ && okM && okD;
      card.classList.toggle('is-hidden', !show);
      if (show) visible++;
    });
    if (countEl) countEl.textContent = visible;
    if (emptyEl) emptyEl.hidden = visible !== 0;
  }
}());
</script>
```

- [ ] **Step 3: CSS** — append: `.rhub-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 22px; }`
  ; `.rhub-card.is-hidden { display: none !important; }` ; card = white, `--radius-lg`, border, hover lift
  (`translateY(-4px)` + `--shadow-card`); `.rhub-card__media` aspect 4/3 with the overlay pill row;
  `.rhub-card__diff .rhub-card__dot` a small `--footer-bg` circle; `.rhub-tag--sm` smaller pill; title
  Baloo 2 ~20px; `.rhub-card__sub` italic `--ink-soft`; `.rhub-card__by` 12px italic `--ink-soft`.
  Responsive: 2-col ≤860px, 1-col ≤560px.

- [ ] **Step 4: Verify + commit** — theme-check; braces; JS parses (extract + `node --check`);
  `curl … | grep -oE 'rhub-card"' | wc -l` equals the recipe count. Manually confirm on localhost:
  typing in search + clicking method/difficulty pills filters the grid and updates the count.
  Commit `"Recipe hub: article-driven grid + filters"`.

---

## Task 6: Our chefs

**Files:** Modify `sections/recipe-hub.liquid`, `assets/morghew-recipe-hub.css`

**Design:** a `--paper-2`/hessian band. LEFT: eyebrow "Our chefs", Baloo-2 heading, intro text
(section settings). RIGHT: a card per Chef metaobject — portrait (circle), name, role, "{n} recipes"
(count of recipe articles whose `recipe_chef` is this chef), Instagram link.

- [ ] **Step 1: Markup** — after the grid `.rhub__wrap`:
```liquid
{%- assign all_chefs = shop.metaobjects.chef.values -%}
{%- if all_chefs.size > 0 -%}
  <section class="rhub-chefs">
    <div class="rhub__wrap rhub-chefs__grid">
      <div class="rhub-chefs__head">
        {%- if section.settings.chefs_eyebrow != blank -%}<p class="rhub-chefs__eyebrow">{{ section.settings.chefs_eyebrow }}</p>{%- endif -%}
        {%- if section.settings.chefs_heading != blank -%}<h2 class="rhub-chefs__heading">{{ section.settings.chefs_heading }}</h2>{%- endif -%}
        {%- if section.settings.chefs_intro != blank -%}<div class="rhub-chefs__intro">{{ section.settings.chefs_intro }}</div>{%- endif -%}
      </div>
      <div class="rhub-chefs__list">
        {%- for c in all_chefs -%}
          {%- assign n = 0 -%}
          {%- for a in recipes_blog.articles -%}
            {%- if a.metafields.custom.recipe_chef.value == c -%}{%- assign n = n | plus: 1 -%}{%- endif -%}
          {%- endfor -%}
          <div class="rhub-chef">
            {%- if c.portrait.value -%}<span class="rhub-chef__portrait"><img src="{{ c.portrait.value | image_url: width: 160 }}" alt="{{ c.name.value | escape }}" loading="lazy" width="80" height="80"></span>{%- endif -%}
            <div class="rhub-chef__body">
              <p class="rhub-chef__name">{{ c.name.value }}</p>
              {%- if c.role.value != blank -%}<p class="rhub-chef__role">{{ c.role.value }}</p>{%- endif -%}
              <p class="rhub-chef__count">{{ n }} recipe{% if n != 1 %}s{% endif %}</p>
            </div>
            {%- if c.instagram.value != blank -%}<a class="rhub-chef__ig" href="{{ c.instagram.value }}" target="_blank" rel="noopener" aria-label="{{ c.name.value | escape }} on Instagram">{%- render 'morghew-icon', icon: 'arrow' -%}</a>{%- endif -%}
          </div>
        {%- endfor -%}
      </div>
    </div>
  </section>
{%- endif -%}
```

- [ ] **Step 2: Schema settings** — add: header "Our chefs"; `chefs_eyebrow` (default "Our chefs"),
  `chefs_heading` (default "Recipes from great kitchens"), `chefs_intro` (richtext, default the mockup's
  "We work with Michelin-starred chefs and food writers who cook with our varieties…").

- [ ] **Step 3: CSS** — append: `.rhub-chefs` full-width `--paper-2` band, padding `clamp(48px,6vw,88px) 0`;
  `.rhub-chefs__grid` 2-col `0.9fr 1.1fr` (heading left, list right), stack ≤860px; eyebrow/heading match
  the estate section pattern; `.rhub-chef` a white row card (portrait circle 56px, name 700, role +
  count `--ink-soft`), Instagram icon right.

- [ ] **Step 4: Verify + commit** — theme-check; braces; `curl … | grep -c rhub-chef` matches chef count.
  Commit `"Recipe hub: our chefs"`.

---

## Task 7: Submit-a-recipe CTA

**Files:** Modify `sections/recipe-hub.liquid`, `assets/morghew-recipe-hub.css`

**Design:** full-width band, background image + dark overlay. LEFT: eyebrow "Share your cooking",
large white Baloo-2 heading "Made something with Morghew?", body text. RIGHT: a paper-filled
"Submit a recipe" button.

- [ ] **Step 1: Markup** — after the chefs section, still inside `.rhub`:
```liquid
{%- if section.settings.submit_heading != blank -%}
  <section class="rhub-submit">
    {%- if section.settings.submit_image != blank -%}<img class="rhub-submit__bg" src="{{ section.settings.submit_image | image_url: width: 2400 }}" alt="" aria-hidden="true" loading="lazy" width="{{ section.settings.submit_image.width }}" height="{{ section.settings.submit_image.height }}">{%- endif -%}
    <div class="rhub-submit__overlay"></div>
    <div class="rhub__wrap rhub-submit__inner">
      <div>
        {%- if section.settings.submit_eyebrow != blank -%}<p class="rhub-submit__eyebrow">{{ section.settings.submit_eyebrow }}</p>{%- endif -%}
        <h2 class="rhub-submit__heading">{{ section.settings.submit_heading }}</h2>
        {%- if section.settings.submit_text != blank -%}<p class="rhub-submit__text">{{ section.settings.submit_text }}</p>{%- endif -%}
      </div>
      {%- if section.settings.submit_btn_label != blank -%}<a class="rhub-submit__btn" href="{{ section.settings.submit_btn_url | default: '#' }}">{{ section.settings.submit_btn_label }}</a>{%- endif -%}
    </div>
  </section>
{%- endif -%}
```

- [ ] **Step 2: Schema** — add: header "Submit CTA"; `submit_image` (image), `submit_eyebrow`
  (default "Share your cooking"), `submit_heading` (default "Made something with Morghew?"),
  `submit_text` (textarea, default the mockup line), `submit_btn_label` (default "Submit a recipe"),
  `submit_btn_url` (url).

- [ ] **Step 3: CSS** — append: `.rhub-submit` full-width, `position: relative`, bg image + dark
  `.rhub-submit__overlay`; `.rhub-submit__inner` flex row space-between, padding `clamp(48px,7vw,96px) 0`,
  wraps on mobile; eyebrow straw uppercase; heading Baloo 2 clamp(28px,4vw,48px) `--paper`; text
  cream; `.rhub-submit__btn` `--paper` bg, `--ink` text, padding `14px 28px`, `--radius`.

- [ ] **Step 4: Verify + commit** — theme-check; braces. Commit `"Recipe hub: submit CTA"`.

---

## Task 8: Full verification + deploy

- [ ] **Step 1** — `shopify theme check sections/recipe-hub.liquid templates/blog.recipe.json` → 0 errors.
- [ ] **Step 2 (user-assisted)** — merchant creates `custom.recipe_difficulty` + `custom.recipe_methods`,
  populates a few recipes, tags one `featured`, and sets the recipes blog to the `blog.recipe` template.
  Then load `/blogs/recipes` on localhost: hero, featured, filters (search + method + difficulty all
  working + live count), grid, chefs (counts correct), submit CTA all render.
- [ ] **Step 3 (on the user's go-ahead)** — deploy: `./bin/deploy.sh --no-git`; push the template via
  CLI (`shopify theme push … --only templates/blog.recipe.json`); `./bin/verify-sync.sh`.

---

## Self-Review

**Spec coverage:** hero (T2), featured (T3), filter bar + count (T4), article-driven grid + JS (T5),
our chefs (T6), submit CTA (T7), new template + section (T1), deploy (T8). New metafields
(`recipe_difficulty`, `recipe_methods`) consumed in T3/T5; Chef metaobject in T3/T6. ✓

**Placeholders:** curl checks need the merchant to assign `blog.recipe` + populate metafields —
called out as expected-pending, not failures. Every code step has complete markup/JS; CSS steps for
T4–T7 give tokens + layout intent rather than every declaration (the builder matches the mockup and
the described design, and the controller reviews against the image). No TODO/TBD in code.

**Consistency:** `.rhub-tag` shared between featured + grid; filter JS mirrors the Potato Shop pattern
(`data-*` + `.is-hidden` class, not `[hidden]`); IDs scoped by `section.id`; `blogs.recipes` used
explicitly; tokens throughout. Prep/cook confirmed free-text → cards show `recipe_cook_time`, no
fragile summing.

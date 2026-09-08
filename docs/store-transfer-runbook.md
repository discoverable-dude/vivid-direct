# Morghew — dev store → client transfer store runbook

**Date:** 2026-08-16 · Old store: `morghew.myshopify.com` (theme `morghew/main` #186167787815,
GitHub-synced to `main`).

The theme is unusually transfer-friendly: `config/settings_data.json` is in the repo (all
customizer settings travel with the code) and the theme contains **zero `gid://` references** —
every product/collection reference is handle-based, so it resolves on the new store once
objects with the same handles exist.

## Order of operations

### 1. Freeze the old store
Stop content/customizer edits on the old store once the transfer starts, or they'll be lost.
Final sync: confirm `git pull` shows no new "Update from Shopify" commits pending.

### 2. Rebuild store data (George's Python script)
Run against the new store FIRST so handles exist before the theme renders. The script must
recreate, **keeping the same handles everywhere**:
- Products + variants (incl. weights — the shipping rates are weight-banded)
- Collections (incl. `potato-shop`, `estate`, method collections `potato-shop-roast`, `mash`,
  `chip`, `jacket`, `boil`, `steam`, `dauphinoise`, `wedge`, `wild-game` — the shop tabs and
  homepage link to these by handle)
- Metafield **definitions** incl. `custom.trust_1/2/3` (product trust lines), the
  `custom.recipe_*` set, `descriptors.subtitle`, `custom.flesh_colour`, `custom.variety_type`,
  `custom.product_attributes_1`, `custom.bottom_content` (collections)
- **Metaobjects: definition + entries for `chef`** (recipe pages read
  `shop.metaobjects.chef`), and any cooking-method/colour metaobjects
- ⚠️ **GID remap:** metafield values that are metaobject/product references (e.g.
  `custom.recipes` lists, `custom.recipe_chef`) store `gid://shopify/Metaobject/…` IDs.
  Old-store GIDs are meaningless on the new store — the script must write NEW GIDs after
  recreating the metaobjects. This is the most likely silent breakage.
- Blogs (`recipes`, `news`) + articles + their metafields (the recipe hub is article-driven)

### 3. Upload theme images to Files
Upload everything in `~/morghew-files-transfer/` (54 files, ~72MB) to
**Content → Files**, keeping filenames exactly. Do this before opening the theme editor.
If Shopify renames any duplicate (`-1` suffix), fix the clash rather than accepting the rename.

### 4. Move the GitHub connection
1. **Old store:** Online Store → Themes → `morghew/main` → ⋯ → **Disconnect from GitHub**.
   Do this FIRST — two stores syncing to one branch will silently clobber each other.
2. **New store:** Themes → Add theme → **Connect from GitHub** → `discoverable-dude/morghew`
   → branch `main`. The theme arrives with all settings (settings_data is in the repo).
3. Preview, then **Publish**.
4. Update `shopify.theme.toml` `[environments.production]` with the new store domain + new
   theme ID (Claude can do this once the domain is known).

### 5. Pages (create with EXACT handles, empty body, assign template)
| Title | Handle | Template |
|---|---|---|
| About | `about` | page.about |
| The Estate | `the-estate` | page.estate |
| The Shoot | `the-shoot` | page.shoot |
| Visit Us | `visit-us` | page.visit-us |
| Wheat | `wheat` | page.wheat |
| Angling | `angling` | page.angling |
| Film & Photoshoot Location | `film-photoshoot-location` | page.filming |
| Flora & Fauna | `flora-and-fauna` | page.flora-fauna |
| Farmers' Markets | `farmers-markets` | page.markets |
| Trade | `trade` | page.trade |
| Contact | `contact` | page.contact |

Internal links depend on these handles (`/pages/visit-us`, `/pages/the-estate`, …).

### 6. Navigation menus
Menus are store data, not theme code — rebuild by hand in Navigation, mirroring the old
store's main menu (incl. The Estate mega-menu items) and footer menus. Easiest done with the
old store's admin open side-by-side.

### 7. Admin settings that never transfer
- **Store contact email:** Settings → Notifications → `Potatoshop@morghew.com` (all forms)
- **Shipping:** weight-banded rates — £7.50 per 25kg band (0–25 → £7.50, 25.01–50 → £15, …)
- Payments, taxes (UK VAT), markets, legal pages/policies
- Password page stays ON until launch; domains (`morghew.com` DNS) at go-live
- Metafield definition visibility ("Storefront access" must be on for definitions the theme
  reads — the script should set this)

### 8. Verify (theme editor preview before publish)
- Homepage top-to-bottom (hero video/image, variety rail cards, season band, Beyond panel)
- One potato PDP + one estate PDP (metafields: cook methods, flesh badge, good-to-know,
  trust lines, related recipes — this catches GID-remap failures)
- Recipe hub + one recipe article (chef metaobject)
- Each of the 11 pages (images resolved, no empty pickers)
- Basket: upsell rows, drawer, checkout reaches payment
- Log postcode gate end-to-end (tag + prefixes + charge product all live in
  settings_data/metafields, so they carry over — but the charge PRODUCT must exist with the
  same handle)

### Known theme-side gotchas
- Anything set via **Custom CSS in the customizer** lives in settings_data → transfers.
- The old `dev` branch and `morghew/dev` theme are dead — do not connect them.
- After connecting GitHub to the new store, `git push origin main` deploys to the NEW live
  theme. Same rule as before, new target.

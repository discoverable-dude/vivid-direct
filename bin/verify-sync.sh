#!/usr/bin/env bash
#
# verify-sync.sh — Detect drift between local code and the live theme.
#
# Pulls the live theme to a temp dir and compares CODE files (assets, sections,
# snippets, layout) against the working tree, ignoring whitespace and Shopify's
# auto-generated comment headers. Reports any REAL content difference — i.e. a
# file the GitHub sync silently dropped or a change made in the admin that never
# came back to git.
#
# Templates/*.json and config/*.json are intentionally NOT checked: Shopify
# constantly re-normalises them (empty "settings": {} blocks, key reordering),
# so they always show cosmetic diffs that are just noise.
#
# USAGE:  ./bin/verify-sync.sh
# EXIT:   0 = in sync, 1 = drift found
#
set -euo pipefail

STORE="morghew.myshopify.com"
THEME="186901365031"   # morghew/dev (live)

cd "$(dirname "$0")/.."
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "→ Pulling live theme #$THEME for comparison…"
shopify theme pull --store "$STORE" --theme "$THEME" --path "$TMP" \
  --only "assets/*" --only "sections/*" --only "snippets/*" --only "layout/*" \
  >/dev/null 2>&1

strip() { perl -0777 -pe 's{/\*.*?\*/}{}gs' "$1" | tr -d '[:space:]'; }

DRIFT=0
for dir in assets sections snippets layout; do
  [[ -d "$dir" ]] || continue
  while IFS= read -r f; do
    remote="$TMP/$f"
    if [[ ! -f "$remote" ]]; then
      echo "  ✗ MISSING ON THEME: $f"; DRIFT=1; continue
    fi
    if [[ "$(strip "$f")" != "$(strip "$remote")" ]]; then
      echo "  ✗ DRIFT: $f  (local ≠ theme)"; DRIFT=1
    fi
  done < <(find "$dir" -type f ! -name '.DS_Store')
done

echo ""
if [[ "$DRIFT" == "0" ]]; then
  echo "✓ In sync — every code file on the theme matches local."
else
  echo "✗ Drift found (see above). Run ./bin/deploy.sh to push local → theme,"
  echo "  or pull the theme's version if the admin edit was intentional."
  exit 1
fi

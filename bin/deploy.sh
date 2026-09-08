#!/usr/bin/env bash
#
# deploy.sh — Reliable Morghew theme deploy.
#
# WHY THIS EXISTS:
#   The theme uses Shopify's two-way GitHub integration. That sync is
#   UNRELIABLE for code files: when edits happen on both sides (someone in
#   the Shopify admin + a git push), Shopify silently drops one side's change
#   with no error. This once dropped the entire cart CSS block from the theme
#   while keeping it in git — the page rendered unstyled with no warning.
#
# WHAT THIS DOES:
#   1. Syncs git (so version history stays correct).
#   2. Pushes CODE files (assets/sections/snippets/layout) DIRECTLY to the
#      theme via the CLI, bypassing the flaky GitHub sync entirely.
#   3. Leaves templates/*.json and config/*.json to the customizer/GitHub sync,
#      since those ARE meant to be edited in the admin.
#
# USAGE:
#   ./bin/deploy.sh            # sync git, then push code to the theme
#   ./bin/deploy.sh --no-git   # skip git sync, just push code to the theme
#
set -euo pipefail

STORE="morghew.myshopify.com"
THEME="186901365031"   # morghew/dev  (role: live) — the GitHub-connected theme

cd "$(dirname "$0")/.."

if [[ "${1:-}" != "--no-git" ]]; then
  echo "→ Syncing git (stash → pull --rebase → pop)…"
  STASHED=0
  if ! git diff --quiet || ! git diff --cached --quiet; then
    git stash push --include-untracked -m "deploy.sh autostash" && STASHED=1
  fi
  git pull --rebase origin dev
  if [[ "$STASHED" == "1" ]]; then git stash pop; fi
fi

echo "→ Pushing CODE directly to theme #$THEME (assets, sections, snippets, layout)…"
shopify theme push \
  --store "$STORE" \
  --theme "$THEME" \
  --allow-live \
  --nodelete \
  --only "assets/*" \
  --only "sections/*" \
  --only "snippets/*" \
  --only "layout/*"

echo ""
echo "✓ Code pushed directly to the theme — GitHub sync bypassed."
echo "  Run ./bin/verify-sync.sh to confirm the theme matches local."

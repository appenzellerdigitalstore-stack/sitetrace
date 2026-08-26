#!/usr/bin/env bash
# =============================================================
# SiteTrace — One-shot deploy script (macOS / Linux / Git Bash)
# Usage:
#   export CLOUDFLARE_API_TOKEN="your-token-here"
#   ./deploy.sh
# =============================================================
set -euo pipefail

PROJECT_NAME="sitetrace"
cd "$(dirname "$0")"

echo
echo "============================================="
echo "  SiteTrace → Cloudflare Pages deploy"
echo "============================================="
echo

# ---- 1. Sanity checks ---------------------------------------
if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "[X] CLOUDFLARE_API_TOKEN is not set." >&2
  echo
  echo "    1. Get a token at:  https://dash.cloudflare.com/profile/api-tokens" >&2
  echo "    2. Use the 'Edit Cloudflare Pages' template (or custom with Pages:Edit scope)" >&2
  echo "    3. Then run:" >&2
  echo
  echo "       export CLOUDFLARE_API_TOKEN='your-token-here'" >&2
  echo "       ./deploy.sh" >&2
  echo
  exit 1
fi

# Detect wrangler
WRANGLER=""
if command -v wrangler >/dev/null 2>&1; then
  WRANGLER="wrangler"
elif command -v npx >/dev/null 2>&1; then
  WRANGLER="npx wrangler"
else
  echo "[X] Wrangler not found. Install with:  npm install" >&2
  exit 1
fi

echo "[1/3] Validating project files..."
for f in index.html styles.css js/app.js js/i18n.js js/ping.js js/dns.js wrangler.toml; do
  [[ -f "$f" ]] || { echo "[X] Missing: $f" >&2 ; exit 1; }
done
echo "      OK"

echo
echo "[2/3] Deploying to Cloudflare Pages (project: $PROJECT_NAME)..."
$WRANGLER pages deploy . --project-name="$PROJECT_NAME" --commit-dirty=true

echo
echo "[3/3] Done."
echo
echo "  --> https://$PROJECT_NAME.pages.dev is now live (or updated)."
echo
echo "  Next: wire the custom domain sitetrace.it.com"
echo "  1. Open:  https://dash.cloudflare.com/ --> Workers & Pages --> $PROJECT_NAME --> Custom domains"
echo "  2. Click 'Set up a custom domain' and enter: sitetrace.it.com"
echo "  3. Cloudflare will show the CNAME target. Add it at Namecheap:"
echo "        Type: CNAME  |  Host: sitetrace  |  Target: $PROJECT_NAME.pages.dev  |  TTL: Automatic"
echo "  4. Wait 1-5 min for DNS to propagate, then SSL is auto-issued."
echo

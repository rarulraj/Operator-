#!/bin/bash
# ── Operator launcher ────────────────────────────────────────────────────────
# Double-click this file to start Operator as a local app.
# It installs deps if needed, builds once, then serves the production app
# and opens it in your default browser.
#
# Optional: install it to your Dock like a real app :
#   1. Start this script
# 2. In Chrome: ⋮ menu → Cast, save, and share → Install page as app…
#      (uses the built-in PWA manifest + icon)

cd "$(dirname "$0")" || exit 1

if [ ! -d node_modules ]; then
  echo "Installing dependencies…"
  npm install
fi

if [ ! -d .next ]; then
  echo "Building Operator (first run only)…"
  npm run build
fi

PORT=3000
URL="http://localhost:$PORT"

# If something is already serving on the port, just open it
if curl -s -o /dev/null --max-time 1 "$URL"; then
  open "$URL"
  exit 0
fi

( sleep 2 && open "$URL" ) &
npm run start

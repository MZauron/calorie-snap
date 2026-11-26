#!/usr/bin/env bash
# From MZauron/playdate scripts/test-smoke.sh @ eeb9dd8 (no test account yet; T05 adds the sign-in loop).
# Runs the Playwright smoke tests (tests/smoke) against a production build of the app and the LOCAL Supabase: `npm run db:start` first.
set -euo pipefail
cd "$(dirname "$0")/.."

status="$(npx supabase status -o env 2>/dev/null)" || { echo "The local Supabase is not running. Start it with: npm run db:start" >&2; exit 1; }
value() { printf '%s\n' "$status" | sed -n "s/^$1=\"\(.*\)\"$/\1/p"; }

api_url="$(value API_URL)"
case "$api_url" in
  http://127.0.0.1:*|http://localhost:*) ;;
  *) echo "Refusing to run: the Supabase API is not on a local address." >&2; exit 1 ;;
esac
export NEXT_PUBLIC_SUPABASE_URL="$api_url"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$(value ANON_KEY)"
export SUPABASE_SERVICE_ROLE_KEY="$(value SERVICE_ROLE_KEY)"
export SITE_PASSWORD=""

npx playwright test "$@"

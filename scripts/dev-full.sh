#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Checking Supabase status..."
if pnpm supabase status > /dev/null 2>&1; then
  echo "✅ Supabase is already running"
else
  echo "🚀 Starting Supabase (first run may download Docker images)..."
  pnpm supabase start
  echo ""
  echo "✅ Supabase started — local keys printed above"
fi

echo ""
echo "🚀 Starting dev servers (web :5173, api :3001)..."
exec pnpm dev

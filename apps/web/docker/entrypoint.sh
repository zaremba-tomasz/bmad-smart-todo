#!/bin/sh
set -e

cat > /usr/share/nginx/html/config.json <<EOF
{
  "SUPABASE_URL": "${SUPABASE_URL}",
  "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}"
}
EOF

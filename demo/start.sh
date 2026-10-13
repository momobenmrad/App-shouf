#!/usr/bin/env bash
# Starts the demo stand-ins, the live gateway and the web app; stops everything if one of them exits.
set -euo pipefail
cd /app
HOST=${DEMO_HOST:-localhost}
eval "$(node mock/server.mjs keys)"

export POSTGREST_URL=${POSTGREST_URL:-http://postgrest:3000} MEDIA_DIR=/app/media
# Browser-facing addresses use $HOST; server-to-server calls stay inside the container.
export APP_URL="http://$HOST:3000"
export NEXT_PUBLIC_SUPABASE_URL="http://$HOST:54321" NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
export SUPABASE_URL="http://127.0.0.1:54321" SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
export PLAYBACK_SIGNING_SECRET=chouf-demo-playback-secret-not-for-production
export VOD_BASE_URL="http://$HOST:8787" LIVE_BASE_URL="http://$HOST:8788"
export REDIS_URL=${REDIS_URL:-redis://redis:6379}
export S3_ENDPOINT=http://127.0.0.1:9000 S3_BUCKET=demo S3_ACCESS_KEY_ID=demo S3_SECRET_ACCESS_KEY=demo
export LIVE_INGEST_RTMP_URL="rtmp://$HOST:1935" LIVE_INGEST_SRT_URL="srt://$HOST:8890"
export DEFAULT_COUNTRY=${DEFAULT_COUNTRY:-TN}

node mock/server.mjs &
(cd gateway && PORT=8788 MEDIAMTX_HLS_URL=http://localhost:8787 MEDIAMTX_HOOK_SECRET=chouf-demo-hook-secret \
  LIVE_ALLOWED_ORIGINS="$APP_URL" exec node dist/index.js) &
(cd web && PORT=3000 HOSTNAME=0.0.0.0 exec node apps/web/server.js) &

echo "Chouf démo : $APP_URL  (samir@demo.tn / admin@demo.tn, mot de passe demo1234)"
wait -n
exit 1

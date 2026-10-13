#!/usr/bin/env bash
# Prepares a fresh Ubuntu 22.04/24.04 server for Chouf and generates the production .env.
# Usage (as root, on the server):
#   curl -fsSL https://raw.githubusercontent.com/momobenmrad/App-shouf/main/scripts/bootstrap-server.sh | bash -s -- chouf.tn
# Idempotent: safe to run again. It never overwrites an existing .env.
set -euo pipefail

DOMAIN="${1:-}"
REPO="${CHOUF_REPO:-https://github.com/momobenmrad/App-shouf.git}"
DIR="${CHOUF_DIR:-/opt/chouf}"

if [[ -z "$DOMAIN" ]]; then
  echo "usage: bootstrap-server.sh <domaine>   (ex. chouf.tn)" >&2
  exit 1
fi
if [[ "$(id -u)" != "0" ]]; then
  echo "lancez ce script en root (sudo)" >&2
  exit 1
fi

echo "▶ Paquets de base"
apt-get update -qq
apt-get install -y -qq ca-certificates curl git ufw openssl >/dev/null

if ! command -v docker >/dev/null; then
  echo "▶ Installation de Docker"
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

echo "▶ Pare-feu : SSH, HTTP/HTTPS, RTMP (1935/tcp), SRT (8890/udp)"
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw allow 443/udp >/dev/null
ufw allow 1935/tcp >/dev/null
ufw allow 8890/udp >/dev/null
ufw --force enable >/dev/null

if [[ ! -d "$DIR/.git" ]]; then
  echo "▶ Clonage dans $DIR"
  git clone -q "$REPO" "$DIR"
else
  echo "▶ Mise à jour du dépôt"
  git -C "$DIR" pull -q --ff-only
fi
cd "$DIR"

if [[ ! -f .env ]]; then
  echo "▶ Génération de .env avec des secrets aléatoires"
  cp .env.example .env
  set_var() { sed -i "s#^$1=.*#$1=$2#" .env; }
  set_var APP_DOMAIN "$DOMAIN"
  set_var APP_URL "https://$DOMAIN"
  set_var VOD_BASE_URL "https://vod.$DOMAIN"
  set_var LIVE_BASE_URL "https://live-origin.$DOMAIN"
  set_var LIVE_ALLOWED_ORIGINS "https://$DOMAIN,https://www.$DOMAIN"
  set_var LIVE_INGEST_RTMP_URL "rtmp://live-origin.$DOMAIN:1935"
  set_var LIVE_INGEST_SRT_URL "srt://live-origin.$DOMAIN:8890"
  set_var PLAYBACK_SIGNING_SECRET "$(openssl rand -base64 48 | tr -d '/+=\n')"
  set_var MEDIAMTX_HOOK_SECRET "$(openssl rand -hex 24)"
  set_var KONNECT_API_URL "https://api.sandbox.konnect.network/api/v2"
  set_var S3_ENDPOINT ""
  set_var S3_PUBLIC_ENDPOINT ""
  set_var S3_ACCESS_KEY_ID ""
  set_var S3_SECRET_ACCESS_KEY ""
  set_var NEXT_PUBLIC_SUPABASE_URL ""
  set_var SUPABASE_URL ""
  sed -i 's#^DEFAULT_COUNTRY=.*#DEFAULT_COUNTRY=#' .env
  chmod 600 .env
fi

cat <<EOF

✔ Serveur prêt. Il reste à compléter $DIR/.env avec vos comptes :
   - Supabase : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
   - Cloudflare R2 : S3_ENDPOINT (https://<account>.r2.cloudflarestorage.com), S3_PUBLIC_ENDPOINT (identique), S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
   - Konnect : KONNECT_API_KEY, KONNECT_WALLET_ID
   - optionnel : ALERT_WEBHOOK_URL

   Le secret de signature généré est à copier dans l'edge Cloudflare :
     grep PLAYBACK_SIGNING_SECRET $DIR/.env
     cd $DIR/apps/edge && npx wrangler secret put SIGNING_SECRET && npx wrangler deploy

Puis :
   cd $DIR
   docker compose build
   docker compose run --rm worker node dist/preflight.js    # contrôle de la configuration
   docker compose up -d
EOF

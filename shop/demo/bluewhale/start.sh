#!/bin/sh
# Container entrypoint for the public "Blue Whale Gems" demo (Render free web service).
# The SQLite database lives in the container: it is rebuilt from scratch at every start, so the
# demo resets itself after each deploy or sleep.
set -e
cd /app
URL="${RENDER_EXTERNAL_URL:-http://localhost:${PORT:-10000}}"
if [ ! -f storage/config.php ]; then
  php bin/install.php --sqlite --url="$URL" --email="${ADMIN_EMAIL:-admin@bluewhalegems.tn}" \
    --password="${ADMIN_PASSWORD:-demo123456}" --name="Blue Whale Gems" --no-demo
  php demo/bluewhale/seed.php
fi
export PHP_CLI_SERVER_WORKERS=4
exec php -S 0.0.0.0:"${PORT:-10000}" index.php

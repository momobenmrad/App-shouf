#!/bin/sh
# Container entrypoint for a prospect demo (Render free web service). DEMO picks the demo folder
# (default: bluewhale). The SQLite database lives in the container and is rebuilt at every start,
# so the demo resets itself after each deploy or sleep.
set -e
cd "$(dirname "$0")/.."
DEMO="${DEMO:-bluewhale}"
URL="${RENDER_EXTERNAL_URL:-http://localhost:${PORT:-10000}}"
if [ ! -f storage/config.php ]; then
  php bin/install.php --sqlite --url="$URL" --email="${ADMIN_EMAIL:-admin@demo.tn}" \
    --password="${ADMIN_PASSWORD:-demo123456}" --name="$(cat "demo/$DEMO/shop-name.txt")" --no-demo
  php "demo/$DEMO/seed.php"
fi
export PHP_CLI_SERVER_WORKERS=4
exec php -S 0.0.0.0:"${PORT:-10000}" index.php

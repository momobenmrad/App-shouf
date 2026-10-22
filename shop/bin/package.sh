#!/usr/bin/env bash
# Builds a clean, client-ready archive (no local config, database, logs or uploads): dist/boutique-YYYYMMDD.zip
set -euo pipefail
cd "$(dirname "$0")/.."
name="boutique-$(date +%Y%m%d)"
mkdir -p dist
rm -f "dist/$name.zip"
zip -qr "dist/$name.zip" . \
    -x 'dist/*' -x '.git*' -x 'storage/*' -x 'uploads/*'
zip -q "dist/$name.zip" storage/.htaccess storage/.gitkeep uploads/.htaccess uploads/.gitkeep
echo "dist/$name.zip"

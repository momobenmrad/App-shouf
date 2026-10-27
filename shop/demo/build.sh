#!/bin/sh
# Copies each demo's illustrations to assets/demo-<name>/ (run from the shop root).
set -e
for d in demo/*/; do
  n=$(basename "$d")
  if [ -d "$d/assets" ]; then
    mkdir -p "assets/demo-$n"
    cp "$d"/assets/* "assets/demo-$n/"
  fi
done

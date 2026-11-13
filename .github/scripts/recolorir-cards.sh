#!/usr/bin/env bash
# Copia os cards do tema tokyonight para profile-summary-card-output/felip trocando só as cores pela paleta da marca.
set -euo pipefail
src=profile-summary-card-output/tokyonight
dst=profile-summary-card-output/felip
mkdir -p "$dst"
for f in "$src"/*.svg; do
  sed -E \
    -e 's/#1a1b27/#12352B/gI' \
    -e 's/#38bdae/#FFC83D/gI' \
    -e 's/#70a5fd/#F2E8D5/gI' \
    -e 's/#bf91f3/#B9C7B4/gI' \
    -e 's/#3178c6/#F2E8D5/gI' \
    -e 's/#e34c26/#FFC83D/gI' \
    -e 's/#012456/#4A5C52/gI' \
    "$f" > "$dst/$(basename "$f")"
done

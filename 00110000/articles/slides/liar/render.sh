#!/usr/bin/env bash
# Renders slide01.html ... slide12.html with headless Edge (run from WSL) into out/*.png,
# then writes the JPG sizes that liarparadox.html uses into ../../images/slideshow/liar/.
# Usage: bash render.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
EDGE="/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
WIN_DIR="$(wslpath -w "$HERE")"
mkdir -p "$HERE/out"
for i in $(seq -f "%02g" 1 12); do
  "$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1600,900 \
    --virtual-time-budget=2000 --screenshot="$WIN_DIR\\out\\slide$i.png" "file:///$(echo "$WIN_DIR" | sed 's#\\#/#g')/slide$i.html" >/dev/null 2>&1
  echo "rendered slide$i"
done
python3 "$HERE/jpgs.py"

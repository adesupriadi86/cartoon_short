#!/usr/bin/env bash
# Combine engine/toonbase.js + cast.js -> web/toon.js and verify ESM syntax.
set -e
BASE="${1:-engine/toonbase.js}"
CAST="${2:-web/cast.js}"
OUT="${3:-web/toon.js}"
cat "$BASE" "$CAST" > "$OUT"
node --input-type=module --check < "$OUT"
echo "Built & verified $OUT"

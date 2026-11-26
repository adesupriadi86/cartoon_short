#!/usr/bin/env bash
# All-in-one Cartoon Short Pipeline Runner (Audio -> Timing -> Subtitles -> Mix -> WebGL Render -> MP4 + QA)
# Usage:
#   bash run_pipeline.sh <project_dir> [title] [--step 1|2] [--workers 2] [--no-subs]
set -e
KIT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJ="${1:?Usage: bash run_pipeline.sh <project_dir> [title] [--step 1|2] [--workers 2] [--no-subs]}"
TITLE="${2:-cartoon_short}"
shift 2 || true

STEP=2        # 2 = render on twos (15fps animation in 30fps MP4, 2x faster); set --step 1 for full 30fps
WORKERS=2
USE_SUBS=1
while [[ $# -gt 0 ]]; do
  case "$1" in
    --step) STEP="$2"; shift 2 ;;
    --workers) WORKERS="$2"; shift 2 ;;
    --no-subs) USE_SUBS=0; shift ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

cd "$PROJ"
mkdir -p web/lib work frames stills out

# Sync engine files into project web/
cp "$KIT_DIR/engine/index.html" web/
cp "$KIT_DIR/engine/motion.js" web/
cp "$KIT_DIR/engine/lib/three.module.js" web/lib/
bash "$KIT_DIR/engine/build_toon.sh" "$KIT_DIR/engine/toonbase.js" web/cast.js web/toon.js

echo "[1/5] Aligning voice.mp3 + script.txt..."
python3 "$KIT_DIR/tools/timing.py" voice.mp3 script.txt --out work
TOTAL_FRAMES=$(python3 -c "import json; print(json.load(open('work/phrases.json'))['frames30'])")
LAST_FRAME=$((TOTAL_FRAMES - 1))
echo "Total frames @ 30fps: $TOTAL_FRAMES (0..$LAST_FRAME)"

if [ "$USE_SUBS" -eq 1 ]; then
  echo "[2/5] Generating animated YouTube Shorts subtitles (work/subs.ass)..."
  python3 "$KIT_DIR/tools/subtitles.py" work/words.json work/subs.ass --words-per-chunk 3
  SUBS_ARG="work/subs.ass"
else
  echo "[2/5] Skipping subtitles (--no-subs)."
  SUBS_ARG="none"
fi

echo "[3/5] Synthesizing music + SFX & mixing at -6.0 dB..."
python3 audio.py

echo "[4/5] Rendering frames 0-$LAST_FRAME (step=$STEP, workers=$WORKERS)..."
RESUME=1 python3 "$KIT_DIR/tools/render.py" frames "0-$LAST_FRAME" "$STEP" 0.92 "$WORKERS"
if [ "$STEP" -eq 2 ]; then
  python3 - "$TOTAL_FRAMES" << 'PYEOF'
import os, sys, shutil
total = int(sys.argv[1])
for f in range(0, total, 2):
    src = f"frames/f{f:04d}.jpg"
    if os.path.exists(src) and f + 1 < total:
        shutil.copy2(src, f"frames/f{f+1:04d}.jpg")
PYEOF
fi

echo "[5/5] Encoding final 1080x1920 30fps MP4 & running QA..."
bash "$KIT_DIR/tools/finish.sh" "$TITLE" "$SUBS_ARG"

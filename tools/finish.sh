#!/usr/bin/env bash
# Encode frames + mix_raw.wav (+ optional work/subs.ass) -> 1080x1920 30fps MP4 + QA.
# Usage: bash tools/finish.sh "Title Of Short" [subs.ass | none]
set -e
TITLE="${1:-cartoon_short}"
SUBS="${2:-work/subs.ass}"
mkdir -p out
OUT="out/${TITLE// /-}.mp4"

# 1. Loudness normalize to ~-14 LUFS stereo 48kHz
ffmpeg -v error -y -i mix_raw.wav -af "loudnorm=I=-14:TP=-1.5:LRA=7" -ar 48000 -ac 2 mix.wav

# 2. Build video filter chain (crisp Lanczos scale to 1080x1920 + optional ASS subtitles)
VF="scale=1080:1920:flags=lanczos"
if [ "$SUBS" != "none" ] && [ -f "$SUBS" ]; then
  # Escape path for ffmpeg ass filter
  VF="${VF},ass=${SUBS}"
  echo "Burning subtitles from: $SUBS"
else
  echo "Encoding WITHOUT burned-in subtitles."
fi

# 3. Encode H.264 CRF 17 + AAC 192k + faststart
ffmpeg -v error -y -framerate 30 -i frames/f%04d.jpg -i mix.wav \
  -map 0:v:0 -map 1:a:0 \
  -vf "$VF" \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"

# 4. Automated QA checks
echo "=== FFPROBE ==="
ffprobe -v error -show_entries format=duration,size -show_entries stream=width,height,r_frame_rate,codec_name -of compact "$OUT"
echo "=== FREEZE / BLACK CHECK (empty = PASS) ==="
ffmpeg -i "$OUT" -vf "freezedetect=n=0.0005:d=0.4,blackdetect=d=0.05" -an -f null - 2>&1 | grep -E "freeze_start|black_start" || echo "PASS: zero freeze or black spans"
echo "=== INTEGRATED LOUDNESS ==="
ffmpeg -i "$OUT" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1
ffmpeg -v error -y -i "$OUT" -vf "fps=1,scale=180:-1,tile=10x5" -frames:v 1 out/qa_sheet.jpg
echo "DONE: $OUT (QA sheet: out/qa_sheet.jpg)"

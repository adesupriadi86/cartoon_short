#!/usr/bin/env python3
"""Generate YouTube Shorts-style animated ASS subtitles from work/words.json.

Usage:
  python3 tools/subtitles.py work/words.json work/subs.ass [--words-per-chunk 3] [--y-margin 360] [--upper]

Features:
- 1080x1920 vertical safe-zone layout (default MarginV=360px from bottom, clear of Shorts UI)
- Bold Arial/DejaVu Sans with thick black outline + subtle drop shadow
- Active-word yellow highlight pop (karaoke-style chunking, 2-4 words at a time)
"""
import argparse, json, sys

ASS_HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,DejaVu Sans,{fontsize},&H00FFFFFF,&H0000D7FF,&H0018121E,&H80000000,-1,0,0,0,100,100,0,0,1,{outline},{shadow},2,70,70,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

def fmt_time(sec: float) -> str:
    sec = max(0.0, float(sec))
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = sec % 60.0
    cs = int(round((s - int(s)) * 100))
    if cs >= 100:
        cs = 0
        s += 1
    return f"{h}:{m:02d}:{int(s):02d}.{cs:02d}"

def esc_ass(text: str) -> str:
    return text.replace("\\", "\\\\").replace("{", "\\{").replace("}", "\\}")

def chunk_words(words, max_words=3, max_gap=0.45):
    chunks, cur = [], []
    for w in words:
        if cur:
            gap = w["s"] - cur[-1]["e"]
            prev_punct = cur[-1]["w"].endswith((".", "!", "?", ",", ";", ":"))
            if len(cur) >= max_words or gap > max_gap or prev_punct:
                chunks.append(cur)
                cur = []
        cur.append(w)
    if cur:
        chunks.append(cur)
    return chunks

def build_ass(words, words_per_chunk=3, fontsize=78, outline=9, shadow=4, margin_v=360, uppercase=True):
    lines = [ASS_HEADER.format(fontsize=fontsize, outline=outline, shadow=shadow, margin_v=margin_v)]
    chunks = chunk_words(words, max_words=words_per_chunk)
    for ch in chunks:
        # Render one event per active word in the chunk so the spoken word highlights in bright yellow!
        for idx, active_w in enumerate(ch):
            t_start = active_w["s"]
            t_end = ch[idx + 1]["s"] if idx + 1 < len(ch) else active_w["e"]
            if t_end <= t_start + 0.02:
                t_end = t_start + 0.04
            parts = []
            for j, w in enumerate(ch):
                txt = esc_ass(w["w"].upper() if uppercase else w["w"])
                if j == idx:
                    # Bright yellow active word with subtle scale pop
                    parts.append(r"{\c&H0018D8FF&\fscx108\fscy108}" + txt + r"{\c&H00FFFFFF&\fscx100\fscy100}")
                else:
                    parts.append(txt)
            line_txt = " ".join(parts)
            lines.append(f"Dialogue: 0,{fmt_time(t_start)},{fmt_time(t_end)},Default,,0,0,0,,{line_txt}")
    return "\n".join(lines) + "\n"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("words_json", help="Path to work/words.json")
    ap.add_argument("out_ass", help="Output .ass file path")
    ap.add_argument("--words-per-chunk", type=int, default=3)
    ap.add_argument("--fontsize", type=int, default=78)
    ap.add_argument("--margin-v", type=int, default=360)
    ap.add_argument("--no-upper", action="store_true")
    args = ap.parse_args()

    words = json.load(open(args.words_json, "r", encoding="utf-8"))
    ass = build_ass(
        words,
        words_per_chunk=args.words_per_chunk,
        fontsize=args.fontsize,
        margin_v=args.margin_v,
        uppercase=not args.no_upper,
    )
    with open(args.out_ass, "w", encoding="utf-8") as fp:
        fp.write(ass)
    print(f"Generated {args.out_ass} ({len(words)} words)")

if __name__ == "__main__":
    main()

"""Synthesized upbeat mall-groove music bed + frame-accurate cartoon SFX for
'Why Escalators Have Brushes on the Side', mixed under untouched voice.mp3.
Audio mix contract:
- Voiceover untouched (zero time-stretching, zero pitch/EQ edits)
- Music bed measured against gated voice RMS and set to exactly -6.0 dB (50% of voice RMS)
- Music cuts DEAD SILENT at 45.55s (right before 'It's warning you to move.' at 45.74s)
- SFX peaks strictly capped at <= 0.7x voice peak
"""
import numpy as np, subprocess, wave

SR = 48000
DUR = 1417 / 30.0
N = int(round(DUR * SR))
rng = np.random.default_rng(42)

def load_voice():
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", "voice.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True, check=True
    ).stdout
    v = np.frombuffer(raw, np.float32).copy()
    out = np.zeros(N, np.float32)
    out[:min(N, len(v))] = v[:N]
    return out

def lp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x)).astype(np.float32)

def hp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x)).astype(np.float32)

def place(buf, sig, t0, gain=1.0):
    i = int(round(t0 * SR))
    j = min(N, i + len(sig))
    if i < N and j > i:
        buf[i:j] += sig[:j - i] * gain

midi = lambda m: 440.0 * 2 ** ((m - 69) / 12.0)

def env(n, a=0.004, r=0.22):
    t = np.arange(n) / SR
    return (np.minimum(1.0, t / max(a, 1e-4)) * np.exp(-t / r)).astype(np.float32)

# ---------------- MUSIC BED (quirky modern mall pizzicato + rhythmic synth pulse) ----------------
music = np.zeros(N, np.float32)
BPM = 114.0
beat = 60.0 / BPM

def marimba(f, dur=0.28):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 25)
    return (s * env(n, 0.002, dur * 0.35)).astype(np.float32)

def bass_note(f, dur=0.38):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)
    return lp_fast((s * env(n, 0.005, dur * 0.55)).astype(np.float32), 550)

def pad_chord(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n, np.float32)
    for f in fs:
        s += np.sin(2 * np.pi * f * t) + 0.2 * np.sin(4 * np.pi * f * t)
    a = np.minimum(1.0, t / 0.12) * np.minimum(1.0, (dur - t) / 0.18).clip(0)
    return lp_fast((s * a).astype(np.float32), 1400) / len(fs)

def kick():
    n = int(0.24 * SR); t = np.arange(n) / SR
    f = 52 + 88 * np.exp(-t * 34)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)).astype(np.float32)

def hihat():
    n = int(0.06 * SR); t = np.arange(n) / SR
    return hp_fast((rng.standard_normal(n) * np.exp(-t * 65)).astype(np.float32), 6500) * 0.35

# Upbeat mall progression (C - Am - F - G) shifts to tense minor pulse during cutaway (11.2s - 30.8s)
prog_bright = [(48, [60, 64, 67]), (45, [57, 60, 64]), (41, [53, 57, 60]), (43, [55, 59, 62])]
prog_tense  = [(45, [57, 60, 64]), (41, [53, 57, 60]), (40, [52, 55, 59]), (40, [52, 56, 59])]

MUSIC_STOP = 45.52  # Cuts DEAD SILENT right before "It's warning you to move." (45.74s)
bar = 0; tt = 0.0
while tt < MUSIC_STOP:
    tense = 11.2 <= tt < 30.8
    root, ch = (prog_tense if tense else prog_bright)[bar % 4]
    place(music, pad_chord([midi(m) for m in ch], beat * 4 * 0.96), tt, 0.14 if tense else 0.11)
    for b in range(4):
        tb = tt + b * beat
        if tb >= MUSIC_STOP: break
        if b % 2 == 0:
            place(music, kick(), tb, 0.42)
        place(music, hihat(), tb + beat * 0.5, 0.30)
        place(music, bass_note(midi(root), 0.35), tb, 0.34)
        # bouncy marimba arpeggio
        note = ch[(b + bar) % 3] + (12 if not tense else 0)
        place(music, marimba(midi(note), 0.24), tb + (0.0 if b % 2 == 0 else beat * 0.5), 0.18 if not tense else 0.14)
    bar += 1
    tt += beat * 4

# Hard clean cut to DEAD SILENCE at MUSIC_STOP (20ms de-click fade)
i_stop = int(MUSIC_STOP * SR)
fade_cut = int(0.025 * SR)
music[max(0, i_stop - fade_cut):i_stop] *= np.linspace(1.0, 0.0, min(fade_cut, i_stop))
music[i_stop:] = 0.0

# ---------------- FRAME-ACCURATE CARTOON SFX ----------------
sfx = np.zeros(N, np.float32)
F = lambda fr: fr / 30.0
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)

def brush_swish(d=0.35):
    n = int(d * SR); t = np.arange(n) / SR
    s = hp_fast(lp_fast(noise(d), 4800), 1400) * np.sin(np.pi * t / d) ** 1.5
    return s * 0.65

def sparkle_ping():
    n = int(0.45 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 1760 * t) * np.exp(-t * 10) + 0.6 * np.sin(2 * np.pi * 2637 * t) * np.exp(-t * 14)
    return (s * 0.45).astype(np.float32)

def alarm_beep(f0=880, d=0.22):
    n = int(d * SR); t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f0 * t) + 0.3 * np.sin(6 * np.pi * f0 * t)) * np.minimum(1, t / 0.008) * np.exp(-t * 9)
    return (s * 0.5).astype(np.float32)

def whoosh(d=0.42):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 1600) * np.sin(np.pi * t / d) ** 2 * 0.65).astype(np.float32)

def gear_grind(d=1.9):
    n = int(d * SR); t = np.arange(n) / SR
    clanks = (np.mod(np.cumsum(np.full(n, 16.0)) / SR, 1.0) < 0.14).astype(np.float32)
    s = lp_fast(clanks * (0.6 + 0.4 * noise(d)), 1400) + lp_fast(noise(d), 180) * 1.4
    s *= np.minimum(1, t / 0.1) * np.minimum(1, (d - t) / 0.2).clip(0)
    return (s * 0.55).astype(np.float32)

def zap_sfx():
    d = 0.26; n = int(d * SR); t = np.arange(n) / SR
    f = 1900 * np.exp(-t * 14) + 320
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) + hp_fast(noise(d), 2200) * np.exp(-t * 18) * 0.4
    return (s * 0.65).astype(np.float32)

def boing_hop():
    d = 0.38; n = int(d * SR); t = np.arange(n) / SR
    f = 220 + 440 * (1 - np.exp(-t * 10)) + 45 * np.sin(2 * np.pi * 24 * t)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5) * 0.6).astype(np.float32)

def twist_sting():
    """Punchy dramatic impact sting right on 'It's warning you to move.' after dead silence!"""
    d = 1.4; n = int(d * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * (68 * np.exp(-t * 4) + 42) * t) * np.exp(-t * 2.2) * 1.1
    hit = lp_fast(noise(d), 1100) * np.exp(-t * 10) * 0.75
    ch = sum(np.sin(2 * np.pi * midi(m) * t) for m in [57, 60, 64, 69]) * np.exp(-t * 3.8) * 0.35
    return (sub + hit + ch).astype(np.float32)

# Place all SFX synced to exact frames from PLAN.md
place(sfx, brush_swish(0.32), F(12), 0.7)       # shoe rubbing bristles
place(sfx, sparkle_ping(),    F(34), 0.7)       # sparkle pop
place(sfx, brush_swish(0.30), F(56), 0.65)
place(sfx, alarm_beep(780),   F(93), 0.85)      # Shot 2 danger reveal kick
place(sfx, whoosh(0.45),      F(171), 0.65)     # Shot 3 wide crane reveal
place(sfx, brush_swish(0.32), F(262), 0.65)     # Shot 4 free shoe shine
place(sfx, sparkle_ping(),    F(286), 0.7)
place(sfx, whoosh(0.35),      F(336), 0.75)     # Shot 5 white flash -> silent alarm
place(sfx, alarm_beep(920),   F(371), 0.85)     # "silent alarm"
place(sfx, alarm_beep(920),   F(392), 0.6)
place(sfx, whoosh(0.40),      F(427), 0.55)     # Shot 6 moving steps
place(sfx, whoosh(0.38),      F(639), 0.60)     # Shot 8 macro push-in on razor gap
place(sfx, brush_swish(0.45), F(760), 0.70)     # Shot 9 shoelace slipping
place(sfx, gear_grind(1.95),  F(870), 0.90)     # Shot 10 "the gears don't stop."
place(sfx, whoosh(0.35),      F(925), 0.70)     # Shot 11 white flash -> safety code
place(sfx, sparkle_ping(),    F(950), 0.65)
place(sfx, zap_sfx(),         F(1038), 0.90)    # Shot 12 bristles touch ankle ZAP!
place(sfx, boing_hop(),       F(1112), 0.85)    # Shot 13 brain flinches & pulls foot away!
place(sfx, sparkle_ping(),    F(1265), 0.60)    # Shot 14 "remember."
place(sfx, twist_sting(),     F(1372), 1.00)    # Shot 15 POST-SILENCE TWIST STING!

# ---------------- EXACT -6.0 dB GATED-RMS MUSIC MIX + 0.7x SFX PEAK CAP ----------------
voice = load_voice()

def gated_rms(x, thresh=0.015):
    active = np.abs(x) > thresh
    if np.sum(active) < 100:
        return float(np.sqrt(np.mean(x ** 2) + 1e-12))
    return float(np.sqrt(np.mean(x[active] ** 2)))

v_rms = gated_rms(voice, 0.015)
v_peak = float(np.max(np.abs(voice)) + 1e-9)

# Light speech-ducking envelope on music, then normalize gated RMS to EXACTLY -6.0 dB (0.5012x) of voice RMS
ve = np.convolve(np.abs(voice), np.ones(int(0.06 * SR)) / int(0.06 * SR), "same")
duck = 1.0 - 0.25 * np.clip(ve / (v_peak * 0.25), 0, 1)
music_d = music * duck
m_rms = gated_rms(music_d[:i_stop], 0.005)
target_m_rms = v_rms * (10 ** (-6.0 / 20.0))  # exact -6.0 dB (50.1% of voice RMS)
music_scaled = music_d * (target_m_rms / max(m_rms, 1e-9))

# Cap SFX peaks strictly at <= 0.70x voice peak
s_peak = float(np.max(np.abs(sfx)) + 1e-9)
sfx_scale = min(1.0, (0.68 * v_peak) / s_peak)
sfx_scaled = sfx * sfx_scale

mix = voice + music_scaled + sfx_scaled
# Gentle headroom safety (no heavy distortion; finish.sh applies linear loudnorm to -14 LUFS)
peak_all = float(np.max(np.abs(mix)) + 1e-9)
if peak_all > 0.96:
    mix = mix * (0.96 / peak_all)

fade_end = int(0.04 * SR)
mix[-fade_end:] *= np.linspace(1.0, 0.0, fade_end)

pcm = (np.clip(mix, -1.0, 1.0) * 32767).astype(np.int16)
with wave.open("mix_raw.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

meas_db = 20.0 * np.log10(gated_rms(music_scaled[:i_stop], 0.002) / v_rms)
print(f"mix_raw.wav OK: dur={len(pcm)/SR:.2f}s | voice_rms={v_rms:.4f} | music_rel={meas_db:.2f} dB | sfx_peak/voice_peak={np.max(np.abs(sfx_scaled))/v_peak:.2f}x")

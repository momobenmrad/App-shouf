"""Mix for "Episode8" (src/episode8/Video.tsx): French ElevenLabs voice-over
(public/audio/voice/episode8.mp3) over a ducked, warmer 120 BPM beat, with pops on the price
tags, clicks on the taps, a cha-ching on the WhatsApp order and swipes on the struck DMs. Outputs
public/audio/episode8_full.wav and episode8_voice.wav (voice + effects only, to add a trending sound).

Usage: python3 audio/make_audio_episode8.py
"""
import os
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from make_audio import BEAT, SR, bass, chord, clap, click, ding, hat, impact, kick, master, pad, place, pop, riser, whoosh, write  # noqa: E402
from make_audio_premium import kaching  # noqa: E402
from make_audio_premium15 import duck  # noqa: E402

FPS = 30
TOTAL = 405
DUR = TOTAL / FPS
HERE = os.path.dirname(__file__)
PAGE, PRODUCTS, TAP_PRODUCT, TAP_SIZE, TAP_ORDER, CHAT, FINI, STRIKE, READY, CTA = 36, 80, 133, 152, 168, 178, 217, 240, 281, 324  # mirrored from Video.tsx
LOOP = TOTAL - 15


def t(frame):
    return frame / FPS


def load_voice():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(HERE, "..", "public", "audio", "voice", "episode8.mp3"),
                          "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    v = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768
    return v / (np.max(np.abs(v)) + 1e-9) * 0.9


def build():
    n = int(DUR * SR)
    music = np.zeros(n + SR)
    sfx = np.zeros(n + SR)
    # Minor, cinematic progression: Am – F – C – G, pads on every bar.
    prog = [(110.0, [220.0, 261.63, 329.63]), (87.31, [174.61, 220.0, 261.63]),
            (130.81, [196.0, 261.63, 329.63]), (98.0, [196.0, 246.94, 293.66])]
    for b in range(int(DUR / BEAT)):
        ts = b * BEAT
        root, triad = prog[(b // 4) % 4]
        if b % 4 == 0:
            place(music, pad([x * 2 for x in triad], BEAT * 4), ts, 1.2)
        if t(PAGE) <= ts:
            place(music, kick(), ts)
            place(music, hat(), ts + BEAT / 2, 0.7)
            if b % 4 in (1, 3):
                place(music, clap(), ts, 0.7)
            place(music, bass(root, BEAT * 0.45), ts, 0.8)
        place(music, chord(triad, 0.25), ts + BEAT * 0.75, 0.7)

    place(sfx, whoosh(0.4), 0, 0.5)
    place(sfx, impact(), t(PAGE), 0.5)
    place(sfx, whoosh(0.35), t(PRODUCTS) - 0.12, 0.45)
    for i in range(4):
        place(sfx, pop(950 + 90 * i), t(PRODUCTS + 6 + i * 7), 0.5)
    for f in (TAP_PRODUCT, TAP_SIZE, TAP_ORDER):
        place(sfx, click(), t(f), 0.6)
    place(sfx, whoosh(0.3), t(TAP_PRODUCT + 7) - 0.05, 0.4)
    place(sfx, pop(1300), t(CHAT + 4), 0.6)
    place(sfx, kaching(), t(CHAT + 10), 0.7)
    place(sfx, pop(1000), t(CHAT + 24), 0.45)
    for i in range(5):
        place(sfx, pop(600), t(FINI + i * 4), 0.4)
        place(sfx, whoosh(0.2), t(STRIKE + i * 3), 0.4)
    place(sfx, impact(), t(READY + 2), 0.6)
    place(sfx, ding(), t(READY + 16), 0.5)
    place(sfx, whoosh(), t(CTA) - 0.2, 0.6)
    for i in range(4):
        place(sfx, click(), t(CTA + 8 + i * 4), 0.35)
    place(sfx, whoosh(0.4, up=False), t(LOOP), 0.5)
    return music[:n], sfx[:n]


if __name__ == "__main__":
    music, sfx = build()
    v = load_voice()
    voice = np.zeros_like(music)
    voice[: min(len(v), len(voice))] = v[: len(voice)]
    out = os.path.join(HERE, "..", "public", "audio")
    write(os.path.join(out, "episode8_full.wav"), master(duck(music, voice) * 0.45 + sfx * 0.55 + voice * 1.1, 0.92))
    write(os.path.join(out, "episode8_voice.wav"), master(sfx * 0.5 + voice * 1.1, 0.92))
    print("ok")

"""Mix for "Episode7" (src/episode7/Video.tsx): French ElevenLabs voice-over
(public/audio/voice/episode7.mp3) over a ducked 120 BPM beat, with a glitch on the hack, effects on the
chips, the order notification and the call to action. Outputs public/audio/episode7_full.wav and episode7_voice.wav
(voice + effects only, to add a trending sound in TikTok).

Usage: python3 audio/make_audio_episode7.py
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
TOTAL = 465
DUR = TOTAL / FPS
HERE = os.path.dirname(__file__)
LOSE, FOLLOWERS, PHOTOS, CLIENTS, SHOP, OWNS, SITE, CRM, ORDERS, DOWN, SELL, CTA = 58, 82, 104, 133, 164, 210, 236, 249, 277, 300, 335, 384  # mirrored from Video.tsx
LOOP = TOTAL - 15


def t(frame):
    return frame / FPS


def load_voice():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(HERE, "..", "public", "audio", "voice", "episode7.mp3"),
                          "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    v = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768
    return v / (np.max(np.abs(v)) + 1e-9) * 0.9


def build():
    n = int(DUR * SR)
    music = np.zeros(n + SR)
    sfx = np.zeros(n + SR)
    prog = [(110.0, [220.0, 261.63, 329.63]), (87.31, [174.61, 220.0, 261.63]),
            (130.81, [196.0, 261.63, 329.63]), (98.0, [196.0, 246.94, 293.66])]
    for b in range(int(DUR / BEAT)):
        ts = b * BEAT
        root, triad = prog[(b // 4) % 4]
        place(music, kick(), ts)
        place(music, hat(), ts + BEAT / 2, 0.8)
        if b % 4 in (1, 3):
            place(music, clap(), ts, 0.8)
        place(music, chord(triad, 0.25), ts + BEAT * 0.75)
        place(music, bass(root, BEAT * 0.45), ts, 0.8)
        if b % 4 == 0:
            place(music, pad([x * 2 for x in triad], BEAT * 4), ts)

    place(sfx, ding(), 0.05, 0.45)
    place(sfx, impact(), t(LOSE), 0.8)
    for i in range(6):
        place(sfx, click(), t(LOSE) + 0.04 * i, 0.35)
    for f in (FOLLOWERS, PHOTOS, CLIENTS):
        place(sfx, pop(520), t(f), 0.55)
    place(sfx, riser(0.6), t(SHOP) - 0.6, 0.35)
    place(sfx, whoosh(), t(SHOP) - 0.15, 0.6)
    place(sfx, ding(), t(OWNS), 0.4)
    for f in (SITE, CRM, ORDERS):
        place(sfx, pop(1100), t(f), 0.55)
    place(sfx, whoosh(0.4), t(DOWN) - 0.12, 0.5)
    place(sfx, kaching(), t(SELL + 4), 0.8)
    place(sfx, whoosh(), t(CTA) - 0.2, 0.6)
    for i in range(8):
        place(sfx, click(), t(CTA + 8 + i * 3), 0.3)
    place(sfx, whoosh(0.4, up=False), t(LOOP), 0.5)
    return music[:n], sfx[:n]


if __name__ == "__main__":
    music, sfx = build()
    v = load_voice()
    voice = np.zeros_like(music)
    voice[: min(len(v), len(voice))] = v[: len(voice)]
    out = os.path.join(HERE, "..", "public", "audio")
    write(os.path.join(out, "episode7_full.wav"), master(duck(music, voice) * 0.45 + sfx * 0.55 + voice * 1.1, 0.92))
    write(os.path.join(out, "episode7_voice.wav"), master(sfx * 0.5 + voice * 1.1, 0.92))
    print("ok")

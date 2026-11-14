"""Music + effects for the two text-only videos of src/flownova/Wednesday.tsx (no voice):
public/audio/flownova_styles.wav ("FlownovaStyles") and public/audio/flownova_vs.wav ("FlownovaVsShopify").
In TikTok they can be replaced by a trending sound.

Usage: python3 audio/make_audio_flownova_wed.py
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from make_audio import BEAT, SR, bass, chord, clap, click, ding, hat, impact, kick, master, pad, place, pop, riser, whoosh, write  # noqa: E402
from make_audio_premium import kaching  # noqa: E402

FPS = 30
TOTAL = 450
DUR = TOTAL / FPS
LOOP = TOTAL - 15
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "audio")


def t(frame):
    return frame / FPS


def beat():
    n = int(DUR * SR)
    music = np.zeros(n + SR)
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
    return music[:n], np.zeros(n)


def styles():
    music, sfx = beat()
    place(sfx, whoosh(0.4), 0, 0.5)
    for start in (75, 225):  # each compare scene: slider sweeps right→left, then back to half
        place(sfx, whoosh(0.3), t(start) - 0.1, 0.5)
        place(sfx, whoosh(1.2), t(start + 12), 0.7)
        place(sfx, ding(), t(start + 50), 0.6)
        place(sfx, whoosh(0.9, up=False), t(start + 80), 0.5)
    place(sfx, impact(), t(375), 0.7)
    place(sfx, pop(880), t(381), 0.6)
    place(sfx, pop(1040), t(389), 0.6)
    place(sfx, whoosh(0.4, up=False), t(LOOP), 0.5)
    return music, sfx


def versus():
    music, sfx = beat()
    place(sfx, impact(), 0.05, 0.6)
    place(sfx, whoosh(0.3), t(75) - 0.1, 0.5)
    for i in range(5):  # one row every 40 frames
        place(sfx, pop(880 + i * 60), t(75 + 14 + i * 40), 0.6)
    place(sfx, riser(1.0), t(330) - 1.0, 0.5)
    place(sfx, impact(), t(330), 0.8)
    place(sfx, kaching(), t(370), 0.8)
    place(sfx, whoosh(0.4, up=False), t(LOOP), 0.5)
    return music, sfx


if __name__ == "__main__":
    for name, fn in (("flownova_styles.wav", styles), ("flownova_vs.wav", versus)):
        music, sfx = fn()
        write(os.path.join(OUT, name), master(music * 0.55 + sfx * 0.6, 0.92))
    print("ok")

"""Music + effects for "FlownovaSigns" (src/flownova/Signs.tsx): 15 s text-only video, no voice.
Outputs public/audio/flownova_signs.wav. In TikTok, it can be replaced by a trending sound.

Usage: python3 audio/make_audio_flownova_signs.py
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
SIGN1, SIGN2, SIGN3, SOLUTION, CTA = 75, 150, 225, 300, 390  # scene starts, mirrored from Signs.tsx
LOOP = TOTAL - 15


def t(frame):
    return frame / FPS


def build():
    n = int(DUR * SR)
    music = np.zeros(n + SR)
    sfx = np.zeros(n + SR)
    minor = [(110.0, [220.0, 261.63, 329.63]), (82.41, [164.81, 196.0, 246.94])]
    major = [(110.0, [220.0, 261.63, 329.63]), (87.31, [174.61, 220.0, 261.63]),
             (130.81, [196.0, 261.63, 329.63]), (98.0, [196.0, 246.94, 293.66])]
    for b in range(int(DUR / BEAT)):
        ts = b * BEAT
        lift = ts >= t(SOLUTION)
        root, triad = (major if lift else minor)[(b // 4) % (4 if lift else 2)]
        place(music, kick(), ts)
        place(music, hat(), ts + BEAT / 2, 0.8)
        if b % 4 in (1, 3):
            place(music, clap(), ts, 0.8)
        if lift:
            place(music, chord(triad, 0.25), ts + BEAT * 0.75)
        place(music, bass(root, BEAT * 0.45), ts, 0.8)
        if b % 4 == 0:
            place(music, pad([x * 2 for x in triad], BEAT * 4), ts)

    place(sfx, whoosh(0.4), 0, 0.5)
    for start in (SIGN1, SIGN2, SIGN3):
        place(sfx, whoosh(0.3), t(start) - 0.1, 0.6)
        place(sfx, impact(), t(start), 0.5)
    for i in range(6):  # DMs popping
        place(sfx, pop(990 + (i % 3) * 70), t(SIGN1 + 8 + i * 7), 0.45)
    for i in range(4):  # pen strokes
        place(sfx, click(), t(SIGN2 + 6 + i * 13), 0.35)
    place(sfx, impact(), t(SIGN3 + 30), 0.7)
    place(sfx, riser(1.0), t(SOLUTION) - 1.0, 0.5)
    place(sfx, ding(), t(SOLUTION + 2), 0.7)
    for i in range(3):
        place(sfx, pop(880), t(SOLUTION + 18 + i * 10), 0.5)
    place(sfx, kaching(), t(SOLUTION + 56), 0.8)
    place(sfx, whoosh(), t(CTA) - 0.2, 0.6)
    for i in range(8):
        place(sfx, click(), t(CTA + 14 + i * 3), 0.3)
    place(sfx, pop(1300), t(CTA + 40), 0.6)
    place(sfx, whoosh(0.4, up=False), t(LOOP), 0.5)
    return music[:n], sfx[:n]


if __name__ == "__main__":
    music, sfx = build()
    write(os.path.join(os.path.dirname(__file__), "..", "public", "audio", "flownova_signs.wav"), master(music * 0.55 + sfx * 0.6, 0.92))
    print("ok")

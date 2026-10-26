"""Soundtrack for "FlownovaExplainer" (src/flownova/timeline.ts): a 120 BPM beat that turns
minor and sparse during the problem (Amira's inbox / notebook) and lifts when Flownova arrives,
plus sound effects on the animation frames.

Outputs public/audio/flownova_music.wav. When a recorded voice-over exists at
public/audio/flownova/voice.mp3 (timed on SUBS in timeline.ts), also writes
public/audio/flownova_full.wav with the music ducked under it (render with props {"voice": true}).

Usage: python3 audio/make_audio_flownova.py
"""
import os
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from make_audio import (  # noqa: E402
    BEAT, SR, bass, chord, clap, click, ding, hat, impact, kick, master, pad, place, pop, riser, whoosh, write,
)
from make_audio_premium import kaching  # noqa: E402
from make_audio_premium15 import duck  # noqa: E402

FPS = 30
TOTAL = 2400
DUR = TOTAL / FPS
HERE = os.path.dirname(__file__)
VOICE = os.path.join(HERE, "..", "public", "audio", "flownova", "voice.mp3")

# Scene starts (absolute frames), mirrored from timeline.ts.
STORY, CHAOS, SOLUTION, STORE, ORDERS, PAY, DASH, AFTER, FAQ, CTA = 150, 420, 660, 840, 1050, 1260, 1440, 1650, 1860, 2190
LOOP = TOTAL - 20


def t(frame):
    return frame / FPS


def build():
    n = int(DUR * SR)
    music = np.zeros(n + SR)
    sfx = np.zeros(n + SR)
    major = [(110.0, [220.0, 261.63, 329.63]), (87.31, [174.61, 220.0, 261.63]),
             (130.81, [196.0, 261.63, 329.63]), (98.0, [196.0, 246.94, 293.66])]
    minor = [(110.0, [220.0, 261.63, 329.63]), (82.41, [164.81, 196.0, 246.94]),
             (87.31, [174.61, 220.0, 261.63]), (82.41, [164.81, 207.65, 246.94])]
    for b in range(int(DUR / BEAT)):
        ts = b * BEAT
        f = ts * FPS
        problem = t(STORY) <= ts < t(SOLUTION)
        root, triad = (minor if problem else major)[(b // 4) % 4]
        place(music, kick(), ts, 0.7 if problem else 1.0)
        if not problem:
            place(music, hat(), ts + BEAT / 2)
            if b % 4 in (1, 3):
                place(music, clap(), ts, 0.8)
            place(music, chord(triad, 0.25), ts + BEAT * 0.75)
        place(music, bass(root, BEAT * 0.45), ts, 0.8)
        if b % 4 == 0:
            place(music, pad([x * 2 for x in triad], BEAT * 4), ts, 1.2 if problem else 1.0)
        if f >= LOOP:
            break

    place(sfx, whoosh(0.4), 0, 0.5)
    place(sfx, whoosh(0.35), t(STORY) - 0.1, 0.5)
    for i in range(14):  # incoming DMs
        place(sfx, pop(990 + (i % 3) * 60), t(STORY + 40 + i * 16), 0.45)
    place(sfx, whoosh(0.35, up=False), t(CHAOS) - 0.1, 0.5)
    for i in range(5):  # pen scribbles
        place(sfx, click(), t(CHAOS + 6 + i * 18), 0.35)
    for at in (70, 86, 102):  # missed calls
        place(sfx, ding(), t(CHAOS + at), 0.35)
    place(sfx, impact(), t(CHAOS + 140), 0.8)
    place(sfx, riser(1.2), t(SOLUTION) - 1.2, 0.6)
    place(sfx, impact(), t(SOLUTION), 0.9)
    place(sfx, ding(), t(SOLUTION + 4), 0.6)
    for at in (70, 84):
        place(sfx, pop(880), t(SOLUTION + at), 0.6)
    for start in (STORE, ORDERS, PAY, DASH):  # step number spins in
        place(sfx, whoosh(0.3), t(start) - 0.1, 0.55)
        place(sfx, pop(660), t(start + 6), 0.6)
    place(sfx, pop(1200), t(STORE + 102), 0.6)
    place(sfx, ding(), t(STORE + 126), 0.6)
    place(sfx, click(), t(ORDERS + 96), 0.8)
    place(sfx, pop(1100), t(ORDERS + 98), 0.6)
    place(sfx, ding(), t(ORDERS + 112), 0.7)
    for at in (14, 34, 54, 74):
        place(sfx, pop(880), t(PAY + at), 0.55)
    place(sfx, impact(), t(PAY + 110), 0.7)
    place(sfx, kaching(), t(DASH + 60), 0.6)
    place(sfx, whoosh(0.35), t(AFTER) - 0.1, 0.5)
    for i in range(4):
        place(sfx, pop(1000 + i * 80), t(AFTER + 22 + i * 16), 0.5)
    place(sfx, kaching(), t(AFTER + 110), 0.6)
    place(sfx, whoosh(0.35), t(FAQ) - 0.1, 0.5)
    place(sfx, kaching(), t(FAQ + 70), 0.8)
    place(sfx, pop(880), t(FAQ + 90), 0.5)
    place(sfx, pop(880), t(FAQ + 120), 0.5)
    place(sfx, whoosh(0.4), t(FAQ + 165), 0.6)
    place(sfx, click(), t(FAQ + 250), 0.8)
    place(sfx, whoosh(0.3), t(FAQ + 258), 0.5)
    place(sfx, ding(), t(FAQ + 284), 0.7)
    place(sfx, impact(), t(CTA + 2), 0.7)
    for i in range(8):  # typing "Flownova"
        place(sfx, click(), t(CTA + 107 + i * 3), 0.3)
    place(sfx, pop(1300), t(CTA + 140), 0.6)
    place(sfx, whoosh(0.5, up=False), t(LOOP), 0.5)
    return music[:n], sfx[:n]


def load_voice():
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", VOICE, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
        capture_output=True, check=True,
    ).stdout
    v = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768
    return v / (np.max(np.abs(v)) + 1e-9) * 0.9


if __name__ == "__main__":
    music, sfx = build()
    out = os.path.join(HERE, "..", "public", "audio")
    write(os.path.join(out, "flownova_music.wav"), master(music * 0.5 + sfx * 0.6, 0.92))
    if os.path.exists(VOICE):
        v = load_voice()
        voice = np.zeros_like(music)
        voice[: min(len(v), len(voice))] = v[: len(voice)]
        write(os.path.join(out, "flownova_full.wav"), master(duck(music, voice) * 0.45 + sfx * 0.55 + voice * 1.1, 0.92))
    print("ok")

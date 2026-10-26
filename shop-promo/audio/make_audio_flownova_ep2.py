"""Mix for "FlownovaEp2" (src/flownova/ep2.ts): ElevenLabs darija voice-over
(public/audio/flownova/ep2-voice.mp3) over a ducked 120 BPM beat, with sound effects on the
animation frames. Outputs public/audio/flownova_ep2_full.wav and flownova_ep2_voice.wav
(voice + effects only, to add a trending sound in TikTok).

Usage: python3 audio/make_audio_flownova_ep2.py
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
TOTAL = 780
DUR = TOTAL / FPS
HERE = os.path.dirname(__file__)

# Scene starts (absolute frames), mirrored from ep2.ts.
BEFORE, BUILD, ORDER, CTA = 128, 272, 405, 608
LOOP = TOTAL - 20


def t(frame):
    return frame / FPS


def load_voice():
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", os.path.join(HERE, "..", "public", "audio", "flownova", "ep2-voice.mp3"),
         "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
        capture_output=True, check=True,
    ).stdout
    v = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768
    return v / (np.max(np.abs(v)) + 1e-9) * 0.9


def build():
    n = int(DUR * SR)
    music = np.zeros(n + SR)
    sfx = np.zeros(n + SR)
    major = [(110.0, [220.0, 261.63, 329.63]), (87.31, [174.61, 220.0, 261.63]),
             (130.81, [196.0, 261.63, 329.63]), (98.0, [196.0, 246.94, 293.66])]
    minor = [(110.0, [220.0, 261.63, 329.63]), (82.41, [164.81, 196.0, 246.94])]
    for b in range(int(DUR / BEAT)):
        ts = b * BEAT
        problem = t(BEFORE) <= ts < t(BUILD)
        root, triad = (minor if problem else major)[(b // 4) % (2 if problem else 4)]
        place(music, kick(), ts, 0.7 if problem else 1.0)
        if not problem:
            place(music, hat(), ts + BEAT / 2)
            if b % 4 in (1, 3):
                place(music, clap(), ts, 0.8)
            place(music, chord(triad, 0.25), ts + BEAT * 0.75)
        place(music, bass(root, BEAT * 0.45), ts, 0.8)
        if b % 4 == 0:
            place(music, pad([x * 2 for x in triad], BEAT * 4), ts)
        if ts * FPS >= LOOP:
            break

    place(sfx, whoosh(0.4), 0, 0.5)
    place(sfx, whoosh(0.35, up=False), t(BEFORE) - 0.1, 0.5)
    for i in range(4):  # waiting DMs
        place(sfx, pop(990 - i * 60), t(BEFORE + 40 + i * 14), 0.5)
    place(sfx, riser(0.8), t(BUILD) - 0.8, 0.5)
    place(sfx, whoosh(0.9), t(BUILD + 4), 0.8)      # wipe Instagram → shop
    place(sfx, ding(), t(BUILD + 40), 0.6)
    place(sfx, pop(880), t(BUILD + 50), 0.6)        # name
    place(sfx, pop(1040), t(BUILD + 70), 0.6)       # colors
    place(sfx, impact(), t(BUILD + 100), 0.6)       # app icon
    place(sfx, whoosh(0.3), t(ORDER) - 0.1, 0.5)
    for at in (30, 64, 86):                         # taps: bio link, size, buy
        place(sfx, click(), t(ORDER + at), 0.8)
    for at in (40, 92):                             # screens slide in
        place(sfx, whoosh(0.25), t(ORDER + at - 4), 0.4)
    for f in range(ORDER + 26, ORDER + 128, 10):    # stopwatch ticks
        place(sfx, click(), t(f), 0.2)
    place(sfx, ding(), t(ORDER + 128), 0.8)         # success, under a minute
    place(sfx, kaching(), t(ORDER + 156), 0.8)      # order notification
    place(sfx, whoosh(), t(CTA) - 0.2, 0.6)
    place(sfx, impact(), t(CTA + 2), 0.6)
    for i in range(8):                               # typing "Flownova"
        place(sfx, click(), t(CTA + 60 + i * 3), 0.3)
    place(sfx, pop(1300), t(CTA + 112), 0.6)
    place(sfx, whoosh(0.5, up=False), t(LOOP), 0.5)
    return music[:n], sfx[:n]


if __name__ == "__main__":
    music, sfx = build()
    v = load_voice()
    voice = np.zeros_like(music)
    voice[: min(len(v), len(voice))] = v[: len(voice)]
    out = os.path.join(HERE, "..", "public", "audio")
    write(os.path.join(out, "flownova_ep2_full.wav"), master(duck(music, voice) * 0.45 + sfx * 0.55 + voice * 1.1, 0.92))
    write(os.path.join(out, "flownova_ep2_voice.wav"), master(sfx * 0.5 + voice * 1.1, 0.92))
    print("ok")

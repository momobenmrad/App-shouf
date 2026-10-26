"""Mix for "Episode1" (src/episode1/timeline.ts): ElevenLabs voice-over
(public/audio/voice/episode1.mp3) over a ducked 120 BPM beat, with sound effects on the frames of
the animations. Outputs public/audio/episode1_full.wav and public/audio/episode1_voice.wav
(voice + effects only, to add a trending sound in TikTok).

Usage: python3 audio/make_audio_episode1.py
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
TOTAL = 420
DUR = TOTAL / FPS
HERE = os.path.dirname(__file__)

# Absolute frames, mirrored from src/episode1/timeline.ts.
NOSUB, APP, PRICE, PAY, CTA, LOOP = 87, 119, 168, 220, 315, 392
APP_TAP = APP + 18
PRICE_DONE = PRICE + 34
PAY_KONNECT, PAY_FLOUCI, PAY_INCLUDED = PAY + 32, PAY + 42, PAY + 67


def t(frame):
    return frame / FPS


def load_voice():
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", os.path.join(HERE, "..", "public", "audio", "voice", "episode1.mp3"),
         "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
        capture_output=True, check=True,
    ).stdout
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
        place(music, hat(), ts + BEAT / 2)
        if b % 4 in (1, 3):
            place(music, clap(), ts, 0.8)
        place(music, bass(root, BEAT * 0.45), ts, 0.8)
        place(music, chord(triad, 0.25), ts + BEAT * 0.75)
        if b % 4 == 0:
            place(music, pad([f * 2 for f in triad], BEAT * 4), ts)

    place(sfx, whoosh(0.4), 0, 0.5)                  # motion from the first frame
    place(sfx, impact(), t(NOSUB))                    # "SANS" slam
    place(sfx, whoosh(0.3, up=False), t(NOSUB + 6), 0.5)  # strike-through
    place(sfx, whoosh(0.3), t(APP) - 0.12, 0.5)
    place(sfx, click(), t(APP_TAP))
    place(sfx, whoosh(0.35), t(APP_TAP + 3), 0.6)    # app opens
    place(sfx, ding(), t(APP + 27), 0.5)              # "clé en main"
    place(sfx, riser(t(PRICE_DONE - PRICE)), t(PRICE), 0.6)
    place(sfx, kaching(), t(PRICE_DONE), 0.8)         # 690 lands
    for f in (PAY + 2, PAY_KONNECT, PAY_FLOUCI):
        place(sfx, pop(880), t(f), 0.6)
    place(sfx, ding(), t(PAY_INCLUDED), 0.7)
    place(sfx, whoosh(), t(CTA) - 0.2, 0.6)
    place(sfx, impact(), t(CTA + 2), 0.6)
    for f in (CTA + 10, CTA + 16, CTA + 22):
        place(sfx, pop(780), t(f), 0.45)
    place(sfx, whoosh(0.5, up=False), t(LOOP), 0.5)
    return music[:n], sfx[:n]


if __name__ == "__main__":
    music, sfx = build()
    v = load_voice()
    voice = np.zeros_like(music)
    voice[: min(len(v), len(voice))] = v[: len(voice)]
    out = os.path.join(HERE, "..", "public", "audio")
    write(os.path.join(out, "episode1_full.wav"), master(duck(music, voice) * 0.45 + sfx * 0.55 + voice * 1.1, 0.92))
    write(os.path.join(out, "episode1_voice.wav"), master(sfx * 0.5 + voice * 1.1, 0.92))
    print("ok")

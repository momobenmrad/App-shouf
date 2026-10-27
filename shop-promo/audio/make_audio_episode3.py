"""Mix for "Episode3" (src/episode3/timeline.ts): French ElevenLabs voice-over
(public/audio/voice/episode3.mp3) over a quiet night pad that turns into a beat at sunrise, with
notification dings on the orders. Outputs public/audio/episode3_full.wav and episode3_voice.wav
(voice + effects only, to add a trending sound in TikTok).

Usage: python3 audio/make_audio_episode3.py
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
TOTAL = 450
DUR = TOTAL / FPS
HERE = os.path.dirname(__file__)
ORDERS, DING, STOCK, MAIL, MORNING, OFFER, CTA = 114, 178, 196, 224, 255, 308, 401  # mirrored from timeline.ts
ORDER_DINGS = (DING - 4, MAIL + 10, MORNING - 8)  # the three lock-screen notifications
LOOP = TOTAL - 15


def t(frame):
    return frame / FPS


def load_voice():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(HERE, "..", "public", "audio", "voice", "episode3.mp3"),
                          "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    v = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768
    return v / (np.max(np.abs(v)) + 1e-9) * 0.9


def build():
    n = int(DUR * SR)
    music = np.zeros(n + SR)
    sfx = np.zeros(n + SR)
    night = [(110.0, [220.0, 261.63, 329.63]), (87.31, [174.61, 220.0, 261.63])]
    day = [(110.0, [220.0, 261.63, 329.63]), (87.31, [174.61, 220.0, 261.63]),
           (130.81, [196.0, 261.63, 329.63]), (98.0, [196.0, 246.94, 293.66])]
    for b in range(int(DUR / BEAT)):
        ts = b * BEAT
        awake = ts >= t(MORNING)
        root, triad = (day if awake else night)[(b // 4) % (4 if awake else 2)]
        if ts >= t(ORDERS):
            place(music, kick(), ts, 1.0 if awake else 0.6)
        if awake:
            place(music, hat(), ts + BEAT / 2, 0.8)
            if b % 4 in (1, 3):
                place(music, clap(), ts, 0.8)
            place(music, chord(triad, 0.25), ts + BEAT * 0.75)
        place(music, bass(root, BEAT * 0.45), ts, 0.7)
        if b % 4 == 0:
            place(music, pad([x * 2 for x in triad], BEAT * 4), ts, 1.2 if not awake else 1.0)

    for f in ORDER_DINGS:
        place(sfx, ding(), t(f), 0.8)
    place(sfx, pop(1100), t(STOCK), 0.6)
    place(sfx, pop(1250), t(MAIL), 0.6)
    place(sfx, riser(0.8), t(MORNING) - 0.8, 0.4)
    place(sfx, kaching(), t(MORNING + 20), 0.7)
    place(sfx, whoosh(), t(OFFER) - 0.2, 0.6)
    place(sfx, impact(), t(OFFER + 4), 0.7)
    place(sfx, pop(1300), t(CTA), 0.6)
    place(sfx, whoosh(0.4, up=False), t(LOOP), 0.5)
    return music[:n], sfx[:n]


if __name__ == "__main__":
    music, sfx = build()
    v = load_voice()
    voice = np.zeros_like(music)
    voice[: min(len(v), len(voice))] = v[: len(voice)]
    out = os.path.join(HERE, "..", "public", "audio")
    write(os.path.join(out, "episode3_full.wav"), master(duck(music, voice) * 0.45 + sfx * 0.55 + voice * 1.1, 0.92))
    write(os.path.join(out, "episode3_voice.wav"), master(sfx * 0.5 + voice * 1.1, 0.92))
    print("ok")

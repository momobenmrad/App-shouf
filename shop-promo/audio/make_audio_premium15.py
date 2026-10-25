"""Mix for "BoutiquePremium15" (src/premium15/timeline.ts): ElevenLabs voice-over
(public/audio/voice/take1.mp3) on top of a ducked 120 BPM beat and sound effects placed on the
same frames as the animations. Outputs:
  public/audio/premium15_full.wav     voice + beat + sound effects
  public/audio/premium15_voice.wav    voice + sound effects (add a trending sound in TikTok)

Usage: python3 audio/make_audio_premium15.py
"""
import os
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from make_audio import (  # noqa: E402
    BEAT, SR, bass, chord, clap, click, ding, hat, impact, kick, master, pad, place, pop, riser, whoosh, write,
)
from make_audio_premium import kaching, rewind  # noqa: E402

FPS = 30
TOTAL = 450
DUR = TOTAL / FPS
HERE = os.path.dirname(__file__)

# Absolute frames (scene start + local frame), mirrored from src/premium15/timeline.ts.
HOOK_CLOSE_END, HOOK_PUNCH = 48, 73
REVEAL_START, REVEAL_FLASH = 103 + 5, 103 + 49
CART_TAP, COD_TAP = 180 + 8, 180 + 36
ORDERS = [245 + f for f in (12, 28, 36, 43, 49, 54, 58, 62)]
CTA, LOOP = 312, 420


def t(frame):
    return frame / FPS


def load_voice():
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", os.path.join(HERE, "..", "public", "audio", "voice", "take1.mp3"),
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
        full = ts >= t(REVEAL_FLASH)
        place(music, kick(), ts, 1.0 if full else 0.6)
        place(music, hat(), ts + BEAT / 2)
        if full and b % 4 in (1, 3):
            place(music, clap(), ts, 0.8)
        place(music, bass(root, BEAT * 0.45), ts, 0.8)
        if full:
            place(music, chord(triad, 0.25), ts + BEAT * 0.75)
        if b % 4 == 0:
            place(music, pad([f * 2 for f in triad], BEAT * 4), ts)
    place(music, riser(t(REVEAL_FLASH - REVEAL_START)), t(REVEAL_START), 0.8)

    place(sfx, impact(), 0, 0.5)
    place(sfx, whoosh(0.35), t(30) - 0.1, 0.5)
    place(sfx, impact(), t(HOOK_CLOSE_END + 2), 0.7)     # "AVANT" stamp
    place(sfx, rewind(0.25), t(HOOK_PUNCH), 0.4)
    place(sfx, whoosh(0.6), t(REVEAL_START), 0.5)
    place(sfx, impact(), t(REVEAL_FLASH), 0.9)
    place(sfx, whoosh(0.3), t(180) - 0.15, 0.5)
    place(sfx, click(), t(CART_TAP))
    place(sfx, pop(1046), t(CART_TAP + 2), 0.6)
    place(sfx, click(), t(COD_TAP))
    place(sfx, ding(), t(COD_TAP + 3), 0.6)
    place(sfx, whoosh(0.3), t(245) - 0.15, 0.5)
    for i, f in enumerate(ORDERS):
        place(sfx, kaching(), t(f), 0.8 - 0.03 * i)
    place(sfx, whoosh(), t(CTA) - 0.2, 0.6)
    place(sfx, pop(780), t(CTA + 24), 0.5)
    place(sfx, pop(880), t(CTA + 32), 0.5)
    place(sfx, whoosh(0.5, up=False), t(LOOP), 0.5)
    return music[:n], sfx[:n]


def duck(music, voice, depth=0.3):
    """Lower the beat while the voice speaks (smoothed envelope follower)."""
    win = int(0.05 * SR)
    env = np.convolve(np.abs(voice), np.ones(win) / win, mode="same")
    env = np.clip(env / (np.max(env) + 1e-9) * 6, 0, 1)
    smooth = np.convolve(env, np.ones(int(0.15 * SR)) / int(0.15 * SR), mode="same")
    return music * (1 - (1 - depth) * smooth)


if __name__ == "__main__":
    music, sfx = build()
    v = load_voice()
    voice = np.zeros_like(music)
    voice[: min(len(v), len(voice))] = v[: len(voice)]
    out = os.path.join(HERE, "..", "public", "audio")
    write(os.path.join(out, "premium15_full.wav"), master(duck(music, voice) * 0.45 + sfx * 0.55 + voice * 1.1, 0.92))
    write(os.path.join(out, "premium15_voice.wav"), master(sfx * 0.5 + voice * 1.1, 0.92))
    print("ok")

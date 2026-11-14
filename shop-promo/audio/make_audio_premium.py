"""Soundtrack for the "BoutiquePremium" video (src/premium/timeline.ts): a 120 BPM beat that
drops on the before/after reveal, thins out under the order notifications so each synthesised
cash-register "ka-ching" lands, then comes back for the comparison and the call to action.
Reuses the instruments of make_audio.py. Outputs public/audio/premium_music_sfx.wav and
public/audio/premium_sfx_only.wav.

Usage: python3 audio/make_audio_premium.py
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from make_audio import (  # noqa: E402
    BEAT, SR, bass, chord, clap, click, ding, hat, highpass, impact, kick, lowpass, master,
    pad, place, pop, rng, riser, whoosh, write,
)

FPS = 30
TOTAL = 750
DUR = TOTAL / FPS

# Scene starts and in-scene events (must match src/premium/timeline.ts).
REVEAL, PROOFS, ORDERS, COMPARE, CTA = 60, 180, 330, 510, 630
SLIDE_START, SLIDE_END, REVEAL_FLASH = 12, 84, 90
ORDER_FRAMES = [24, 45, 60, 72, 82, 90, 97, 103, 108, 113, 117, 121]


def t(frame):
    return frame / FPS


def kaching():
    """Cash register: drawer thunk + two bright inharmonic bells + coin shimmer."""
    n = int(0.9 * SR)
    tt = np.arange(n) / SR
    thunk = lowpass(rng.standard_normal(n), 900) * np.exp(-tt / 0.02) * 0.5
    bell = np.zeros(n)
    for start, freqs in ((0.03, (2093, 3136, 4186 * 1.01)), (0.12, (2637, 3951, 5274 * 1.02))):
        k = int(start * SR)
        seg = tt[: n - k]
        bell[k:] += sum(a * np.sin(2 * np.pi * f * seg) for f, a in zip(freqs, (0.5, 0.3, 0.18))) * np.exp(-seg / 0.28)
    shimmer = highpass(rng.standard_normal(n), 6000) * np.exp(-np.clip(tt - 0.1, 0, None) / 0.15) * (tt > 0.1) * 0.12
    return (thunk + bell + shimmer) * 0.55


def rewind(length=0.3):
    """Tape-rewind: descending chirp with flutter."""
    n = int(length * SR)
    tt = np.arange(n) / SR
    f = np.linspace(1800, 300, n) * (1 + 0.08 * np.sin(2 * np.pi * 38 * tt))
    sig = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.25
    return lowpass(sig, 3000) * np.sin(np.pi * tt / length)


def build():
    n = int(DUR * SR) + SR
    music = np.zeros(n)
    sfx = np.zeros(n)
    prog = [
        (110.0, [220.0, 261.63, 329.63]),   # Am
        (87.31, [174.61, 220.0, 261.63]),   # F
        (130.81, [196.0, 261.63, 329.63]),  # C
        (98.0, [196.0, 246.94, 293.66]),    # G
    ]
    drop = t(REVEAL + REVEAL_FLASH)
    beats = int(DUR / BEAT)
    for b in range(beats):
        ts = b * BEAT
        root, triad = prog[(b // 4) % 4]
        in_orders = t(ORDERS) <= ts < t(COMPARE)
        before_drop = ts < drop
        if before_drop:
            # Intro: muted pulse and hats only, tension before the reveal.
            place(music, hat(), ts + BEAT / 2, 0.6)
            if ts >= t(REVEAL):
                place(music, kick(), ts, 0.5)
            place(music, bass(root, BEAT * 0.4), ts, 0.4)
        elif in_orders:
            # Thinner groove so the ka-chings stand out.
            place(music, kick(), ts, 0.55)
            place(music, hat(), ts + BEAT / 2, 0.7)
            place(music, bass(root, BEAT * 0.45), ts, 0.6)
        else:
            place(music, kick(), ts)
            if b % 4 in (1, 3):
                place(music, clap(), ts)
            place(music, hat(), ts + BEAT / 2)
            if b % 2:
                place(music, hat(open_=True), ts + BEAT / 2, 0.6)
            place(music, bass(root, BEAT * 0.45), ts)
            place(music, bass(root * 2 if b % 2 else root, BEAT * 0.3), ts + BEAT / 2, 0.7)
            place(music, chord(triad, 0.25), ts + BEAT * 0.75)
        if b % 4 == 0:
            place(music, pad([f * 2 for f in triad], BEAT * 4), ts, 1.2 if before_drop else 1.0)

    # Hook: flash of the result, rewind, thud on the ugly "before" + stamp.
    place(sfx, whoosh(0.3), 0, 0.6)
    place(sfx, rewind(), t(10), 0.9)
    place(sfx, impact(), t(18), 0.9)
    # Reveal: riser along the slider, boom + whoosh on the flash.
    place(music, riser(t(SLIDE_END - SLIDE_START)), t(REVEAL + SLIDE_START), 0.9)
    place(sfx, whoosh(0.6), t(REVEAL + SLIDE_START), 0.5)
    place(sfx, impact(), drop)
    # Proofs: whoosh per proof, taps, success ding.
    for f in (PROOFS, PROOFS + 50, PROOFS + 100):
        place(sfx, whoosh(0.35), t(f) - 0.18, 0.6)
    for f in (PROOFS + 50 + 12, PROOFS + 50 + 28, PROOFS + 100 + 26):
        place(sfx, click(), t(f))
    place(sfx, pop(1046), t(PROOFS + 50 + 30), 0.7)
    place(sfx, ding(), t(PROOFS + 100 + 30), 0.8)
    # Orders: a ka-ching per notification (slightly varied), vibration buzz under it.
    for i, f in enumerate(ORDER_FRAMES):
        place(sfx, kaching(), t(ORDERS + f), 0.95 - 0.02 * i)
        buzz_n = int(0.18 * SR)
        bt = np.arange(buzz_n) / SR
        place(sfx, np.sin(2 * np.pi * 150 * bt) * np.sign(np.sin(2 * np.pi * 30 * bt)) * 0.12, t(ORDERS + f))
    # Compare: pops on each row, whoosh on the second card.
    for f in (10, 18, 26):
        place(sfx, pop(520), t(COMPARE + f), 0.5)
    place(sfx, whoosh(0.4), t(COMPARE + 40) - 0.2, 0.6)
    for f in (48, 56, 64):
        place(sfx, pop(900), t(COMPARE + f), 0.6)
    # CTA: impact + ding, chips pop.
    place(sfx, whoosh(), t(CTA) - 0.25, 0.7)
    place(sfx, impact(), t(CTA + 6), 0.8)
    place(sfx, ding(), t(CTA + 20), 0.7)
    for f in (30, 38):
        place(sfx, pop(780), t(CTA + f), 0.5)
    return music[: int(DUR * SR)], sfx[: int(DUR * SR)]


if __name__ == "__main__":
    music, sfx = build()
    root = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
    write(os.path.join(root, "premium_music_sfx.wav"), master(music * 0.7 + sfx))
    write(os.path.join(root, "premium_sfx_only.wav"), master(sfx, 0.8))
    print("ok")

"""Synthesises the soundtrack: a 120 BPM beat locked to the video cuts, plus sound effects
placed on the exact frames of the animations. Everything is generated, so there is no
copyright issue. Outputs public/audio/music_sfx.wav and public/audio/sfx_only.wav.

Usage: python3 audio/make_audio.py
"""
import os
import wave

import numpy as np

SR = 44100
FPS = 30
TOTAL_FRAMES = 870
DUR = TOTAL_FRAMES / FPS
BEAT = 0.5  # 120 BPM: one beat = 15 frames
rng = np.random.default_rng(7)


def t_of(frame):
    return frame / FPS


def env(n, attack=0.002, decay=0.2):
    t = np.arange(n) / SR
    a = np.clip(t / attack, 0, 1)
    return a * np.exp(-t / decay)


def lowpass(x, cutoff):
    # one-pole low-pass, cheap and good enough for synth colouring
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


def place(buf, sig, start_s, gain=1.0):
    i = int(start_s * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


# ------------------------------------------------------------------ instruments

def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    freq = 45 + 110 * np.exp(-t / 0.035)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    click = rng.standard_normal(n) * np.exp(-t / 0.002) * 0.3
    return (np.sin(phase) * np.exp(-t / 0.16) + click) * 0.95


def clap():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    noise = highpass(rng.standard_normal(n), 900)
    bursts = sum(np.exp(-np.clip(t - d, 0, None) / 0.008) * (t >= d) for d in (0, 0.011, 0.022))
    return noise * (bursts * 0.5 + np.exp(-t / 0.09) * 0.6) * 0.45


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    t = np.arange(n) / SR
    return highpass(rng.standard_normal(n), 7000) * np.exp(-t / (0.06 if open_ else 0.012)) * 0.22


def bass(freq, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    saw = 2 * ((t * freq) % 1) - 1
    sub = np.sin(2 * np.pi * freq * t)
    sig = lowpass(saw * 0.5, 380) + sub * 0.7
    return sig * env(n, 0.005, length * 0.9) * 0.5


def chord(freqs, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    sig = sum(np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) for f in freqs)
    return lowpass(sig, 2500) * env(n, 0.004, 0.18) * 0.09


def pad(freqs, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    sig = sum(np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * 0.3 * t)) for f in freqs)
    fade = np.clip(t / 0.4, 0, 1) * np.clip((length - t) / 0.4, 0, 1)
    return sig * fade * 0.035


# ------------------------------------------------------------------ sound effects

def whoosh(length=0.45, up=True):
    n = int(length * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    cut = np.linspace(400, 6000, n) if up else np.linspace(6000, 400, n)
    out = np.zeros(n)
    acc = 0.0
    for i in range(n):
        a = np.exp(-2 * np.pi * cut[i] / SR)
        acc = (1 - a) * noise[i] + a * acc
        out[i] = acc
    shape = np.sin(np.pi * t / length) ** 2
    return out * shape * 0.9


def click():
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 2200 * t) * 0.5 + rng.standard_normal(n) * 0.3) * np.exp(-t / 0.004) * 0.7


def pop(pitch=880):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    f = pitch * (1 + 1.2 * np.exp(-t / 0.01))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.03) * 0.35


def ding():
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    sig = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, a, d in ((1318.5, 0.5, 0.5), (1975.5, 0.3, 0.35), (2637, 0.15, 0.25)))
    sig2 = np.zeros(n)
    k = int(0.11 * SR)
    sig2[k:] = sum(a * np.sin(2 * np.pi * f * t[: n - k]) * np.exp(-t[: n - k] / d) for f, a, d in ((1760, 0.5, 0.5), (2637, 0.25, 0.3)))
    return (sig + sig2) * 0.35


def impact():
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (40 + 60 * np.exp(-t / 0.08)) * t) * np.exp(-t / 0.35)
    noise = lowpass(rng.standard_normal(n), 1200) * np.exp(-t / 0.12)
    return (boom * 0.9 + noise * 0.4) * 0.8


def riser(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    noise = highpass(rng.standard_normal(n), 1500) * (t / length) ** 2 * 0.35
    tone = np.sin(2 * np.pi * np.cumsum(np.linspace(200, 1200, n)) / SR) * (t / length) ** 3 * 0.12
    return noise + tone


# ------------------------------------------------------------------ arrangement

def build():
    n = int(DUR * SR) + SR
    music = np.zeros(n)
    sfx = np.zeros(n)

    # Chord progression Am – F – C – G, one chord per bar (4 beats).
    prog = [
        (110.0, [220.0, 261.63, 329.63]),
        (87.31, [174.61, 220.0, 261.63]),
        (130.81, [196.0, 261.63, 329.63]),
        (98.0, [196.0, 246.94, 293.66]),
    ]
    drop_start, drop_end = t_of(735), t_of(765)  # build-up before the call to action
    beats = int(DUR / BEAT)
    for b in range(beats):
        ts = b * BEAT
        in_drop = drop_start <= ts < drop_end
        bar = (b // 4) % 4
        root, triad = prog[bar]
        intro = False
        if not in_drop and not intro:
            place(music, kick(), ts)
            if b % 4 in (1, 3):
                place(music, clap(), ts)
            place(music, hat(), ts + BEAT / 2)
            if b % 2 == 1:
                place(music, hat(open_=True), ts + BEAT / 2, 0.6)
            place(music, bass(root, BEAT * 0.45), ts)
            place(music, bass(root * 2 if b % 2 else root, BEAT * 0.3), ts + BEAT / 2, 0.7)
            place(music, chord(triad, 0.25), ts + BEAT * 0.75)
        if b % 4 == 0:
            place(music, pad([f * 2 for f in triad], BEAT * 4), ts)
    place(music, riser(drop_end - drop_start), drop_start)
    
    # Sound effects, on the frames used by the animations (see src/Scenes.tsx).
    place(sfx, impact(), t_of(4))
    for cut in (90, 210, 360, 480, 570, 690):
        place(sfx, whoosh(), t_of(cut) - 0.25, 0.8)
    place(sfx, impact(), t_of(765), 0.9)
    for f in (210 + 60, 210 + 96, 360 + 76):
        place(sfx, click(), t_of(f))
    place(sfx, pop(1046), t_of(210 + 100), 0.8)
    for i in range(4):
        place(sfx, pop(700 + i * 120), t_of(360 + 12 + i * 6), 0.6)
    place(sfx, ding(), t_of(360 + 84))
    for f in (510, 540):
        place(sfx, whoosh(0.25, up=False), t_of(f) - 0.1, 0.5)
        place(sfx, click(), t_of(f))
    for f in (588, 596):
        place(sfx, pop(900), t_of(f), 0.5)
    for i in range(8):
        place(sfx, pop(600 + i * 90), t_of(690 + 6 + i * 5), 0.55)
    place(sfx, ding(), t_of(765 + 18), 0.7)

    return music[: int(DUR * SR)], sfx[: int(DUR * SR)]


def master(x, peak=0.89):
    # gentle saturation + fade-out, then normalise
    x = np.tanh(x * 1.2)
    fade = int(0.6 * SR)
    x[-fade:] *= np.linspace(1, 0, fade)
    return x / (np.max(np.abs(x)) + 1e-9) * peak


def write(path, x):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    stereo = np.column_stack([data, data]).ravel()
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(stereo.tobytes())


if __name__ == "__main__":
    music, sfx = build()
    root = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
    write(os.path.join(root, "music_sfx.wav"), master(music * 0.75 + sfx))
    write(os.path.join(root, "sfx_only.wav"), master(sfx, 0.8))
    print("ok")

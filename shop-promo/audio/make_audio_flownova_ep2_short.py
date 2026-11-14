"""Mix for "FlownovaEp2Short" (src/flownova/Episode2Short.tsx), the 15 s TikTok cut of episode 2.

The voice is four slices of public/audio/flownova/ep2-voice.mp3, cut on its ElevenLabs Scribe word
timestamps (SEGMENTS) and laid on the short timeline; music is ducked under it and effects land on
the animation frames. Outputs public/audio/flownova/ep2-short-voice.wav,
public/audio/flownova_ep2_short_full.wav and flownova_ep2_short_voice.wav (voice + effects only).

Usage: python3 audio/make_audio_flownova_ep2_short.py
"""
import os
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from make_audio import BEAT, SR, bass, chord, clap, click, ding, hat, impact, kick, master, pad, place, pop, whoosh, write  # noqa: E402
from make_audio_premium import kaching  # noqa: E402
from make_audio_premium15 import duck  # noqa: E402

FPS = 30
TOTAL = 450
DUR = TOTAL / FPS
HERE = os.path.dirname(__file__)
AUDIO = os.path.join(HERE, "..", "public", "audio")

# (start, end) in the source take → where the slice starts on the short timeline (seconds).
SEGMENTS = [
    (7.00, 9.05, 0.05),    # "و الكليانات يستناو في الرد"
    (9.15, 13.56, 2.25),   # "Flownova يصنعلها متجر بإسمها و بألوانها… و تطبيق في التليفون"
    (13.58, 18.58, 6.76),  # "توّا الكليانة تدخل من البيو، تختار المقاس، و تكومندي… في أقل من دقيقة!"
    (22.15, 24.30, 12.01), # "اكتب Flownova في الكومنتار"
]
BUILD, ORDER, CTA = 67, 203, 360  # scene starts (frames), mirrored from Episode2Short.tsx
LOOP = TOTAL - 15


def t(frame):
    return frame / FPS


def cut_voice():
    src = os.path.join(AUDIO, "flownova", "ep2-voice.mp3")
    dst = os.path.join(AUDIO, "flownova", "ep2-short-voice.wav")
    parts, labels = [], []
    for i, (a, b, at) in enumerate(SEGMENTS):
        ms = int(at * 1000)
        parts.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,"
                     f"afade=t=out:st={b - a - 0.04:.3f}:d=0.04,adelay={ms}|{ms}[s{i}]")
        labels.append(f"[s{i}]")
    graph = ";".join(parts) + ";" + "".join(labels) + f"amix=inputs={len(SEGMENTS)}:normalize=0,apad,atrim=0:{DUR}[out]"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-filter_complex", graph, "-map", "[out]",
                    "-ac", "1", "-ar", str(SR), dst], check=True)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", dst, "-f", "s16le", "-"], capture_output=True, check=True).stdout
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
        hook = ts < t(BUILD)
        place(music, kick(), ts, 0.7 if hook else 1.0)
        if not hook:
            place(music, hat(), ts + BEAT / 2)
            if b % 4 in (1, 3):
                place(music, clap(), ts, 0.8)
            place(music, chord(triad, 0.25), ts + BEAT * 0.75)
        place(music, bass(root, BEAT * 0.45), ts, 0.8)
        if b % 4 == 0:
            place(music, pad([x * 2 for x in triad], BEAT * 4), ts)

    for f in (2, 14, 26, 38, 50):  # notification pings on the waiting DMs
        place(sfx, pop(1040), t(f), 0.35)
    place(sfx, whoosh(0.8), t(BUILD + 2), 0.8)  # Instagram → shop wipe
    place(sfx, ding(), t(BUILD + 36), 0.6)
    place(sfx, pop(880), t(BUILD + 48), 0.6)
    place(sfx, pop(1040), t(BUILD + 68), 0.6)
    place(sfx, impact(), t(BUILD + 99), 0.6)
    place(sfx, whoosh(0.3), t(ORDER) - 0.1, 0.5)
    for at in (33, 62, 86):  # taps: bio link, size, buy
        place(sfx, click(), t(ORDER + at), 0.8)
    for f in range(ORDER + 24, ORDER + 116, 10):  # stopwatch ticks
        place(sfx, click(), t(f), 0.2)
    place(sfx, ding(), t(ORDER + 116), 0.8)
    place(sfx, kaching(), t(ORDER + 132), 0.8)
    place(sfx, whoosh(), t(CTA) - 0.2, 0.6)
    for i in range(8):  # typing "Flownova"
        place(sfx, click(), t(CTA + 12 + i * 3), 0.3)
    place(sfx, pop(1300), t(CTA + 63), 0.6)
    place(sfx, whoosh(0.4, up=False), t(LOOP), 0.5)
    return music[:n], sfx[:n]


if __name__ == "__main__":
    v = cut_voice()
    music, sfx = build()
    voice = np.zeros_like(music)
    voice[: min(len(v), len(voice))] = v[: len(voice)]
    write(os.path.join(AUDIO, "flownova_ep2_short_full.wav"), master(duck(music, voice) * 0.45 + sfx * 0.55 + voice * 1.1, 0.92))
    write(os.path.join(AUDIO, "flownova_ep2_short_voice.wav"), master(sfx * 0.5 + voice * 1.1, 0.92))
    print("ok")

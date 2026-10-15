#!/usr/bin/env python3
"""bise ambient's three sounds, one family (the pink mist pearl in sound).

    python3 make_sounds.py [out_dir]   -> listen.wav, think.wav, need.wav (44.1 kHz, 16-bit, mono)

The family: soft sine voices with a faint 2nd and a slightly inharmonic 4th partial
(a glass-like warmth), a breath of filtered noise (the mist), all in E major
(B4 494 Hz, E5 659 Hz, G#5 831 Hz). Nothing above ~2.5 kHz carries energy, nothing
repeats, every file starts and ends at zero. Peaks are kept low (-14 to -18 dBFS)
so they sit under the user's own audio.

- listen (fn down, 0.22 s): a soft rising breath, the mist drawing in, with a quiet B4 -> E5 glide under it.
- think  (bise takes the ask, 0.30 s): a soft settle, E5 then B4, like a nod.
- need   (a question shows, 0.42 s): warm and clear, B4 E5 G#5 rising, never an alarm.

Pure Python (no numpy). Deterministic: the noise is seeded.
"""
import math
import random
import struct
import sys
import wave
from pathlib import Path

SR = 44100
B4, E5, GS5 = 493.88, 659.26, 830.61


def silence(dur):
    return [0.0] * int(SR * dur)


def mix(dst, src, at=0.0, gain=1.0):
    i0 = int(at * SR)
    if len(dst) < i0 + len(src):
        dst.extend([0.0] * (i0 + len(src) - len(dst)))
    for i, v in enumerate(src):
        dst[i0 + i] += v * gain
    return dst


def voice(f0, f1, dur, attack, tau, partials=((1, 1.0), (2, 0.16), (4.07, 0.035)), detune_cents=2.0):
    """a sine voice gliding f0 -> f1 (exponential), soft attack, exponential decay, two detuned copies (chorus)."""
    n = int(SR * dur)
    out = []
    ph = [[0.0] * len(partials), [0.0] * len(partials)]
    det = [2 ** (-detune_cents / 2400), 2 ** (detune_cents / 2400)]
    for i in range(n):
        t = i / SR
        f = f0 * (f1 / f0) ** min(1.0, t / max(dur * 0.6, 1e-6))
        env = (1 - math.exp(-t / max(attack / 3, 1e-4))) * math.exp(-max(0.0, t - attack) / tau)
        s = 0.0
        for c in range(2):
            for k, (mult, amp) in enumerate(partials):
                ph[c][k] += 2 * math.pi * f * mult * det[c] / SR
                s += amp * math.sin(ph[c][k])
        out.append(0.5 * s * env)
    return out


def breath(dur, fc0, fc1, q, attack, release, seed):
    """filtered noise (a resonant band-pass whose center glides fc0 -> fc1): the mist."""
    rnd = random.Random(seed)
    n = int(SR * dur)
    out = []
    x1 = x2 = y1 = y2 = 0.0
    for i in range(n):
        t = i / SR
        fc = fc0 * (fc1 / fc0) ** (t / dur)
        w0 = 2 * math.pi * fc / SR
        alpha = math.sin(w0) / (2 * q)
        b0, b2 = alpha, -alpha
        a0, a1, a2 = 1 + alpha, -2 * math.cos(w0), 1 - alpha
        x = rnd.uniform(-1, 1)
        y = (b0 * x + b2 * x2 - a1 * y1 - a2 * y2) / a0
        x2, x1, y2, y1 = x1, x, y1, y
        if t < attack:
            env = math.sin(0.5 * math.pi * t / attack) ** 2
        else:
            env = max(0.0, 1 - (t - attack) / max(release, 1e-6)) ** 1.6
        out.append(y * env)
    return out


def lowpass(sig, fc):
    a = math.exp(-2 * math.pi * fc / SR)
    y, out = 0.0, []
    for v in sig:
        y = (1 - a) * v + a * y
        out.append(y)
    return out


def finish(sig, dur, peak_dbfs):
    """trim/pad to dur, 3 ms fade in, 40 ms fade out, normalize the peak."""
    n = int(SR * dur)
    sig = (sig + [0.0] * n)[:n]
    fi, fo = int(0.003 * SR), int(0.040 * SR)
    for i in range(fi):
        sig[i] *= i / fi
    for i in range(fo):
        sig[n - 1 - i] *= i / fo
    peak = max(abs(v) for v in sig) or 1.0
    g = 10 ** (peak_dbfs / 20) / peak
    return [v * g for v in sig]


def listen():
    s = breath(0.22, 650, 1500, 1.4, attack=0.13, release=0.09, seed=7)
    s = mix(s, voice(B4, E5, 0.22, attack=0.05, tau=0.12), gain=0.22)
    return finish(lowpass(s, 4200), 0.22, -16.0)


def think():
    s = silence(0.30)
    mix(s, breath(0.07, 1400, 900, 0.9, attack=0.01, release=0.06, seed=11), gain=0.18)
    mix(s, voice(E5, E5, 0.30, attack=0.006, tau=0.09), at=0.0, gain=0.9)
    mix(s, voice(B4, B4, 0.23, attack=0.006, tau=0.11), at=0.07, gain=0.8)
    return finish(lowpass(s, 3600), 0.30, -18.0)


def need():
    s = silence(0.42)
    mix(s, voice(B4, B4, 0.42, attack=0.008, tau=0.17), at=0.00, gain=0.85)
    mix(s, voice(E5, E5, 0.33, attack=0.008, tau=0.16), at=0.09, gain=0.9)
    mix(s, voice(GS5, GS5, 0.24, attack=0.008, tau=0.13), at=0.18, gain=0.55)
    mix(s, breath(0.42, 900, 1700, 1.2, attack=0.15, release=0.27, seed=23), gain=0.08)
    return finish(lowpass(s, 4000), 0.42, -14.0)


def write(path, sig):
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1.0, min(1.0, v)) * 32767)) for v in sig))


def report(name, sig):
    peak = max(abs(v) for v in sig)
    rms = math.sqrt(sum(v * v for v in sig) / len(sig))
    return f"{name}: {len(sig) / SR:.3f} s, peak {20 * math.log10(peak):.1f} dBFS, rms {20 * math.log10(rms):.1f} dBFS, first {sig[0]:+.4f}, last {sig[-1]:+.4f}"


if __name__ == "__main__":
    out = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).parent)
    out.mkdir(parents=True, exist_ok=True)
    for name, fn in (("listen", listen), ("think", think), ("need", need)):
        sig = fn()
        write(out / f"{name}.wav", sig)
        print(report(name, sig))

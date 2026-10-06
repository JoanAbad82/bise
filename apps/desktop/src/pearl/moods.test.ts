// The pearl's easing: no jump between moods (bug 2), stillness under reduced motion.
import { describe, expect, it } from 'vitest';
import { ease, settled, start, type PearlState } from './moods';

const run = (s0: PearlState, mood: Parameters<typeof ease>[1], ms: number, reduce = false, level = 0): PearlState[] => {
  const out: PearlState[] = [];
  let s = s0;
  for (let t = 0; t < ms; t += 16.7) {
    s = ease(s, mood, level, 0.0167, reduce);
    out.push(s);
  }
  return out;
};

describe('the pearl', () => {
  it('moves between moods smoothly: no value jumps more than 6% in one 60 Hz frame', () => {
    const frames = [start(), ...run(start(), 'need', 1500)];
    for (let i = 1; i < frames.length; i += 1) {
      const a = frames[i - 1];
      const b = frames[i];
      if (a === undefined || b === undefined) continue;
      expect(Math.abs(b.need - a.need)).toBeLessThan(0.06);
    }
    expect(frames.at(-1)?.need).toBeGreaterThan(0.99);
  });
  it('the flow speeds up with the voice while listening', () => {
    const quiet = run(start(), 'listen', 1000, false, 0).at(-1)?.flow ?? 0;
    const loud = run(start(), 'listen', 1000, false, 1).at(-1)?.flow ?? 0;
    expect(loud).toBeGreaterThan(quiet * 1.5);
  });
  it('stands still under reduced motion, and settles so nothing is drawn', () => {
    const frames = run(start(), 'work', 3000, true);
    const last = frames.at(-1) ?? start();
    expect(settled(last, 'work', true)).toBe(true);
    const f = last.flow;
    expect(ease(last, 'work', 1, 0.0167, true).flow - f).toBeLessThan(1e-4);
  });
});

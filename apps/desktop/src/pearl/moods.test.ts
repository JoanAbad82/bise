// The pearl's easing: no jump between moods (bug 2), stillness under reduced motion.
import { describe, expect, it } from 'vitest';
import { ease, moves, settle, settled, start, type PearlState } from './moods';

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
  it('is still at rest (lead m_11707): from the first frame, nothing left to draw', () => {
    const first = ease(start(12), 'rest', 0, 1, false); // the loop's first step lands on the targets
    expect(settled(first, 'rest', false)).toBe(true);
    const later = ease(first, 'rest', 1, 0.0167, false);
    expect(later.flow).toBe(first.flow);
    expect(later.clock).toBe(first.clock);
  });
  it('moves only while bise works or listens; every other mood settles still', () => {
    for (const mood of ['listen', 'speak', 'work'] as const) {
      expect(moves(mood, false)).toBe(true);
      expect(moves(mood, true)).toBe(false);
      const a = run(start(), mood, 2000).at(-1) ?? start();
      expect(ease(a, mood, 0, 0.0167, false).clock - a.clock).toBeGreaterThan(0.015);
    }
    for (const mood of ['rest', 'still', 'need', 'done', 'fail', 'away'] as const) {
      expect(moves(mood, false)).toBe(false);
      const after = run(run(start(), 'work', 2000).at(-1) ?? start(), mood, 3000).at(-1) ?? start();
      expect(settled(after, mood, false), `${mood} settles within 3 s of work`).toBe(true);
    }
  });
  it("never jumps on a wake: the shader's clock only advances by what it moved", () => {
    const still = run(start(5), 'rest', 3000).at(-1) ?? start();
    const woke = ease(still, 'work', 0, 0.0167, false);
    expect(woke.clock - still.clock).toBeLessThan(0.0167);
    const frames = [still, ...run(still, 'work', 1500)];
    for (let i = 1; i < frames.length; i += 1) {
      expect((frames[i]?.clock ?? 0) - (frames[i - 1]?.clock ?? 0)).toBeLessThanOrEqual(0.0167 + 1e-9);
    }
  });
  it('stands still under reduced motion, and settles so nothing is drawn', () => {
    const frames = run(start(), 'work', 3000, true);
    const last = frames.at(-1) ?? start();
    expect(settled(last, 'work', true)).toBe(true);
    const f = last.flow;
    expect(ease(last, 'work', 1, 0.0167, true).flow - f).toBeLessThan(1e-4);
  });
});

describe("the pearl's still frame (a window seen but not in front)", () => {
  it('lands on the mood with the smoke and clock where they were', () => {
    const s0 = run(start(3), 'work', 1000).at(-1) ?? start(3);
    const s = settle(s0, 'need', false);
    expect(settled(s, 'need', false)).toBe(true);
    expect(s.flow).toBe(s0.flow);
    expect(s.clock).toBe(s0.clock);
  });
});

// The entry build's timeline (design's hero-entry §2): its eases, its order from the middle out, and
// the whole map there by 2.4 s.
import { describe, expect, it } from 'vitest';
import { easeInOut, ENTRY, jitterOf, popAt, popOut, roadsAt, thingStart, wordsAt } from './entry';

describe('the entry build', () => {
  it('eases in and out: slow ends, the middle at half', () => {
    expect(easeInOut(0)).toBeCloseTo(0);
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 3);
    expect(easeInOut(1)).toBeCloseTo(1);
    expect(easeInOut(0.1)).toBeLessThan(0.05);
    expect(easeInOut(0.9)).toBeGreaterThan(0.95);
  });

  it('pops with a 4% overshoot, then settles at its size', () => {
    const peak = Math.max(...Array.from({ length: 101 }, (_, i) => popOut(i / 100)));
    expect(peak).toBeGreaterThan(1.035);
    expect(peak).toBeLessThan(1.045);
    expect(popOut(0)).toBeCloseTo(0);
    expect(popOut(1)).toBeCloseTo(1);
  });

  it('starts the middle first and the edge last, every thing within 400-1800 ms ± its jitter', () => {
    const near = thingStart(0, 50, 0, 0);
    const far = thingStart(50, 50, 50, 0);
    expect(near).toBeLessThan(far);
    for (let d = 0; d <= 50; d += 5) {
      const s = thingStart(d, 50, d, d);
      expect(s).toBeGreaterThanOrEqual(ENTRY.things.from - ENTRY.things.jitter);
      expect(s).toBeLessThanOrEqual(ENTRY.things.from + ENTRY.things.span + ENTRY.things.jitter);
    }
    expect(Math.abs(jitterOf(3.2, -7))).toBeLessThanOrEqual(1);
    expect(jitterOf(3.2, -7)).toBe(jitterOf(3.2, -7));
  });

  it('has the whole map there by 2.4 s: the last thing, the last office, the last bim', () => {
    const lastThing = ENTRY.things.from + ENTRY.things.span + ENTRY.things.jitter + ENTRY.pop;
    const lastOffice = ENTRY.things.from + ENTRY.things.span + ENTRY.things.jitter + ENTRY.drop + 5 * 12 + ENTRY.furniture;
    const lastBim = ENTRY.bims.from + 14 * ENTRY.bims.gap + ENTRY.bims.pop;
    expect(Math.max(lastThing, lastOffice, lastBim)).toBeLessThanOrEqual(ENTRY.built);
    expect(popAt(ENTRY.built, ENTRY.bims.from + 14 * ENTRY.bims.gap, ENTRY.bims.pop)).toBe(1);
    expect(roadsAt(ENTRY.roads.to)).toBeCloseTo(1);
    expect(roadsAt(0)).toBe(0);
    expect(wordsAt(ENTRY.built)).toBeCloseTo(1);
    expect(wordsAt(2000)).toBe(0);
    expect(ENTRY.cam.to).toBe(ENTRY.done);
  });
});

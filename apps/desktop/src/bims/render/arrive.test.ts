// His sketch's new extension arrives like an object (office-scene.ts arriveAt): it falls from over
// its place, squashes once on landing, settles at rest, and rests exactly where it belongs.
import { describe, expect, it } from 'vitest';
import { ARRIVE_S, arriveAt } from './office-scene';

describe("an extension's arrival", () => {
  it('falls, never under its place, lands by 60%, squashes once, then rests at its place and size', () => {
    const ps = Array.from({ length: 101 }, (_, i) => i / 100);
    const at = ps.map(arriveAt);
    expect(at[0]?.y).toBeGreaterThan(1);
    for (let i = 1; i < at.length; i++) expect((at[i]?.y ?? 0) <= (at[i - 1]?.y ?? 0) + 1e-9).toBe(true);
    expect(at.every((a) => a.y >= 0)).toBe(true);
    expect(arriveAt(0.6).y).toBe(0);
    expect(Math.min(...at.map((a) => a.sy))).toBeLessThan(0.95);
    expect(Math.min(...at.map((a) => a.sy))).toBeGreaterThan(0.8);
    expect(arriveAt(1)).toEqual({ y: 0, sy: 1 });
    expect(arriveAt(2)).toEqual({ y: 0, sy: 1 });
  });

  it('takes under half a second', () => {
    expect(ARRIVE_S).toBeLessThanOrEqual(0.45);
  });
});

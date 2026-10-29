// A newcomer's poof (poof.ts): nothing before it, pieces around the bim while it pops, nothing left
// after; the puffs grow to stay seen when the camera is far (designer m_39015), never past BOOST.
import { describe, expect, it } from 'vitest';
import { APPEAR_S } from './office-scene';
import { POOF_S, PUFF, PUFF_MIN_PX, PUFF_TOP, SPARK, SPARK_MIN_PX, poofAt, puffBoost, sparkBoost } from './poof';
import { RIM_PX, sparkPx } from './poofs';

const steps = (n: number): number[] => Array.from({ length: n + 1 }, (_, i) => (i / n) * POOF_S);
const seen = (s: number, boost = 1): number => poofAt(7, s, boost).filter((b) => b.r > 1e-3).length;

describe('a newcomer\'s poof', () => {
  it('shows while the bim pops, clears after it, and is gone at its end', () => {
    expect(seen(-0.01)).toBe(0);
    expect(seen(APPEAR_S * 0.4)).toBeGreaterThanOrEqual(PUFF.n);
    expect(seen(POOF_S)).toBe(0);
    expect(POOF_S).toBeGreaterThan(APPEAR_S);
    expect(POOF_S).toBeLessThanOrEqual(1);
  });

  it('is eight puffs and four sparkles at every time, small, near the bim, never under the floor', () => {
    for (const boost of [1, puffBoost(1)]) {
      for (const s of steps(60)) {
        const bits = poofAt(42, s, boost);
        expect(bits.filter((b) => b.kind === 'puff')).toHaveLength(PUFF.n);
        expect(bits.filter((b) => b.kind === 'spark')).toHaveLength(SPARK.n);
        for (const b of bits) {
          expect(b.r).toBeGreaterThanOrEqual(0);
          expect(b.r).toBeLessThan(0.3 * boost);
          expect(Math.hypot(b.x, b.z)).toBeLessThan(0.9 * boost);
          expect(b.y - b.r).toBeGreaterThan(-0.05);
          expect(b.y).toBeLessThan(1.5);
        }
      }
    }
  });

  it('keeps its puffs at their size close up, grows them only a little far out, and always at its feet (designer m_49905)', () => {
    // close up (0.01 office units per css px): today's size
    expect(puffBoost(0.01)).toBe(1);
    // far out: a little bigger, never past 1.3x (they read as dust over the bim at 2.5x)
    expect(puffBoost(0.1)).toBeGreaterThan(1);
    expect(puffBoost(10)).toBeLessThanOrEqual(1.3);
    expect(PUFF_MIN_PX).toBeGreaterThan(0);
    // under its waist at any camera, all through the poof: the newcomer is seen arriving
    for (const boost of [1, puffBoost(1 / 6), puffBoost(10)]) {
      for (let s = 0; s < POOF_S; s += 0.02) {
        for (const b of poofAt(11, s, boost)) if (b.kind === 'puff' && b.r > 1e-3) expect(b.y + b.r).toBeLessThanOrEqual(PUFF_TOP + 1e-9);
      }
    }
  });

  it("grows its sparkles far out so the glitter reads at the tile's fit, as the hero's close shots show it (his m_49844)", () => {
    expect(sparkBoost(0.01)).toBe(1);
    // the tile's fit: ~6 css px an office unit; a star's half length at least SPARK_MIN_PX there
    const scale = 1 / 6;
    const b = sparkBoost(scale);
    expect((SPARK.size * b) / scale).toBeGreaterThanOrEqual(SPARK_MIN_PX - 1e-9);
    expect(sparkBoost(10)).toBeLessThanOrEqual(4.5);
    // boosted: bigger stars, a little further round the bim, still over its feet's ring
    const at = (k: number) => poofAt(9, 0.3, 1, k).filter((x) => x.kind === 'spark' && x.r > 1e-3);
    const near = at(1);
    const far = at(b);
    expect(far.length).toBe(near.length);
    for (let i = 0; i < far.length; i++) {
      expect((far[i]?.r ?? 0)).toBeGreaterThan(near[i]?.r ?? 0);
      expect(Math.hypot(far[i]?.x ?? 0, far[i]?.z ?? 0)).toBeLessThanOrEqual(2 * Math.hypot(near[i]?.x ?? 0, near[i]?.z ?? 0) + 1e-9);
    }
  });

  it("draws every sparkle at least 4 css px of gold plus its rim at the tile's fit, from the camera's scale (designer m_49932)", () => {
    for (const scale of [1 / 6, 1 / 4, 1 / 12]) {
      const spark = sparkBoost(scale);
      const peak = new Map<number, number>();
      for (let s = 0; s < POOF_S; s += 0.005) {
        poofAt(21, s, puffBoost(scale), spark).forEach((b, i) => {
          if (b.kind === 'spark') peak.set(i, Math.max(peak.get(i) ?? 0, b.r));
        });
      }
      expect(peak.size).toBe(SPARK.n);
      for (const r of peak.values()) {
        expect(sparkPx(r, scale) - 2 * RIM_PX).toBeGreaterThanOrEqual(4);
        expect(sparkPx(r, scale)).toBeLessThan(40);
      }
    }
    // the same star in office units is twice as many px with the camera twice as close
    expect(sparkPx(0.3, 1 / 20) - 2 * RIM_PX).toBeCloseTo(2 * (sparkPx(0.3, 1 / 10) - 2 * RIM_PX));
  });

  it('is the same poof for the same bim, and another for another', () => {
    expect(poofAt(3, 0.2)).toEqual(poofAt(3, 0.2));
    expect(poofAt(3, 0.2)).not.toEqual(poofAt(4, 0.2));
  });
});

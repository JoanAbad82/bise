// A newcomer's poof (poof.ts): nothing before it, pieces around the bim while it pops, nothing left
// after; the puffs grow to stay seen when the camera is far (designer m_39015), never past BOOST.
import { describe, expect, it } from 'vitest';
import { APPEAR_S } from './office-scene';
import { POOF_S, PUFF, PUFF_MIN_PX, SPARK, poofAt, puffBoost } from './poof';

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

  it('keeps its puffs at their size close up and grows them far out to stay PUFF_MIN_PX wide', () => {
    // close up (0.01 office units per css px): today's size
    expect(puffBoost(0.01)).toBe(1);
    // far (the hero's wide: ~0.1 units per px): a ball's least width on screen is PUFF_MIN_PX
    const scale = 0.1;
    const least = (2 * PUFF.size * 0.75 * puffBoost(scale)) / scale;
    expect(least).toBeGreaterThanOrEqual(PUFF_MIN_PX - 1e-9);
    // and never past its cap
    expect(puffBoost(10)).toBeLessThanOrEqual(2.5);
  });

  it('is the same poof for the same bim, and another for another', () => {
    expect(poofAt(3, 0.2)).toEqual(poofAt(3, 0.2));
    expect(poofAt(3, 0.2)).not.toEqual(poofAt(4, 0.2));
  });
});

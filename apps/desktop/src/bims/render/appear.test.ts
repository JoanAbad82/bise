// A newcomer's pop in (office-scene.ts appearOut): from nothing, a little past its size, settled.
import { describe, expect, it } from 'vitest';
import { appearOut, APPEAR_S } from './office-scene';

describe('a bim coming in', () => {
  it('pops from nothing to its size, a little past it on the way, in under half a second', () => {
    expect(appearOut(0)).toBeCloseTo(0);
    expect(appearOut(1)).toBeCloseTo(1);
    const peak = Math.max(...Array.from({ length: 101 }, (_, i) => appearOut(i / 100)));
    expect(peak).toBeGreaterThan(1.03);
    expect(peak).toBeLessThan(1.1);
    expect(APPEAR_S).toBeLessThanOrEqual(0.5);
  });
});

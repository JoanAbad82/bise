// The ring under a lit bim: a hovered row's reads at any zoom (designer m_48539), the followed bim's keeps its look.
import { describe, expect, it } from 'vitest';
import { HALO, ROW_RING, ringOf } from './halo';

describe('ringOf', () => {
  it("a row hovered at the tile's fit: at least 20 px across, a 1.5 px line, at 0.6", () => {
    const scale = 0.12; // world units per css px, about a 280 px tile's fit
    const r = ringOf('row', scale);
    expect((2 * r.outer) / scale).toBeGreaterThanOrEqual(ROW_RING.minPx);
    expect((r.outer - r.inner) / scale).toBeCloseTo(ROW_RING.linePx);
    expect(r.alpha).toBe(0.6);
  });
  it('zoomed close: never smaller than the follow ring, its line still 1.5 px', () => {
    const scale = 0.005;
    const r = ringOf('row', scale);
    expect(r.outer).toBe(HALO.outer);
    expect((r.outer - r.inner) / scale).toBeCloseTo(ROW_RING.linePx);
  });
  it('the followed bim keeps its own look at any zoom', () => {
    expect(ringOf('follow', 0.12)).toEqual({ inner: HALO.inner, outer: HALO.outer, alpha: HALO.alpha });
    expect(ringOf('follow', 0.005)).toEqual(ringOf('follow', 0.12));
  });
});

import { describe, expect, it } from 'vitest';
import { RIGHT, UP } from '@/bims/render/camera';
import { AIR_PX, BANNER_HOVER_MS, airFit, hoverT, spanOf } from './fit';

const dot = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number => a.x * b.x + a.y * b.y + a.z * b.z;

describe('the live banner scenes framing (fit.ts)', () => {
  it('measures points on the screen plane', () => {
    const pts = [{ x: 1, y: 0, z: 0 }, { x: -1, y: 0.5, z: 1 }, { x: 0, y: 2, z: -1 }];
    const s = spanOf(pts);
    expect(s).not.toBeNull();
    expect(s?.x0).toBeCloseTo(Math.min(...pts.map((p) => dot(p, RIGHT))));
    expect(s?.y1).toBeCloseTo(Math.max(...pts.map((p) => dot(p, UP))));
    expect(spanOf([])).toBeNull();
  });

  it('fits a wide scene to the width, the air on its sides, centred, the box its size', () => {
    const f = airFit({ x0: -4, x1: 4, y0: -1, y1: 1 }, 360, 176);
    expect(f.widthPx).toBe(360);
    expect(f.heightPx).toBe(176);
    // its left edge AIR_PX in, its middle the box's middle
    expect((-4 - f.left) / f.scale).toBeCloseTo(AIR_PX);
    expect((f.top + f.bottom) / 2).toBeCloseTo(0);
    // the tall side keeps more than the air
    expect((f.top - 1) / f.scale).toBeGreaterThan(AIR_PX);
  });

  it('fits a tall scene to the height', () => {
    const f = airFit({ x0: 0, x1: 1, y0: 0, y1: 4 }, 264, 132);
    expect((f.top - 4) / f.scale).toBeCloseTo(AIR_PX);
    expect((0 - f.bottom) / f.scale).toBeCloseTo(AIR_PX);
    expect((f.left + f.right) / 2).toBeCloseTo(0.5);
  });

  it('plays a hover move from 0 to 1 in BANNER_HOVER_MS, 300 to 500 ms (designer m_45900)', () => {
    expect(BANNER_HOVER_MS).toBeGreaterThanOrEqual(300);
    expect(BANNER_HOVER_MS).toBeLessThanOrEqual(500);
    expect(hoverT(1000, 1000)).toBe(0);
    expect(hoverT(1000, 1000 + BANNER_HOVER_MS / 2)).toBeCloseTo(0.5);
    expect(hoverT(1000, 1000 + BANNER_HOVER_MS * 2)).toBe(1);
    expect(hoverT(0, 5000)).toBe(1);
    // a frame stamped before the move began: its start
    expect(hoverT(1000, 990)).toBe(0);
  });
});

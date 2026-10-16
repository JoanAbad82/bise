import { describe, expect, it } from 'vitest';
import { atFit, clampCam, FIT, MAX_ZOOM, panBy, pinchFactor, sameCam, zoomAt } from './zoom';

describe('the office camera (zoom.ts)', () => {
  it('starts at the fit, and the fit has nowhere to pan', () => {
    expect(atFit(FIT)).toBe(true);
    expect(panBy(FIT, 100, -50, 320, 200)).toEqual(FIT);
  });

  it('zoom stays between the fit and MAX_ZOOM', () => {
    expect(clampCam({ zoom: 0.2, u: 0.1, v: 0.9 })).toEqual(FIT);
    expect(clampCam({ zoom: 99, u: 0.5, v: 0.5 }).zoom).toBe(MAX_ZOOM);
    expect(clampCam({ zoom: Number.NaN, u: 0.5, v: 0.5 })).toEqual(FIT);
  });

  it('a pinch keeps the point under the pointer where it is', () => {
    const w = 320;
    const h = 200;
    const c = zoomAt(FIT, 2, 80, 50, w, h);
    expect(c.zoom).toBe(2);
    // the fit's point under (80, 50) was (0.25, 0.25); on screen it still is at (80, 50)
    expect(c.u + (80 / w - 0.5) / c.zoom).toBeCloseTo(0.25);
    expect(c.v + (50 / h - 0.5) / c.zoom).toBeCloseTo(0.25);
  });

  it('zooming out past the fit comes back to the fit exactly', () => {
    const c = zoomAt(zoomAt(FIT, 3, 300, 10, 320, 200), 0.1, 0, 0, 320, 200);
    expect(sameCam(c, FIT)).toBe(true);
  });

  it('the view never leaves the fit: a pan stops at its edge', () => {
    const c = zoomAt(FIT, 2, 160, 100, 320, 200);
    const far = panBy(c, 10_000, 10_000, 320, 200);
    expect(far.u).toBeCloseTo(0.25);
    expect(far.v).toBeCloseTo(0.25);
    const other = panBy(c, -10_000, -10_000, 320, 200);
    expect(other.u).toBeCloseTo(0.75);
    expect(other.v).toBeCloseTo(0.75);
  });

  it('a pan follows the fingers: drag right shows more of the left', () => {
    const c = zoomAt(FIT, 2, 160, 100, 320, 200);
    const moved = panBy(c, 32, 0, 320, 200);
    expect(moved.u).toBeCloseTo(0.5 - 32 / (320 * 2));
    expect(moved.v).toBe(c.v);
  });

  it('fingers apart zoom in, together zoom out', () => {
    expect(pinchFactor(-10)).toBeGreaterThan(1);
    expect(pinchFactor(10)).toBeLessThan(1);
    expect(pinchFactor(0)).toBe(1);
  });
});

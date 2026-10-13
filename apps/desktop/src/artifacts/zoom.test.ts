import { describe, expect, it } from 'vitest';
import { fitK, fitted, isFit, isImageSrc, MAX_K, panBy, pinchFactor, toggled, zoomAt, zoomWords } from './zoom';
import { claimZoomKeys, takeZoomKey } from './zoomKeys';

// a 2000×1000 image in a 500×500 box: fit is 25% (500×250), centred with 125 px above and under
const D = { bw: 500, bh: 500, nw: 2000, nh: 1000 };
const key = (over: Partial<KeyboardEvent>) => ({ key: '', code: '', metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...over });

describe('an image artifact zooms around the pointer (his m_22822)', () => {
  it('fits whole, never above 100%, centred', () => {
    expect(fitK(D)).toBe(0.25);
    expect(fitted(D)).toEqual({ k: 0.25, x: 0, y: 125 });
    expect(fitK({ bw: 500, bh: 500, nw: 100, nh: 50 })).toBe(1);
  });
  it('keeps the image point under the pointer, held between fit and 8×', () => {
    const z = zoomAt(D, fitted(D), 1, 250, 250);
    // the point under (250, 250) was image (1000, 500): still under it at 100%
    expect((250 - z.x) / z.k).toBeCloseTo(1000);
    expect((250 - z.y) / z.k).toBeCloseTo(500);
    expect(zoomAt(D, z, 100, 250, 250).k).toBe(MAX_K);
    expect(isFit(D, zoomAt(D, z, 0.01, 250, 250))).toBe(true);
  });
  it('pans while zoomed, never past an edge', () => {
    const z = zoomAt(D, fitted(D), 1, 0, 0);
    expect(panBy(D, z, 100, 100)).toEqual({ k: 1, x: 0, y: 0 });
    expect(panBy(D, z, -5000, -5000)).toEqual({ k: 1, x: -1500, y: -500 });
  });
  it('a pinch out zooms in, a pinch in zooms out; lines count as 16 px', () => {
    expect(pinchFactor(-10, 0)).toBeGreaterThan(1);
    expect(pinchFactor(10, 0)).toBeLessThan(1);
    expect(pinchFactor(1, 1)).toBeCloseTo(pinchFactor(16, 0));
  });
  it('a double-click goes to 100% and back to fit; a small image to 2×', () => {
    const z = toggled(D, fitted(D), 250, 250);
    expect(z.k).toBe(1);
    expect(toggled(D, z, 10, 10)).toEqual(fitted(D));
    const small = { bw: 500, bh: 500, nw: 100, nh: 50 };
    expect(toggled(small, fitted(small), 250, 250).k).toBe(2);
    expect(zoomWords(z)).toBe('100%');
  });
  it('one image file by its address', () => {
    expect(isImageSrc('http://127.0.0.1:4/a/hero/1/hero.PNG?theme=dark')).toBe(true);
    expect(isImageSrc('http://127.0.0.1:4/a/proto/1/proto.html?theme=dark')).toBe(false);
  });
  it('esc and ⌘0 go back to fit only while an image is zoomed', () => {
    let back = 0;
    expect(takeZoomKey(key({ key: 'Escape' }))).toBe(false);
    const free = claimZoomKeys(() => (back += 1));
    expect(takeZoomKey(key({ key: 'Escape' }))).toBe(true);
    expect(takeZoomKey(key({ code: 'Digit0', metaKey: true }))).toBe(true);
    expect(takeZoomKey(key({ code: 'Digit0', metaKey: true, altKey: true })), '⌥⌘0 stays the panel').toBe(false);
    expect(back).toBe(2);
    free();
    expect(takeZoomKey(key({ key: 'Escape' }))).toBe(false);
  });
});

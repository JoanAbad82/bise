// The hair swatch's camera (bim-pick-center): main's head centred in its 32 box, at the coin's size,
// for the head boxes the real renderer drew (cut.ts cutFit; the boxes: render.ts cutPng's first
// look, head alone, the coin at 96 px, measured in headless chromium on swiftshader).
import { describe, expect, it } from 'vitest';
import type { Fit } from '@/bims/render/camera';
import type { PxBox } from './bubble3d';
import { CUT_K, cutFit } from './cut';

/** the coin's fit at 96 px (48 css at 2x), its numbers made up: only its scale and frame matter */
const COIN: Fit = { target: { x: 0.1, y: 1.6, z: -0.2 }, left: -0.31, right: 0.29, top: 0.52, bottom: -0.08, scale: 0.6 / 96, widthPx: 96, heightPx: 96 };

/** the head alone's drawn box in the coin's 96 px, per cut (render.ts cutPng's first look) */
const HEADS: Record<string, PxBox> = {
  short: { x0: 29, y0: 22, x1: 68, y1: 63 },
  'short+cap': { x0: 29, y0: 21, x1: 68, y1: 61 },
  'short+beanie': { x0: 29, y0: 23, x1: 67, y1: 64 },
  'short+headphones': { x0: 23, y0: 25, x1: 73, y1: 64 },
  afro: { x0: 28, y0: 21, x1: 68, y1: 66 },
  topbun: { x0: 33, y0: 19, x1: 64, y1: 64 },
  long: { x0: 26, y0: 20, x1: 70, y1: 68 },
  ponytail: { x0: 28, y0: 21, x1: 68, y1: 66 },
  'ponytail+headphones': { x0: 23, y0: 22, x1: 72, y1: 65 },
  braids: { x0: 25, y0: 20, x1: 71, y1: 64 },
  bob: { x0: 28, y0: 22, x1: 70, y1: 63 },
  buns: { x0: 27, y0: 22, x1: 69, y1: 65 },
  curls: { x0: 26, y0: 23, x1: 70, y1: 65 },
  pigtails: { x0: 14, y0: 27, x1: 82, y1: 65 },
  mohawk: { x0: 31, y0: 20, x1: 65, y1: 65 },
  spiky: { x0: 31, y0: 22, x1: 66, y1: 64 },
};

/** where `b` (the coin's px) lands in the cut's picture, its px (y down from its top) */
const land = (f: Fit, b: PxBox) => {
  const u = (COIN.right - COIN.left) / COIN.widthPx;
  const k = f.widthPx / (f.right - f.left);
  return {
    x0: (COIN.left + b.x0 * u - f.left) * k,
    x1: (COIN.left + b.x1 * u - f.left) * k,
    y0: (f.top - (COIN.top - b.y0 * u)) * k,
    y1: (f.top - (COIN.top - b.y1 * u)) * k,
  };
};

describe('the hair swatch: the head centred in its box (bim-pick-center)', () => {
  const size = 64;
  it.each(Object.entries(HEADS))('%s: its drawn box centred within 1 px of the square\'s centre (the ring\'s)', (_, head) => {
    const l = land(cutFit(COIN, head, size), head);
    expect(Math.abs((l.x0 + l.x1) / 2 - size / 2)).toBeLessThan(1);
    expect(Math.abs((l.y0 + l.y1) / 2 - size / 2)).toBeLessThan(1);
  });

  it('the head at the coin\'s size: the cut\'s px is the coin\'s, the coin drawn CUT_K x the cut', () => {
    const head = HEADS.short ?? { x0: 0, y0: 0, x1: 1, y1: 1 };
    const f = cutFit(COIN, head, size);
    const l = land(f, head);
    expect(l.x1 - l.x0).toBeCloseTo(head.x1 - head.x0, 9);
    expect(l.y1 - l.y0).toBeCloseTo(head.y1 - head.y0, 9);
    expect(f.top - f.bottom).toBeCloseTo(f.right - f.left, 9);
    expect(COIN.widthPx / CUT_K).toBe(size);
    expect(f.target).toEqual(COIN.target);
  });

  it('every head but the pigtails fits its box; the pigtails pass it by the same 2 px each side', () => {
    for (const [cut, head] of Object.entries(HEADS)) {
      const l = land(cutFit(COIN, head, size), head);
      if (cut === 'pigtails') {
        expect(l.x0).toBeCloseTo(-2, 9);
        expect(l.x1).toBeCloseTo(size + 2, 9);
        continue;
      }
      expect(Math.min(l.x0, l.y0)).toBeGreaterThanOrEqual(0);
      expect(Math.max(l.x1, l.y1)).toBeLessThanOrEqual(size);
    }
  });
});

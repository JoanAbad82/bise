// @vitest-environment happy-dom
// The 4 bubbles' own objects (bims-plugins' spec): their parts and colours light and dark, and one
// placement by their drawn box on the coin (designer m_45014: E.5).
import { describe, expect, it } from 'vitest';
import { Box3, Color, Mesh, type MeshStandardMaterial, Vector3 } from 'three';
import { DAY, HOODIE, WORLD } from '@/bims/render/palette';
import { BUBBLES, COIN, objectAt } from './objects';
import { GLASS, alphaBox, alphaFit, bubbleModel, lookOf, projected } from './bubble3d';

type Mat = MeshStandardMaterial;
const meshes = (b: (typeof BUBBLES)[number], night: boolean): Mesh[] => {
  const g = bubbleModel(b, night);
  g.updateMatrixWorld(true);
  const out: Mesh[] = [];
  g.traverse((o) => {
    if (o instanceof Mesh) out.push(o as Mesh);
  });
  return out;
};
const hex = (m: Mesh | undefined): string => {
  if (m === undefined) throw new Error('no such part');
  return `#${(m.material as Mat).color.getHexString()}`;
};
/** the picture's css px per object unit on the coin: its projected box in COIN.box (the drawn box is inside it) */
const pxPerUnit = (b: (typeof BUBBLES)[number]): number => {
  const g = bubbleModel(b, false);
  g.updateMatrixWorld(true);
  const { x0, x1, y0, y1 } = projected(new Box3().setFromObject(g, true));
  return Math.min(COIN.box.w / (x1 - x0), COIN.box.h / (y1 - y0));
};

describe('the 4 bubble objects', () => {
  it('have the spec\'s parts: a bust 6, three sheets 6, an hourglass 6, a laptop 4', () => {
    for (const night of [false, true]) {
      expect(meshes('agents', night)).toHaveLength(6);
      expect(meshes('artifacts', night)).toHaveLength(6);
      expect(meshes('scheduled', night)).toHaveLength(6);
      expect(meshes('processes', night)).toHaveLength(4);
    }
  });

  it('the bust: teal shoulders (never main\'s ink, lost in the dark bubble)', () => {
    expect(hex(meshes('agents', true)[0])).toBe(HOODIE[5]);
  });

  it('the hourglass: glass bulbs, the window by day and the cream by night', () => {
    const glass = (night: boolean) => meshes('scheduled', night).filter((m) => (m.material as Mat).transparent);
    for (const night of [false, true]) {
      const g = glass(night);
      expect(g).toHaveLength(2);
      for (const m of g) {
        expect((m.material as Mat).opacity).toBe(GLASS);
        expect((m.material as Mat).depthWrite).toBe(false);
      }
    }
    expect(hex(glass(false)[0])).toBe(DAY.window);
    expect(hex(glass(true)[0])).toBe('#f3ede4');
  });

  it('only the laptop\'s line glows, in the neon\'s yellow', () => {
    for (const b of BUBBLES) {
      // clayLit's warmth is a faint emissive too (userData.warm): only a glow is not warmth
      const lit = meshes(b, false).filter((m) => (m.material as Mat).userData.warm !== true && (m.material as Mat).emissiveIntensity > 0);
      expect(lit.map(hex)).toEqual(b === 'processes' ? [DAY.neon] : []);
    }
    expect(hex(meshes('processes', true)[0])).toBe(WORLD.metal);
  });

  it('no accent pink and no error red anywhere', () => {
    for (const b of BUBBLES) {
      for (const night of [false, true]) {
        for (const m of meshes(b, night)) {
          const hsl = { h: 0, s: 0, l: 0 };
          new Color(hex(m)).getHSL(hsl);
          const pinkOrRed = (hsl.h > 0.9 || hsl.h < 0.03) && hsl.s > 0.5 && hsl.l > 0.25;
          expect(pinkOrRed, `${b} ${hex(m)}`).toBe(false);
        }
      }
    }
  });

  it('no part under 3 px on the coin at 1x (sheet D, designer m_45014; was 4 at the old 68), but the hourglass\'s sand stream (designer signed it)', () => {
    for (const b of BUBBLES) {
      const k = pxPerUnit(b);
      for (const m of meshes(b, false)) {
        const box = new Box3().setFromObject(m, true);
        const { x0, x1, y0, y1 } = projected(box);
        const px = Math.max(x1 - x0, y1 - y0) * k;
        const stream = b === 'scheduled' && box.getSize(new Vector3()).x < 0.06;
        if (!stream) expect(px, `${b} ${hex(m)}`).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

/** an RGBA buffer w x h with alpha 255 in the box [x0, x1) x [y0, y1) */
const drawnIn = (w: number, h: number, b: { x0: number; y0: number; x1: number; y1: number }): Uint8ClampedArray => {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = b.y0; y < b.y1; y++) for (let x = b.x0; x < b.x1; x++) d[(y * w + x) * 4 + 3] = 255;
  return d;
};

describe('placed by the drawn box (designer m_45014)', () => {
  it('alphaBox: the pixels with some alpha, none when nothing is drawn, a faint edge left out', () => {
    expect(alphaBox(drawnIn(20, 20, { x0: 3, y0: 5, x1: 9, y1: 17 }), 20, 20)).toEqual({ x0: 3, y0: 5, x1: 9, y1: 17 });
    expect(alphaBox(new Uint8ClampedArray(20 * 20 * 4), 20, 20)).toBeNull();
    const faint = drawnIn(20, 20, { x0: 3, y0: 5, x1: 9, y1: 17 });
    faint[(19 * 20 + 19) * 4 + 3] = 4;
    expect(alphaBox(faint, 20, 20)).toEqual({ x0: 3, y0: 5, x1: 9, y1: 17 });
  });

  /** where a drawn box of the first look lands in the picture, its px (y down from its top) */
  const land = (drawn: { x0: number; y0: number; x1: number; y1: number }, size: number) => {
    const box = new Box3(new Vector3(-0.5, 0, -0.5), new Vector3(0.5, 2, 0.5));
    const look = lookOf(box, 400);
    const f = alphaFit(look, drawn, 400, size);
    const u = (look.right - look.left) / 400;
    const k = size / (f.right - f.left);
    expect(f.top - f.bottom).toBeCloseTo(f.right - f.left, 9);
    const left = (look.left + drawn.x0 * u - f.left) * k;
    const right = (look.left + drawn.x1 * u - f.left) * k;
    const top = (f.top - (look.top - drawn.y0 * u)) * k;
    const bottom = (f.top - (look.top - drawn.y1 * u)) * k;
    return { left, right, top, bottom, wide: right - left, high: bottom - top };
  };

  it('a tall object: 32 of the 36 square high, its lowest pixel on the square\'s bottom, centred', () => {
    const l = land({ x0: 150, y0: 40, x1: 250, y1: 360 }, COIN.box.w);
    expect(l.high).toBeCloseTo(COIN.box.h, 6);
    expect(l.bottom).toBeCloseTo(COIN.box.w, 6);
    expect(l.left + l.right).toBeCloseTo(COIN.box.w, 6);
  });

  it('a wide object: 36 wide, lower, its base still on the square\'s bottom', () => {
    const l = land({ x0: 20, y0: 200, x1: 380, y1: 300 }, COIN.box.w);
    expect(l.wide).toBeCloseTo(COIN.box.w, 6);
    expect(l.high).toBeLessThan(COIN.box.h);
    expect(l.bottom).toBeCloseTo(COIN.box.w, 6);
  });

  it('the same at 2x: the numbers scale with the picture', () => {
    const l = land({ x0: 150, y0: 40, x1: 250, y1: 360 }, COIN.box.w * 2);
    expect(l.high).toBeCloseTo(COIN.box.h * 2, 6);
    expect(l.bottom).toBeCloseTo(COIN.box.w * 2, 6);
  });

  it('the first look leaves every object whole, with air on each side', () => {
    for (const b of BUBBLES) {
      const g = bubbleModel(b, false);
      g.updateMatrixWorld(true);
      const box = new Box3().setFromObject(g, true);
      const f = lookOf(box, 100);
      const p = projected(box);
      expect(p.x0).toBeGreaterThan(f.left);
      expect(p.x1).toBeLessThan(f.right);
      expect(p.y0).toBeGreaterThan(f.bottom);
      expect(p.y1).toBeLessThan(f.top);
    }
  });
});

describe('the coin (designer m_45014: E.5)', () => {
  it('the object\'s 36 square at left 4, top -14 of the 44 disc: its base on the disc\'s centre, rising 10 at most', () => {
    const at = objectAt();
    expect(at).toEqual({ left: 4, top: -14, size: 36, rise: 10 });
    expect(at.top + at.size).toBe(COIN.disc / 2);
    expect(COIN.base - COIN.box.h).toBe(-at.rise);
  });
});

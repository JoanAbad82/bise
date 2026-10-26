// @vitest-environment happy-dom
// The 4 bubbles' own objects (bims-plugins' spec): their parts and colours light and dark, and one
// visual weight in the 68 square (designer m_44222).
import { describe, expect, it } from 'vitest';
import { Box3, Color, Mesh, type MeshStandardMaterial, Vector3 } from 'three';
import { DAY, HOODIE, WORLD } from '@/bims/render/palette';
import { BUBBLES, COIN, SQUARE, WEIGHT, objectAt } from './objects';
import { GLASS, bubbleModel, fitOf, projected } from './bubble3d';

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
/** the picture's px per object unit at 68 (fitOf's side) */
const pxPerUnit = (b: (typeof BUBBLES)[number]): number => {
  const g = bubbleModel(b, false);
  g.updateMatrixWorld(true);
  const f = fitOf(new Box3().setFromObject(g, true), SQUARE);
  return 1 / f.scale;
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

  it('no part under 4 px at 68 (1x), but the hourglass\'s sand stream (designer signed it)', () => {
    for (const b of BUBBLES) {
      const k = pxPerUnit(b);
      for (const m of meshes(b, false)) {
        const box = new Box3().setFromObject(m, true);
        const { x0, x1, y0, y1 } = projected(box);
        const px = Math.max(x1 - x0, y1 - y0) * k;
        const stream = b === 'scheduled' && box.getSize(new Vector3()).x < 0.06;
        if (!stream) expect(px, `${b} ${hex(m)}`).toBeGreaterThanOrEqual(4);
      }
    }
  });
});

describe('one visual weight (fitOf)', () => {
  const box = (w: number, h: number, d: number) => new Box3(new Vector3(-w / 2, 0, -d / 2), new Vector3(w / 2, h, d / 2));
  /** where the box lands in the square, in its px (y down from its top) */
  const land = (b: Box3, size = SQUARE) => {
    const f = fitOf(b, size);
    const { x0, x1, y0, y1 } = projected(b);
    const k = size / (f.right - f.left);
    return { high: (y1 - y0) * k, wide: (x1 - x0) * k, top: (f.top - y1) * k, left: (x0 - f.left) * k };
  };

  it('a tall object: 56 of the 68 high, its top 6 under the square\'s top, centred', () => {
    const l = land(box(0.5, 2, 0.5));
    expect(l.high).toBeCloseTo(WEIGHT.high, 6);
    expect(l.top).toBeCloseTo(WEIGHT.top, 6);
    expect(l.wide).toBeLessThan(WEIGHT.wide);
    expect(l.left * 2 + l.wide).toBeCloseTo(SQUARE, 6);
  });

  it('a wide object caps on its width (64) and sits lower, its top still 6 under', () => {
    const l = land(box(3, 0.3, 3));
    expect(l.wide).toBeCloseTo(WEIGHT.wide, 6);
    expect(l.high).toBeLessThan(WEIGHT.high);
    expect(l.top).toBeCloseTo(WEIGHT.top, 6);
  });

  it('the same at 2x: the numbers scale with the picture', () => {
    const l = land(box(0.5, 2, 0.5), SQUARE * 2);
    expect(l.high).toBeCloseTo(WEIGHT.high * 2, 6);
    expect(l.top).toBeCloseTo(WEIGHT.top * 2, 6);
  });

  it('each bubble object fits: at most 56 high and 64 wide, its top 6 under', () => {
    for (const b of BUBBLES) {
      const g = bubbleModel(b, false);
      g.updateMatrixWorld(true);
      const l = land(new Box3().setFromObject(g, true));
      expect(l.high).toBeLessThanOrEqual(WEIGHT.high + 1e-6);
      expect(l.wide).toBeLessThanOrEqual(WEIGHT.wide + 1e-6);
      expect(l.top).toBeCloseTo(WEIGHT.top, 6);
      expect(Math.max(Math.abs(l.high - WEIGHT.high), Math.abs(l.wide - WEIGHT.wide))).toBeLessThan(Math.max(WEIGHT.high, WEIGHT.wide));
    }
  });
});

describe('the coin (bims-plugins r3, designer m_44673: B)', () => {
  it('the object square 54 at left -5, top -25 of the 44 disc: 44 high, base at 55 %, rising 20', () => {
    const at = objectAt();
    expect(at).toMatchObject({ left: -5, top: -25, size: COIN.square });
    expect(Math.round(at.high)).toBe(44);
    expect(Math.round(at.rise)).toBe(20);
    expect(at.top + (at.size * WEIGHT.top) / SQUARE + at.high).toBeCloseTo(COIN.disc * COIN.base, 0);
  });

  it('fitOf at the coin\'s square: a tall object is 44 high, its top 20 above the disc', () => {
    const f = fitOf(new Box3(new Vector3(-0.25, 0, -0.25), new Vector3(0.25, 2, 0.25)), COIN.square);
    const { y0, y1 } = projected(new Box3(new Vector3(-0.25, 0, -0.25), new Vector3(0.25, 2, 0.25)));
    const k = COIN.square / (f.right - f.left);
    expect(Math.round((y1 - y0) * k)).toBe(44);
    expect(Math.round(-(objectAt().top + (f.top - y1) * k))).toBe(20);
  });
});

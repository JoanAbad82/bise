// maps-b's looks (greenhouse, campus, workshop, kyoto, riad, nordic): their palettes never read as
// the app's accent pink or error red, by day and by night, and each stage's piece stands off the
// plan's walk graph and out of its furniture, for every size the contract checks. Owner: maps-b.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { crowd } from '../../fixtures';
import { PLANS } from '../../maps';
import type { MapId, Pt } from '../../model';
import { network } from '../../paths';
import { LOOKS } from './index';
import { dim } from './blook';

const MINE: readonly MapId[] = ['greenhouse', 'campus', 'workshop', 'kyoto', 'riad', 'nordic'];

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hueSat = (hex: string): [number, number] => {
  const [r, g, b] = rgb(hex).map((x) => x / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return [0, 0];
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, d / max];
};
/** palette.test.ts's rule: near the accent or the error AND of its hue */
const reads = (c: string, a: string): boolean => {
  const [h1, s1] = hueSat(c);
  const [h2] = hueSat(a);
  const dh = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
  const [r1, g1, b1] = rgb(c);
  const [r2, g2, b2] = rgb(a);
  return s1 > 0.25 && dh < 20 && Math.hypot(r1 - r2, g1 - g2, b1 - b2) < 90;
};
const tokens = readFileSync(resolve(__dirname, '../../../ds/tokens.css'), 'utf8');
const attention = [...tokens.matchAll(/--p-(accent|err):\s*(#[0-9a-fA-F]{6})/g)].map((m) => (m[2] as string).toLowerCase());

/** a point's distance to a segment */
function toLeg(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const l2 = dx * dx + dz * dz;
  const f = l2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / l2)) : 0;
  return Math.hypot(a.x + dx * f - p.x, a.z + dz * f - p.z);
}

describe("maps-b's looks", () => {
  it('dims a colour', () => {
    expect(dim('#ffffff', 0.5)).toBe('#808080');
    expect(dim('#102030', 1)).toBe('#102030');
  });

  it('never draws the accent pink or the error red, day or night', () => {
    expect(attention.length).toBeGreaterThanOrEqual(4);
    for (const id of MINE) {
      for (const night of [false, true]) {
        const pal = LOOKS[id].pal(night);
        for (const v of Object.values(pal) as unknown[]) {
          const cs = typeof v === 'string' ? [v] : Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
          for (const c of cs) for (const a of attention) expect(reads(c.toLowerCase(), a), `${id} ${night ? 'night' : 'day'}: ${c} reads as ${a}`).toBe(false);
        }
      }
    }
  });

  it('draws no colour of its own that reads as them (every literal in the look files)', () => {
    const bad: string[] = [];
    for (const f of [...MINE, 'blook']) {
      const src = readFileSync(resolve(__dirname, `${f}.ts`), 'utf8');
      for (const [c] of src.matchAll(/#[0-9a-fA-F]{6}\b/g)) for (const a of attention) if (reads(c.toLowerCase(), a)) bad.push(`${f}.ts: ${c} reads as ${a}`);
    }
    expect(bad).toEqual([]);
  });

  for (const id of MINE) {
    it(`${id}: every stage's piece stands off the walks and the furniture`, () => {
      const bad: string[] = [];
      for (const n of [1, 5, 14, 31]) {
        const o = PLANS[id].layout(crowd(n - 1).agents);
        const legs = network(o);
        for (let s = 1; s <= 14; s++) {
          // 3: the first beds, on their lounge spots; a piece on the back wall (the board) or by it
          if (s === 3 || LOOKS[id].pieceAt(o, s).z < 1.0) continue;
          const p = LOOKS[id].pieceAt(o, s);
          // a piece on a bed or a counter (fruit, a tray) is drawn on it: only floor pieces count
          const onTop = o.furniture.some((f) => p.x > f.x0 && p.x < f.x1 && p.z > f.z0 && p.z < f.z1);
          if (onTop) continue;
          const d = Math.min(...legs.map(([a, b]) => toLeg(p, a, b)));
          if (d <= 0.3) bad.push(`${String(n)} agents: stage ${String(s)} at ${p.x.toFixed(2)},${p.z.toFixed(2)} is ${d.toFixed(2)} from a walk`);
        }
      }
      expect(bad).toEqual([]);
    });
  }
});

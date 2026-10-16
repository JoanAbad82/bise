import { describe, expect, it } from 'vitest';
import type { Office, Spot } from '../model';
import { EL, aboveTop, fitSite, siteOf, toScreen } from './camera';

/** the prototype's office numbers for n agents (layout.ts owns the real ones; these only size the site) */
function officeFor(n: number): Office {
  const others = n - 1;
  const side = others > 16 ? 3 : 2;
  const rows = Math.max(3, Math.ceil(others / (side * 2)));
  const W = 2 * (0.7 + 1.0 + side * 2.4) + 0.2;
  const D = 4.3 + rows * 2.3 + 1.0;
  const spot: Spot = { x: 0, z: 1, wz: 1, ax: 0, face: 0 };
  return {
    side, rows, W, D, x0: -W / 2, crossBack: 4.05, crossFront: D - 0.5, ax: 1.2,
    island: { z0: 4.5, z1: 4.5 + rows * 2.3 - 1, w: 1.4 },
    desks: new Map(), mainDesk: spot, islandSpots: [], lounge: [], boardSpots: [], queue: [], door: spot, terrace: [],
  };
}

describe('camera fit', () => {
  it('fits 14 agents in about 190 px at 320 wide (the brief)', () => {
    const f = fitSite(siteOf(officeFor(14)), 320, 2000);
    expect(f.heightPx).toBeGreaterThan(170);
    expect(f.heightPx).toBeLessThan(215);
    expect(f.widthPx).toBe(320);
  });

  it('doubles the height at 640', () => {
    const a = fitSite(siteOf(officeFor(14)), 320, 2000);
    const b = fitSite(siteOf(officeFor(14)), 640, 2000);
    expect(Math.abs(b.heightPx - 2 * a.heightPx)).toBeLessThanOrEqual(2);
  });

  it('never crops: every corner of the site lands on the canvas', () => {
    for (const n of [1, 5, 14, 20, 30]) {
      const site = siteOf(officeFor(n));
      for (const [w, maxH] of [[320, 2000], [640, 2000], [320, 120]] as const) {
        const f = fitSite(site, w, maxH);
        expect(f.heightPx).toBeLessThanOrEqual(maxH);
        for (const x of [site.x0, site.x1]) for (const y of [site.yLow, site.yHigh]) for (const z of [site.z0, site.z1]) {
          const p = toScreen(f, { x, y, z });
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(f.widthPx);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(f.heightPx);
        }
      }
    }
  });

  it('is a true 2:1 isometric view: a floor tile is twice as wide as tall', () => {
    const f = fitSite(siteOf(officeFor(14)), 320, 2000);
    const c = toScreen(f, { x: 0, y: 0, z: 0 });
    const r = toScreen(f, { x: 1, y: 0, z: 1 }); // the tile's diagonal towards the camera: straight down
    const s = toScreen(f, { x: 1, y: 0, z: -1 }); // the other diagonal: straight right
    expect(Math.abs(r.x - c.x)).toBeLessThan(1e-9);
    expect(Math.abs(s.y - c.y)).toBeLessThan(1e-9);
    expect((s.x - c.x) / (r.y - c.y)).toBeCloseTo(2, 6);
    expect(EL).toBeCloseTo(Math.PI / 6);
  });

  it('drops a plane in from above the top edge', () => {
    const f = fitSite(siteOf(officeFor(14)), 320, 2000);
    const at = { x: 2, z: 8 };
    const h = aboveTop(f, at);
    expect(toScreen(f, { x: at.x, y: h, z: at.z }).y).toBeLessThan(0);
  });
});

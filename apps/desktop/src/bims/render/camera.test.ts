import { describe, expect, it } from 'vitest';
import type { Office, Spot } from '../model';
import { OUTER_W } from '@/app/side3d/layout';
import { TILE_H } from '@/app/side3d/tilestate';
import { FIT, MAX_ZOOM, zoomAt } from '../zoom';
import { boxSite, EL, fitSite, siteOf, toScreen, viewFit } from './camera';
import { HEAD_R, HEAD_Y } from './laptop';

/** the prototype's office numbers for n agents (maps/loft.ts owns the real ones; these only size the site) */
function officeFor(n: number): Office {
  const others = n - 1;
  const side = others > 16 ? 3 : 2;
  const rows = Math.max(3, Math.ceil(others / (side * 2)));
  const W = 2 * (0.7 + 1.0 + side * 2.4) + 0.2;
  const D = 4.3 + rows * 2.3 + 1.0;
  const spot: Spot = { x: 0, z: 1, wz: 1, ax: 0, face: 0 };
  return {
    map: 'loft', size: `${String(side)}x${String(rows)}`, W, D, x0: -W / 2,
    island: { x0: -0.7, x1: 0.7, z0: 4.5, z1: 4.5 + rows * 2.3 - 1 },
    desks: new Map(), mainDesk: spot, islandSpots: [], lounge: [], boardSpots: [], queue: [], door: spot, terrace: [],
    exit: spot, queueMore: [spot, spot], walks: [], furniture: [],
  };
}

describe('camera fit', () => {
  it('fits 14 agents in about 190 px at 320 wide (the brief), plus the cube shadow\'s room under it', () => {
    const f = fitSite(siteOf(officeFor(14)), 320, 2000);
    expect(f.heightPx).toBeGreaterThan(170);
    // the cube's soft shadow (designer m_34173) takes ~13 px under the slab at 320
    expect(f.heightPx).toBeLessThan(230);
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

  it('his camera: the fit at FIT, a zoom keeps the canvas size and shows the point under the pinch where it was', () => {
    const f = fitSite(siteOf(officeFor(14)), 320, 2000);
    expect(viewFit(f, FIT)).toEqual(f);
    const c = zoomAt(FIT, 2, 80, 50, f.widthPx, f.heightPx);
    const v = viewFit(f, c);
    expect(v.widthPx).toBe(f.widthPx);
    expect(v.heightPx).toBe(f.heightPx);
    expect(v.scale).toBeCloseTo(f.scale / 2);
    // a world point at (80, 50) in the fit is still at (80, 50) in the view
    const p = { x: 3, y: 0, z: 5 };
    const a = toScreen(f, p);
    const zoomed = viewFit(f, zoomAt(FIT, 2, a.x, a.y, f.widthPx, f.heightPx));
    const b = toScreen(zoomed, p);
    expect(b.x).toBeCloseTo(a.x, 6);
    expect(b.y).toBeCloseTo(a.y, 6);
    // and the view never leaves the fit's rectangle
    expect(v.left).toBeGreaterThanOrEqual(f.left - 1e-9);
    expect(v.top).toBeLessThanOrEqual(f.top + 1e-9);
  });

  it('his pinch goes in until one bim fills the view: the tile (140 and 300 high) and the panel (his m_47411)', () => {
    // a bim stands about its head's top tall, seen at EL: what the view's height must not pass
    const bim = (HEAD_Y + HEAD_R) * Math.cos(EL) + 0.25;
    for (const n of [2, 8, 14]) {
      const site = siteOf(officeFor(n));
      for (const f of [boxSite(site, OUTER_W, TILE_H), boxSite(site, OUTER_W, 300), fitSite(site, 900, 700)]) {
        const v = viewFit(f, { zoom: MAX_ZOOM, u: 0.5, v: 0.5 });
        expect(v.top - v.bottom).toBeLessThanOrEqual(bim);
      }
    }
  });
});

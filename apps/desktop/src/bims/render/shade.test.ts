// @vitest-environment happy-dom
// No hanging lamp hides a desk bim's head on screen (bims m_33449, m_33456: on the nordic table the
// pendants covered the heads, the camera's angle, not a hit). The office's own camera (camera.ts:
// the 2:1 isometric fit at 320 and at 640 docked), every ready map, 3 and 20 agents, every stage: a
// bim seated at each chair, and standing at its spot, in front of it (G) and beside it (S, sit.ts),
// its head's box on the screen against the screen box of every lamp shade nearer the camera than
// the head (a map's look tags its shades: userData.shade; nordic's pendants and nook lamp today).
// Orthographic: the overlap is the same at any width; both widths are checked as the app fits them.
import { describe, expect, it } from 'vitest';
import { Box3 } from 'three';
import { crowd } from '../fixtures';
import { readyMaps, layoutOf } from '../maps';
import { LAST_STAGE, NO_GROW } from '../growth';
import type { Office, Pt } from '../model';
import { chairSpots, sidePoints, toLocal } from '../sit';
import { BACK, type Fit, fitSite, siteOf, toScreen, wideSiteOf } from './camera';
import { buildWorld } from './world';
import { lookOf } from './maps';
import { headBox } from './heads.testkit';
import { STYLE } from './style';


const turn = (): Promise<void> => new Promise((done) => { setTimeout(done, 0); });

interface Rect { readonly x0: number; readonly x1: number; readonly y0: number; readonly y1: number }

/** a box's 8 corners on the screen: their bounds, css px */
function onScreen(fit: Fit, b: Box3): Rect {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
    const p = toScreen(fit, { x, y, z });
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
  }
  return { x0, x1, y0, y1 };
}

const meets = (a: Rect, b: Rect): boolean => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
/** how near the camera a box's middle is */
const depth = (b: Box3): number => ((b.min.x + b.max.x) / 2) * BACK.x + ((b.min.y + b.max.y) / 2) * BACK.y + ((b.min.z + b.max.z) / 2) * BACK.z;

/** the app's fits (index.ts applyFit): 320 the building, 640 a little ground past it */
const fitsOf = (o: Office): readonly [string, Fit][] => [['320', fitSite(siteOf(o), 320, 0)], ['640', fitSite(wideSiteOf(o), 640, 0)]];

/** the heads at a chair: seated, and standing at its spot, G and S */
function heads(o: Office): { what: string; box: Box3 }[] {
  const out: { what: string; box: Box3 }[] = [];
  for (const s of chairSpots(o)) {
    const main = s === o.mainDesk;
    const G = sidePoints(s, 1).G;
    const leg = o.walks.find(([a, b]) => (near(a, G) && !near(b, s)) || (near(b, G) && !near(a, s)));
    const S = leg ? (near(leg[0], G) ? leg[1] : leg[0]) : sidePoints(s, 1).S;
    const at = `(${s.x.toFixed(2)},${s.z.toFixed(2)})`;
    out.push({ what: `${at} seated`, box: headBox(s, s.face, main, true) });
    for (const [what, p] of [['spot', s], ['G', G], [toLocal(s, S).u < 0 ? 'S left' : 'S right', S]] as const) out.push({ what: `${at} standing at ${what}`, box: headBox(p, s.face, main, false) });
  }
  return out;
}

const near = (a: Pt, b: Pt): boolean => Math.hypot(a.x - b.x, a.z - b.z) < 1e-4;

/** each head a hanging mesh hides on the screen at this stage */
function hidden(o: Office, stage: number, hs: readonly { what: string; box: Box3 }[]): string[] {
  const w = buildWorld(o, 'main', STYLE, lookOf(o.map), false, { ...NO_GROW, stage });
  w.root.updateMatrixWorld(true);
  const hanging: Box3[] = [];
  w.root.traverse((m) => {
    if (m.userData.shade === true) hanging.push(new Box3().setFromObject(m, true));
  });
  w.dispose();
  const out: string[] = [];
  for (const [px, fit] of fitsOf(o)) {
    for (const h of hs) {
      const r = onScreen(fit, h.box);
      for (const b of hanging) {
        if (depth(b) <= depth(h.box)) continue;
        if (meets(r, onScreen(fit, b))) out.push(`${px}, stage ${String(stage)}, ${h.what}: a shade at y ${b.min.y.toFixed(2)}..${b.max.y.toFixed(2)} (${((b.min.x + b.max.x) / 2).toFixed(2)},${((b.min.z + b.max.z) / 2).toFixed(2)}) over its head`);
      }
    }
  }
  return out;
}

describe('no lamp shade hides a desk bim\'s head on the screen', () => {
  it('nordic tags its shades', () => {
    const o = layoutOf(crowd(3).agents, 'nordic');
    const w = buildWorld(o, 'main', STYLE, lookOf(o.map), false, { ...NO_GROW, stage: 0 });
    let n = 0;
    w.root.traverse((m) => {
      if (m.userData.shade === true) n++;
    });
    w.dispose();
    expect(n).toBeGreaterThan(2);
  });
  for (const id of readyMaps()) {
    it(`${id}: every chair, seated and standing, 320 and 640, every stage, 3 and 20 agents`, async () => {
      const out: string[] = [];
      for (const n of [3, 20]) {
        const o = layoutOf(crowd(n).agents, id);
        const hs = heads(o);
        for (let stage = 0; stage <= LAST_STAGE; stage++) {
          out.push(...hidden(o, stage, hs).map((h) => `${String(n)} agents, ${h}`));
          await turn();
        }
      }
      expect(out.slice(0, 8)).toEqual([]);
    }, 120_000);
  }
});

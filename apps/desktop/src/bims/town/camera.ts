// The town's camera (pure, no three): the same 2:1 iso view as the office (render/camera.ts), fitted
// to the town's ground, and the dive into one office. The dive ends on exactly the fit the office
// opens with (bims m_28737: its site at this width, siteOf at 320, wideSiteOf from 480, moved to
// where the town put it), so the swap to its Office only changes what is around it (the way between
// the two fits: town/dive.ts), and the near and far planes that hold the whole town for any view
// of it (townDepth). The renderer's side: it reads render/camera.ts. Owner: maps-e.
import type { Office } from '../model';
import { BACK, DIST, fitSite, siteOf as buildingSite, wideSiteOf, type Fit, type Site } from '../render/camera';
import type { Placed, TownPlan } from './plan';

/** from this width (css px) the office fits its building and a little ground (render/index.ts's WIDE_FIT_PX) */
export const WIDE_FIT_PX = 480;

/** the town's ground as a site: the lawn block, the trees and roofs over it */
export function townSite(plan: TownPlan): Site {
  return { ...plan.lawn, yLow: -1.35, yHigh: 3.0 };
}

/** The town fitted to the width (its height follows, at most maxH). Pure. */
export function townFit(plan: TownPlan, widthPx: number, maxH: number): Fit {
  return fitSite(townSite(plan), widthPx, maxH);
}

/** room before and after the town's ground on the camera's line (its roofs, a tree past the lawn's edge) */
const DEPTH_PAD = 4;

/**
 * The camera's near and far planes for a view of this town: its whole lawn, from under its blocks to
 * its tallest roof, between them. The camera stands DIST from the view's target (render/view.ts);
 * from ~12 projects the town's front corner is nearer than that, and a fixed near plane cut it off
 * (the offices nearest the camera vanished, a merged office whole). Pure.
 */
export function townDepth(plan: TownPlan, target: { readonly x: number; readonly y: number; readonly z: number }): { near: number; far: number } {
  const s = townSite(plan);
  let min = Infinity;
  let max = -Infinity;
  for (const x of [s.x0, s.x1]) {
    for (const y of [s.yLow, s.yHigh]) {
      for (const z of [s.z0, s.z1]) {
        const d = DIST - ((x - target.x) * BACK.x + (y - target.y) * BACK.y + (z - target.z) * BACK.z);
        min = Math.min(min, d);
        max = Math.max(max, d);
      }
    }
  }
  return { near: min - DEPTH_PAD, far: max + DEPTH_PAD };
}

/** What the office's own view fits at this width, where the town put it. Pure. */
export function officeSiteIn(p: Placed, o: Office, widthPx: number): Site {
  const s = widthPx >= WIDE_FIT_PX ? wideSiteOf(o) : buildingSite(o);
  return { ...s, x0: s.x0 + p.x, x1: s.x1 + p.x, z0: s.z0 + p.z, z1: s.z1 + p.z };
}

/** The dived fit: the office's own (Office.tsx's renderer fits it to the width, at most 4000 px high). Pure. */
export function diveFit(p: Placed, o: Office, widthPx: number): Fit {
  return fitSite(officeSiteIn(p, o, widthPx), widthPx, 4000);
}

// The camera's fit (pure, no three): a true 2:1 isometric orthographic view (azimuth 45°, elevation
// 30°: a floor tile's diagonal is twice as wide as it is tall), fitted to the bar's width so the
// whole site (the floating grass block, the office on it, its trees) shows, never cropped. index.ts
// copies a Fit onto three's OrthographicCamera; headOf and pick use toScreen, the same numbers.
// His pinch and pan (zoom.ts Cam) are a view inside the fit (viewFit), the canvas's size unchanged.
import type { Office, Pt } from '../model';
import type { Cam } from '../zoom';
import { WIDE_GARDEN, groundMargin } from '../growth';

export const AZ = Math.PI / 4;
export const EL = Math.PI / 6;
/** the camera's distance from the site's centre (orthographic: only the clipping planes care) */
export const DIST = 60;
/** world units of margin around the site */
const PAD = 0.25;

/** the floating block the office sits on, and how high things on it go (world.ts builds within it) */
export interface Site {
  readonly x0: number;
  readonly x1: number;
  readonly z0: number;
  readonly z1: number;
  /** the block's underside, the top of the tallest thing (trees, the parasol) */
  readonly yLow: number;
  readonly yHigh: number;
}

/** the building's site: what the camera fits at 320 (the garden past it is cropped, a soft fade) */
export function siteOf(o: Office): Site {
  return { x0: o.x0 - 1.2, x1: o.x0 + o.W + 1.2, z0: -1.5, z1: o.D + 4.8, yLow: -1.35, yHigh: 2.5 };
}

/** The whole ground for this growth: the grass block world.ts builds (growth.ts groundMargin). */
export function groundOf(o: Office, g: { readonly stage: number; readonly garden: number }): Site {
  const s = siteOf(o);
  const m = groundMargin(g);
  return { x0: s.x0 - m, x1: s.x1 + m, z0: s.z0 - m / 2, z1: s.z1 + m / 2, yLow: s.yLow, yHigh: g.stage >= 13 ? 3.0 : s.yHigh };
}

/**
 * What the camera fits wide: the building and WIDE_GARDEN of ground each side, whatever the growth
 * (bims m_28178: the office never gets smaller as the project grows; the garden past it is cropped
 * with the same soft fade as 320's).
 */
export function wideSiteOf(o: Office): Site {
  const s = siteOf(o);
  return { ...s, x0: s.x0 - WIDE_GARDEN, x1: s.x1 + WIDE_GARDEN, z0: s.z0 - WIDE_GARDEN / 2, z1: s.z1 + WIDE_GARDEN / 2 };
}

export interface V3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** the view's axes: right and up on the screen, and the way from the target to the camera */
export const RIGHT: V3 = { x: Math.cos(AZ), y: 0, z: -Math.sin(AZ) };
export const UP: V3 = { x: -Math.sin(AZ) * Math.sin(EL), y: Math.cos(EL), z: -Math.cos(AZ) * Math.sin(EL) };
export const BACK: V3 = { x: Math.sin(AZ) * Math.cos(EL), y: Math.sin(EL), z: Math.cos(AZ) * Math.cos(EL) };

const dot = (a: V3, b: V3): number => a.x * b.x + a.y * b.y + a.z * b.z;

/** the camera's frame: the target it looks at, the view's bounds around it, world units per css px */
export interface Fit {
  readonly target: V3;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  /** world units per css px */
  readonly scale: number;
  readonly widthPx: number;
  readonly heightPx: number;
}

/** fit the site to the width; if it would pass maxHeightPx, fit it to that height instead (narrower, centred) */
export function fitSite(site: Site, widthPx: number, maxHeightPx: number): Fit {
  const target: V3 = { x: (site.x0 + site.x1) / 2, y: 0, z: (site.z0 + site.z1) / 2 };
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  for (const x of [site.x0, site.x1]) {
    for (const y of [site.yLow, site.yHigh]) {
      for (const z of [site.z0, site.z1]) {
        const p = { x: x - target.x, y: y - target.y, z: z - target.z };
        const vx = dot(p, RIGHT);
        const vy = dot(p, UP);
        minx = Math.min(minx, vx); maxx = Math.max(maxx, vx);
        miny = Math.min(miny, vy); maxy = Math.max(maxy, vy);
      }
    }
  }
  const w = Math.max(1, widthPx);
  const spanX = maxx - minx + 2 * PAD;
  const spanY = maxy - miny + 2 * PAD;
  let scale = spanX / w;
  let heightPx = Math.ceil(spanY / scale);
  if (maxHeightPx > 0 && heightPx > maxHeightPx) {
    heightPx = Math.floor(maxHeightPx);
    scale = spanY / heightPx;
  }
  const cx = (minx + maxx) / 2;
  const cy = (miny + maxy) / 2;
  const halfW = (w * scale) / 2;
  const halfH = (heightPx * scale) / 2;
  return { target, left: cx - halfW, right: cx + halfW, top: cy + halfH, bottom: cy - halfH, scale, widthPx: w, heightPx };
}

/**
 * The fit seen through his camera (zoom.ts Cam): the same canvas size, `zoom` times closer, its
 * centre at (u, v) of the fit's rectangle. FIT gives the fit back. Pure.
 */
export function viewFit(fit: Fit, cam: Cam): Fit {
  const w = fit.right - fit.left;
  const h = fit.top - fit.bottom;
  const cx = fit.left + cam.u * w;
  const cy = fit.top - cam.v * h;
  const halfW = w / (2 * cam.zoom);
  const halfH = h / (2 * cam.zoom);
  return { ...fit, left: cx - halfW, right: cx + halfW, top: cy + halfH, bottom: cy - halfH, scale: fit.scale / cam.zoom };
}

/** a world point on the canvas, css px from its top left */
export function toScreen(fit: Fit, p: V3): { x: number; y: number } {
  const q = { x: p.x - fit.target.x, y: p.y - fit.target.y, z: p.z - fit.target.z };
  return { x: (dot(q, RIGHT) - fit.left) / fit.scale, y: (fit.top - dot(q, UP)) / fit.scale };
}

/** the height above the floor point `at` from which a thing drops in from above the canvas's top edge */
export function aboveTop(fit: Fit, at: Pt, margin = 0.6): number {
  const q = { x: at.x - fit.target.x, y: -fit.target.y, z: at.z - fit.target.z };
  const vy = dot(q, UP);
  return Math.max(2, (fit.top - vy) / Math.cos(EL) + margin);
}

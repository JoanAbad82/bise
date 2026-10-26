// src/artifacts/hero · the live banner scenes' framing and hover clock, pure and three-free. The
// signed stills were each trimmed to their drawn pixels and fitted into the banner's box with 6 px
// of air (bims-plugins m_45902): airFit does the same from the scene's points on the screen plane
// (render/camera.ts RIGHT, UP), so the live scene stands where its still stood. Owner: banner-3d.
import { RIGHT, UP, type Fit, type V3 } from '@/bims/render/camera';

/** css px of air left around the drawn scene in its box (the stills' crop.mjs: 12 at 2x) */
export const AIR_PX = 6;

/** how long one hover move lasts in a banner, ms (designer m_45900: 300-500) */
export const BANNER_HOVER_MS = 450;

/** the scene's extent on the screen plane: its points' least and most along RIGHT and UP, world units */
export interface Span {
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
}

const dot = (a: V3, b: V3): number => a.x * b.x + a.y * b.y + a.z * b.z;

/** the screen plane's extent of points, seen from the iso camera; null when there are none */
export function spanOf(points: Iterable<V3>): Span | null {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of points) {
    const u = dot(p, RIGHT);
    const v = dot(p, UP);
    x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v);
  }
  return Number.isFinite(x0) ? { x0, x1, y0, y1 } : null;
}

/**
 * The span seen whole and centred in a w x h css px box, `air` px left on its tighter sides: the
 * camera looks at the world's origin (the span is measured from it), the box keeps its size.
 */
export function airFit(s: Span, w: number, h: number, air = AIR_PX): Fit {
  const W = Math.max(1, w);
  const H = Math.max(1, h);
  const iw = Math.max(1, W - 2 * air);
  const ih = Math.max(1, H - 2 * air);
  const scale = Math.max((s.x1 - s.x0) / iw, (s.y1 - s.y0) / ih, 1e-6);
  const cx = (s.x0 + s.x1) / 2;
  const cy = (s.y0 + s.y1) / 2;
  const hw = (W * scale) / 2;
  const hh = (H * scale) / 2;
  return { target: { x: 0, y: 0, z: 0 }, left: cx - hw, right: cx + hw, top: cy + hh, bottom: cy - hh, scale, widthPx: W, heightPx: H };
}

/** where a hover move is at `now` (0..1), 1 once done or when none plays (t0 0) */
export const hoverT = (t0: number, now: number): number => (t0 > 0 ? Math.min(1, Math.max(0, (now - t0) / BANNER_HOVER_MS)) : 1);

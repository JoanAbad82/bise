// The dive's way (pure, no three, no render module: Town.tsx imports it in the entry chunk): from
// the town's fit to the fit its Office opens with (town/camera.ts diveFit), DIVE_S long, the
// canvas's height going with it. Owner: maps-e.
import type { Fit } from '../render/camera';

/** the dive's length (s); reduced motion: a cut */
export const DIVE_S = 0.4;

const lerp = (a: number, b: number, f: number): number => a + (b - a) * f;

/** smoothstep's ease in and out */
export const ease = (f: number): number => {
  const x = Math.min(1, Math.max(0, f));
  return x * x * (3 - 2 * x);
};

/**
 * The view `f` of the way from the town's fit to the dived one (0: the town, 1: the office's own).
 * The scale goes geometrically (a steady zoom), the canvas's height with it. Pure.
 */
export function diveAt(from: Fit, to: Fit, f: number): Fit {
  const e = ease(f);
  if (e <= 0) return from;
  if (e >= 1) return to;
  const scale = from.scale * Math.pow(to.scale / from.scale, e);
  const heightPx = Math.round(lerp(from.heightPx, to.heightPx, e));
  const target = { x: lerp(from.target.x, to.target.x, e), y: lerp(from.target.y, to.target.y, e), z: lerp(from.target.z, to.target.z, e) };
  const cx = lerp((from.left + from.right) / 2, (to.left + to.right) / 2, e);
  const cy = lerp((from.top + from.bottom) / 2, (to.top + to.bottom) / 2, e);
  const halfW = (from.widthPx * scale) / 2;
  const halfH = (heightPx * scale) / 2;
  return { target, left: cx - halfW, right: cx + halfW, top: cy + halfH, bottom: cy - halfH, scale, widthPx: from.widthPx, heightPx };
}

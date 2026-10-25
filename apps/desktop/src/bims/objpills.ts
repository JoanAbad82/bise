// His plugins' objects' '?' / '✗' pills over the office (bims-plugins p4 step 2): a broken plugin's
// object (glass) gets the '✗', one that waits on his login the '?', each over its object's top, where
// the office draws it now. Pure: the office (Office.tsx) gives it the canvas's projection.
// Owner: bims-life.
import type { Placed } from './corners';

/** a pill over an object: its plugin's key, its sign, css px on the canvas */
export interface ObjPill {
  readonly key: string;
  readonly pill: '?' | '✗';
  readonly x: number;
  readonly y: number;
}

/** how far over an object's top its pill floats (office units) */
export const PILL_LIFT = 0.3;

/** The pills of the objects that have one and are in view, in the placed order. Pure. */
export function objPillsOf(placed: readonly Placed[], at: (x: number, y: number, z: number) => { readonly x: number; readonly y: number } | null): ObjPill[] {
  const out: ObjPill[] = [];
  for (const p of placed) {
    if (p.pill === null) continue;
    const s = at(p.x, p.foot.h + PILL_LIFT, p.z);
    if (s === null) continue;
    out.push({ key: p.key, pill: p.pill, x: Math.round(s.x), y: Math.round(s.y) });
  }
  return out;
}

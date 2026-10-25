// His sketch's growth (bims-plugins p5, page bims-plugins v14, m_41425): when his plugins' objects
// run out of room in the square (corners.ts `left`, even compact), the office grows by the step of
// his sketch the leftovers need: a WING past its right side for the indoor ones (the office going on,
// open to the square, aligned on its back wall: its floor, its back wall, a window; bims walk there,
// no desk), a GARDEN in front of the terrace aligned on its left for the outdoor ones (a hedge, a
// tree, a stone path from the door). Then corners.ts places every object again on the whole floor
// (with prev: a placed one stays where its corner still holds), never only the leftovers in it.
// Pure, three-free. Owner: bims-life.
import { CORNER, objectSpots, type Placed } from './corners';
import type { Box, Leg, Office, Pt } from './model';
import type { MapId } from './maps/ids';
import type { PluginObject } from './plugin-objects';
import { terraceSlab } from './render/decor';

/** the maps that grow like his sketch so far (each map's look of them comes in its own step); the others wait, their objects in `left` */
export const GROWS: ReadonlySet<MapId> = new Set<MapId>(['loft']);

/** which of his sketch's extensions an office needs */
export interface Need {
  readonly wing: boolean;
  readonly garden: boolean;
}

export const NO_NEED: Need = { wing: false, garden: false };

/** an extension's share of the square's width and depth (his sketch: a bit under half) */
export const EXT_SHARE = 0.42;
/** an extension's least width and depth (office units): room for a corner's cluster and a walk */
export const EXT_MIN = 4;
/** how far in from the wing's open side its walk runs, and how far short of its far end */
const WING_IN = 0.6;
const WING_END = 1.0;
/** the stone path's distance from the garden's back edge (the terrace's front) */
const PATH_IN = 0.6;

/** What his objects that found no room in the square need: the wing for an indoor one, the garden for an outdoor one. Pure. */
export function needOf(left: readonly PluginObject[]): Need {
  let wing = false;
  let garden = false;
  for (const p of left) {
    if (CORNER[p.obj] === 'terrace') garden = true;
    else wing = true;
  }
  return { wing, garden };
}

/** the larger of two needs (the high-water mark: an extension, once come, stays) */
export const either = (a: Need, b: Need): Need => ({ wing: a.wing || b.wing, garden: a.garden || b.garden });

const size = (n: number): number => Math.max(EXT_MIN, Math.round(n * EXT_SHARE));

/** The wing's floor: past the square's right side, from its back wall. Pure. */
export function wingOf(o: Office): Box {
  const x0 = o.x0 + o.W;
  return { x0, x1: x0 + size(o.W), z0: 0, z1: Math.min(o.D, size(o.D)) };
}

/** The garden: in front of the terrace, from the square's left edge, as far as the door's line and past it. Pure. */
export function gardenOf(o: Office): Box {
  const t = terraceSlab(o);
  const x1 = Math.max(o.x0 + size(o.W), o.door.x + 1.2);
  return { x0: o.x0, x1, z0: t.z1, z1: t.z1 + size(o.D) };
}

/** the network's walk out of the square into the wing: from main's desk along its line, then down the wing's middle */
function wingLegs(o: Office, w: Box): Leg[] {
  const from: Pt = { x: o.mainDesk.x, z: o.mainDesk.z };
  const z = (w.z0 + w.z1) / 2;
  const a: Pt = { x: w.x0 + WING_IN, z: from.z };
  const b: Pt = { x: w.x0 + WING_IN, z };
  const c: Pt = { x: w.x1 - WING_END, z };
  return [[from, a], [a, b], [b, c]];
}

/** the stone path: from the door straight out over the terrace to the garden, then along its back */
function gardenLegs(o: Office, g: Box): Leg[] {
  const from: Pt = { x: o.door.x, z: o.door.z };
  const z = g.z0 + PATH_IN;
  const a: Pt = { x: o.door.x, z };
  const b: Pt = { x: g.x0 + WING_END, z };
  return [[from, a], [a, b]];
}

/** The office grown by what it needs: its wing and garden, and their walks on the network. The same office and need give the same one. Pure. */
export function withExtensions(o: Office, need: Need): Office {
  if (!need.wing && !need.garden) return o;
  const wing = need.wing ? wingOf(o) : undefined;
  const garden = need.garden ? gardenOf(o) : undefined;
  const walks = [...o.walks, ...(wing ? wingLegs(o, wing) : []), ...(garden ? gardenLegs(o, garden) : [])];
  return { ...o, walks, ...(wing ? { wing } : {}), ...(garden ? { garden } : {}) };
}

/**
 * The office his objects need and their spots in it: the square first; what found no room there
 * brings the extensions it needs (with `high`, the ones already come: they never go), and every
 * object is placed again on the grown office, each kept where it still fits (`prev`). Pure.
 */
export function grownFor(o: Office, objs: readonly PluginObject[], prev: readonly Placed[], high: Need = NO_NEED): { office: Office; need: Need } {
  const square = objectSpots(o, objs, prev);
  const need = either(high, needOf(square.left));
  return { office: withExtensions(o, need), need };
}

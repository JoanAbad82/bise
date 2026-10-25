// His sketch's growth (bims-plugins p5, page bims-plugins v14, m_41425): when his plugins' objects
// run out of room in the square (corners.ts `left`, even compact), the office grows by the step of
// his sketch the leftovers need: a WING past its right side for the indoor ones (the office going on,
// open to the square, aligned on its back wall: its floor, its back wall, a window; bims walk there,
// no desk), a GARDEN in front of the terrace aligned on its left for the outdoor ones (a hedge, a
// tree, a stone path from the door). Then corners.ts places every object again on the whole floor
// (with prev: a placed one stays where its corner still holds), never only the leftovers in it.
// Pure, three-free. Owner: bims-life.
import { CORNER, objectSpots, type Placed } from './corners';
import { FEET } from './render/objects/feet';
export { wingLamp, wingWindow } from './wing';
import type { Box, Leg, Office, Pt } from './model';
import type { MapId } from './maps/ids';
import type { Cozy } from './cozy';
import type { PluginObject } from './plugin-objects';
import { decorOf, terraceSlab } from './render/decor';

/** the maps that grow like his sketch so far (each map's look of them comes in its own step); the others wait, their objects in `left` */
export const GROWS: ReadonlySet<MapId> = new Set<MapId>(['loft', 'campus', 'workshop', 'kyoto', 'riad', 'nordic', 'patio', 'haveli', 'tropical', 'cyclades', 'sahel', 'greenhouse', 'climb', 'california']);
/** the maps whose wing goes on past the office's LEFT side (california: its office is beside the park; never past the park, designer m_41482) */
export const WING_LEFT: ReadonlySet<MapId> = new Set<MapId>(['california']);

/** the office's own room's width: the square's, short of a park beside it */
const roomW = (o: Office): number => (o.park !== undefined && o.park.area.x0 > o.x0 ? o.park.area.x0 - o.x0 : o.W);

/** a wing past the office's left side (WING_LEFT) */
export const wingIsLeft = (o: Office, w: Box): boolean => w.x1 <= o.x0 + 1e-9;

/** which of his sketch's extensions an office needs */
export interface Need {
  /** the wing's depth (office units, from the back wall), sized to what it must hold; 0: no wing */
  readonly wing: number;
  readonly garden: boolean;
}

export const NO_NEED: Need = { wing: 0, garden: false };

/** an extension's share of the square's width and depth (his sketch: a bit under half) */
export const EXT_SHARE = 0.42;
/** an extension's least width and depth (office units): room for a corner's cluster and a walk */
export const EXT_MIN = 4;
/** the wing's least depth: one row of things against its back wall and its walk */
export const WING_MIN_D = 3;
/** room round each thing (its gap, a bim's way past) and the walk's band along the wing's front, when sizing it */
const AROUND = 0.6;
const WALK_BAND = 1.4;
/** the travel things go out to the garden together (designer m_41450) */
const TRAVEL: ReadonlySet<string> = new Set(['mailbox', 'scooter', 'bike']);
/** how far in from the wing's open side its walk runs, and how far short of its far end */
const WING_IN = 0.6;
const WING_END = 1.0;
/** the stone path's distance from the garden's back edge (the terrace's front) */
const PATH_IN = 0.6;

/**
 * What his objects that found no room in the square need: the garden for an outdoor or a travel
 * one, the wing for the others, deep enough for them (its depth from their floor, designer
 * m_41450: never a hall), at most its sketch step. Pure.
 */
export function needOf(o: Office, left: readonly PluginObject[]): Need {
  let area = 0;
  let garden = false;
  for (const p of left) {
    if (CORNER[p.obj] === 'terrace' || TRAVEL.has(p.obj)) garden = true;
    else area += (FEET[p.obj].w + AROUND) * (FEET[p.obj].d + AROUND);
  }
  if (area === 0) return { wing: 0, garden };
  const width = size(roomW(o));
  const wing = Math.min(Math.min(o.D, size(o.D)), Math.max(WING_MIN_D, Math.ceil(area / width + WALK_BAND)));
  return { wing, garden };
}

/** the larger of two needs (the high-water mark: an extension, once come, stays and never gets smaller) */
export const either = (a: Need, b: Need): Need => ({ wing: Math.max(a.wing, b.wing), garden: a.garden || b.garden });

const size = (n: number): number => Math.max(EXT_MIN, Math.round(n * EXT_SHARE));

/** The wing's floor: past the square's right side, from its back wall, this deep (its sketch step at most). Pure. */
export function wingOf(o: Office, depth = size(o.D)): Box {
  const z1 = Math.min(o.D, size(o.D), depth);
  const w = size(roomW(o));
  if (WING_LEFT.has(o.map)) return { x0: o.x0 - w, x1: o.x0, z0: 0, z1 };
  const x0 = o.x0 + o.W;
  return { x0, x1: x0 + w, z0: 0, z1 };
}

/** The garden: in front of the terrace, from the square's left edge, as far as the door's line and past it. Pure. */
export function gardenOf(o: Office): Box {
  const t = terraceSlab(o);
  const x1 = Math.max(o.x0 + size(o.W), o.door.x + 1.2);
  return { x0: o.x0, x1, z0: t.z1, z1: t.z1 + size(o.D) };
}

/** how far a new walk keeps off furniture and cozy pieces */
const CLEAR = 0.3;

/** what a new walk keeps off: the plan's furniture, the cozy pieces, the terrace's decor */
function solidsOf(o: Office): Box[] {
  const c = o.cozy;
  const dec = decorOf(o);
  const decor = [dec.parasol, dec.palm, dec.ramp].map((f) => ({ x0: f.x - f.hw, x1: f.x + f.hw, z0: f.z - f.hd, z1: f.z + f.hd }));
  return [...o.furniture, ...(c ? [c.coffee, c.shelf, ...c.lamps, ...c.plants].map((i) => i.box) : []), ...decor, ...(o.props ?? [])];
}

/** a straight leg (along x or z) clear of every solid by CLEAR */
function clearLeg(l: Leg, solids: readonly Box[]): boolean {
  const [a, b] = l;
  const box = { x0: Math.min(a.x, b.x) - CLEAR, x1: Math.max(a.x, b.x) + CLEAR, z0: Math.min(a.z, b.z) - CLEAR, z1: Math.max(a.z, b.z) + CLEAR };
  return !solids.some((f) => box.x0 < f.x1 && box.x1 > f.x0 && box.z0 < f.z1 && box.z1 > f.z0);
}

/**
 * The network's walk out of the square into the wing: from the walk's point nearest the wing whose
 * straight way across is clear (main's desk when none is), into the wing, then along its open front
 * (its back wall's floor stays for things).
 */
function wingLegs(o: Office, w: Box, solids: readonly Box[] = solidsOf(o)): Leg[] | null {
  const left = wingIsLeft(o, w);
  const x = left ? w.x1 - WING_IN : w.x0 + WING_IN;
  const z = w.z1 - WING_IN;
  // from a walk's point: a step along its aisle to a clear line (zIn), across into the wing, to its front, along it
  const tail = (from: Pt, zIn = from.z): Leg[] => {
    const s: Pt = { x: from.x, z: zIn };
    const a: Pt = { x, z: zIn };
    const b: Pt = { x, z };
    const legs: Leg[] = zIn === from.z ? [] : [[from, s]];
    return [...legs, [s, a], [a, b], [b, { x: left ? w.x0 + WING_END : w.x1 - WING_END, z }]];
  };
  // the walk's points on the wing's side, nearest it first
  const gap = (p: Pt): number => (left ? p.x - w.x1 : w.x0 - p.x);
  const ends = o.walks.flatMap(([a, b]) => [a, b]).filter((p) => gap(p) > 0 && p.z >= 0.5 && p.z <= z);
  ends.sort((p, q) => gap(p) - gap(q) || p.z - q.z);
  for (const p of ends) {
    for (const dz of [0, 0.5, -0.5, 1, -1]) {
      const zIn = p.z + dz;
      if (zIn < 0.5 || zIn > z) continue;
      const legs = tail(p, zIn);
      if (legs.every((l) => (l[0].x === l[1].x && l[0].z === l[1].z) || clearLeg(l, solids))) return legs;
    }
  }
  return null;
}

/** the wing as deep as asked, or deeper until a clear walk reaches it (desks along the back: california's), and its walk */
function wingWithLegs(o: Office, depth: number): { wing: Box; legs: Leg[]; cozy?: Cozy } {
  const deeper = (solids?: readonly Box[]): { wing: Box; legs: Leg[] } | null => {
    for (let d = depth; d <= o.D; d += 0.5) {
      const wing = wingOf(o, d);
      const legs = wingLegs(o, wing, solids);
      if (legs !== null) return { wing, legs };
      if (wing.z1 < d) break;
    }
    return null;
  };
  const clear = deeper();
  if (clear !== null) return clear;
  // a cozy lamp or plant in the way (california's lamp by the wall the wing opens): the walk takes its place, the wing's own lamp replaces it
  const c = o.cozy;
  if (c) {
    const keep = solidsOf(o).filter((b) => !c.lamps.some((i) => i.box === b) && !c.plants.some((i) => i.box === b));
    const through = deeper(keep);
    if (through !== null) {
      const off = (i: { box: Box }): boolean => through.legs.every((l) => clearLeg(l, [i.box]));
      return { ...through, cozy: { ...c, lamps: c.lamps.filter(off), plants: c.plants.filter(off) } };
    }
  }
  // none clear (never on today's plans): main desk's line, as before
  const wing = wingOf(o, depth);
  const z = wing.z1 - WING_IN;
  const left = wingIsLeft(o, wing);
  const x = left ? wing.x1 - WING_IN : wing.x0 + WING_IN;
  const from: Pt = { x: o.mainDesk.x, z: o.mainDesk.z };
  return { wing, legs: [[from, { x, z: from.z }], [{ x, z: from.z }, { x, z }], [{ x, z }, { x: left ? wing.x0 + WING_END : wing.x1 - WING_END, z }]] };
}

/**
 * The stone path (render/extensions.ts lays its stones on it): from the door along the front wall
 * to a lane clear of the terrace's pieces, straight out to the garden, then along its back. Pure.
 */
export function gardenPath(o: Office, g: Box): Pt[] {
  const solids = solidsOf(o);
  const from: Pt = { x: o.door.x, z: o.door.z };
  const z = g.z0 + PATH_IN;
  const end: Pt = { x: g.x0 + WING_END, z };
  const lanes: number[] = [];
  for (let d = 0; d <= g.x1 - g.x0; d += 0.25) for (const x of d === 0 ? [o.door.x] : [o.door.x - d, o.door.x + d]) if (x >= g.x0 + WING_END && x <= g.x1 - 0.5) lanes.push(x);
  for (const x of lanes) {
    const pts: Pt[] = x === from.x ? [from, { x, z }, end] : [from, { x, z: from.z }, { x, z }, end];
    const legs = pts.slice(1).map((p, i): Leg => [pts[i] as Pt, p]);
    // the last leg runs along the garden's back: the terrace's pieces stand before it
    if (legs.slice(0, -1).every((l) => clearLeg(l, solids))) return pts;
  }
  return [from, { x: o.door.x, z }, end];
}

function gardenLegs(o: Office, g: Box): Leg[] {
  const pts = gardenPath(o, g);
  return pts.slice(1).map((p, i): Leg => [pts[i] as Pt, p]);
}

/** The office grown by what it needs: its wing and garden, and their walks on the network. The same office and need give the same one. Pure. */
export function withExtensions(o: Office, need: Need): Office {
  if (need.wing <= 0 && !need.garden) return o;
  const ww = need.wing > 0 ? wingWithLegs(o, need.wing) : undefined;
  const wing = ww?.wing;
  const garden = need.garden ? gardenOf(o) : undefined;
  const walks = [...o.walks, ...(ww ? ww.legs : []), ...(garden ? gardenLegs(o, garden) : [])];
  return { ...o, walks, ...(ww?.cozy ? { cozy: ww.cozy } : {}), ...(wing ? { wing } : {}), ...(garden ? { garden } : {}) };
}

/**
 * The office his objects need and their spots in it: the square first; what found no room there
 * brings the extensions it needs (with `high`, the ones already come: they never go), and every
 * object is placed again on the grown office, each kept where it still fits (`prev`). Pure.
 */
export function grownFor(o: Office, objs: readonly PluginObject[], prev: readonly Placed[], high: Need = NO_NEED): { office: Office; need: Need } {
  const square = objectSpots(o, objs, prev);
  const need = either(high, needOf(o, square.left));
  return { office: withExtensions(o, need), need };
}

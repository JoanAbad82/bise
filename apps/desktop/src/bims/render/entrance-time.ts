// The banners' entrance (Gabriel m_48915: « une animation d'entrée des modèles 3d dans le même
// style que l'animation d'entrée des petits bims islands de la landing »): the home islands' entry
// (src/hero/islands-time.ts, on the hero's own build, entry.ts) on a banner's scene. Its ground
// (the slab, the room's walls and rugs) is cut into cubes about SIDE wide that rise from the paper
// in the hero's wave from the middle; each thing comes when the wave reaches the cube under its
// foot, pops and squashes once; a thing that stands on another (the notes on the desk) comes once
// that one is in; the bims land last; then the scene is still. The islands' timings, as they are.
// Pure (tested); entrance.ts moves the scene. Owner: banner-entrance.
import { ENTRY, tileStart } from '@/hero/entry';
import { type Cell, ISLAND_ENTRY, planOf } from '@/hero/islands-time';

export { cubeAt, landAt, thingAt, type Cell } from '@/hero/islands-time';

/** a cube's side, office units: the islands' (2.2 / 7), so a banner's cubes are the islands' size on screen */
export const SIDE = 0.3;
/** a foot this high (office units) stands on something: it waits for it */
const ON_TOP = 0.05;

/** a rectangle of the ground, x0..x1 by z0..z1 */
export interface Rect {
  readonly x0: number;
  readonly x1: number;
  readonly z0: number;
  readonly z1: number;
}

/** the ground cut into nx by nz cubes, `cw` by `cd` each; cells[i * nz + j], the middle first in the wave */
export interface Grid extends Rect {
  readonly nx: number;
  readonly nz: number;
  readonly cw: number;
  readonly cd: number;
  readonly side: number;
  readonly cells: readonly Cell[];
}

/** the cubes of a ground rect, about `side` wide each, and their start in the hero's wave from (0, 0). Pure. */
export function gridOf(r: Rect, side: number = SIDE): Grid {
  const nx = Math.max(1, Math.round((r.x1 - r.x0) / side));
  const nz = Math.max(1, Math.round((r.z1 - r.z0) / side));
  const cw = (r.x1 - r.x0) / nx;
  const cd = (r.z1 - r.z0) / nz;
  const mids: { x: number; z: number }[] = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) mids.push({ x: r.x0 + (i + 0.5) * cw, z: r.z0 + (j + 0.5) * cd });
  const dmax = Math.max(0, ...mids.map((m) => Math.hypot(m.x, m.z)));
  const cells = mids.map((m) => ({ ...m, start: tileStart(Math.hypot(m.x, m.z), dmax) }));
  return { ...r, nx, nz, cw, cd, side: Math.min(cw, cd), cells };
}

/** the index of the cube a point stands on (outside: the nearest one). Pure. */
export function cellIndexAt(g: Grid, x: number, z: number): number {
  const i = Math.min(g.nx - 1, Math.max(0, Math.floor((x - g.x0) / g.cw)));
  const j = Math.min(g.nz - 1, Math.max(0, Math.floor((z - g.z0) / g.cd)));
  return i * g.nz + j;
}

/** a box's part over one cube: its middle and size on the ground, and the cube it rides */
export interface Piece {
  readonly cell: number;
  readonly x: number;
  readonly z: number;
  readonly w: number;
  readonly d: number;
}

/** a ground box (a slab, a wall, a rug) cut along the cubes it lies on. Pure. */
export function piecesOf(g: Grid, b: Rect): readonly Piece[] {
  const out: Piece[] = [];
  const eps = 1e-6;
  for (let i = 0; i < g.nx; i++) {
    const a0 = Math.max(b.x0, g.x0 + i * g.cw);
    const a1 = Math.min(b.x1, g.x0 + (i + 1) * g.cw);
    if (a1 - a0 <= eps) continue;
    for (let j = 0; j < g.nz; j++) {
      const c0 = Math.max(b.z0, g.z0 + j * g.cd);
      const c1 = Math.min(b.z1, g.z0 + (j + 1) * g.cd);
      if (c1 - c0 <= eps) continue;
      out.push({ cell: i * g.nz + j, x: (a0 + a1) / 2, z: (c0 + c1) / 2, w: a1 - a0, d: c1 - c0 });
    }
  }
  return out;
}

/** a thing of the scene: its foot (the middle of its bottom) and its box on the ground, its top */
export interface Thing {
  readonly x: number;
  readonly z: number;
  /** its bottom */
  readonly y: number;
  readonly top: number;
  readonly box: Rect;
}

/**
 * When each thing starts (its cube's start, ms): when the wave reaches the cube under its foot; a
 * thing standing on another (its foot over that one's box, at its top) after that one has popped.
 * Pure.
 */
export function startsOf(g: Grid, things: readonly Thing[]): readonly number[] {
  const base = things.map((t) => g.cells[cellIndexAt(g, t.x, t.z)]?.start ?? 0);
  const on = (t: Thing, u: Thing): boolean =>
    u !== t && t.y > ON_TOP && u.y <= t.y && Math.abs(u.top - t.y) <= 0.15 && t.x >= u.box.x0 && t.x <= u.box.x1 && t.z >= u.box.z0 && t.z <= u.box.z1;
  return things.map((t, i) => {
    const under = things.flatMap((u, k) => (on(t, u) ? [base[k] ?? 0] : []));
    return Math.max(base[i] ?? 0, ...under.map((s) => s + ENTRY.thing.dur));
  });
}

/** the timeline, ms: the bims land at `bim`; at `done` the scene is built and still */
export interface Plan {
  readonly bim: number;
  readonly done: number;
}

/** when a thing that starts at `start` is in: popped, risen with its cube and squashed (islands-time's thingDone). Pure. */
export const thingEnd = (start: number): number =>
  Math.max(start + ENTRY.thing.after + ENTRY.thing.dur, start + ENTRY.tiles.dur + ISLAND_ENTRY.squash.dur);

/** the bims once every cube and every thing is in (the islands' planOf); still once they have landed, or then with none. Pure. */
export function planFor(g: Grid, things: readonly Thing[], starts: readonly number[], bims: number): Plan {
  const cells = things.map((t, i) => ({ x: t.x, z: t.z, start: starts[i] ?? 0 }));
  const p = planOf(g.cells, cells);
  return { bim: p.bim, done: bims > 0 ? p.bim + ISLAND_ENTRY.bim.dur : p.bim };
}

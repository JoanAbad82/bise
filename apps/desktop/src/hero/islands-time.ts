// The home islands' entry (designer's brief, page bims-home v11; Gabriel's note on its first shots: «
// j'imaginais la structure du sol et les object apparaitre comme l'animation de hero ou ça fait un
// genre de vague de cube depuis le centre »): the hero's own build (entry.ts) at an island's scale.
// The island's ground is a grid of small cubes rising from the paper in the hero's wave from the
// middle (its tileStart stagger, its tileAt curve, its rise for the cubes' size); each object comes
// when the wave reaches its cube, rises with it (the hero's thing beat and popOut) and settles with
// one small squash; the bim lands last (0.3 s), then the scene's gag plays, by 2.5 s. The page
// shadow grows with the risen cubes and is never there before them. Pure (tested); islands.ts draws
// it. Owner: bims-islands.
import { SLAB } from '@/bims/sprites/gags';
import { ENTRY, popAt, riseFor, tileAt, tileStart } from './entry';

/** the slab cut into N x N cubes (the town's are ~4 % of its lawn's side; these ~14 %, still small at 200 px) */
export const GRID = SLAB.n;
/** the timeline past the hero's own (ENTRY.tiles, ENTRY.thing), ms from the island's start */
export const ISLAND_ENTRY = {
  /** a thing's one small squash once its cube has settled */
  squash: { dur: 160, k: 0.1 },
  /** the bim lands over `dur`, falling from `drop` (office units) */
  bim: { dur: 300, drop: 0.7 },
  /** a breath between the bim's landing and the gag */
  breath: 60,
  /** the longest the entry may take before the gag */
  most: 2500,
} as const;

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

export interface Cell { readonly x: number; readonly z: number; readonly start: number }

/** the cubes of a slab `w` wide, their middles (x, z) and their start (ms): the hero's wave, the middle first. Pure. */
export function cellsOf(w: number): readonly Cell[] {
  const c = w / GRID;
  const dmax = Math.hypot(((GRID - 1) / 2) * c, ((GRID - 1) / 2) * c);
  const out: Cell[] = [];
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const x = (i - (GRID - 1) / 2) * c;
      const z = (j - (GRID - 1) / 2) * c;
      out.push({ x, z, start: tileStart(Math.hypot(x, z), dmax) });
    }
  }
  return out;
}

/** the cube a point of the slab stands on. Pure. */
export function cellAt(cells: readonly Cell[], x: number, z: number): Cell {
  let best = cells[0] ?? { x: 0, z: 0, start: 0 };
  for (const c of cells) if (Math.hypot(c.x - x, c.z - z) < Math.hypot(best.x - x, best.z - z)) best = c;
  return best;
}

/** a cube of side `side` at ms: its scale and how far under its place it still is (the hero's tileAt). Pure. */
export const cubeAt = (ms: number, start: number, side: number): { readonly s: number; readonly y: number } => tileAt(ms, start, riseFor(side));

/** every cube has settled */
export const settled = (ms: number, cells: readonly Cell[]): boolean => cells.every((c) => ms >= c.start + ENTRY.tiles.dur);

/** how much of the slab has risen (0..1): the page shadow's strength; 0 before the first cube. Pure. */
export function shadowAt(ms: number, cells: readonly Cell[]): number {
  if (cells.length === 0) return 1;
  let sum = 0;
  for (const c of cells) sum += clamp01((ms - c.start) / ENTRY.tiles.dur);
  return sum / cells.length;
}

/**
 * A thing on the cube `c` at ms: it comes a beat after its cube (the hero's thing), riding it up, and
 * once its cube has settled squashes once. Its height under its place, its scale, its height's scale. Pure.
 */
export function thingAt(ms: number, c: Cell, side: number): { readonly y: number; readonly s: number; readonly sy: number } {
  const cube = cubeAt(ms, c.start, side);
  const s = popAt(ms, c.start + ENTRY.thing.after, ENTRY.thing.dur);
  const landed = c.start + ENTRY.tiles.dur;
  const q = (ms - landed) / ISLAND_ENTRY.squash.dur;
  const sy = q > 0 && q < 1 ? 1 - ISLAND_ENTRY.squash.k * Math.sin(Math.PI * q) : 1;
  return { y: cube.y, s, sy };
}

/** when a thing on cube c is done: in, risen and squashed */
const thingDone = (c: Cell): number => Math.max(c.start + ENTRY.thing.after + ENTRY.thing.dur, c.start + ENTRY.tiles.dur + ISLAND_ENTRY.squash.dur);

export interface Plan {
  /** the bim's landing's start, ms */
  readonly bim: number;
  /** the gag's start, ms */
  readonly gag: number;
}

/** the timeline: the bim once every cube and every thing (on its cube) is in, then the gag. Pure. */
export function planOf(cells: readonly Cell[], things: readonly Cell[]): Plan {
  const tiles = Math.max(0, ...cells.map((c) => c.start + ENTRY.tiles.dur));
  const bim = Math.max(tiles, ...things.map(thingDone));
  return { bim, gag: bim + ISLAND_ENTRY.bim.dur + ISLAND_ENTRY.breath };
}

/** the bim landing at ms from start: its lift over its place, its squash (bim.ts rig.squash k), not yet before. Pure. */
export function landAt(ms: number, start: number): { readonly y: number; readonly k: number; readonly shown: boolean } {
  if (ms < start) return { y: 0, k: 0, shown: false };
  const p = clamp01((ms - start) / ISLAND_ENTRY.bim.dur);
  // falls over its first 60 %, squashes once, springs back
  if (p < 0.6) return { y: ISLAND_ENTRY.bim.drop * (1 - (p / 0.6) ** 2), k: 0, shown: true };
  if (p < 1) return { y: 0, k: 0.4 * Math.sin((Math.PI * (p - 0.6)) / 0.4), shown: true };
  return { y: 0, k: 0, shown: true };
}

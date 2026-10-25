// The home islands' entry (designer's brief, page bims-home v11: « une animation d'entrée similaire a
// celle du hero section »): the hero's own build in miniature. The island's slab is cut into cubes
// that rise from the paper in one wave from its middle (≈ 0.9 s, the hero's popOut), its top
// settles, its props drop in one by one with one squash (office-scene.ts arriveAt, as bims-life's
// arrival), the bim lands last (0.3 s), then the scene's gag plays: 2.5 s at most before it. The page
// shadow grows with the slab and is never there before it. Pure (tested); islands.ts draws it.
// Owner: bims-islands.
import { ARRIVE_S, arriveAt } from '@/bims/render/office-scene';
import { popOut } from './entry';

/** the slab cut into N x N cubes */
export const GRID = 5;
/** the timeline, ms from the island's start */
export const ISLAND_ENTRY = {
  /** the cubes: the middle's starts at 0, the corners' `span` later; each rises in `dur` (the hero's own, 1500 + 450, shrunk) */
  tiles: { span: 450, dur: 450 },
  /** how far under its place a cube starts, office units */
  rise: 0.45,
  /** the props drop from `from`, `gap` apart, each over ARRIVE_S */
  props: { from: 650, gap: 120 },
  /** the bim lands over `dur`, falling from `drop` */
  bim: { dur: 300, drop: 0.7 },
  /** a breath between the bim's landing and the gag */
  breath: 120,
  /** the longest the entry may take before the gag */
  most: 2500,
} as const;

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
/** a thing not in yet: drawn this small (its shaders compile with the rest) */
export const NOT_YET = 1e-4;

export interface Plan {
  /** when the props drop, ms, in the island's order */
  readonly props: readonly number[];
  readonly bim: number;
  /** the gag's start, ms */
  readonly gag: number;
}

/** the timeline of an island with n props. Pure. */
export function planOf(n: number): Plan {
  const E = ISLAND_ENTRY;
  const props = Array.from({ length: n }, (_, i) => E.props.from + i * E.props.gap);
  const tilesEnd = E.tiles.span + E.tiles.dur;
  const bim = Math.max(tilesEnd, (props.at(-1) ?? 0) + ARRIVE_S * 1000 * (n > 0 ? 1 : 0));
  return { props, bim, gag: bim + E.bim.dur + E.breath };
}

/** the cubes' middles in the slab's top's (x, z), of a slab `w` wide, and their start (ms): the middle first, the corners last. Pure. */
export function cellsOf(w: number): readonly { readonly x: number; readonly z: number; readonly start: number }[] {
  const c = w / GRID;
  const dmax = Math.hypot(((GRID - 1) / 2) * c, ((GRID - 1) / 2) * c);
  const out: { x: number; z: number; start: number }[] = [];
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const x = (i - (GRID - 1) / 2) * c;
      const z = (j - (GRID - 1) / 2) * c;
      out.push({ x, z, start: ISLAND_ENTRY.tiles.span * (dmax > 0 ? Math.hypot(x, z) / dmax : 0) });
    }
  }
  return out;
}

/** a cube at ms: its scale and how far under its place it still is. Pure. */
export function cubeAt(ms: number, start: number): { readonly s: number; readonly y: number } {
  if (ms < start) return { s: NOT_YET, y: -ISLAND_ENTRY.rise };
  const p = clamp01((ms - start) / ISLAND_ENTRY.tiles.dur);
  return { s: Math.max(NOT_YET, popOut(p)), y: p >= 1 ? 0 : -ISLAND_ENTRY.rise * (1 - p) ** 3 };
}

/** the slab is whole: every cube settled */
export const settled = (ms: number): boolean => ms >= ISLAND_ENTRY.tiles.span + ISLAND_ENTRY.tiles.dur;

/** how much of the slab has risen (0..1): the page shadow's strength; 0 before the first cube. Pure. */
export function shadowAt(ms: number, cells: readonly { readonly start: number }[]): number {
  if (cells.length === 0) return 1;
  let sum = 0;
  for (const c of cells) sum += clamp01((ms - c.start) / ISLAND_ENTRY.tiles.dur);
  return sum / cells.length;
}

/** a prop dropping at ms from start: its height over its place (office units) and its height's scale; NOT_YET before. Pure. */
export function dropAt(ms: number, start: number): { readonly y: number; readonly sy: number; readonly s: number } {
  if (ms < start) return { y: 0, sy: 1, s: NOT_YET };
  const a = arriveAt((ms - start) / (ARRIVE_S * 1000));
  return { y: a.y, sy: a.sy, s: 1 };
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

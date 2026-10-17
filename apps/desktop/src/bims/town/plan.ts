// The town's plan (page bims-maps v9 « une ville moins robotique », town.js townStill2): one office
// per project, placed first and measured (its grass block, render/camera.ts groundOf), then the road
// and the river laid round them, never through one. Offices go in rows (a few per row); the road
// passes in front of each row's doors, turns wide round the row's end and passes the next row's
// doors the other way; the river comes down through a gap kept in each row (the next row is shifted
// so its gap sits near the one above) and passes under the road on bridges. A dirt path goes from
// each door straight to the road, a footbridge where it meets the river; trees in clumps and a few
// houses go only where nothing else is. `crossings` counts the road and river points inside an
// office (with their half widths): the plan keeps the first of a few seeds where both are 0
// (town/plan.test.ts checks 1..20 projects). Pure, no three, no DOM. Owner: maps-e.
import type { Pt } from '../model';

/** a floor rectangle, office units */
export interface Rect {
  readonly x0: number;
  readonly x1: number;
  readonly z0: number;
  readonly z1: number;
}

/** One project's office as the town gets it, in the office's own units (its plan's x, z). */
export interface TownSite {
  readonly id: string;
  /** its whole ground (the grass block): nothing of the town comes inside */
  readonly fp: Rect;
  /** its door's x: the dirt path leaves the ground's front edge there */
  readonly doorX: number;
}

/** An office where the town put it: add (x, z) to its own points. */
export interface Placed {
  readonly id: string;
  readonly x: number;
  readonly z: number;
  /** its ground, town units */
  readonly fp: Rect;
  /** the path's start: the door's x on the ground's front edge, town units */
  readonly door: Pt;
}

export interface Bridge extends Pt {
  /** the road's heading there (three's y rotation: atan2(dx, dz)) */
  readonly ang: number;
}

/** a dirt path, straight along +z from the door to the road */
export interface Path {
  readonly x: number;
  readonly z0: number;
  readonly z1: number;
}

export interface House extends Pt {
  readonly ang: number;
  readonly w: number;
  readonly d: number;
  /** which of the look's wall and roof colours (0..) */
  readonly tone: number;
}

export interface Tree extends Pt {
  readonly size: number;
}

export interface TownPlan {
  readonly offices: readonly Placed[];
  /** the road's middle line, points ~ROAD_STEP apart */
  readonly road: readonly Pt[];
  /** the river's middle line, points ~ROAD_STEP apart; empty with one office */
  readonly river: readonly Pt[];
  readonly bridges: readonly Bridge[];
  readonly paths: readonly Path[];
  /** where a path meets the river */
  readonly footbridges: readonly Pt[];
  readonly houses: readonly House[];
  readonly trees: readonly Tree[];
  /** the town's ground: everything is drawn inside it */
  readonly lawn: Rect;
  /** the seed it was laid with (the first one with no crossing) */
  readonly seed: number;
}

/** the road's half width, the river's (water) and its banks' */
export const ROAD = 1.25;
export const RIVER = 1.5;
export const BANK = 1.8;
/** the room kept between the two offices beside the river */
export const RIVER_GAP = 11;
/** the spacing of the road's and the river's points */
export const ROAD_STEP = 0.5;
/** at most this many offices in the town (page bims-maps v9: past ~20, the active ones) */
export const TOWN_MAX = 20;
/** the margins `crossings` keeps from an office: the road's and the river's half widths and a little */
const ROAD_KEEP = ROAD + 0.3;
const RIVER_KEEP = BANK - 0.2;
/** how many seeds the plan tries before keeping its best */
const TRIES = 12;

/** A small seeded random (mulberry32): the same town for the same projects. Pure. */
export function rngOf(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A string's seed (FNV-1a). Pure. */
export function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** How many offices go in a row for n of them: one row up to 3, then about a square. Pure. */
export function perRow(n: number): number {
  return n <= 3 ? Math.max(1, n) : Math.ceil(Math.sqrt(n * 1.3));
}

const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.z - b.z);

/** A polyline resampled every `step` along its length (its ends kept). Pure. */
export function resample(pts: readonly Pt[], step: number): Pt[] {
  const first = pts[0];
  if (first === undefined) return [];
  const out: Pt[] = [first];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1] ?? first;
    const b = pts[i] ?? a;
    const len = dist(a, b);
    let s = step - carry;
    while (s <= len) {
      const f = s / len;
      out.push({ x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f });
      s += step;
    }
    carry = len - (s - step);
  }
  const last = pts[pts.length - 1] ?? first;
  if (dist(out[out.length - 1] ?? first, last) > 1e-6) out.push(last);
  return out;
}

/** Chaikin's corner cutting, `n` times: every new point is on the old line, so the curve never leaves its corners' reach. Pure. */
export function chaikin(pts: readonly Pt[], n: number): Pt[] {
  let cur: readonly Pt[] = pts;
  for (let k = 0; k < n; k++) {
    if (cur.length < 3) return [...cur];
    const out: Pt[] = [cur[0] ?? { x: 0, z: 0 }];
    for (let i = 0; i < cur.length - 1; i++) {
      const a = cur[i] ?? { x: 0, z: 0 };
      const b = cur[i + 1] ?? a;
      out.push({ x: 0.75 * a.x + 0.25 * b.x, z: 0.75 * a.z + 0.25 * b.z }, { x: 0.25 * a.x + 0.75 * b.x, z: 0.25 * a.z + 0.75 * b.z });
    }
    out.push(cur[cur.length - 1] ?? { x: 0, z: 0 });
    cur = out;
  }
  return [...cur];
}

/** A line through these corners, its corners rounded by about `round`, points ROAD_STEP apart. Pure. */
export function smooth(corners: readonly Pt[], round: number): Pt[] {
  return resample(chaikin(resample(corners, round), 4), ROAD_STEP);
}

/** whether (x, z) is inside an office's ground grown by m */
function inside(offices: readonly Placed[], x: number, z: number, m: number): boolean {
  return offices.some((p) => x > p.fp.x0 - m && x < p.fp.x1 + m && z > p.fp.z0 - m && z < p.fp.z1 + m);
}

/** The road's and the river's points inside an office (each with its half width): both 0 in a good plan. Pure. */
export function crossings(plan: Pick<TownPlan, 'offices' | 'road' | 'river'>): { readonly road: number; readonly river: number } {
  return {
    road: plan.road.filter((q) => inside(plan.offices, q.x, q.z, ROAD_KEEP)).length,
    river: plan.river.filter((q) => inside(plan.offices, q.x, q.z, RIVER_KEEP)).length,
  };
}

interface Row {
  readonly offices: Placed[];
  /** the river's x through this row */
  readonly riverX: number;
  /** the row's backs and fronts (town z), its x span (the river's gap included) */
  readonly back: number;
  readonly front: number;
  readonly x0: number;
  readonly x1: number;
  /** the road's points in front of its doors, west to east */
  readonly stops: Pt[];
}

/** one row of offices from x = 0, the river's gap after office `gi` (past the last: east of it) */
function lineUp(sites: readonly TownSite[], gi: number, r: () => number): { xs: number[]; riverX: number; width: number } {
  const xs: number[] = [];
  let cur = 0;
  let riverX = 0;
  sites.forEach((s, i) => {
    const gap = i === 0 ? 0 : i - 1 === gi ? RIVER_GAP : 3 + r() * 4;
    if (i > 0 && i - 1 === gi) riverX = cur + RIVER_GAP / 2;
    const x = cur + gap - s.fp.x0;
    xs.push(x);
    cur = x + s.fp.x1;
  });
  if (gi >= sites.length - 1) {
    riverX = cur + RIVER_GAP / 2;
    cur += RIVER_GAP;
  }
  return { xs, riverX, width: cur };
}

/** the plan for one seed */
function layOut(sites: readonly TownSite[], seed: number): TownPlan {
  const r = rngOf(seed);
  const per = perRow(sites.length);
  const groups: TownSite[][] = [];
  for (let i = 0; i < sites.length; i += per) groups.push(sites.slice(i, i + per));
  const rows: Row[] = [];
  let top = 0;
  for (const [ri, g] of groups.entries()) {
    // the river's gap: after the middle office, one further every other row
    const gi = g.length === 1 ? 0 : Math.min(g.length - 2, Math.max(0, Math.floor(g.length / 2) - 1 + (ri % 2)));
    const line = lineUp(g, gi, r);
    const prev = rows[ri - 1];
    // the first row centred; the next ones shifted so their gap sits near the one above
    const shift = prev === undefined ? -line.width / 2 : prev.riverX + (r() - 0.5) * 6 - line.riverX;
    const offices: Placed[] = g.map((s, i) => {
      const x = (line.xs[i] ?? 0) + shift;
      const z = top + r() * 3.5 - s.fp.z0;
      return {
        id: s.id, x, z,
        fp: { x0: x + s.fp.x0, x1: x + s.fp.x1, z0: z + s.fp.z0, z1: z + s.fp.z1 },
        door: { x: x + s.doorX, z: z + s.fp.z1 },
      };
    });
    const front = Math.max(...offices.map((p) => p.fp.z1));
    const back = Math.min(...offices.map((p) => p.fp.z0));
    const stops = offices.map((p) => ({ x: p.door.x, z: front + ROAD + 1.4 + r() * 2.2 }));
    const riverX = line.riverX + shift;
    const x0 = Math.min(shift, ...offices.map((p) => p.fp.x0), riverX - RIVER_GAP / 2);
    const x1 = Math.max(shift + line.width, ...offices.map((p) => p.fp.x1), riverX + RIVER_GAP / 2);
    rows.push({ offices, riverX, back, front, x0, x1, stops });
    // the next row's backs: past this row's road, room for the river to cross
    top = Math.max(...stops.map((q) => q.z)) + ROAD + 4 + r() * 2.5;
  }
  const offices = rows.flatMap((w) => w.offices);
  const minX = Math.min(...rows.map((w) => w.x0));
  const maxX = Math.max(...rows.map((w) => w.x1));
  const minZ = Math.min(...rows.map((w) => w.back));
  const maxZ = Math.max(...rows.map((w) => Math.max(...w.stops.map((q) => q.z))));

  // the road: in from the west, each row's doors, a wide turn round the row's end, out at the last
  const corners: Pt[] = [];
  const firstStop = rows[0]?.stops[0] ?? { x: 0, z: 0 };
  corners.push({ x: minX - 40, z: firstStop.z - 3 }, { x: minX - 8, z: firstStop.z });
  rows.forEach((w, ri) => {
    const east = ri % 2 === 0;
    const stops = east ? w.stops : [...w.stops].reverse();
    corners.push(...stops);
    const next = rows[ri + 1];
    const end = stops[stops.length - 1] ?? firstStop;
    if (next === undefined) {
      corners.push({ x: east ? maxX + 8 : minX - 8, z: end.z }, { x: east ? maxX + 40 : minX - 40, z: end.z + 3 });
      return;
    }
    const nextStops = east ? [...next.stops].reverse() : next.stops;
    const start = nextStops[0] ?? end;
    const xt = east ? Math.max(w.x1, next.x1) + 6 + r() * 2 : Math.min(w.x0, next.x0) - 6 - r() * 2;
    const out = east ? 3 : -3;
    corners.push({ x: xt, z: end.z }, { x: xt + out, z: (end.z + start.z) / 2 }, { x: xt, z: start.z });
  });
  const road = smooth(corners, 2.5);

  // the river: from the north through each row's gap, across the road's band, out south
  const river: Pt[] = [];
  if (offices.length > 1) {
    const rc: Pt[] = [];
    const first = rows[0];
    if (first !== undefined) rc.push({ x: first.riverX - 3, z: minZ - 16 }, { x: first.riverX + 1, z: minZ - 8 });
    rows.forEach((w, ri) => {
      rc.push({ x: w.riverX, z: w.back - 3 }, { x: w.riverX, z: w.front + BANK + 0.6 });
      const next = rows[ri + 1];
      if (next !== undefined) rc.push({ x: next.riverX, z: next.back - BANK - 0.6 });
      else rc.push({ x: w.riverX + 2, z: maxZ + 8 }, { x: w.riverX - 2, z: maxZ + 18 });
    });
    river.push(...smooth(rc, 1.2));
  }

  const lawn: Rect = { x0: minX - 12, x1: maxX + 14, z0: minZ - 10, z1: maxZ + 10 };
  const inLawn = (x: number, z: number): boolean => x > lawn.x0 && x < lawn.x1 && z > lawn.z0 && z < lawn.z1;

  // bridges: where the road meets the river, one per crossing
  const bridges: Bridge[] = [];
  for (let i = 0; i < road.length - 1; i++) {
    const q = road[i];
    const n = road[i + 1];
    if (q === undefined || n === undefined || !inLawn(q.x, q.z)) continue;
    if (bridges.some((c) => dist(c, q) < 6)) continue;
    if (river.some((w) => dist(w, q) < ROAD_STEP)) bridges.push({ x: q.x, z: q.z, ang: Math.atan2(n.x - q.x, n.z - q.z) });
  }

  // a dirt path from each door straight to the road (the nearest crossing south of it)
  const paths: Path[] = [];
  const footbridges: Pt[] = [];
  for (const p of offices) {
    let hit = Infinity;
    for (let i = 0; i < road.length - 1; i++) {
      const a = road[i];
      const b = road[i + 1];
      if (a === undefined || b === undefined || (a.x - p.door.x) * (b.x - p.door.x) > 0 || a.x === b.x) continue;
      const z = a.z + ((b.z - a.z) * (p.door.x - a.x)) / (b.x - a.x);
      if (z > p.door.z && z < hit) hit = z;
    }
    if (!Number.isFinite(hit)) continue;
    const path = { x: p.door.x, z0: p.door.z, z1: hit };
    paths.push(path);
    const wet = river.filter((w) => Math.abs(w.x - path.x) < RIVER && w.z > path.z0 && w.z < path.z1 - ROAD);
    if (wet.length > 0) footbridges.push({ x: path.x, z: wet.reduce((s, w) => s + w.z, 0) / wet.length });
  }

  // houses along the road and trees in clumps, only where nothing else is
  const near = (pts: readonly Pt[], x: number, z: number, m: number): boolean => pts.some((q) => Math.abs(q.x - x) < m && Math.abs(q.z - z) < m && Math.hypot(q.x - x, q.z - z) < m);
  const free = (x: number, z: number, m: number): boolean =>
    inLawn(x, z) && !inside(offices, x, z, 1.2 + m) && !near(road, x, z, ROAD + 1.2 + m) && !near(river, x, z, BANK + 0.6 + m) &&
    paths.every((pa) => Math.abs(pa.x - x) > 1.2 + m || z < pa.z0 || z > pa.z1);
  const houses: House[] = [];
  const houseMax = Math.min(10, 3 + offices.length);
  for (let k = 0; k < 400 && houses.length < houseMax && road.length > 1; k++) {
    const i = Math.floor(r() * (road.length - 1));
    const q = road[i];
    const n = road[i + 1];
    if (q === undefined || n === undefined) continue;
    const ang = Math.atan2(n.x - q.x, n.z - q.z);
    const side = r() < 0.5 ? -1 : 1;
    const off = ROAD + 2.6;
    const x = q.x + Math.cos(ang) * off * side;
    const z = q.z - Math.sin(ang) * off * side;
    if (!free(x, z, 1.4) || near(houses, x, z, 4)) continue;
    houses.push({ x, z, ang, w: 1.7 + r() * 0.8, d: 1.7 + r() * 0.8, tone: houses.length });
  }
  const trees: Tree[] = [];
  const treeMax = 30 + offices.length * 8;
  for (let k = 0; k < 900 && trees.length < treeMax; k++) {
    const cx = lawn.x0 + r() * (lawn.x1 - lawn.x0);
    const cz = lawn.z0 + r() * (lawn.z1 - lawn.z0);
    if (!free(cx, cz, 0.6)) continue;
    const clump = 1 + Math.floor(r() * 5);
    for (let j = 0; j < clump; j++) {
      const x = cx + (r() - 0.5) * 3;
      const z = cz + (r() - 0.5) * 3;
      if (free(x, z, 0) && !near(houses, x, z, 2.2) && !near(trees, x, z, 0.7)) trees.push({ x, z, size: 0.75 + r() * 0.5 });
    }
  }
  return { offices, road, river, bridges, paths, footbridges, houses, trees, lawn, seed };
}

/**
 * The town for these offices, in this order: the first of a few seeds whose road and river never
 * enter an office (the fewest crossings if none is clean). `seed`: the town's own (seedOf its
 * projects' ids). Pure.
 */
export function townPlan(sites: readonly TownSite[], seed: number): TownPlan {
  let best: { plan: TownPlan; hits: number } | null = null;
  for (let k = 0; k < TRIES; k++) {
    const plan = layOut(sites, (seed + k * 7919) >>> 0);
    const c = crossings(plan);
    const hits = c.road + c.river;
    if (hits === 0) return plan;
    if (best === null || hits < best.hits) best = { plan, hits };
  }
  return best?.plan ?? layOut(sites, seed);
}

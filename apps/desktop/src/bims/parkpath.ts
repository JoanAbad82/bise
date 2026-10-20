// The skatepark's ground (Office.park, the California map; architect m_28929): what a board may ride
// on, and the ways round the pieces. Pure, no three. `surfaceAt` is the top a board rides at a point
// (the floor 0, a piece's top, the bowl's carved walls and floor below 0); `clearAt` the same with
// every piece's footprint pushed out by a margin, so its vertical faces stand round it (a board under
// that height there is in the piece). The ports: where a piece's line starts and ends on the floor,
// clear of every piece. `route`: a roll from one port to the next round the pieces (a grid path, its
// corners pulled straight then rounded), computed once per park and stage and kept (one router per
// park, 2 at most). skate.ts times a line's rolls by their length; render/skate.ts rides them; the
// look (render/maps/california.ts) carves the bowl with the same profile. Owner: skate-fix.
import type { Box, Park, Pt } from './model';

/** the park's pieces a trick rides on */
export type Feature = 'flat' | 'funbox' | 'qp' | 'curb' | 'rail' | 'ramp' | 'stairs' | 'ledge' | 'bowl' | 'vert';

/** the stage each piece is built at (growth.ts's stages; the brief: 3 curb .. 13 vert, 14 the golden board) */
export const FEATURE_STAGE: Readonly<Record<Feature, number>> = {
  flat: 0, funbox: 0, qp: 0, curb: 3, rail: 5, ramp: 7, stairs: 9, ledge: 9, bowl: 11, vert: 13,
};

/** whether a piece stands at this stage (the vert stands where the lone quarter pipe was) */
export const has = (stage: number, f: Feature): boolean => FEATURE_STAGE[f] <= stage && !(f === 'qp' && stage >= FEATURE_STAGE.vert);

/** the radius of the lone quarter pipe: the vert's from its stage */
export const qpR = (park: Park, stage: number): number => (stage >= FEATURE_STAGE.vert ? park.qp.r13 : park.qp.r);

/** a transition's height at d (0 at its foot .. r at its lip): a quarter circle of radius r */
export const trans = (d: number, r: number): number => {
  const u = Math.max(0, Math.min(r, d));
  return r - Math.sqrt(Math.max(0, r * r - u * u));
};

/** the mini ramp's surface at x: the left transition, the flat, the right one */
export function rampY(park: Park, x: number): number {
  const { xa, xb, r } = park.ramp;
  if (x < xa + r) return trans(xa + r - x, r);
  if (x > xb - r) return trans(x - (xb - r), r);
  return 0;
}

/** how far a point is inside the bowl's rim (tiles, seen from above; negative outside): a rounded rectangle */
export function bowlInset(b: Park['bowl'], x: number, z: number): number {
  const qx = Math.abs(x - b.x) - (b.hw - b.rc);
  const qz = Math.abs(z - b.z) - (b.hd - b.rc);
  return b.rc - Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) - Math.min(Math.max(qx, qz), 0);
}

/** the bowl's floor at an inset d: 0 at the rim, its wall a quarter circle (vertical at the coping) down to its flat floor at -depth */
export function bowlY(b: Park['bowl'], d: number): number {
  if (d <= 0) return 0;
  if (d >= b.depth) return -b.depth;
  const u = b.depth - d;
  return -Math.sqrt(b.depth * b.depth - u * u);
}

/** a point on the bowl's contour at inset d (0 the rim), seen from its middle at angle th (x = cos, z = sin) */
export function bowlPoint(b: Park['bowl'], d: number, th: number): Pt {
  const dx = Math.cos(th);
  const dz = Math.sin(th);
  let lo = 0;
  let hi = Math.max(b.hw, b.hd);
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (bowlInset(b, b.x + dx * mid, b.z + dz * mid) > d) lo = mid;
    else hi = mid;
  }
  return { x: b.x + dx * lo, z: b.z + dz * lo };
}

/** a solid piece: its footprint and its top at a point of it */
interface Solid {
  readonly box: Box;
  top(x: number, z: number): number;
  /** a flat top on straight walls (a step, a bar, a bench): no slope to lean on */
  readonly flat: boolean;
}

const solid = (box: Box, top: (x: number, z: number) => number): Solid => ({ box, top, flat: false });
const flatTop = (box: Box, h: number): Solid => ({ box, top: () => h, flat: true });
/** the quarter pipe's (the vert's) deck behind its coping, deep enough for a stall (the look's too) */
export const QP_DECK = 0.55;
/** a bar's depth across z: the curb, the rail, the ledge */
export const BAR_D = { curb: 0.35, rail: 0.05, ledge: 0.6 } as const;

/** the pieces standing at this stage, the benches and the poles */
function solidsOf(park: Park, stage: number): Solid[] {
  const out: Solid[] = [];
  for (const p of park.poles) out.push(flatTop({ x0: p.x - 0.05, x1: p.x + 0.05, z0: p.z - 0.05, z1: p.z + 0.05 }, 3));
  for (const b of park.benches) out.push(flatTop(b, 0.35));
  const f = park.funbox;
  out.push(solid({ x0: f.x - f.hw - f.run, x1: f.x + f.hw + f.run, z0: f.z - f.hd, z1: f.z + f.hd }, (x) => {
    const d = Math.abs(x - f.x);
    return d <= f.hw ? f.h : f.h * Math.max(0, 1 - (d - f.hw) / f.run);
  }));
  const q = park.qp;
  const r = qpR(park, stage);
  // its deck behind the lip, the transition down to its foot towards +z
  out.push(solid({ x0: q.x0, x1: q.x1, z0: q.zLip - QP_DECK, z1: q.zLip + r }, (_x, z) => (z <= q.zLip ? r : trans(q.zLip + r - z, r))));
  for (const k of ['curb', 'rail', 'ledge'] as const) {
    if (!has(stage, k)) continue;
    const b = park[k];
    out.push(flatTop({ x0: b.x0, x1: b.x1, z0: b.z - BAR_D[k] / 2, z1: b.z + BAR_D[k] / 2 }, b.h));
  }
  if (has(stage, 'ramp')) {
    const m = park.ramp;
    out.push(solid({ x0: m.xa - 0.6, x1: m.xb + 0.6, z0: m.z0, z1: m.z1 }, (x) => (x <= m.xa || x >= m.xb ? m.r : rampY(park, x))));
  }
  if (has(stage, 'stairs')) {
    const s = park.stairs;
    // the deck left of the bank; the deck over the bank and the bank as one piece (no wall where they meet)
    out.push(flatTop({ x0: s.x0, x1: s.bankX0, z0: s.z0, z1: s.z1 }, s.h));
    out.push(solid({ x0: s.bankX0, x1: s.xTop, z0: s.z0, z1: s.bankZ }, (_x, z) => (z <= s.z1 ? s.h : (s.h * (s.bankZ - z)) / (s.bankZ - s.z1))));
    const step = (s.xBottom - s.xTop) / 4;
    for (let i = 0; i < 4; i++) out.push(flatTop({ x0: s.xTop + step * i, x1: s.xTop + step * (i + 1), z0: s.z0, z1: s.z1 }, s.h - (i + 1) * (s.h / 5)));
    // the handrail over the steps, from the deck's edge down to the last step
    const rail = stairRail(s);
    out.push(solid({ x0: s.xTop, x1: s.xBottom, z0: s.railZ - 0.03, z1: s.railZ + 0.03 }, (x) => rail.top + ((rail.low - rail.top) * (x - s.xTop)) / (s.xBottom - s.xTop)));
  }
  return out;
}

/** the stairs' handrail: its height over the deck's edge (top) and over the last step's (low), the look's too */
export const stairRail = (s: Park['stairs']): { top: number; low: number } => ({ top: s.h + 0.4, low: 0.55 });

const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

/**
 * The lowest a board may be at (x, z): the bowl's carved surface, and over it the top of every piece
 * whose footprint, pushed out by `margin`, holds the point (the top at the footprint's nearest point:
 * a vertical face stands its height all round, a slope's foot stays at the floor).
 */
export function clearAt(park: Park, stage: number, x: number, z: number, margin: number): number {
  let y = has(stage, 'bowl') ? bowlY(park.bowl, bowlInset(park.bowl, x, z)) : 0;
  for (const s of solidsCache(park, stage)) {
    const b = s.box;
    if (x < b.x0 - margin || x > b.x1 + margin || z < b.z0 - margin || z > b.z1 + margin) continue;
    y = Math.max(y, s.top(clamp(x, b.x0, b.x1), clamp(z, b.z0, b.z1)));
  }
  return y;
}

/** the surface a board rides at (x, z): the floor, a piece's top, the bowl's walls and floor */
export const surfaceAt = (park: Park, stage: number, x: number, z: number): number => clearAt(park, stage, x, z, 0);

/** the slopes only (the transitions, the bank, the funbox, the bowl), where a board leans: its pitch never jumps at a step or a bar's edge */
export function slopeAt(park: Park, stage: number, x: number, z: number): number {
  let y = has(stage, 'bowl') ? bowlY(park.bowl, bowlInset(park.bowl, x, z)) : 0;
  for (const s of solidsCache(park, stage)) {
    const b = s.box;
    if (s.flat || x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) continue;
    y = Math.max(y, s.top(x, z));
  }
  return y;
}

// ---- the ports: where each piece's line starts and ends on the floor ----

/** the two skaters' lanes, side by side */
export const LANE = 0.35;
export const laneOf = (slot: number): number => (slot % 2 === 0 ? -1 : 1) * LANE;
/** a bar's approach: this far in front of it (towards the park's middle, -z) past its half depth */
const APPROACH = 0.45;
/** how far a grind starts before the bar's end */
export const GRIND_RUN = 0.45;

export const approachZ = (park: Park, k: 'curb' | 'rail' | 'ledge'): number => park[k].z - BAR_D[k] / 2 - APPROACH;
/** the stairs' line: along the deck and down the steps at this z */
export const stairsZ = (s: Park['stairs']): number => (s.z0 + s.z1) / 2 - 0.2;
/** the mini ramp's way in and out: on the floor past its open side, by its flat bottom */
export const rampPort = (park: Park, slot: number): Pt => ({ x: (park.ramp.xa + park.ramp.xb) / 2 + laneOf(slot) * 0.6, z: park.ramp.z1 + 0.6 });
/** the quarter pipe's (the vert's) way in and out: on the floor before its foot */
export const qpPort = (park: Park, stage: number, slot: number): Pt => ({ x: (park.qp.x0 + park.qp.x1) / 2 + laneOf(slot), z: park.qp.zLip + qpR(park, stage) + 2.2 });

/** where a piece's line starts on the floor (side 1: along +x, -1: along -x, for the pieces ridden across) */
export function portIn(park: Park, stage: number, f: Feature, side: 1 | -1, slot: number): Pt {
  switch (f) {
    case 'flat': {
      const b = park.flat;
      return { x: side === 1 ? b.x0 : b.x1, z: b.z + laneOf(slot) };
    }
    case 'curb':
    case 'rail':
    case 'ledge': {
      const b = park[f];
      return { x: side === 1 ? b.x0 - GRIND_RUN : b.x1 + GRIND_RUN, z: approachZ(park, f) };
    }
    case 'stairs': {
      const s = park.stairs;
      return { x: (s.bankX0 + s.xTop) / 2, z: s.bankZ + 0.5 };
    }
    case 'funbox': {
      const b = park.funbox;
      const e = b.hw + b.run + 0.6;
      return { x: side === 1 ? b.x - e : b.x + e, z: b.z + laneOf(slot) * 0.6 };
    }
    case 'ramp':
      return rampPort(park, slot);
    case 'qp':
    case 'vert':
      return qpPort(park, stage, slot);
    case 'bowl':
      return { x: park.bowl.x - park.bowl.hw - 0.5, z: park.bowl.z - 0.6 };
  }
}

/** where a piece's line ends on the floor (the ramp and the bowl: past the ride out, `exitLen`) */
export function portOut(park: Park, stage: number, f: Feature, side: 1 | -1, slot: number): Pt {
  switch (f) {
    case 'flat':
    case 'curb':
    case 'rail':
    case 'ledge':
    case 'funbox':
      return portIn(park, stage, f, side === 1 ? -1 : 1, slot);
    case 'stairs': {
      const s = park.stairs;
      return { x: s.xBottom + 1.35, z: stairsZ(s) };
    }
    case 'bowl':
      return { x: park.bowl.x - park.bowl.hw - 0.5, z: park.bowl.z + 0.6 };
    case 'ramp':
    case 'qp':
    case 'vert':
      return portIn(park, stage, f, side, slot);
  }
}

/** the ride out of a piece to its port before the roll's route (tiles): down the ramp and out its side, up the bowl's wall and out */
export const exitLen = (f: Feature | null): number => (f === 'ramp' ? 4.5 : f === 'bowl' ? 2.0 : 0);

/** the way up the stairs' bank from its port to the deck, turning towards the steps: the roll's end, the stairs' move starts there */
export function stairsEntry(park: Park): Pt[] {
  const s = park.stairs;
  const cx = (s.bankX0 + s.xTop) / 2;
  const sz = stairsZ(s);
  const pts: Pt[] = [{ x: cx, z: s.bankZ + 0.5 }];
  for (let k = 0; k <= 6; k++) {
    const t = k / 6;
    const u = 1 - t;
    // from (cx, sz + 0.5) round (cx, sz) to (xTop - 0.5, sz)
    pts.push({ x: u * u * cx + 2 * u * t * cx + t * t * (s.xTop - 0.5), z: u * u * (sz + 0.5) + 2 * u * t * sz + t * t * sz });
  }
  return pts;
}

/** the ride from a piece's port onto it before its move (tiles): up the stairs' bank */
export const enterLen = (park: Park, f: Feature | null): number => (f === 'stairs' ? lengthOf(stairsEntry(park)) : 0);

// ---- the router ----

/** the grid's cell, the room kept round a piece, the bowl's rim and the slab's edge (tiles) */
const CELL = 0.1;
export const ROUTE_MARGIN = 0.35;
const EDGE = 0.25;

interface Router {
  readonly x0: number;
  readonly z0: number;
  readonly nx: number;
  readonly nz: number;
  readonly free: Uint8Array;
  readonly paths: Map<string, readonly Pt[]>;
}

let builds = 0;
/** how many routers were built (the memo's test: once per park and stage) */
export const routerBuilds = (): number => builds;

const routers = new Map<string, Router>();
const solids = new Map<string, Solid[]>();
/** a park's area as a key, kept per park: clearAt and route ask for it on every call */
const areaKeys = new WeakMap<Park, string>();
const keyOf = (park: Park, stage: number): string => {
  let k = areaKeys.get(park);
  if (k === undefined) {
    const a = park.area;
    k = `${String(a.x0)},${String(a.x1)},${String(a.z0)},${String(a.z1)}|`;
    areaKeys.set(park, k);
  }
  return k + String(stage);
};
/** a bounded memo: the 2 last parks and stages */
interface Memo<T> {
  readonly m: Map<string, T>;
  // the last park and stage asked and their key: the same park asked again builds no key
  park: Park | null;
  stage: number;
  key: string;
}
const memoOf = <T>(m: Map<string, T>): Memo<T> => ({ m, park: null, stage: -1, key: '' });
function memo<T>(c: Memo<T>, park: Park, stage: number, make: () => T): T {
  if (c.park !== park || c.stage !== stage) {
    c.park = park;
    c.stage = stage;
    c.key = keyOf(park, stage);
  }
  const hit = c.m.get(c.key);
  if (hit !== undefined) return hit;
  const v = make();
  c.m.set(c.key, v);
  if (c.m.size > 2) c.m.delete(c.m.keys().next().value as string);
  return v;
}
const solidsMemo = memoOf(solids);
const routersMemo = memoOf(routers);
function solidsCache(park: Park, stage: number): Solid[] {
  return memo(solidsMemo, park, stage, () => solidsOf(park, stage));
}

function routerOf(park: Park, stage: number): Router {
  return memo(routersMemo, park, stage, () => {
    builds++;
    const a = park.area;
    const nx = Math.ceil((a.x1 - a.x0) / CELL);
    const nz = Math.ceil((a.z1 - a.z0) / CELL);
    const free = new Uint8Array(nx * nz);
    const bowl = has(stage, 'bowl');
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const x = a.x0 + (i + 0.5) * CELL;
        const z = a.z0 + (j + 0.5) * CELL;
        const inside = x > a.x0 + EDGE && x < a.x1 - EDGE && z > a.z0 + EDGE && z < a.z1 - EDGE;
        const nearBowl = bowl && bowlInset(park.bowl, x, z) > -ROUTE_MARGIN;
        free[j * nx + i] = inside && !nearBowl && clearAt(park, stage, x, z, ROUTE_MARGIN) <= 0.001 ? 1 : 0;
      }
    }
    return { x0: a.x0, z0: a.z0, nx, nz, free, paths: new Map() };
  });
}

const cellOf = (r: Router, p: Pt): [number, number] => [Math.floor((p.x - r.x0) / CELL), Math.floor((p.z - r.z0) / CELL)];
const isFree = (r: Router, i: number, j: number): boolean => i >= 0 && j >= 0 && i < r.nx && j < r.nz && r.free[j * r.nx + i] === 1;
const centre = (r: Router, i: number, j: number): Pt => ({ x: r.x0 + (i + 0.5) * CELL, z: r.z0 + (j + 0.5) * CELL });

/** the free cell nearest a point (a port stands clear; this only snaps it onto the grid) */
function nearestFree(r: Router, p: Pt): [number, number] | null {
  const [ci, cj] = cellOf(r, p);
  for (let rad = 0; rad < 12; rad++) {
    let best: [number, number] | null = null;
    let bd = Infinity;
    for (let j = cj - rad; j <= cj + rad; j++) {
      for (let i = ci - rad; i <= ci + rad; i++) {
        if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== rad || !isFree(r, i, j)) continue;
        const c = centre(r, i, j);
        const d = Math.hypot(c.x - p.x, c.z - p.z);
        if (d < bd) { bd = d; best = [i, j]; }
      }
    }
    if (best) return best;
  }
  return null;
}

/** A* over the free cells, 8 ways, no corner cut */
function astar(r: Router, s: [number, number], g: [number, number]): Pt[] | null {
  const n = r.nx * r.nz;
  const gs = new Float64Array(n).fill(Infinity);
  const from = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  // a binary heap of (f, cell) in two typed arrays: no pair allocated per push (the GC was a third
  // of a line's cost); the same sift as before, so the same order and the same routes
  let hf = new Float64Array(1024);
  let hk = new Int32Array(1024);
  let size = 0;
  const push = (f: number, k: number): void => {
    if (size === hf.length) {
      const nf = new Float64Array(size * 2);
      const nk = new Int32Array(size * 2);
      nf.set(hf);
      nk.set(hk);
      hf = nf;
      hk = nk;
    }
    let i = size++;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if ((hf[p] as number) <= f) break;
      hf[i] = hf[p] as number;
      hk[i] = hk[p] as number;
      i = p;
    }
    hf[i] = f;
    hk[i] = k;
  };
  /** the cell of the lowest f, or -1 when the heap is empty */
  const pop = (): number => {
    if (size === 0) return -1;
    const top = hk[0] as number;
    size--;
    if (size > 0) {
      const lf = hf[size] as number;
      const lk = hk[size] as number;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const rr = l + 1;
        let m = i;
        let mf = lf;
        if (l < size && (hf[l] as number) < mf) { m = l; mf = hf[l] as number; }
        if (rr < size && (hf[rr] as number) < mf) m = rr;
        if (m === i) break;
        hf[i] = hf[m] as number;
        hk[i] = hk[m] as number;
        i = m;
      }
      hf[i] = lf;
      hk[i] = lk;
    }
    return top;
  };
  const h = (i: number, j: number): number => {
    const dx = Math.abs(i - g[0]);
    const dz = Math.abs(j - g[1]);
    return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz);
  };
  const sk = s[1] * r.nx + s[0];
  const gk = g[1] * r.nx + g[0];
  gs[sk] = 0;
  push(h(s[0], s[1]), sk);
  for (;;) {
    const k = pop();
    if (k === -1) return null;
    if (closed[k] === 1) continue;
    closed[k] = 1;
    if (k === gk) break;
    const i = k % r.nx;
    const j = (k - i) / r.nx;
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        if (di === 0 && dj === 0) continue;
        const ni = i + di;
        const nj = j + dj;
        if (!isFree(r, ni, nj)) continue;
        if (di !== 0 && dj !== 0 && (!isFree(r, i + di, j) || !isFree(r, i, j + dj))) continue;
        const nk = nj * r.nx + ni;
        const ng = (gs[k] ?? 0) + (di !== 0 && dj !== 0 ? Math.SQRT2 : 1);
        if (ng < (gs[nk] ?? Infinity)) {
          gs[nk] = ng;
          from[nk] = k;
          push(ng + h(ni, nj), nk);
        }
      }
    }
  }
  const cells: Pt[] = [];
  for (let k = gk; k !== -1; k = from[k] ?? -1) {
    const i = k % r.nx;
    cells.push(centre(r, i, (k - i) / r.nx));
  }
  return cells.reverse();
}

/** a straight way between two points stays on free cells */
function sees(r: Router, a: Pt, b: Pt): boolean {
  const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / (CELL / 2));
  for (let i = 0; i <= n; i++) {
    const [ci, cj] = cellOf(r, { x: a.x + ((b.x - a.x) * i) / Math.max(1, n), z: a.z + ((b.z - a.z) * i) / Math.max(1, n) });
    if (!isFree(r, ci, cj)) return false;
  }
  return true;
}

/** the corners pulled straight: from each point, the farthest one it sees */
function pull(r: Router, pts: readonly Pt[]): Pt[] {
  const out: Pt[] = [];
  let i = 0;
  const first = pts[0];
  if (!first) return out;
  out.push(first);
  while (i < pts.length - 1) {
    let j = pts.length - 1;
    while (j > i + 1 && !sees(r, pts[i] as Pt, pts[j] as Pt)) j--;
    out.push(pts[j] as Pt);
    i = j;
  }
  return out;
}

/** each corner rounded: a curve from CORNER before it to CORNER after it */
const CORNER = 0.4;
function round(pts: readonly Pt[]): Pt[] {
  if (pts.length < 3) return [...pts];
  const out: Pt[] = [pts[0] as Pt];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1] as Pt;
    const p = pts[i] as Pt;
    const b = pts[i + 1] as Pt;
    const la = Math.hypot(p.x - a.x, p.z - a.z);
    const lb = Math.hypot(b.x - p.x, b.z - p.z);
    const c = Math.min(CORNER, la / 2, lb / 2);
    const s = { x: p.x + ((a.x - p.x) * c) / la, z: p.z + ((a.z - p.z) * c) / la };
    const e = { x: p.x + ((b.x - p.x) * c) / lb, z: p.z + ((b.z - p.z) * c) / lb };
    for (let k = 0; k <= 4; k++) {
      const t = k / 4;
      const u = 1 - t;
      out.push({ x: u * u * s.x + 2 * u * t * p.x + t * t * e.x, z: u * u * s.z + 2 * u * t * p.z + t * t * e.z });
    }
  }
  out.push(pts[pts.length - 1] as Pt);
  return out;
}

/**
 * A roll from a to b round the pieces built at this stage: its points, a first and b last. Kept per
 * park and stage (the same ports give the same route); a straight line where no way is found.
 */
export function route(park: Park, stage: number, a: Pt, b: Pt): readonly Pt[] {
  const r = routerOf(park, stage);
  const key = `${a.x.toFixed(3)},${a.z.toFixed(3)}>${b.x.toFixed(3)},${b.z.toFixed(3)}`;
  const hit = r.paths.get(key);
  if (hit) return hit;
  const s = nearestFree(r, a);
  const g = nearestFree(r, b);
  const cells = s && g ? astar(r, s, g) : null;
  const pts = cells ? round(pull(r, [a, ...cells, b])) : [a, b];
  r.paths.set(key, pts);
  return pts;
}

/** a polyline's length */
export const lengthOf = (pts: readonly Pt[]): number => {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot((pts[i] as Pt).x - (pts[i - 1] as Pt).x, (pts[i] as Pt).z - (pts[i - 1] as Pt).z);
  return l;
};

/** the point at s (tiles) along a polyline, clamped to its ends */
export function along(pts: readonly Pt[], s: number): Pt {
  let left = Math.max(0, s);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1] as Pt;
    const b = pts[i] as Pt;
    const l = Math.hypot(b.x - a.x, b.z - a.z);
    if (left <= l || i === pts.length - 1) {
      const f = l > 0 ? Math.min(1, left / l) : 1;
      return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f };
    }
    left -= l;
  }
  return pts[0] ?? { x: 0, z: 0 };
}

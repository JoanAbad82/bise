// Chunk C's plan helpers (the patio, the haveli, the tropical house, the Cyclades, the Sahel; page
// bims-maps v5): the back zone each of them keeps (the nap place, the board, main's desk and its
// land queue over the back corridor, on either side), the front (the door, the terrace, the way
// out), the desk slots that stay put while their agent lives, and the walk graph put together from
// a map's trunk and each place's way in (wayIn), a way in that ends off the trunk joined to the
// nearest corridor straight ahead. Pure, no three. Owner: maps-c.
import type { Box, Leg, Office, Pt, Spot } from '../model';
import { QUEUE_GAP } from '../model';
import { NAP_ROW, NAP_Z0, boxAt, napBedAt, placesOf, wayIn } from './plan';

/** the back zone's depth, and its corridor (every map of the chunk: the room's first 4.3 tiles) */
export const BACK_D = 4.3;
export const CROSS_BACK = 4.0;
const QUEUE_N = 6;
const TERRACE_N = 12;
const TERRACE_GAP = 1.15;
const EXIT_OUT = 2.5;

export interface BackZone {
  readonly lounge: Spot[];
  readonly boardSpots: Spot[];
  readonly mainDesk: Spot;
  readonly queue: Spot[];
  /** the beds (each with its spot) and main's desk */
  readonly furniture: Box[];
  /** the back corridor: from its first end to its last, every place behind it joins it */
  readonly corridor: Leg;
  /** the land queue past its last place: on the back corridor, away from main's desk */
  readonly queueMore: Leg;
}

export interface BackOpts {
  readonly x0: number;
  readonly W: number;
  /** main's desk on the right (the nap place on the left), or the other way round */
  readonly main: 'right' | 'left';
  /** the nap place's spots, 4 a row (8 at most here) */
  readonly beds?: number;
  /** the first row of beds' spot z (plan.ts NAP_Z0): further out past what stands along the back wall */
  readonly napZ?: number;
  /** the corridor's ends past the back zone's own (the map's aisles) */
  readonly reach?: readonly number[];
}

/**
 * The back zone: the nap place in the corner on one side (4 beds a row, plan.ts napBedAt, a lane between each two and between the rows,
 * up to the back corridor), the board on the back wall past it, main's desk in the other corner
 * and its land queue in a lane on its inner side. Measured from the nap place's wall (`u`).
 */
export function backZone(o: BackOpts): BackZone {
  const { x0, W } = o;
  const side = o.main === 'right' ? 1 : -1;
  const X = (u: number): number => (side === 1 ? x0 + u : x0 + W - u);
  const step = 1.3;
  const lounge: Spot[] = [];
  const furniture: Box[] = [];
  for (let i = 0; i < (o.beds ?? 8); i++) {
    const j = i % 4;
    const u = 0.9 + j * step;
    const z = (o.napZ ?? NAP_Z0) + Math.floor(i / 4) * NAP_ROW;
    const s: Spot = { x: X(u), z, wz: z, ax: X(j < 3 ? u + step / 2 : u - step / 2), face: 0 };
    lounge.push(s);
    furniture.push(napBedAt(s));
  }
  const bx = X(0.9 + 3 * step + 1.9);
  const boardSpots = [-0.45, 0.45, 0].map((d) => ({ x: bx + d, z: 0.75, wz: CROSS_BACK, ax: bx + d, face: Math.PI }));
  const mx = X(W - 1.55);
  const qx = X(W - 3.0);
  const mainDesk: Spot = { x: mx, z: 1.25, wz: 0.8, ax: qx, face: 0 };
  furniture.push(boxAt(mx, 1.85, 2.3, 1.0));
  const queue: Spot[] = [];
  for (let i = 0; i < QUEUE_N; i++) queue.push({ x: qx, z: 1.3 + i * QUEUE_GAP, wz: CROSS_BACK, ax: qx, face: (side * Math.PI) / 2 });
  const xs = [...lounge.map((s) => s.ax), ...boardSpots.map((s) => s.x), qx, ...(o.reach ?? [])];
  const corridor: Leg = [{ x: Math.min(...xs), z: CROSS_BACK }, { x: Math.max(...xs), z: CROSS_BACK }];
  const far = side === 1 ? corridor[0].x : corridor[1].x;
  const queueMore: Leg = [{ x: qx, z: CROSS_BACK }, { x: side === 1 ? Math.min(qx, Math.max(far, x0 + 1.5)) : Math.max(qx, Math.min(far, x0 + W - 1.5)), z: CROSS_BACK }];
  return { lounge, boardSpots, mainDesk, queue, furniture, corridor, queueMore };
}

export interface FrontZone {
  readonly door: Spot;
  readonly terrace: Spot[];
  readonly exit: Spot;
  /** the deck chairs (each with its spot) */
  readonly furniture: Box[];
  /** the door line out to the terrace's walkway, and the walkway out to the exit */
  readonly legs: Leg[];
  /** the front corridor's z, the terrace walkway's */
  readonly crossFront: number;
  readonly tw: number;
}

export interface FrontOpts {
  readonly x0: number;
  readonly W: number;
  readonly D: number;
  readonly doorX: number;
  /** the terrace's first deck chair, from the floor's left edge */
  readonly terraceU: number;
  /** the way out: off the left edge or the right one */
  readonly out: 'left' | 'right';
}

/** The front: the door on the front corridor, the terrace past it (deck chairs 4 a row), the way out. */
export function frontZone(o: FrontOpts): FrontZone {
  const { x0, W, D, doorX } = o;
  const crossFront = D - 0.5;
  const tw = D + 0.8;
  const door: Spot = { x: doorX, z: D + 0.2, wz: crossFront, ax: doorX, face: Math.PI };
  const terrace: Spot[] = [];
  const furniture: Box[] = [];
  for (let i = 0; i < TERRACE_N; i++) {
    const j = i % 4;
    const x = x0 + o.terraceU + j * TERRACE_GAP;
    const z = D + 1.5 + Math.floor(i / 4) * TERRACE_GAP;
    const s: Spot = { x, z, wz: z, ax: j < 3 ? x + TERRACE_GAP / 2 : x - TERRACE_GAP / 2, face: 0 };
    terrace.push(s);
    furniture.push(boxAt(x, z + 0.05, 0.5, 0.95, s));
  }
  const left = o.out === 'left';
  const ex = left ? x0 - EXIT_OUT : x0 + W + EXIT_OUT;
  const exit: Spot = { x: ex, z: tw, wz: tw, ax: ex, face: left ? -Math.PI / 2 : Math.PI / 2 };
  const xs = [doorX, ...terrace.map((t) => t.ax)];
  const walk: Leg = left ? [{ x: ex, z: tw }, { x: Math.max(...xs), z: tw }] : [{ x: Math.min(...xs), z: tw }, { x: ex, z: tw }];
  return { door, terrace, exit, furniture, legs: [[{ x: doorX, z: crossFront }, { x: doorX, z: tw }], walk], crossFront, tw };
}

const near = (a: Pt, b: Pt): boolean => Math.hypot(a.x - b.x, a.z - b.z) < 1e-4;

/** p on the straight leg a-b */
export function onLeg([a, b]: Leg, p: Pt): boolean {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const l2 = dx * dx + dz * dz;
  const f = l2 > 0 ? ((p.x - a.x) * dx + (p.z - a.z) * dz) / l2 : 0;
  if (f < -1e-4 || f > 1 + 1e-4) return false;
  return near({ x: a.x + dx * f, z: a.z + dz * f }, p);
}

/** a straight leg's inside through a box's inside (an edge touched is fine), sampled every 0.02 */
export function through([a, b]: Leg, box: Box): boolean {
  const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.02));
  const e = 1e-6;
  for (let i = 1; i < n; i++) {
    const x = a.x + ((b.x - a.x) * i) / n;
    const z = a.z + ((b.z - a.z) * i) / n;
    if (x > box.x0 + e && x < box.x1 - e && z > box.z0 + e && z < box.z1 - e) return true;
  }
  return false;
}

/**
 * The walk graph: the map's trunk, then every place's way in (wayIn: spot, its walkway, its
 * aisle); a way in that ends off the trunk is joined straight ahead or back (along its aisle) to
 * the nearest corridor that runs past it without crossing furniture. None: the plan is wrong, it
 * throws (maps/contract.test.ts reads every plan).
 */
export function walksOf(o: Omit<Office, 'walks' | 'queueMore'>, trunk: readonly Leg[]): [Leg, ...Leg[]] {
  const first = trunk[0];
  if (first === undefined) throw new Error(`${o.map}: no trunk`);
  const out: [Leg, ...Leg[]] = [first, ...trunk.slice(1)];
  const across = trunk.filter(([a, b]) => Math.abs(a.z - b.z) < 1e-6);
  for (const s of placesOf({ ...o, walks: [], queueMore: [first[0], first[0]] })) {
    out.push(...wayIn(s));
    const entry = { x: s.ax, z: s.wz };
    if (trunk.some((l) => onLeg(l, entry))) continue;
    const joins = across
      .filter(([a, b]) => entry.x >= Math.min(a.x, b.x) - 1e-6 && entry.x <= Math.max(a.x, b.x) + 1e-6)
      .map(([a]): Leg => [entry, { x: entry.x, z: a.z }])
      .filter((l) => !o.furniture.some((b) => through(l, b)))
      .sort((p, q) => Math.abs(p[1].z - entry.z) - Math.abs(q[1].z - entry.z));
    const j = joins[0];
    if (j === undefined) throw new Error(`${o.map}: no way from (${String(entry.x)}, ${String(entry.z)})`);
    if (!near(j[0], j[1])) out.push(j);
  }
  return out;
}

/**
 * Each agent's desk slot: the one its desk of `prev` sits on (a slot's place never depends on how
 * many agents there are), else the first free one. `at`: a slot's chair.
 */
export function keepSlots(names: readonly string[], prev: ReadonlyMap<string, Pt> | undefined, at: (slot: number) => Pt): Map<string, number> {
  const slots = new Map<string, number>();
  const taken = new Set<number>();
  for (const name of names) {
    const d = prev?.get(name);
    if (!d) continue;
    for (let i = 0; i < 96; i++) {
      if (!taken.has(i) && near(at(i), d)) {
        slots.set(name, i);
        taken.add(i);
        break;
      }
    }
  }
  let next = 0;
  for (const name of names) {
    if (slots.has(name)) continue;
    while (taken.has(next)) next++;
    slots.set(name, next);
    taken.add(next);
  }
  return slots;
}

/** the highest slot used, plus one */
export const slotsUsed = (slots: ReadonlyMap<string, number>): number => Math.max(0, ...[...slots.values()].map((s) => s + 1));

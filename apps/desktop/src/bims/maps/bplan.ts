// What maps-b's six plans share (greenhouse, campus, workshop, kyoto, riad, nordic; page bims-maps):
// the loft's back zone (the nap place at the back left, the board, main's desk at the back right and
// its land queue), the door, the terrace and the way out, the walk graph built from a trunk and each
// place's way in, desk slots kept while an agent lives, and the growth's words for the maps that
// grow like the loft. Every place a bim walks to joins the
// trunk by straight legs that miss the furniture: maps/contract.test.ts checks each plan. Pure, no
// three. Owner: maps-b.
import type { Agent } from '@/proto';
import { bims } from '@/proto/words_bims.gen';
import { type Box, type Leg, type Office, type Pt, type Spot } from '../model';
import { type Things, boxAt, deskNames, wayIn } from './plan';

/** A map of maps-b's office: the numbers its look reads past the common ones. */
export interface BOffice extends Office {
  /** each agent's desk slot: kept while it lives (the plan places slot i) */
  readonly slots: ReadonlyMap<string, number>;
  /** how many desk slots the room has: it never shrinks */
  readonly cap: number;
  /** the back corridor's z (the back zone's places join it) */
  readonly crossBack: number;
}

/** A place and the trunk point its way in (spot, walkway `wz`, lane `ax`) joins; none: (ax, wz) is on the trunk. */
export interface Way {
  readonly s: Spot;
  readonly to?: Pt;
}

const near = (a: Pt, b: Pt): boolean => Math.hypot(a.x - b.x, a.z - b.z) < 1e-6;

/** the walk graph: the trunk, then each place's way in and the leg that joins it to the trunk */
export function walksOf(trunk: readonly Leg[], ways: readonly Way[]): Leg[] {
  const out: Leg[] = trunk.filter(([a, b]) => !near(a, b));
  for (const w of ways) {
    out.push(...wayIn(w.s));
    const entry = { x: w.s.ax, z: w.s.wz };
    if (w.to && !near(entry, w.to)) out.push([entry, w.to]);
  }
  return out;
}

/** a corridor along z from the leftmost to the rightmost of these points' x (the ways joining it and more) */
export function corridor(z: number, ways: readonly Way[], more: readonly number[] = []): Leg {
  const xs = [...ways.filter((w) => w.to && Math.abs(w.to.z - z) < 1e-6).map((w) => w.to?.x ?? 0), ...more];
  return [{ x: Math.min(...xs), z }, { x: Math.max(...xs), z }];
}

/**
 * Each agent's desk slot: its slot in `prev` while it lives, else the first free one. Pure.
 */
export function keepSlots(agents: readonly Agent[], prev?: ReadonlyMap<string, number>): { names: string[]; slots: Map<string, number>; used: number } {
  const names = deskNames(agents);
  const slots = new Map<string, number>();
  const taken = new Set<number>();
  for (const n of names) {
    const s = prev?.get(n);
    if (s !== undefined) {
      slots.set(n, s);
      taken.add(s);
    }
  }
  let next = 0;
  for (const n of names) {
    if (slots.has(n)) continue;
    while (taken.has(next)) next++;
    slots.set(n, next);
    taken.add(next);
  }
  return { names, slots, used: Math.max(0, ...[...slots.values()].map((s) => s + 1)) };
}

/** The back zone: the nap place, the board, main's desk and its queue, and how they join the back corridor. */
export interface Back {
  readonly lounge: Spot[];
  readonly boardSpots: Spot[];
  readonly mainDesk: Spot;
  readonly queue: Spot[];
  readonly furniture: Box[];
  readonly ways: Way[];
  /** the board's middle (the look hangs it there) */
  readonly boardX: number;
}

export const QUEUE_N = 6;

/**
 * The loft's back zone on a room from x0, W wide, its back corridor at `crossBack` (4.05 in a room
 * whose desks start at 4.3): `n` nap places 4 a row from `lx0` (its left end) over `lw`, lanes
 * between their columns; the board after them; main's desk at the back right, its queue on its left.
 */
export function backZone(x0: number, W: number, crossBack: number, o: { lx0?: number; lw?: number; n?: number; bed?: number } = {}): Back {
  const lx0 = o.lx0 ?? x0 + 0.65;
  const lw = o.lw ?? W * 0.4 - 0.9;
  const n = o.n ?? 10;
  const bed = o.bed ?? 0.72;
  const step = lw / 3;
  const lounge: Spot[] = [];
  const ways: Way[] = [];
  const furniture: Box[] = [];
  for (let i = 0; i < n; i++) {
    const j = i % 4;
    const x = lx0 + j * step;
    const z = 1.0 + Math.floor(i / 4) * 1.05;
    if (z + bed / 2 > crossBack - 0.2) break;
    const s = { x, z, wz: z, ax: j < 3 ? x + step / 2 : x - step / 2, face: 0 };
    lounge.push(s);
    furniture.push(boxAt(x, z - 0.05, bed, bed, s));
    ways.push({ s, to: { x: s.ax, z: crossBack } });
  }
  const boardX = lx0 + lw + 1.6;
  const boardSpots = [-0.45, 0.45, 0].map((d) => ({ x: boardX + d, z: 0.75, wz: crossBack, ax: boardX + d, face: Math.PI }));
  for (const s of boardSpots) ways.push({ s });
  const mx = x0 + W - 1.55;
  const qx = mx - 1.45;
  const mainDesk: Spot = { x: mx, z: 1.25, wz: 0.8, ax: qx, face: 0 };
  ways.push({ s: mainDesk, to: { x: qx, z: crossBack } });
  furniture.push(boxAt(mx, mainDesk.z + 0.6, 2.3, 1.0));
  const queue: Spot[] = [];
  for (let i = 0; i < QUEUE_N; i++) {
    const z = 1.3 + i * 0.5;
    if (z > crossBack - 0.2) break;
    queue.push({ x: qx, z, wz: crossBack, ax: qx, face: Math.PI / 2 });
  }
  for (const s of queue) ways.push({ s });
  return { lounge, boardSpots, mainDesk, queue, furniture, ways, boardX };
}

/** The door, the terrace and the way out. */
export interface Outside {
  readonly door: Spot;
  readonly terrace: Spot[];
  readonly exit: Spot;
  readonly furniture: Box[];
  readonly ways: Way[];
  readonly trunk: Leg[];
  /** the terrace's walkway's z */
  readonly tw: number;
}

const TERRACE_N = 12;
const TERRACE_GAP = 1.15;

/**
 * The loft's outside on a floor from x0, W by D: the door at `doorX` on the front edge (its line
 * starts at `front`, a trunk point inside), the terrace past it (deck chairs 4 a row from the left),
 * its walkway, and a leaving bim's way off its left edge.
 */
export function outside(x0: number, D: number, doorX: number, front: number): Outside {
  const tw = D + 0.8;
  const door: Spot = { x: doorX, z: D + 0.2, wz: front, ax: doorX, face: Math.PI };
  const terrace: Spot[] = [];
  const furniture: Box[] = [];
  const ways: Way[] = [];
  for (let i = 0; i < TERRACE_N; i++) {
    const j = i % 4;
    const x = x0 + 1.0 + j * TERRACE_GAP;
    const z = D + 1.5 + Math.floor(i / 4) * TERRACE_GAP;
    const s = { x, z, wz: z, ax: j < 3 ? x + TERRACE_GAP / 2 : x - TERRACE_GAP / 2, face: 0 };
    terrace.push(s);
    furniture.push(boxAt(x, z + 0.05, 0.5, 0.95, s));
    ways.push({ s, to: { x: s.ax, z: tw } });
  }
  const exit: Spot = { x: x0 - 2.5, z: tw, wz: tw, ax: x0 - 2.5, face: -Math.PI / 2 };
  const right = Math.max(doorX, ...ways.map((w) => w.to?.x ?? doorX));
  const trunk: Leg[] = [
    [{ x: doorX, z: front }, { x: doorX, z: tw }],
    [{ x: exit.x, z: tw }, { x: right, z: tw }],
  ];
  ways.push({ s: door });
  return { door, terrace, exit, furniture, ways, trunk, tw };
}

/** the queue past its last place: along the back corridor, towards its left end */
export function queueMoreOf(queue: readonly Spot[], mainDesk: Spot, back: Leg, x0: number): Leg {
  const q0 = queue[0]?.x ?? mainDesk.x;
  const left = Math.min(back[0].x, back[1].x);
  const z = back[0].z;
  return [{ x: q0, z }, { x: Math.min(q0, Math.max(left, x0 + 1.5)), z }];
}

/** what each stage brings on a map that grows like the loft without its kitchen island (greenhouse, campus, workshop) */
export const LOFT_LIKE: Things = {
  1: bims.stage_1, 2: bims.stage_fruit, 3: bims.stage_3, 4: bims.stage_4, 5: bims.stage_5, 6: bims.stage_more_fruit, 7: bims.stage_7,
  8: bims.stage_8, 9: bims.stage_9, 10: bims.stage_10, 11: bims.stage_11, 12: bims.stage_12, 13: bims.stage_13, 14: bims.stage_14,
};

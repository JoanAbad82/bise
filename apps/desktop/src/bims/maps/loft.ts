// The loft, the first map (the prototype's layout(), spec §3; its look: render/maps/loft.ts). Pure
// numbers, in floor tiles: x right (0 at the island's middle), z towards the viewer (0 at the back
// wall). The back zone holds the lounge (left), the whiteboard and main's big desk with its land
// queue (right); then the back corridor, 2 desk columns each side of the kitchen island (3 past 16
// agents), the front corridor, the door, and the terrace outside. Its walk graph: the corridors,
// the two aisles, the door line out to the terrace's walkway, and each spot's way in (its walkway
// `wz`, then its aisle or lane `ax`), so a walk never crosses a desk, the island, a bean bag or a
// deck chair (`furniture`). The office is the same at 320 px and wide: the camera fits it.
import type { Agent } from '@/proto';
import { type Box, type Leg, type Office, type Pt, QUEUE_GAP, type Spot } from '../model';
import { NAP_ROW, NAP_Z0, type Plan, boxAt, deskNames, napBedAt, wayIn } from './plan';

/** The loft's office: the numbers its look and its tests read past the common ones. */
export interface LoftOffice extends Office {
  /** desk columns on each side of the island (2, 3 past 16 agents) */
  readonly side: number;
  readonly rows: number;
  /** the two corridors' z (the back one, the front one) and the aisles' x (±ax) */
  readonly crossBack: number;
  readonly crossFront: number;
  readonly ax: number;
}

/** desk pitch across and along, the island's width, an aisle's width, the back zone's depth */
const DX = 2.4;
const DZ = 2.3;
const ISL = 1.4;
const AISLE = 1.0;
const BACK_D = 4.3;
/** past this many agents (main aside), 3 desk columns each side of the island */
export const WIDE_PAST = 16;
const LOUNGE_N = 8;
const QUEUE_N = 6;
const TERRACE_N = 12;
const TERRACE_GAP = 1.15;
/** the terrace's walkway, past the floor's front edge: the door line ends there */
const TERRACE_WALK = 0.8;
/** where a leaving bim goes: off the terrace's left edge */
const EXIT_OUT = 2.5;

/**
 * The office for these agents (main and the others, in start order; archived rows have no desk).
 * `prev`, the office on screen: the desks of the agents still there stay where they are, a new
 * agent takes the first free desk, and the room never shrinks (fewer columns or rows would move
 * the desks under the bims). Without `prev`: desks in start order.
 */
export function loftLayout(agents: readonly Agent[], prev?: LoftOffice): LoftOffice {
  const others = deskNames(agents);
  const side = prev?.side === 3 || others.length > WIDE_PAST ? 3 : 2;
  const cols = side * 2;
  const slots = deskSlots(others, side, prev);
  const used = Math.max(0, ...[...slots.values()].map((s) => s + 1));
  const rows = Math.max(3, Math.ceil(used / cols), prev?.side === side ? prev.rows : 0);
  const W = 2 * (ISL / 2 + AISLE + side * DX) + 0.2;
  const x0 = -W / 2;
  const D = BACK_D + rows * DZ + 1.0;
  const ax = ISL / 2 + AISLE / 2;
  const crossBack = BACK_D - 0.25;
  const crossFront = D - 0.5;

  const desks = new Map<string, Spot>();
  for (const name of others) {
    const p = deskAt(slots.get(name) ?? 0, side);
    desks.set(name, { x: p.x, z: p.z, wz: p.z - 0.65, ax: Math.sign(p.x) * ax, face: 0 });
  }

  // the island: from the desks' top, as long as the desk rows (3.5 at least)
  const z0 = BACK_D + 0.2;
  const island: Box = { x0: -ISL / 2, x1: ISL / 2, z0, z1: z0 + Math.max(rows * DZ - 1.0, 3.5) };
  const islandSpots: Spot[] = [];
  for (let i = 0; i < 12; i++) {
    const sx = i % 2 ? 1 : -1;
    const z = island.z0 + 1.2 + Math.floor(i / 2) * 0.85;
    if (z > island.z1 - 0.3) break;
    islandSpots.push({ x: sx * (ISL / 2 + 0.32), z, wz: z, ax: sx * ax, face: sx < 0 ? Math.PI / 2 : -Math.PI / 2 });
  }

  // the lounge: 4 bean bags a row; a lane between two columns leads to the back corridor
  const loungeW = W * 0.4;
  const step = (loungeW - 0.9) / 3;
  const lounge: Spot[] = [];
  for (let i = 0; i < LOUNGE_N; i++) {
    const j = i % 4;
    const x = x0 + 0.65 + j * step;
    const z = NAP_Z0 + Math.floor(i / 4) * NAP_ROW;
    lounge.push({ x, z, wz: z, ax: j < 3 ? x + step / 2 : x - step / 2, face: 0 });
  }

  // the whiteboard on the back wall, 3 places in front of it
  const boardX = x0 + loungeW + 1.15;
  const boardSpots = [-0.45, 0.45, 0].map((o) => ({ x: boardX + o, z: 0.75, wz: crossBack, ax: boardX + o, face: Math.PI }));

  // main's desk at the back right; its land queue on its left, a lane main takes too
  const mx = W / 2 - 1.55;
  const qx = mx - 1.45;
  const mainDesk: Spot = { x: mx, z: 1.25, wz: 0.8, ax: qx, face: 0 };
  const queue: Spot[] = [];
  for (let i = 0; i < QUEUE_N; i++) queue.push({ x: qx, z: 1.3 + i * QUEUE_GAP, wz: crossBack, ax: qx, face: Math.PI / 2 });

  // the door at the front left, on the left aisle; the terrace past it, deck chairs 4 a row
  const door: Spot = { x: -ax, z: D + 0.2, wz: crossFront, ax: -ax, face: Math.PI };
  const terrace: Spot[] = [];
  for (let i = 0; i < TERRACE_N; i++) {
    const j = i % 4;
    const x = x0 + 1.0 + j * TERRACE_GAP;
    const z = D + 1.5 + Math.floor(i / 4) * TERRACE_GAP;
    terrace.push({ x, z, wz: z, ax: j < 3 ? x + TERRACE_GAP / 2 : x - TERRACE_GAP / 2, face: 0 });
  }

  // a leaving bim: along the terrace's walkway, off its left edge
  const tw = D + TERRACE_WALK;
  const exit: Spot = { x: x0 - EXIT_OUT, z: tw, wz: tw, ax: x0 - EXIT_OUT, face: -Math.PI / 2 };
  const places = { desks, mainDesk, islandSpots, lounge, boardSpots, queue, door, terrace, exit };
  const base = { map: 'loft' as const, size: `${String(side)}x${String(rows)}`, W, D, x0, island, ...places };
  const furniture = furnitureOf(base);
  const walks = walksOf({ ...base, crossBack, crossFront, ax, tw });
  // past the queue's last place: on the back corridor, in line towards its left end (walksOf's first leg)
  const q0 = queue[0]?.x ?? mx;
  const left = Math.min(...walks[0].map((p) => p.x));
  const queueMore: Leg = [{ x: q0, z: crossBack }, { x: Math.min(q0, Math.max(left, x0 + 1.5)), z: crossBack }];
  return { ...base, side, rows, crossBack, crossFront, ax, walks, furniture, queueMore };
}

/** the loft as a map (maps/index.ts); its island's top takes stage 2's coffee machine (cozy.ts) */
export const loft: Plan<LoftOffice> = { id: 'loft', ready: true, layout: loftLayout, cozy: { islandTop: 0.695 } };

/**
 * The loft's walk graph: the trunk (the back and front corridors, the two aisles, the door line,
 * the terrace's walkway out to the exit) and every place's way in: spot -> its walkway `wz` -> its
 * aisle or lane `ax` -> the back corridor (a place behind it) or the terrace's walkway (in front).
 */
function walksOf(o: Omit<Office, 'walks' | 'furniture' | 'queueMore'> & { crossBack: number; crossFront: number; ax: number; tw: number }): [Leg, ...Leg[]] {
  const { crossBack, crossFront, ax, tw, exit } = o;
  const spots = [...o.desks.values(), o.mainDesk, ...o.islandSpots, ...o.lounge, ...o.boardSpots, ...o.queue, o.door, ...o.terrace, exit];
  // the back corridor runs from the leftmost lane to the rightmost one (the aisles at least)
  const backX = spots.filter((s) => s.wz <= crossBack + 1e-6).map((s) => s.ax);
  const trunk: [Leg, ...Leg[]] = [
    [{ x: Math.min(-ax, ...backX), z: crossBack }, { x: Math.max(ax, ...backX), z: crossBack }],
    [{ x: -ax, z: crossFront }, { x: ax, z: crossFront }],
    [{ x: -ax, z: crossBack }, { x: -ax, z: crossFront }],
    [{ x: ax, z: crossBack }, { x: ax, z: crossFront }],
    [{ x: -ax, z: crossFront }, { x: -ax, z: tw }],
    [{ x: exit.x, z: tw }, { x: -ax, z: tw }],
  ];
  const onTrunk = (p: Pt): boolean => trunk.some(([a, b]) => onAxisLeg(a, b, p));
  const out: [Leg, ...Leg[]] = [trunk[0], ...trunk.slice(1)];
  for (const s of spots) {
    out.push(...wayIn(s));
    const entry = { x: s.ax, z: s.wz };
    if (!onTrunk(entry)) out.push([entry, { x: s.ax, z: s.wz < crossBack ? crossBack : tw }]);
  }
  return out;
}

/** p on the axis-aligned leg a-b */
function onAxisLeg(a: Pt, b: Pt, p: Pt): boolean {
  const t = 1e-4;
  if (Math.abs(a.x - b.x) < 1e-6) return Math.abs(p.x - a.x) < t && p.z >= Math.min(a.z, b.z) - t && p.z <= Math.max(a.z, b.z) + t;
  if (Math.abs(a.z - b.z) < 1e-6) return Math.abs(p.z - a.z) < t && p.x >= Math.min(a.x, b.x) - t && p.x <= Math.max(a.x, b.x) + t;
  return false;
}

/**
 * What a walk never crosses, where the renderer draws it: each desk (its spot is the chair, the
 * desk in front, +z), main's desk, the island (its top), each bean bag and deck chair.
 */
function furnitureOf(o: Pick<Office, 'desks' | 'mainDesk' | 'island' | 'lounge' | 'terrace'>): Box[] {
  const box = boxAt;
  const out: Box[] = [];
  for (const d of o.desks.values()) out.push(box(d.x, d.z + 0.5, 1.6, 0.78));
  out.push(box(o.mainDesk.x, o.mainDesk.z + 0.6, 2.3, 1.0));
  const iz = (o.island.z0 + o.island.z1) / 2;
  out.push(box((o.island.x0 + o.island.x1) / 2, iz, o.island.x1 - o.island.x0 + 0.1, o.island.z1 - o.island.z0 + 0.15));
  for (const l of o.lounge) out.push(napBedAt(l));
  for (const t of o.terrace) out.push(box(t.x, t.z + 0.05, 0.5, 0.95, t));
  return out;
}

/** a desk slot's chair: slot i fills the row from the left, row by row; column k=0 is by the aisle */
function deskAt(slot: number, side: number): Pt {
  const cols = side * 2;
  const c = slot % cols;
  const r = Math.floor(slot / cols);
  const left = c < side;
  const k = left ? side - 1 - c : c - side;
  return { x: (left ? -1 : 1) * (ISL / 2 + AISLE + DX * (k + 0.5)), z: BACK_D + 0.55 + DZ * r };
}

/** the slot a desk of `prev` sits on (deskAt's inverse) */
function slotOf(p: Pt, side: number): number {
  const k = Math.round((Math.abs(p.x) - ISL / 2 - AISLE) / DX - 0.5);
  const c = p.x < 0 ? side - 1 - k : side + k;
  const r = Math.round((p.z - BACK_D - 0.55) / DZ);
  return r * side * 2 + c;
}

/** each agent's desk slot: kept from `prev` when the columns did not change, else the first free one */
function deskSlots(names: readonly string[], side: number, prev: LoftOffice | undefined): Map<string, number> {
  const slots = new Map<string, number>();
  const taken = new Set<number>();
  if (prev?.side === side) {
    for (const name of names) {
      const d = prev.desks.get(name);
      if (!d) continue;
      const s = slotOf(d, side);
      slots.set(name, s);
      taken.add(s);
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

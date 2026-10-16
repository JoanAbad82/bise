// les bims: the office for N agents (the prototype's layout(), spec §3). Pure numbers, in floor
// tiles: x right (0 at the island's middle), z towards the viewer (0 at the back wall). The back
// zone holds the lounge (left), the whiteboard and main's big desk with its land queue (right);
// then the back corridor, 2 desk columns each side of the kitchen island (3 past 16 agents), the
// front corridor, the door, and the terrace outside. Each spot says where it joins the walk
// network (its walkway `wz`, its aisle or lane `ax`): paths.ts builds the network from that, so a
// walk never crosses a desk, the island, a bean bag or a deck chair (`furniture` lists them, the
// renderer draws them there). The office is the same at 320 px and wide: the camera fits it.
import type { Agent } from '@/proto';
import type { Office, Pt, Spot } from './model';

/** desk pitch across and along, the island's width, an aisle's width, the back zone's depth */
const DX = 2.4;
const DZ = 2.3;
const ISL = 1.4;
const AISLE = 1.0;
const BACK_D = 4.3;
/** past this many agents (main aside), 3 desk columns each side of the island */
export const WIDE_PAST = 16;
const LOUNGE_N = 10;
const QUEUE_N = 6;
const QUEUE_GAP = 0.5;
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
export function layoutOf(agents: readonly Agent[], prev?: Office): Office {
  const others = agents.filter((a) => !a.main && !a.archived).map((a) => a.name);
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
  const island = { z0, z1: z0 + Math.max(rows * DZ - 1.0, 3.5), w: ISL };
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
    const z = 1.0 + Math.floor(i / 4) * 1.05;
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

  return {
    side, rows, W, D, x0, crossBack, crossFront, ax, island,
    desks, mainDesk, islandSpots, lounge, boardSpots, queue, door, terrace,
  };
}

/** the terrace's walkway z (the door line goes from the front corridor down to it) */
export function terraceWalk(o: Office): number {
  return o.D + TERRACE_WALK;
}

/** where a leaving (archived) bim walks to: off the terrace's left edge, out of the map */
export function exitOf(o: Office): Spot {
  const z = terraceWalk(o);
  const x = o.x0 - EXIT_OUT;
  return { x, z, wz: z, ax: x, face: -Math.PI / 2 };
}

/** A piece of furniture's floor box; `of`: the spot it belongs to (a bim sits in its bean bag). */
export interface Box {
  readonly x0: number;
  readonly x1: number;
  readonly z0: number;
  readonly z1: number;
  readonly of?: Pt;
}

/**
 * What a walk never crosses, where the renderer draws it: each desk (its spot is the chair, the
 * desk in front, +z), main's desk, the island (its top), each bean bag and deck chair.
 */
export function furniture(o: Office): Box[] {
  const box = (x: number, z: number, w: number, d: number, of?: Pt): Box => ({
    x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, ...(of ? { of } : {}),
  });
  const out: Box[] = [];
  for (const d of o.desks.values()) out.push(box(d.x, d.z + 0.5, 1.6, 0.78));
  out.push(box(o.mainDesk.x, o.mainDesk.z + 0.6, 2.3, 1.0));
  const iz = (o.island.z0 + o.island.z1) / 2;
  out.push(box(0, iz, o.island.w + 0.1, o.island.z1 - o.island.z0 + 0.15));
  for (const l of o.lounge) out.push(box(l.x, l.z - 0.05, 0.72, 0.72, l));
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
function deskSlots(names: readonly string[], side: number, prev: Office | undefined): Map<string, number> {
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

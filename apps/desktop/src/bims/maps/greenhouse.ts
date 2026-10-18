// The greenhouse (page bims-maps v4 « serre »; its look: render/maps/greenhouse.ts): the desks in a
// ring round a tall tree that grows through a round table (the eating place, its spots on a small
// ring round it), glass walls. The loft's back zone (bplan.ts) behind the ring, the door in the
// middle of the front. Its walk graph: two rings (an inner one through the table's spots, an outer
// one past the desks), a spoke from each desk's chair out to the outer ring, a spoke front and back
// through the gaps between desks (the back one joins the back corridor, the front one the door).
// A desk's box is the floor box of a turned desk; its chair walks out through it (Box.of). Pure.
// Owner: maps-b.
import type { Agent } from '@/proto';
import type { Box, Leg, Pt, Spot } from '../model';
import { backBusy, backFrames, type CozyHints } from '../cozy';
import { type BOffice, LOFT_LIKE, type Way, backZone, corridor, keepSlots, outside, queueMoreOf, walksOf } from './bplan';
import { type Plan, boxAt } from './plan';

export interface GreenhouseOffice extends BOffice {
  /** the ring's centre (the tree), the chairs' radius, the outer ring's, the table's */
  readonly cx: number;
  readonly cz: number;
  readonly R: number;
  readonly Ro: number;
  readonly tableR: number;
}

const BACK = 4.05;
const TABLE_R = 1.25;
const INNER_R = 1.9;
/** a desk's width (along the ring) and depth; its middle this far in from its chair */
export const DESK_W = 1.1;
export const DESK_D = 0.55;
export const DESK_IN = 0.5;

/** a point at angle t (0: towards the front, +z) and radius r from (cx, cz) */
export const onRing = (cx: number, cz: number, r: number, t: number): Pt => ({ x: cx + r * Math.sin(t), z: cz + r * Math.cos(t) });

/** the floor box of a desk turned to face the ring's middle, its middle at p */
function turnedDesk(p: Pt, t: number, of: Pt): Box {
  const c = Math.abs(Math.cos(t));
  const s = Math.abs(Math.sin(t));
  return boxAt(p.x, p.z, DESK_W * c + DESK_D * s, DESK_W * s + DESK_D * c, of);
}

export function greenhouseLayout(agents: readonly Agent[], prev?: GreenhouseOffice): GreenhouseOffice {
  const { names, slots, used } = keepSlots(agents, prev?.slots);
  const want = Math.max(6, used, prev?.cap ?? 0);
  const cap = want + (want % 2);
  const R = Math.max(3.4, (cap * 1.9) / (2 * Math.PI));
  const Ro = R + 0.9;
  const W = Math.max(11, 2 * Ro + 2.6);
  const x0 = -W / 2;
  const cx = 0;
  const cz = BACK + Ro;
  const front = cz + Ro;
  const D = front + 0.7;

  const back = backZone(x0, W, BACK);
  const out = outside(x0, D, cx, front);
  const ways: Way[] = [...back.ways, ...out.ways];
  const furniture: Box[] = [...back.furniture, ...out.furniture];

  // the desks: slot i at the odd multiples of π/cap, facing the tree; each chair walks out to the outer ring
  const desks = new Map<string, Spot>();
  for (const name of names) {
    const t = ((2 * (slots.get(name) ?? 0) + 1) * Math.PI) / cap;
    const p = onRing(cx, cz, R, t);
    const s: Spot = { ...p, wz: p.z, ax: p.x, face: t + Math.PI };
    desks.set(name, s);
    furniture.push(turnedDesk(onRing(cx, cz, R - DESK_IN, t), t, s));
    ways.push({ s, to: onRing(cx, cz, Ro, t) });
  }

  // the round table and its eight places, on the inner ring
  const island = boxAt(cx, cz, 2 * TABLE_R, 2 * TABLE_R);
  furniture.push(island);
  const islandSpots: Spot[] = [];
  for (let i = 0; i < 8; i++) {
    const t = (i * Math.PI) / 4;
    const p = onRing(cx, cz, INNER_R, t);
    islandSpots.push({ ...p, wz: p.z, ax: p.x, face: t + Math.PI });
  }

  // the rings (the outer one through every multiple of π/cap), the spokes front and back
  const ring = (r: number, n: number): Leg[] => {
    const pts = Array.from({ length: n }, (_, i) => onRing(cx, cz, r, (i * 2 * Math.PI) / n));
    return pts.map((p, i) => [p, pts[(i + 1) % n] ?? p] as const);
  };
  const backLeg = corridor(BACK, ways, [cx]);
  const trunk: Leg[] = [
    backLeg,
    ...out.trunk,
    ...ring(INNER_R, 8),
    ...ring(Ro, 2 * cap),
    [onRing(cx, cz, INNER_R, Math.PI), onRing(cx, cz, Ro, Math.PI)],
    [onRing(cx, cz, INNER_R, 0), onRing(cx, cz, Ro, 0)],
  ];
  const walks = walksOf(trunk, ways);

  const places = { desks, mainDesk: back.mainDesk, islandSpots, lounge: back.lounge, boardSpots: back.boardSpots, queue: back.queue, door: out.door, terrace: out.terrace, exit: out.exit };
  return {
    map: 'greenhouse',
    size: `ring${String(cap)}`,
    W, D, x0, island, ...places,
    walks, furniture,
    queueMore: queueMoreOf(back.queue, back.mainDesk, backLeg, x0),
    slots, cap, crossBack: BACK,
    cx, cz, R, Ro, tableR: TABLE_R,
  };
}

/** its look's back wall (render/maps/greenhouse.ts shell): glass with six pots hanging along it, no poster on one */
const greenhouseCozy: CozyHints = {
  walls: (o) => [
    { wall: 'back', top: 1.9, busy: [...backBusy(o), ...Array.from({ length: 6 }, (_, i): [number, number] => [o.x0 + ((i + 0.5) * o.W) / 6 - 0.35, o.x0 + ((i + 0.5) * o.W) / 6 + 0.35])], frames: backFrames(o) },
    { wall: 'left', top: 1.9 },
    { wall: 'right', top: 0 },
  ],
};

export const greenhouse: Plan<GreenhouseOffice> = { id: 'greenhouse', ready: true, layout: greenhouseLayout, things: LOFT_LIKE, cozy: greenhouseCozy };

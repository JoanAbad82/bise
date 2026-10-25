// The Sahel map (a banco compound; page bims-maps v5; its look: render/maps/sahel.ts). The desks
// stand under a hangar of posts and branches on the left, four a row on mats, every other row
// shifted half a desk; behind each row a walkway out to the aisle on the hangar's right. In the
// yard on the right, the baobab, the palaver tree: the eating place, its spots round it (the attaya
// under it), a ring of short legs joined to the front. The back zone: mats along the back wall on
// the left, the slate, main's desk on the right; the granaries in the corner. Owner: maps-c.
import type { Agent } from '@/proto';
import type { Box, Leg, Office, Prop, Pt, Spot } from '../model';
import { backBusy, backFrames, type CozyHints } from '../cozy';
import { type Plan, boxAt, deskNames } from './plan';
import { ROOM } from './room';
import { CROSS_BACK, backZone, frontZone, keepSlots, slotsUsed, walksOf } from './yard';

export interface SahelOffice extends Office {
  readonly rows: number;
  /** the hangar's roof over the desks */
  readonly hangar: Box;
  /** the baobab's middle */
  readonly tree: Pt;
}

const W = 15.6;
const X0 = -W / 2;
const PER = 4;
const AISLE = X0 + 9.9;
const RING = 1.6;

function chairAt(i: number): Pt {
  const r = Math.floor(i / PER);
  return { x: X0 + 1.6 + (i % PER) * 2.1 + (r % 2) * 0.5, z: 5.0 + r * 2.0 };
}

export function sahelLayout(agents: readonly Agent[], prev?: SahelOffice): SahelOffice {
  const others = deskNames(agents);
  const slots = keepSlots(others, prev?.desks, chairAt);
  const rows = Math.max(3, Math.ceil(slotsUsed(slots) / PER), prev?.rows ?? 0);

  const desks = new Map<string, Spot>();
  const furniture: Box[] = [];
  for (const name of others) {
    const c = chairAt(slots.get(name) ?? 0);
    desks.set(name, { x: c.x, z: c.z, wz: c.z - 0.6, ax: AISLE, face: 0 });
    furniture.push(boxAt(c.x, c.z + 0.5, 1.4, 0.76));
  }
  const lastZ = 5.0 + (rows - 1) * 2.0;
  const hangar: Box = { x0: X0 + 0.5, x1: AISLE - 0.45, z0: 4.25, z1: lastZ + 1.3 };
  for (const x of [hangar.x0, hangar.x1]) for (const z of [hangar.z0, hangar.z1]) furniture.push(boxAt(x, z, 0.2, 0.2));

  // the baobab in the yard, eight spots round it on a ring of legs, joined to the front
  const tree = { x: X0 + 12.9, z: 5.0 + rows - 0.5 };
  const island = boxAt(tree.x, tree.z, 1.5, 1.5);
  furniture.push(island);
  const islandSpots: Spot[] = Array.from({ length: 8 }, (_, i) => {
    const t = (i / 8) * Math.PI * 2;
    const x = tree.x + RING * Math.sin(t);
    const z = tree.z + RING * Math.cos(t);
    return { x, z, wz: z, ax: x, face: Math.atan2(tree.x - x, tree.z - z) };
  });
  const ring: Leg[] = islandSpots.map((s, i) => [s, islandSpots[(i + 1) % 8] as Spot]);

  const crossFront = Math.max(lastZ + 0.88 + 1.2, tree.z + RING + 0.9);
  const D = crossFront + 0.5;
  const back = backZone({ x0: X0, W, main: 'right', reach: [AISLE] });
  const front = frontZone({ x0: X0, W, D, doorX: tree.x, terraceU: 1.0, out: 'left' });
  furniture.push(...back.furniture, ...front.furniture);

  const trunk: Leg[] = [
    back.corridor,
    [{ x: AISLE, z: CROSS_BACK }, { x: AISLE, z: crossFront }],
    [{ x: AISLE, z: crossFront }, { x: tree.x, z: crossFront }],
    [{ x: tree.x, z: tree.z + RING }, { x: tree.x, z: crossFront }],
    ...ring,
    ...front.legs,
  ];
  const base = {
    map: 'sahel' as const,
    size: `sahel-${String(rows)}`,
    W, D, x0: X0, island, desks, islandSpots,
    mainDesk: back.mainDesk, lounge: back.lounge, boardSpots: back.boardSpots, queue: back.queue,
    door: front.door, terrace: front.terrace, exit: front.exit, furniture,
  };
  return { ...base, walks: walksOf(base, trunk), queueMore: back.queueMore, rows, hangar, tree };
}

/** its look's back wall (render/maps/sahel.ts shell): a tower every quarter of it, no poster on one */
const sahelCozy: CozyHints = {
  walls: (o) => [
    { wall: 'back', top: 1.7, busy: [...backBusy(o), ...Array.from({ length: 5 }, (_, i): [number, number] => [o.x0 + (i * o.W) / 4 - 0.45, o.x0 + (i * o.W) / 4 + 0.45])], frames: backFrames(o) },
    { wall: 'left', top: 1.0 },
    { wall: 'right', top: 0 },
  ],
  // the water jars by the door (render/maps/sahel.ts shell)
  keepOut: (o) => [{ x0: o.door.x + 0.5, x1: o.door.x + 1.95, z0: o.D - 0.6, z1: o.D }],
};

/**
 * A buttress's x on the back wall, moved into the lane beside a nap spot it stood behind: there a
 * napper's head went into it (Gabriel, bims-life). The lanes are half a spot's pitch either side.
 */
export function offNap(o: Office, x: number): number {
  const s = o.lounge.find((l) => Math.abs(l.x - x) < 0.6);
  if (!s) return x;
  return s.x + (x >= s.x ? 1 : -1) * Math.abs(s.ax - s.x);
}

/** what its look draws by its walls and in its yard (render/maps/sahel.ts shell), from these numbers */
export function sahelShell(o: SahelOffice) {
  const { x0, W, D } = o;
  // the torons go round the posters on the back wall (a roomier office moves them under one)
  const hung = (o.cozy?.posters ?? []).filter((p) => p.wall === 'back');
  const underPoster = (x: number): boolean => hung.some((p) => Math.abs(p.x - x) < p.w / 2 + 0.08);
  const torons: number[] = [];
  for (let x = x0 + 0.6; x < x0 + W; x += 0.9) if (!underPoster(x)) torons.push(x);
  const buttresses: number[] = [];
  for (let x = x0; x <= x0 + W + 0.01; x += W / 4) buttresses.push(offNap(o, x));
  return {
    torons,
    buttresses,
    granaries: [{ x: x0 + W - 0.9, z: 5.0 }, { x: x0 + W - 0.9, z: 6.3 }],
    jars: [0, 1, 2].map((i) => ({ x: o.door.x + 0.8 + i * 0.45, z: D - 0.25 })),
    line: { x0: o.tree.x - 1.8, x1: o.tree.x + 1.8, z: 4.6 },
  };
}

/** what his objects keep off (Office.props): the torons high on the back wall, the buttresses, the granaries, the jars, the drying line (its cloth from 0.8 up) and its posts */
const sahelProps = (o: Office): Prop[] => {
  const s = sahelShell(o as SahelOffice);
  return [
    ...s.torons.map((x) => ({ ...boxAt(x, 0.15, 0.2, 0.3), y0: 1.12 })),
    ...s.buttresses.map((x) => boxAt(x, 0.08, 0.65, 0.16)),
    ...s.granaries.map((g) => boxAt(g.x, g.z, 1.15, 1.15)),
    ...s.jars.map((j) => boxAt(j.x, j.z, 0.45, 0.45)),
    { x0: s.line.x0, x1: s.line.x1, z0: s.line.z - 0.1, z1: s.line.z + 0.1, y0: 0.78 },
    ...[s.line.x0, s.line.x1].map((x) => boxAt(x, s.line.z, 0.2, 0.2)),
  ];
};

export const sahel: Plan<SahelOffice> = { id: 'sahel', ready: true, layout: sahelLayout, cozy: sahelCozy, room: ROOM, props: sahelProps };

// The tropical map (Brazil, a modernist house; page bims-maps v5; its look: render/maps/tropical.ts).
// The desks follow Niemeyer's curve: each row of eight is an S across the room, its walkway a
// curve of short legs behind the chairs, out to the aisle on each side; more rows past eight
// agents, the same curve each time. The juice bar runs along the right wall, its stools facing it.
// The back zone is the other way round: main's desk on the left, the hammocks on the right, under
// the thin flat roof. The door on the right, the terrace past it. Owner: maps-c.
import type { Agent } from '@/proto';
import type { Leg, Office, Pt, Spot } from '../model';
import { type Plan, boxAt, deskNames } from './plan';
import { CROSS_BACK, backZone, frontZone, keepSlots, slotsUsed, walksOf } from './yard';

export interface TropicalOffice extends Office {
  /** the S rows */
  readonly curves: number;
  /** each row's walkway behind its chairs, as points (the look lays its monstera pots past it) */
  readonly paths: readonly (readonly Pt[])[];
  readonly aisles: readonly [number, number];
}

const W = 16.6;
const X0 = -W / 2;
const PER = 8;
const PITCH = 1.55;
const ROW = 2.7;
const Z0 = 5.4;
const AMP = 0.75;
const AISLES = [X0 + 0.6, X0 + 14.3] as const;

/** a slot's chair: on its row's S, the j-th from the left */
function chairAt(i: number): Pt {
  const c = Math.floor(i / PER);
  const j = i % PER;
  return { x: X0 + 2.0 + j * PITCH, z: Z0 + c * ROW + AMP * Math.sin((j / (PER - 1)) * 1.5 * Math.PI) };
}

export function tropicalLayout(agents: readonly Agent[], prev?: TropicalOffice): TropicalOffice {
  const others = deskNames(agents);
  const slots = keepSlots(others, prev?.desks, chairAt);
  const curves = Math.max(2, Math.ceil(slotsUsed(slots) / PER), prev?.curves ?? 0);
  const [aL, aR] = AISLES;

  const desks = new Map<string, Spot>();
  const furniture = [];
  for (const name of others) {
    const c = chairAt(slots.get(name) ?? 0);
    desks.set(name, { x: c.x, z: c.z, wz: c.z - 0.6, ax: c.x, face: 0 });
    furniture.push(boxAt(c.x, c.z + 0.5, 1.3, 0.76));
  }
  const paths: Pt[][] = [];
  const curveLegs: Leg[] = [];
  for (let c = 0; c < curves; c++) {
    const pts = Array.from({ length: PER }, (_, j) => {
      const p = chairAt(c * PER + j);
      return { x: p.x, z: p.z - 0.6 };
    });
    paths.push(pts);
    const a = pts[0] as Pt;
    const b = pts[PER - 1] as Pt;
    curveLegs.push([{ x: aL, z: a.z }, a], [b, { x: aR, z: b.z }]);
    for (let j = 1; j < PER; j++) curveLegs.push([pts[j - 1] as Pt, pts[j] as Pt]);
  }

  // the juice bar along the right wall, four stools facing it
  const bz = Z0 + 1.6;
  const island = boxAt(X0 + 15.75, bz, 0.9, 3.2);
  furniture.push(island);
  const islandSpots: Spot[] = [-1.2, -0.4, 0.4, 1.2].map((d) => ({ x: X0 + 14.95, z: bz + d, wz: bz + d, ax: aR, face: Math.PI / 2 }));

  const crossFront = Math.max(Z0 + (curves - 1) * ROW + AMP + 0.88 + 1.2, bz + 2.4);
  const D = crossFront + 0.5;
  const back = backZone({ x0: X0, W, main: 'left', reach: AISLES });
  const front = frontZone({ x0: X0, W, D, doorX: aR, terraceU: W - 4.6, out: 'right' });
  furniture.push(...back.furniture, ...front.furniture);

  const trunk: Leg[] = [
    back.corridor,
    [{ x: aL, z: crossFront }, { x: aR, z: crossFront }],
    ...AISLES.map((x): Leg => [{ x, z: CROSS_BACK }, { x, z: crossFront }]),
    ...curveLegs,
    ...front.legs,
  ];
  const base = {
    map: 'tropical' as const,
    size: `tropical-${String(curves)}`,
    W, D, x0: X0, island, desks, islandSpots,
    mainDesk: back.mainDesk, lounge: back.lounge, boardSpots: back.boardSpots, queue: back.queue,
    door: front.door, terrace: front.terrace, exit: front.exit, furniture,
  };
  return { ...base, walks: walksOf(base, trunk), queueMore: back.queueMore, curves, paths, aisles: AISLES };
}

export const tropical: Plan<TropicalOffice> = { id: 'tropical', ready: true, layout: tropicalLayout };

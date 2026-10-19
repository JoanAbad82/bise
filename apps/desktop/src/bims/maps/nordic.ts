// Nordic, a wooden house (page bims-maps v5 « Scandinavie »; its look: render/maps/nordic.ts): one
// long common table down the middle where every agent has its place (a chair each side, in turn), a
// fika counter along the left wall (the eating place), the wood stove in the back left corner with
// sheepskins on the floor (the nap place), main's desk at the back right, a sauna outside. The
// table grows longer with the agents. Its walk graph: the back corridor, an aisle each side of the
// table, the front corridor; the counter's places walk straight across to the left aisle. Pure.
// Owner: maps-b.
import type { Agent } from '@/proto';
import { bims } from '@/proto/words_bims.gen';
import type { Box, Leg, Spot } from '../model';
import { backBusy, type CozyHints } from '../cozy';
import { type BOffice, type Way, backZone, corridor, keepSlots, outside, queueMoreOf, walksOf } from './bplan';
import { type Plan, type Things, boxAt } from './plan';

export interface NordicOffice extends BOffice {
  /** the long table's floor box */
  readonly table: Box;
}

const BACK = 4.05;
const W = 10;
/** the table's rows of places are this far apart (its look's table lamps stand between them) */
export const PITCH = 1.6;
const TABLE_W = 1.5;
const CHAIR_X = 1.05;
const AISLE = 1.85;

export function nordicLayout(agents: readonly Agent[], prev?: NordicOffice): NordicOffice {
  const { names, slots, used } = keepSlots(agents, prev?.slots);
  const k = Math.max(3, Math.ceil(Math.max(used, prev?.cap ?? 0) / 2));
  const cap = k * 2;
  const tz0 = BACK + 0.45;
  const table = boxAt(0, tz0 + (k * PITCH) / 2, TABLE_W, k * PITCH);
  // the room ends a couple of steps past the table (bims m_28835)
  const D = table.z1 + 1.4;
  const front = D - 0.5;
  const x0 = -W / 2;

  // the stove's corner first, then 8 sheepskins
  const back = backZone(x0, W, BACK, { lx0: x0 + 1.4, lw: 3.0, n: 8, bed: 0.8 });
  const out = outside(x0, D, -AISLE, front);
  const ways: Way[] = [...back.ways, ...out.ways];
  const furniture: Box[] = [...back.furniture, ...out.furniture, table];

  // a place each side of the table in turn, facing it
  const desks = new Map<string, Spot>();
  for (const name of names) {
    const s0 = slots.get(name) ?? 0;
    const sx = s0 % 2 ? 1 : -1;
    const z = tz0 + PITCH / 2 + Math.floor(s0 / 2) * PITCH;
    const s: Spot = { x: sx * CHAIR_X, z, wz: z, ax: sx * AISLE, face: sx < 0 ? Math.PI / 2 : -Math.PI / 2 };
    desks.set(name, s);
    ways.push({ s });
  }

  // the fika counter along the left wall; its places walk across to the left aisle
  const island: Box = { x0: x0 + 0.15, x1: x0 + 1.05, z0: BACK + 0.55, z1: BACK + 0.55 + Math.min(4, k * PITCH - 0.4) };
  furniture.push(island);
  const islandSpots: Spot[] = [];
  for (let z = island.z0 + 0.5; z < island.z1 - 0.2; z += 0.85) islandSpots.push({ x: x0 + 1.4, z, wz: z, ax: -AISLE, face: -Math.PI / 2 });
  for (const s of islandSpots) ways.push({ s });

  const backLeg = corridor(BACK, ways, [-AISLE, AISLE]);
  const trunk: Leg[] = [
    backLeg,
    ...out.trunk,
    [{ x: -AISLE, z: BACK }, { x: -AISLE, z: front }],
    [{ x: AISLE, z: BACK }, { x: AISLE, z: front }],
    [{ x: -AISLE, z: front }, { x: AISLE, z: front }],
  ];
  const walks = walksOf(trunk, ways);

  return {
    map: 'nordic',
    size: `table${String(k)}`,
    W, D, x0, island,
    desks, mainDesk: back.mainDesk, islandSpots, lounge: back.lounge, boardSpots: back.boardSpots, queue: back.queue, door: out.door, terrace: out.terrace, exit: out.exit,
    walks, furniture,
    queueMore: queueMoreOf(back.queue, back.mainDesk, backLeg, x0),
    slots, cap, crossBack: BACK,
    table,
  };
}

/** what each stage brings here (page bims-maps « comment chaque map grandit », its look's pieces) */
const THINGS: Things = {
  1: bims.stage_nordic_1, 2: bims.stage_nordic_2, 3: bims.stage_nordic_3, 4: bims.stage_nordic_4, 5: bims.stage_nordic_5, 6: bims.stage_nordic_6, 7: bims.stage_nordic_7,
  8: bims.stage_nordic_8, 9: bims.stage_nordic_9, 10: bims.stage_nordic_10, 11: bims.stage_nordic_11, 12: bims.stage_nordic_12, 13: bims.stage_nordic_13, 14: bims.stage_nordic_14,
};

/** its look's walls and what stands by them (render/maps/nordic.ts): the stove and its logs at the back left, the skis in the back right corner */
const nordicCozy: CozyHints = {
  walls: (o) => [{ wall: 'back', top: 1.9, busy: backBusy(o) }, { wall: 'left', top: 1.3 }, { wall: 'right', top: 0 }],
  keepOut: (o) => [{ x0: o.x0, x1: o.x0 + 0.95, z0: 0.1, z1: 1.8 }, { x0: o.x0 + o.W - 0.75, x1: o.x0 + o.W, z0: 0, z1: 0.45 }],
};

export const nordic: Plan<NordicOffice> = { id: 'nordic', ready: true, layout: nordicLayout, things: THINGS, cozy: nordicCozy };

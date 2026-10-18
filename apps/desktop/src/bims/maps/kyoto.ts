// Kyoto, a machiya (page bims-maps v5 « Japon »; its look: render/maps/kyoto.ts): a long narrow
// house on tatami, two columns of wooden desks, a tea counter along the left wall (the eating
// place), a kotatsu at the back left with its floor cushions (the nap place), the inner garden
// (tsuboniwa) behind an engawa on the right, main's desk at the back right. The room grows deeper
// with the agents, never wider. Its walk graph: the back corridor, the left aisle (the counter's
// places stand on it), the lane between the two desk columns, the front corridor; the kotatsu's back
// row walks round behind its cushions to a lane by the left wall. Pure. Owner: maps-b.
import type { Agent } from '@/proto';
import { bims } from '@/proto/words_bims.gen';
import type { Box, Leg, Office, Spot } from '../model';
import { type BOffice, type Way, backZone, corridor, keepSlots, outside, queueMoreOf, walksOf } from './bplan';
import { type Plan, type Things, boxAt } from './plan';

export interface KyotoOffice extends BOffice {
  /** the inner garden's floor box (gravel, moss, the lantern, the maple), right of the engawa */
  readonly garden: Box;
  /** the kotatsu's floor box */
  readonly kotatsu: Box;
  readonly rows: number;
}

const BACK = 4.05;
const W = 12.5;
const ROW = 2.1;
const COLS = [3.4, 5.8] as const;

export function kyotoLayout(agents: readonly Agent[], prev?: KyotoOffice): KyotoOffice {
  const { names, slots, used } = keepSlots(agents, prev?.slots);
  const rows = Math.max(3, Math.ceil(Math.max(used, prev?.cap ?? 0) / 2));
  const cap = rows * 2;
  const D = 4.4 + rows * ROW + 1.2;
  const x0 = -W / 2;
  const aisle = x0 + 1.85;
  const lane = x0 + 4.6;
  const front = D - 0.5;

  const back = backZone(x0, W, BACK, { n: 0, lw: 3.4 });
  const ways: Way[] = [...back.ways];
  const furniture: Box[] = [...back.furniture];

  // the kotatsu: a long low table, 4 cushions behind it and 4 in front
  const kx = x0 + 2.6;
  const kotatsu = boxAt(kx, 1.75, 2.8, 0.7);
  furniture.push(kotatsu);
  const lounge: Spot[] = [];
  const side = x0 + 0.7;
  for (const row of [0, 1]) {
    for (const o of [-1.2, -0.4, 0.4, 1.2]) {
      const x = kx + o;
      const s: Spot = row === 0 ? { x, z: 1.0, wz: 0.45, ax: side, face: 0 } : { x, z: 2.5, wz: 2.5, ax: x, face: Math.PI };
      lounge.push(s);
      furniture.push(boxAt(x, s.z, 0.55, 0.55, s));
      ways.push({ s, to: { x: s.ax, z: BACK } });
    }
  }
  // the order beds fill in: the front row first, then the back one
  lounge.push(...lounge.splice(0, 4));

  // two columns of desks; the left one walks to the aisle, the right one to the lane between them
  const desks = new Map<string, Spot>();
  for (const name of names) {
    const s0 = slots.get(name) ?? 0;
    const c = s0 % 2;
    const x = x0 + (COLS[c] ?? 3.4);
    const z = 4.95 + Math.floor(s0 / 2) * ROW;
    const s: Spot = { x, z, wz: z - 0.65, ax: c === 0 ? aisle : lane, face: 0 };
    desks.set(name, s);
    furniture.push(boxAt(x, z + 0.5, 1.6, 0.78));
    ways.push({ s });
  }

  // the tea counter along the left wall, its places on the aisle
  const island: Box = { x0: x0 + 0.55, x1: x0 + 1.45, z0: 4.8, z1: 4.8 + Math.min(4.5, rows * ROW - 0.6) };
  furniture.push(island);
  const islandSpots: Spot[] = [];
  for (let z = island.z0 + 0.5; z < island.z1 - 0.2; z += 0.85) islandSpots.push({ x: aisle, z, wz: z, ax: aisle, face: -Math.PI / 2 });

  const out = outside(x0, D, aisle, front);
  ways.push(...out.ways);
  furniture.push(...out.furniture);
  const garden: Box = { x0: x0 + 7.4, x1: x0 + W - 0.3, z0: 4.6, z1: D - 1.4 };

  const backLeg = corridor(BACK, ways, [aisle, lane]);
  const trunk: Leg[] = [
    backLeg,
    ...out.trunk,
    [{ x: aisle, z: BACK }, { x: aisle, z: front }],
    [{ x: lane, z: BACK }, { x: lane, z: front }],
    [{ x: aisle, z: front }, { x: lane, z: front }],
  ];
  const walks = walksOf(trunk, ways);

  return {
    map: 'kyoto',
    size: `rows${String(rows)}`,
    W, D, x0, island,
    desks, mainDesk: back.mainDesk, islandSpots, lounge, boardSpots: back.boardSpots, queue: back.queue, door: out.door, terrace: out.terrace, exit: out.exit,
    walks, furniture,
    queueMore: queueMoreOf(back.queue, back.mainDesk, backLeg, x0),
    slots, cap, crossBack: BACK,
    garden, kotatsu, rows,
  };
}

/** what each stage brings here (page bims-maps « comment chaque map grandit », its look's pieces) */
const THINGS: Things = {
  1: bims.stage_kyoto_1, 2: bims.stage_kyoto_2, 3: bims.stage_kyoto_3, 4: bims.stage_kyoto_4, 5: bims.stage_kyoto_5, 6: bims.stage_kyoto_6, 7: bims.stage_kyoto_7,
  8: bims.stage_kyoto_8, 9: bims.stage_kyoto_9, 10: bims.stage_kyoto_10, 11: bims.stage_kyoto_11, 12: bims.stage_kyoto_12, 13: bims.stage_kyoto_13, 14: bims.stage_kyoto_14,
};

/** the inner garden holds its stages' pieces (the lantern, the maple, the go board, the shishi-odoshi): nothing cozy in it */
const kyotoKeep = (o: Office): Box[] => [(o as KyotoOffice).garden];

export const kyoto: Plan<KyotoOffice> = { id: 'kyoto', ready: true, layout: kyotoLayout, things: THINGS, cozy: { keepOut: kyotoKeep } };

// The riad (page bims-maps v5 « Maroc »; its look: render/maps/riad.ts): a house round a patio, its
// fountain in the middle (the eating place, its places round the basin), the desks in the galleries
// on three sides, each facing the patio (left, back, right in turn), arcades between the galleries
// and the patio. The loft's back zone (bplan.ts: poufs and the banquette at the back left, main's
// desk at the back right), the heavy door at the front left. Its walk graph: the back corridor, a
// gallery aisle each side, the front corridor, a ring round the fountain and a path from it to the
// front; a side gallery's chair walks out between two desks to its aisle. Pure. Owner: maps-b.
import type { Agent } from '@/proto';
import { bims } from '@/proto/words_bims.gen';
import type { Box, Leg, Office, Pt, Spot } from '../model';
import { type BOffice, type Way, backZone, corridor, keepSlots, outside, queueMoreOf, walksOf } from './bplan';
import { type Plan, type Things, boxAt } from './plan';

export interface RiadOffice extends BOffice {
  /** the patio's floor box (zellige, the arcades round it, the orange trees in its corners) */
  readonly patio: Box;
  /** the fountain's middle */
  readonly fx: number;
  readonly fz: number;
}

const BACK = 4.05;
const PITCH = 1.9;
const RING_R = 1.75;
/** the side desks' width along their wall */
const SIDE_W = 1.4;

export function riadLayout(agents: readonly Agent[], prev?: RiadOffice): RiadOffice {
  const { names, slots, used } = keepSlots(agents, prev?.slots);
  const k = Math.max(3, Math.ceil(Math.max(used, prev?.cap ?? 0) / 3));
  const cap = k * 3;
  const P = Math.max(5.6, k * PITCH + 0.4);
  const W = P + 5.4;
  const x0 = -W / 2;
  const x1 = x0 + W;
  const pz0 = BACK + 2.15;
  const patio: Box = { x0: x0 + 2.7, x1: x1 - 2.7, z0: pz0, z1: pz0 + P };
  const left = x0 + 2.25;
  const right = x1 - 2.25;
  const front = patio.z1 + 0.6;
  const D = front + 0.6;

  // the beds clear of the banquette along the back wall (render/maps/riad.ts)
  const back = backZone(x0, W, BACK, { napZ: 1.65 });
  const out = outside(x0, D, left, front);
  const ways: Way[] = [...back.ways, ...out.ways];
  const furniture: Box[] = [...back.furniture, ...out.furniture];

  // slot i: the left gallery, the back one, the right one in turn, each desk facing the patio
  const desks = new Map<string, Spot>();
  const shift = (P - k * PITCH) / 2;
  for (const name of names) {
    const s0 = slots.get(name) ?? 0;
    const i = Math.floor(s0 / 3);
    const side = s0 % 3;
    let s: Spot;
    if (side === 1) {
      const x = patio.x0 + shift + PITCH / 2 + i * PITCH;
      s = { x, z: BACK + 0.65, wz: BACK, ax: x, face: 0 };
      furniture.push(boxAt(x, s.z + 0.5, SIDE_W, 0.78));
    } else {
      const z = pz0 + PITCH / 2 + i * PITCH;
      const l = side === 0;
      const x = l ? x0 + 0.9 : x1 - 0.9;
      s = { x, z, wz: z + PITCH / 2, ax: l ? left : right, face: l ? Math.PI / 2 : -Math.PI / 2 };
      furniture.push(boxAt(x + (l ? 0.5 : -0.5), z, 0.78, SIDE_W));
    }
    desks.set(name, s);
    ways.push({ s });
  }

  // the fountain in the middle of the patio, eight places round its basin
  const fx = (patio.x0 + patio.x1) / 2;
  const fz = (patio.z0 + patio.z1) / 2;
  const island = boxAt(fx, fz, 2.2, 2.2);
  furniture.push(island);
  const ringAt = (t: number): Pt => ({ x: fx + RING_R * Math.sin(t), z: fz + RING_R * Math.cos(t) });
  const islandSpots: Spot[] = [];
  for (let i = 0; i < 8; i++) {
    const t = (i * Math.PI) / 4;
    islandSpots.push({ ...ringAt(t), wz: ringAt(t).z, ax: ringAt(t).x, face: t + Math.PI });
  }

  const backLeg = corridor(BACK, ways, [left, right]);
  const ring: Leg[] = islandSpots.map((s, i) => [s, islandSpots[(i + 1) % 8] ?? s] as const);
  const trunk: Leg[] = [
    backLeg,
    ...out.trunk,
    [{ x: left, z: BACK }, { x: left, z: front }],
    [{ x: right, z: BACK }, { x: right, z: front }],
    [{ x: left, z: front }, { x: right, z: front }],
    ...ring,
    [ringAt(0), { x: fx, z: front }],
  ];
  const walks = walksOf(trunk, ways);

  return {
    map: 'riad',
    size: `galleries${String(k)}`,
    W, D, x0, island,
    desks, mainDesk: back.mainDesk, islandSpots, lounge: back.lounge, boardSpots: back.boardSpots, queue: back.queue, door: out.door, terrace: out.terrace, exit: out.exit,
    walks, furniture,
    queueMore: queueMoreOf(back.queue, back.mainDesk, backLeg, x0),
    slots, cap, crossBack: BACK,
    patio, fx, fz,
  };
}

/** what each stage brings here (page bims-maps « comment chaque map grandit », its look's pieces) */
const THINGS: Things = {
  1: bims.stage_riad_1, 2: bims.stage_riad_2, 3: bims.stage_riad_3, 4: bims.stage_riad_4, 5: bims.stage_riad_5, 6: bims.stage_riad_6, 7: bims.stage_riad_7,
  8: bims.stage_riad_8, 9: bims.stage_riad_9, 10: bims.stage_riad_10, 11: bims.stage_riad_11, 12: bims.stage_riad_12, 13: bims.stage_riad_13, 14: bims.stage_riad_14,
};

/** the patio's arcades on its sides and the orange trees in its corners (render/maps/riad.ts): nothing cozy along its edges */
const riadKeep = (o: Office): Box[] => {
  const p = (o as RiadOffice).patio;
  return [
    { x0: p.x0 - 0.5, x1: p.x0 + 1.3, z0: p.z0 - 0.5, z1: p.z1 + 0.5 },
    { x0: p.x1 - 1.3, x1: p.x1 + 0.5, z0: p.z0 - 0.5, z1: p.z1 + 0.5 },
    { x0: p.x0 - 0.5, x1: p.x1 + 0.5, z0: p.z0 - 0.5, z1: p.z0 + 1.3 },
    { x0: p.x0 - 0.5, x1: p.x1 + 0.5, z0: p.z1 - 1.3, z1: p.z1 + 0.5 },
  ];
};

export const riad: Plan<RiadOffice> = { id: 'riad', ready: true, layout: riadLayout, things: THINGS, cozy: { keepOut: riadKeep } };

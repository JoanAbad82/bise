// A desk's laptop and a bim's head as plain numbers (pure, no three): world.ts builds the laptop
// from LAPTOP, bim.ts puts the head at HEAD_Y, and headClearance says how far a seated rig's head (its
// skull and the hair or hat parts that stick out most) stays from its desk's laptop (Gabriel,
// bims-fix: asleep, the head came out through the screen). Coordinates are the seated bim's: its
// desk spot at the origin, facing +z (layout.ts: the desk 0.5 ahead of the spot, the laptop on the
// spot's x). Owner: bims-fix.
import type { Rig, Rot } from './pose';

/** where the laptop sits on its desk's top: the base and the lid, its hinge at the base's back */
export const LAPTOP = {
  /** the laptop's centre ahead of the desk's centre (desk's own frame) */
  dz: -0.03,
  base: { w: 0.5, h: 0.03, d: 0.34, y: 0.56 },
  /** the hinge: up and back from the laptop's centre; the lid leans back by tilt */
  lid: { w: 0.5, h: 0.34, d: 0.025, y: 0.57, back: 0.16, tilt: 0.2 },
} as const;

/** the desk's centre ahead of its chair's spot (layout.ts furniture: box(d.x, d.z + 0.5, ...)) */
const DESK_AHEAD = 0.5;

/** the head's centre above the body's origin (bim.ts; the clay head of page bims-look D sits 0.02 higher) */
export const HEAD_Y = 0.95;
/** the head's radius (bim.ts) */
export const HEAD_R = 0.245;
/** the hats and the maps' wears were drawn for a 0.22 head: bim.ts scales them by this about its centre */
export const HAT_K = HEAD_R / 0.22;

/** the head's parts as balls in the head's frame: the skull, an afro, a bun, a beanie's pompom, a cap's brim (bim.ts, the hats at HAT_K) */
const HEAD_PARTS: readonly { readonly x: number; readonly y: number; readonly z: number; readonly r: number }[] = [
  { x: 0, y: 0, z: 0, r: HEAD_R },
  ...[
    { x: 0, y: 0.1, z: -0.05, r: 0.27 },
    { x: 0, y: 0.24, z: -0.08, r: 0.09 },
    { x: 0, y: 0.28, z: 0, r: 0.06 },
    ...[0.13, 0.19, 0.25, 0.3].map((z) => ({ x: 0, y: 0.07, z, r: 0.02 })),
  ].map((b) => ({ x: b.x * HAT_K, y: b.y * HAT_K, z: b.z * HAT_K, r: b.r * HAT_K })),
];

interface V {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** a point turned by a three.js Euler [x, y, z] in its default 'XYZ' order (Rx · Ry · Rz · p) */
function turn(p: V, r: Rot): V {
  const [a, b, c] = r;
  const z1 = { x: p.x * Math.cos(c) - p.y * Math.sin(c), y: p.x * Math.sin(c) + p.y * Math.cos(c), z: p.z };
  const y1 = { x: z1.x * Math.cos(b) + z1.z * Math.sin(b), y: z1.y, z: -z1.x * Math.sin(b) + z1.z * Math.cos(b) };
  return { x: y1.x, y: y1.y * Math.cos(a) - y1.z * Math.sin(a), z: y1.y * Math.sin(a) + y1.z * Math.cos(a) };
}

/** the distance from p to a box (its centre, half sizes) turned by tilt around x at its centre */
function toBox(p: V, c: V, half: V, tilt: number): number {
  const q = turn({ x: p.x - c.x, y: p.y - c.y, z: p.z - c.z }, [-tilt, 0, 0]);
  const dx = Math.max(0, Math.abs(q.x) - half.x);
  const dy = Math.max(0, Math.abs(q.y) - half.y);
  const dz = Math.max(0, Math.abs(q.z) - half.z);
  return Math.hypot(dx, dy, dz);
}

/** the laptop's base and lid as boxes in the seated bim's frame */
function laptopBoxes(): { c: V; half: V; tilt: number }[] {
  const z = DESK_AHEAD + LAPTOP.dz;
  const { base, lid } = LAPTOP;
  const hinge = { y: lid.y, z: z + lid.back };
  // the lid's centre: half its height up from the hinge, along its lean
  const lidC = { x: 0, y: hinge.y + (lid.h / 2) * Math.cos(lid.tilt), z: hinge.z + (lid.h / 2) * Math.sin(lid.tilt) };
  return [
    { c: { x: 0, y: base.y, z }, half: { x: base.w / 2, y: base.h / 2, z: base.d / 2 }, tilt: 0 },
    { c: lidC, half: { x: lid.w / 2, y: lid.h / 2, z: lid.d / 2 }, tilt: lid.tilt },
  ];
}

/** How far a seated rig's head stays from its laptop (world units; under 0: inside it). Pure. */
export function headClearance(rig: Pick<Rig, 'y' | 'body' | 'head'>, scale = 1): number {
  const boxes = laptopBoxes();
  let least = Infinity;
  for (const part of HEAD_PARTS) {
    const inHead = turn({ x: part.x * scale, y: part.y * scale, z: part.z * scale }, rig.head);
    const inBody = turn({ x: inHead.x, y: inHead.y + HEAD_Y * scale, z: inHead.z }, rig.body);
    const p = { x: inBody.x, y: inBody.y + rig.y, z: inBody.z };
    for (const b of boxes) least = Math.min(least, toBox(p, b.c, b.half, b.tilt) - part.r * scale);
  }
  return least;
}

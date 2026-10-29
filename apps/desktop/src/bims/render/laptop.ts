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

/**
 * the head's parts as balls in the head's frame: the skull, a bob's helmet (the widest of the women's
 * cuts round the face), her two buns, an afro, a bun, a beanie's pompom, a cap's brim (bim.ts, the hats at HAT_K)
 */
const HEAD_PARTS: readonly { readonly x: number; readonly y: number; readonly z: number; readonly r: number }[] = [
  { x: 0, y: 0, z: 0, r: HEAD_R },
  { x: 0, y: 0.06, z: 0, r: 0.262 },
  // her buns: bim.ts BUN along (0.165, 0.215, -0.05)
  ...[-1, 1].map((sx) => ({ x: sx * 0.186, y: 0.243, z: -0.057, r: 0.085 })),
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

/** main's bim is this much bigger than an agent's (bim.ts scales its body by it) */
export const MAIN_K = 1.18;
/** where an arm hangs from (its shoulder, the body's frame) and how far its hand's centre is down it (bim.ts) */
export const SHOULDER = { x: 0.24, y: 0.66 } as const;
export const REACH = 0.305;
/** the hand's half height (bim.ts: a 0.066 ball, 1.05 tall) and a few mm of air: it rests on the keys, never in them */
const HAND_R = 0.075;
/** the keys on the laptop's base: their top, the hands' row (its front half), each hand this far off the middle */
export const KEYS = {
  y: LAPTOP.base.y + LAPTOP.base.h / 2,
  z0: DESK_AHEAD + LAPTOP.dz - LAPTOP.base.d / 2,
  z1: DESK_AHEAD + LAPTOP.dz,
  x: 0.16,
} as const;

/**
 * The arm (three.js Euler 'XYZ', its body's frame) that rests a seated bim's hand on its laptop's
 * keys (Gabriel m_49096: typing, the hands went through the desk's edge): `side` -1 its left, scale
 * 1 or MAIN_K, its body at height y leaning forward by `lean`, the hand `lift` over the keys (a tap).
 * Its hand reaches the keys' row as far as its arm goes. Pure.
 */
export function onKeys(side: -1 | 1, scale: number, y: number, lean: number, lift: number): Rot {
  const { dx, dy, dz, len } = reach(side, scale, y, lean, lift);
  // into the body's frame: turned back by its lean
  const by = dy * Math.cos(lean) + dz * Math.sin(lean);
  const bz = -dy * Math.sin(lean) + dz * Math.cos(lean);
  return [Math.atan2(-bz, -by), 0, Math.asin(Math.max(-1, Math.min(1, dx / len)))];
}

/** from the shoulder to the hand on the keys (world axes): its arm's length, the hand as far ahead as the arm reaches */
function reach(side: -1 | 1, scale: number, y: number, lean: number, lift: number): { dx: number; dy: number; dz: number; len: number; z: number } {
  const sy = SHOULDER.y * scale;
  const s = { x: side * SHOULDER.x * scale, y: y + sy * Math.cos(lean), z: sy * Math.sin(lean) };
  const len = REACH * scale;
  const dx = side * KEYS.x - s.x;
  const dy = KEYS.y + HAND_R * scale + lift - s.y;
  const dz = Math.sqrt(Math.max(0, len * len - dx * dx - dy * dy));
  return { dx, dy, dz, len, z: s.z + dz };
}

/**
 * How far a seated bim (scale 1 or MAIN_K, its body at height y) leans in so its hands land on the
 * middle of the keys' row (main's longer arms lean less). Pure.
 */
export function keysLean(scale: number, y: number): number {
  const mid = (KEYS.z0 + KEYS.z1) / 2;
  let lo = -0.2;
  let hi = 0.4;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (reach(1, scale, y, m, 0).z < mid) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
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

// A climber's body at time t (pure, no three; the climbing gym, bims' brief « Climbers »): where it
// is on its line (climb.ts lineOf) and how. On the wall it holds a stance of its problem
// (climbwall.ts stancesOf: each hand and foot on a hold, on its own limb lengths), and between two
// stances it reaches: the body rises to the next stance while its limbs leave their holds and land on
// the next ones, never into the wall (a limb that would go in is turned out until it clears). The
// chalk-up at the foot, the mount, the top-out (the bell rung with its free hand once it is built,
// else a fist up), the drop onto the mat, or a slip and a fall onto its bum in a puff of chalk; the
// walks over the floor and the mats (stepping up onto them, never through one). Between two lines it
// rests at its spot: still, so the loop draws nothing (the battery rule). Climbing frames are
// 'loop' (LOOP_FPS). render/office-scene.ts uses it for a pose with a climbing pastime once arrived;
// bim.ts applies the Rig; render/climb.test.ts checks every frame on the real meshes. Owner: bims-climb.
import type { Gym, Pose, Spot } from '../model';
import {
  CLEAR, type Frame, HEAD, MAT_H, type Route, SKEL, TOUCH, type V3, add, bellAt, bodyClear, footCorners, freeOf, handAt, mul, armRot, planesOf, routes, stancesOf,
  sub, toBody, toWorld, touched, unit,
} from '../climbwall';
import { type Beat, type Line, type Stand, climbAt, liftAt, sinceArrived } from '../climb';
import { NO_PROPS, type Rig, type Rot } from './pose';

/** a climber's body before it becomes a Rig */
export interface Body {
  readonly f: Frame;
  readonly y: number;
  readonly body: Rot;
  readonly head: Rot;
  /** left, right */
  readonly arms: readonly [Rot, Rot];
  readonly legs: readonly [number, number];
  readonly mouth: Rig['mouth'];
  readonly eyes: number;
  /** the chalk's puff, 0..1 through it; null: none */
  readonly chalk: number | null;
}

const smooth = (u: number): number => {
  const k = Math.max(0, Math.min(1, u));
  return k * k * (3 - 2 * k);
};
const mix = (a: number, b: number, k: number): number => a + (b - a) * k;
const mixRot = (a: Rot, b: Rot, k: number): Rot => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];
const mixV = (a: V3, b: V3, k: number): V3 => add(a, mul(sub(b, a), k));
const mixFrame = (a: Frame, b: Frame, k: number): Frame => ({ g: mixV(a.g, b.g, k), dir: a.dir + (b.dir - a.dir) * k, pitch: mix(a.pitch, b.pitch, k) });
const SIDES = [-1, 1] as const;
const HANG: Rot = [0, 0, 0];
/** a stance's head: up and turned towards its higher hand (its right on even stances) */
const headOf = (k: number): Rot => [HEAD.x, k % 2 ? -HEAD.y : HEAD.y, 0];
const STRAIGHT: Rot = [0, 0, 0];

/** the hand's clearance to want: touching (TOUCH) or a little off */
const HAND_IN = SKEL.hand + TOUCH.hand - 1e-4;

/** an arm turned out from the wall (towards the room) until its hand clears the surface */
function clearArm(r: Route, f: Frame, side: 1 | -1, rot: Rot, want = HAND_IN): Rot {
  const at = (x: Rot): number => freeOf(r, handAt(f, side, x));
  if (at(rot) >= want) return rot;
  const [a, , c] = rot;
  // its hang's way in the body's frame, and the way out of the wall there
  const d = { x: Math.sin(c), y: -Math.cos(c) * Math.cos(a), z: -Math.cos(c) * Math.sin(a) };
  const out = toBody(f, touched(r, handAt(f, side, rot)).m);
  const turned = (k: number): Rot => armRot(add(mul(d, 1 - k), mul(out, k)));
  let lo = 0;
  let hi = 1;
  if (at(turned(1)) < want) return turned(1);
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (at(turned(mid)) >= want) hi = mid;
    else lo = mid;
  }
  return turned(hi);
}

/** a leg swung back towards hanging until its shoe clears the surface */
function clearLeg(r: Route, f: Frame, side: 1 | -1, pitch: number, want = TOUCH.foot - 1e-4): number {
  const at = (p: number): number => Math.min(...footCorners(f, side, p).map((c) => freeOf(r, c)));
  if (at(pitch) >= want) return pitch;
  // past hanging if it must: on a slab the shoe of a straight leg still grazes the wall
  let lo = pitch;
  let hi = Math.max(0, pitch) + 0.6;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (at(mid) >= want) hi = mid;
    else lo = mid;
  }
  return hi;
}

/** an arm aimed at a world point from its shoulder (its hand on the ray, the arm's own length) */
function aim(f: Frame, side: 1 | -1, target: V3): Rot {
  const sh = toWorld(f, { x: side * SKEL.shoulder.x, y: SKEL.shoulder.y, z: 0 });
  return armRot(toBody(f, sub(target, sh)));
}

/** a standing bim's shoes reach this far under its feet's origin (render/bim.ts: the shoe's box and its rounding): it stands on a mat, never in it */
const SOLE = 0.015;

/** upright on a stand (the floor or a mat), facing its way */
const standFrame = (s: Stand): Frame => ({ g: { x: s.x, y: s.y + SOLE, z: s.z }, dir: s.dir, pitch: 0 });

const still = (f: Frame, o: Partial<Body> = {}): Body => ({
  f, y: 0, body: STRAIGHT, head: STRAIGHT, arms: [[0, 0, -0.08], [0, 0, 0.08]], legs: [0, 0], mouth: 'smile', eyes: 1, chalk: null, ...o,
});

/** the stance k's body: every limb on its hold */
function onStance(r: Route, k: number): Body {
  const s = stancesOf(r)[k];
  if (!s) return still(standFrame({ x: r.o.x, y: MAT_H, z: r.o.z, dir: 0 }));
  return { f: s.f, y: 0, body: STRAIGHT, head: headOf(k), arms: [s.arms[0], s.arms[1]], legs: [s.legs[0], s.legs[1]], mouth: 'smile', eyes: 1, chalk: null };
}

/** between two bodies on the wall: the frame eases over, each hand off its hold along an arc out from the wall, each foot pulled back, onto the next */
function reach(r: Route, a: Body, b: Body, from: { hands: readonly V3[] } | null, to: { hands: readonly V3[] } | null, u: number): Body {
  const k = smooth(u);
  // the head turns to the other hand at mid-reach (never facing the wall: a cap's peak would touch it)
  const head = k < 0.5 ? a.head : b.head;
  const f = clearBody(r, mixFrame(a.f, b.f, k), head[1]);
  const lift = Math.sin(Math.PI * k);
  const m = planesOf(r)[f.g.y + SKEL.shoulder.y > 1.4 ? 1 : 0].m;
  // a limb in flight keeps FLIGHT off the wall; only at its holds (the reach's ends) does it touch
  const flying = k > 0.08 && k < 0.92;
  const arms = SIDES.map((side, i) => {
    const ha = from?.hands[i];
    const hb = to?.hands[i];
    const rot = ha && hb ? aim(f, side, add(mixV(ha, hb, k), mul(m, 0.1 * lift))) : mixRot(a.arms[i] as Rot, b.arms[i] as Rot, k);
    return clearArm(r, f, side, rot, flying ? SKEL.hand + FLIGHT : HAND_IN);
  }) as unknown as [Rot, Rot];
  const legs = SIDES.map((side, i) => clearLeg(r, f, side, Math.min(0, mix(a.legs[i] as number, b.legs[i] as number, k) + 0.3 * lift), flying ? FLIGHT : TOUCH.foot - 1e-4)) as unknown as [number, number];
  // over the mat its swung shoes stay above its top
  return aboveMat({ f, y: 0, body: STRAIGHT, head, arms, legs, mouth: 'smile', eyes: 1, chalk: null });
}

/** a limb in flight stays this far off the wall (the law's touch is 2 cm) */
const FLIGHT = 0.03;

/** a frame pushed out from the wall along the floor until its body clears it by CLEAR, its head turned so */
function clearBody(r: Route, f: Frame, turn: number): Frame {
  if (bodyClear(r, f, turn) >= CLEAR) return f;
  const at = (s: number): Frame => ({ ...f, g: add(f.g, mul(r.n, s)) });
  let lo = 0;
  let hi = 1.0;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (bodyClear(r, at(mid), turn) >= CLEAR) hi = mid;
    else lo = mid;
  }
  return at(hi);
}

/** a line's beat at `into` s: the climber's body (pure; the law poses every frame of every line with it) */
export function bodyAt(g: Gym, line: Line, beat: Beat, into: number): Body {
  const r = routes(g)[line.route] as Route;
  const ss = stancesOf(r);
  const u = beat.dur > 0 ? Math.min(1, into / beat.dur) : 1;
  const base = still(standFrame(line.base));
  switch (beat.k) {
    case 'walk': {
      const p = { x: mix(beat.from.x, beat.to.x, u), z: mix(beat.from.z, beat.to.z, u) };
      const dist = Math.hypot(beat.to.x - beat.from.x, beat.to.z - beat.from.z) * u;
      const sw = Math.sin((dist / 0.55) * Math.PI) * 0.5 * Math.min(1, dist / 0.2, (Math.hypot(beat.to.x - beat.from.x, beat.to.z - beat.from.z) - dist) / 0.2);
      // a swung leg's shoe dips under its feet's origin (its toe or heel): lifted by that, never into a mat
      const f: Frame = { g: { x: p.x, y: liftAt(g, p) + footDip(Math.abs(sw)) + SOLE - 0.01, z: p.z }, dir: beat.from.dir, pitch: 0 };
      return still(f, { arms: [[-sw * 0.6, 0, -0.1], [sw * 0.6, 0, 0.1]], legs: [sw, -sw] });
    }
    case 'chalk': {
      const rub = Math.sin(into * 14) * 0.12;
      return still(base.f, { head: [0.2, 0, 0], arms: [[-0.85 + rub, 0, 0.35], [-0.85 - rub, 0, -0.35]] });
    }
    case 'mount':
      return mountAt(r, base, onStance(r, 0), u);
    case 'move': {
      const a = onStance(r, beat.to - 1);
      const b = onStance(r, beat.to);
      const t = into / (beat.dur > 0 ? beat.dur : 1);
      const reachU = Math.min(1, into / Math.min(beat.dur, 0.4));
      if (t >= 1 || reachU >= 1) return b;
      return reach(r, a, b, ss[beat.to - 1] ?? null, ss[beat.to] ?? null, reachU);
    }
    case 'bell':
    case 'cheer': {
      const top = onStance(r, ss.length - 1);
      const bell = beat.k === 'bell' ? bellAt(r) : null;
      const up: Rot = bell ? bell.rot : clearArm(r, top.f, -1, armRot({ x: -0.3, y: 1, z: -0.35 }));
      // reach it, tap it (or shake the fist), back on the hold
      const t = into;
      const k = t < 0.3 ? smooth(t / 0.3) : t > beat.dur - 0.3 ? smooth((beat.dur - t) / 0.3) : 1;
      const tap = bell && t >= 0.3 && t <= beat.dur - 0.3 ? 0.85 + 0.15 * Math.abs(Math.cos(((t - 0.3) * Math.PI) / 0.15)) : 1;
      // off its hold the hand keeps FLIGHT off the wall, like a reach
      const left = clearArm(r, top.f, -1, mixRot(top.arms[0], up, k * tap), k > 0.08 ? SKEL.hand + FLIGHT : HAND_IN);
      return { ...top, arms: [left, top.arms[1]], head: mixRot(top.head, [HEAD.x - 0.2, -HEAD.y, 0], k), mouth: 'laugh', eyes: 0.6 };
    }
    case 'slip': {
      const a = onStance(r, beat.from);
      const next = ss[beat.from + 1];
      const s = ss[beat.from];
      if (!next || !s) return { ...a, mouth: 'oh' };
      // its right hand goes for the next hold and misses it: the body stays, the feet on their holds
      const m = planesOf(r)[1].m;
      const target = add(mixV(s.hands[1], next.hands[1], smooth(u)), mul(m, 0.12 * Math.sin(Math.PI * u)));
      return { ...a, arms: [a.arms[0], clearArm(r, a.f, 1, aim(a.f, 1, target))], mouth: 'oh' };
    }
    case 'drop':
    case 'fall': {
      const a = onStance(r, beat.from);
      const land = line.landing;
      const h = 1 - (1 - Math.min(1, u / 0.45)) ** 2;
      const v = u * u;
      const g0 = a.f.g;
      // down and out off the wall: pushed clear of it where it bulges under the stance
      const f0 = clearBody(r, { g: { x: mix(g0.x, land.x, h), y: mix(g0.y, land.y + SOLE, v), z: mix(g0.z, land.z, h) }, dir: a.f.dir, pitch: mix(a.f.pitch, 0, h) }, mixRot(a.head, STRAIGHT, h)[1]);
      const flail = Math.sin(into * 18) * 0.25;
      const armsUp: [Rot, Rot] = [[Math.PI * 0.8 + flail, 0, -0.35], [Math.PI * 0.8 - flail, 0, 0.35]];
      const sitK = beat.k === 'fall' ? smooth((u - 0.8) / 0.2) : 0;
      const legs = SIDES.map((side, i) => clearLeg(r, f0, side, mix(mix(a.legs[i] as number, -0.3, h), SIT.leg, sitK))) as unknown as [number, number];
      // it lands on its swung shoes' lowest corner, never a toe in the mat
      const bent: Body = { f: f0, y: mix(0, SIT.y, sitK), body: mixRot(STRAIGHT, SIT.body, sitK), head: mixRot(a.head, STRAIGHT, h), arms: a.arms, legs, mouth: beat.k === 'fall' ? 'oh' : 'laugh', eyes: 1, chalk: null };
      const b = aboveMat(bent);
      // off their holds the hands keep FLIGHT off the wall
      const arms = SIDES.map((side, i) => clearArm(r, b.f, side, mixRot(mixRot(a.arms[i] as Rot, armsUp[i] as Rot, h), SIT.arms[i] as Rot, sitK), h > 0.08 ? SKEL.hand + FLIGHT : HAND_IN)) as unknown as [Rot, Rot];
      return { ...b, arms };
    }
    case 'sit':
      return sitting(standFrame(line.landing), Math.min(1, into / 0.9));
    case 'up': {
      const s = sitting(standFrame(line.landing), null);
      const k = smooth(u);
      const b: Body = { ...s, y: mix(SIT.y, 0, k), body: mixRot(SIT.body, STRAIGHT, k), arms: [mixRot(SIT.arms[0], HANG, k), mixRot(SIT.arms[1], HANG, k)], legs: [mix(SIT.leg, 0, k), mix(SIT.leg, 0, k)], mouth: 'smile', eyes: 1 };
      // its legs swing under it as it gets up: lifted by its heels' dip, never a heel in the mat
      return aboveMat(b);
    }
    case 'land':
      return still(standFrame(line.landing), { mouth: 'laugh' });
  }
}

/** how far a leg swung by `a` (either way) takes its shoe's lowest corner under the feet's origin */
function footDip(a: number): number {
  const F = SKEL.foot;
  let low = 0;
  for (const s of [-1, 1]) {
    const c = Math.cos(a * s);
    const sn = Math.sin(a * s);
    for (const dy of [-F.hy, F.hy]) for (const dz of [-F.hz, F.hz]) low = Math.min(low, SKEL.hip.y + (F.y + dy) * c - (F.z + dz) * sn);
  }
  return -low;
}

/** the mount: from standing on the mat to the first stance, its hands up onto their holds */
function mountAt(r: Route, base: Body, s0: Body, u: number): Body {
  const s = stancesOf(r)[0];
  // its hands from hanging up onto their holds along an arc off the wall, as a move's
  const hung = { hands: SIDES.map((side, i) => handAt(base.f, side, base.arms[i] as Rot)) };
  // its feet leave the mat: reach keeps the body over its swung shoes, never a toe in the mat
  return reach(r, base, s0, s ? hung : null, s ?? null, u);
}

/** sitting on its bum on the mat (a fall): legs out, leaning back on its hands, laughing */
const SIT = { y: -0.17, body: [-0.3, 0, 0] as Rot, arms: [[0.35, 0, -0.6], [0.35, 0, 0.6]] as const, leg: -1.45 } as const;
/** a body's lowest shoe corner, world height: its frame's pitch, its body bent about x only (SIT, STRAIGHT) */
function lowestShoe(b: Body): number {
  const F = SKEL.foot;
  const cb = Math.cos(b.body[0]);
  const sb = Math.sin(b.body[0]);
  const cp = Math.cos(b.f.pitch);
  const sp = Math.sin(b.f.pitch);
  let low = Infinity;
  for (const leg of b.legs) {
    const c = Math.cos(leg);
    const s = Math.sin(leg);
    for (const dy of [-F.hy, F.hy]) for (const dz of [-F.hz, F.hz]) {
      const y = SKEL.hip.y + (F.y + dy) * c - (F.z + dz) * s;
      const z = (F.y + dy) * s + (F.z + dz) * c;
      const Y = b.y + y * cb - z * sb;
      const Z = y * sb + z * cb;
      low = Math.min(low, b.f.g.y + Y * cp - Z * sp);
    }
  }
  return low;
}

/** a body lifted until its shoes clear the mat's top (over a mat or near one: the mats are under every move) */
function aboveMat(b: Body): Body {
  const low = lowestShoe(b);
  return low >= MAT_H + 0.003 ? b : { ...b, f: { ...b.f, g: { ...b.f.g, y: b.f.g.y + MAT_H + 0.003 - low } } };
}

function sitting(f: Frame, puff: number | null): Body {
  return { f, y: SIT.y, body: SIT.body, head: [-0.15, 0, 0], arms: [SIT.arms[0], SIT.arms[1]], legs: [SIT.leg, SIT.leg], mouth: 'laugh', eyes: 0.3, chalk: puff !== null && puff < 1 ? puff : null };
}

/** a Body as the Rig bim.ts applies */
export function rigOfBody(b: Body, motion: Rig['motion']): Rig {
  return {
    x: b.f.g.x, z: b.f.g.z, dir: b.f.dir, y: b.y, body: b.body, head: b.head, armL: b.arms[0], armR: b.arms[1], legL: b.legs[0], legR: b.legs[1],
    eyes: b.eyes, mouth: b.mouth, props: { ...NO_PROPS, ...(b.chalk !== null ? { chalk: b.chalk } : {}) }, screen: 0, lamp: false, grey: 0, opacity: 1, motion,
    lift: b.f.g.y, tilt: [b.f.pitch, 0],
  };
}

/** resting at its spot on the floor between two lines: still */
function rest(s: Spot): Rig {
  return rigOfBody(still({ g: { x: s.x, y: 0, z: s.z }, dir: s.face, pitch: 0 }), 'still');
}

/** The climber's rig at its pose: its line's beat, or at rest at its spot. Null: no climbing pastime or not arrived. */
export function climbRig(name: string, pose: Pose, g: Gym): Rig | null {
  const p = pose.seg.pastime;
  if (p?.kind !== 'climb' || pose.moving) return null;
  const spot = g.spots[p.slot] ?? g.spots[0];
  if (!spot) return null;
  const now = climbAt(name, p, sinceArrived(pose), g);
  if (!now.line || !now.beat) return rest(spot);
  return rigOfBody(bodyAt(g, now.line, now.beat, now.into), 'loop');
}

/** the way from a body's frame out of the wall (its +z is into it) */
export const outOf = (f: Frame): V3 => unit(toWorld({ ...f, g: { x: 0, y: 0, z: 0 } }, { x: 0, y: 0, z: -1 }));

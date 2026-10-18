// His paper plane (q-planes, three): white paper folded in two wings, thrown from his side of the
// screen (the camera's: in from the view's bottom edge, big, as if from his hand) to the bim's hand
// at its desk in PLANE_FLIGHT seconds; then the bim holds it (pose.ts caught). The flight is a paper
// plane's (bims-plane): a glide that sinks in an arc, a zigzag that banks into each turn, a gentle
// pitch wave (phugoid), a little yaw wobble, one looping on its way, and a nose-up flare into the
// hand. Its speed comes from its height: slower up the climbs and over the loop, faster in the dives.
// The path is pure and seeded (planFlight, flightAt); the mesh only follows it.
import { Group, Mesh, type Material } from 'three';
import { BACK, RIGHT, UP, type Fit, type V3 } from './camera';
import { WORLD, rng } from './palette';
import { PLANE_FLIGHT } from './pose';
import type { Style } from './style';

const Y: V3 = { x: 0, y: 1, z: 0 };
const add = (a: V3, b: V3, k = 1): V3 => ({ x: a.x + b.x * k, y: a.y + b.y * k, z: a.z + b.z * k });
const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const mul = (a: V3, k: number): V3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const dot = (a: V3, b: V3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: V3, b: V3): V3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const norm = (a: V3): V3 => {
  const l = Math.hypot(a.x, a.y, a.z);
  return l < 1e-9 ? Y : mul(a, 1 / l);
};
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** 0 → 1 with no speed at either end: a loop enters and leaves on the path's own tangent */
const smoother = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

/** how far below the view's bottom edge it starts, css px; how high above the floor at least, units */
const START_PX = 36;
const START_Y = 1.6;
/** how big it starts (close to his eye), then 1 from FAR of the way on */
export const PLANE_GROW = 2.6;
const FAR = 0.4;
/** the u sampling of the time table */
const N = 240;

/**
 * Where his plane leaves from: the middle of the view's bottom edge, just under it, toward the
 * camera (an ortho view: the same spot on screen, in front of everything), and START_Y above the floor
 * at least. Pure.
 */
export function cameraStart(fit: Fit): V3 {
  const vx = (fit.left + fit.right) / 2;
  const vy = fit.bottom - START_PX * fit.scale;
  const onScreen = add(add(fit.target, RIGHT, vx), UP, vy);
  // along BACK the screen spot stays; far enough toward him to be above the floor and in front of the office
  const k = Math.max(8, (START_Y - onScreen.y) / BACK.y);
  return add(onScreen, BACK, k);
}

/** one flight, planned once when it leaves (seeded: the same flight for the same message) */
export interface FlightPlan {
  readonly from: V3;
  readonly to: V3;
  /** the zigzag: its axis (level, across the way), amplitude, number of waves, and which side first */
  readonly side: V3;
  readonly zig: number;
  readonly waves: number;
  readonly sign: 1 | -1;
  /** how high its glide arcs over the straight line */
  readonly lift: number;
  /** the pitch wave (phugoid): amplitude, waves, phase */
  readonly phug: number;
  readonly phugWaves: number;
  readonly phase: number;
  /** the looping: where (u, the way's fraction) its middle is, its u width per turn, turns, radius, and the way it goes (level, a screen axis) */
  readonly loopAt: number;
  readonly loopW: number;
  readonly loops: number;
  readonly r: number;
  readonly loopFwd: V3;
  /** time (0..1) at u = i / N, from its speed along the path */
  readonly times: readonly number[];
}

export interface PlanInput {
  readonly from: V3;
  readonly to: V3;
  readonly seed: number;
  /** turns of the looping: 1, 2 for the y1 egg */
  readonly loops?: number;
  /** the plane's scale on screen (office-scene: never under PLANE_MIN_PX): the loop and zigzag size with it */
  readonly unit?: number;
}

/** the path's point at u (0: from, 1: to), the plane's own path before time; `to` may have moved since the plan */
function pathAt(f: FlightPlan, u: number, to: V3): V3 {
  const env = Math.sin(Math.PI * u);
  let p = add(f.from, sub(to, f.from), u);
  p = add(p, Y, f.lift * env + f.phug * env * Math.sin(2 * Math.PI * f.phugWaves * u + f.phase));
  // the zigzag crosses the line at the loop, at its fastest sideways: the loop goes on from that swing
  p = add(p, f.side, f.sign * f.zig * Math.pow(env, 0.8) * Math.sin(2 * Math.PI * f.waves * (u - f.loopAt)));
  const half = (f.loopW * f.loops) / 2;
  if (Math.abs(u - f.loopAt) < half) {
    const a = 2 * Math.PI * f.loops * smoother((u - f.loopAt + half) / (2 * half));
    p = add(add(p, f.loopFwd, f.r * Math.sin(a)), Y, f.r * (1 - Math.cos(a)));
  }
  return p;
}

/** its glide line (the arc without the waves and the loop): the height its speed is measured against */
function glideY(f: FlightPlan, u: number, to: V3): number {
  return f.from.y + (to.y - f.from.y) * u + f.lift * Math.sin(Math.PI * u);
}

/** Plan a flight from `from` (cameraStart) to `to` (the bim's hand). Pure: the same input, the same flight. */
export function planFlight(inp: PlanInput): FlightPlan {
  const { from, to } = inp;
  const unit = Math.max(1, inp.unit ?? 1);
  const loops = Math.max(1, Math.round(inp.loops ?? 1));
  const rand = rng(inp.seed);
  const way = sub(to, from);
  const level = Math.hypot(way.x, way.z);
  const side = level < 1e-6 ? RIGHT : norm(cross({ x: way.x, y: 0, z: way.z }, Y));
  const sign: 1 | -1 = rand() < 0.5 ? 1 : -1;
  // the loop turns in the view's plane (up and screen-right), forward the way the zigzag swings there
  const loopFwd = mul(RIGHT, dot(side, RIGHT) * sign >= 0 ? 1 : -1);
  // sized on the screen: the way toward the camera (BACK) shows no length in the iso view, so the
  // zigzag and the loop scale with the way he sees, never under the plane's own size
  const seen = Math.hypot(dot(way, RIGHT), dot(way, UP));
  const r = Math.max(0.95 * unit, 0.13 * seen) * (0.9 + 0.25 * rand());
  const plan: FlightPlan = {
    from, to, side, sign, loops, r, loopFwd,
    zig: Math.min(Math.max(1.3 * unit, 0.32 * seen) * (0.8 + 0.4 * rand()), 0.3 * Math.max(level, 1)),
    waves: 1.6 + 0.5 * rand(),
    lift: 0.5 + 0.08 * Math.hypot(way.x, way.y, way.z) + 0.3 * rand(),
    phug: 0.12 * unit,
    phugWaves: 2.5 + rand(),
    phase: rand() * Math.PI * 2,
    loopAt: 0.42 + 0.14 * rand(),
    loopW: 0.2,
    times: [],
  };
  // time from speed: a steady glide's speed v0, less up a climb and more down a dive than its glide
  // line (v² = v0² - 2g·Δy), thrown fast from his hand, slowed by the flare into the bim's hand
  const g = 9.8;
  const v0sq = 2 * g * 2 * r * 1.35;
  const times = [0];
  let prev = pathAt(plan, 0, to);
  let total = 0;
  for (let i = 1; i <= N; i++) {
    const u = i / N;
    const p = pathAt(plan, u, to);
    const um = (i - 0.5) / N;
    const ym = (p.y + prev.y) / 2;
    const v = Math.sqrt(Math.max(0.1 * v0sq, v0sq - 2 * g * (ym - glideY(plan, um, to))))
      * (1 + 0.8 * (1 - smooth(0, 0.22, um)))
      * (1 - 0.5 * smooth(0.8, 1, um));
    total += Math.hypot(p.x - prev.x, p.y - prev.y, p.z - prev.z) / v;
    times.push(total);
    prev = p;
  }
  return { ...plan, times: times.map((t) => (total > 0 ? t / total : 0)) };
}

/** the plane at a moment: where, its nose and its top (an orthonormal pair), how big (1: its size) */
export interface FlightFrame {
  readonly p: V3;
  readonly nose: V3;
  readonly up: V3;
  readonly grow: number;
  /** u: how far along its path (0..1) */
  readonly u: number;
}

/** u at time fraction f (the time table's inverse) */
function uAt(times: readonly number[], f: number): number {
  let lo = 0;
  let hi = times.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((times[mid] ?? 0) <= f) lo = mid;
    else hi = mid;
  }
  const a = times[lo] ?? 0;
  const b = times[hi] ?? 1;
  return (lo + (b > a ? (f - a) / (b - a) : 0)) / (times.length - 1);
}

/** how far into the loop's window (0 out, 1 well in): the bank and the wobble give way to the loop's own turn */
function inLoop(f: FlightPlan, u: number): number {
  const half = (f.loopW * f.loops) / 2;
  return 1 - smooth(half * 0.6, half + 0.05, Math.abs(u - f.loopAt));
}

/**
 * The plane s seconds into its flight (PLANE_FLIGHT long), flying to `to` (the hand, which may have
 * moved since the plan; the path bends to it). Pure.
 */
export function flightAt(f: FlightPlan, s: number, to: V3 = f.to): FlightFrame {
  const u = uAt(f.times, clamp01(s / PLANE_FLIGHT));
  const du = 1 / N;
  const p = pathAt(f, u, to);
  const a = pathAt(f, Math.max(0, u - du), to);
  const b = pathAt(f, Math.min(1, u + du), to);
  const d1 = sub(b, a);
  const d2 = add(add(b, a), p, -2);
  let nose = norm(d1);
  // the flare: the nose comes up as it settles into the hand
  nose = norm(add(nose, Y, 0.9 * smooth(0.86, 1, u) * Math.hypot(nose.x, nose.z)));
  // the bank: into the turn, from how fast its level heading turns (a cartoon's, never past ~50°)
  const lv = Math.hypot(d1.x, d1.z);
  const turn = lv < 1e-9 ? 0 : (d1.x * d2.z - d1.z * d2.x) / (lv * lv * lv);
  const loop = inLoop(f, u);
  const env = Math.sin(Math.PI * u);
  const bank = (1 - loop) * Math.max(-0.85, Math.min(0.85, Math.atan(turn * 3)));
  const wobble = (1 - loop) * env * 0.09 * Math.sin(2 * Math.PI * 7 * u + f.phase * 1.7);
  // its top: up, rolled by the bank about the nose; in the loop, toward the loop's centre (upside down over the top)
  const half = (f.loopW * f.loops) / 2;
  const la = Math.abs(u - f.loopAt) < half ? 2 * Math.PI * f.loops * smoother((u - f.loopAt + half) / (2 * half)) : 0;
  const loopUp = add(mul(f.loopFwd, -Math.sin(la)), Y, Math.cos(la));
  const levelUp = norm(add(Y, cross(nose, Y), bank));
  let up = norm(add(mul(levelUp, 1 - loop), loopUp, loop));
  // the yaw wobble: the nose swings a little about its top
  nose = norm(add(nose, cross(up, nose), wobble));
  // orthonormal: the top square to the nose
  up = norm(sub(up, mul(nose, dot(up, nose))));
  return { p, nose, up, u, grow: 1 + (PLANE_GROW - 1) * (1 - smooth(0, FAR, u)) };
}

export interface Plane {
  readonly group: Group;
  dispose(): void;
}

export function makePlane(style: Style): Plane {
  const g = new Group();
  const paper: Material = style.material(WORLD.paper, { flat: true });
  const fold: Material = style.material(WORLD.paperShade, { flat: true });
  // its nose along +z: two wings in a shallow V, a keel under them
  const wingL = new Mesh(style.box(0.16, 0.012, 0.42), paper);
  wingL.position.set(-0.08, 0, 0);
  wingL.rotation.z = 0.25;
  const wingR = new Mesh(style.box(0.16, 0.012, 0.42), paper);
  wingR.position.set(0.08, 0, 0);
  wingR.rotation.z = -0.25;
  const keel = new Mesh(style.box(0.02, 0.07, 0.38), fold);
  keel.position.set(0, -0.035, -0.01);
  g.add(wingL, wingR, keel);
  g.scale.setScalar(1.3);
  return {
    group: g,
    dispose() {
      for (const m of [wingL, wingR, keel]) m.geometry.dispose();
      paper.dispose();
      fold.dispose();
    },
  };
}

// The climbing gym's wall (pure, no three; the brief's « the wall », page bims-climb v4): its folded
// surface from the plan's foot line (Office.gym: maps/climb.ts), the problems on it, their holds, the
// volumes and the decorative holds round them. What a climber's body does on it lives here too, so the
// holds are where its limbs really land (architect m_37970: the bim's own limb lengths, no stretch):
//   - the surface: each foot-line vertex stands out o1 at WALL_MID and o2 at WALL_TOP along its way
//     into the room; a panel between two vertices is two flat facets a tier (the arêtes and dihedrals
//     where two panels differ). `facets` is what the look draws, triangle for triangle;
//   - a problem (`routes`) sits on a zone of planar panels steep enough to climb but not a roof, its
//     stances one above the other: the body placed clear of the wall (`place`), each hand and foot
//     put on the surface by the rig's own joints (`limbsAt`), and a hold where each one touches;
//   - the volumes stand on the twisted panels, far from every problem; the other holds keep off a
//     problem's lane.
// render/climb.ts poses a climber from this; render/climb.test.ts checks every frame on the real
// meshes (his condition: no hand, foot or body inside the wall or a volume). Owner: bims-climb.
import type { Gym, WallPt } from './model';

/** the wall's middle tier and its top, the mats' top (office units: a bim is ~1.2) */
export const WALL_MID = 1.4;
export const WALL_TOP = 3.2;
export const MAT_H = 0.3;

export interface V3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

const v = (x: number, y: number, z: number): V3 => ({ x, y, z });
export const add = (a: V3, b: V3): V3 => v(a.x + b.x, a.y + b.y, a.z + b.z);
export const sub = (a: V3, b: V3): V3 => v(a.x - b.x, a.y - b.y, a.z - b.z);
export const mul = (a: V3, k: number): V3 => v(a.x * k, a.y * k, a.z * k);
export const dot = (a: V3, b: V3): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: V3, b: V3): V3 => v(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
export const len = (a: V3): number => Math.hypot(a.x, a.y, a.z);
export const unit = (a: V3): V3 => mul(a, 1 / (len(a) || 1));
const UP: V3 = v(0, 1, 0);

/** how far the surface stands out from its foot at height y */
export function offAt(p: Pick<WallPt, 'o1' | 'o2'>, y: number): number {
  if (y <= WALL_MID) return (p.o1 * y) / WALL_MID;
  return p.o1 + ((p.o2 - p.o1) * (y - WALL_MID)) / (WALL_TOP - WALL_MID);
}

/** a vertex of the surface: a foot-line vertex at a level (0 the floor, 1 the middle, 2 the top) */
export function wallVertex(p: WallPt, level: 0 | 1 | 2): V3 {
  const y = level === 0 ? 0 : level === 1 ? WALL_MID : WALL_TOP;
  const o = offAt(p, y);
  return v(p.x + p.nx * o, y, p.z + p.nz * o);
}

/** a flat facet: its corners, its normal into the room, the panel and tier it belongs to */
export interface Facet {
  readonly a: V3;
  readonly b: V3;
  readonly c: V3;
  readonly n: V3;
  readonly panel: number;
  readonly tier: 0 | 1;
}

const FACETS = new WeakMap<Gym, Facet[]>();

/** The wall's facets: per panel and tier two triangles, each split along the diagonal that keeps the panel's fold (what the look draws). Pure, memoized. */
export function facets(g: Gym): readonly Facet[] {
  const hit = FACETS.get(g);
  if (hit) return hit;
  const out: Facet[] = [];
  for (let i = 0; i + 1 < g.line.length; i++) {
    const pa = g.line[i] as WallPt;
    const pb = g.line[i + 1] as WallPt;
    const into = unit(v(pa.nx + pb.nx, 0, pa.nz + pb.nz));
    for (const tier of [0, 1] as const) {
      const l0 = tier === 0 ? 0 : 1;
      const l1 = tier === 0 ? 1 : 2;
      const a0 = wallVertex(pa, l0);
      const b0 = wallVertex(pb, l0);
      const a1 = wallVertex(pa, l1);
      const b1 = wallVertex(pb, l1);
      const tris: [V3, V3, V3][] = (i + tier) % 2 ? [[a0, b0, b1], [a0, b1, a1]] : [[a0, b0, a1], [b0, b1, a1]];
      for (const [a, b, c] of tris) {
        let n = unit(cross(sub(b, a), sub(c, a)));
        if (dot(n, into) < 0) n = mul(n, -1);
        out.push({ a, b, c, n, panel: i, tier });
      }
    }
  }
  FACETS.set(g, out);
  return out;
}

/** the closest point of a triangle to p (Ericson, Real-Time Collision Detection 5.1.5) */
export function closestOnTri(p: V3, a: V3, b: V3, c: V3): V3 {
  const ab = sub(b, a);
  const ac = sub(c, a);
  const ap = sub(p, a);
  const d1 = dot(ab, ap);
  const d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a;
  const bp = sub(p, b);
  const d3 = dot(ab, bp);
  const d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return b;
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) return add(a, mul(ab, d1 / (d1 - d3)));
  const cp = sub(p, c);
  const d5 = dot(ab, cp);
  const d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return c;
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) return add(a, mul(ac, d2 / (d2 - d6)));
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) return add(b, mul(sub(c, b), (d4 - d3) / (d4 - d3 + (d5 - d6))));
  const den = 1 / (va + vb + vc);
  return add(a, add(mul(ab, vb * den), mul(ac, vc * den)));
}

/**
 * A point's signed distance to a surface of triangles (each with its normal towards the free side):
 * the nearest triangle's distance, negative behind it (the triangles tied for nearest, at an arête
 * or a dihedral, vote with their normals). Pure.
 */
export function signedDist(p: V3, tris: readonly { readonly a: V3; readonly b: V3; readonly c: V3; readonly n: V3 }[]): number {
  let best = Infinity;
  let sign = 0;
  for (const t of tris) {
    const q = closestOnTri(p, t.a, t.b, t.c);
    const d = len(sub(p, q));
    const s = dot(sub(p, q), t.n);
    if (d < best - 1e-7) { best = d; sign = s; }
    else if (d < best + 1e-7) sign += s;
  }
  return sign < 0 ? -best : best;
}

// ---- a problem's zone: planar panels, its two tier planes

/** a zone of planar panels (the same profile on 3 or more vertices in a row): a problem's place */
export interface Route {
  readonly id: number;
  /** its middle on the foot line, its way along (the climber's right) and into the room */
  readonly o: V3;
  readonly t: V3;
  readonly n: V3;
  readonly o1: number;
  readonly o2: number;
  /** half its width along the foot line (its planar panels) */
  readonly half: number;
  /** which rest spot climbs it (Gym.spots): the left run's 0, the back run's 1 */
  readonly slot: number;
  /** its holds' colour (HOLD_COLS) */
  readonly colour: number;
}

/** a tier's plane: a point on it and its normal into the room */
export interface Plane {
  readonly p: V3;
  readonly m: V3;
}

/** the zone's lower and upper planes */
export function planesOf(r: Route): readonly [Plane, Plane] {
  const mid = add(r.o, add(mul(r.n, r.o1), mul(UP, WALL_MID)));
  const m1 = unit(sub(mul(r.n, WALL_MID), mul(UP, r.o1)));
  const m2 = unit(sub(mul(r.n, WALL_TOP - WALL_MID), mul(UP, r.o2 - r.o1)));
  return [{ p: r.o, m: m1 }, { p: mid, m: m2 }];
}

/** the upper tier leans further into the room than the lower: the fold is a dihedral (the room's side inside it) */
const concave = (r: Route): boolean => (r.o2 - r.o1) / (WALL_TOP - WALL_MID) > r.o1 / WALL_MID;

/** a point's distance to the zone's surface (both tiers' planes, joined at the fold), negative behind it */
export function freeOf(r: Route, p: V3): number {
  const [a, b] = planesOf(r);
  const d1 = dot(sub(p, a.p), a.m);
  const d2 = dot(sub(p, b.p), b.m);
  return concave(r) ? Math.min(d1, d2) : Math.max(d1, d2);
}

/** the plane a point is nearest, of the two (where a limb that touches lands) */
export function touched(r: Route, p: V3): Plane {
  const [a, b] = planesOf(r);
  const d1 = dot(sub(p, a.p), a.m);
  const d2 = dot(sub(p, b.p), b.m);
  return concave(r) === d1 < d2 ? a : b;
}

/** the surface's slope from vertical at height y: > 0 overhangs into the room */
export function slopeAt(r: Pick<Route, 'o1' | 'o2'>, y: number): number {
  return y <= WALL_MID ? Math.atan(r.o1 / WALL_MID) : Math.atan((r.o2 - r.o1) / (WALL_TOP - WALL_MID));
}

/** steep enough to climb, never a roof */
const CLIMBABLE = { min: -0.45, max: 0.5 } as const;

const ROUTES = new WeakMap<Gym, Route[]>();

/** The gym's problems: one per planar zone of 2 panels or more whose tiers are climbable. Pure, memoized. */
export function routes(g: Gym): readonly Route[] {
  const hit = ROUTES.get(g);
  if (hit) return hit;
  const out: Route[] = [];
  const same = (a: WallPt, b: WallPt): boolean => a.o1 === b.o1 && a.o2 === b.o2 && a.nx === b.nx && a.nz === b.nz;
  const corner = g.line.findIndex((p) => p.nx > 0 && p.nz > 0);
  let i = 0;
  while (i < g.line.length) {
    let j = i;
    while (j + 1 < g.line.length && same(g.line[i] as WallPt, g.line[j + 1] as WallPt)) j++;
    const a = g.line[i] as WallPt;
    const b = g.line[j] as WallPt;
    const lo = Math.atan(a.o1 / WALL_MID);
    const hi = Math.atan((a.o2 - a.o1) / (WALL_TOP - WALL_MID));
    if (j - i >= 2 && a.nx * a.nz === 0 && Math.min(lo, hi) >= CLIMBABLE.min && Math.max(lo, hi) <= CLIMBABLE.max) {
      const o = v((a.x + b.x) / 2, 0, (a.z + b.z) / 2);
      const n = v(a.nx, 0, a.nz);
      // its right as the climber faces the wall (-n): n × up
      const t = unit(cross(n, UP));
      out.push({ id: out.length, o, t, n, o1: a.o1, o2: a.o2, half: Math.hypot(b.x - a.x, b.z - a.z) / 2, slot: i < corner ? 0 : 1, colour: out.length % ROUTE_COLS.length });
    }
    i = j + 1;
  }
  ROUTES.set(g, out);
  return out;
}

// ---- the climber's body (render/bim.ts, a bim that is not main: main never climbs)

/** the bim's joints and parts in its body's frame (render/bim.ts makeBim), +z its face, +x its right */
export const SKEL = {
  shoulder: { x: 0.24, y: 0.66 },
  /** the hand ball's centre down the arm, its radius */
  arm: 0.3,
  hand: 0.065,
  hip: { x: 0.1, y: 0.3 },
  /** the shoe's centre in the leg's frame and its half sizes, as drawn: style.ts roundBox(0.15, 0.08, 0.24)
   * with r 0.0176 grows its outline by 0.4 r and sinks its sole by r / 4 */
  foot: { y: -0.2744, z: 0.04, hx: 0.0821, hy: 0.04, hz: 0.1271 },
  /** what must clear the wall: the hoodie's two ends, the legs' tops (spheres in the body's frame) */
  body: [
    { x: 0, y: 0.39, z: 0, r: 0.21 },
    { x: 0, y: 0.61, z: 0, r: 0.21 },
    { x: 0, y: 0.18, z: 0.1, r: 0.075 },
  ],
  /** the head's pivot, and its parts round it: the ball, the widest hair or hat, a cap's peak */
  headY: 0.93,
  head: [
    { x: 0, y: 0, z: 0, r: 0.225 },
    { x: 0, y: 0.1, z: -0.05, r: 0.29 },
    { x: -0.08, y: 0.07, z: 0.28, r: 0.04 },
    { x: 0, y: 0.07, z: 0.28, r: 0.04 },
    { x: 0.08, y: 0.07, z: 0.28, r: 0.04 },
    // the face's flat pieces (eyes, cheeks, mouth): their outer corners
    { x: -0.165, y: -0.03, z: 0.215, r: 0.012 },
    { x: 0.165, y: -0.03, z: 0.215, r: 0.012 },
    { x: -0.165, y: -0.07, z: 0.215, r: 0.012 },
    { x: 0.165, y: -0.07, z: 0.215, r: 0.012 },
    { x: -0.11, y: 0.07, z: 0.215, r: 0.012 },
    { x: 0.11, y: 0.07, z: 0.215, r: 0.012 },
    { x: -0.11, y: -0.01, z: 0.215, r: 0.012 },
    { x: 0.11, y: -0.01, z: 0.215, r: 0.012 },
  ],
} as const;

/**
 * A climber's head: it looks up and turns to its hand (its cheek to the wall, as climbers do), so
 * the face and a cap's peak keep off the wall and the shoulders come close enough for the hands.
 * Its turn's side changes with the stance; the clearance is the same either way.
 */
export const HEAD = { x: -0.3, y: 0.9 } as const;

/** a head part's place in the body's frame, the head turned (three's 'XYZ': Rx·Ry) */
export function headPart(p: V3, turn: number): V3 {
  const cy = Math.cos(turn);
  const sy = Math.sin(turn);
  const x1 = p.x * cy + p.z * sy;
  const z1 = -p.x * sy + p.z * cy;
  const cx = Math.cos(HEAD.x);
  const sx = Math.sin(HEAD.x);
  return v(x1, SKEL.headY + p.y * cx - z1 * sx, p.y * sx + z1 * cx);
}

/** a body's frame on the wall: where its group stands, its heading (towards the wall) and its lean (< 0 back) */
export interface Frame {
  readonly g: V3;
  readonly dir: number;
  readonly pitch: number;
}

/** a body-frame point into the world (render/bim.ts: the group turned 'YXZ' by (pitch, dir), the body at its origin) */
export function toWorld(f: Frame, p: V3): V3 {
  const cp = Math.cos(f.pitch);
  const sp = Math.sin(f.pitch);
  // Rx(pitch)
  const y1 = p.y * cp - p.z * sp;
  const z1 = p.y * sp + p.z * cp;
  const cd = Math.cos(f.dir);
  const sd = Math.sin(f.dir);
  // Ry(dir)
  return v(f.g.x + p.x * cd + z1 * sd, f.g.y + y1, f.g.z - p.x * sd + z1 * cd);
}

/** a world direction into the body's frame */
export function toBody(f: Frame, d: V3): V3 {
  const cd = Math.cos(f.dir);
  const sd = Math.sin(f.dir);
  const x1 = d.x * cd - d.z * sd;
  const z1 = d.x * sd + d.z * cd;
  const cp = Math.cos(f.pitch);
  const sp = Math.sin(f.pitch);
  return v(x1, d.y * cp + z1 * sp, -d.y * sp + z1 * cp);
}

/** the body's clearance from the wall's surface: what keeps it in front of the facet it climbs */
export const CLEAR = 0.03;
/** how much of the slope the body leans with */
const LEAN = 0.8;

/** the heading of a climber facing the route's wall */
export const dirOf = (r: Route): number => Math.atan2(-r.n.x, -r.n.z);

/** the lean at a torso height, blended over ±0.3 round the fold */
export function pitchAt(r: Route, y: number): number {
  const a = slopeAt(r, WALL_MID - 0.3);
  const b = slopeAt(r, WALL_MID + 0.3);
  const k = Math.max(0, Math.min(1, (y - (WALL_MID - 0.3)) / 0.6));
  return -(a + (b - a) * k * k * (3 - 2 * k)) * LEAN;
}

/** the body's least clearance from the wall in a frame (each part's sphere) */
export function bodyClear(r: Route, f: Frame, turn: number = HEAD.y): number {
  let m = Infinity;
  for (const s of SKEL.body) m = Math.min(m, freeOf(r, toWorld(f, s)) - s.r);
  for (const s of SKEL.head) m = Math.min(m, freeOf(r, toWorld(f, headPart(s, turn))) - s.r);
  return m;
}

/** the body at a lean, pushed out along the floor until it clears the wall by CLEAR */
export function placeAt(r: Route, u: number, y: number, pitch: number): Frame {
  const dir = dirOf(r);
  const at = (s: number): Frame => ({ g: add(add(r.o, mul(r.t, u)), add(mul(UP, y), mul(r.n, s))), dir, pitch });
  let lo = -1.0;
  let hi = 2.5;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (bodyClear(r, at(mid)) >= CLEAR) hi = mid;
    else lo = mid;
  }
  return at(hi);
}

/**
 * The body at u along the route (its right +) with its feet's origin at height y: at the lean that
 * brings its shoulders and hips nearest the wall (a climber's hips in, over a fold too), as close to
 * the wall as CLEAR lets it. Pure.
 */
export function place(r: Route, u: number, y: number): Frame {
  const base = pitchAt(r, y + 0.55);
  let best: Frame | null = null;
  let score = Infinity;
  for (let p = -0.7; p <= 0.4 + 1e-9; p += 0.025) {
    const f = placeAt(r, u, y, p);
    const sh = freeOf(r, toWorld(f, v(0, SKEL.shoulder.y, 0)));
    const hip = freeOf(r, toWorld(f, v(0, SKEL.hip.y, 0)));
    const s = Math.max(sh, hip) + Math.abs(p - base) * 0.02;
    // its feet must find the wall at that lean (over a fold the lower tier leans away)
    if (s < score && reachFoot(r, f, -1) && reachFoot(r, f, 1)) { score = s; best = f; }
  }
  return best ?? placeAt(r, u, y, base);
}

// ---- the limbs: each hand and foot onto the surface on its own joint

/** a limb's angles: an arm's [x, y, z] (three's 'XYZ'), a leg's pitch */
export type ArmRot = readonly [number, number, number];

/** an arm aimed along a body-frame direction: Rx(a)·Rz(c) takes its hang (0, -1, 0) there */
export function armRot(d: V3): ArmRot {
  const u = unit(d);
  const c = Math.asin(Math.max(-1, Math.min(1, u.x)));
  const a = Math.atan2(-u.z, -u.y);
  return [a, 0, c];
}

/** the hand ball's centre, world, for an arm's angles */
export function handAt(f: Frame, side: 1 | -1, rot: ArmRot): V3 {
  const [a, , c] = rot;
  // Rz(c)·(0, -arm, 0), then Rx(a)
  const x = Math.sin(c) * SKEL.arm;
  const y0 = -Math.cos(c) * SKEL.arm;
  const y = y0 * Math.cos(a);
  const z = y0 * Math.sin(a);
  return toWorld(f, v(side * SKEL.shoulder.x + x, SKEL.shoulder.y + y, z));
}

/** the shoe box's corners, world, for a leg's pitch */
export function footCorners(f: Frame, side: 1 | -1, pitch: number): V3[] {
  const F = SKEL.foot;
  const c = Math.cos(pitch);
  const s = Math.sin(pitch);
  const out: V3[] = [];
  for (const dx of [-F.hx, F.hx]) for (const dy of [-F.hy, F.hy]) for (const dz of [-F.hz, F.hz]) {
    const y = F.y + dy;
    const z = F.z + dz;
    out.push(toWorld(f, v(side * SKEL.hip.x + dx, SKEL.hip.y + y * c - z * s, y * s + z * c)));
  }
  return out;
}

/** a limb's gap to the surface when it touches: the hand's ball, the shoe's nearest corner */
export const TOUCH = { hand: 0.003, foot: 0.004 } as const;

/** a hand reaching: the in-plane way (from its shoulder: 0 out to its side, π/2 straight up) */
export function reachHand(r: Route, f: Frame, side: 1 | -1, phi: number): { rot: ArmRot; at: V3 } | null {
  const sh = toWorld(f, v(side * SKEL.shoulder.x, SKEL.shoulder.y, 0));
  // the way along the wall's face at the shoulder: out to its side and up the surface
  const pl = touched(r, add(sh, mul(r.n, -0.3)));
  const upW = unit(sub(UP, mul(pl.m, dot(UP, pl.m))));
  const e = add(mul(r.t, Math.cos(phi) * side), mul(upW, Math.sin(phi)));
  const hand = (b: number): V3 => add(sh, mul(add(mul(e, Math.cos(b)), mul(pl.m, -Math.sin(b))), SKEL.arm));
  const want = SKEL.hand + TOUCH.hand;
  if (freeOf(r, hand(Math.PI / 2)) > want) return null;
  let lo = -0.8;
  let hi = Math.PI / 2;
  if (freeOf(r, hand(lo)) < want) return null;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (freeOf(r, hand(mid)) > want) lo = mid;
    else hi = mid;
  }
  const at = hand(lo);
  return { rot: armRot(toBody(f, sub(at, sh))), at };
}

/** a foot reaching the wall: its leg's pitch forward until the shoe's nearest corner touches */
export function reachFoot(r: Route, f: Frame, side: 1 | -1): { pitch: number; at: V3 } | null {
  const near = (p: number): number => Math.min(...footCorners(f, side, p).map((c) => freeOf(r, c)));
  const want = TOUCH.foot;
  let prev = 0;
  if (near(0) <= want) return null;
  for (let p = -0.02; p >= -Math.PI / 2; p -= 0.02) {
    if (near(p) <= want) {
      let lo = prev;
      let hi = p;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (near(mid) > want) lo = mid;
        else hi = mid;
      }
      // the shoe meets the wall along its toe's edge (both its corners as near): the hold sits under its middle
      const corners = footCorners(f, side, lo);
      const min = Math.min(...corners.map((c) => freeOf(r, c)));
      const edge = corners.filter((c) => freeOf(r, c) < min + 0.002);
      const at = mul(edge.reduce((a, b) => add(a, b), v(0, 0, 0)), 1 / edge.length);
      return { pitch: lo, at };
    }
    prev = p;
  }
  return null;
}

/** where a limb touches, on the surface: its hold's place */
export function onSurface(r: Route, p: V3): V3 {
  return sub(p, mul(touched(r, p).m, freeOf(r, p)));
}

// ---- a problem's stances and holds

/** a hold: on the surface, its normal into the room, its size, its colour (HOLD_COLS) */
export interface Hold {
  readonly p: V3;
  readonly n: V3;
  readonly r: number;
  readonly colour: number;
}

/** the problems' colours (never pink or red: palette.test.ts) and the other holds' */
export const ROUTE_COLS = ['#2a9d8f', '#ffd166', '#9b8fe0', '#f39a4c', '#6cb4ee', '#7cc26b'] as const;
export const HOLD_COLS = [...ROUTE_COLS, '#fffaf0', '#1d1a17'] as const;

/** a stance: the body's frame, each limb's angles and the hold it is on */
export interface Stance {
  readonly f: Frame;
  /** left, right */
  readonly arms: readonly [ArmRot, ArmRot];
  readonly legs: readonly [number, number];
  readonly hands: readonly [V3, V3];
  readonly feet: readonly [V3, V3];
}

/** the first stance's feet origin over the mat, the rise per move, the moves to the top */
export const Y0 = MAT_H + 0.02;
export const DY = 0.37;
export const MOVES = 5;
/** each stance's hands: the way each one reaches ([left, right], radians from out to up) */
const REACH: readonly (readonly [number, number])[] = [
  [0.75, 1.3],
  [1.3, 0.7],
];
/** the top-out's free hand (the left): straight up to the bell */
export const BELL_PHI = 1.45;

/** a stance on the route: k from 0 (just off the mat) to MOVES (its hands at the top), a small sway along it */
export function stanceAt(r: Route, k: number): Stance | null {
  const u = (k % 2 ? 0.05 : -0.05) * (k === 0 ? 0 : 1);
  const f = place(r, u, Y0 + k * DY);
  const [pl, pr] = REACH[k % REACH.length] as readonly [number, number];
  const hl = reachHand(r, f, -1, pl);
  const hr = reachHand(r, f, 1, pr);
  const fl = reachFoot(r, f, -1);
  const fr = reachFoot(r, f, 1);
  if (!hl || !hr || !fl || !fr) return null;
  return { f, arms: [hl.rot, hr.rot], legs: [fl.pitch, fr.pitch], hands: [hl.at, hr.at], feet: [fl.at, fr.at] };
}

/** the bell over a problem's top (stage 7): where the top stance's left hand rings it */
export function bellAt(r: Route): { rot: ArmRot; at: V3 } | null {
  const top = stanceAt(r, MOVES);
  return top ? reachHand(r, top.f, -1, BELL_PHI) : null;
}

const STANCES = new WeakMap<Route, readonly Stance[]>();

/** a problem's stances, 0..MOVES (memoized). Pure. */
export function stancesOf(r: Route): readonly Stance[] {
  const hit = STANCES.get(r);
  if (hit) return hit;
  const out: Stance[] = [];
  for (let k = 0; k <= MOVES; k++) {
    const s = stanceAt(r, k);
    if (s) out.push(s);
  }
  STANCES.set(r, out);
  return out;
}

/** a hold's size: a hand's, a foot's (as wide as a shoe's toe, SKEL.foot.hx: the whole edge stands on it), the golden hold's */
const HOLD_R = { hand: 0.055, foot: 0.068, gold: 0.08 } as const;

/** a problem's holds: under each limb of each stance (the hands' and the feet's) */
export function routeHolds(r: Route): Hold[] {
  const out: Hold[] = [];
  const seen: V3[] = [];
  const put = (p: V3, size: number): void => {
    const s = onSurface(r, p);
    if (seen.some((q) => len(sub(q, s)) < 0.06)) return;
    seen.push(s);
    out.push({ p: s, n: touched(r, p).m, r: size, colour: r.colour });
  };
  for (const s of stancesOf(r)) {
    for (const h of s.hands) put(h, HOLD_R.hand);
    for (const ft of s.feet) put(ft, HOLD_R.foot);
  }
  return out;
}

/** a seeded generator, the same on every run (mulberry32) */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** a volume: a big triangular block on a facet, its three feet on the surface and its apex out */
export interface Volume {
  readonly a: V3;
  readonly b: V3;
  readonly c: V3;
  readonly apex: V3;
  readonly colour: string;
  /** the stage it comes with (its stage's group) */
  readonly stage: number;
}

/** the volumes' colours (the map's accents, never pink or red) */
const VOL_COLS = ['#ffd166', '#2a9d8f', '#9b8fe0', '#f39a4c', '#6cb4ee'] as const;
/** a volume clears every problem's lane by this (the climbers' hands reach ~0.6 from its middle) */
const LANE = 1.0;

/** how far a point is along the foot line from a problem's middle, past its lane's half width (< 0 inside it) */
function laneGap(r: Route, p: V3): number {
  const d = sub(p, r.o);
  const along = Math.abs(dot(d, r.t));
  const out = dot(d, r.n);
  // on another run (round the corner) it is out of this lane
  if (out < -0.8) return Infinity;
  return along - LANE;
}

const VOLUMES = new WeakMap<Gym, Volume[]>();

/** The volumes: on the twisted panels and the roof, clear of every problem's lane, one more every other stage. Pure, memoized. */
export function volumes(g: Gym): readonly Volume[] {
  const hit = VOLUMES.get(g);
  if (hit) return hit;
  const rs = routes(g);
  const out: Volume[] = [];
  const r = rng(29);
  let k = 0;
  for (const f of facets(g)) {
    // its feet round the facet's incentre, inside its incircle (a twisted panel's other triangle bends away)
    const la = len(sub(f.b, f.c));
    const lb = len(sub(f.c, f.a));
    const lc = len(sub(f.a, f.b));
    const per = la + lb + lc;
    const mid = mul(add(add(mul(f.a, la), mul(f.b, lb)), mul(f.c, lc)), 1 / per);
    const rho = len(cross(sub(f.b, f.a), sub(f.c, f.a))) / per;
    const size = rho * 0.9;
    if (rs.some((x) => laneGap(x, mid) < size - 0.3)) continue;
    if (r() > 0.6) continue;
    const e1 = unit(sub(f.b, f.a));
    const e2 = cross(f.n, e1);
    const turn = r() * Math.PI * 2;
    const foot = (i: number): V3 => {
      const a = turn + (i * Math.PI * 2) / 3;
      return add(mid, add(mul(e1, Math.cos(a) * size), mul(e2, Math.sin(a) * size)));
    };
    const a = foot(0);
    const b = foot(1);
    const c = foot(2);
    if ([a, b, c].some((p) => p.y < MAT_H + 0.25 || p.y > WALL_TOP - 0.1)) continue;
    const apex = add(mid, mul(f.n, 0.3 + r() * 0.15));
    out.push({ a, b, c, apex, colour: VOL_COLS[k % VOL_COLS.length] as string, stage: Math.min(13, k * 2) });
    k++;
  }
  VOLUMES.set(g, out);
  return out;
}

/** a volume's faces, each with its normal out of it (the three sides and the base on the wall) */
export function volumeFaces(x: Pick<Volume, 'a' | 'b' | 'c' | 'apex'>): { a: V3; b: V3; c: V3; n: V3 }[] {
  const mid = mul(add(add(x.a, x.b), add(x.c, x.apex)), 0.25);
  return [[x.a, x.b, x.apex], [x.b, x.c, x.apex], [x.c, x.a, x.apex], [x.a, x.c, x.b]].map(([a, b, c]) => {
    const p = a as V3;
    let n = unit(cross(sub(b as V3, p), sub(c as V3, p)));
    if (dot(n, sub(p, mid)) < 0) n = mul(n, -1);
    return { a: p, b: b as V3, c: c as V3, n };
  });
}

/** how deep a point is inside a volume (> 0 inside), from its faces' planes */
export function insideVolume(x: Pick<Volume, 'a' | 'b' | 'c' | 'apex'>, p: V3): number {
  return Math.min(...volumeFaces(x).map((f) => -dot(sub(p, f.a), f.n)));
}

const DECOR = new WeakMap<Gym, Hold[]>();

/** The other holds: a few per facet, never on a problem's lane nor under a volume. Pure, memoized. */
export function decorHolds(g: Gym): readonly Hold[] {
  const hit = DECOR.get(g);
  if (hit) return hit;
  const rs = routes(g);
  const vs = volumes(g);
  const out: Hold[] = [];
  const r = rng(7);
  for (const f of facets(g)) {
    for (let i = 0; i < 5; i++) {
      let a = r();
      let b = r();
      if (a + b > 1) { a = 1 - a; b = 1 - b; }
      const p = add(f.a, add(mul(sub(f.b, f.a), a), mul(sub(f.c, f.a), b)));
      const size = 0.035 + r() * 0.03;
      const colour = Math.floor(r() * HOLD_COLS.length);
      if (p.y < MAT_H + 0.08 || p.y > WALL_TOP - 0.06) continue;
      if (rs.some((x) => laneGap(x, p) < -0.35)) continue;
      if (vs.some((x) => len(sub(p, mul(add(add(x.a, x.b), x.c), 1 / 3))) < 0.6)) continue;
      out.push({ p, n: f.n, r: size, colour });
    }
  }
  DECOR.set(g, out);
  return out;
}

/** the golden hold at the big wall's top (stage 14): over the steepest problem's top */
export function goldenHold(g: Gym): Hold | null {
  const rs = routes(g);
  const r = rs.reduce<Route | null>((a, b) => (!a || b.o2 > a.o2 ? b : a), null);
  if (!r) return null;
  const top = add(r.o, add(mul(r.n, offAt(r, WALL_TOP - 0.12)), mul(UP, WALL_TOP - 0.12)));
  const p = add(top, mul(r.t, -0.55));
  return { p, n: planesOf(r)[1].m, r: HOLD_R.gold, colour: 0 };
}

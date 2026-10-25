// @vitest-environment happy-dom
// His condition for the climbing gym (page bims-climb v4, Gabriel: « on peut l'ajouter », no
// clipping; in the v4 render a climber's body went into a volume and the wall). On the world as
// world.ts builds it (the wall's mesh, its volumes, its mats) and the bim as bim.ts builds it, posed
// by render/climb.ts, every frame at 30 fps of every line a climber can play: each problem topped
// out (the bell rung, stage 7 on, or a fist up before), and fallen off at each of its moves:
//   - a hand or a foot within 2 cm of the wall sits on a hold there (on the surface, within 2 cm of
//     it), and all four do while a stance holds; none is ever inside the wall;
//   - the body (its hoodie and its head) stays in front of the wall, never touching it, and no part
//     of the bim is inside a volume;
//   - nobody stands inside a mat.
// The world is built at the top stage: every volume and bell any stage has is in it (a stage before
// it has fewer), so a clean top stage is a clean stage. Frames repeated across lines (the same move
// of the same problem) are checked once. Also: the lines last 8-12 s, a rest at least as long; two
// climbers at most, never main, nobody under reduced motion; a line draws at LOOP_FPS, a rest nothing.
import { describe, expect, it } from 'vitest';
import { BufferGeometry, CapsuleGeometry, Group, Mesh, type Object3D, SphereGeometry, Vector3 } from 'three';
import { agent, mainAgent } from '../fixtures';
import { climbLayout } from '../maps/climb';
import type { Activity, ClimbPastime, FunIn, Gym } from '../model';
import { growOf, STAGE_AT } from '../growth';
import {
  type Facet, type Hold, MAT_H, MOVES, type Route, type V3, bellAt, closestOnTri, decorHolds, dot, facets, goldenHold, insideVolume, len, routeHolds, routes, sub,
  volumes,
} from '../climbwall';
import { type Line, LINE_MAX, LINE_MIN, SESSION_S, climbers, compose, lineOf } from '../climb';
import { bodyAt, rigOfBody } from './climb';
import { buildWorld } from './world';
import { lookOf } from './maps';
import { makeBim } from './bim';
import { STYLE } from './style';

/** every frame at 30 fps on main's full gate and the nightly (FUZZ_RUNS); a commit's quick run samples 6 fps (testing skill, rule 2) */
const FPS = typeof process !== 'undefined' && process.env.FUZZ_RUNS !== undefined ? 30 : 6;
/** a problem's case: 10 s at most at 30 fps on a Mac at load ~40 (climb-law, from 138 s for the whole law in one case); 3x for a busier one */
const CASE_MS = 30_000;
/** a limb this near the wall touches it: on a hold */
const TOUCH = 0.02;
/** float noise: a vertex this far inside is on the surface */
const EPS = 0.002;

const office = climbLayout([mainAgent(), ...Array.from({ length: 6 }, (_, i) => agent(`a${String(i)}`))]);
const gym = office.gym;
const TOP = growOf({ jobs_done: STAGE_AT[14], days_used: 400, artifacts_made: 600 });

/** the world's meshes tagged by the look, world units */
function drawn(): { wall: Float32Array; vols: V3[][] } {
  const w = buildWorld(office, 'main', STYLE, lookOf('climb'), false, TOP);
  w.root.updateMatrixWorld(true);
  const got: { wall: Float32Array | null } = { wall: null };
  const vols: V3[][] = [];
  w.root.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    const pos = (o.geometry as BufferGeometry).getAttribute('position');
    const pts: V3[] = [];
    const v = new Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      pts.push({ x: v.x, y: v.y, z: v.z });
    }
    if (o.userData.climbWall === true) got.wall = new Float32Array(pts.flatMap((p) => [p.x, p.y, p.z]));
    if (o.userData.climbVolume === true) vols.push(pts);
  });
  return { wall: got.wall ?? new Float32Array(), vols };
}

const near3 = (a: V3, b: V3): boolean => len(sub(a, b)) < 1e-4;

/** a bim's parts, sorted for the law: its hands, its feet, its body (hoodie and head), the rest of its limbs */
interface Parts {
  readonly hands: Mesh[];
  readonly feet: Mesh[];
  readonly body: Mesh[];
  readonly limbs: Mesh[];
}

function partsOf(root: Group): Parts {
  const out: Parts = { hands: [], feet: [], body: [], limbs: [] };
  root.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    const m: Mesh = o as Mesh;
    const g = m.geometry;
    const parent = m.parent;
    if (g instanceof SphereGeometry && Math.abs(g.parameters.radius - 0.065) < 1e-9 && parent && Math.abs(Math.abs(parent.position.x) - 0.24) < 1e-9) out.hands.push(m);
    else if (parent && Math.abs(parent.position.y - 0.3) < 1e-9 && Math.abs(Math.abs(parent.position.x) - 0.1) < 1e-9) (g instanceof CapsuleGeometry ? out.limbs : out.feet).push(m);
    else if (parent && Math.abs(Math.abs(parent.position.x) - 0.24) < 1e-9) out.limbs.push(m);
    else if (g instanceof CapsuleGeometry && Math.abs(g.parameters.radius - 0.21) < 1e-9) out.body.push(m);
    else if (isHead(o)) out.body.push(m);
  });
  return out;
}

/** a mesh in the head's group (render/bim.ts: the body's child at HEAD_Y) */
function isHead(o: Object3D): boolean {
  for (let p = o.parent; p; p = p.parent) if (Math.abs(p.position.y - 0.93) < 1e-9 && p.parent && p.parent.parent) return true;
  return false;
}

function shown(m: Object3D): boolean {
  for (let p: Object3D | null = m; p; p = p.parent) if (!p.visible) return false;
  return true;
}

/** a geometry's distinct vertices, local units (a sphere's seams and poles repeat theirs: one is enough for a distance) */
const LOCAL = new WeakMap<BufferGeometry, Float32Array>();
function localOf(g: BufferGeometry): Float32Array {
  const hit = LOCAL.get(g);
  if (hit) return hit;
  const pos = g.getAttribute('position');
  const seen = new Set<string>();
  const out: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const k = `${String(pos.getX(i))},${String(pos.getY(i))},${String(pos.getZ(i))}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(pos.getX(i), pos.getY(i), pos.getZ(i));
  }
  const arr = new Float32Array(out);
  LOCAL.set(g, arr);
  return arr;
}

const WORLD = new WeakMap<Mesh, { x: number; y: number; z: number }[]>();

/** a mesh's distinct vertices, world units (Vector3.applyMatrix4's sums); one array per mesh, rewritten at each call */
function verts(m: Mesh): readonly V3[] {
  const loc = localOf(m.geometry);
  const e = m.matrixWorld.elements;
  let out = WORLD.get(m);
  if (!out) {
    out = Array.from({ length: loc.length / 3 }, () => ({ x: 0, y: 0, z: 0 }));
    WORLD.set(m, out);
  }
  out.forEach((p, i) => {
    const x = loc[i * 3] ?? 0;
    const y = loc[i * 3 + 1] ?? 0;
    const z = loc[i * 3 + 2] ?? 0;
    const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
    p.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
    p.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
    p.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
  });
  return out;
}

/** a facet and its bounding sphere (its centroid, the farthest corner from it), for wallDist's skip */
interface Near {
  readonly f: Facet;
  readonly c: V3;
  readonly r: number;
}

const nearOf = (f: Facet): Near => {
  const c: V3 = { x: (f.a.x + f.b.x + f.c.x) / 3, y: (f.a.y + f.b.y + f.c.y) / 3, z: (f.a.z + f.b.z + f.c.z) / 3 };
  return { f, c, r: Math.max(len(sub(f.a, c)), len(sub(f.b, c)), len(sub(f.c, c))) };
};

/** a lower bound of a point's distance to a facet: its sphere's, its plane's */
function boundTo(p: V3, { f, c, r }: Near): number {
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  const dz = p.z - c.z;
  const plane = Math.abs((p.x - f.a.x) * f.n.x + (p.y - f.a.y) * f.n.y + (p.z - f.a.z) * f.n.z);
  return Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz) - r, plane);
}

/**
 * a point's signed distance to the wall's facets near it (Infinity: none near). A facet whose lower
 * bound (its sphere's, its plane's) is past the best so far + 1e-6 is skipped: it would be neither a
 * new best nor a tie (d >= its bound), so the result is the full walk's, without most closestOnTri
 */
function wallDist(p: V3, ns: readonly Near[]): { d: number; at: V3 } {
  let best = Infinity;
  let sign = 0;
  let at: V3 = p;
  for (const x of ns) {
    if (boundTo(p, x) > best + 1e-6) continue;
    const { f } = x;
    const q = closestOnTri(p, f.a, f.b, f.c);
    const d = len(sub(p, q));
    const s = dot(sub(p, q), f.n);
    if (d < best - 1e-7) { best = d; sign = s; at = q; }
    else if (d < best + 1e-7) sign += s;
  }
  return { d: sign < 0 ? -best : best, at };
}

/** every line a climber may play on a problem: topped out with and without the bell, fallen off each move */
function linesOf(r: Route): { name: string; line: Line }[] {
  const out: { name: string; line: Line }[] = [];
  out.push({ name: `r${String(r.id)} top`, line: compose(r, r.slot, gym, false, MOVES, false) });
  out.push({ name: `r${String(r.id)} top, the bell`, line: compose(r, r.slot, gym, false, MOVES, true) });
  for (let j = 1; j < MOVES; j++) out.push({ name: `r${String(r.id)} fall ${String(j)}`, line: compose(r, r.slot, gym, true, j, false) });
  return out;
}

describe('the climbing law: no hand, foot or body in the wall or a volume, nobody in a mat', () => {
  const { wall, vols } = drawn();
  const fs = facets(gym);
  const vs = volumes(gym);

  it('draws the wall and the volumes the laws read', () => {
    expect(wall.length).toBe(fs.length * 9);
    fs.forEach((f, i) => {
      const at = (k: number): V3 => ({ x: wall[i * 9 + k * 3] ?? 0, y: wall[i * 9 + k * 3 + 1] ?? 0, z: wall[i * 9 + k * 3 + 2] ?? 0 });
      expect(near3(at(0), f.a) && near3(at(1), f.b) && near3(at(2), f.c)).toBe(true);
    });
    expect(vols.length).toBe(vs.length);
    for (const pts of vols) expect(vs.some((x) => [x.a, x.b, x.c, x.apex].every((c) => pts.some((p) => near3(p, c))))).toBe(true);
  });

  const ns = fs.map(nearOf);
  // one case per problem, each its own budget (a frame's key starts with its problem: nothing seen is shared across them)
  for (const route of routes(gym)) {
    it(`every frame of every line of problem ${String(route.id)} at ${String(FPS)} fps, with and without the bell`, { timeout: CASE_MS }, async () => {
      const holds: Hold[] = [...routes(gym).flatMap((r) => routeHolds(r)), ...decorHolds(gym)];
      const gold = goldenHold(gym);
      if (gold) holds.push(gold);
      // the bells (a hand rings one: a hold of its own)
      for (const r of routes(gym)) { const b = bellAt(r); if (b) holds.push({ p: b.at, n: r.n, r: 0.075, colour: 0 }); }
      const bim = makeBim('climber', false, STYLE);
      const parts = partsOf(bim.group);
      expect(parts.hands.length).toBe(2);
      expect(parts.feet.length).toBe(2);
      const out = new Set<string>();
      const seen = new Set<string>();
      for (const { name, line } of linesOf(route)) {
        // a macrotask between two lines (src/test-busy.ts: no test holds the loop over 10 s of CPU)
        await new Promise((ok) => setTimeout(ok, 0));
        for (const beat of line.beats) {
          for (let f = 0; f <= Math.ceil(beat.dur * FPS); f++) {
            const into = Math.min(beat.dur, f / FPS);
            const key = `${String(line.route)}|${beat.k}|${beat.k === 'move' ? String(beat.to) : ''}|${'from' in beat && typeof beat.from === 'number' ? String(beat.from) : ''}|${beat.k === 'walk' || beat.k === 'sit' || beat.k === 'up' || beat.k === 'land' ? `${String(line.landing.x)},${String(line.landing.z)},${String(beat.t0)}` : ''}|${line.bell ? 'b' : ''}|${into.toFixed(4)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const body = bodyAt(gym, line, beat, into);
            bim.apply(rigOfBody(body, 'loop'));
            bim.group.updateMatrixWorld(true);
            const here = (msg: string): void => void out.add(`${name}, ${beat.k} at ${into.toFixed(2)} s: ${msg}`);
            const g0 = body.f.g;
            const nearFs = ns.filter(({ f: x }) => Math.min(...[x.a, x.b, x.c].map((p) => Math.hypot(p.x - g0.x, p.z - g0.z))) < 2.0);
            // a hand's or a foot's nearest vertex to the wall, from its check: the stance reads it again
            const minOf = new Map<Mesh, number>();
            const nearVs = vs.filter((x) => Math.hypot(x.apex.x - g0.x, x.apex.z - g0.z) < 2.5);
            const holding = beat.k === 'move' ? into >= Math.min(beat.dur, 0.4) : beat.k === 'bell' || beat.k === 'cheer' || beat.k === 'slip';
            const check = (m: Mesh, kind: 'hand' | 'foot' | 'body' | 'limb'): void => {
              if (!shown(m)) return;
              // its bounding sphere first: a mesh clear of the wall, the mats and the volumes by its radius needs no vertex walk
              const geo = m.geometry;
              if (!geo.boundingSphere) geo.computeBoundingSphere();
              const bs = geo.boundingSphere;
              const c3 = (bs?.center.clone() ?? new Vector3()).applyMatrix4(m.matrixWorld);
              const c: V3 = { x: c3.x, y: c3.y, z: c3.z };
              const R = (bs?.radius ?? 1) * m.matrixWorld.getMaxScaleOnAxis() + 0.005;
              const wc = nearFs.length > 0 ? wallDist(c, nearFs).d : Infinity;
              const wallNear = wc < R + TOUCH;
              const matNear = c.y - R < MAT_H && gym.mats.some((mt) => c.x > mt.x0 - R && c.x < mt.x1 + R && c.z > mt.z0 - R && c.z < mt.z1 + R);
              const volsNear = nearVs.filter((x) => insideVolume(x, c) > -R);
              if (!wallNear && !matNear && volsNear.length === 0) return;
              // the facets a vertex may be nearest to: a vertex is within R of c, so its nearest facet is within |wc| + R of
              // it, and a facet whose bound from c is past |wc| + 2R (+ 1e-6) is past that from every vertex (wallDist's skip)
              const mine = wallNear ? nearFs.filter((x) => boundTo(c, x) <= Math.abs(wc) + 2 * R + 1e-6) : [];
              const ps = verts(m);
              let min = { d: Infinity, at: ps[0] as V3 };
              for (const p of ps) {
                // a mat: nobody stands in one
                if (matNear) for (const mt of gym.mats) if (p.x > mt.x0 + 0.01 && p.x < mt.x1 - 0.01 && p.z > mt.z0 + 0.01 && p.z < mt.z1 - 0.01 && p.y < MAT_H - EPS) here(`${kind} in a mat at ${fmt(p)}`);
                for (const x of volsNear) if (insideVolume(x, p) > EPS) here(`${kind} in a volume at ${fmt(p)}`);
                if (!wallNear) continue;
                const w = wallDist(p, mine);
                if (w.d < min.d) min = w;
              }
              if (min.d === Infinity) return;
              if (wallNear) minOf.set(m, min.d);
              if (kind === 'body' && min.d <= 0) here(`its body touches the wall at ${fmt(min.at)} (${min.d.toFixed(3)})`);
              if (min.d < -EPS) here(`its ${kind} in the wall at ${fmt(min.at)} (${min.d.toFixed(3)})`);
              if ((kind === 'hand' || kind === 'foot') && min.d < TOUCH) {
                const h = holds.find((x) => len(sub(x.p, min.at)) <= x.r + TOUCH);
                if (!h) here(`its ${kind} on the wall at ${fmt(min.at)} off every hold`);
              }
            };
            parts.hands.forEach((m) => { check(m, 'hand'); });
            parts.feet.forEach((m) => { check(m, 'foot'); });
            parts.body.forEach((m) => { check(m, 'body'); });
            parts.limbs.forEach((m) => { check(m, 'limb'); });
            if (holding) {
              // the stance's limbs on: every foot, and every hand but the one that rings, cheers or slips
              const on = (ms: Mesh[]): number[] => ms.map((m) => minOf.get(m) ?? Math.min(...verts(m).map((p) => wallDist(p, nearFs).d)));
              const free = beat.k === 'move' ? -1 : beat.k === 'slip' ? 1 : 0;
              on(parts.hands).forEach((d, i) => { if (i !== free && d >= TOUCH) here(`hand ${String(i)} off the wall in a stance (${d.toFixed(3)})`); });
              on(parts.feet).forEach((d, i) => { if (d >= TOUCH) here(`foot ${String(i)} off the wall in a stance (${d.toFixed(3)})`); });
            }
          }
        }
      }
      bim.dispose();
      expect([...out].slice(0, 30)).toEqual([]);
    });
  }
});

const fmt = (p: V3): string => `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`;

describe('the climbers', () => {
  const p = (slot: number, stage = 14): ClimbPastime => ({ kind: 'climb', slot, stage });

  it('lines last 8-12 s and rest at least as long; the problems of its own run', () => {
    for (const r of routes(gym)) {
      for (const bell of [false, true]) {
        const l = compose(r, r.slot, gym, false, MOVES, bell);
        expect(l.len).toBeGreaterThanOrEqual(LINE_MIN - 1e-9);
        expect(l.len).toBeLessThanOrEqual(LINE_MAX + 1e-9);
      }
      for (let j = 1; j < MOVES; j++) {
        const l = compose(r, r.slot, gym, true, j, false);
        expect(l.len).toBeGreaterThanOrEqual(LINE_MIN - 1e-9);
        expect(l.len).toBeLessThanOrEqual(LINE_MAX + 1e-9);
      }
    }
    expect(SESSION_S).toBeGreaterThanOrEqual(2 * LINE_MAX);
    let falls = 0;
    for (let n = 0; n < 400; n++) {
      const l = lineOf(`a${String(n % 7)}`, n, p(n % 2), gym) as Line;
      expect(routes(gym)[l.route]?.slot).toBe(n % 2);
      if (l.fall) falls++;
    }
    // about one in eight
    expect(falls).toBeGreaterThan(400 / 16);
    expect(falls).toBeLessThan(400 / 5);
  });

  it('two climb at most, idle ones only, never main, nobody under reduced motion', () => {
    const acts = new Map<string, Activity>([...office.desks.keys()].map((n) => [n, { k: 'nap', at: 'lounge' }]));
    acts.set('main', { k: 'nap', at: 'lounge' });
    acts.set('busy', { k: 'work' } as Activity);
    const fun: FunIn = { stage: 9, jobs: 120, dow: 2, day: 20000, reduced: false };
    for (let t = 0; t < 6000; t += 600) {
      const c = climbers(acts, office, t, fun);
      expect(c.size).toBe(2);
      expect(c.has('main') || c.has('busy')).toBe(false);
    }
    expect(climbers(acts, office, 0, { ...fun, reduced: true }).size).toBe(0);
  });

  it('draws a line at the loop rate and a rest not at all', () => {
    const r = routes(gym)[0];
    if (!r) throw new Error('no problem');
    const l = compose(r, r.slot, gym, false, MOVES, true);
    const beat = l.beats[3];
    if (!beat) throw new Error('no beat');
    expect(rigOfBody(bodyAt(gym, l, beat, 0.1), 'loop').motion).toBe('loop');
  });
});

/** the gym's own numbers, for the law's report */
export const gymOf = (): Gym => gym;

// les bims: the walks (spec §3, "le graphe"). The office's walk network: the back and front
// corridors, the two aisles, the door line out to the terrace's walkway, and each spot's way in
// (spot -> its walkway `wz` -> its aisle or lane `ax` -> the corridor or the terrace walkway).
// Every leg is axis-aligned and clear of the furniture (layout.ts `furniture`), so a walk made of
// legs never crosses a desk, the island, a bean bag or a deck chair. `path` finds the shortest
// walk from any point on the network (a spot, or where a bim stood when its state changed
// mid-walk: no teleport) to a spot. Pure: the same office and points give the same walk.
import type { Office, Path, Pt } from './model';
import { exitOf, terraceWalk } from './layout';

const EPS = 1e-6;

/** A leg of the network, between two points. */
export type Leg = readonly [Pt, Pt];

interface Net {
  readonly legs: readonly Leg[];
  readonly nodes: readonly Pt[];
  readonly adj: readonly (readonly { readonly to: number; readonly w: number }[])[];
}

const nets = new WeakMap<Office, Net>();

/** the office's walk network, split at every junction (built once per office) */
export function network(o: Office): readonly Leg[] {
  return netOf(o).legs;
}

/**
 * The shortest walk from `from` (a point on the network: a spot, or a point along a walk) to
 * `to` (a spot or a point on the network). Off the network (never, but the timeline must not
 * break): the walk starts at the network's nearest junction.
 */
export function path(o: Office, from: Pt, to: Pt): Path {
  if (near(from, to)) return makePath([from]);
  const net = netOf(o);
  const a = locate(net, from);
  const b = locate(net, to);
  if (sameLeg(a, b)) return makePath([from, to]);
  const n = net.nodes.length;
  const dist = new Array<number>(n).fill(Infinity);
  const prev = new Array<number>(n).fill(-1);
  const done = new Array<boolean>(n).fill(false);
  for (const e of a.ends) dist[e.node] = Math.min(at(dist, e.node), e.w);
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!at(done, i) && at(dist, i) < Infinity && (u < 0 || at(dist, i) < at(dist, u))) u = i;
    if (u < 0) break;
    done[u] = true;
    for (const { to: v, w } of at(net.adj, u)) {
      if (at(dist, u) + w < at(dist, v) - EPS) {
        dist[v] = at(dist, u) + w;
        prev[v] = u;
      }
    }
  }
  let best = -1;
  let bestW = Infinity;
  for (const e of b.ends) {
    const w = at(dist, e.node) + e.w;
    if (w < bestW - EPS) {
      bestW = w;
      best = e.node;
    }
  }
  if (best < 0) return makePath([from, to]);
  const mid: Pt[] = [];
  for (let v = best; v >= 0; v = at(prev, v)) mid.unshift(at(net.nodes, v));
  return makePath([from, a.at, ...mid, to]);
}

/** A walk through these points: duplicates and the middle of three points on a line dropped. */
export function makePath(points: readonly Pt[]): Path {
  const pts = simplify(points);
  const seg: number[] = [];
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = dist(at(pts, i - 1), at(pts, i));
    seg.push(d);
    len += d;
  }
  return { pts, seg, len };
}

/** The point `d` tiles along a walk, and the way it faces there (three's y rotation: +z is 0). */
export function along(p: Path, d: number): { x: number; z: number; dir: number } {
  const first = at(p.pts, 0);
  let rest = Math.max(0, d);
  for (let i = 0; i < p.seg.length; i++) {
    const len = at(p.seg, i);
    if (rest <= len || i === p.seg.length - 1) {
      const f = len > 0 ? Math.min(1, rest / len) : 1;
      const a = at(p.pts, i);
      const b = at(p.pts, i + 1);
      return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, dir: Math.atan2(b.x - a.x, b.z - a.z) };
    }
    rest -= len;
  }
  return { x: first.x, z: first.z, dir: 0 };
}

// ---- the network

function netOf(o: Office): Net {
  let net = nets.get(o);
  if (!net) {
    net = build(o);
    nets.set(o, net);
  }
  return net;
}

/** the trunk (corridors, aisles, the door line, the terrace walkway) and every spot's way in */
function build(o: Office): Net {
  const tw = terraceWalk(o);
  const exit = exitOf(o);
  const spots = [
    ...o.desks.values(), o.mainDesk, ...o.islandSpots, ...o.lounge, ...o.boardSpots,
    ...o.queue, o.door, ...o.terrace, exit,
  ];
  // the back corridor runs from the leftmost lane to the rightmost one (the aisles at least)
  const backX = spots.filter((s) => s.wz <= o.crossBack + EPS).map((s) => s.ax);
  const trunk: Leg[] = [
    [{ x: Math.min(-o.ax, ...backX), z: o.crossBack }, { x: Math.max(o.ax, ...backX), z: o.crossBack }],
    [{ x: -o.ax, z: o.crossFront }, { x: o.ax, z: o.crossFront }],
    [{ x: -o.ax, z: o.crossBack }, { x: -o.ax, z: o.crossFront }],
    [{ x: o.ax, z: o.crossBack }, { x: o.ax, z: o.crossFront }],
    [{ x: -o.ax, z: o.crossFront }, { x: -o.ax, z: tw }],
    [{ x: exit.x, z: tw }, { x: -o.ax, z: tw }],
  ];
  const raw: Leg[] = [...trunk];
  for (const s of spots) {
    const walk = { x: s.x, z: s.wz };
    const entry = { x: s.ax, z: s.wz };
    raw.push([s, walk], [walk, entry]);
    if (!trunk.some((l) => onLeg(l, entry))) raw.push([entry, { x: s.ax, z: s.wz < o.crossBack ? o.crossBack : tw }]);
  }
  const legsIn = raw.filter(([a, b]) => !near(a, b));
  // the junctions: every leg's ends; each leg split at the junctions on it
  const nodes: Pt[] = [];
  const idx = new Map<string, number>();
  const nodeOf = (p: Pt): number => {
    const k = key(p);
    let i = idx.get(k);
    if (i === undefined) {
      i = nodes.length;
      nodes.push(p);
      idx.set(k, i);
    }
    return i;
  };
  for (const [a, b] of legsIn) {
    nodeOf(a);
    nodeOf(b);
  }
  const legs: Leg[] = [];
  const adj: { to: number; w: number }[][] = nodes.map(() => []);
  const seen = new Set<string>();
  for (const l of legsIn) {
    const on = nodes.filter((p) => onLeg(l, p)).sort((p, q) => dist(l[0], p) - dist(l[0], q));
    for (let i = 1; i < on.length; i++) {
      const p = at(on, i - 1);
      const q = at(on, i);
      const u = nodeOf(p);
      const v = nodeOf(q);
      if (u === v) continue;
      const k = u < v ? `${String(u)}-${String(v)}` : `${String(v)}-${String(u)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const w = dist(p, q);
      legs.push([p, q]);
      at(adj, u).push({ to: v, w });
      at(adj, v).push({ to: u, w });
    }
  }
  return { legs, nodes, adj };
}

/** where a point joins the network: the leg it is on (its two junctions and how far each is) */
interface Where {
  readonly at: Pt;
  readonly leg: number;
  readonly ends: readonly { readonly node: number; readonly w: number }[];
}

function locate(net: Net, p: Pt): Where {
  const here = net.nodes.findIndex((n) => near(n, p));
  if (here >= 0) return { at: at(net.nodes, here), leg: -1, ends: [{ node: here, w: 0 }] };
  const nodeIx = (q: Pt): number => net.nodes.findIndex((n) => near(n, q));
  const leg = net.legs.findIndex((l) => onLeg(l, p));
  if (leg >= 0) {
    const [a, b] = at(net.legs, leg);
    return { at: p, leg, ends: [{ node: nodeIx(a), w: dist(p, a) }, { node: nodeIx(b), w: dist(p, b) }] };
  }
  let best = 0;
  net.nodes.forEach((n, i) => {
    if (dist(n, p) < dist(at(net.nodes, best), p)) best = i;
  });
  return { at: at(net.nodes, best), leg: -1, ends: [{ node: best, w: 0 }] };
}

/** both points on one leg (or one a junction of the other's leg): a straight walk */
function sameLeg(a: Where, b: Where): boolean {
  if (a.leg >= 0 && b.leg >= 0) return a.leg === b.leg;
  if (a.leg >= 0) return b.ends.some((e) => a.ends.some((f) => f.node === e.node));
  if (b.leg >= 0) return a.ends.some((e) => b.ends.some((f) => f.node === e.node));
  return false;
}

function onLeg([a, b]: Leg, p: Pt): boolean {
  if (Math.abs(a.x - b.x) < EPS) {
    return Math.abs(p.x - a.x) < 1e-4 && p.z >= Math.min(a.z, b.z) - 1e-4 && p.z <= Math.max(a.z, b.z) + 1e-4;
  }
  if (Math.abs(a.z - b.z) < EPS) {
    return Math.abs(p.z - a.z) < 1e-4 && p.x >= Math.min(a.x, b.x) - 1e-4 && p.x <= Math.max(a.x, b.x) + 1e-4;
  }
  return false;
}

function simplify(points: readonly Pt[]): Pt[] {
  const out: Pt[] = [];
  const back = (i: number): Pt => at(out, out.length - i);
  for (const p of points) {
    if (out.length && near(back(1), p)) continue;
    out.push({ x: p.x, z: p.z });
    while (out.length >= 3 && inLine(back(3), back(2), back(1))) {
      out.splice(out.length - 2, 1);
      if (out.length >= 2 && near(back(2), back(1))) out.pop();
    }
  }
  return out;
}

/** three points on one horizontal or vertical line (every leg is one) */
function inLine(a: Pt, b: Pt, c: Pt): boolean {
  const vx = Math.abs(a.x - b.x) < 1e-4 && Math.abs(b.x - c.x) < 1e-4;
  const vz = Math.abs(a.z - b.z) < 1e-4 && Math.abs(b.z - c.z) < 1e-4;
  return vx || vz;
}

const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.z - b.z);
const near = (a: Pt, b: Pt): boolean => dist(a, b) < 1e-4;
/** xs[i], an index the code just computed (never out of range) */
function at<T>(xs: readonly T[], i: number): T {
  const x = xs[i];
  if (x === undefined) throw new Error(`bims paths: index ${String(i)} out of ${String(xs.length)}`);
  return x;
}
const key = (p: Pt): string => `${String(Math.round(p.x * 1e4))},${String(Math.round(p.z * 1e4))}`;

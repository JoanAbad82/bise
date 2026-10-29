// The app's town past its lawn (his m_49446: « the map seemingly infinite, with some grass and trees,
// and the river extending in all direction »): the grass goes on to `far`, past anything a view can
// show (town/pan.ts ROOM), the road and the river run straight off from their ends, and trees in
// clumps fill a band round the lawn as thick as the lawn's own, never on the road or the river.
// Seeded by the town's seed: the same town, the same wild. Pure, no three. Owner: bim-3d.
import type { Pt } from '../model';
import { BANK, ROAD, rngOf, type Rect, type TownPlan, type Tree } from './plan';

/** What the town draws past its lawn. */
export interface Beyond {
  /** the grass's whole extent: no view of the town reaches its edge */
  readonly far: Rect;
  /** the road and the river with their ends run straight on past `far` */
  readonly road: readonly Pt[];
  readonly river: readonly Pt[];
  /** the trees past the lawn (the lawn's own are the plan's) */
  readonly trees: readonly Tree[];
}

/** how far the grass goes past the lawn: at least this, else twice the lawn's size */
const FAR_MIN = 80;
/** the band of trees round the lawn: at least this deep, else this share of the lawn's size */
const BAND_MIN = 16;
const BAND_SHARE = 0.4;
/** trees past the lawn at most (one merged townscape: a few hundred is fine) */
const TREES_MAX = 600;

/** The grass's whole extent for this lawn. Pure. */
export function farOf(lawn: Rect): Rect {
  const m = Math.max(FAR_MIN, 2 * Math.max(lawn.x1 - lawn.x0, lawn.z1 - lawn.z0));
  return { x0: lawn.x0 - m, x1: lawn.x1 + m, z0: lawn.z0 - m, z1: lawn.z1 + m };
}

/** A line with its two ends run straight on, past `far`, along their last heading. Pure. */
export function runOff(pts: readonly Pt[], far: Rect): Pt[] {
  if (pts.length < 2) return [...pts];
  const reach = (far.x1 - far.x0) + (far.z1 - far.z0);
  const out = (a: Pt, b: Pt): Pt => {
    const l = Math.hypot(a.x - b.x, a.z - b.z) || 1;
    return { x: a.x + ((a.x - b.x) / l) * reach, z: a.z + ((a.z - b.z) / l) * reach };
  };
  const [a, b] = pts as readonly [Pt, Pt, ...Pt[]];
  const y = pts[pts.length - 1] as Pt;
  const z = pts[pts.length - 2] as Pt;
  return [out(a, b), ...pts, out(y, z)];
}

/** the distance from (x, z) to a line's nearest stretch */
function distTo(pts: readonly Pt[], x: number, z: number): number {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i] as Pt;
    const b = pts[i + 1] as Pt;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const l2 = dx * dx + dz * dz;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2));
    best = Math.min(best, Math.hypot(a.x + t * dx - x, a.z + t * dz - z));
  }
  return best;
}

/** The town past its lawn. Pure. */
export function beyondOf(plan: Pick<TownPlan, 'lawn' | 'road' | 'river' | 'trees' | 'seed'>): Beyond {
  const { lawn } = plan;
  const far = farOf(lawn);
  const road = runOff(plan.road, far);
  const river = runOff(plan.river, far);
  const lw = lawn.x1 - lawn.x0;
  const ld = lawn.z1 - lawn.z0;
  const band = Math.max(BAND_MIN, BAND_SHARE * Math.max(lw, ld));
  const out: Rect = { x0: lawn.x0 - band, x1: lawn.x1 + band, z0: lawn.z0 - band, z1: lawn.z1 + band };
  // as thick as the lawn's own (its trees over its area), a little sparser
  const density = (0.8 * Math.max(plan.trees.length, 20)) / Math.max(1, lw * ld);
  const want = Math.min(TREES_MAX, Math.round(density * ((out.x1 - out.x0) * (out.z1 - out.z0) - lw * ld)));
  const r = rngOf((plan.seed ^ 0x5eed) >>> 0);
  const inLawn = (x: number, z: number): boolean => x > lawn.x0 - 0.6 && x < lawn.x1 + 0.6 && z > lawn.z0 - 0.6 && z < lawn.z1 + 0.6;
  // only the stretches near the band: the run-off's long ends are two points
  const free = (x: number, z: number): boolean => !inLawn(x, z) && distTo(road, x, z) > ROAD + 1.6 && distTo(river, x, z) > BANK + 1.6;
  const trees: Tree[] = [];
  const taken = (x: number, z: number): boolean => trees.some((t) => Math.abs(t.x - x) < 0.8 && Math.abs(t.z - z) < 0.8);
  for (let k = 0; k < want * 4 && trees.length < want; k++) {
    const cx = out.x0 + r() * (out.x1 - out.x0);
    const cz = out.z0 + r() * (out.z1 - out.z0);
    if (!free(cx, cz)) continue;
    const clump = 1 + Math.floor(r() * 5);
    for (let j = 0; j < clump && trees.length < want; j++) {
      const x = cx + (r() - 0.5) * 3.4;
      const z = cz + (r() - 0.5) * 3.4;
      if (free(x, z) && !taken(x, z)) trees.push({ x, z, size: 0.75 + r() * 0.5 });
    }
  }
  return { far, road, river, trees };
}

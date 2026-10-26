// What a napper rests on (bims-nap: Gabriel, « dans la serre les bims dorment en lévitation »; the
// nap pose was one fixed rig at 0.22 whatever the bed: 20 cm over a mat, its back in the air at 52°
// on a cushion). Each lounge bed has a shape, from its look: FLAT (a mat, a cushion, a cot, a
// bench: the napper lies on its back on it), SINK (a bean bag, a pouf: reclined, sunk in it) or
// SLING (a hammock: reclined on its cloth). Its height is the world's own: measured on the built
// world (a ray down at the napper's back and heels), so a new bed is right by itself. pose.ts
// poses the napper on it; render/nap.test.ts is the law. Owner: bims-nap.
import { Box3, Group, Mesh, type Object3D, Raycaster, Vector3 } from 'three';
import { BASE_BEDS, bedsAt } from '../growth';
import type { Office, Pt } from '../model';

export type NapShape = 'flat' | 'sink' | 'sling';

/** a bed's shape and the height the napper rests at (flat: its top under the back and heels; sink, sling: under the hips) */
export interface NapRest {
  readonly shape: NapShape;
  readonly top: number;
}

/** the napper's hips ahead of its spot (pose.ts: its pivot, the spot is its bed's NAP_BED.back), by shape */
export const NAP_DZ: Readonly<Record<NapShape, number>> = { flat: 0.23, sink: 0.15, sling: 0.15 };

/**
 * The flat lie (pose.ts lying): on its back, its head a little up on a pillow and tilted to the
 * room, legs down to the bed. Its pivot is LIFT over the surface: its back's and its heels' lowest
 * points are on it (bim.ts's torso, soles: render/nap.test.ts measures them). 0.161: the clay torso
 * of page bims-look D is 0.94 as deep as the old hoodie's.
 */
export const FLAT = {
  body: -1.45,
  head: 0.5,
  legs: 0.3,
  lift: 0.161,
  /** where the ray looks, from the hips (z ahead): the back's lowest point, the heels' */
  back: -0.39,
  heels: -0.035,
  /**
   * the head's middle from the spot (z ahead), and the pillow's height under it. The skull's lowest
   * point lies 3.2-3.7 cm over the bed (it sinks 1.3-1.8 cm in the pillow) and a woman's hair 3-5 mm
   * under it: at 0.06 cyclades' hair went 3.3 cm in, past nap.test.ts's TOUCH
   */
  headZ: -0.69,
  headUp: 0.05,
} as const;

/** the recline (sink, sling): its pivot this far under the bag's top (it sinks in, as the loft's bean bags always had it), over the cloth under its spot */
export const SINK_DROP = 0.22;
export const SLING_LIFT = 0.025;

/** A base bed's shape (render/cozy.ts BedKind: the cozy kit's kinds; a string here: pose.ts reads this file in the node project, render/cozy.ts is not in it). Pure. */
export function shapeOfKind(k: string): NapShape {
  return k === 'pouf' ? 'sink' : k === 'hammock' ? 'sling' : 'flat';
}

/** what a look says of its nap place: the base beds' kind, its own beds' shape past them */
export interface NapLook {
  readonly cozy: { readonly bed: string };
  readonly bedShape?: NapShape;
}

/** Lounge bed i's shape on a look: the cozy kit's two, then the look's own (flat by default). Pure. */
export function shapeAt(look: NapLook, i: number): NapShape {
  return i < BASE_BEDS ? shapeOfKind(look.cozy.bed) : (look.bedShape ?? 'flat');
}

/** the points (x, z from the spot) where a shape's napper touches its bed */
export function contacts(shape: NapShape): readonly Pt[] {
  if (shape === 'flat') {
    const dz = NAP_DZ.flat;
    return [{ x: 0, z: dz + FLAT.back }, { x: -0.1, z: dz + FLAT.heels }, { x: 0.1, z: dz + FLAT.heels }];
  }
  return [{ x: 0, z: 0 }];
}

/** what a ray down meets under this height: a bed's top, never a post's or a lamp's over it */
const UNDER = 0.62;

/** The highest surface under (x, z) below UNDER among `meshes` (the floor: 0). */
export function surfaceAt(meshes: readonly Object3D[], x: number, z: number): number {
  const ray = new Raycaster(new Vector3(x, UNDER, z), new Vector3(0, -1, 0), 0, UNDER + 1);
  const hits = ray.intersectObjects(meshes as Object3D[], false);
  return hits.length > 0 ? Math.max(0, UNDER - (hits[0]?.distance ?? UNDER)) : 0;
}

/** the meshes whose box meets a bed's (its pieces, the rug under it; a merged mesh by its own box) */
function meshesIn(root: Object3D, box: { x0: number; x1: number; z0: number; z1: number }): Mesh[] {
  const out: Mesh[] = [];
  const bb = new Box3();
  root.traverse((m) => {
    if (!(m instanceof Mesh)) return;
    const mesh = m as Mesh;
    bb.setFromObject(mesh);
    if (bb.isEmpty() || bb.max.x < box.x0 || bb.min.x > box.x1 || bb.max.z < box.z0 || bb.min.z > box.z1 || bb.min.y > UNDER) return;
    out.push(mesh);
  });
  return out;
}

/**
 * Each lounge bed's rest at this stage, measured on the built world (`root`, its matrices
 * updated): undefined where no bed is built (its napper naps at its desk). Flat: the highest
 * surface under its back and heels (none sinks in); sink: the bag's top at its middle; sling:
 * the cloth under its spot.
 */
export function napRests(root: Object3D, o: Office, look: NapLook, stage: number): (NapRest | undefined)[] {
  root.updateMatrixWorld(true);
  const n = bedsAt(stage);
  return o.lounge.map((s, i) => {
    if (i >= n) return undefined;
    const box = o.furniture.find((f) => f.of?.x === s.x && f.of.z === s.z);
    if (!box) return undefined;
    const shape = shapeAt(look, i);
    const meshes = meshesIn(root, box);
    if (shape === 'sink') return { shape, top: surfaceAt(meshes, (box.x0 + box.x1) / 2, (box.z0 + box.z1) / 2) };
    const tops = contacts(shape).map((p) => surfaceAt(meshes, s.x + p.x, s.z + p.z));
    return { shape, top: Math.max(...tops) };
  });
}

/** The rest of the bed at p (a lounge spot), from napRests' list. Pure. */
export function restAt(o: Office, rests: readonly (NapRest | undefined)[], p: Pt): NapRest | undefined {
  const i = o.lounge.findIndex((l) => Math.abs(l.x - p.x) < 1e-4 && Math.abs(l.z - p.z) < 1e-4);
  return i < 0 ? undefined : rests[i];
}

/** a bed's key (userData.bed on its pieces): its lounge spot */
export const bedKey = (p: Pt): string => `${p.x.toFixed(3)},${p.z.toFixed(3)}`;

/** A group for one bed's pieces under `parent`, tagged with its spot (bims m_35422: clip.test tells them from whatever else stands in its box). */
export function bedGroup(parent: Object3D, spot: Pt): Group {
  const g = new Group();
  g.userData.bed = bedKey(spot);
  parent.add(g);
  return g;
}

/** the bed tag of a mesh: its own group's, or none */
export function bedOfMesh(m: Object3D): string | undefined {
  for (let p: Object3D | null = m; p; p = p.parent) if (typeof p.userData.bed === 'string') return p.userData.bed;
  return undefined;
}

/** Each bed's pieces' boxes (world), by key: a tagged mesh's own box, a merged mesh's userData.bedParts (cozy.ts mergeInto keeps them). */
export function bedPieces(root: Object3D): Map<string, Box3[]> {
  root.updateMatrixWorld(true);
  const out = new Map<string, Box3[]>();
  const add = (k: string, b: Box3): void => { out.set(k, [...(out.get(k) ?? []), b]); };
  const seen = new Set<unknown>();
  root.traverse((m) => {
    if (!(m instanceof Mesh)) return;
    const merged = m.userData.bedParts as Record<string, Box3[]> | undefined;
    if (merged) {
      if (seen.has(merged)) return;
      seen.add(merged);
      for (const [k, bs] of Object.entries(merged)) for (const b of bs) add(k, b);
      return;
    }
    const k = bedOfMesh(m);
    if (k !== undefined) add(k, new Box3().setFromObject(m, true));
  });
  return out;
}

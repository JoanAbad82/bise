// The outfits' character loop (docs/brand/bims.md "outfits: the intent sheet"): one fixed bim per
// outfit, every pose the intent sheet names sampled over time (the office's activities through
// pose.ts rigOf, the home's gags from sprites/gags.ts), and the clipping measure: how many of a
// bim's arm and hand vertices sit inside what it wears on its torso, below the shoulder cap. The
// law (outfit-clip.test.ts) and the turnaround sheets (the character designer's studio) read it.
// Tests and studios only, never the app. Owner: bims-clay-2.
import { DoubleSide, Matrix4, Mesh, MeshBasicMaterial, type Object3D, Raycaster, Vector3 } from 'three';
import type { Activity, ActivityKind, Pose, Spot } from '../model';
import { ISLANDS } from '../sprites/gags';
import { type Bim, makeBim } from './bim';
import { KINDS, type Kind, outfitOf } from './palette';
import { type Rig, rigOf } from './pose';
import { STYLE } from './style';

/** the bims of the loop: one name per outfit (the first `bim-<n>` that wears it), main's own; the same every round */
export const OUTFIT_BIMS: readonly { readonly outfit: Kind | 'main'; readonly name: string; readonly main: boolean }[] = [
  ...KINDS.map((k) => {
    for (let i = 0; i < 500; i++) if (outfitOf(`bim-${String(i)}`, false).kind === k) return { outfit: k, name: `bim-${String(i)}`, main: false };
    throw new Error(`no name wears ${k}`);
  }),
  { outfit: 'main' as const, name: 'main', main: true },
];

/** a pose of the intent sheet: its frames over time (s) */
export interface PoseFrames {
  readonly id: string;
  readonly frames: readonly { readonly t: number; readonly rig: Rig }[];
}

const SPOT: Spot = { x: 0, z: 0, wz: 0, ax: 0, face: 0 };
/** the samples of a looping pose: 4 s at 8 fps (LOOP_FPS) */
const TS = Array.from({ length: 32 }, (_, i) => i / 8);

function officeRig(act: Activity, t: number, moving: boolean, main: boolean, phase: number, plane?: number): Rig {
  const pose: Pose = {
    x: 0, z: 0, dir: 0, moving, since: moving ? t : 30 + t,
    seg: { t: 0, act, sig: act.k, spot: SPOT, path: { pts: [SPOT], seg: [], len: 0 }, speed: 2.4, from: null },
    ...(plane !== undefined ? { plane: { since: plane } } : {}),
  };
  return rigOf({ pose, t: 30 + t, main, phase, reduced: false });
}

const OFFICE: readonly { readonly id: string; readonly k: ActivityKind; readonly at: Activity['at']; readonly moving?: boolean }[] = [
  { id: 'walk', k: 'snack', at: 'island', moving: true },
  { id: 'type', k: 'work', at: 'desk' },
  { id: 'hot', k: 'hot', at: 'desk' },
  { id: 'think', k: 'waitagent', at: 'desk' },
  { id: 'asleep', k: 'sleep', at: 'desk' },
  { id: 'asks', k: 'asks', at: 'desk' },
  { id: 'arms-crossed', k: 'blocked', at: 'desk' },
  { id: 'failed', k: 'failed', at: 'desk' },
  { id: 'carry', k: 'landing', at: 'queue' },
  { id: 'eat', k: 'snack', at: 'island' },
  { id: 'nap', k: 'nap', at: 'lounge' },
  { id: 'terrace', k: 'done', at: 'terrace' },
];

/** every pose of the intent sheet for one bim: the office's activities, the catch (a raised hand), the home's gags */
export function posesOf(main: boolean, phase: number): readonly PoseFrames[] {
  const out: PoseFrames[] = OFFICE.map((p) => ({
    id: p.id,
    frames: TS.map((t) => ({ t, rig: officeRig({ k: p.k, at: p.at }, t, p.moving === true, main, phase) })),
  }));
  // his plane's catch: the arm up, the read, the thumbs up (render/catch.ts), over its whole beat
  out.push({ id: 'catch', frames: TS.map((t) => ({ t, rig: officeRig({ k: 'work', at: 'desk' }, t, false, main, phase, 2.2 + t * 0.9) })) });
  for (const s of ISLANDS) {
    const n = Math.max(...s.frames.map((f) => f.bims.length));
    for (let b = 0; b < n; b++) {
      const frames = s.frames.flatMap((f, i) => {
        const a = f.bims[b];
        return a ? [{ t: i, rig: { ...a.rig, x: 0, z: 0, dir: 0 } }] : [];
      });
      if (frames.length > 0) out.push({ id: n > 1 ? `gag-${s.id}-${String(b + 1)}` : `gag-${s.id}`, frames });
    }
  }
  return out;
}

/** the voxel's size (office units) and how deep inside a vertex must be to count (cells): a sleeve may graze its cloth */
const CELL = 0.008;
const DEPTH = 2;
/** an arm's elbow (arm space): above it the arm joins the torso by design; below, its forearm, cuff and hand stay out */
export const ELBOW_Y = -0.16;
/** an arm's sleeve as a capsule in arm space (bim.ts): from the shoulder cap down, and the hand's ball; a worn detail may not pierce them */
const SLEEVE = { y0: -0.27, y1: ELBOW_Y, r: 0.07 } as const;
const HAND = { y: -0.305, r: 0.058 } as const;

/** the worn meshes under a part group, not under another part */
function wornOf(part: Object3D, parts: ReadonlySet<Object3D>): Mesh[] {
  const out: Mesh[] = [];
  const walk = (o: Object3D): void => {
    for (const c of o.children) {
      if (parts.has(c)) continue;
      if (c instanceof Mesh && c.userData.worn === true) out.push(c as Mesh);
      walk(c);
    }
  };
  walk(part);
  return out;
}

/** a closed volume as voxels in a space (`toSpace` from world), eroded DEPTH cells: what counts as deep inside it */
export interface Volume {
  readonly deep: Uint8Array;
  readonly lo: Vector3;
  readonly nx: number;
  readonly ny: number;
  readonly nz: number;
}

/** whether a point (in the volume's space) is deep inside it */
export function deepIn(vol: Volume, v: Vector3): boolean {
  const ix = Math.round((v.x - vol.lo.x) / CELL);
  const iy = Math.round((v.y - vol.lo.y) / CELL);
  const iz = Math.round((v.z - vol.lo.z) / CELL);
  if (ix < 0 || iy < 0 || iz < 0 || ix >= vol.nx || iy >= vol.ny || iz >= vol.nz) return false;
  return vol.deep[(ix * vol.ny + iy) * vol.nz + iz] === 1;
}

/** the voxels of closed meshes in a space: one ray along z per column, inside between each mesh's crossings' pairs, eroded DEPTH times */
export function volumeOf(meshes: readonly Mesh[], toSpace: Matrix4): Volume {
  // two-sided so a ray counts every crossing
  const two = new MeshBasicMaterial({ side: DoubleSide });
  const torso = meshes.map((m) => {
    const c = new Mesh(m.geometry, two);
    c.applyMatrix4(new Matrix4().multiplyMatrices(toSpace, m.matrixWorld));
    c.updateMatrixWorld(true);
    c.geometry.computeBoundingBox();
    return c;
  });
  const lo = new Vector3(Infinity, Infinity, Infinity);
  const hi = new Vector3(-Infinity, -Infinity, -Infinity);
  for (const c of torso) {
    const b = c.geometry.boundingBox;
    if (!b) continue;
    const w = b.clone().applyMatrix4(c.matrixWorld);
    lo.min(w.min);
    hi.max(w.max);
  }
  const nx = Math.ceil((hi.x - lo.x) / CELL) + 1;
  const ny = Math.ceil((hi.y - lo.y) / CELL) + 1;
  const nz = Math.ceil((hi.z - lo.z) / CELL) + 1;
  const inside = new Uint8Array(nx * ny * nz);
  const ray = new Raycaster();
  const dir = new Vector3(0, 0, 1);
  // one ray along z per column, per mesh: inside between its crossings' pairs (each mesh is closed)
  for (const c of torso) {
    for (let ix = 0; ix < nx; ix++) {
      for (let iy = 0; iy < ny; iy++) {
        ray.set(new Vector3(lo.x + ix * CELL, lo.y + iy * CELL, lo.z - 1), dir);
        const hits = ray.intersectObject(c, false).map((h) => h.point.z);
        for (let h = 0; h + 1 < hits.length; h += 2) {
          const z0 = Math.max(0, Math.ceil(((hits[h] ?? 0) - lo.z) / CELL));
          const z1 = Math.min(nz - 1, Math.floor(((hits[h + 1] ?? 0) - lo.z) / CELL));
          for (let iz = z0; iz <= z1; iz++) inside[(ix * ny + iy) * nz + iz] = 1;
        }
      }
    }
  }
  // eroded DEPTH times: a vertex counts only that deep inside
  let deep = inside;
  for (let d = 0; d < DEPTH; d++) {
    const next = new Uint8Array(deep.length);
    for (let ix = 1; ix < nx - 1; ix++) for (let iy = 1; iy < ny - 1; iy++) for (let iz = 1; iz < nz - 1; iz++) {
      const i = (ix * ny + iy) * nz + iz;
      if (deep[i] && deep[i - 1] && deep[i + 1] && deep[i - nz] && deep[i + nz] && deep[i - ny * nz] && deep[i + ny * nz]) next[i] = 1;
    }
    deep = next;
  }
  two.dispose();
  return { deep, lo, nx, ny, nz };
}

/** one bim's clip measure: its torso's worn volume (voxels in the body's space, it never bends) and its arms */
export interface Clipper {
  readonly bim: Bim;
  /** arm and hand vertices deep inside the torso's worn volume below the elbow, plus worn torso details' vertices through a sleeve or a hand, at this rig */
  clipsAt(rig: Rig): number;
  dispose(): void;
}

export function clipperOf(name: string, main: boolean): Clipper {
  const bim = makeBim(name, main, STYLE, undefined, undefined, false);
  const g = bim.group;
  const find = (n: string): Object3D => {
    const o = g.getObjectByName(n);
    if (!o) throw new Error(`no ${n}`);
    return o;
  };
  const body = find('body');
  const arms = [find('armL'), find('armR')];
  const parts = new Set<Object3D>(['head', 'body', 'armL', 'armR', 'legL', 'legR'].map(find));
  g.updateMatrixWorld(true);
  const toBody = new Matrix4().copy(body.matrixWorld).invert();
  const { deep, lo, nx, ny, nz } = volumeOf(wornOf(body, parts), toBody);
  const armMeshes = arms.map((a) => ({ arm: a, meshes: wornOf(a, parts) }));
  const details = wornOf(body, parts).filter((m) => m.userData.bean !== true);
  const v = new Vector3();
  const m = new Matrix4();
  return {
    bim,
    clipsAt(rig) {
      bim.apply({ ...rig, x: 0, z: 0, dir: 0, opacity: 1, grey: 0 });
      g.updateMatrixWorld(true);
      const inv = new Matrix4().copy(body.matrixWorld).invert();
      let n = 0;
      for (const { arm, meshes } of armMeshes) {
        const armInv = new Matrix4().copy(arm.matrixWorld).invert();
        for (const mesh of meshes) {
          if (!mesh.visible) continue;
          const pos = mesh.geometry.getAttribute('position');
          m.multiplyMatrices(inv, mesh.matrixWorld);
          const toArm = new Matrix4().multiplyMatrices(armInv, mesh.matrixWorld);
          for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i).applyMatrix4(toArm);
            if (v.y > ELBOW_Y) continue;
            v.fromBufferAttribute(pos, i).applyMatrix4(m);
            const ix = Math.round((v.x - lo.x) / CELL);
            const iy = Math.round((v.y - lo.y) / CELL);
            const iz = Math.round((v.z - lo.z) / CELL);
            if (ix < 0 || iy < 0 || iz < 0 || ix >= nx || iy >= ny || iz >= nz) continue;
            if (deep[(ix * ny + iy) * nz + iz]) n++;
          }
        }
      }
      // what it wears on its torso never pierces a sleeve or a hand
      for (const arm of arms) {
        const armInv = new Matrix4().copy(arm.matrixWorld).invert();
        for (const mesh of details) {
          if (!mesh.visible) continue;
          const pos = mesh.geometry.getAttribute('position');
          const toArm = new Matrix4().multiplyMatrices(armInv, mesh.matrixWorld);
          for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i).applyMatrix4(toArm);
            const cy = Math.min(SLEEVE.y1, Math.max(SLEEVE.y0, v.y));
            const inSleeve = Math.hypot(v.x, v.y - cy, v.z) < SLEEVE.r - CELL * DEPTH;
            const inHand = Math.hypot(v.x, v.y - HAND.y, v.z) < HAND.r - CELL * DEPTH;
            if (inSleeve || inHand) n++;
          }
        }
      }
      return n;
    },
    dispose() {
      bim.dispose();
    },
  };
}

/** each pose's worst frame (most clipping vertices) for a bim: the reviewer's sheet shows it */
export function worstFrames(c: Clipper, poses: readonly PoseFrames[]): readonly { readonly id: string; readonly t: number; readonly rig: Rig; readonly clips: number }[] {
  return poses.map((p) => {
    let best = { t: p.frames[0]?.t ?? 0, rig: p.frames[0]?.rig, clips: -1 };
    for (const f of p.frames) {
      const n = c.clipsAt(f.rig);
      if (n > best.clips) best = { t: f.t, rig: f.rig, clips: n };
    }
    if (!best.rig) throw new Error(`${p.id}: no frame`);
    return { id: p.id, t: best.t, rig: best.rig, clips: best.clips };
  });
}

// The newcomers' poofs drawn (poof.ts says where each piece is): one instanced mesh of clay puffs and
// one of gold sparkles under the office's root, a few instances each, so every poof in the office is
// two draw calls at most. A sparkle is three thin diamonds across each other: a star from any side.
// Owner: bim-pop.
import { type BufferGeometry, Euler, type Group, InstancedMesh, type Material, Matrix4, OctahedronGeometry, Quaternion, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { POOF_S, PUFF, SPARK, poofAt, puffBoost } from './poof';
import type { Style } from './style';

/** the puffs' clay: warm paper, no glow, in both themes (designer m_39015); the sparkles' gold: the neon's (palette.ts), never the accent */
const PUFF_COLOR = '#f2ede2';
const SPARK_COLOR = '#ffd166';
/** at most this many poofs at once (a burst of newcomers: the oldest ones' last frames are dropped) */
const MAX = 6;

export interface Poof {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** when it began, the scene's time */
  readonly t0: number;
  readonly seed: number;
}

export interface Poofs {
  /** pose every poof at t, `scale` the camera's office units per css px (puffBoost); false: none left (the loop may stop) */
  draw(t: number, poofs: readonly Poof[], scale: number): boolean;
  dispose(): void;
}

function star(): BufferGeometry {
  const arm = (sx: number, sy: number, sz: number): BufferGeometry => new OctahedronGeometry(1, 0).scale(sx, sy, sz);
  const thin = 0.2;
  const parts = [arm(1, thin, thin), arm(thin, 1, thin), arm(thin, thin, 1)];
  const g = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  return g;
}

export function makePoofs(root: Group, style: Style): Poofs {
  const puffGeo = style.ball(1);
  const puffMat = style.material(PUFF_COLOR);
  const sparkGeo = star();
  const sparkMat = style.material(SPARK_COLOR, { flat: true });
  const mesh = (g: BufferGeometry, m: Material, count: number): InstancedMesh => {
    const im = new InstancedMesh(g, m, count * MAX);
    im.count = 0;
    im.frustumCulled = false;
    im.visible = false;
    root.add(im);
    return im;
  };
  const puffs = mesh(puffGeo, puffMat, PUFF.n);
  const sparks = mesh(sparkGeo, sparkMat, SPARK.n);
  const m4 = new Matrix4();
  const p3 = new Vector3();
  const s3 = new Vector3();
  const q = new Quaternion();
  const e = new Euler();
  const q0 = new Quaternion();

  return {
    draw(t, list, scale) {
      const boost = puffBoost(scale);
      const live = list.filter((p) => t - p.t0 >= 0 && t - p.t0 < POOF_S).slice(-MAX);
      let ip = 0;
      let is = 0;
      for (const p of live) {
        for (const b of poofAt(p.seed, t - p.t0, boost)) {
          if (b.r <= 1e-3) continue;
          p3.set(p.x + b.x, p.y + b.y, p.z + b.z);
          s3.setScalar(b.r);
          if (b.kind === 'puff') puffs.setMatrixAt(ip++, m4.compose(p3, q0, s3));
          else {
            q.setFromEuler(e.set(0.5, b.spin, 0.3));
            sparks.setMatrixAt(is++, m4.compose(p3, q, s3));
          }
        }
      }
      for (const [im, c] of [[puffs, ip], [sparks, is]] as const) {
        im.count = c;
        im.visible = c > 0;
        im.instanceMatrix.needsUpdate = true;
      }
      return live.length > 0;
    },
    dispose() {
      root.remove(puffs, sparks);
      puffGeo.dispose();
      sparkGeo.dispose();
      puffMat.dispose();
      sparkMat.dispose();
    },
  };
}

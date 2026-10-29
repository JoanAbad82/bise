// A banner scene's entrance, drawn (entrance-time.ts says when): while it plays, its ground meshes
// (a slab, the room's walls and rugs) are hidden and stood in for by their pieces, one instanced
// mesh each, cut along the cubes and rising in the wave; each thing is popped about its own foot by
// its wrapper (an identity group put in its place: its own transform, which the hover moves set,
// stays as it was); the bims land last. At its end the real ground is back, every wrapper is
// identity again and nothing more moves: the scene draws no frame at rest. The scene must sit in a
// parent at the world's origin (a banner's root, a room's scene). Owner: banner-entrance.
import { Box3, Group, InstancedMesh, type Material, Matrix4, type Mesh, type Object3D, Quaternion, Vector3 } from 'three';
import { STYLE } from './style';
import { type Grid, type Piece, type Rect, type Thing, cubeAt, gridOf, landAt, piecesOf, planFor, startsOf, thingAt, thingEnd } from './entrance-time';

/** a ground mesh to cut, and the plain colour its pieces take when its own material is a texture (the floor's planks) */
export interface GroundPart {
  readonly mesh: Mesh;
  readonly plain?: string;
}

export interface Entrance {
  /** the scene at ms from its start; false once it is built and still (then it has ended) */
  at(ms: number): boolean;
  /** a thing shown while it plays (his plugins came in late): it pops when the wave is past its cube, at once if past */
  add(w: Group): void;
  remove(w: Group): void;
  /** built at once: the real ground back, every wrapper at rest */
  end(): void;
  dispose(): void;
}

/** an identity group put in the child's place, the child in it: what the entrance moves */
export function wrapIn(child: Object3D): Group {
  const w = new Group();
  const parent = child.parent;
  parent?.add(w);
  w.add(child);
  return w;
}

const m4 = new Matrix4();
const q0 = new Quaternion();
const p3 = new Vector3();
const s3 = new Vector3();
const bx = new Box3();

const rectOf = (b: Box3): Rect => ({ x0: b.min.x, x1: b.max.x, z0: b.min.z, z1: b.max.z });

function thingOf(o: Object3D): Thing {
  o.updateMatrixWorld(true);
  bx.setFromObject(o);
  if (bx.isEmpty()) return { x: 0, z: 0, y: 0, top: 0, box: { x0: 0, x1: 0, z0: 0, z1: 0 } };
  return { x: (bx.min.x + bx.max.x) / 2, z: (bx.min.z + bx.max.z) / 2, y: bx.min.y, top: bx.max.y, box: rectOf(bx) };
}

interface Cut {
  readonly part: GroundPart;
  readonly im: InstancedMesh;
  readonly pieces: readonly Piece[];
  /** the box's middle and height */
  readonly y: number;
  readonly h: number;
  readonly own: Material | null;
}

interface Pop {
  readonly w: Group;
  readonly t: Thing;
  readonly start: number;
}

/** the entrance of a scene: its ground parts, its things' and its bims' wrappers (wrapIn), the parent the pieces go in */
export function makeEntrance(o: { readonly parent: Object3D; readonly ground: readonly GroundPart[]; readonly things: readonly Group[]; readonly bims: readonly Group[] }): Entrance {
  const boxes = o.ground.map((g) => {
    g.mesh.updateMatrixWorld(true);
    return new Box3().setFromObject(g.mesh);
  });
  const all = boxes.reduce((a, b) => a.union(b), new Box3());
  const grid: Grid = gridOf(all.isEmpty() ? { x0: -1, x1: 1, z0: -1, z1: 1 } : rectOf(all));
  const unit = STYLE.box(1, 1, 1, 0.08);
  const cuts: Cut[] = o.ground.map((part, i) => {
    const b = boxes[i] ?? new Box3();
    const pieces = piecesOf(grid, rectOf(b));
    const own = part.plain === undefined ? null : STYLE.material(part.plain);
    const im = new InstancedMesh(unit, own ?? part.mesh.material, Math.max(1, pieces.length));
    im.count = pieces.length;
    im.castShadow = part.mesh.castShadow;
    im.receiveShadow = part.mesh.receiveShadow;
    im.frustumCulled = false;
    part.mesh.visible = false;
    o.parent.add(im);
    return { part, im, pieces, y: (b.min.y + b.max.y) / 2, h: b.max.y - b.min.y, own };
  });
  const things = o.things.map(thingOf);
  const starts = startsOf(grid, things);
  const pops: Pop[] = o.things.map((w, i) => ({ w, t: things[i] ?? thingOf(w), start: starts[i] ?? 0 }));
  const bims = o.bims.map((w) => ({ w, t: thingOf(w) }));
  const plan = planFor(grid, things, starts, bims.length);
  let done = plan.done;
  let now = 0;
  let ended = false;

  /** a wrapper scaled (s, sy) about its foot and lifted by y */
  const about = (w: Group, t: Thing, s: number, sy: number, y: number): void => {
    w.scale.set(s, sy, s);
    w.position.set(t.x - s * t.x, t.y + y - sy * t.y, t.z - s * t.z);
  };
  const rest = (w: Group): void => {
    w.position.set(0, 0, 0);
    w.scale.set(1, 1, 1);
    w.visible = true;
  };

  const api: Entrance = {
    at(ms) {
      if (ended) return false;
      now = ms;
      if (ms >= done) {
        api.end();
        return false;
      }
      for (const c of cuts) {
        c.pieces.forEach((p, k) => {
          const cell = grid.cells[p.cell];
          if (cell === undefined) return;
          const a = cubeAt(ms, cell.start, grid.side);
          // the cube's column scales about its point on the floor (y 0), its middle in x and z
          m4.compose(p3.set(cell.x + a.s * (p.x - cell.x), a.s * c.y + a.y, cell.z + a.s * (p.z - cell.z)), q0, s3.set(a.s * p.w, a.s * c.h, a.s * p.d));
          c.im.setMatrixAt(k, m4);
        });
        c.im.instanceMatrix.needsUpdate = true;
      }
      for (const p of pops) {
        const d = thingAt(ms, { x: p.t.x, z: p.t.z, start: p.start }, grid.side);
        about(p.w, p.t, d.s, d.s * d.sy, d.y);
      }
      for (const b of bims) {
        const l = landAt(ms, plan.bim);
        b.w.visible = l.shown;
        // its fall, then one squash on landing (the islands' bim, its rig's squash as a scale)
        const sy = 1 - 0.5 * l.k;
        about(b.w, b.t, 1 / Math.sqrt(sy), sy, l.y);
      }
      return true;
    },
    add(w) {
      if (ended) return;
      const t = thingOf(w);
      const start = Math.max(startsOf(grid, [t])[0] ?? 0, now);
      pops.push({ w, t, start });
      done = Math.max(done, thingEnd(start));
      const d = thingAt(now, { x: t.x, z: t.z, start }, grid.side);
      about(w, t, d.s, d.s * d.sy, d.y);
    },
    remove(w) {
      const i = pops.findIndex((p) => p.w === w);
      if (i >= 0) pops.splice(i, 1);
    },
    end() {
      if (ended) return;
      ended = true;
      for (const c of cuts) {
        o.parent.remove(c.im);
        c.part.mesh.visible = true;
      }
      for (const p of pops) rest(p.w);
      for (const b of bims) rest(b.w);
    },
    dispose() {
      api.end();
      unit.dispose();
      for (const c of cuts) {
        c.own?.dispose();
        c.im.dispose();
      }
    },
  };
  api.at(0);
  return api;
}

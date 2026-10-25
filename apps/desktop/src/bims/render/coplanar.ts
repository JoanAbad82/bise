// Z-fight finder for a prop: two meshes whose faces lie in the same plane (within eps) and overlap
// draw in turns, frame to frame (the workshop's old car, bims-vespa). Pure: it reads the meshes'
// triangles in world space and returns the clashes; the map tests call it on a built prop.
import { Box3, type BufferGeometry, Mesh, type Object3D, Vector3 } from 'three';

interface Tri {
  readonly p: readonly [Vector3, Vector3, Vector3];
  readonly n: Vector3;
  /** the plane: n·x = d */
  readonly d: number;
}

export interface Clash {
  readonly a: string;
  readonly b: string;
  /** the overlap's area, in square units */
  readonly area: number;
  /** the shared plane's normal's y, from a's face: -1 a face only seen from under the floor */
  readonly ny: number;
}

function trisOf(geo: BufferGeometry, mesh: Mesh, out: Tri[]): void {
  const pos = geo.getAttribute('position');
  const idx = geo.getIndex();
  const n = idx ? idx.count : pos.count;
  const at = (i: number): Vector3 => new Vector3().fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(mesh.matrixWorld);
  for (let i = 0; i + 2 < n; i += 3) {
    const p: [Vector3, Vector3, Vector3] = [at(i), at(i + 1), at(i + 2)];
    const nn = new Vector3().subVectors(p[1], p[0]).cross(new Vector3().subVectors(p[2], p[0]));
    const len = nn.length();
    if (len < 1e-9) continue;
    nn.divideScalar(len);
    out.push({ p, n: nn, d: nn.dot(p[0]) });
  }
}

type P2 = readonly [number, number];

/** the triangle's points on the plane its normal's biggest axis drops */
function flat(t: Tri, axis: number): P2[] {
  return t.p.map((v) => (axis === 0 ? [v.y, v.z] : axis === 1 ? [v.z, v.x] : [v.x, v.y]) as P2);
}

const cross2 = (o: P2, a: P2, b: P2): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

function area2(poly: readonly P2[]): number {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i] as P2;
    const b = poly[(i + 1) % poly.length] as P2;
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}

/** the area two flat triangles share (Sutherland-Hodgman: clip one by the other's edges) */
function overlap(a: P2[], b: P2[]): number {
  const clip = area2(b) < 0 ? [...b].reverse() : b;
  let poly: P2[] = area2(a) < 0 ? [...a].reverse() : a;
  for (let i = 0; i < 3 && poly.length > 0; i++) {
    const e0 = clip[i] as P2;
    const e1 = clip[(i + 1) % 3] as P2;
    const next: P2[] = [];
    for (let j = 0; j < poly.length; j++) {
      const cur = poly[j] as P2;
      const prev = poly[(j + poly.length - 1) % poly.length] as P2;
      const cIn = cross2(e0, e1, cur) >= 0;
      const pIn = cross2(e0, e1, prev) >= 0;
      if (cIn !== pIn) {
        const f = cross2(e0, e1, prev) / (cross2(e0, e1, prev) - cross2(e0, e1, cur));
        next.push([prev[0] + (cur[0] - prev[0]) * f, prev[1] + (cur[1] - prev[1]) * f]);
      }
      if (cIn) next.push(cur);
    }
    poly = next;
  }
  return poly.length < 3 ? 0 : Math.abs(area2(poly));
}

/**
 * Every pair of meshes under root with two faces in one plane (facing either way, or the same way
 * with `facing: 'same'`: a piece's underside on a top is culled, only two faces turned the same way
 * draw in turns; their planes
 * apart by less than eps) that overlap by more than minArea: what z-fights. One clash per pair.
 */
export function coplanarClashes(root: Object3D, eps = 0.005, minArea = 1e-6, facing: 'either' | 'same' = 'either'): Clash[] {
  root.updateMatrixWorld(true);
  const meshes: Mesh[] = [];
  root.traverse((o) => { if (o instanceof Mesh) meshes.push(o as Mesh); });
  const tris = meshes.map((m) => {
    const out: Tri[] = [];
    trisOf(m.geometry, m, out);
    return out;
  });
  const boxes = meshes.map((m) => new Box3().setFromObject(m).expandByScalar(eps));
  const name = (i: number): string => meshes[i]?.name || `mesh ${String(i)}`;
  const found: Clash[] = [];
  for (let i = 0; i < meshes.length; i++) {
    for (let j = i + 1; j < meshes.length; j++) {
      // two meshes whose bounds don't touch share no face
      if (!(boxes[i] as Box3).intersectsBox(boxes[j] as Box3)) continue;
      const c = clashOf(tris[i] ?? [], tris[j] ?? [], eps, minArea, facing === 'same');
      if (c) found.push({ a: name(i), b: name(j), ...c });
    }
  }
  return found;
}

/** the overlap of the first two faces of a and b in one plane and a's normal's y, or undefined */
function clashOf(as: readonly Tri[], bs: readonly Tri[], eps: number, minArea: number, same: boolean): { area: number; ny: number } | undefined {
  for (const a of as) {
    for (const b of bs) {
      const dot = a.n.dot(b.n);
      if ((same ? dot : Math.abs(dot)) < 0.9995) continue;
      if (b.p.some((v) => Math.abs(a.n.dot(v) - a.d) > eps)) continue;
      const ax = Math.abs(a.n.x) >= Math.abs(a.n.y) && Math.abs(a.n.x) >= Math.abs(a.n.z) ? 0 : Math.abs(a.n.y) >= Math.abs(a.n.z) ? 1 : 2;
      const area = overlap(flat(a, ax), flat(b, ax));
      if (area > minArea) return { area, ny: a.n.y };
    }
  }
  return undefined;
}

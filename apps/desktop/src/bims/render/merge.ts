// One object out of many (the town, page bims-maps v9: « chaque bureau est fusionné en un seul objet
// tant qu'on ne zoome pas dessus »): every plain matte mesh under a root (no texture, no glow, not
// see-through) baked into one geometry with its colour per vertex and one material; the others
// (the floor's planks, a lit screen, the glass) merged per material. The town draws each far office,
// its silhouettes and its scenery this way: tens of draw calls for the whole town instead of
// thousands. The source meshes' geometries are disposed; the kept materials are the caller's. Owner: maps-e.
import { BufferAttribute, type BufferGeometry, Group, type Material, type Matrix4, Mesh, MeshLambertMaterial, MeshStandardMaterial, type Object3D } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Style } from './style';

/**
 * a material whose colour can go into the vertices: matte, opaque, no texture, no glow, and not one
 * that changes while it is drawn (userData.live: a desk's screen and lamp, furniture.ts)
 */
function bakeable(m: Material): m is MeshStandardMaterial | MeshLambertMaterial {
  if (!(m instanceof MeshStandardMaterial || m instanceof MeshLambertMaterial)) return false;
  if (m.userData.live === true) return false;
  if (m.transparent || m.map !== null) return false;
  return m.emissiveIntensity === 0 || (m.emissive.r === 0 && m.emissive.g === 0 && m.emissive.b === 0);
}

/** a mesh's geometry in the root's frame, unindexed, with only position and normal (and uv, colour when kept) */
function prepared(src: BufferGeometry, at: Matrix4, uv: boolean, color = false): BufferGeometry {
  const g = src.index !== null ? src.toNonIndexed() : src.clone();
  g.applyMatrix4(at);
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal' && !(uv && name === 'uv') && !(color && name === 'color')) g.deleteAttribute(name);
  }
  if (!g.hasAttribute('normal')) g.computeVertexNormals();
  if (uv && !g.hasAttribute('uv')) g.setAttribute('uv', new BufferAttribute(new Float32Array((g.getAttribute('position').count) * 2), 2));
  g.morphAttributes = {};
  return g;
}

/** a geometry painted one colour (linear, as three keeps a material's colour) */
function painted(g: BufferGeometry, r: number, gg: number, b: number): BufferGeometry {
  const n = g.getAttribute('position').count;
  const c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    c[i * 3] = r;
    c[i * 3 + 1] = gg;
    c[i * 3 + 2] = b;
  }
  g.setAttribute('color', new BufferAttribute(c, 3));
  return g;
}

/** a geometry's own vertex colours times a colour (rgb, whatever its colour's item size was) */
function tinted(g: BufferGeometry, r: number, gg: number, b: number): BufferGeometry {
  const src = g.getAttribute('color');
  const n = g.getAttribute('position').count;
  const c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    c[i * 3] = src.getX(i) * r;
    c[i * 3 + 1] = src.getY(i) * gg;
    c[i * 3 + 2] = src.getZ(i) * b;
  }
  g.setAttribute('color', new BufferAttribute(c, 3));
  return g;
}

/** The vertex-coloured material of one merged object (clay's matte, or iso's flat Lambert). */
export function bakedMaterial(style: Style): Material {
  return style.name === 'clay'
    ? new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 })
    : new MeshLambertMaterial({ vertexColors: true });
}

export interface Merged {
  readonly group: Group;
  /** the baked object's material (the town dims it while it dives into another office) */
  readonly baked: Material | null;
  /** how many meshes went in, and how many came out (the draw calls) */
  readonly from: number;
  readonly to: number;
  dispose(): void;
}

/**
 * Every visible mesh under `root` (its world matrices as they are now) merged: the plain ones into
 * one vertex-coloured mesh, the rest one mesh per material. `shadows`: the merged meshes cast and
 * take the sun's shadow. Lights and the rest that is not a mesh are left out.
 */
export function mergeRoot(root: Object3D, style: Style, shadows: boolean): Merged {
  root.updateMatrixWorld(true);
  const plain: BufferGeometry[] = [];
  const byMat = new Map<Material, BufferGeometry[]>();
  let from = 0;
  root.traverseVisible((obj) => {
    if (!(obj instanceof Mesh)) return;
    const geo = obj.geometry as BufferGeometry;
    const m = obj.material as Material | Material[];
    if (Array.isArray(m)) return;
    from++;
    if (bakeable(m)) {
      // an object merged already (its colours in its vertices, its material white: cozy.ts mergeInto)
      // keeps them, tinted by its material; painted one colour, the town's merge of the office turned
      // the cozy plants and pots white (bims m_32697)
      const own = m.vertexColors && geo.hasAttribute('color');
      plain.push(own ? tinted(prepared(geo, obj.matrixWorld, false, true), m.color.r, m.color.g, m.color.b) : painted(prepared(geo, obj.matrixWorld, false), m.color.r, m.color.g, m.color.b));
      return;
    }
    const uv = 'map' in m && m.map !== null && m.map !== undefined;
    const list = byMat.get(m) ?? [];
    list.push(prepared(geo, obj.matrixWorld, uv));
    byMat.set(m, list);
  });
  const group = new Group();
  const made: BufferGeometry[] = [];
  let baked: Material | null = null;
  const put = (geos: BufferGeometry[], mat: Material): void => {
    const one = geos.length === 1 ? geos[0] : undefined;
    // three's merge gives null for geometries it can't join (prepared() makes them alike)
    const g = (one ?? mergeGeometries(geos, false)) as BufferGeometry | null;
    for (const x of geos) if (x !== g) x.dispose();
    if (g === null) return;
    made.push(g);
    const mesh = new Mesh(g, mat);
    mesh.castShadow = shadows;
    mesh.receiveShadow = shadows;
    group.add(mesh);
  };
  if (plain.length > 0) {
    baked = bakedMaterial(style);
    put(plain, baked);
  }
  for (const [mat, geos] of byMat) put(geos, mat);
  return {
    group,
    baked,
    from,
    to: group.children.length,
    dispose() {
      for (const g of made) g.dispose();
      baked?.dispose();
    },
  };
}

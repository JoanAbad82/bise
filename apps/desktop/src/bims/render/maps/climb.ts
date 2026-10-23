// The climbing gym's look (render/maps/look.ts; its plan: maps/climb.ts; page bims-climb v4, bims'
// brief and m_37952). An old Paris hall turned bouldering gym, never a brand: a concrete floor in the
// hall and wooden planks on the café side, brick walls round the hall with steel columns and a beam on
// top (the glass roof cut away), a low glass rail between the hall and the café. The wall: ONE folded
// surface down the hall's left side and along its back (climbwall.ts facets, flat-shaded light greys
// with a few charcoal zones), its top capped back to the brick, its two ends closed; each problem's
// holds in its colour, the other holds round them, the big triangular volumes, one run of thick blue
// mats at its foot. The café: long wooden tables with a stool per seat, the café bar along the front
// (smoothies, a coffee machine, fruit), main at the reception counter with the shoe shelves beside it,
// the stretching zone's yoga mats and foam rollers (the nap place), the route setters' board on its
// pillar. Past the back edge: Paris stone facades, zinc mansard roofs, terracotta chimney pots, their
// windows lit at night. Out front: the pavement and its cobbled strip, a green Morris column, bistro
// tables, street trees in grates, green lampposts lit at night, a bike rack. The growth's 14 pieces:
// THINGS in maps/climb.ts. Never the app's pink or red. Owner: bims-climb.
import {
  BufferGeometry, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, type Object3D, PointLight, Shape,
} from 'three';
import type { Office, Pt, Spot } from '../../model';
import { type ClimbOffice, CAFE_WALL_H, COUNTER, HALL_H, HANGING, SEAT_DX, framesSpan, shoeShelves } from '../../maps/climb';
import {
  HOLD_COLS, MAT_H, ROUTE_COLS, type V3, WALL_MID, WALL_TOP, bellAt, decorHolds, facets, goldenHold, routeHolds, routes, volumeFaces, volumes, wallVertex,
} from '../../climbwall';
import { BELL_STAGE, GOLDEN_STAGE } from '../../climb';
import { bedStage, bedsAt, BASE_BEDS } from '../../growth';
import { boxAhead, chair, deskLamp, laptop } from '../furniture';
import { type Kit, glyph, onFloor } from '../kit';
import { APRON_HALF, terraceSlab } from '../decor';
import { LAPTOP } from '../laptop';
import { DAY, NIGHT, WORLD, hash, HOODIE, type Palette } from '../palette';
import { cones, deckChairs, garden } from '../stages';
import { bed, frameXs, plant } from '../cozy';
import { bedGroup } from '../nap';
import type { Build, DeskHandles, MapLook } from './look';

/** its colours: planks and brick, the pavement's stone for the ground */
const CLIMB_DAY: Palette = {
  ...DAY,
  floor: '#ecd9b8', wall: '#c27a55', wallTop: '#a9643f', desk: '#a87545', deskTop: '#d2a46c',
  island: '#2a9d8f', islandTop: '#fffaf0', grass: '#d8d2c5', dirt: '#8f6a4a', terrace: '#cfc8ba', rug: '#9b8fe0', islandRug: '#e6dccb',
};
const CLIMB_NIGHT: Palette = {
  ...NIGHT,
  floor: '#7d6a55', wall: '#7a4a35', wallTop: '#6a3f2c', desk: '#8f6440', deskTop: '#ad8558',
  island: '#2a7d72', islandTop: '#e8dfcc', grass: '#6f6b63', dirt: '#5e4a33', terrace: '#6d665c', islandRug: '#6b5b4a',
};

const BRICK = '#c27a55';
const MORTAR = '#e2c2a6';
const STEEL = '#3d4247';
const CONCRETE = '#c9c4bb';
const MAT = '#3d78a8';
const MAT_SEAM = '#2f5f87';
const STONE = '#eadfc8';
const ZINC = '#8e9aa3';
const TERRACOTTA = '#c98a3a';
const PARIS_GREEN = '#2f5a45';
const COBBLE = '#9aa3aa';
/** the wall's zones: light greys, a few charcoal */
const WALL_GREYS = ['#ecebe7', '#e0ded8', '#d6d3cc', '#cdd3d8', '#e6e2da'] as const;
const CHARCOAL = '#4a4f55';

const night = (k: Kit): boolean => k.pal.pendants;
const gymOf = (o: Office): ClimbOffice => o as ClimbOffice;

/** a mesh from triangles (flat-shaded, one colour each), tagged for the laws */
function triMesh(tris: readonly (readonly [V3, V3, V3, string])[], tag: string): Mesh {
  const pos: number[] = [];
  const col: number[] = [];
  const c = (h: string): [number, number, number] => {
    const n = Number.parseInt(h.slice(1), 16);
    // three's vertex colours are linear: the hex is sRGB
    const lin = (x: number): number => ((x / 255) <= 0.04045 ? x / 255 / 12.92 : ((x / 255 + 0.055) / 1.055) ** 2.4);
    return [lin((n >> 16) & 255), lin((n >> 8) & 255), lin(n & 255)];
  };
  for (const [a, b, cc, h] of tris) {
    const rgb = c(h);
    for (const p of [a, b, cc]) {
      pos.push(p.x, p.y, p.z);
      col.push(...rgb);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const m = new Mesh(geo, new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0, side: DoubleSide }));
  m.userData[tag] = true;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** brick: a wall box, its mortar courses raised on its room side */
function brick(k: Kit, parent: Object3D, x: number, z: number, w: number, h: number, d: number, face: 'x' | 'z'): void {
  const { style } = k;
  k.add(style.box(w, h, d, 0.02), k.mat(BRICK), parent, x, h / 2, z);
  for (let y = 0.35; y < h - 0.1; y += 0.42) {
    if (face === 'z') k.add(style.box(w - 0.04, 0.025, 0.012), k.mat(MORTAR), parent, x, y, z + d / 2 + 0.006);
    else k.add(style.box(0.012, 0.025, d - 0.04), k.mat(MORTAR), parent, x + w / 2 + 0.006, y, z);
  }
}

/** the hall and the café's floors, the brick and steel, the glass rail, the wall and its mats, the city round it */
function shell(b: Build): void {
  const { k, root, o: o0 } = b;
  const o = gymOf(o0);
  const { style, pal } = k;
  const { x0, W, D, ox0, gym } = o;
  // floors: the hall's concrete, the café's planks
  const hw = ox0 - x0;
  k.add(style.box(hw, 0.14, D, 0.02), k.mat(CONCRETE), root, x0 + hw / 2, -0.05, D / 2);
  const cw = W - hw;
  const floor = new Mesh(style.box(cw, 0.14, D), style.floor(pal.floor, cw, D));
  floor.position.set(ox0 + cw / 2, -0.05, D / 2);
  root.add(floor);

  // brick round the hall: its back and its left side (tall behind the wall, low past its front), the café's back
  const wallEnd = Math.max(...gym.line.map((p) => p.z));
  // the hall's back is tall behind the climbing wall, then steps down to the café's height (a napper's head shows past it)
  const tallTo = Math.max(...gym.line.map((p) => p.x)) + 0.25;
  brick(k, root, (x0 - 0.2 + tallTo) / 2, -0.1, tallTo - x0 + 0.2, HALL_H, 0.2, 'z');
  brick(k, root, (tallTo + ox0) / 2, -0.1, ox0 - tallTo, CAFE_WALL_H, 0.2, 'z');
  brick(k, root, x0 - 0.1, wallEnd / 2, 0.2, HALL_H, wallEnd, 'x');
  brick(k, root, x0 - 0.1, (wallEnd + D) / 2 + 0.05, 0.2, 1.0, D - wallEnd + 0.1, 'x');
  brick(k, root, ox0 + cw / 2, -0.1, cw, CAFE_WALL_H, 0.2, 'z');
  // steel: the hall's corner columns and the beams on its brick (the glass roof's frame, cut away)
  for (const [x, z, h] of [[x0 - 0.1, -0.1, HALL_H + 0.25], [x0 - 0.1, wallEnd, HALL_H + 0.25]] as const) {
    k.add(style.box(0.24, h, 0.24, 0.02), k.mat(STEEL), root, x, h / 2, z);
  }
  k.add(style.box(tallTo - x0 + 0.3, 0.2, 0.26, 0.02), k.mat(STEEL), root, (x0 - 0.3 + tallTo) / 2, HALL_H + 0.1, -0.1);
  k.add(style.box(0.26, 0.2, wallEnd + 0.1, 0.02), k.mat(STEEL), root, x0 - 0.1, HALL_H + 0.1, wallEnd / 2);
  // the glass rail between the hall and the café, open on the back corridor
  const glass = style.material(pal.window, { opacity: 0.35 });
  const gap = [o.crossBack - 0.7, o.crossBack + 0.7] as const;
  for (const [z0, z1] of [[0.05, gap[0]], [gap[1], D - 0.05]] as const) {
    k.add(style.box(0.03, 0.8, z1 - z0), glass, root, ox0, 0.45, (z0 + z1) / 2);
    k.add(style.box(0.06, 0.05, z1 - z0 + 0.04), k.mat(STEEL), root, ox0, 0.88, (z0 + z1) / 2);
    for (const z of [z0, z1]) k.add(style.box(0.06, 0.9, 0.06), k.mat(STEEL), root, ox0, 0.45, z);
  }

  wall(root, o);
  mats(k, root, o);
  paris(k, root, o, night(k));
  street(k, root, o);
  // the door mat at the entrance
  k.add(style.box(1.1, 0.04, 0.5), k.mat(WORLD.mat), root, o.door.x, 0.03, D - 0.25);
}

/** the climbing wall: its facets, its top capped back to the brick, its two ends closed */
function wall(root: Object3D, o: ClimbOffice): void {
  const g = o.gym;
  const fs = facets(g);
  const zone = (panel: number): number => {
    // a zone changes where the profile does
    let z = 0;
    for (let i = 1; i <= panel; i++) {
      const a = g.line[i - 1];
      const b = g.line[i];
      if (a && b && (a.o1 !== b.o1 || a.o2 !== b.o2)) z++;
    }
    return z;
  };
  const tris = fs.map((f) => {
    const z = zone(f.panel);
    const a = g.line[f.panel];
    const steep = a !== undefined && a.o2 > 1.0;
    const colour = steep || z % 5 === 3 ? CHARCOAL : (WALL_GREYS[(z + f.tier) % WALL_GREYS.length] as string);
    return [f.a, f.b, f.c, colour] as const;
  });
  root.add(triMesh(tris, 'climbWall'));
  // the top: from each top vertex back to the brick, a ledge
  const cap: (readonly [V3, V3, V3, string])[] = [];
  const back = (p: V3): V3 => (p.x < o.x0 + 1.2 && p.z > 1.0 ? { x: o.x0, y: WALL_TOP, z: p.z } : p.z < 1.2 && p.x > o.x0 + 1.2 ? { x: p.x, y: WALL_TOP, z: 0 } : { x: o.x0, y: WALL_TOP, z: 0 });
  for (let i = 0; i + 1 < g.line.length; i++) {
    const a = wallVertex(g.line[i] as never, 2);
    const b = wallVertex(g.line[i + 1] as never, 2);
    cap.push([a, back(a), b, '#bdb8ae'], [b, back(a), back(b), '#bdb8ae']);
  }
  // the corner's last triangle to the brick's corner
  const ci = g.line.findIndex((p) => p.nx > 0 && p.nz > 0);
  const c0 = wallVertex(g.line[ci] as never, 2);
  const c1 = wallVertex(g.line[ci + 1] as never, 2);
  cap.push([back(c0), { x: o.x0, y: WALL_TOP, z: 0 }, back(c1), '#bdb8ae']);
  root.add(triMesh(cap, 'climbCap'));
  // its two ends: the profile closed back to the brick
  const first = g.line[0];
  const last = g.line.at(-1);
  const ends: (readonly [V3, V3, V3, string])[] = [];
  if (first) {
    const [p0, p1, p2] = [wallVertex(first, 0), wallVertex(first, 1), wallVertex(first, 2)];
    const q = (p: V3): V3 => ({ x: o.x0, y: p.y, z: p.z });
    ends.push([p0, q(p0), p1, '#bdb8ae'], [p1, q(p0), q(p1), '#bdb8ae'], [p1, q(p1), p2, '#bdb8ae'], [p2, q(p1), q(p2), '#bdb8ae']);
  }
  if (last) {
    const [p0, p1, p2] = [wallVertex(last, 0), wallVertex(last, 1), wallVertex(last, 2)];
    const q = (p: V3): V3 => ({ x: p.x, y: p.y, z: 0 });
    ends.push([p0, q(p0), p1, '#bdb8ae'], [p1, q(p0), q(p1), '#bdb8ae'], [p1, q(p1), p2, '#bdb8ae'], [p2, q(p1), q(p2), '#bdb8ae']);
  }
  root.add(triMesh(ends, 'climbCap'));
}

/** the mats along the wall's foot, a seam between two, the corner's cut along the chamfer */
function mats(k: Kit, root: Object3D, o: ClimbOffice): void {
  const g = o.gym;
  const ci = g.line.findIndex((p) => p.nx > 0 && p.nz > 0);
  const c0 = g.line[ci];
  const c1 = g.line[ci + 1];
  g.mats.forEach((m, i) => {
    let geo: BufferGeometry;
    if (i === 0 && c0 && c1) {
      // the chamfer's foot, and its surface at the mats' top: the square cut along it
      const cut = Math.hypot(c1.x - c0.x, c1.z - c0.z) * Math.SQRT1_2 + (Math.max(0, c0.o1) * MAT_H) / WALL_MID + 0.04;
      const lx = c0.x;
      const bz = c1.z;
      const lim = (lx + bz) + cut * Math.SQRT2;
      const s = new Shape();
      const pts: [number, number][] = [[lim - m.z1, m.z1], [m.x1, m.z1], [m.x1, m.z0], [Math.max(m.x0, lim - m.z0), m.z0], [m.x0, Math.max(m.z0, lim - m.x0)], [m.x0, m.z1]];
      const clean = pts.filter(([x, z], j) => j === 0 || Math.hypot(x - (pts[j - 1]?.[0] ?? 0), z - (pts[j - 1]?.[1] ?? 0)) > 1e-4);
      clean.forEach(([x, z], j) => (j === 0 ? s.moveTo(x, -z) : s.lineTo(x, -z)));
      geo = new ExtrudeGeometry(s, { depth: MAT_H, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      const mesh = new Mesh(geo, k.mat(MAT));
      mesh.userData.climbMat = true;
      root.add(mesh);
      return;
    }
    const mesh = k.add(k.style.box(m.x1 - m.x0, MAT_H, m.z1 - m.z0, 0.06), k.mat(MAT), root, (m.x0 + m.x1) / 2, MAT_H / 2, (m.z0 + m.z1) / 2);
    mesh.userData.climbMat = true;
    // a darker cover strip along its outer edge
    const outerX = m.x1 - m.x0 < m.z1 - m.z0;
    if (outerX) k.add(k.style.box(0.08, 0.02, m.z1 - m.z0 - 0.1), k.mat(MAT_SEAM), root, m.x1 - 0.12, MAT_H + 0.005, (m.z0 + m.z1) / 2);
    else k.add(k.style.box(m.x1 - m.x0 - 0.1, 0.02, 0.08), k.mat(MAT_SEAM), root, (m.x0 + m.x1) / 2, MAT_H + 0.005, m.z1 - 0.12);
  });
}

/** a hold: a small raised stone on the surface */
function hold(k: Kit, parent: Object3D, p: V3, n: V3, r: number, colour: string, seed: number): Mesh {
  const geo = k.style.ball(r);
  const m = k.add(geo, k.mat(colour), parent, p.x + n.x * r * 0.45, p.y + n.y * r * 0.45, p.z + n.z * r * 0.45);
  m.scale.set(1.15, 0.8, 0.7);
  m.lookAt(p.x + n.x, p.y + n.y, p.z + n.z);
  m.rotateZ((seed % 7) * 0.7);
  m.userData.hold = true;
  return m;
}

/** the holds, the volumes (each in its stage's group), the bells and the golden hold */
function holds(b: Build): void {
  const { k, o: o0 } = b;
  const o = gymOf(o0);
  const g = o.gym;
  const s0 = b.stage(0);
  if (!s0) return;
  let i = 0;
  for (const r of routes(g)) for (const h of routeHolds(r)) hold(k, s0, h.p, h.n, h.r, ROUTE_COLS[h.colour] ?? WORLD.paper, i++);
  for (const h of decorHolds(g)) hold(k, s0, h.p, h.n, h.r, HOLD_COLS[h.colour] ?? WORLD.paper, i++);
  for (const v of volumes(g)) {
    const parent = b.stage(v.stage) ?? null;
    if (!parent) continue;
    parent.add(triMesh(volumeFaces(v).map((f) => [f.a, f.b, f.c, v.colour] as const), 'climbVolume'));
  }
  // 7: the bells, a small brass dome at each problem's top
  const s7 = b.stage(BELL_STAGE);
  if (s7) {
    for (const r of routes(g)) {
      const bell = bellAt(r);
      if (!bell) continue;
      const n = { x: r.n.x, y: 0, z: r.n.z };
      const m = k.add(k.style.cap(0.075, 0.5), k.mat(WORLD.gold), s7, bell.at.x + n.x * 0.01, bell.at.y + 0.075, bell.at.z + n.z * 0.01);
      m.rotation.x = Math.PI;
      m.userData.bell = true;
    }
  }
  // 14: the golden hold at the big wall's top
  const s14 = b.stage(GOLDEN_STAGE);
  const gold = goldenHold(g);
  if (s14 && gold) hold(k, s14, gold.p, gold.n, gold.r, WORLD.gold, 3);
}

/** Paris past the back edge: stone facades over the café, zinc mansards, chimney pots; windows lit at night */
function paris(k: Kit, root: Object3D, o: ClimbOffice, n: boolean): void {
  const { style } = k;
  const win = k.glow('#ffcf7a', { night: 0.85 });
  const slate = k.mat('#5c677d');
  const x1 = o.x0 + o.W;
  let x = o.ox0 - 0.3;
  let i = 0;
  while (x < x1 - 1.0) {
    const w = Math.min(3.4 + (hash(`facade${String(i)}`) % 6) * 0.15, x1 + 0.6 - x);
    const h = 2.3 + (hash(`fh${String(i)}`) % 5) * 0.12;
    const z = -0.85;
    const cx = x + w / 2;
    k.add(style.box(w - 0.06, h, 1.0, 0.02), k.mat(i % 2 ? STONE : '#e3d5bb'), root, cx, h / 2, z);
    // two rows of tall windows, the upper with a balcony rail
    const cols = Math.max(2, Math.floor(w / 0.75));
    for (let c = 0; c < cols; c++) {
      const wx = x + (w * (c + 0.5)) / cols;
      for (const wy of [h * 0.35, h * 0.72]) k.add(style.box(0.3, 0.42, 0.03), (hash(`w${String(i)}${String(c)}${String(wy)}`) % 3 === 0 && n) || !n ? (n ? win : slate) : slate, root, wx, wy, z + 0.515);
    }
    k.add(style.box(w - 0.2, 0.04, 0.12), k.mat(STEEL), root, cx, h * 0.6, z + 0.56);
    // the zinc mansard and its chimney pots
    const roof = k.add(style.box(w - 0.06, 0.55, 0.85, 0.03), k.mat(ZINC), root, cx, h + 0.22, z - 0.08);
    roof.rotation.x = -0.32;
    for (const dx of [-w / 3, w / 3]) {
      k.add(style.box(0.35, 0.4, 0.28, 0.03), k.mat(STONE), root, cx + dx, h + 0.6, z - 0.25);
      for (const pz of [-0.07, 0.07]) k.add(style.cylinder(0.05, 0.16), k.mat(TERRACOTTA), root, cx + dx + pz, h + 0.88, z - 0.25);
    }
    x += w;
    i++;
  }
}

/** a green Paris lamppost, lit at night */
function lamppost(k: Kit, parent: Object3D, x: number, z: number): void {
  const { style } = k;
  k.add(style.cylinder(0.05, 2.3), k.mat(PARIS_GREEN), parent, x, 1.15, z);
  k.add(style.box(0.24, 0.3, 0.24, 0.04), k.glow('#ffe7a8', { night: 1.0 }), parent, x, 2.42, z);
  k.add(style.cap(0.17, 0.5), k.mat(PARIS_GREEN), parent, x, 2.57, z);
  const l = k.light(new PointLight('#ffcf7a', 2.6, 4.0, 1.6));
  l.position.set(x, 2.2, z);
  parent.add(l);
}

/** a street tree in its iron grate */
function streetTree(k: Kit, parent: Object3D, x: number, z: number, size: number): void {
  const { style } = k;
  k.add(style.box(0.8, 0.03, 0.8), k.mat('#5c677d'), parent, x, 0.02, z);
  k.add(style.cylinder(0.07, 1.7 * size), k.mat(WORLD.trunk), parent, x, 0.85 * size, z);
  const c = k.add(style.ball(0.62 * size), k.mat('#5fb35a'), parent, x, 1.9 * size, z);
  c.scale.y = 0.85;
}

/** the street out front: the pavement's kerb and the cobbled strip, a Morris column, bistro tables, trees, lampposts, a bike rack */
function street(k: Kit, root: Object3D, o: ClimbOffice): void {
  const { style } = k;
  const { x0, W, D, ox0 } = o;
  const sx0 = x0 - 1.0;
  const sx1 = x0 + W + 1.0;
  // past the pavement (the terrace slab, decor.ts terraceSlab): the kerb, the cobbles and their rows; open where the town's path comes in at the door (decor.ts pathEnd)
  const zs = terraceSlab(o).z1 + 0.43;
  const gap = [o.door.x - APRON_HALF - 0.1, o.door.x + APRON_HALF + 0.1] as const;
  for (const [a, b] of [[sx0, gap[0]], [gap[1], sx1]] as const) {
    k.add(style.box(b - a, 0.06, 0.15), k.mat('#ebe4d6'), root, (a + b) / 2, 0.03, zs - 0.33);
    k.add(style.box(b - a, 0.03, 0.48), k.mat(COBBLE), root, (a + b) / 2, 0.015, zs);
    for (let x = a + 0.25; x < b - 0.1; x += 0.45) k.add(style.box(0.025, 0.02, 0.44), k.mat('#7d8790'), root, x, 0.035, zs);
  }
  // the Morris column, in front of the hall
  const mx = x0 + 7.6;
  const mz = D + 2.1;
  k.add(style.cylinder(0.32, 1.7), k.mat(PARIS_GREEN), root, mx, 0.85, mz);
  k.add(style.cylinder(0.335, 0.85), k.mat('#f1e3c9'), root, mx, 1.0, mz);
  for (const [c, a] of [['#ffd166', 0], ['#6cb4ee', 1.6], ['#9b8fe0', 3.2]] as const) {
    const p = k.add(style.box(0.28, 0.4, 0.02), k.mat(c), root, mx + Math.sin(a) * 0.345, 1.0, mz + Math.cos(a) * 0.345);
    p.rotation.y = a;
  }
  k.add(style.cap(0.36, 0.5), k.mat(PARIS_GREEN), root, mx, 1.7, mz);
  k.add(style.ball(0.06), k.mat(PARIS_GREEN), root, mx, 2.05, mz);
  // bistro tables and their chairs, in front of the hall
  for (const tx of [x0 + 2.3, x0 + 4.6]) {
    const tz = D + 2.0;
    k.add(style.cylinder(0.04, 0.7), k.mat(STEEL), root, tx, 0.35, tz);
    k.add(style.cylinder(0.3, 0.04), k.mat('#ebe4d6'), root, tx, 0.72, tz);
    for (const d of [-0.5, 0.5]) {
      k.add(style.box(0.32, 0.05, 0.32, 0.02), k.mat('#c98a3a'), root, tx + d, 0.42, tz);
      k.add(style.box(0.05, 0.42, 0.05), k.mat(STEEL), root, tx + d, 0.21, tz);
      k.add(style.box(0.05, 0.36, 0.3, 0.02), k.mat('#c98a3a'), root, tx + d + (d < 0 ? -0.15 : 0.15), 0.62, tz);
    }
  }
  // trees in grates and green lampposts, on the hall's side of the pavement
  streetTree(k, root, x0 + 0.9, D + 3.0, 1.0);
  streetTree(k, root, x0 + 6.0, D + 3.1, 0.95);
  lamppost(k, root, x0 + 3.5, D + 3.2);
  lamppost(k, root, ox0 + 6.9, D + 3.4);
  // a bike rack and two bikes before the reception (no brand)
  const bx = ox0 + 8.0;
  const bz = D + 2.6;
  k.add(style.box(1.8, 0.05, 0.05), k.mat(STEEL), root, bx, 0.45, bz);
  for (const dx of [-0.85, 0.85]) k.add(style.box(0.05, 0.45, 0.05), k.mat(STEEL), root, bx + dx, 0.22, bz);
  for (const [dx, c] of [[-0.45, '#6cb4ee'], [0.35, '#ffd166']] as const) {
    for (const wz of [-0.42, 0.42]) {
      const w = k.add(style.cylinder(0.22, 0.04), k.mat(WORLD.dark), root, bx + dx, 0.24, bz + wz);
      w.rotation.z = Math.PI / 2;
    }
    k.add(style.box(0.05, 0.05, 0.8), k.mat(c), root, bx + dx, 0.5, bz);
    k.add(style.box(0.05, 0.3, 0.05), k.mat(c), root, bx + dx, 0.38, bz - 0.15);
    k.add(style.box(0.14, 0.04, 0.2), k.mat(WORLD.dark), root, bx + dx, 0.56, bz - 0.15);
  }
}

/** the café bar along the front edge: its counter, a coffee machine and fruit; its pendants at night */
function island({ k, root, o }: Build): void {
  const { style, pal } = k;
  const i = o.island;
  const x = (i.x0 + i.x1) / 2;
  const z = (i.z0 + i.z1) / 2;
  const w = i.x1 - i.x0;
  const d = i.z1 - i.z0;
  k.add(style.box(w - 0.1, 0.8, d - 0.1, 0.06), k.mat('#a87545'), root, x, 0.4, z);
  k.add(style.box(w, 0.06, d, 0.02), k.mat(pal.islandTop), root, x, 0.83, z);
  // its tiled front to the room, a teal band
  k.add(style.box(w - 0.14, 0.18, 0.02), k.mat(pal.island), root, x, 0.62, i.z0 - 0.01);
  for (let n = 0; n < 2; n++) {
    const l = k.light(new PointLight('#ffcf8a', 3.0, 4.2, 1.6));
    l.position.set(i.x0 + w * (0.3 + n * 0.4), 1.6, i.z0 - 0.4);
    root.add(l);
  }
}

/** one agent's seat: its stretch of the long table, a stool, its laptop and lamp */
function desk(b: Build, d: Spot, name: string): DeskHandles {
  const { k, root: parent, o } = b;
  const box = boxAhead(o.furniture, d) ?? { x0: d.x - SEAT_DX / 2, x1: d.x + SEAT_DX / 2, z0: d.z + 0.11, z1: d.z + 0.89 };
  const { style, pal } = k;
  const h = hash(name);
  const w = box.x1 - box.x0;
  const dd = box.z1 - box.z0;
  const cx = (box.x0 + box.x1) / 2;
  const cz = (box.z0 + box.z1) / 2;
  const g = new Group();
  g.position.set(cx, 0, cz);
  parent.add(g);
  // the long table's stretch: the planks meet the next seat's (a seam between two), trestle legs at its ends
  k.add(style.box(w - 0.02, 0.07, dd, 0.02), k.mat(pal.deskTop), g, 0, 0.52, 0);
  // at the stretch's very ends (two seats' legs side by side read as one trestle), nothing under its top but its own
  for (const sx of [-1, 1]) k.add(style.box(0.05, 0.48, dd - 0.16), k.mat(pal.desk), g, sx * (w / 2 - 0.035), 0.24, 0);
  const screen = laptop(k, g, d.x - cx, LAPTOP.dz);
  const lamp = deskLamp(k, g, w / 2 - 0.2, dd / 2 - 0.17);
  // a wooden stool at the seat: the chair's slide (sit.ts), within the chair's box
  const seat = stool(k, parent, d.x, d.z - 0.05, HOODIE[(h >> 5) % HOODIE.length] ?? pal.desk);
  return { screen, lamp, top: { x: cx, y: 0.55, z: cz }, chair: seat };
}

/** a backless wooden stool (sit.ts: inside the chair's box), its cushion in its bim's colour */
function stool(k: Kit, parent: Object3D, x: number, z: number, cloth: string): DeskHandles['chair'] {
  const { style } = k;
  const g = new Group();
  g.position.set(x, 0, z);
  parent.add(g);
  k.add(style.box(0.38, 0.06, 0.34, 0.03), k.mat('#a87545'), g, 0, 0.31, 0);
  k.add(style.box(0.32, 0.03, 0.28, 0.02), k.mat(cloth), g, 0, 0.355, 0);
  for (const sx of [-0.14, 0.14]) for (const sz of [-0.12, 0.12]) k.add(style.box(0.04, 0.28, 0.04), k.mat('#8f6440'), g, sx, 0.14, sz);
  return { obj: g, x, z, face: 0 };
}

/** main at the reception counter: the counter, its laptop, the :* on its front panel, the shoe shelves on its right */
function mainDesk(b: Build): DeskHandles {
  const { k, root, o: o0 } = b;
  const o = gymOf(o0);
  const { style, pal } = k;
  const md = o.mainDesk;
  const mb = boxAhead(o.furniture, md) ?? { x0: md.x - COUNTER.w / 2, x1: md.x + COUNTER.w / 2, z0: md.z + 0.1, z1: md.z + 1.1 };
  const mcx = (mb.x0 + mb.x1) / 2;
  const mcz = (mb.z0 + mb.z1) / 2;
  const mg = new Group();
  mg.position.set(mcx, 0, mcz);
  root.add(mg);
  const mw = mb.x1 - mb.x0;
  const mdd = mb.z1 - mb.z0;
  k.add(style.box(mw - 0.1, 0.5, mdd - 0.1, 0.05), k.mat(STEEL), mg, 0, 0.25, 0);
  k.add(style.box(mw, 0.06, mdd, 0.02), k.mat(pal.deskTop), mg, 0, 0.52, 0);
  const screen = laptop(k, mg, md.x - mcx, LAPTOP.dz);
  const lamp = deskLamp(k, mg, mw / 2 - 0.2, mdd / 2 - 0.2);
  // the neon :* on the counter's front, to the street
  const neon = style.material(pal.neon, { flat: true });
  glyph(k, mg, -mw / 4, 0.3, mdd / 2 + 0.01, pal.neon, 0.045, neon);
  const seat = chair(k, root, md.x, md.z - 0.05, WORLD.dark, md.face);
  // the shoe-rental shelves on the right lane's far side: low (the right edge), pairs of climbing shoes in colours
  const sb = shoeShelves(o);
  const sx = (sb.x0 + sb.x1) / 2;
  const sz = (sb.z0 + sb.z1) / 2;
  k.add(style.box(0.36, 0.95, 1.9, 0.03), k.mat('#a87545'), root, sx, 0.475, sz);
  for (let r = 0; r < 3; r++) {
    k.add(style.box(0.38, 0.03, 1.86), k.mat('#8f6440'), root, sx, 0.2 + r * 0.3, sz);
    for (let p = 0; p < 4; p++) {
      const c = ['#2a9d8f', '#ffd166', '#9b8fe0', '#f39a4c', '#6cb4ee', '#7cc26b'][(r * 4 + p) % 6] ?? '#ffd166';
      for (const dz of [-0.06, 0.06]) k.add(style.box(0.2, 0.08, 0.1, 0.03), k.mat(c), root, sx - 0.04, 0.26 + r * 0.3, sz - 0.7 + p * 0.45 + dz);
    }
  }
  return { screen, lamp, top: { x: mcx, y: 0.55, z: mcz }, chair: seat };
}

/** the stretching zone: a yoga mat per bed the stage has reached (the cozy kit draws the first two), a foam roller at its head */
function lounge(b: Build): void {
  const { k, o, grow: g } = b;
  const s0 = b.stage(0);
  if (!s0) return;
  const beds = o.furniture.filter((x) => x.of !== undefined && o.lounge.some((l) => l.x === x.of?.x && l.z === x.of.z));
  const n = bedsAt(g.stage);
  beds.forEach((box, i) => {
    if (i < BASE_BEDS || i >= n || !box.of) return;
    const parent = bedGroup(b.stage(bedStage(i)) ?? s0, box.of);
    bed(k, parent, box, 'mat', climb.cozy, i);
  });
}

/** where each stage's piece stands (its cones while it is built; the unlock walks there) */
function pieceAt(o0: Office, stage: number): Pt {
  const o = gymOf(o0);
  const { x0, D, ox0 } = o;
  const i = o.island;
  const g = o.gym;
  const r0 = routes(g)[1];
  const spots: readonly Pt[] = [
    o.door,
    { x: (g.spots[0]?.x ?? x0) + 0.9, z: (g.spots[0]?.z ?? 5) + 0.9 }, // 1: the chalk bucket and brushes
    { x: i.x0 + 0.4, z: (i.z0 + i.z1) / 2 }, // 2: the smoothie corner on the bar
    { x: ox0 - 0.9, z: 7.2 }, // 3: the hangboard on its frame by the rail
    { x: ox0 + HANGING[1], z: 0.3 }, // 4: the hanging plants over the stretching zone (maps/climb.ts HANGING)
    { x: x0 + 6.4, z: 6.6 }, // 5: the chalk-up bench
    { x: x0 + 1.4, z: D - 2.0 }, // 6: the kids' wall
    r0 ? { x: r0.o.x + r0.n.x * 0.6, z: r0.o.z + r0.n.z * 0.6 } : o.door, // 7: the bells
    { x: x0 + 8.0, z: 8.4 }, // 8: the setters' hold crates
    { x: ox0 + 2.6, z: D + 0.6 }, // 9: the planted terrace
    { x: x0 + 7.5, z: D - 2.4 }, // 10: the yoga room
    { x: x0 + 4.4, z: D - 1.4 }, // 11: the sauna
    { x: x0 + 6.0, z: 10.6 }, // 12: the boulder
    { x: x0 + 3.0, z: D - 4.6 }, // 13: the slackline
    { x: (goldenHold(g)?.p.x ?? x0), z: (goldenHold(g)?.p.z ?? 1) + 0.6 }, // 14: the golden hold
  ];
  return spots[Math.min(stage, spots.length - 1)] ?? o.door;
}

/** the growth: the holds and volumes, each stage's piece, the terrace's deck chairs, the garden, the frames, the cones */
function growth(b: Build): void {
  const { k, o: o0, grow: g } = b;
  const o = gymOf(o0);
  const { style } = k;
  const s0 = b.stage(0);
  if (!s0) return;
  const s = (n: number): Group | null => b.stage(n);
  holds(b);
  // the pavement's terrace slab from stage 1 (the town's path meets its front), its deck chairs with the stages
  const s1t = s(1);
  if (s1t) onFloor(k, s1t, terraceSlab(o), 0.08, 0, k.pal.terrace);
  deckChairs(b, (i) => (i % 2 ? '#2a9d8f' : '#ffd166'));

  // 1: a bucket of chalk and two brushes on poles by the left rest spot
  const s1 = s(1);
  if (s1) {
    const p = pieceAt(o, 1);
    k.add(style.cylinder(0.16, 0.3), k.mat('#fffaf0'), s1, p.x, 0.15, p.z);
    k.add(style.cylinder(0.14, 0.03), k.mat('#e9e2d4'), s1, p.x, 0.31, p.z);
    for (const dx of [-0.35, 0.35]) {
      k.add(style.box(0.035, 1.5, 0.035), k.mat('#f39a4c'), s1, p.x + dx, 0.75, p.z + 0.1);
      k.add(style.box(0.12, 0.06, 0.06), k.mat(WORLD.dark), s1, p.x + dx, 1.52, p.z + 0.1);
    }
  }
  // 2: a blender and a fruit basket on the bar
  const s2 = s(2);
  if (s2) {
    const i = o.island;
    const zc = (i.z0 + i.z1) / 2;
    k.add(style.box(0.16, 0.08, 0.16, 0.03), k.mat(WORLD.dark), s2, i.x0 + 0.35, 0.9, zc);
    k.add(style.cylinder(0.07, 0.24), style.material(WORLD.glass, { opacity: 0.7 }), s2, i.x0 + 0.35, 1.06, zc);
    k.add(style.cylinder(0.2, 0.08), k.mat('#c98a3a'), s2, i.x0 + 0.85, 0.9, zc);
    ['#ffd166', '#7cc26b', '#f28c28', '#9b8fe0'].forEach((c, j) => k.add(style.ball(0.07), k.mat(c), s2, i.x0 + 0.75 + (j % 2) * 0.18, 0.98, zc - 0.07 + Math.floor(j / 2) * 0.14));
  }
  // 3: the hangboard on its wooden frame by the rail
  const s3 = s(3);
  if (s3) {
    const p = pieceAt(o, 3);
    for (const dz of [-0.6, 0.6]) k.add(style.box(0.1, 2.0, 0.1), k.mat('#a87545'), s3, p.x, 1.0, p.z + dz);
    k.add(style.box(0.12, 0.1, 1.4), k.mat('#a87545'), s3, p.x, 2.0, p.z);
    k.add(style.box(0.1, 0.16, 0.7, 0.03), k.mat('#d2a46c'), s3, p.x - 0.02, 1.8, p.z);
  }
  // 4: plants hanging from the café's back wall's beam
  const s4 = s(4);
  if (s4) {
    for (const dx of HANGING) {
      const hx = o.ox0 + dx;
      k.add(style.box(0.015, 0.3, 0.015), k.mat(WORLD.dark), s4, hx, CAFE_WALL_H + 0.05, 0.25);
      k.add(style.cylinder(0.12, 0.14), k.mat(TERRACOTTA), s4, hx, CAFE_WALL_H - 0.17, 0.25);
      for (let v = 0; v < 3; v++) k.add(style.box(0.05, 0.3, 0.05), k.mat('#5fb35a'), s4, hx - 0.06 + v * 0.06, CAFE_WALL_H - 0.35, 0.25);
    }
  }
  // 5: the chalk-up bench by the mats: a long wooden bench, chalk bags and a pair of shoes on it (never a
  // free-standing panel: one continuous wall, page bims-climb v4, bims m_38115)
  const s5 = s(5);
  if (s5) {
    const p = pieceAt(o, 5);
    k.add(style.box(1.6, 0.08, 0.4, 0.02), k.mat('#d2a46c'), s5, p.x, 0.42, p.z);
    for (const dx of [-0.65, 0.65]) k.add(style.box(0.1, 0.38, 0.32), k.mat('#8f6440'), s5, p.x + dx, 0.19, p.z);
    ['#2a9d8f', '#f39a4c'].forEach((c, j) => {
      const x = p.x - 0.45 + j * 0.35;
      k.add(style.cylinder(0.07, 0.13), k.mat(c), s5, x, 0.525, p.z);
      k.add(style.cylinder(0.055, 0.02), k.mat(WORLD.paper), s5, x, 0.6, p.z);
    });
    for (const dz of [-0.07, 0.07]) k.add(style.box(0.22, 0.07, 0.1, 0.02), k.mat('#9b8fe0'), s5, p.x + 0.45, 0.495, p.z + dz);
  }
  // 6: the kids' wall: low, bright, big holds, its own small mat
  const s6 = s(6);
  if (s6) {
    const p = pieceAt(o, 6);
    k.add(style.box(0.12, 1.3, 2.4, 0.03), k.mat('#6cb4ee'), s6, p.x - 0.6, 0.65, p.z);
    for (let j = 0; j < 8; j++) k.add(style.ball(0.07), k.mat(['#ffd166', '#7cc26b', '#f39a4c', '#fffaf0'][j % 4] ?? '#ffd166'), s6, p.x - 0.52, 0.3 + (j % 4) * 0.28, p.z - 0.9 + Math.floor(j / 2) * 0.5);
    k.add(style.box(1.0, 0.18, 2.4, 0.04), k.mat(MAT), s6, p.x, 0.09, p.z);
  }
  // 8: the setters' hold crates: stacked crates of spare holds, a drill on top (never a free-standing
  // panel: one continuous wall, page bims-climb v4, bims m_38098)
  const s8 = s(8);
  if (s8) {
    const p = pieceAt(o, 8);
    const crates = [[-0.5, 0, 0], [0.1, 0, 0.05], [-0.2, 1, 0.02], [0.65, 0, -0.1]] as const;
    crates.forEach(([dx, lvl, dz], j) => {
      const y = 0.17 + lvl * 0.34;
      k.add(style.box(0.55, 0.32, 0.42, 0.03), k.mat(['#6cb4ee', '#ffd166', '#2a9d8f', '#9b8fe0'][j] ?? '#6cb4ee'), s8, p.x + dx, y, p.z + dz);
      for (let h = 0; h < 4; h++) k.add(style.ball(0.06), k.mat(HOLD_COLS[(j * 3 + h) % HOLD_COLS.length] ?? WORLD.paper), s8, p.x + dx - 0.15 + (h % 2) * 0.3, y + 0.17, p.z + dz - 0.1 + Math.floor(h / 2) * 0.2);
    });
    // the drill on the top crate
    k.add(style.box(0.22, 0.09, 0.07, 0.02), k.mat(CHARCOAL), s8, p.x - 0.2, 0.17 + 0.34 + 0.24, p.z);
    k.add(style.box(0.06, 0.12, 0.06), k.mat('#f39a4c'), s8, p.x - 0.27, 0.17 + 0.34 + 0.15, p.z);
  }
  // 9: planters along the pavement before the café
  const s9 = s(9);
  if (s9) {
    const p = pieceAt(o, 9);
    for (const dx of [-2.4, 2.6]) {
      k.add(style.box(0.9, 0.4, 0.4, 0.04), k.mat(PARIS_GREEN), s9, p.x + dx, 0.2, p.z + 3.2);
      plant(k, s9, p.x + dx, 0.4, p.z + 3.2, 'fern', PARIS_GREEN, 0.8);
    }
  }
  // 10: the yoga room: a glass box with a mat in it
  const s10 = s(10);
  if (s10) {
    const p = pieceAt(o, 10);
    const glass = style.material(k.pal.window, { opacity: 0.3 });
    k.add(style.box(2.6, 0.04, 2.0), k.mat('#d2a46c'), s10, p.x, 0.02, p.z);
    for (const [dx, dz, w, d] of [[0, -1.0, 2.6, 0.03], [-1.3, 0, 0.03, 2.0]] as const) k.add(style.box(w, 1.2, d), glass, s10, p.x + dx, 0.62, p.z + dz);
    k.add(style.box(0.6, 0.03, 1.2), k.mat('#9b8fe0'), s10, p.x, 0.055, p.z);
  }
  // 11: the sauna: a small wooden cabin, a lit window
  const s11 = s(11);
  if (s11) {
    const p = pieceAt(o, 11);
    k.add(style.box(1.6, 1.5, 1.2, 0.05), k.mat('#c49a6c'), s11, p.x, 0.75, p.z);
    k.add(style.box(1.7, 0.08, 1.3), k.mat('#8f6440'), s11, p.x, 1.54, p.z);
    k.add(style.box(0.4, 0.3, 0.03), k.glow('#ffcf7a', { night: 0.9, day: 0.2 }), s11, p.x + 0.3, 1.0, p.z + 0.61);
  }
  // 12: the boulder: a freestanding grey block with a few holds
  const s12 = s(12);
  if (s12) {
    const p = pieceAt(o, 12);
    const rock = k.add(style.ball(0.8), k.mat('#d6d3cc'), s12, p.x, 0.55, p.z);
    rock.scale.set(1.2, 0.85, 1.0);
    for (let j = 0; j < 6; j++) k.add(style.ball(0.05), k.mat(HOLD_COLS[j] ?? WORLD.paper), s12, p.x + Math.cos(j) * 0.85, 0.55 + Math.sin(j * 2) * 0.35, p.z + Math.sin(j) * 0.7);
  }
  // 13: the slackline between two posts
  const s13 = s(13);
  if (s13) {
    const p = pieceAt(o, 13);
    for (const dx of [-1.2, 1.2]) k.add(style.box(0.1, 0.8, 0.1), k.mat('#a87545'), s13, p.x + dx, 0.4, p.z);
    k.add(style.box(2.4, 0.02, 0.05), k.mat('#ffd166'), s13, p.x, 0.5, p.z);
  }

  garden(k, s0, o, g);
  frames(k, s0, o, g);
  if (g.building && g.stage < 14) cones(k, s0, pieceAt(o, g.stage + 1));
}

/** the frames: a route-grade card per 10 artifacts on the café's back wall right of the board, golden from 500 */
function frames(k: Kit, parent: Object3D, o: ClimbOffice, g: { frames: number; golden: boolean }): void {
  if (g.frames === 0) return;
  const { style } = k;
  const [xa, xb] = framesSpan(o);
  // round the cozy posters (render/cozy.ts frameXs)
  const xs = frameXs(o, xa, xb, 0.3);
  for (let i = 0; i < g.frames; i++) {
    const row = Math.floor(i / xs.length);
    const y = 1.4 - row * 0.32;
    if (y < 0.6) break;
    const col = g.golden && i === 0 ? WORLD.gold : (ROUTE_COLS[i % ROUTE_COLS.length] ?? WORLD.paper);
    k.add(style.box(0.22, 0.24, 0.02), k.mat(col), parent, xs[i % xs.length] ?? xa, y, 0.03 + style.pictureZ);
  }
}

/** the route setters' board on its steel pillar at the back: grades in colours */
function board(b: Build): void {
  const { k, root, o: o0 } = b;
  const o = gymOf(o0);
  const { style } = k;
  const x = (o.boardSpots[2] ?? o.door).x;
  k.add(style.box(0.26, 1.7, 0.26, 0.02), k.mat(STEEL), root, x, 0.85, 0.12);
  k.add(style.box(1.4, 0.9, 0.04), k.mat('#fffaf0'), root, x, 1.15, 0.27);
  ROUTE_COLS.forEach((c, i) => {
    k.add(style.box(0.18, 0.1, 0.02), k.mat(c), root, x - 0.5, 1.48 - i * 0.12, 0.3);
    k.add(style.box(0.6 + ((hash(`grade${String(i)}`) % 4) * 0.1), 0.03, 0.015), k.mat(WORLD.ink), root, x + 0.05, 1.48 - i * 0.12, 0.3);
  });
}

export const climb: MapLook = {
  id: 'climb',
  // its cozy pieces (render/cozy.ts): yoga mats for its two base beds, a fern, the espresso
  cozy: { plant: 'fern', small: 'succulent', coffee: 'espresso', bed: 'mat', shelf: 'jars', poster: 'flat', wood: '#a87545', cloth: ['#9b8fe0', '#2a9d8f', '#e9e2d4'], art: ['#2a9d8f', '#ffd166', '#9b8fe0'], pot: TERRACOTTA, rug: '#9b8fe0' },
  pal: (n) => (n ? CLIMB_NIGHT : CLIMB_DAY),
  shell: (b) => {
    shell(b);
    board(b);
  },
  island,
  bedShape: 'flat',
  lounge,
  desk: (b, spot, name): DeskHandles => desk(b, spot, name),
  mainDesk: (b): DeskHandles => mainDesk(b),
  tree: ({ k }, parent, x, z, size) => {
    streetTree(k, parent, x, z, size);
  },
  growth,
  pieceAt,
};

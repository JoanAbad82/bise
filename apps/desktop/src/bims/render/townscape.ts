// What the town draws between its offices (town.js townStill2, page bims-maps v9): its floating
// lawn, the road (a ribbon with its dashes), the river on its sandy banks, the wooden bridges where
// the road crosses it, the dirt paths to the doors (a footbridge where one meets the river), a few
// small houses, the trees in clumps and a little square every 4 or 5 offices, from the town's plan (town/plan.ts). Built once per plan and
// theme and merged (merge.ts): a handful of draw calls. Never the app's pink or red. Owner: maps-e.
import { BufferAttribute, BufferGeometry, ConeGeometry, Group, type Material, Mesh, type MeshLambertMaterial } from 'three';
import type { Box, Pt } from '../model';
import { slabWithPits } from './ground';
import { ROAD, RIVER, BANK, type TownPlan } from '../town/plan';
import { APRON_D, APRON_HALF, PATH_HALF } from './decor';
import { kitOf } from './kit';
import type { Palette } from './palette';
import type { Style } from './style';

/** the town's own colours by day and by night (the prototype's), the lawn's are the palette's */
export interface TownColours {
  readonly water: string;
  readonly bank: string;
  readonly road: string;
  readonly dash: string;
  readonly path: string;
  readonly wood: string;
  readonly rail: string;
  readonly trunk: string;
  readonly leaves: readonly [string, string, string];
  readonly walls: readonly string[];
  readonly roofs: readonly string[];
  /** a square's paving and its fountain's stone */
  readonly stone: string;
}

export const TOWN_DAY: TownColours = {
  water: '#7cc3e8', bank: '#d9cf9c', road: '#9a9590', dash: '#f4f0e8', path: '#e2c79a', wood: '#c49a6c', rail: '#a0673f',
  trunk: '#a0673f', leaves: ['#5fb35a', '#7cc26b', '#4e9a48'],
  walls: ['#f3d5b5', '#bfe1f2', '#fffaf0', '#ffe3a3', '#cfe8c3'], roofs: ['#ef8354', '#5c677d', '#2a9d8f'], stone: '#e4dccd',
};

export const TOWN_NIGHT: TownColours = {
  water: '#1d3b52', bank: '#3c5a3a', road: '#3a3d44', dash: '#8d8a84', path: '#5c4b3e', wood: '#6b5440', rail: '#5c4b3e',
  trunk: '#6e4a31', leaves: ['#3f8a3e', '#4f9a4a', '#356f33'],
  walls: ['#8a7663', '#5e7686', '#9a9284', '#9a8455', '#6f8466'], roofs: ['#8a4a33', '#3c4350', '#1f6a62'], stone: '#6f685f',
};

/**
 * the night's lift on the day lawn and road (bims m_35061: never a black-green slab on the cream page):
 * their emissive, times the sky's Light.lift (0 day .. 1 night); a lit night lawn ~#2f5a3e, still
 * night, never grey or teal (town-light.test.ts). Linear sums worked out on lightOf's nights.
 */
export const NIGHT_GLOW = { lawn: '#212b17', road: '#232e3d' } as const;

/** the townscape, and its night lift (the lawn and the road: NIGHT_GLOW times level) */
export interface Townscape {
  readonly root: Group;
  readonly lift: (level: number) => void;
}

/** the lawn's top: the offices' own grass blocks stand a little over it */
export const LAWN_TOP = -0.06;
/** a dirt path's thickness: its top 0.01 over the lawn, under the road (LAWN_TOP + 0.02) and the river's banks */
export const PATH_H = 0.02;
/** a dirt path's top */
export const PATH_TOP = LAWN_TOP + 0.01;

/** A flat ribbon along a line, `half` each side, at height y; only its stretches inside the lawn. */
function ribbon(pts: readonly Pt[], half: number, y: number, inLawn: (p: Pt) => boolean): BufferGeometry {
  const pos: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (a === undefined || b === undefined || !inLawn(a) || !inLawn(b)) continue;
    const prev = pts[i - 1] ?? a;
    const next = pts[i + 2] ?? b;
    // each end's normal from its neighbours, so the stretches join without a gap
    const nA = norm(b.x - prev.x, b.z - prev.z);
    const nB = norm(next.x - a.x, next.z - a.z);
    const a0 = [a.x + nA.x * half, y, a.z + nA.z * half];
    const a1 = [a.x - nA.x * half, y, a.z - nA.z * half];
    const b0 = [b.x + nB.x * half, y, b.z + nB.z * half];
    const b1 = [b.x - nB.x * half, y, b.z - nB.z * half];
    pos.push(...a0, ...b0, ...a1, ...a1, ...b0, ...b1);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  // a ribbon faces up, whichever way its triangles wind
  const nrm = new Float32Array(pos.length);
  for (let i = 1; i < nrm.length; i += 3) nrm[i] = 1;
  g.setAttribute('normal', new BufferAttribute(nrm, 3));
  return g;
}

/** the unit normal (left of the way) of a heading */
function norm(dx: number, dz: number): Pt {
  const l = Math.hypot(dx, dz) || 1;
  return { x: -dz / l, z: dx / l };
}

/** The town's ground and everything on it but the offices, as one group (not merged yet). */
export function buildTownscape(plan: TownPlan, style: Style, pal: Palette, c: TownColours, pits: readonly Box[] = []): Townscape {
  const k = kitOf(style, pal);
  const root = new Group();
  // the lawn's and the road's own materials, lifted at night (never merged away: merge.ts keeps a live one)
  const glowing = (color: string, glow: string): MeshLambertMaterial => {
    const m = style.material(color, { emissive: glow, ei: 0 }) as MeshLambertMaterial;
    m.userData.live = true;
    return m;
  };
  const lawnMat = glowing(pal.grass, NIGHT_GLOW.lawn);
  const roadMat = glowing(c.road, NIGHT_GLOW.road);
  const { lawn } = plan;
  const inLawn = (p: Pt): boolean => p.x > lawn.x0 && p.x < lawn.x1 && p.z > lawn.z0 && p.z < lawn.z1;
  const lw = lawn.x1 - lawn.x0;
  const ld = lawn.z1 - lawn.z0;
  const cx = (lawn.x0 + lawn.x1) / 2;
  const cz = (lawn.z0 + lawn.z1) / 2;
  // the floating block, as each office's: dirt under a grass top, holed where an office carves under its floor (render/ground.ts)
  k.add(slabWithPits(style, lw, 1.2, ld, 0.45, cx, cz, pits), k.mat(pal.dirt), root, cx, LAWN_TOP - 0.08 - 0.6 - 0.01, cz);
  k.add(slabWithPits(style, lw, 0.16, ld, 0.05, cx, cz, pits), lawnMat, root, cx, LAWN_TOP - 0.08, cz);

  const flat = (g: BufferGeometry, color: string, mat?: Material): void => {
    const m = new Mesh(g, mat ?? k.mat(color));
    root.add(m);
  };
  if (plan.river.length > 1) {
    flat(ribbon(plan.river, BANK, LAWN_TOP + 0.005, inLawn), c.bank);
    flat(ribbon(plan.river, RIVER, LAWN_TOP + 0.012, inLawn), c.water);
  }
  flat(ribbon(plan.road, ROAD, LAWN_TOP + 0.02, inLawn), c.road, roadMat);
  // the dashes down the middle: every other metre or so
  const dashes: Pt[][] = [];
  for (let i = 0; i + 2 < plan.road.length; i += 5) {
    const a = plan.road[i];
    const b = plan.road[i + 2];
    if (a !== undefined && b !== undefined) dashes.push([a, b]);
  }
  for (const d of dashes) flat(ribbon(d, 0.06, LAWN_TOP + 0.03, inLawn), c.dash);

  // the dirt paths, from the terrace's (or the floor's) front edge to the road's middle line, an apron
  // where they arrive (bims m_32735). Their top a little over the grass, under the road's and the
  // river's ribbons and every slab: they end under the road, never coplanar with it
  for (const p of plan.paths) {
    const len = p.z1 - p.z0;
    if (len <= 0) continue;
    k.add(style.box(PATH_HALF * 2, PATH_H, len, 0.005), k.mat(c.path), root, p.x, PATH_TOP - PATH_H / 2, p.z0 + len / 2);
    const ad = Math.min(APRON_D, len);
    k.add(style.box(APRON_HALF * 2, PATH_H, ad, 0.005), k.mat(c.path), root, p.x, PATH_TOP - PATH_H / 2, p.z0 + ad / 2);
  }

  // the bridges: a wooden deck with low rails, along the road
  const bridge = (x: number, z: number, ang: number, half: number, len: number): void => {
    const g = new Group();
    g.position.set(x, 0, z);
    g.rotation.y = ang;
    root.add(g);
    k.add(style.box(half * 2 + 0.6, 0.14, len), k.mat(c.wood), g, 0, LAWN_TOP + 0.1, 0);
    for (const sx of [-1, 1]) {
      k.add(style.box(0.12, 0.12, len), k.mat(c.rail), g, sx * (half + 0.25), LAWN_TOP + 0.45, 0);
      for (const sz of [-len / 2 + 0.2, 0, len / 2 - 0.2]) k.add(style.box(0.14, 0.42, 0.14), k.mat(c.rail), g, sx * (half + 0.25), LAWN_TOP + 0.3, sz);
    }
  };
  for (const b of plan.bridges) bridge(b.x, b.z, b.ang, ROAD, BANK * 2 + 1);
  for (const f of plan.footbridges) bridge(f.x, f.z, 0, 0.5, BANK * 2 + 0.6);

  // the houses: a rounded block, a four-sided roof
  for (const h of plan.houses) {
    const g = new Group();
    g.position.set(h.x, 0, h.z);
    g.rotation.y = h.ang;
    root.add(g);
    k.add(style.box(h.w, 1.2, h.d, 0.2), k.mat(c.walls[h.tone % c.walls.length] ?? pal.wall), g, 0, LAWN_TOP + 0.6, 0);
    const roof = k.add(new ConeGeometry(Math.max(h.w, h.d) * 0.78, 0.9, 4), k.mat(c.roofs[h.tone % c.roofs.length] ?? pal.wallTop), g, 0, LAWN_TOP + 1.65, 0);
    roof.rotation.y = Math.PI / 4;
  }

  // the little squares (bims m_28819): paving, a round fountain, two benches, a tree at each corner
  for (const q of plan.squares) {
    k.add(style.box(q.w - 1, 0.05, q.d - 1, 0.3), k.mat(c.stone), root, q.x, LAWN_TOP + 0.01, q.z);
    k.add(style.cylinder(1.1, 0.36), k.mat(c.stone), root, q.x, LAWN_TOP + 0.2, q.z);
    k.add(style.cylinder(0.92, 0.06), k.mat(c.water), root, q.x, LAWN_TOP + 0.38, q.z);
    k.add(style.cylinder(0.16, 0.7), k.mat(c.stone), root, q.x, LAWN_TOP + 0.5, q.z);
    for (const sz of [-1, 1]) {
      k.add(style.box(1.3, 0.1, 0.4), k.mat(c.wood), root, q.x, LAWN_TOP + 0.32, q.z + sz * 2.1);
      for (const sx of [-0.5, 0.5]) k.add(style.box(0.1, 0.3, 0.3), k.mat(c.rail), root, q.x + sx, LAWN_TOP + 0.15, q.z + sz * 2.1);
    }
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) tree(q.x + dx * (q.w / 2 - 1.1), q.z + dz * (q.d / 2 - 1.1), 0.8);
  }

  // the home's square (bims m_29650): paving round its ground, a tree at each corner, a bench on each side, no fence
  const h = plan.heart;
  if (h !== null) {
    const hx = (h.x0 + h.x1) / 2;
    const hz = (h.z0 + h.z1) / 2;
    k.add(style.box(h.x1 - h.x0, 0.05, h.z1 - h.z0, 0.3), k.mat(c.stone), root, hx, LAWN_TOP + 0.01, hz);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      const tx = dx < 0 ? h.x0 + 0.9 : h.x1 - 0.9;
      const tz = dz < 0 ? h.z0 + 0.9 : h.z1 - 0.9;
      tree(tx, tz, 1);
      // a planter beside each corner's tree (bims m_30199: the square read empty zoomed in), along its long side
      const px = tx - dx * 1.6;
      k.add(style.box(1.1, 0.4, 0.7, 0.08), k.mat(c.stone), root, px, LAWN_TOP + 0.2, tz);
      k.add(style.ball(0.42), k.mat(c.leaves[1]), root, px, LAWN_TOP + 0.55, tz);
    }
    for (const sx of [-1, 1]) {
      const bx = sx < 0 ? h.x0 + 0.5 : h.x1 - 0.5;
      const bench = new Group();
      bench.position.set(bx, 0, hz);
      bench.rotation.y = Math.PI / 2;
      root.add(bench);
      k.add(style.box(1.3, 0.1, 0.4), k.mat(c.wood), bench, 0, LAWN_TOP + 0.32, 0);
      for (const bx2 of [-0.5, 0.5]) k.add(style.box(0.1, 0.3, 0.3), k.mat(c.rail), bench, bx2, LAWN_TOP + 0.15, 0);
    }
  }

  // the trees: a trunk and three round leaves (the prototype's clayTree)
  for (const t of plan.trees) tree(t.x, t.z, t.size);
  return {
    root,
    lift: (level) => {
      lawnMat.emissiveIntensity = level;
      roadMat.emissiveIntensity = level;
    },
  };

  function tree(x: number, z: number, s: number): void {
    const t = { x, z };
    k.add(style.cylinder(0.14 * s, 1.2 * s), k.mat(c.trunk), root, t.x, LAWN_TOP + 0.6 * s, t.z);
    k.add(style.ball(0.55 * s), k.mat(c.leaves[0]), root, t.x, LAWN_TOP + 1.5 * s, t.z);
    k.add(style.ball(0.38 * s), k.mat(c.leaves[1]), root, t.x + 0.32 * s, LAWN_TOP + 1.25 * s, t.z + 0.2 * s);
    k.add(style.ball(0.34 * s), k.mat(c.leaves[2]), root, t.x - 0.3 * s, LAWN_TOP + 1.3 * s, t.z - 0.15 * s);
  }
}

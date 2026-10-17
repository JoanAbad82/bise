// What the town draws between its offices (town.js townStill2, page bims-maps v9): its floating
// lawn, the road (a ribbon with its dashes), the river on its sandy banks, the wooden bridges where
// the road crosses it, the dirt paths to the doors (a footbridge where one meets the river), a few
// small houses and the trees in clumps, from the town's plan (town/plan.ts). Built once per plan and
// theme and merged (merge.ts): a handful of draw calls. Never the app's pink or red. Owner: maps-e.
import { BufferAttribute, BufferGeometry, ConeGeometry, Group, Mesh } from 'three';
import type { Pt } from '../model';
import { ROAD, RIVER, BANK, type TownPlan } from '../town/plan';
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
}

export const TOWN_DAY: TownColours = {
  water: '#7cc3e8', bank: '#d9cf9c', road: '#9a9590', dash: '#f4f0e8', path: '#e2c79a', wood: '#c49a6c', rail: '#a0673f',
  trunk: '#a0673f', leaves: ['#5fb35a', '#7cc26b', '#4e9a48'],
  walls: ['#f3d5b5', '#bfe1f2', '#fffaf0', '#ffe3a3', '#cfe8c3'], roofs: ['#ef8354', '#5c677d', '#2a9d8f'],
};

export const TOWN_NIGHT: TownColours = {
  water: '#1d3b52', bank: '#3c5a3a', road: '#3a3d44', dash: '#8d8a84', path: '#5c4b3e', wood: '#6b5440', rail: '#5c4b3e',
  trunk: '#6e4a31', leaves: ['#3f8a3e', '#4f9a4a', '#356f33'],
  walls: ['#8a7663', '#5e7686', '#9a9284', '#9a8455', '#6f8466'], roofs: ['#8a4a33', '#3c4350', '#1f6a62'],
};

/** the lawn's top: the offices' own grass blocks stand a little over it */
export const LAWN_TOP = -0.06;

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
export function buildTownscape(plan: TownPlan, style: Style, pal: Palette, c: TownColours): Group {
  const k = kitOf(style, pal);
  const root = new Group();
  const { lawn } = plan;
  const inLawn = (p: Pt): boolean => p.x > lawn.x0 && p.x < lawn.x1 && p.z > lawn.z0 && p.z < lawn.z1;
  const lw = lawn.x1 - lawn.x0;
  const ld = lawn.z1 - lawn.z0;
  const cx = (lawn.x0 + lawn.x1) / 2;
  const cz = (lawn.z0 + lawn.z1) / 2;
  // the floating block, as each office's: dirt under a grass top
  k.add(style.box(lw, 1.2, ld, 0.45), k.mat(pal.dirt), root, cx, LAWN_TOP - 0.08 - 0.6 - 0.01, cz);
  k.add(style.box(lw, 0.16, ld, 0.05), k.mat(pal.grass), root, cx, LAWN_TOP - 0.08, cz);

  const flat = (g: BufferGeometry, color: string): void => {
    const m = new Mesh(g, k.mat(color));
    root.add(m);
  };
  if (plan.river.length > 1) {
    flat(ribbon(plan.river, BANK, LAWN_TOP + 0.005, inLawn), c.bank);
    flat(ribbon(plan.river, RIVER, LAWN_TOP + 0.012, inLawn), c.water);
  }
  flat(ribbon(plan.road, ROAD, LAWN_TOP + 0.02, inLawn), c.road);
  // the dashes down the middle: every other metre or so
  const dashes: Pt[][] = [];
  for (let i = 0; i + 2 < plan.road.length; i += 5) {
    const a = plan.road[i];
    const b = plan.road[i + 2];
    if (a !== undefined && b !== undefined) dashes.push([a, b]);
  }
  for (const d of dashes) flat(ribbon(d, 0.06, LAWN_TOP + 0.03, inLawn), c.dash);

  // the dirt paths, from the door to the road
  for (const p of plan.paths) {
    const len = p.z1 - p.z0;
    if (len > 0) k.add(style.box(1.0, 0.04, len, 0.01), k.mat(c.path), root, p.x, LAWN_TOP + 0.0, p.z0 + len / 2);
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

  // the trees: a trunk and three round leaves (the prototype's clayTree)
  for (const t of plan.trees) {
    const s = t.size;
    k.add(style.cylinder(0.14 * s, 1.2 * s), k.mat(c.trunk), root, t.x, LAWN_TOP + 0.6 * s, t.z);
    k.add(style.ball(0.55 * s), k.mat(c.leaves[0]), root, t.x, LAWN_TOP + 1.5 * s, t.z);
    k.add(style.ball(0.38 * s), k.mat(c.leaves[1]), root, t.x + 0.32 * s, LAWN_TOP + 1.25 * s, t.z + 0.2 * s);
    k.add(style.ball(0.34 * s), k.mat(c.leaves[2]), root, t.x - 0.3 * s, LAWN_TOP + 1.3 * s, t.z - 0.15 * s);
  }
  return root;
}

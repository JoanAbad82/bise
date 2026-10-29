// The cozy kit (three; page bims-cozy v2, bims m_32090): plants (a big one on the floor, a small
// one, a hanging one), the coffee corner (a cabinet, the map's machine and two cups), the nap
// corner's rug and its two base beds (a pouf, a cushion, a bench, a mat, a hammock...), a low shelf,
// two posters (flat, framed from stage 6), a floor lamp lit at night, an object or two on each desk
// (hash-stable per bim), and what the stages add (cozy.ts cozyAt). Where they stand: the plan's
// office (Office.cozy, cozy.ts placeCozy); in what: the map's look (MapLook.cozy). Each stage's
// pieces are merged into a few meshes (merge.ts mergeRoot: one baked mesh, one per lit material)
// and go in that stage's group, so the unlock moment hides them with the stage's piece. Clay, the
// map's colours, never the accent pink or the error red; a detail under 6 cm is a mesh of its own,
// never a painted face. Nothing here decides. Owner: bims-cozy.
import { Box3, type BufferGeometry, Color, Group, type Material, Mesh, type Object3D } from 'three';
import { BASE_BEDS } from '../growth';
import { cozyAt, headRoom, type CozyStage, type Hung, type Item } from '../cozy';
import type { Box, Office, Pt } from '../model';
import { NAP_BED } from '../maps/plan';
import type { Kit } from './kit';
import { mergeRoot } from './merge';
import { boxTop } from './style';
import { FLAT, bedGroup, bedOfMesh } from './nap';
import { WORLD, hash } from './palette';
import type { Build, DeskHandles } from './maps/look';

export type PlantKind = 'monstera' | 'cactus' | 'fern' | 'pothos' | 'ficus' | 'succulent' | 'sansevieria' | 'bonsai' | 'bamboo' | 'palm' | 'geranium' | 'tulsi' | 'aloe';
export type CoffeeKind = 'espresso' | 'kettle' | 'filter' | 'moka' | 'teaset' | 'teapot' | 'olla' | 'chai' | 'fruit' | 'carafe' | 'attaya' | 'coldbrew';
export type BedKind = 'pouf' | 'cushion' | 'sofa' | 'cot' | 'zabuton' | 'bench' | 'hammock' | 'charpai' | 'mat';
export type ShelfKind = 'vinyl' | 'jars' | 'globe' | 'radio' | 'vase' | 'lantern' | 'candles' | 'pottery' | 'brasslamp' | 'boat' | 'calabash' | 'surf';
export type PosterKind = 'flat' | 'botanic' | 'pennant' | 'ads' | 'kakemono' | 'rug' | 'map' | 'papel' | 'tapestry' | 'carnival' | 'sea' | 'movie';

/** A map's cozy pieces (page bims-cozy v2 « la base, carte par carte »): its kinds and its colours. */
export interface CozyLook {
  /** the floor plant, and the small one (on the shelf, the desks) */
  readonly plant: PlantKind;
  readonly small: PlantKind;
  /** stage 5's hanging plant (default: a pothos) */
  readonly hang?: PlantKind;
  readonly coffee: CoffeeKind;
  readonly bed: BedKind;
  readonly shelf: ShelfKind;
  readonly poster: PosterKind;
  /** the cabinet's, the shelf's and the lamp's wood */
  readonly wood: string;
  /** the beds, the cushions, the throw */
  readonly cloth: readonly [string, string, string];
  /** the nap corner's big rug: a strong colour of the map, the room's anchor from day one (bims m_32218) */
  readonly rug: string;
  /** the posters' colours */
  readonly art: readonly [string, string, string];
  /** the pots */
  readonly pot: string;
}

const LEAF = ['#5fb35a', '#4e9a48', '#3f8a3e'] as const;
const CUP = '#fffaf0';
/** the floor lamp's shade by day */
const WARM = '#ffd9a0';
const BRASS = '#b08a3c';
const GREY = '#9a958c';
/** the corner's machine, bigger than the island's: it reads at the fit (bims m_32218) */
const MACHINE_SCALE = 1.35;
/** a floor plant's size: ~1.2 tall, it reads at the fit (bims m_32218) */
const FLOOR_PLANT = 1.3;
/** a poster's print, drawn at this size then scaled */
const POSTER_W = 0.42;
const POSTER_H = 0.52;

/** a stage's pieces, built loose, merged at the end */
type Groups = Map<number, Group>;

/** a group at a floor item's middle, turned the way it faces (its front: local +z), its back on the wall */
function at(parent: Object3D, it: Item): Group {
  const g = new Group();
  const b = it.box;
  g.position.set((b.x0 + b.x1) / 2, 0, (b.z0 + b.z1) / 2);
  g.rotation.y = it.face;
  parent.add(g);
  return g;
}

/** an item's size along its wall (w) and deep (d) */
const sizeOf = (it: Item): { w: number; d: number } => {
  const bw = it.box.x1 - it.box.x0;
  const bd = it.box.z1 - it.box.z0;
  return it.wall === 'back' || it.wall === 'free' ? { w: bw, d: bd } : { w: bd, d: bw };
};

// ---- plants

/** A plant of that kind standing at (x, y, z) in g; `s` its size (1: a floor plant, ~0.4: a small one). */
export function plant(k: Kit, g: Object3D, x: number, y: number, z: number, kind: PlantKind, pot: string, s = 1): void {
  const { style } = k;
  const leaf = (i: number): Material => k.mat(LEAF[i % LEAF.length] ?? LEAF[0]);
  const ph = 0.3 * s;
  k.add(style.cylinder(0.17 * s, ph), k.mat(pot), g, x, y + ph / 2, z);
  k.add(style.cylinder(0.15 * s, 0.02), k.mat('#6b4a32'), g, x, y + ph + 0.005, z);
  const top = y + ph;
  switch (kind) {
    case 'cactus':
    case 'aloe':
    case 'sansevieria':
    case 'succulent': {
      // upright blades or pads
      const n = kind === 'cactus' ? 3 : 5;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const hgt = (kind === 'cactus' ? 0.55 - i * 0.12 : kind === 'succulent' ? 0.16 : 0.5 - (i % 2) * 0.12) * s;
        const r = (kind === 'cactus' ? 0.07 : 0.04) * s;
        const m = k.add(kind === 'cactus' ? style.capsule(r, hgt) : style.box(r * 2, hgt, r), leaf(i), g, x + Math.cos(a) * 0.06 * s, top + hgt / 2, z + Math.sin(a) * 0.06 * s);
        if (kind !== 'cactus') m.rotation.set(Math.sin(a) * 0.25, a, Math.cos(a) * 0.25);
      }
      return;
    }
    case 'bamboo':
      for (let i = 0; i < 3; i++) {
        const hgt = (0.9 - i * 0.15) * s;
        k.add(style.cylinder(0.025 * s, hgt), leaf(i + 1), g, x - 0.06 * s + i * 0.06 * s, top + hgt / 2, z + (i % 2) * 0.04 * s);
        k.add(style.box(0.16 * s, 0.03, 0.06 * s), leaf(i), g, x - 0.06 * s + i * 0.06 * s + 0.07 * s, top + hgt * 0.8, z);
      }
      return;
    case 'palm':
      k.add(style.cylinder(0.045 * s, 0.55 * s), k.mat('#a0673f'), g, x, top + 0.27 * s, z);
      for (let i = 0; i < 5; i++) {
        const f = k.add(style.box(0.5 * s, 0.03, 0.12 * s), leaf(i), g, x, top + 0.55 * s, z);
        f.rotation.set(0, (i * Math.PI * 2) / 5, -0.35);
      }
      return;
    case 'bonsai':
      k.add(style.cylinder(0.03 * s, 0.3 * s), k.mat('#6b4a32'), g, x, top + 0.15 * s, z);
      for (const [dx, dy] of [[-0.1, 0.32], [0.1, 0.28], [0, 0.4]] as const) k.add(style.ball(0.11 * s), leaf(1), g, x + dx * s, top + dy * s, z);
      return;
    case 'geranium':
    case 'tulsi':
      for (let i = 0; i < 4; i++) k.add(style.ball(0.12 * s), leaf(i), g, x + Math.cos(i * 1.6) * 0.09 * s, top + 0.12 * s + (i % 2) * 0.06 * s, z + Math.sin(i * 1.6) * 0.09 * s);
      if (kind === 'geranium') for (let i = 0; i < 3; i++) k.add(style.ball(0.05 * s), k.mat(WORLD.orange), g, x + Math.cos(i * 2.1) * 0.12 * s, top + 0.26 * s, z + Math.sin(i * 2.1) * 0.12 * s);
      else k.add(style.box(0.03, 0.12 * s, 0.03), k.mat('#7b5fc0'), g, x, top + 0.3 * s, z);
      return;
    case 'pothos':
    case 'fern':
      // trailing leaves over the pot's rim
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const l = k.add(style.ball(0.09 * s), leaf(i), g, x + Math.cos(a) * 0.17 * s, top - (i % 2) * 0.1 * s, z + Math.sin(a) * 0.17 * s);
        l.scale.y = 0.6;
      }
      k.add(style.ball(0.15 * s), leaf(0), g, x, top + 0.08 * s, z).scale.y = 0.7;
      return;
    case 'ficus':
    case 'monstera':
    default: {
      // a stem and big round leaves
      k.add(style.cylinder(0.025 * s, 0.4 * s), k.mat('#6b4a32'), g, x, top + 0.2 * s, z);
      const leaves: readonly [number, number, number, number][] = kind === 'ficus'
        ? [[0, 0.62, 0, 0.2], [0.13, 0.48, 0.05, 0.15], [-0.12, 0.5, -0.04, 0.16]]
        : [[0.14, 0.42, 0, 0.17], [-0.14, 0.5, 0.04, 0.16], [0, 0.66, -0.04, 0.15], [0.06, 0.32, 0.12, 0.13]];
      leaves.forEach(([dx, dy, dz, r], i) => {
        const l = k.add(style.ball(r * s), leaf(i), g, x + dx * s, top + dy * s, z + dz * s);
        if (kind === 'monstera') l.scale.set(1.2, 0.45, 1);
      });
    }
  }
}

/** a hanging plant: a bracket out of the wall, a pot on three cords, its leaves trailing */
function hanging(k: Kit, g: Object3D, kind: PlantKind, pot: string, y: number): void {
  const { style } = k;
  k.add(style.box(0.04, 0.04, 0.32), k.mat(GREY), g, 0, y, 0.16);
  k.add(style.cylinder(0.008, 0.28), k.mat(GREY), g, 0, y - 0.14, 0.3);
  k.add(style.cylinder(0.12, 0.14), k.mat(pot), g, 0, y - 0.35, 0.3);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    k.add(style.ball(0.06), k.mat(LEAF[i % 3] ?? LEAF[0]), g, Math.cos(a) * 0.12, y - 0.4 - (i % 3) * 0.08, 0.3 + Math.sin(a) * 0.12);
  }
  if (kind === 'fern') k.add(style.ball(0.1), k.mat(LEAF[0]), g, 0, y - 0.24, 0.3).scale.y = 0.6;
}

// ---- the coffee corner

/** two cups (and their saucers) at (x, y, z), `dx` apart */
function cups(k: Kit, g: Object3D, x: number, y: number, z: number, color: string): void {
  for (const dx of [-0.07, 0.07]) {
    k.add(k.style.cylinder(0.04, 0.012), k.mat(color), g, x + dx, y + 0.006, z);
    k.add(k.style.cylinder(0.03, 0.06), k.mat(CUP), g, x + dx, y + 0.042, z);
  }
}

/** The map's machine on a top at height y (the cabinet's, the island's), its middle at (x, z), facing +z. */
export function machine(k: Kit, g: Object3D, x: number, y: number, z: number, kind: CoffeeKind, c: CozyLook): void {
  const { style } = k;
  switch (kind) {
    case 'espresso': {
      k.add(style.box(0.28, 0.3, 0.24), k.mat(WORLD.dark), g, x, y + 0.15, z);
      // a coloured cup on its top, warming
      k.add(style.cylinder(0.035, 0.06), k.mat(c.art[0]), g, x - 0.06, y + 0.33, z - 0.02);
      k.add(style.box(0.12, 0.04, 0.08), k.mat(WORLD.metal), g, x, y + 0.22, z + 0.14);
      k.add(style.box(0.08, 0.03, 0.02), k.glow(WORLD.coffeeLed, { night: 0.7, day: 0.3 }), g, x, y + 0.26, z + 0.125);
      return;
    }
    case 'kettle':
    case 'chai': {
      const b = k.add(style.ball(0.12), k.mat(kind === 'chai' ? BRASS : c.art[1]), g, x, y + 0.11, z);
      b.scale.y = 0.85;
      k.add(style.cylinder(0.018, 0.12), k.mat(kind === 'chai' ? BRASS : c.art[1]), g, x + 0.13, y + 0.14, z).rotation.z = -0.9;
      k.add(style.box(0.16, 0.025, 0.03), k.mat(WORLD.dark), g, x, y + 0.24, z);
      return;
    }
    case 'teapot':
    case 'attaya': {
      if (kind === 'attaya') {
        // the brasero under it, its coals lit at night
        k.add(style.cylinder(0.11, 0.1), k.mat(WORLD.dark), g, x, y + 0.05, z);
        k.add(style.cylinder(0.08, 0.025), k.glow('#f28c28', { night: 0.8, day: 0.2 }), g, x, y + 0.11, z);
      }
      const yy = kind === 'attaya' ? y + 0.12 : y;
      const b = k.add(style.ball(0.09), k.mat(kind === 'attaya' ? WORLD.metal : BRASS), g, x, yy + 0.08, z);
      b.scale.y = 0.9;
      k.add(style.cylinder(0.014, 0.1), k.mat(kind === 'attaya' ? WORLD.metal : BRASS), g, x + 0.1, yy + 0.1, z).rotation.z = -0.9;
      k.add(style.ball(0.025), k.mat(kind === 'attaya' ? WORLD.metal : BRASS), g, x, yy + 0.17, z);
      return;
    }
    case 'teaset': {
      k.add(style.box(0.3, 0.025, 0.2), k.mat(c.wood), g, x, y + 0.012, z);
      const b = k.add(style.ball(0.07), k.mat(c.art[2]), g, x - 0.06, y + 0.085, z);
      b.scale.y = 0.85;
      k.add(style.cylinder(0.03, 0.04), k.mat(c.art[2]), g, x + 0.08, y + 0.045, z + 0.04);
      return;
    }
    case 'moka': {
      k.add(style.cylinder(0.06, 0.1), k.mat(WORLD.metal), g, x, y + 0.05, z);
      k.add(style.cylinder(0.045, 0.1), k.mat(WORLD.metal), g, x, y + 0.15, z);
      k.add(style.box(0.07, 0.025, 0.025), k.mat(WORLD.dark), g, x + 0.08, y + 0.15, z);
      return;
    }
    case 'olla': {
      const b = k.add(style.ball(0.12), k.mat('#a0673f'), g, x, y + 0.11, z);
      b.scale.y = 0.9;
      k.add(style.cylinder(0.07, 0.04), k.mat('#8a5a3c'), g, x, y + 0.22, z);
      return;
    }
    case 'carafe':
    case 'coldbrew': {
      k.add(style.cylinder(0.06, 0.22), style.material(kind === 'carafe' ? '#bfe1f2' : '#7a4a2a', { opacity: kind === 'carafe' ? 0.75 : 0.9 }), g, x - 0.08, y + 0.11, z);
      k.add(style.cylinder(0.065, 0.025), k.mat(WORLD.dark), g, x - 0.08, y + 0.235, z);
      if (kind === 'coldbrew') {
        // the blender beside it
        k.add(style.box(0.12, 0.08, 0.12), k.mat(WORLD.dark), g, x + 0.1, y + 0.04, z);
        k.add(style.cylinder(0.05, 0.16), style.material('#bfe1f2', { opacity: 0.7 }), g, x + 0.1, y + 0.16, z);
      }
      return;
    }
    case 'fruit':
    case 'filter':
    default: {
      k.add(style.box(0.2, 0.06, 0.18), k.mat(WORLD.dark), g, x, y + 0.03, z);
      k.add(style.box(0.2, 0.26, 0.06), k.mat(WORLD.dark), g, x, y + 0.13, z - 0.06);
      k.add(style.cylinder(0.06, 0.12), style.material('#bfe1f2', { opacity: 0.75 }), g, x, y + 0.12, z + 0.02);
      if (kind === 'fruit') for (const [dx, cc] of [[-0.24, WORLD.orange], [-0.16, WORLD.banana]] as const) k.add(style.ball(0.05), k.mat(cc), g, x + dx, y + 0.05, z + 0.03);
    }
  }
}

/** the coffee corner's cabinet against its wall: its doors, its top, the machine and two cups while it stands there (stages 0-1) */
function coffeeCorner(k: Kit, g0: Groups, it: Item, c: CozyLook, st: CozyStage, onIsland: boolean): void {
  const g = at(need(g0, 0), it);
  const { style } = k;
  const { w, d } = sizeOf(it);
  const hgt = 0.9;
  k.add(style.box(w - 0.04, hgt - 0.04, d - 0.04, 0.04), k.mat(c.wood), g, 0, (hgt - 0.04) / 2, 0);
  k.add(style.box(w, 0.04, d, 0.015), k.mat(c.cloth[2]), g, 0, hgt - 0.02, 0);
  for (const dx of [-w / 4, w / 4]) k.add(style.box(0.04, 0.04, 0.03), k.mat(BRASS), g, dx * 0.3, hgt * 0.6, d / 2 - 0.01);
  k.add(style.box(0.012, hgt - 0.12, 0.02), k.mat(c.cloth[1]), g, 0, hgt / 2, d / 2 - 0.01);
  if (!onIsland) {
    const m = new Group();
    m.position.set(-w / 4 + 0.02, hgt, -0.04);
    m.scale.setScalar(MACHINE_SCALE);
    g.add(m);
    machine(k, m, 0, 0, 0, c.coffee, c);
    cups(k, g, w / 4, hgt, 0.05, c.cloth[0]);
    if (st.coffeeOnIsland) {
      // stage 2 where the eating place has no top (a fountain, a tree, its own kettle): the sugar pot and a cup rail join the corner
      const g2 = at(need(g0, 2), it);
      k.add(style.cylinder(0.045, 0.08), k.mat(CUP), g2, w / 2 - 0.08, hgt + 0.04, -0.1);
      k.add(style.ball(0.022), k.mat(c.cloth[1]), g2, w / 2 - 0.08, hgt + 0.09, -0.1);
      for (const dx of [-0.14, 0.14]) k.add(style.box(0.02, 0.3, 0.02), k.mat(GREY), g2, dx, hgt + 0.15, -d / 2 + 0.04);
      k.add(style.box(0.32, 0.02, 0.02), k.mat(GREY), g2, 0, hgt + 0.3, -d / 2 + 0.04);
      for (const dx of [-0.07, 0.07]) k.add(style.cylinder(0.028, 0.05), k.mat(c.cloth[0]), g2, dx, hgt + 0.24, -d / 2 + 0.07);
    }
  } else {
    // stage 2: the machine went to the eating place; a small plant and the cups' tray stay (bims m_32100)
    const g2 = at(need(g0, 2), it);
    plant(k, g2, -w / 4, hgt, -0.03, c.small, c.pot, 0.4);
    k.add(style.box(0.3, 0.02, 0.16), k.mat(c.wood), g2, w / 4, hgt + 0.01, 0.04);
    cups(k, g2, w / 4, hgt + 0.02, 0.04, c.cloth[0]);
  }
}

/** stage 2's coffee on the eating place's top: the machine, a sugar pot, cups hanging on a little rail */
function coffeeOnIsland(k: Kit, g: Object3D, isl: Box, y: number, c: CozyLook): void {
  const long = isl.z1 - isl.z0 >= isl.x1 - isl.x0;
  const cx = (isl.x0 + isl.x1) / 2;
  const cz = (isl.z0 + isl.z1) / 2;
  const p = (along: number, across: number): Pt => (long ? { x: cx + across, z: isl.z0 + along } : { x: isl.x0 + along, z: cz + across });
  const m = p(0.35, 0);
  machine(k, g, m.x, y, m.z, c.coffee, c);
  const s = p(0.72, -0.18);
  k.add(k.style.cylinder(0.05, 0.09), k.mat(CUP), g, s.x, y + 0.045, s.z);
  k.add(k.style.ball(0.025), k.mat(c.cloth[1]), g, s.x, y + 0.1, s.z);
  // the rail: two posts and a bar, two cups hanging under it
  const r = p(0.72, 0.16);
  const rot = long ? Math.PI / 2 : 0;
  const rail = new Group();
  rail.position.set(r.x, y, r.z);
  rail.rotation.y = rot;
  g.add(rail);
  for (const dx of [-0.12, 0.12]) k.add(k.style.box(0.02, 0.24, 0.02), k.mat(GREY), rail, dx, 0.12, 0);
  k.add(k.style.box(0.28, 0.02, 0.02), k.mat(GREY), rail, 0, 0.24, 0);
  for (const dx of [-0.06, 0.06]) k.add(k.style.cylinder(0.028, 0.05), k.mat(c.cloth[0]), rail, dx, 0.17, 0);
}

// ---- the nap corner

/** a flat base bed's top (bed below draws it so): its pillow lies there; a pouf or a hammock has none */
const BED_TOP: Readonly<Partial<Record<BedKind, number>>> = {
  cushion: boxTop(0.11, 0.2, 0.06), zabuton: boxTop(0.06, 0.1, 0.06), sofa: boxTop(0.22, 0.06, 0.03), bench: boxTop(0.22, 0.06, 0.03), cot: 0.2, charpai: 0.2, mat: 0.05,
};

/**
 * A flat bed's pillow under its napper's head (bims-nap, bims m_35286: the head a little up reads as
 * on a pillow): its own mesh, the bed's colour a step lighter, on the bed's top `top` at the head's
 * place (render/nap.ts FLAT: its middle FLAT.headZ from the spot, its top FLAT.headUp over the bed).
 */
export function pillow(k: Kit, g: Object3D, box: Box, top: number, colour: string): void {
  const spot = box.z1 - (NAP_BED.d / 2 - NAP_BED.back);
  const c = `#${new Color(colour).lerp(new Color('#ffffff'), 0.35).getHexString()}`;
  k.add(k.style.box(Math.min(0.44, box.x1 - box.x0 - 0.12), FLAT.headUp, 0.26, 0.025), k.mat(c), g, (box.x0 + box.x1) / 2, top + FLAT.headUp / 2, spot + FLAT.headZ);
}

/** a base bed in its floor box (Office.furniture), the napper lies on it (pose.ts; a flat one with a pillow); i: its spot */
export function bed(k: Kit, g: Object3D, box: Box, kind: BedKind, c: CozyLook, i: number): void {
  const { style } = k;
  const x = (box.x0 + box.x1) / 2;
  const z = (box.z0 + box.z1) / 2;
  const w = box.x1 - box.x0;
  const d = box.z1 - box.z0;
  const cl = c.cloth[i % 2 === 0 ? 0 : 1];
  const top = BED_TOP[kind];
  if (top !== undefined) pillow(k, g, box, top, cl);
  switch (kind) {
    case 'pouf': {
      // a bean bag's size (stages.ts loftLounge): it reads at the fit
      const r = Math.min(w, d) / 2 / 1.05 / 0.92;
      const p = k.add(style.ball(r), k.mat(cl), g, x, 0.2, z);
      p.scale.set(1.05, 0.62, 1.05);
      return;
    }
    case 'cushion':
    case 'zabuton': {
      k.add(style.box(w - 0.04, kind === 'zabuton' ? 0.1 : 0.2, d - 0.04, 0.06), k.mat(cl), g, x, kind === 'zabuton' ? 0.06 : 0.11, z);
      // the embroidery's border, a mesh of its own (no painted face)
      k.add(style.box(w - 0.16, 0.012, 0.035), k.mat(c.cloth[2]), g, x, (BED_TOP[kind] ?? 0.2) + 0.006, z + (d - 0.04) / 2 - 0.08);
      return;
    }
    case 'sofa':
    case 'bench': {
      k.add(style.box(w - 0.06, 0.18, d - 0.06, 0.05), k.mat(kind === 'sofa' ? c.cloth[0] : c.wood), g, x, 0.1, z);
      k.add(style.box(w - 0.14, 0.06, d - 0.14, 0.03), k.mat(kind === 'sofa' ? c.cloth[1] : cl), g, x, 0.22, z);
      return;
    }
    case 'cot':
    case 'charpai': {
      const legH = 0.16;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.add(style.box(0.04, legH, 0.04), k.mat(c.wood), g, x + sx * (w / 2 - 0.06), legH / 2, z + sz * (d / 2 - 0.06));
      k.add(style.box(w - 0.06, 0.04, d - 0.06), k.mat(kind === 'cot' ? '#6b7a4a' : c.wood), g, x, legH + 0.02, z);
      if (kind === 'charpai') for (let j = 0; j < 3; j++) k.add(style.box(w - 0.12, 0.012, 0.03), k.mat(c.cloth[2]), g, x, legH + 0.046, z - d / 4 + (j * d) / 4);
      return;
    }
    case 'hammock': {
      hammock(k, g, box, [c.cloth[0], c.cloth[1]], c.wood);
      return;
    }
    case 'mat':
    default: {
      k.add(style.box(w - 0.06, 0.03, d - 0.06), k.mat(cl), g, x, 0.035, z);
      for (let j = 0; j < 2; j++) k.add(style.box(w - 0.06, 0.012, 0.035), k.mat(c.cloth[2]), g, x, 0.056, z - d / 4 + (j * d) / 2);
    }
  }
}

/**
 * A hammock along its bed's box (maps/plan.ts napBedAt): a post at its head (the back wall's side)
 * and one past its napper's toes, 0.8 tall, the cloth slung between their tops and sagging under
 * the napper (pose.ts napping: hips on its spot, its back up to its head), striped in `cloth`.
 * Bims m_33943: one kind of bed in a nap place, its posts never through a napper (Gabriel, bims-clip).
 */
export function hammock(k: Kit, g: Object3D, box: Box, cloth: readonly string[], wood: string): void {
  const { style } = k;
  const x = (box.x0 + box.x1) / 2;
  const hz = box.z0 + 0.04;
  const fz = box.z1 - 0.025;
  const spot = box.z1 - (NAP_BED.d / 2 - NAP_BED.back);
  for (const [z, h] of [[hz, 0.8], [fz, 0.62]] as const) {
    k.add(style.cylinder(0.035, h), k.mat(wood), g, x, h / 2, z);
    k.add(style.box(0.56, 0.04, 0.04), k.mat(wood), g, x, h - 0.04, z);
  }
  // the cloth's line: down from the head post under the napper's back, its lowest under the hips, up to the foot post
  const pts: readonly (readonly [number, number])[] = [[hz + 0.03, 0.74], [spot - 0.62, 0.6], [spot - 0.3, 0.32], [spot, 0.18], [fz - 0.03, 0.52]];
  const n = 12;
  const at = (t: number): readonly [number, number] => {
    const f = t * (pts.length - 1);
    const i = Math.min(pts.length - 2, Math.floor(f));
    const a = pts[i] ?? pts[0] ?? [hz, 0.7];
    const b = pts[i + 1] ?? a;
    const u = f - i;
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  };
  for (let j = 0; j < n; j++) {
    const [z0, y0] = at(j / n);
    const [z1, y1] = at((j + 1) / n);
    const len = Math.hypot(z1 - z0, y1 - y0);
    const s = k.add(style.box(0.52, 0.03, len + 0.01), k.mat(cloth[j % cloth.length] ?? wood), g, x, (y0 + y1) / 2, (z0 + z1) / 2);
    s.rotation.x = -Math.atan2(y1 - y0, z1 - z0);
  }
}

/** the nap corner: its rug, the two base beds, stage 3's cushions and stage 7's throw */
function napCorner(b: Build, g0: Groups, c: CozyLook, st: CozyStage): void {
  const { k, o } = b;
  const cz = o.cozy;
  if (!cz) return;
  const s0 = need(g0, 0);
  if (cz.rug) {
    const r = cz.rug;
    // between the floor's top and the lounge rugs the stages bring (never coplanar with either)
    k.add(k.style.box(r.x1 - r.x0, 0.012, r.z1 - r.z0), k.mat(c.rug), s0, (r.x0 + r.x1) / 2, 0.027, (r.z0 + r.z1) / 2);
    // its border, a band of its own a hair higher
    for (const [dz, w] of [[r.z0 + 0.1, r.x1 - r.x0 - 0.12], [r.z1 - 0.1, r.x1 - r.x0 - 0.12]] as const) k.add(k.style.box(w, 0.006, 0.05), k.mat(c.cloth[2]), s0, (r.x0 + r.x1) / 2, 0.036, dz);
  }
  const spots = o.lounge.slice(0, BASE_BEDS);
  const boxes = spots.map((s) => o.furniture.find((f) => f.of?.x === s.x && f.of.z === s.z));
  boxes.forEach((bx, i) => { const sp = spots[i]; if (bx && sp) bed(k, bedGroup(s0, sp), bx, c.bed, c, i); });
  const first = boxes[0];
  if (st.cushions && cz.rug) {
    // two cushions on the rug's front corners, off the beds (a wall's bench may stand at its back)
    const r = cz.rug;
    const g3 = need(g0, 3);
    // on the rug's corners off every bed a stage brings (and its napper's head)
    const beds = o.furniture.filter((f) => f.of !== undefined && o.lounge.some((l) => l.x === f.of?.x && l.z === f.of.z));
    // along its front edge (its back may run under a bench or a stove by the wall), the ends first
    const n = Math.max(2, Math.floor((r.x1 - r.x0 - 0.28) / 0.2) + 1);
    const xs = Array.from({ length: n }, (_, i) => r.x0 + 0.14 + (i * (r.x1 - r.x0 - 0.28)) / (n - 1));
    const corners = [...xs.filter((_, i) => i % 2 === 0), ...xs.filter((_, i) => i % 2 === 1).reverse()].map((x) => [x, r.z1 - 0.14] as const);
    const free = corners.filter(([x, z]) => !beds.some((f) => x > f.x0 - 0.2 && x < f.x1 + 0.2 && z > f.z0 - 0.2 && z < f.z1 + 0.2) && !o.lounge.some((l) => { const h = headRoom(l); return x > h.x0 && x < h.x1 && z > h.z0 && z < h.z1; }));
    const two = free.length > 1 ? [free[0], free.reduce((a, b) => (Math.abs(b[0] - (free[0]?.[0] ?? 0)) > Math.abs(a[0] - (free[0]?.[0] ?? 0)) ? b : a))] : free;
    two.forEach((pt, j) => {
      if (!pt) return;
      const [x, z] = pt;
      const p = k.add(k.style.box(0.18, 0.09, 0.18, 0.04), k.mat(c.art[j] ?? c.art[0]), g3, x, 0.092, z);
      p.rotation.y = 0.4 * (j ? -1 : 1);
    });
  }
  if (st.throwOn && first && spots[0]) {
    // a throw over the first bed's foot, its own piece
    const g7 = bedGroup(need(g0, 7), spots[0]);
    // on a flat bed thin and flat on its top: the napper's heels rest on it, its back on the bed (render/nap.test.ts)
    const flat = BED_TOP[c.bed];
    const top = c.bed === 'pouf' ? 0.42 : c.bed === 'hammock' ? 0.48 : (flat ?? 0.25) + 0.006;
    k.add(k.style.box(first.x1 - first.x0 - 0.12, flat === undefined ? 0.015 : 0.008, 0.16), k.mat(c.art[1]), g7, (first.x0 + first.x1) / 2, top, first.z1 - 0.14);
  }
}

// ---- the shelf, the lamps, the posters

/** the low shelf: its sides, one or two shelves, books, the small plant, the map's object; stage 8's second row, stage 12's trophy */
function shelf(k: Kit, g0: Groups, it: Item, c: CozyLook, st: CozyStage): void {
  const { style } = k;
  const { w, d } = sizeOf(it);
  const g = at(need(g0, 0), it);
  const H = 0.62;
  for (const sx of [-1, 1]) k.add(style.box(0.04, H, d), k.mat(c.wood), g, sx * (w / 2 - 0.02), H / 2, 0);
  for (const y of [0.04, 0.31, H - 0.02]) k.add(style.box(w - 0.08, 0.03, d - 0.02), k.mat(c.wood), g, 0, y, 0);
  k.add(style.box(w - 0.08, H - 0.06, 0.02), k.mat(c.wood), g, 0, H / 2, -d / 2 + 0.01);
  // the lower row: books
  books(k, g, -w / 2 + 0.1, 0.055, 0, 5, c);
  // the top: the small plant, the map's object
  plant(k, g, -w / 2 + 0.2, H, 0, c.small, c.pot, 0.45);
  thing(k, g, 0.05, H, 0, c.shelf, c);
  // the upper row: more books, a box (stage 8)
  if (st.shelfRows === 2) {
    const g8 = at(need(g0, 8), it);
    books(k, g8, -w / 2 + 0.08, 0.325, 0, 4, c);
    k.add(style.box(0.2, 0.12, d - 0.1), k.mat(c.art[0]), g8, w / 2 - 0.18, 0.325 + 0.06, 0);
  }
  if (st.trophy !== 'none') {
    const g12 = at(need(g0, 12), it);
    const gold = st.trophy === 'golden';
    const m = gold ? style.material(WORLD.gold, { emissive: WORLD.gold, ei: 0.15 }) : k.mat(WORLD.metal);
    const tx = w / 2 - 0.15;
    k.add(style.box(0.1, 0.04, 0.08), k.mat(WORLD.dark), g12, tx, H + 0.02, 0);
    k.add(style.cylinder(0.012, 0.08), m, g12, tx, H + 0.08, 0);
    k.add(style.cylinder(0.05, 0.07), m, g12, tx, H + 0.155, 0);
    for (const sx of [-1, 1]) k.add(style.box(0.02, 0.04, 0.02), m, g12, tx + sx * 0.06, H + 0.16, 0);
  }
}

/** n books standing on a shelf from x, leaning the last */
function books(k: Kit, g: Object3D, x: number, y: number, z: number, n: number, c: CozyLook): void {
  let bx = x;
  for (let i = 0; i < n; i++) {
    const h = 0.16 + ((i * 37) % 5) * 0.015;
    const t = 0.04 + (i % 2) * 0.012;
    const m = k.add(k.style.box(t, h, 0.15), k.mat([c.art[0], c.art[1], c.art[2], c.cloth[0]][i % 4] ?? c.art[0]), g, bx + t / 2, y + h / 2, z);
    if (i === n - 1) {
      m.rotation.z = -0.3;
      m.position.x += 0.03;
    }
    bx += t + 0.008;
  }
}

/** the map's object on the shelf (its middle at x, standing on y) */
function thing(k: Kit, g: Object3D, x: number, y: number, z: number, kind: ShelfKind, c: CozyLook): void {
  const { style } = k;
  switch (kind) {
    case 'vinyl':
      k.add(style.box(0.26, 0.26, 0.015), k.mat(c.art[1]), g, x, y + 0.13, z - 0.04).rotation.x = -0.15;
      k.add(style.cylinder(0.1, 0.012), k.mat(WORLD.dark), g, x, y + 0.006, z + 0.06);
      return;
    case 'jars':
      for (let i = 0; i < 3; i++) {
        k.add(style.cylinder(0.04, 0.1 + i * 0.02), style.material('#bfe1f2', { opacity: 0.75 }), g, x - 0.1 + i * 0.1, y + 0.05 + i * 0.01, z);
        k.add(style.cylinder(0.042, 0.02), k.mat(c.wood), g, x - 0.1 + i * 0.1, y + 0.11 + i * 0.02, z);
      }
      return;
    case 'globe':
      k.add(style.cylinder(0.05, 0.03), k.mat(c.wood), g, x, y + 0.015, z);
      k.add(style.cylinder(0.008, 0.06), k.mat(BRASS), g, x, y + 0.06, z);
      k.add(style.ball(0.09), k.mat('#6cb4ee'), g, x, y + 0.17, z);
      k.add(style.ball(0.05), k.mat(LEAF[0]), g, x + 0.05, y + 0.19, z + 0.03);
      return;
    case 'radio':
      k.add(style.box(0.26, 0.15, 0.1), k.mat(c.art[2]), g, x, y + 0.075, z);
      k.add(style.cylinder(0.04, 0.012), k.mat(WORLD.dark), g, x - 0.06, y + 0.08, z + 0.055).rotation.x = Math.PI / 2;
      k.add(style.box(0.008, 0.16, 0.008), k.mat(GREY), g, x + 0.1, y + 0.23, z);
      return;
    case 'vase': {
      const v = k.add(style.ball(0.07), k.mat(c.art[2]), g, x, y + 0.08, z);
      v.scale.y = 1.4;
      k.add(style.cylinder(0.006, 0.18), k.mat('#6b4a32'), g, x, y + 0.22, z);
      return;
    }
    case 'lantern':
    case 'brasslamp':
      k.add(style.box(0.12, 0.18, 0.12), k.mat(BRASS), g, x, y + 0.09, z);
      k.add(style.box(0.08, 0.12, 0.125), style.material('#ffd166', { emissive: '#ffd166', ei: 0.3 }), g, x, y + 0.09, z);
      k.add(style.ball(0.03), k.mat(BRASS), g, x, y + 0.21, z);
      return;
    case 'candles':
      for (let i = 0; i < 3; i++) {
        const h = 0.08 + i * 0.03;
        k.add(style.cylinder(0.025, h), k.mat(CUP), g, x - 0.06 + i * 0.06, y + h / 2, z);
        k.add(style.ball(0.012), style.material('#ffd166', { emissive: '#ffd166', ei: 0.8 }), g, x - 0.06 + i * 0.06, y + h + 0.015, z);
      }
      return;
    case 'pottery':
    case 'calabash': {
      const p = k.add(style.ball(0.09), k.mat(kind === 'calabash' ? '#c9a24a' : '#a0673f'), g, x, y + 0.08, z);
      p.scale.y = kind === 'calabash' ? 0.75 : 1.1;
      k.add(style.box(0.12, 0.012, 0.012), k.mat(c.art[0]), g, x, y + 0.08, z + 0.09);
      return;
    }
    case 'boat':
      k.add(style.box(0.24, 0.05, 0.07), k.mat(c.art[0]), g, x, y + 0.025, z);
      k.add(style.box(0.008, 0.18, 0.008), k.mat(c.wood), g, x, y + 0.14, z);
      k.add(style.box(0.012, 0.12, 0.09), k.mat(CUP), g, x + 0.01, y + 0.15, z).rotation.y = Math.PI / 2;
      return;
    case 'surf':
    default: {
      const s = k.add(style.box(0.12, 0.42, 0.025), k.mat(c.art[0]), g, x, y + 0.21, z - 0.05);
      s.rotation.x = -0.12;
      k.add(style.box(0.02, 0.38, 0.03), k.mat(c.art[1]), g, x, y + 0.21, z - 0.04).rotation.x = -0.12;
    }
  }
}

/** a floor lamp (a foot, a pole, its shade lit at night) and its small side table with a cup and a book: a corner, not a pole alone (designer m_32271) */
function lamp(k: Kit, g: Object3D, it: Item, c: CozyLook): void {
  const { style } = k;
  const { w } = sizeOf(it);
  const grp = at(g, it);
  const t = new Group();
  t.position.set(w / 2 - 0.2, 0, 0);
  grp.add(t);
  k.add(style.cylinder(0.17, 0.035), k.mat(c.wood), t, 0, 0.45, 0);
  k.add(style.cylinder(0.025, 0.43), k.mat(c.wood), t, 0, 0.215, 0);
  k.add(style.cylinder(0.1, 0.02), k.mat(c.wood), t, 0, 0.01, 0);
  k.add(style.box(0.16, 0.035, 0.12), k.mat(c.art[1]), t, -0.03, 0.485, -0.02);
  k.add(style.cylinder(0.035, 0.07), k.mat(c.cloth[0]), t, 0.07, 0.502, 0.05);
  const p = new Group();
  p.position.set(-w / 2 + 0.22, 0, 0);
  grp.add(p);
  k.add(style.cylinder(0.16, 0.03), k.mat(c.wood), p, 0, 0.015, 0);
  k.add(style.cylinder(0.022, 1.3), k.mat(WORLD.dark), p, 0, 0.68, 0);
  // a warm shade, lit at night
  const shade = k.glow(WARM, { night: 1.0, emissive: k.pal.lampOn });
  k.add(style.cylinder(0.2, 0.3), shade, p, 0, 1.45, 0);
}

/** a poster on its wall: flat colours of the map, framed from stage 6 (a frame round it, the print kept) */
function poster(k: Kit, g0: Groups, p: Hung, c: CozyLook, st: CozyStage, i: number): void {
  const { style } = k;
  const g = new Group();
  g.position.set(p.x, p.y, p.z);
  g.rotation.y = p.face;
  // its print drawn at 0.42 x 0.52, scaled up to its wall size (~0.8 x 1.0: bims m_32218)
  g.scale.set(p.w / POSTER_W, p.h / POSTER_H, 1);
  need(g0, 0).add(g);
  const w = POSTER_W;
  const h = POSTER_H;
  const a = c.art[i % 3] ?? c.art[0];
  const b = c.art[(i + 1) % 3] ?? c.art[1];
  const z1 = 0.02;
  const z2 = 0.034;
  switch (c.poster) {
    case 'kakemono': {
      k.add(style.box(w * 0.55, h, 0.012), k.mat(CUP), g, 0, 0, z1);
      for (const dy of [-h / 2, h / 2]) k.add(style.cylinder(0.014, w * 0.65), k.mat(c.wood), g, 0, dy, z1).rotation.z = Math.PI / 2;
      k.add(style.box(0.05, h * 0.5, 0.01), k.mat(WORLD.ink), g, 0, 0.02, z2 - 0.006);
      break;
    }
    case 'papel': {
      k.add(style.box(w + 0.2, 0.008, 0.008), k.mat(GREY), g, 0, h / 2 - 0.02, z1);
      for (let j = 0; j < 5; j++) k.add(style.box(0.1, 0.13, 0.008), k.mat([a, b, c.art[2]][j % 3] ?? a), g, -w / 2 - 0.05 + (j * (w + 0.1)) / 4, h / 2 - 0.1, z1 + 0.006);
      return;
    }
    case 'pennant': {
      const t = k.add(style.box(w * 0.75, h * 0.32, 0.012), k.mat(a), g, 0, h / 4, z1);
      t.rotation.z = -0.08;
      k.add(style.box(w * 0.8, h * 0.36, 0.012), k.mat(CUP), g, 0, -h / 4, z1);
      for (let j = 0; j < 3; j++) k.add(style.box(w * 0.6, 0.025, 0.008), k.mat(b), g, 0, -h / 4 + 0.1 - j * 0.07, z2 - 0.006);
      break;
    }
    case 'rug':
    case 'tapestry': {
      k.add(style.box(w, h, 0.015), k.mat(a), g, 0, 0, z1);
      for (let j = 0; j < 3; j++) k.add(style.box(w - 0.06, 0.04, 0.008), k.mat(j === 1 ? c.art[2] : b), g, 0, -h / 3 + (j * h) / 3, z2);
      if (c.poster === 'rug') for (let j = 0; j < 5; j++) k.add(style.box(0.012, 0.05, 0.008), k.mat(CUP), g, -w / 2 + 0.05 + (j * (w - 0.1)) / 4, -h / 2 - 0.025, z1);
      break;
    }
    default: {
      // a flat print: a light ground and the map's shapes on it, each a mesh of its own
      // a ground of the map's strong colour (the movie's dark), its shapes in the others and cream
      k.add(style.box(w, h, 0.012), k.mat(c.poster === 'movie' ? WORLD.dark : c.poster === 'botanic' || c.poster === 'map' ? CUP : a), g, 0, 0, z1);
      const shapes: Record<string, readonly [number, number, number, number, string][]> = {
        flat: [[0, 0.06, w * 0.6, h * 0.42, b], [0.06, -h * 0.3, w * 0.45, h * 0.14, CUP]],
        botanic: [[0, 0.04, 0.03, h * 0.6, LEAF[1]], [-0.07, 0.08, 0.12, 0.06, LEAF[0]], [0.07, -0.02, 0.12, 0.06, LEAF[0]]],
        ads: [[0, 0.08, w * 0.5, w * 0.5, b], [0, -h * 0.3, w * 0.7, 0.05, CUP]],
        map: [[-0.06, 0.05, 0.16, 0.14, LEAF[0]], [0.07, -0.08, 0.12, 0.1, LEAF[1]], [0, 0, w * 0.85, 0.02, b]],
        carnival: [[-0.08, 0.1, 0.12, 0.12, CUP], [0.08, 0, 0.12, 0.12, b], [-0.02, -0.14, 0.14, 0.1, c.art[2]]],
        sea: [[0, -0.08, w * 0.85, 0.12, '#3d6fb6'], [0, 0.02, w * 0.85, 0.05, CUP], [0.08, 0.14, 0.08, 0.08, b]],
        movie: [[0, 0.06, w * 0.7, h * 0.4, a], [0, -h * 0.3, w * 0.6, 0.04, b]],
      };
      // each shape a step out from the one before (more than its 8 mm): the botanic's leaves cross
      // its stem, and in one plane they z-fought (walls.test.ts)
      (shapes[c.poster] ?? shapes.flat ?? []).forEach(([dx, dy, sw, sh, col], i) => k.add(style.box(sw, sh, 0.008), k.mat(col), g, dx, dy, z2 + i * 0.016));
    }
  }
  if (st.framed) {
    // stage 6: the print gets its frame (four bars round it, in front of the wall)
    const g6 = new Group();
    g6.position.copy(g.position);
    g6.rotation.y = p.face;
    need(g0, 6).add(g6);
    const fw = p.w + 0.06;
    const fh = p.h + 0.06;
    const m = k.mat(c.wood);
    for (const dy of [-fh / 2, fh / 2]) k.add(style.box(fw + 0.03, 0.03, 0.03), m, g6, 0, dy, 0.022);
    for (const dx of [-fw / 2, fw / 2]) k.add(style.box(0.03, fh - 0.03, 0.03), m, g6, dx, 0, 0.022);
  }
}

// ---- the desks

type DeskThing = 'mug' | 'plant' | 'books' | 'photo';
const DESK_THINGS: readonly DeskThing[] = ['mug', 'plant', 'books', 'photo'];

/** what stands on an agent's desk, hash-stable per bim: its first, and its second from stage 4 */
export function deskThings(name: string, n: 1 | 2): DeskThing[] {
  const h = hash(`cozy:${name}`);
  const a = DESK_THINGS[h % 4] ?? 'mug';
  const b = DESK_THINGS[(h % 4 + 1 + ((h >> 3) % 3)) % 4] ?? 'books';
  return n === 2 ? [a, b] : [a];
}

/** one desk object at (x, y, z) in g */
function deskThing(k: Kit, g: Object3D, x: number, y: number, z: number, kind: DeskThing, c: CozyLook, h: number): void {
  const { style } = k;
  switch (kind) {
    case 'mug':
      k.add(style.cylinder(0.045, 0.09), k.mat([c.art[0], c.art[1], CUP][h % 3] ?? CUP), g, x, y + 0.045, z);
      k.add(style.box(0.02, 0.05, 0.015), k.mat([c.art[0], c.art[1], CUP][h % 3] ?? CUP), g, x + 0.055, y + 0.05, z);
      return;
    case 'plant':
      plant(k, g, x, y, z, c.small, c.pot, 0.33);
      return;
    case 'books':
      for (let i = 0; i < 3; i++) k.add(style.box(0.2 - i * 0.02, 0.035, 0.14 - i * 0.01), k.mat([c.art[i % 3], c.cloth[0], c.art[2]][i] ?? c.art[0]), g, x, y + 0.018 + i * 0.036, z).rotation.y = (i - 1) * 0.12;
      return;
    case 'photo':
    default: {
      const f = new Group();
      f.position.set(x, y, z);
      f.rotation.y = 0.5;
      g.add(f);
      k.add(style.box(0.13, 0.11, 0.02), k.mat(c.wood), f, 0, 0.06, 0);
      k.add(style.box(0.1, 0.08, 0.008), k.mat([c.art[1], c.art[2], c.cloth[0]][h % 3] ?? c.art[1]), f, 0, 0.06, -0.012);
      k.add(style.box(0.02, 0.08, 0.02), k.mat(c.wood), f, 0, 0.04, 0.035).rotation.x = 0.4;
    }
  }
}

/** where a desk object may stand, in the desk's frame (local +z away from the chair; the laptop in the middle, the lamp at +x's far corner): the left side first */
const DESK_SLOTS: readonly (readonly [number, number])[] = [[-0.5, 0.12], [-0.5, -0.14], [-0.3, 0.16], [0.42, -0.14], [-0.62, 0], [0.3, -0.18], [-0.38, -0.2]];
/** an object's half size on the desk, and how high it may rise */
const OBJ_R = 0.11;
const OBJ_H = 0.2;

/**
 * The objects on each agent's desk, on free spots of its top (the world's meshes there: the
 * laptop, the lamp, the map's own dressing): the first at stage 0, the second from stage 4.
 * `solid`: the world's boxes before the cozy kit.
 */
function desks(b: Build, g0: Groups, handles: ReadonlyMap<string, DeskHandles>, c: CozyLook, st: CozyStage, solid: readonly Box3[]): void {
  const { k, o } = b;
  for (const [name, s] of o.desks) {
    const hd = handles.get(name);
    if (!hd) continue;
    const dx = hd.top.x - s.x;
    const dz = hd.top.z - s.z;
    const face = Math.hypot(dx, dz) > 0.05 ? Math.atan2(dx, dz) : s.face;
    const sin = Math.sin(face);
    const cos = Math.cos(face);
    const near = solid.filter((x) => x.max.x > hd.top.x - 1.2 && x.min.x < hd.top.x + 1.2 && x.max.z > hd.top.z - 1.2 && x.min.z < hd.top.z + 1.2);
    // the desk's top under a spot, and nothing standing on it there
    const free = (lx: number, lz: number, taken: readonly Pt[]): { y: number } | null => {
      const wx = hd.top.x + lx * cos + lz * sin;
      const wz = hd.top.z - lx * sin + lz * cos;
      if (taken.some((p) => Math.hypot(p.x - wx, p.z - wz) < 2 * OBJ_R + 0.03)) return null;
      const under = near.filter((x) => x.min.x < wx - OBJ_R && x.max.x > wx + OBJ_R && x.min.z < wz - OBJ_R && x.max.z > wz + OBJ_R && Math.abs(x.max.y - hd.top.y) < 0.06);
      if (under.length === 0) return null;
      const y = Math.max(...under.map((x) => x.max.y));
      const hit = near.some((x) => x.max.y > y + 0.01 && x.min.y < y + OBJ_H && x.min.x < wx + OBJ_R && x.max.x > wx - OBJ_R && x.min.z < wz + OBJ_R && x.max.z > wz - OBJ_R);
      return hit ? null : { y };
    };
    const taken: Pt[] = [];
    const h = hash(name);
    deskThings(name, st.deskObjects).forEach((kind, i) => {
      for (const [lx, lz] of DESK_SLOTS) {
        const ok = free(lx, lz, taken);
        if (!ok) continue;
        taken.push({ x: hd.top.x + lx * cos + lz * sin, z: hd.top.z - lx * sin + lz * cos });
        const g = new Group();
        g.position.set(hd.top.x, 0, hd.top.z);
        g.rotation.y = face;
        need(g0, i === 0 ? 0 : 4).add(g);
        deskThing(k, g, lx, ok.y, lz, kind, c, h);
        return;
      }
    });
  }
}

// ---- the whole

/**
 * The frames' columns on the back wall from xa to xb, `pitch` apart, round the posters hung there
 * (the cozy posters take their place first: the frames go round them). At least one. Pure.
 */
export function frameXs(o: Office, xa: number, xb: number, pitch: number): number[] {
  const posters = (o.cozy?.posters ?? []).filter((p) => p.wall === 'back');
  const out: number[] = [];
  for (let x = xa + pitch / 2; x <= xb - pitch / 2 + 1e-9; x += pitch) {
    if (!posters.some((p) => Math.abs(p.x - x) < p.w / 2 + 0.2)) out.push(x);
  }
  return out.length > 0 ? out : [xa + pitch / 2];
}

/**
 * Every mesh's box under root, world units: a merged cozy mesh (mergeInto) by its pieces' boxes, so
 * a law sees a cushion, not the office-wide box of everything merged with it.
 */
export function meshBoxes(root: Object3D, precise = true): Box3[] {
  root.updateMatrixWorld(true);
  const out: Box3[] = [];
  const seen = new Set<unknown>();
  root.traverse((m) => {
    if (!(m instanceof Mesh)) return;
    const parts = m.userData.parts as Box3[] | undefined;
    if (!parts) out.push(new Box3().setFromObject(m, precise));
    else if (!seen.has(parts)) {
      seen.add(parts);
      out.push(...parts);
    }
  });
  return out;
}

/** the group of stage n's loose pieces, made on first ask */
function need(g0: Groups, n: number): Group {
  let g = g0.get(n);
  if (!g) {
    g = new Group();
    g0.set(n, g);
  }
  return g;
}

/** each stage's loose pieces merged (merge.ts) into that stage's group of the world; the loose geometries freed */
function mergeInto(b: Build, g0: Groups): void {
  for (const [n, g] of g0) {
    const into = b.stage(n);
    if (!into) continue;
    // each loose piece's box, kept on the merged meshes: the laws (clip.test, cozy.test) read pieces, not one office-wide box
    g.updateMatrixWorld(true);
    const parts: Box3[] = [];
    // a bed's pieces by its key too (render/nap.ts bedGroup): clip.test tells them from what else stands in its box
    const bedParts: Record<string, Box3[]> = {};
    g.traverse((x) => {
      if (!(x instanceof Mesh)) return;
      const box = new Box3().setFromObject(x);
      parts.push(box);
      const key = bedOfMesh(x);
      if (key !== undefined) (bedParts[key] ??= []).push(box);
    });
    const m = mergeRoot(g, b.k.style, b.k.style.shadows);
    for (const mesh of [...m.group.children]) {
      mesh.userData.parts = parts;
      mesh.userData.bedParts = bedParts;
      into.add(mesh);
    }
    g.traverse((x) => { if (x instanceof Mesh) (x.geometry as BufferGeometry).dispose(); });
  }
}

/**
 * The office's cozy pieces at its stage (Office.cozy says where, the look's CozyLook in what), each
 * stage's merged into its group. `handles`: the desks drawn (their tops). Nothing without Office.cozy.
 */
export function buildCozy(b: Build, c: CozyLook, handles: ReadonlyMap<string, DeskHandles>, mainName: string): void {
  const { k, o, grow } = b;
  const cz = o.cozy;
  if (!cz || !b.stage(0)) return;
  const st = cozyAt(grow.stage);
  const g0: Groups = new Map();
  // the world as the look built it: the desk objects find a free spot on each desk's top
  // their geometry's boxes moved, not every vertex: cheap enough for a town of offices
  const solid = meshBoxes(b.root, false);
  const onIsland = st.coffeeOnIsland && cz.islandTop !== undefined;
  coffeeCorner(k, g0, cz.coffee, c, st, onIsland);
  if (onIsland) coffeeOnIsland(k, need(g0, 2), o.island, cz.islandTop, c);
  napCorner(b, g0, c, st);
  shelf(k, g0, cz.shelf, c, st);
  cz.lamps.slice(0, st.floorLamps).forEach((it, i) => { lamp(k, need(g0, i === 0 ? 0 : 10), it, c); });
  cz.plants.slice(0, st.floorPlants).forEach((it, i) => {
    const g = at(need(g0, [0, 0, 1, 5][i] ?? 5), it);
    plant(k, g, 0, 0, 0, c.plant, c.pot, FLOOR_PLANT);
    // stage 11: the plants grow bigger still, a second pot of leaves at their foot
    if (st.bigPlants) plant(k, at(need(g0, 11), it), 0.14, 0, 0.14, c.small, c.pot, 0.55);
  });
  if (st.hanging && cz.hangOver) {
    // stage 5: a hanging plant on a bracket over the shelf's right end, on a tall wall
    const it = cz.shelf;
    const { w, d } = sizeOf(it);
    const g = new Group();
    g.position.set(w / 2 - 0.12, 0, -d / 2);
    at(need(g0, 5), it).add(g);
    hanging(k, g, c.hang ?? 'pothos', c.pot, 1.45);
  }
  cz.posters.forEach((p, i) => { poster(k, g0, p, c, st, i); });
  desks(b, g0, new Map([...handles].filter(([n]) => n !== mainName)), c, st, solid);
  mergeInto(b, g0);
}

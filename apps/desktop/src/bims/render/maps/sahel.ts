// The Sahel's look (a banco compound; render/maps/look.ts; its plan: maps/sahel.ts): beaten earth,
// thick rounded banco walls with their torons (wooden beams) and the cones on the buttresses, the
// hangar of posts and branches over the desks and their woven mats, the granaries with their straw
// hats, water jars, wax cloth drying on a line; the baobab in the yard and the attaya under it;
// mats along the back wall to nap; small baobabs and acacias; a wax print scarf on every bim. Its
// growth (page bims-maps, Sahel · la concession en banco): a calabash of mint, mangoes and the
// first acacia, two mats, a slate against the banco, a bogolan and a kora, the full attaya set, a
// second branch shelter, the baobab grows and more mats, an awalé under the tree, a well and its
// pulley, the tailor's corner, the river and a pirogue, storks passing, a golden djembé; studio
// portraits in black and white, a golden frame at 500. Owner: maps-c.
import { Group, type Object3D } from 'three';
import type { Pt } from '../../model';
import type { SahelOffice } from '../../maps/sahel';
import type { Kit } from '../kit';
import { DAY, NIGHT, WORLD, hash } from '../palette';
import type { Build, MapLook, Wear } from './look';
import {
  beds, cone, deskOf, floorOf, frames, gameTable, glow, grow, mainDeskOf, nc, palOf, patterned,
  pieceSpots, plinth, terrace, treeSpots, type Piece, pastNap,
} from './yard';

const STRAW = '#d9b86a';
const WOOD = '#6b4a32';
const BARK = '#9a8a78';
const LEAF = '#7a9a4a';
const WAX = [['#2a9d8f', '#e9c46a'], ['#f28c28', '#2f5fa7'], ['#7b5fc0', '#e9c46a']] as const;
const MATS = ['#2a9d8f', '#f28c28', '#e9c46a', '#7b5fc0'] as const;

const pal = (night: boolean) =>
  palOf(night ? NIGHT : DAY, {
    floor: nc('#dfaa72', night, 0.62),
    wall: nc('#c98a4e', night),
    wallTop: nc('#b07a42', night),
    desk: nc(WOOD, night, 1.2),
    deskTop: nc('#8a5a3c', night, 1.2),
    island: WOOD,
    islandTop: '#8a5a3c',
    grass: nc('#c9a35a', night),
    dirt: nc('#9a6a3e', night),
    terrace: nc('#d9b07a', night),
    plant: LEAF,
  });

const office = (b: Build): SahelOffice => b.o as SahelOffice;

/** a woven mat: stripes of straw and a colour */
function mat(k: Kit, g: Object3D, x: number, z: number, w: number, d: number, c: string): void {
  for (let i = 0; i < 5; i++) k.add(k.style.box(w, 0.02, d / 5), k.mat(i % 2 ? c : STRAW), g, x, 0.035, z - d / 2 + (i + 0.5) * (d / 5));
}

/** a branch shelter: four posts, a roof of a few thin branches and straw (bims: thick ones crossed the bims' heads at 320) */
function hangar(k: Kit, g: Object3D, x0: number, x1: number, z0: number, z1: number): void {
  for (const x of [x0, x1]) for (const z of [z0, z1]) k.add(k.style.cylinder(0.08, 2.0), k.mat(WOOD), g, x, 1.0, z);
  for (let z = z0; z <= z1 + 0.01; z += 1.8) k.add(k.style.cylinder(0.018, x1 - x0 + 0.4), k.mat('#b08a5a'), g, (x0 + x1) / 2, 2.02, z).rotation.z = Math.PI / 2;
  for (let i = 0; i < 3; i++) k.add(k.style.box(x1 - x0, 0.03, 0.4), k.mat(STRAW), g, (x0 + x1) / 2, 2.06, z0 + 0.5 + (i * (z1 - z0 - 1)) / 2);
}

/**
 * A buttress's x on the back wall, moved into the lane beside a nap spot it stood behind: there a
 * napper's head went into it (Gabriel, bims-life). The lanes are half a spot's pitch either side.
 */
function offNap(o: SahelOffice, x: number): number {
  const s = o.lounge.find((l) => Math.abs(l.x - x) < 0.6);
  if (!s) return x;
  return s.x + (x >= s.x ? 1 : -1) * Math.abs(s.ax - s.x);
}

function shell(b: Build): void {
  const { k, root } = b;
  const o = office(b);
  const { x0, W, D, hangar: H } = o;
  const night = k.pal.pendants;
  floorOf(k, root, o, patterned(k, k.pal.floor, W, D, 2.0, (g, px) => {
    g.fillStyle = nc('#d39a62', night, 0.62);
    for (let i = 0; i < 9; i++) g.fillRect((i * 23) % px, (i * 41) % px, 6, 3);
  }));
  // the banco walls: thick, rounded, the torons sticking out, cones on the buttresses
  const banco = k.mat(k.pal.wall);
  k.add(k.style.box(W + 0.2, 1.5, 0.4), banco, root, x0 + W / 2, 0.75, -0.2);
  k.add(k.style.box(0.4, 1.2, D + 0.2), banco, root, x0 - 0.2, 0.6, D / 2);
  for (let x = x0 + 0.6; x < x0 + W; x += 0.9) k.add(k.style.cylinder(0.035, 0.5), k.mat(WOOD), root, x, 1.2, 0.05).rotation.x = Math.PI / 2;
  for (let x = x0; x <= x0 + W + 0.01; x += W / 4) {
    k.add(k.style.box(0.55, 1.8, 0.6), banco, root, offNap(o, x), 0.9, -0.15);
    cone(k, root, 0.25, 0.5, k.pal.wall, offNap(o, x), 2.05, -0.15);
  }
  // the hangar over the desks, a woven mat under each desk
  hangar(k, root, H.x0, H.x1, H.z0, H.z1);
  for (const d of o.desks.values()) mat(k, root, d.x, d.z + 0.3, 1.6, 1.4, MATS[hash(`${d.x}`) % 4] ?? STRAW);
  // granaries with straw hats in the yard's back corner, water jars by the door
  for (const [gx, gz] of [[x0 + W - 0.9, 5.0], [x0 + W - 0.9, 6.3]] as const) {
    k.add(k.style.cylinder(0.4, 1.0), banco, root, gx, 0.5, gz);
    cone(k, root, 0.55, 0.55, STRAW, gx, 1.27, gz);
  }
  for (let i = 0; i < 3; i++) k.add(k.style.ball(0.2), k.mat('#a8764a'), root, o.door.x + 0.8 + i * 0.45, 0.2, D - 0.25).scale.y = 1.1;
  // wax cloth drying on a line in the yard
  const lx0 = o.tree.x - 1.8;
  const lx1 = o.tree.x + 1.8;
  const lz = 4.6;
  for (const lx of [lx0, lx1]) k.add(k.style.cylinder(0.04, 1.6), k.mat(WOOD), root, lx, 0.8, lz);
  k.add(k.style.cylinder(0.008, lx1 - lx0), k.mat(WORLD.dark), root, (lx0 + lx1) / 2, 1.55, lz).rotation.z = Math.PI / 2;
  WAX.forEach(([a, c], i) => {
    k.add(k.style.box(0.9, 0.7, 0.01), k.mat(a), root, lx0 + 0.75 + i * 1.1, 1.15, lz);
    for (let j = 0; j < 4; j++) k.add(k.style.box(0.12, 0.12, 0.01), k.mat(c), root, lx0 + 0.55 + i * 1.1 + (j % 2) * 0.4, 1.0 + Math.floor(j / 2) * 0.3, lz + 0.015);
  });
}

/** the baobab, and under it the attaya: a brazier, the little teapot, the glasses, low stools */
function island(b: Build): void {
  const { k, root } = b;
  const o = office(b);
  const { x: cx, z: cz } = o.tree;
  const big = b.grow.stage >= 8;
  k.add(k.style.cylinder(big ? 0.7 : 0.55, 2.0), k.mat(BARK), root, cx, 1.0, cz);
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3;
    const br = k.add(k.style.cylinder(0.1, 1.1), k.mat(BARK), root, cx + Math.sin(a) * 0.5, 2.3, cz + Math.cos(a) * 0.5);
    br.rotation.set(Math.cos(a) * 0.7, 0, -Math.sin(a) * 0.7);
    const leaves = b.grow.garden >= 3 ? '#6b9f3a' : '#8a9a5a';
    k.add(k.style.ball(big ? 0.45 : 0.35), k.mat(leaves), root, cx + Math.sin(a) * 1.0, 2.75, cz + Math.cos(a) * 1.0).scale.y = 0.55;
  }
  const ax = cx + 0.55;
  const az = cz + 0.55;
  k.add(k.style.cylinder(0.14, 0.2), k.mat(WORLD.dark), root, ax, 0.1, az);
  k.add(k.style.cylinder(0.11, 0.03), glow(k, '#f28c28', 1.6), root, ax, 0.21, az);
  k.add(k.style.ball(0.08), k.mat('#5c677d'), root, ax, 0.3, az);
  for (const s of o.islandSpots) k.add(k.style.cylinder(0.15, 0.2), k.mat(WOOD), root, s.x + Math.sin(s.face) * 0.05, 0.1, s.z + Math.cos(s.face) * 0.05);
}

/** mats along the back wall, a bolster on each */
function lounge(b: Build): void {
  const { k } = b;
  beds(b, (g, box, i) => {
    const x = (box.x0 + box.x1) / 2;
    const z = (box.z0 + box.z1) / 2;
    mat(k, g, x, z, 0.75, 0.6, MATS[i % 4] ?? STRAW);
    k.add(k.style.capsule(0.07, 0.4), k.mat(MATS[(i + 1) % 4] ?? STRAW), g, x, 0.1, box.z0 + 0.05).rotation.z = Math.PI / 2;
  });
}

/** small baobabs and acacias */
function tree(k: Kit, parent: Object3D, x: number, z: number, size: number): void {
  const g = new Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(size);
  parent.add(g);
  if (hash(`${x.toFixed(1)}${z.toFixed(1)}`) % 2) {
    k.add(k.style.cylinder(0.3, 1.1), k.mat(BARK), g, 0, 0.55, 0);
    k.add(k.style.ball(0.45), k.mat('#8a9a5a'), g, 0, 1.35, 0).scale.y = 0.5;
    return;
  }
  k.add(k.style.cylinder(0.06, 1.0), k.mat(WOOD), g, 0, 0.5, 0);
  k.add(k.style.ball(0.6), k.mat(LEAF), g, 0, 1.15, 0).scale.set(1.3, 0.3, 1.3);
}

const PIECES: Record<number, Piece> = {
  // a calabash of mint
  1: (k, g, p) => {
    k.add(k.style.cap(0.22, 0.6), k.mat('#c98a3e'), g, p.x, 0.25, p.z).rotation.x = Math.PI;
    for (let i = 0; i < 5; i++) k.add(k.style.ball(0.08), k.mat('#5fb35a'), g, p.x + Math.cos(i * 1.3) * 0.1, 0.3, p.z + Math.sin(i * 1.3) * 0.1);
  },
  // mangoes by the baobab, the first acacia
  2: (k, g, _p, b) => {
    const { x, z } = (b.o as SahelOffice).tree;
    k.add(k.style.cylinder(0.22, 0.05), k.mat(STRAW), g, x - 0.5, 0.05, z + 0.55);
    for (let i = 0; i < 4; i++) k.add(k.style.ball(0.07), k.mat(i % 2 ? '#e9c46a' : '#f28c28'), g, x - 0.5 + Math.cos(i * 1.6) * 0.1, 0.11, z + 0.55 + Math.sin(i * 1.6) * 0.1).scale.set(1.2, 0.9, 0.9);
    const t = treeSpots(b.o)[0];
    if (t) tree(k, g, t.x, t.z, 0.8 + b.grow.garden * 0.06);
  },
  3: () => undefined,
  // a slate leaning on the banco
  4: (k, g, p) => {
    const s = k.add(k.style.box(1.4, 0.9, 0.05), k.mat('#2b3a2f'), g, p.x, 0.45, 0.3);
    s.rotation.x = -0.15;
    k.add(k.style.box(1.5, 0.06, 0.08), k.mat(WOOD), g, p.x, 0.03, 0.36);
  },
  // a big bogolan on the wall, a kora leaning on it
  5: (k, g, p, b) => {
    const z = 0.03 + k.style.pictureZ;
    k.add(k.style.box(2.6, 1.0, 0.02), k.mat('#6b4a32'), g, p.x, 1.0, z);
    for (let i = 0; i < 12; i++) k.add(k.style.box(0.14, 0.14, 0.01), k.mat('#e8d6b0'), g, p.x - 1.1 + (i % 6) * 0.44, 0.75 + Math.floor(i / 6) * 0.5, z + 0.015);
    const kx = pastNap(b.o);
    k.add(k.style.ball(0.22), k.mat('#c98a3e'), g, kx, 0.25, 0.4).scale.z = 0.6;
    k.add(k.style.cylinder(0.025, 1.1), k.mat(WOOD), g, kx, 0.8, 0.35).rotation.x = -0.2;
  },
  // the full attaya set: the tray, three glasses
  6: (k, g, _p, b) => {
    const { x, z } = (b.o as SahelOffice).tree;
    k.add(k.style.box(0.4, 0.04, 0.25), k.mat('#b08a3c'), g, x + 0.95, 0.2, z + 0.3);
    for (let i = 0; i < 3; i++) k.add(k.style.cylinder(0.025, 0.07), k.style.material('#cfe8c3', { opacity: 0.8 }), g, x + 0.83 + i * 0.12, 0.26, z + 0.3);
  },
  // a second branch shelter for the shade
  7: (k, g, p) => {
    hangar(k, g, p.x - 1.0, p.x + 1.0, p.z - 0.6, p.z + 0.6);
    mat(k, g, p.x, p.z, 1.6, 1.0, '#2a9d8f');
  },
  // the baobab grows (island()), more trees all round
  8: (k, g, _p, b) => {
    for (const t of treeSpots(b.o).slice(1)) tree(k, g, t.x, t.z, 0.8 + b.grow.garden * 0.06);
  },
  // an awalé: a long board, two rows of six cups, seeds
  9: (k, g, p) => {
    k.add(k.style.box(1.0, 0.12, 0.35), k.mat(WOOD), g, p.x, 0.06, p.z);
    for (let i = 0; i < 12; i++) {
      const cx = p.x - 0.4 + (i % 6) * 0.16;
      const cz = p.z - 0.08 + Math.floor(i / 6) * 0.16;
      k.add(k.style.cylinder(0.05, 0.02), k.mat('#3b2a1e'), g, cx, 0.13, cz);
      k.add(k.style.ball(0.02), k.mat('#e8d6b0'), g, cx, 0.15, cz);
    }
  },
  // a well and its pulley
  10: (k, g, p) => {
    k.add(k.style.cylinder(0.45, 0.55), k.mat('#c98a4e'), g, p.x, 0.27, p.z);
    k.add(k.style.cylinder(0.32, 0.02), k.mat('#2b3a4a'), g, p.x, 0.56, p.z);
    for (const s of [-1, 1]) k.add(k.style.cylinder(0.04, 1.2), k.mat(WOOD), g, p.x + s * 0.45, 0.6, p.z);
    k.add(k.style.cylinder(0.03, 1.0), k.mat(WOOD), g, p.x, 1.2, p.z).rotation.z = Math.PI / 2;
    k.add(k.style.cylinder(0.1, 0.06), k.mat(WORLD.metal), g, p.x, 1.15, p.z).rotation.x = Math.PI / 2;
  },
  // the tailor's corner: a table, the sewing machine, a bolt of wax
  11: (k, g, p) => {
    gameTable(k, g, p, WOOD, '#8a5a3c');
    k.add(k.style.box(0.35, 0.18, 0.15), k.mat(WORLD.dark), g, p.x - 0.1, 0.48, p.z);
    k.add(k.style.box(0.08, 0.12, 0.12), k.mat(WORLD.dark), g, p.x + 0.12, 0.62, p.z);
    k.add(k.style.cylinder(0.08, 0.5), k.mat('#2a9d8f'), g, p.x + 0.25, 0.47, p.z + 0.25).rotation.z = Math.PI / 2;
  },
  // the river and a pirogue
  12: (k, g, p) => {
    const w = k.add(k.style.box(3.2, 0.03, 0.9), k.style.material('#5aa9a0', { emissive: '#5aa9a0', ei: 0.1 }), g, p.x, 0.02, p.z);
    w.rotation.y = 0.3;
    const boat = k.add(k.style.capsule(0.14, 0.9), k.mat(WOOD), g, p.x + 0.2, 0.1, p.z);
    boat.rotation.z = Math.PI / 2;
    boat.scale.y = 1.0;
    boat.rotation.y = 0.3;
  },
  // storks passing over
  13: (k, g, p) => {
    for (let i = 0; i < 3; i++) {
      const sx = p.x - i * 0.7;
      const sy = 2.6 + i * 0.25;
      const sz = p.z + i * 0.6;
      k.add(k.style.capsule(0.06, 0.25), k.mat('#fffaf0'), g, sx, sy, sz).rotation.z = Math.PI / 2;
      for (const s of [-1, 1]) k.add(k.style.box(0.05, 0.02, 0.35), k.mat(WORLD.dark), g, sx, sy + 0.03, sz + s * 0.2);
      k.add(k.style.box(0.12, 0.02, 0.02), k.mat('#f28c28'), g, sx + 0.25, sy, sz);
    }
  },
  // a golden djembé at main's mark
  14: (k, g, p) => {
    plinth(k, g, p, (gold, y) => {
      k.add(k.style.cylinder(0.1, 0.25), gold, g, p.x, y + 0.12, p.z);
      k.add(k.style.cap(0.22, 0.55), gold, g, p.x, y + 0.25, p.z).rotation.x = Math.PI;
      k.add(k.style.cylinder(0.22, 0.25), gold, g, p.x, y + 0.42, p.z);
    });
  },
};

/** a studio portrait in black and white (Seydou Keïta, Malick Sidibé), a golden frame from 500 */
function frame(k: Kit, parent: Object3D, x: number, y: number, z: number, i: number, golden: boolean): void {
  k.add(k.style.box(0.26, 0.32, 0.02), k.mat(golden ? WORLD.gold : WORLD.dark), parent, x, y, z);
  k.add(k.style.box(0.2, 0.26, 0.01), k.mat(i % 2 ? '#d8d2c6' : '#9a958c'), parent, x, y, z + 0.015);
  k.add(k.style.ball(0.05), k.mat(i % 2 ? '#3a3530' : '#1d1a17'), parent, x, y + 0.04, z + 0.02).scale.z = 0.2;
  k.add(k.style.box(0.1, 0.08, 0.01), k.mat(i % 2 ? '#3a3530' : '#1d1a17'), parent, x, y - 0.06, z + 0.02);
}

const pieceAt = (o: Parameters<MapLook['pieceAt']>[0], stage: number): Pt => {
  const t = (o as SahelOffice).tree;
  if (stage === 2 || stage === 6) return t;
  // the awalé under the baobab, off its ring of spots
  if (stage === 9) return { x: t.x, z: t.z - 2.4 };
  return pieceSpots(o)[Math.min(stage, 14)] ?? o.door;
};

function growth(b: Build): void {
  terrace(b, b.k.pal.terrace, ['#2a9d8f', '#e9c46a', '#f28c28']);
  grow(b, PIECES, pieceAt);
  const bx = pieceSpots(b.o)[4]?.x ?? b.o.x0 + b.o.W / 2;
  frames(b, { xa: bx + 1.1, xb: b.o.mainDesk.x - 0.6, y: 1.25 }, frame);
}

/** a wax print scarf round the neck */
function wear(w: Wear): void {
  const h = hash(w.name);
  const [a, c] = WAX[h % 3] ?? WAX[0];
  w.add(w.style.capsule(0.06, 0.3), w.mat(a), w.body, 0, 0.74, 0.12).rotation.z = Math.PI / 2;
  for (let i = 0; i < 3; i++) w.add(w.style.ball(0.03), w.mat(c), w.body, -0.12 + i * 0.12, 0.76, 0.18);
}

export const sahel: MapLook = {
  id: 'sahel',
  // its cozy pieces (render/cozy.ts; page bims-cozy v2 « la base, carte par carte »)
  cozy: { plant: 'aloe', small: 'succulent', coffee: 'attaya', bed: 'mat', shelf: 'calabash', poster: 'tapestry', wood: '#8a5a3c', cloth: ['#e9c46a', '#c98a3e', '#2a9d8f'], art: ['#c98a3e', '#2a9d8f', '#e9c46a'], pot: '#a0673f', rug: '#2a9d8f' },
  pal,
  shell,
  island,
  lounge,
  desk: (b, d, name) => deskOf(b, d, name, { chair: WOOD }),
  mainDesk: (b) => mainDeskOf(b, '#8a5a3c', WOOD),
  tree: ({ k }, parent, x, z, size) => {
    tree(k, parent, x, z, size);
  },
  growth,
  pieceAt,
  wear,
};

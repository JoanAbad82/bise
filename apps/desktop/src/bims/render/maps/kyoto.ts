// Kyoto's look (render/maps/look.ts; its plan: maps/kyoto.ts): a machiya on tatami (pale mats, dark
// borders), plaster walls in a dark wood frame, paper shoji on the left wall, dark wooden desks, the
// tea counter (the eating place), the kotatsu and its floor cushions (the nap place), the engawa and
// the inner garden on the right (raked gravel, moss, a stone lantern lit at night, a maple), a noren
// at the door; every bim but main wears an indigo hachimaki. Its growth (page bims-maps « Japon ·
// la machiya »): a bonsai, a bento and the first maple, two zabuton, a slate for the brush, a
// painted wave and a wind bell, a matcha set and moss, a paper umbrella, maples all round, a goban,
// the shishi-odoshi, an old arcade cabinet, a koi pond and its orange bridge, koinobori, a golden
// maneki-neko; hanging scrolls for frames. Never the app's red: the maples and the bridge are orange. Owner: maps-b.
import type { Object3D } from 'three';
import type { KyotoOffice } from '../../maps/kyoto';
import type { Office, Pt } from '../../model';
import { decorOf } from '../decor';
import { type Kit, boxOf, onFloor } from '../kit';
import { WORLD } from '../palette';
import { arcade, beds, bigDesk, boxHolding, grow, onPlinth, palettes, pieceAtOf, pool, turnedDesk, type Grower, type Piece } from './blook';
import type { Build, MapLook } from './look';
import { pillow } from '../cozy';
import { boxTop } from '../style';

const WOOD = '#4a3222';
const MAT_EDGE = '#3d4a2e';
const INDIGO = '#2b3a67';
const MAPLE = '#ec9a3c';
const MOSS = '#5f8f3a';
const STONE = '#a9adb3';
const CUSHIONS = [INDIGO, '#a8c96a', '#e9c46a'] as const;

const ky = (o: Office): KyotoOffice => o as KyotoOffice;
const boardX = (o: Office): number => o.boardSpots.reduce((s, p) => s + p.x, 0) / Math.max(1, o.boardSpots.length);
const counterX = (o: Office): number => (o.island.x0 + o.island.x1) / 2;
const piece = (at: (o: Office) => Pt, draw: Piece['draw'] = () => undefined): Piece => ({ at, draw });

/** a maple (orange leaves from stage 6, green before) or a clump of bamboo */
function tree(k: Kit, parent: Object3D, x: number, z: number, size: number, i: number, autumn: boolean): void {
  const { style } = k;
  if (i % 2 === 0) {
    k.add(style.cylinder(0.08 * size, 1.0 * size), k.mat(WOOD), parent, x, 0.5 * size, z);
    for (const [dx, y, dz, r] of [[0, 1.2, 0, 0.5], [0.3, 1.0, 0.2, 0.35], [-0.3, 1.05, -0.15, 0.32]] as const) {
      k.add(style.ball(r * size), k.mat(autumn ? MAPLE : '#7cb35a'), parent, x + dx * size, y * size, z + dz * size);
    }
    return;
  }
  for (let j = 0; j < 4; j++) {
    const bx = x + (j % 2) * 0.2;
    const bz = z + Math.floor(j / 2) * 0.2;
    k.add(style.cylinder(0.035, 2.0 * size), k.mat('#8fbf5a'), parent, bx, 1.0 * size, bz).rotation.z = (j - 1.5) * 0.05;
    k.add(style.ball(0.18), k.mat('#6b9f3a'), parent, bx, 2.0 * size, bz).scale.y = 0.5;
  }
}

/** the garden's inside spots: the lantern, the maple, the goban, the shishi-odoshi */
const gardenAt = (o: Office) => {
  const g = ky(o).garden;
  const gx = (g.x0 + g.x1) / 2;
  return {
    lantern: { x: gx + 0.9, z: g.z0 + 0.7 },
    maple: { x: gx - 0.2, z: (g.z0 + g.z1) / 2 },
    goban: { x: g.x0 + 0.7, z: g.z1 - 0.7 },
    bamboo: { x: g.x1 - 0.5, z: g.z1 - 0.5 },
  };
};

const grower: Grower = {
  pieces: [
    piece((o) => o.door),
    // 1 a bonsai on a low stand
    piece((o) => decorOf(o).plants[0] ?? o.door, (k, g, p) => {
      k.add(k.style.box(0.42, 0.12, 0.3), k.mat('#5c677d'), g, p.x, 0.06, p.z);
      k.add(k.style.cylinder(0.04, 0.35), k.mat(WOOD), g, p.x, 0.3, p.z).rotation.z = 0.4;
      for (const [dx, y] of [[-0.12, 0.42], [0.1, 0.5], [0.02, 0.6]] as const) k.add(k.style.ball(0.12), k.mat('#4e7a3a'), g, p.x + dx, y, p.z).scale.y = 0.5;
    }),
    // 2 a bento on the counter (the first maple: the garden's first tree)
    piece((o) => ({ x: counterX(o), z: o.island.z0 + 1.6 }), (k, g, p) => {
      k.add(k.style.box(0.44, 0.12, 0.32), k.mat(WORLD.dark), g, p.x, 0.75, p.z);
      k.add(k.style.box(0.18, 0.04, 0.12), k.mat(WORLD.paper), g, p.x - 0.1, 0.82, p.z - 0.06);
      k.add(k.style.box(0.18, 0.04, 0.12), k.mat('#7cc26b'), g, p.x + 0.1, 0.82, p.z - 0.06);
      k.add(k.style.box(0.38, 0.04, 0.12), k.mat(WORLD.orange), g, p.x, 0.82, p.z + 0.08);
    }),
    // 3 two zabuton by the kotatsu (beds)
    piece((o) => ({ x: (ky(o).kotatsu.x0 + ky(o).kotatsu.x1) / 2, z: 1.75 })),
    // 4 a slate for the brush, in a wooden frame; a bamboo in a pot
    piece((o) => ({ x: boardX(o), z: 0.9 }), (k, g, p, b) => {
      const pz = k.style.pictureZ;
      k.add(k.style.box(1.8, 0.95, 0.05), k.mat(WOOD), g, p.x, 1.05, 0.02 + pz);
      k.add(k.style.box(1.66, 0.82, 0.02), k.mat('#2f3437'), g, p.x, 1.05, 0.05 + pz);
      for (let i = 0; i < 4; i++) k.add(k.style.box(0.04, 0.5 - i * 0.08, 0.01), k.mat(WORLD.paper), g, p.x + 0.55 - i * 0.3, 1.1, 0.065 + pz);
      const p2 = decorOf(b.o).plants[1];
      if (p2) tree(k, g, p2.x, p2.z, 0.45, 1, false);
    }),
    // 5 a wave painted on a panel over the kotatsu; a wind bell under the engawa's eave
    piece((o) => ({ x: (ky(o).kotatsu.x0 + ky(o).kotatsu.x1) / 2, z: 0.4 }), (k, g, p, b) => {
      const pz = k.style.pictureZ;
      const w = ky(b.o).kotatsu.x1 - ky(b.o).kotatsu.x0;
      k.add(k.style.box(w, 0.6, 0.02), k.mat('#fbf6e8'), g, p.x, 1.2, 0.02 + pz);
      for (let i = 0; i < 5; i++) {
        const c = i % 2 ? '#3d6fb6' : INDIGO;
        k.add(k.style.box(w / 5 - 0.04, 0.08 + (i % 3) * 0.06, 0.01), k.mat(c), g, p.x - w / 2 + (i + 0.5) * (w / 5), 1.0 + (i % 3) * 0.07, 0.04 + pz);
      }
      k.add(k.style.ball(0.11), k.mat(WORLD.paper), g, p.x + w / 2 - 0.25, 1.36, 0.04 + pz);
      const gd = ky(b.o).garden;
      k.add(k.style.cylinder(0.005, 0.3), k.mat(WORLD.ink), g, gd.x0 - 0.25, 1.6, gd.z0);
      k.add(k.style.cap(0.08, 0.6), k.mat('#bfe1f2'), g, gd.x0 - 0.25, 1.42, gd.z0);
      k.add(k.style.box(0.06, 0.14, 0.01), k.mat(WORLD.paper), g, gd.x0 - 0.25, 1.28, gd.z0);
    }),
    // 6 a matcha set on the counter; moss spreads in the garden
    piece((o) => ({ x: counterX(o), z: o.island.z0 + 2.9 }), (k, g, p, b) => {
      k.add(k.style.box(0.4, 0.03, 0.3), k.mat(WOOD), g, p.x, 0.71, p.z);
      k.add(k.style.cylinder(0.08, 0.07), k.mat('#e9e2d4'), g, p.x - 0.08, 0.76, p.z);
      k.add(k.style.cylinder(0.06, 0.02), k.mat('#7cb35a'), g, p.x - 0.08, 0.8, p.z);
      k.add(k.style.cylinder(0.035, 0.14), k.mat('#d8c9a0'), g, p.x + 0.1, 0.79, p.z);
      const gd = ky(b.o).garden;
      for (const [fx, fz, r] of [[0.25, 0.3, 0.45], [0.7, 0.75, 0.35], [0.2, 0.85, 0.3]] as const) {
        k.add(k.style.ball(r), k.mat(MOSS), g, gd.x0 + (gd.x1 - gd.x0) * fx, 0, gd.z0 + (gd.z1 - gd.z0) * fz).scale.y = 0.35;
      }
    }),
    // 7 a paper umbrella over the terrace
    piece((o) => decorOf(o).parasol, (k, g, p) => {
      k.add(k.style.cylinder(0.03, 1.8), k.mat(WOOD), g, p.x, 0.9, p.z);
      const top = k.add(k.style.cap(0.85, 0.35), k.mat(MAPLE), g, p.x, 1.75, p.z);
      top.scale.y = 0.6;
      k.add(k.style.cap(0.4, 0.35), k.mat(WORLD.paper), g, p.x, 1.79, p.z).scale.y = 0.6;
    }),
    // 8 maples all round (the garden's trees), the kotatsu full
    piece((o) => decorOf(o).trees[1] ?? o.door),
    // 9 a goban by the engawa, its two bowls of stones
    piece((o) => gardenAt(o).goban, (k, g, p) => {
      k.add(k.style.box(0.5, 0.18, 0.5), k.mat('#e2b880'), g, p.x, 0.09, p.z);
      for (let i = 0; i < 3; i++) {
        k.add(k.style.box(0.44, 0.005, 0.01), k.mat(WORLD.ink), g, p.x, 0.185, p.z - 0.15 + i * 0.15);
        k.add(k.style.box(0.01, 0.005, 0.44), k.mat(WORLD.ink), g, p.x - 0.15 + i * 0.15, 0.185, p.z);
      }
      k.add(k.style.cylinder(0.09, 0.1), k.mat(WOOD), g, p.x - 0.4, 0.05, p.z);
      k.add(k.style.cylinder(0.09, 0.1), k.mat(WOOD), g, p.x + 0.4, 0.05, p.z);
      k.add(k.style.ball(0.03), k.mat(WORLD.ink), g, p.x + 0.05, 0.2, p.z);
      k.add(k.style.ball(0.03), k.mat(WORLD.paper), g, p.x - 0.1, 0.2, p.z + 0.15);
    }),
    // 10 the shishi-odoshi: a stone basin, a bamboo pipe that tips
    piece((o) => gardenAt(o).bamboo, (k, g, p, b) => {
      k.add(k.style.cylinder(0.3, 0.18), k.mat(STONE), g, p.x, 0.09, p.z);
      k.add(k.style.cylinder(0.25, 0.02), k.style.material(b.k.pal.pendants ? '#1d3b52' : '#8fd3ff'), g, p.x, 0.19, p.z);
      k.add(k.style.cylinder(0.045, 0.7), k.mat('#a8c96a'), g, p.x - 0.35, 0.42, p.z - 0.1).rotation.z = 1.1;
      k.add(k.style.cylinder(0.02, 0.35), k.mat('#6b8f3a'), g, p.x - 0.4, 0.2, p.z - 0.1);
    }),
    // 11 an old arcade cabinet past the kotatsu's end, clear of the last bed (bims-clip) and of its
    // napper's head on screen (bims-nap, bims m_36558: 0.5 further)
    piece((o) => ({ x: ky(o).kotatsu.x1 + 1.15, z: 0.3 }), (k, g, p) => { arcade(k, g, p); }),
    // 12 a koi pond, its orange wooden bridge, two koi
    piece((o) => ({ x: o.x0 - 1.9, z: o.D + 2.2 }), (k, g, p, b) => {
      pool(k, g, p.x, p.z, 1.0, 0.75, b.k.pal.pendants);
      const deck = k.add(k.style.box(0.4, 0.06, 1.8), k.mat(MAPLE), g, p.x, 0.2, p.z);
      deck.rotation.x = 0;
      for (const dz of [-0.85, 0.85]) k.add(k.style.box(0.42, 0.2, 0.08), k.mat(MAPLE), g, p.x, 0.1, p.z + dz);
      for (const [dx, dz, c] of [[-0.5, 0.2, WORLD.orange], [0.5, -0.25, WORLD.paper]] as const) k.add(k.style.ball(0.09), k.mat(c), g, p.x + dx, 0.04, p.z + dz).scale.set(1.8, 0.5, 1);
    }),
    // 13 koinobori: carp streamers on a tall pole
    piece((o) => ({ x: o.x0 + o.W + 1.2, z: 1.2 }), (k, g, p) => {
      k.add(k.style.cylinder(0.04, 3.2), k.mat(WOOD), g, p.x, 1.6, p.z);
      ([[INDIGO, 2.9], [MAPLE, 2.5], ['#6cb4ee', 2.1]] as const).forEach(([c, y], i) => {
        const f = k.add(k.style.capsule(0.12 - i * 0.015, 0.7 - i * 0.1), k.mat(c), g, p.x + 0.5, y, p.z);
        f.rotation.z = Math.PI / 2 - 0.1;
        k.add(k.style.ball(0.04), k.mat(WORLD.paper), g, p.x + 0.12, y + 0.04, p.z + 0.1);
      });
    }),
    // 14 a golden maneki-neko, its paw raised, on a plinth
    piece((o) => ({ x: o.x0 - 1.9, z: 1.4 }), (k, g, p) => { onPlinth(k, g, p.x, p.z, (gold, y) => {
        k.add(k.style.ball(0.26), gold, g, p.x, y + 0.3, p.z).scale.y = 1.15;
        k.add(k.style.ball(0.2), gold, g, p.x, y + 0.7, p.z);
        for (const ex of [-0.1, 0.1]) k.add(k.style.box(0.07, 0.1, 0.05), gold, g, p.x + ex, y + 0.9, p.z);
        k.add(k.style.capsule(0.05, 0.16), gold, g, p.x + 0.2, y + 0.78, p.z + 0.08);
      }); }),
  ],
  tree: (k, parent, x, z, size, i) => { tree(k, parent, x, z, size, i, true); },
  frameSpan: (o) => ({ xa: boardX(o) + 1.1, xb: o.mainDesk.x - 0.5, y: 1.3, z: 0.02 }),
  // a hanging scroll (kakejiku): paper on a dark roller, an ink stroke; gold leaf from 500
  frame: (k, parent, x, y, z, i, golden) => {
    const pz = z + k.style.pictureZ;
    k.add(k.style.box(0.26, 0.03, 0.03), k.mat(WOOD), parent, x, y + 0.27, pz);
    k.add(k.style.box(0.22, 0.5, 0.01), k.mat(golden ? WORLD.gold : '#fbf6e8'), parent, x, y, pz);
    k.add(k.style.box(0.03, 0.22 - (i % 3) * 0.05, 0.01), k.mat(WORLD.ink), parent, x, y + 0.03, pz + 0.01);
    k.add(k.style.box(0.26, 0.03, 0.03), k.mat(WOOD), parent, x, y - 0.26, pz);
  },
  flowers: ['#fffaf0', '#ffd166', '#9b8fe0', '#e9e2d4'],
};

/** the tatami, the engawa, the inner garden, the walls in their wood frame, the shoji, the noren */
function shell(b: Build): void {
  const { k, root } = b;
  const { style, pal } = k;
  const o = ky(b.o);
  const { x0, W, D, garden: gd } = o;
  k.add(style.box(W, 0.14, D), style.floor(pal.floor, W, D), root, x0 + W / 2, -0.05, D / 2);
  // tatami borders, left of the engawa
  const edge = k.mat(MAT_EDGE);
  const tw = gd.x0 - 0.5 - x0;
  for (let z = 2.0; z < D; z += 2.0) k.add(style.box(tw, 0.012, 0.05), edge, root, x0 + tw / 2, 0.03, z);
  for (let x = x0 + 1.9; x < gd.x0 - 0.6; x += 1.9) k.add(style.box(0.05, 0.012, D - 0.2), edge, root, x, 0.03, D / 2);
  // the engawa: a dark wood gallery along the garden
  k.add(style.box(0.5, 0.08, gd.z1 - gd.z0 + 0.6), k.mat('#7a5a3c'), root, gd.x0 - 0.25, 0.05, (gd.z0 + gd.z1) / 2);
  // the garden: raked gravel, moss, stones, the lantern (lit at night), the maple
  k.add(style.box(gd.x1 - gd.x0, 0.03, gd.z1 - gd.z0), k.mat(pal.pendants ? '#8e8a80' : '#e6e2d6'), root, (gd.x0 + gd.x1) / 2, 0.02, (gd.z0 + gd.z1) / 2);
  for (let z = gd.z0 + 0.25; z < gd.z1; z += 0.3) k.add(style.box(gd.x1 - gd.x0 - 0.1, 0.005, 0.02), k.mat(pal.pendants ? '#77736a' : '#c9c3b3'), root, (gd.x0 + gd.x1) / 2, 0.04, z);
  const at = gardenAt(o);
  for (const [fx, fz, r] of [[-0.8, 1.0, 0.5], [0.9, -1.2, 0.6]] as const) {
    k.add(style.ball(r), k.mat(MOSS), root, (gd.x0 + gd.x1) / 2 + fx, 0, fz > 0 ? gd.z0 + fz : gd.z1 + fz).scale.y = 0.4;
  }
  k.add(style.ball(0.25), k.mat('#8e9399'), root, at.maple.x + 0.6, 0.08, at.maple.z - 0.9).scale.y = 0.6;
  const l = at.lantern;
  k.add(style.box(0.22, 0.45, 0.22), k.mat(STONE), root, l.x, 0.22, l.z);
  k.add(style.box(0.3, 0.2, 0.3), k.glow('#e9d8a6', { night: 1.2 }), root, l.x, 0.55, l.z);
  k.add(style.box(0.42, 0.1, 0.42), k.mat('#8e9399'), root, l.x, 0.72, l.z);
  tree(k, root, at.maple.x, at.maple.z, 1.1, 0, b.grow.stage >= 6);
  // walls: earthen plaster in a dark wood frame; the left one low, its shoji
  const wood = k.mat(WOOD);
  k.add(style.box(W + 0.2, 1.8, 0.14), k.mat(pal.wall), root, x0 + W / 2, 0.9, -0.07);
  k.add(style.box(0.14, 1.2, D + 0.2), k.mat(pal.wall), root, x0 - 0.07, 0.6, D / 2);
  for (let x = x0; x <= x0 + W + 0.01; x += 1.9) k.add(style.box(0.08, 1.8, 0.05), wood, root, x, 0.9, 0.01);
  k.add(style.box(W, 0.08, 0.06), wood, root, x0 + W / 2, 1.78, 0.01);
  for (let z = 0; z <= D + 0.01; z += 1.9) k.add(style.box(0.05, 1.2, 0.08), wood, root, x0 + 0.01, 0.6, z);
  const paper = k.glow('#fbf6e8', { night: 0.35 });
  for (let z = 4.6; z < D - 1.2; z += 1.9) {
    k.add(style.box(0.02, 0.8, 1.6), paper, root, x0 + 0.02, 0.62, z + 0.8);
    for (let i = 1; i < 4; i++) k.add(style.box(0.03, 0.8, 0.02), wood, root, x0 + 0.03, 0.62, z + i * 0.4);
    k.add(style.box(0.03, 0.02, 1.6), wood, root, x0 + 0.03, 0.62, z + 0.8);
  }
  // the noren at the door: a lintel on two posts, two indigo panels, a white crest
  const dx = o.door.x;
  for (const s of [-0.55, 0.55]) k.add(style.box(0.08, 1.7, 0.08), wood, root, dx + s, 0.85, D - 0.05);
  k.add(style.box(1.2, 0.08, 0.08), wood, root, dx, 1.7, D - 0.05);
  for (const s of [-0.22, 0.22]) k.add(style.box(0.42, 0.5, 0.02), k.mat(INDIGO), root, dx + s, 1.4, D - 0.05);
  k.add(style.ball(0.07), k.mat(WORLD.paper), root, dx, 1.45, D - 0.03);
  onFloor(k, root, boxOf(decorOf(o).doorMat), 0.03, 0.03, '#c9b27a');
}

/** the tea counter: a teapot and cups at its back end */
function island(b: Build): void {
  const { k, root, o } = b;
  const { style, pal } = k;
  const I = o.island;
  const x = counterX(o);
  const zc = (I.z0 + I.z1) / 2;
  const len = I.z1 - I.z0;
  k.add(style.box(I.x1 - I.x0 - 0.1, 0.62, len - 0.1, 0.06), k.mat(pal.island), root, x, 0.31, zc);
  k.add(style.box(I.x1 - I.x0 + 0.05, 0.06, len), k.mat(pal.islandTop), root, x, 0.65, zc);
  k.add(style.ball(0.13), k.mat('#5c677d'), root, x, 0.78, I.z0 + 0.45);
  k.add(style.cylinder(0.02, 0.12), k.mat('#5c677d'), root, x + 0.14, 0.82, I.z0 + 0.45).rotation.z = -0.8;
  for (let i = 0; i < 3; i++) k.add(style.cylinder(0.045, 0.07), k.mat('#e9e2d4'), root, x + 0.2, 0.72, I.z0 + 0.75 + i * 0.14);
}

/** the kotatsu: a low table over its quilt; a cushion per bed the stage has reached */
function lounge(b: Build): void {
  const { k, root } = b;
  const { style } = k;
  const kt = ky(b.o).kotatsu;
  const cx = (kt.x0 + kt.x1) / 2;
  const cz = (kt.z0 + kt.z1) / 2;
  k.add(style.box(kt.x1 - kt.x0, 0.22, kt.z1 - kt.z0 + 0.1), k.mat(INDIGO), root, cx, 0.11, cz);
  k.add(style.box(kt.x1 - kt.x0 - 0.2, 0.05, kt.z1 - kt.z0 - 0.1), k.mat('#7a5a3c'), root, cx, 0.25, cz);
  if (b.grow.stage >= 2) for (const dx of [0, 0.16]) k.add(style.ball(0.09), k.mat(WORLD.orange), root, cx + dx, 0.33, cz + dx / 2);
  beds(b, (kk, parent, box, i) => {
    const c = CUSHIONS[i % CUSHIONS.length] ?? INDIGO;
    kk.add(kk.style.box(box.x1 - box.x0, 0.08, box.z1 - box.z0, 0.04), kk.mat(c), parent, (box.x0 + box.x1) / 2, 0.05, (box.z0 + box.z1) / 2);
    pillow(kk, parent, box, boxTop(0.05, 0.08, 0.04), c);
  });
}

export const kyoto: MapLook = {
  id: 'kyoto',
  // its cozy pieces (render/cozy.ts; page bims-cozy v2 « la base, carte par carte »)
  cozy: { plant: 'bamboo', small: 'succulent', coffee: 'teaset', bed: 'mat', shelf: 'vase', poster: 'kakemono', wood: '#7a5a3c', cloth: ['#3d4f7a', '#6b8f71', '#e9e2d4'], art: ['#3d4f7a', '#6b8f71', '#c9a24a'], pot: '#4f6d7a', rug: '#6b8f71' },
  pal: palettes(
    { floor: '#d6cc95', wall: '#e8dcc0', wallTop: '#5c3d2e', desk: '#5c3d2e', deskTop: '#7a5a3c', island: '#5c3d2e', islandTop: '#7a5a3c', grass: '#7fa35a', dirt: '#6b5a48', terrace: '#9a8f80', rug: '#a8c96a' },
    { desk: '#7a5a3c', deskTop: '#94704e', island: '#7a5a3c', islandTop: '#94704e' },
  ),
  shell,
  island,
  lounge,
  desk: (b, d, name) => turnedDesk(b, d, name, { w: 1.6, d: 0.78, at: 0.5 }),
  mainDesk: (b) => {
    const md = b.o.mainDesk;
    const box = boxHolding(b.o, { x: md.x, z: md.z + 0.6 }) ?? { x0: md.x - 1.15, x1: md.x + 1.15, z0: md.z + 0.1, z1: md.z + 1.1 };
    return bigDesk(b, box, md);
  },
  tree: ({ k, grow: g }, parent, x, z, size) => { tree(k, parent, x, z, size, 0, g.stage >= 6); },
  growth: (b) => { grow(b, grower); },
  pieceAt: pieceAtOf(grower),
  // an indigo hachimaki round the head, white dots on it
  wear: (w) => {
    w.add(w.style.cylinder(0.232, 0.05), w.mat(INDIGO), w.head, 0, 0.07, 0);
    for (let i = 0; i < 3; i++) w.add(w.style.ball(0.014), w.mat(WORLD.paper), w.head, Math.sin(i * 0.5 - 0.5) * 0.235, 0.07, Math.cos(i * 0.5 - 0.5) * 0.235);
  },
};

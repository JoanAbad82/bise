// The riad's look (render/maps/look.ts; its plan: maps/riad.ts): terracotta floors, tall ochre walls
// with a zellige dado and a carved plaster band, the patio paved in zellige, arcades on its three
// inner sides with brass lanterns (lit at night), the fountain (the eating place), a blue banquette
// and leather poufs at the back left (the nap place), the studded door; every bim but main wears
// yellow babouches. Its growth (page bims-maps « Maroc · le riad »): a pot of mint, the tea tray
// and the first orange tree, two poufs, a slate in carved plaster, a Berber rug on the wall and a
// darbouka, a tajine and jasmine, an awning over the terrace, the four orange trees, a draughts
// board, the fountain's second tier, a steaming hammam, a long zellige basin, a balloon over the
// Atlas, a golden brass lantern; frames under small plaster arches. Owner: maps-b.
import type { Mesh, Object3D } from 'three';
import type { RiadOffice } from '../../maps/riad';
import type { Office, Pt } from '../../model';
import { decorOf } from '../decor';
import { type Kit, boxOf, onFloor } from '../kit';
import { WORLD } from '../palette';
import { balloon, beds, bigDesk, boxHolding, dim, grow, onPlinth, palettes, pieceAtOf, turnedDesk, type Grower, type Piece } from './blook';
import type { Build, MapLook } from './look';

const TEAL = '#2a9d8f';
const BLUE = '#3d6fb6';
const SAFFRON = '#e9c46a';
const BRASS = '#b08a3c';
const PLASTER = '#f3e3c6';
const ZELLIGE = [TEAL, '#f3efe4', BLUE, SAFFRON] as const;
const LEATHER = '#c98a3e';

const rd = (o: Office): RiadOffice => o as RiadOffice;
const boardX = (o: Office): number => o.boardSpots.reduce((s, p) => s + p.x, 0) / Math.max(1, o.boardSpots.length);
const piece = (at: (o: Office) => Pt, draw: Piece['draw'] = () => undefined): Piece => ({ at, draw });
const loungeX = (o: Office): [number, number] => {
  const xs = o.lounge.map((s) => s.x);
  return xs.length ? [Math.min(...xs) - 0.4, Math.max(...xs) + 0.4] : [o.x0 + 0.3, o.x0 + 4];
};
/** the low brass table in front of the poufs (between their lanes) */
const teaTable = (o: Office): Pt => {
  const a = o.lounge[1];
  return { x: a?.x ?? o.x0 + 1.8, z: 2.95 };
};
/** the patio's four corners, the orange trees' pots */
const corners = (o: Office): Pt[] => {
  const p = rd(o).patio;
  return [{ x: p.x0 + 0.7, z: p.z0 + 0.7 }, { x: p.x1 - 0.7, z: p.z0 + 0.7 }, { x: p.x0 + 0.7, z: p.z1 - 0.7 }, { x: p.x1 - 0.7, z: p.z1 - 0.7 }];
};

/** an orange tree in a square teal pot */
function orangeTree(k: Kit, g: Object3D, p: Pt, night: boolean): void {
  k.add(k.style.box(0.5, 0.4, 0.5), k.mat(TEAL), g, p.x, 0.2, p.z);
  k.add(k.style.cylinder(0.05, 0.6), k.mat('#6b4a32'), g, p.x, 0.7, p.z);
  k.add(k.style.ball(0.42), k.mat(night ? '#2f6a2f' : '#3f8a3e'), g, p.x, 1.15, p.z);
  for (let i = 0; i < 5; i++) k.add(k.style.ball(0.06), k.mat(WORLD.orange), g, p.x + Math.sin(i * 1.3) * 0.36, 1.1 + (i % 3) * 0.12, p.z + Math.cos(i * 1.3) * 0.36);
}

/** a date palm (the palm grove round the house) */
function palm(k: Kit, parent: Object3D, x: number, z: number, size: number): void {
  k.add(k.style.cylinder(0.08 * size, 1.7 * size), k.mat('#a0673f'), parent, x, 0.85 * size, z);
  for (let i = 0; i < 6; i++) {
    const f = k.add(k.style.box(0.95 * size, 0.04, 0.22), k.mat(i % 2 ? '#5fb35a' : '#4e9a48'), parent, x, 1.7 * size, z);
    f.rotation.y = (i * Math.PI) / 3;
    f.rotation.z = -0.3;
  }
}

const grower: Grower = {
  pieces: [
    piece((o) => o.door),
    // 1 a pot of mint by the door
    piece((o) => decorOf(o).plants[0] ?? o.door, (k, g, p) => {
      k.add(k.style.cylinder(0.18, 0.3), k.mat(TEAL), g, p.x, 0.15, p.z);
      for (let i = 0; i < 4; i++) k.add(k.style.ball(0.13), k.mat(i % 2 ? '#7cc26b' : '#5fb35a'), g, p.x + Math.sin(i * 1.6) * 0.1, 0.38 + (i % 2) * 0.08, p.z + Math.cos(i * 1.6) * 0.1);
    }),
    // 2 the tea tray on the brass table, the teapot and its glasses (the first orange tree in the patio)
    piece(teaTable, (k, g, p, b) => {
      k.add(k.style.cylinder(0.32, 0.03), k.mat(SAFFRON), g, p.x, 0.43, p.z);
      k.add(k.style.ball(0.1), k.mat('#d8d4cc'), g, p.x, 0.53, p.z);
      k.add(k.style.cylinder(0.015, 0.12), k.mat('#d8d4cc'), g, p.x + 0.1, 0.57, p.z).rotation.z = -0.9;
      for (let i = 0; i < 3; i++) k.add(k.style.cylinder(0.03, 0.08), k.style.material(TEAL, { opacity: 0.8 }), g, p.x - 0.15 + i * 0.12, 0.49, p.z + 0.17);
      for (const c of corners(b.o).slice(0, 1)) orangeTree(k, g, c, b.k.pal.pendants);
    }),
    // 3 two leather poufs (beds)
    piece((o) => ({ x: (loungeX(o)[0] + loungeX(o)[1]) / 2, z: 1.5 })),
    // 4 a slate in a carved plaster frame
    piece((o) => ({ x: boardX(o), z: 0.9 }), (k, g, p) => {
      const pz = k.style.pictureZ;
      k.add(k.style.box(1.9, 1.05, 0.06), k.mat(PLASTER), g, p.x, 1.05, 0.03 + pz);
      k.add(k.style.cap(0.95, 0.35), k.mat(PLASTER), g, p.x, 1.5, 0.03 + pz).scale.z = 0.08;
      k.add(k.style.box(1.66, 0.82, 0.02), k.mat('#2f3437'), g, p.x, 1.03, 0.07 + pz);
      for (let i = 0; i < 4; i++) k.add(k.style.box(0.5 - i * 0.08, 0.035, 0.01), k.mat(WORLD.paper), g, p.x - 0.4, 1.3 - i * 0.15, 0.085 + pz);
    }),
    // 5 a Berber rug hung on the wall over the poufs, a darbouka on the floor
    piece((o) => ({ x: loungeX(o)[1] - 0.2, z: 0.35 }), (k, g, p, b) => {
      const [l0, l1] = loungeX(b.o);
      const pz = k.style.pictureZ;
      const w = Math.min(3.0, l1 - l0 - 0.4);
      const cx = (l0 + l1) / 2;
      k.add(k.style.box(w, 0.6, 0.02), k.mat('#f1e6d2'), g, cx, 1.5, 0.02 + pz);
      for (let i = 0; i < 4; i++) {
        const d = k.add(k.style.box(0.24, 0.24, 0.01), k.mat('#2b2118'), g, cx - w / 2 + (i + 0.5) * (w / 4), 1.5, 0.035 + pz);
        d.rotation.z = Math.PI / 4;
        k.add(k.style.box(0.12, 0.12, 0.01), k.mat('#f1e6d2'), g, cx - w / 2 + (i + 0.5) * (w / 4), 1.5, 0.04 + pz).rotation.z = Math.PI / 4;
      }
      k.add(k.style.cylinder(0.14, 0.3), k.mat(LEATHER), g, p.x, 0.15, p.z);
      k.add(k.style.cylinder(0.15, 0.02), k.mat('#f1e6d2'), g, p.x, 0.31, p.z);
    }),
    // 6 a tajine on the tea table (jasmine flowers outside)
    piece((o) => ({ x: teaTable(o).x + 0.0, z: teaTable(o).z }), (k, g, p) => {
      k.add(k.style.cylinder(0.2, 0.04), k.mat('#b5651d'), g, p.x - 0.12, 0.47, p.z - 0.1);
      k.add(k.style.cap(0.17, 0.95), k.mat('#c98a3e'), g, p.x - 0.12, 0.62, p.z - 0.1).scale.y = 1.2;
    }),
    // 7 a canvas awning stretched over the terrace on four posts
    piece((o) => decorOf(o).parasol, (k, g, p) => {
      for (const [dx, dz] of [[-0.8, -0.6], [0.8, -0.6], [-0.8, 0.6], [0.8, 0.6]] as const) k.add(k.style.cylinder(0.03, 1.7), k.mat('#6b4a32'), g, p.x + dx, 0.85, p.z + dz);
      k.add(k.style.box(1.8, 0.04, 1.4), k.mat('#f1e6d2'), g, p.x, 1.72, p.z);
      for (let i = 0; i < 3; i++) k.add(k.style.box(0.3, 0.045, 1.4), k.mat(BLUE), g, p.x - 0.6 + i * 0.6, 1.73, p.z);
    }),
    // 8 the four orange trees of the patio (the banquette full)
    piece((o) => corners(o)[3] ?? o.door, (k, g, _p, b) => {
      for (const c of corners(b.o).slice(1)) orangeTree(k, g, c, b.k.pal.pendants);
    }),
    // 9 a draughts board on a low table in the patio
    piece((o) => ({ x: rd(o).patio.x1 - 1.6, z: rd(o).patio.z1 - 0.7 }), (k, g, p) => {
      k.add(k.style.cylinder(0.32, 0.3), k.mat(BRASS), g, p.x, 0.15, p.z);
      for (let i = 0; i < 16; i++) k.add(k.style.box(0.08, 0.01, 0.08), k.mat(i % 2 === Math.floor(i / 4) % 2 ? '#2b2118' : '#f1e6d2'), g, p.x - 0.12 + (i % 4) * 0.08, 0.31, p.z - 0.12 + Math.floor(i / 4) * 0.08);
    }),
    // 10 the fountain's second tier
    piece((o) => ({ x: rd(o).fx, z: rd(o).fz }), (k, g, p) => {
      k.add(k.style.cylinder(0.08, 0.4), k.mat(PLASTER), g, p.x, 1.2, p.z);
      k.add(k.style.cylinder(0.28, 0.08), k.mat(TEAL), g, p.x, 1.42, p.z);
      k.add(k.style.ball(0.08), k.mat('#8fd3ff'), g, p.x, 1.52, p.z);
    }),
    // 11 a hammam in the garden: a white dome, its steam
    piece((o) => ({ x: o.x0 - 1.9, z: o.D * 0.55 }), (k, g, p) => {
      k.add(k.style.box(1.2, 0.7, 1.0), k.mat(PLASTER), g, p.x, 0.35, p.z);
      k.add(k.style.cap(0.5, 0.5), k.mat('#fbf6ec'), g, p.x, 0.7, p.z);
      k.add(k.style.box(0.35, 0.5, 0.02), k.mat(TEAL), g, p.x + 0.61, 0.25, p.z);
      for (let i = 0; i < 3; i++) k.add(k.style.ball(0.12 + i * 0.03), k.style.material(WORLD.steam, { opacity: 0.5 }), g, p.x + 0.1 * i, 1.35 + i * 0.25, p.z);
    }),
    // 12 a long basin edged in zellige
    piece((o) => ({ x: o.x0 - 1.9, z: o.D + 2.4 }), (k, g, p, b) => {
      k.add(k.style.box(1.0, 0.12, 2.4), k.mat(TEAL), g, p.x, 0.06, p.z);
      const w = k.add(k.style.box(0.8, 0.02, 2.2), k.style.material(b.k.pal.pendants ? '#1d3b52' : '#8fd3ff', { emissive: b.k.pal.pendants ? '#2c5a7a' : '#8fd3ff', ei: 0.2 }), g, p.x, 0.13, p.z);
      w.castShadow = false;
      for (let i = 0; i < 6; i++) k.add(k.style.box(0.1, 0.03, 0.1), k.mat(ZELLIGE[i % 4] ?? TEAL), g, p.x + (i % 2 ? 0.45 : -0.45), 0.13, p.z - 1.0 + Math.floor(i / 2) * 1.0);
    }),
    // 13 a balloon over the Atlas: snowy peaks far behind the house
    piece((o) => ({ x: o.x0 + o.W + 1.2, z: 1.2 }), (k, g, p, b) => {
      balloon(k, g, p.x, p.z, [SAFFRON, BLUE], k.pal.ink);
      const o = b.o;
      ([[0.25, 1.4], [0.5, 1.9], [0.75, 1.5]] as const).forEach(([f, h]) => {
        const m = k.add(k.style.cylinder(1.2, h), k.mat(k.pal.pendants ? '#5a4a5f' : '#b39a8a'), g, o.x0 + o.W * f, h / 2 - 0.1, -2.6);
        m.scale.z = 0.5;
        k.add(k.style.cap(0.55, 0.4), k.mat(WORLD.paper), g, o.x0 + o.W * f, h - 0.25, -2.6).scale.z = 0.5;
      });
    }),
    // 14 a golden brass lantern on a plinth
    piece((o) => ({ x: o.x0 - 1.9, z: 1.4 }), (k, g, p) => { onPlinth(k, g, p.x, p.z, (gold, y) => {
        k.add(k.style.cylinder(0.22, 0.5), gold, g, p.x, y + 0.3, p.z);
        k.add(k.style.cap(0.24, 0.6), gold, g, p.x, y + 0.6, p.z);
        k.add(k.style.ball(0.06), gold, g, p.x, y + 0.85, p.z);
      }); }),
  ],
  tree: (k, parent, x, z, size) => { palm(k, parent, x, z, size); },
  frameSpan: (o) => ({ xa: boardX(o) + 1.1, xb: o.mainDesk.x - 0.5, y: 1.4, z: 0.02 }),
  // a frame under a small plaster arch; brass from 500
  frame: (k, parent, x, y, z, i, golden) => {
    const pz = z + k.style.pictureZ;
    k.add(k.style.box(0.28, 0.24, 0.02), k.mat(golden ? WORLD.gold : PLASTER), parent, x, y, pz);
    k.add(k.style.cap(0.14, 0.5), k.mat(golden ? WORLD.gold : PLASTER), parent, x, y + 0.12, pz).scale.z = 0.15;
    k.add(k.style.box(0.2, 0.17, 0.01), k.mat(ZELLIGE[i % 4] ?? TEAL), parent, x, y, pz + 0.015);
  },
  flowers: ['#fffaf0', '#fbf6ec', SAFFRON, '#9b8fe0'],
};

/** the floors, the zellige patio, the walls and their dado, the arcades and lanterns, the door */
function shell(b: Build): void {
  const { k, root } = b;
  const { style, pal } = k;
  const o = rd(b.o);
  const { x0, W, D, patio: pt } = o;
  const night = pal.pendants;
  k.add(style.box(W, 0.14, D), style.floor(pal.floor, W, D), root, x0 + W / 2, -0.05, D / 2);
  // the patio's zellige: pale tiles, a coloured star at each crossing
  const pw = pt.x1 - pt.x0;
  const pd = pt.z1 - pt.z0;
  k.add(style.box(pw, 0.03, pd), k.mat(night ? '#9a968c' : '#f3efe4'), root, (pt.x0 + pt.x1) / 2, 0.02, (pt.z0 + pt.z1) / 2);
  const pitch = Math.max(0.8, pw / 10);
  for (let x = pt.x0 + pitch / 2, i = 0; x < pt.x1; x += pitch, i++) {
    for (let z = pt.z0 + pitch / 2, j = 0; z < pt.z1; z += pitch, j++) {
      const c = ZELLIGE[(i + j) % 3 === 1 ? 2 : (i + j) % 3 === 2 ? 3 : 0];
      k.add(style.box(0.22, 0.01, 0.22), k.mat(night ? dim(c, 0.7) : c), root, x, 0.04, z).rotation.y = Math.PI / 4;
    }
  }
  // tall ochre walls, the dado's coloured tiles, the carved plaster band
  k.add(style.box(W + 0.2, 2.1, 0.2), k.mat(pal.wall), root, x0 + W / 2, 1.05, -0.1);
  k.add(style.box(0.2, 1.3, D + 0.2), k.mat(pal.wall), root, x0 - 0.1, 0.65, D / 2);
  for (let x = x0 + 0.2, i = 0; x < x0 + W; x += 0.4, i++) k.add(style.box(0.4, 0.45, 0.02), k.mat(ZELLIGE[i % 4] ?? TEAL), root, x, 0.26, 0.01);
  for (let z = 0.2, i = 0; z < D; z += 0.4, i++) k.add(style.box(0.02, 0.45, 0.4), k.mat(ZELLIGE[i % 4] ?? TEAL), root, x0 + 0.01, 0.26, z);
  k.add(style.box(W, 0.18, 0.06), k.mat(night ? dim(PLASTER, 0.7) : PLASTER), root, x0 + W / 2, 1.85, 0.03);
  // the arcades: columns at the patio's edges on three sides, a beam on them, lanterns between
  const col = k.mat(night ? dim(PLASTER, 0.75) : PLASTER);
  const H = 1.35;
  const posts = (pts: readonly Pt[]): void => {
    for (const p of pts) {
      k.add(style.cylinder(0.11, H), col, root, p.x, H / 2, p.z);
      k.add(style.box(0.28, 0.08, 0.28), col, root, p.x, H, p.z);
    }
  };
  const back: Pt[] = [];
  for (let x = pt.x0; x <= pt.x1 + 0.01; x += pw / Math.max(1, Math.round(pw / 1.9))) back.push({ x, z: pt.z0 - 0.15 });
  const side = (x: number): Pt[] => {
    const out: Pt[] = [];
    for (let z = pt.z0; z <= pt.z1 + 0.01; z += 1.9) out.push({ x, z });
    return out;
  };
  posts([...back, ...side(pt.x0 - 0.15), ...side(pt.x1 + 0.15)]);
  k.add(style.box(pw + 0.4, 0.14, 0.2), col, root, (pt.x0 + pt.x1) / 2, H + 0.1, pt.z0 - 0.15);
  for (const x of [pt.x0 - 0.15, pt.x1 + 0.15]) k.add(style.box(0.2, 0.14, pd), col, root, x, H + 0.1, (pt.z0 + pt.z1) / 2);
  const lit = style.material(SAFFRON, night ? { emissive: SAFFRON, ei: 1.2 } : {});
  for (let i = 0; i + 1 < back.length; i += 2) {
    const a = back[i];
    const c = back[i + 1];
    if (!a || !c) continue;
    const lx = (a.x + c.x) / 2;
    k.add(style.cylinder(0.11, 0.24), lit, root, lx, 1.05, a.z);
    k.add(style.cap(0.13, 0.5), k.mat(BRASS), root, lx, 1.17, a.z);
  }
  // the banquette along the back wall behind the poufs, its cushions
  const [l0, l1] = loungeX(o);
  k.add(style.box(l1 - l0, 0.35, 0.5), k.mat(BLUE), root, (l0 + l1) / 2, 0.18, 0.3);
  for (let i = 0; i < 5; i++) k.add(style.box(0.5, 0.36, 0.14), k.mat(([SAFFRON, TEAL, WORLD.orange, '#9b8fe0', SAFFRON] as const)[i] ?? SAFFRON), root, l0 + 0.4 + (i * (l1 - l0 - 0.8)) / 4, 0.5, 0.12);
  // the brass tea table in front of the poufs
  const t = teaTable(o);
  k.add(style.cylinder(0.06, 0.4), k.mat(BRASS), root, t.x, 0.2, t.z);
  k.add(style.cylinder(0.4, 0.04), k.mat(SAFFRON), root, t.x, 0.41, t.z);
  // the studded door, open: its frame, the leaf against the wall
  const dx = o.door.x;
  for (const s of [-0.55, 0.55]) k.add(style.box(0.14, 1.6, 0.14), k.mat(pal.wall), root, dx + s, 0.8, D - 0.05);
  k.add(style.box(1.25, 0.2, 0.16), k.mat(pal.wall), root, dx, 1.6, D - 0.05);
  k.add(style.box(0.08, 1.4, 0.9), k.mat('#6b3f22'), root, dx - 0.62, 0.7, D - 0.55);
  for (let i = 0; i < 6; i++) k.add(style.ball(0.03), k.mat(SAFFRON), root, dx - 0.57, 0.35 + Math.floor(i / 2) * 0.4, D - 0.8 + (i % 2) * 0.5);
  onFloor(k, root, boxOf(decorOf(o).doorMat), 0.03, 0.03, '#b5651d');
}

/** the fountain: an octagonal teal basin, its water (lit at night), the column and its bowl */
function island(b: Build): void {
  const { k, root } = b;
  const { style, pal } = k;
  const o = rd(b.o);
  const { fx, fz } = o;
  const night = pal.pendants;
  k.add(style.cylinder(1.08, 0.38), k.mat(pal.island), root, fx, 0.19, fz);
  k.add(style.cylinder(0.95, 0.04), style.material(night ? '#1d3b52' : '#8fd3ff', { emissive: night ? '#2c5a7a' : '#8fd3ff', ei: night ? 0.4 : 0.1 }), root, fx, 0.37, fz);
  k.add(style.cylinder(0.14, 0.7), k.mat(PLASTER), root, fx, 0.6, fz);
  k.add(style.cylinder(0.38, 0.12), k.mat(pal.island), root, fx, 0.98, fz);
  k.add(style.ball(0.1), k.mat('#8fd3ff'), root, fx, 1.1, fz);
  for (let i = 0; i < 8; i++) {
    const t = (i / 8) * Math.PI * 2;
    k.add(style.ball(0.07), k.mat(BLUE), root, fx + Math.sin(t) * 1.1, 0.38, fz + Math.cos(t) * 1.1);
  }
}

export const riad: MapLook = {
  id: 'riad',
  pal: palettes(
    { floor: '#d9a36f', wall: '#d98e4f', wallTop: '#c47a3e', desk: '#a0704a', deskTop: '#b8875c', island: TEAL, islandTop: '#e9f5f2', grass: '#c9b27a', dirt: '#a8764a', terrace: '#e6c9a0', rug: '#f1e6d2' },
    { desk: '#9a6a48', deskTop: '#b07a52', island: '#1f7a70' },
  ),
  shell,
  island,
  lounge: (b) => { beds(b, (k, parent, box) => {
      k.add(k.style.cylinder((box.x1 - box.x0) / 2 - 0.05, 0.32), k.mat(LEATHER), parent, (box.x0 + box.x1) / 2, 0.16, (box.z0 + box.z1) / 2);
      k.add(k.style.cylinder(0.12, 0.01), k.mat(SAFFRON), parent, (box.x0 + box.x1) / 2, 0.325, (box.z0 + box.z1) / 2);
    }); },
  desk: (b, d, name) => turnedDesk(b, d, name, { w: 1.4, d: 0.78, at: 0.5 }),
  mainDesk: (b) => {
    const md = b.o.mainDesk;
    const box = boxHolding(b.o, { x: md.x, z: md.z + 0.6 }) ?? { x0: md.x - 1.15, x1: md.x + 1.15, z0: md.z + 0.1, z1: md.z + 1.1 };
    return bigDesk(b, box, md);
  },
  tree: ({ k }, parent, x, z, size) => { palm(k, parent, x, z, size); },
  growth: (b) => { grow(b, grower); },
  pieceAt: pieceAtOf(grower),
  // yellow babouches, a little longer than shoes
  wear: (w) => {
    for (const leg of w.legs) {
      const shoe = leg.children[1] as Mesh | undefined;
      if (!shoe) continue;
      shoe.material = w.mat(SAFFRON);
      shoe.scale.z = 1.25;
    }
  },
};

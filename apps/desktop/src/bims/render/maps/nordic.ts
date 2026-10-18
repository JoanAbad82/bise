// Nordic's look (render/maps/look.ts; its plan: maps/nordic.ts): a wooden house, pale planks, white
// walls over a wood wainscot, tall windows on the snow, the long common table (a runner, candles lit
// at night, pendant lamps over it) where each place is a chair and a laptop, the fika counter (the
// eating place), the wood stove and sheepskins (the nap place), a reading nook at the front right, a
// small sauna on the terrace, snow on the ground (no aurora: flat slabs read badly, bims m_28835); every bim but main wears a striped scarf.
// Its growth (page bims-maps « Scandinavie · la maison en bois »): a fern, kanelbullar and the first
// birch, two sheepskins, a blackboard in a pine frame, a rya on the wall and a record player,
// blueberries and coffee, a campfire and its log benches, firs all round, a kubb game, a steaming
// wooden hot tub, the sauna's porch, a lake and its jetty, a midsummer pole, a golden Dala horse;
// light pine frames. Owner: maps-b.
import { Group, type Object3D } from 'three';
import type { NordicOffice } from '../../maps/nordic';
import type { Office, Pt } from '../../model';
import { decorOf } from '../decor';
import { chair, deskLamp, laptop } from '../furniture';
import { type Kit, boxOf, onFloor } from '../kit';
import { HOODIE, WORLD, hash } from '../palette';
import { ahead, beds, bigDesk, boxHolding, grow, onPlinth, palettes, pieceAtOf, plainFrame, pool, type Grower, type Piece } from './blook';
import type { Build, DeskHandles, MapLook } from './look';

const PINE = '#d9b98a';
const DARK_WOOD = '#6b4a32';
const BLUE = '#3d6fb6';
const OCHRE = '#d9a54a';
const SKIN = '#fbf8f2';
const FIR = '#2f6b4f';
const SNOW = '#f4f7fa';

const nd = (o: Office): NordicOffice => o as NordicOffice;

/**
 * The reading nook in the front right, off every walk (right of the right aisle, under main's desk):
 * a rug, a low bookshelf with the blue Dala horse and three jars on it, an armchair, a floor lamp lit at night.
 */
function nook(k: Kit, root: Object3D, o: NordicOffice): void {
  const { style, pal } = k;
  const x = o.x0 + o.W - 1.5;
  const z = Math.max(o.table.z0 + 1.2, (o.table.z0 + o.D) / 2);
  k.add(style.box(2.0, 0.02, 1.8), k.mat(pal.pendants ? '#5a6e8a' : '#bfd4ea'), root, x - 0.2, 0.03, z);
  k.add(style.box(0.35, 0.8, 1.4), k.mat(PINE), root, x + 0.85, 0.4, z);
  ([BLUE, OCHRE, '#2a9d8f', '#9b8fe0', '#fffaf0'] as const).forEach((c, i) => k.add(style.box(0.25, 0.26, 0.08), k.mat(c), root, x + 0.68, 0.22 + (i % 2) * 0.36, z - 0.5 + i * 0.22));
  k.add(style.box(0.22, 0.14, 0.07), k.mat(BLUE), root, x + 0.85, 0.87, z - 0.3);
  k.add(style.box(0.08, 0.14, 0.07), k.mat(BLUE), root, x + 0.85, 0.98, z - 0.2);
  for (let i = 0; i < 3; i++) k.add(style.cylinder(0.05, 0.22), k.mat(['#2a9d8f', '#e9c46a', '#fffaf0'][i] ?? WORLD.paper), root, x + 0.85, 0.91, z + 0.15 + i * 0.16);
  k.add(style.box(0.75, 0.35, 0.7, 0.12), k.mat('#c9d6e3'), root, x - 0.4, 0.2, z);
  k.add(style.box(0.75, 0.45, 0.16, 0.08), k.mat('#c9d6e3'), root, x - 0.4, 0.55, z + 0.3);
  k.add(style.box(0.6, 0.1, 0.5), k.mat(SKIN), root, x - 0.4, 0.42, z - 0.05);
  k.add(style.cylinder(0.02, 1.3), k.mat(WORLD.dark), root, x - 1.0, 0.65, z + 0.55);
  k.add(style.cap(0.18, 0.6), style.material('#fff2d6', pal.pendants ? { emissive: '#ffd166', ei: 0.9 } : {}), root, x - 1.0, 1.35, z + 0.55);
}
const boardX = (o: Office): number => o.boardSpots.reduce((s, p) => s + p.x, 0) / Math.max(1, o.boardSpots.length);
const counterX = (o: Office): number => (o.island.x0 + o.island.x1) / 2;
const piece = (at: (o: Office) => Pt, draw: Piece['draw'] = () => undefined): Piece => ({ at, draw });
const loungeX = (o: Office): [number, number] => {
  const xs = o.lounge.map((s) => s.x);
  return xs.length ? [Math.min(...xs) - 0.45, Math.max(...xs) + 0.45] : [o.x0 + 1, o.x0 + 4.5];
};
/** the sauna on the terrace's right, behind the parasol's place */
const saunaAt = (o: Office): Pt => ({ x: o.x0 + o.W - 1.4, z: o.D + 3.5 });

/** a birch (white trunk, black marks) or a fir with snow on it */
function tree(k: Kit, parent: Object3D, x: number, z: number, size: number, i: number): void {
  const { style } = k;
  if (i % 2 === 0) {
    k.add(style.cylinder(0.08, 1.6 * size), k.mat('#f4f1ea'), parent, x, 0.8 * size, z);
    for (let j = 0; j < 3; j++) k.add(style.box(0.1, 0.03, 0.02), k.mat(WORLD.ink), parent, x, (0.4 + j * 0.4) * size, z + 0.08);
    k.add(style.ball(0.5 * size), k.mat('#a8c96a'), parent, x, 1.8 * size, z).scale.set(0.8, 1.2, 0.8);
    return;
  }
  k.add(style.cylinder(0.08, 0.4), k.mat('#5c3d2e'), parent, x, 0.2, z);
  for (let j = 0; j < 3; j++) {
    const r = (0.7 - j * 0.18) * size;
    k.add(style.cap(r, 0.9), k.mat(FIR), parent, x, (0.45 + j * 0.42) * size, z).scale.y = 1.1;
    k.add(style.cap(r * 0.5, 0.5), k.mat(SNOW), parent, x, (0.75 + j * 0.42) * size, z);
  }
}

/** the sauna: an ochre hut, its grey roof and chimney; `porch`: bigger, a bench and smoke */
function sauna(k: Kit, g: Object3D, p: Pt, porch: boolean): void {
  const { style } = k;
  k.add(style.box(1.4, 1.0, 1.1), k.mat(OCHRE), g, p.x, 0.5, p.z);
  k.add(style.box(1.6, 0.12, 1.3), k.mat('#5c677d'), g, p.x, 1.06, p.z);
  k.add(style.cylinder(0.07, 0.5), k.mat(WORLD.dark), g, p.x + 0.4, 1.3, p.z - 0.2);
  k.add(style.box(0.4, 0.7, 0.04), k.mat(DARK_WOOD), g, p.x - 0.3, 0.35, p.z - 0.57);
  if (!porch) return;
  k.add(style.box(1.4, 0.06, 0.6), k.mat(PINE), g, p.x, 0.12, p.z - 0.9);
  k.add(style.box(0.9, 0.08, 0.25), k.mat(DARK_WOOD), g, p.x + 0.2, 0.3, p.z - 0.95);
  for (let i = 0; i < 3; i++) k.add(style.ball(0.1 + i * 0.03), style.material(WORLD.steam, { opacity: 0.5 }), g, p.x + 0.4 + i * 0.06, 1.65 + i * 0.22, p.z - 0.2);
}

const grower: Grower = {
  pieces: [
    piece((o) => o.door),
    // 1 a fern in a white pot
    piece((o) => decorOf(o).plants[0] ?? o.door, (k, g, p) => {
      k.add(k.style.cylinder(0.18, 0.3), k.mat(WORLD.paper), g, p.x, 0.15, p.z);
      for (let i = 0; i < 6; i++) {
        const f = k.add(k.style.box(0.45, 0.03, 0.12), k.mat(i % 2 ? '#5fb35a' : '#4e9a48'), g, p.x, 0.4, p.z);
        f.rotation.y = (i * Math.PI) / 3;
        f.rotation.z = 0.4;
      }
    }),
    // 2 kanelbullar on a plate on the counter (the first birch)
    piece((o) => ({ x: counterX(o), z: o.island.z0 + 1.3 }), (k, g, p) => {
      k.add(k.style.cylinder(0.28, 0.03), k.mat(WORLD.paper), g, p.x, 0.71, p.z);
      for (let i = 0; i < 5; i++) k.add(k.style.ball(0.07), k.mat('#c98a3e'), g, p.x + Math.sin(i * 1.25) * 0.15, 0.76, p.z + Math.cos(i * 1.25) * 0.15).scale.y = 0.6;
    }),
    // 3 two sheepskins by the stove (beds)
    piece((o) => ({ x: (loungeX(o)[0] + loungeX(o)[1]) / 2, z: 1.5 })),
    // 4 a blackboard in a pine frame
    piece((o) => ({ x: boardX(o), z: 0.9 }), (k, g, p) => {
      const pz = k.style.pictureZ;
      k.add(k.style.box(1.8, 0.95, 0.05), k.mat(PINE), g, p.x, 1.05, 0.02 + pz);
      k.add(k.style.box(1.66, 0.82, 0.02), k.mat('#2f3a33'), g, p.x, 1.05, 0.05 + pz);
      for (let i = 0; i < 4; i++) k.add(k.style.box(0.6 - i * 0.1, 0.035, 0.01), k.mat(WORLD.paper), g, p.x - 0.3, 1.3 - i * 0.15, 0.065 + pz);
    }),
    // 5 a rya tapestry over the sheepskins, a record player on the counter's end
    piece((o) => ({ x: counterX(o), z: o.island.z1 - 0.4 }), (k, g, p, b) => {
      const [l0, l1] = loungeX(b.o);
      const pz = k.style.pictureZ;
      const cx = (l0 + l1) / 2 + 0.3;
      const cols = [OCHRE, BLUE, '#2a9d8f', '#f39a4c', '#9b8fe0'];
      cols.forEach((c, i) => k.add(k.style.box(0.42, 0.7, 0.03), k.mat(c), g, cx - 0.84 + i * 0.42, 1.25, 0.03 + pz));
      k.add(k.style.box(0.42, 0.12, 0.34), k.mat(DARK_WOOD), g, p.x, 0.75, p.z);
      k.add(k.style.cylinder(0.13, 0.015), k.mat(WORLD.ink), g, p.x, 0.82, p.z);
    }),
    // 6 blueberries and coffee for fika
    piece((o) => ({ x: counterX(o), z: o.island.z0 + 2.1 }), (k, g, p) => {
      k.add(k.style.cylinder(0.14, 0.08), k.mat(WORLD.paper), g, p.x, 0.73, p.z);
      for (let i = 0; i < 5; i++) k.add(k.style.ball(0.04), k.mat('#4b3f7a'), g, p.x + Math.sin(i * 1.3) * 0.07, 0.79, p.z + Math.cos(i * 1.3) * 0.07);
      for (const dz of [-0.3, 0.3]) k.add(k.style.cylinder(0.05, 0.09), k.mat(WORLD.paper), g, p.x, 0.74, p.z + dz);
    }),
    // 7 a campfire on the terrace, two log benches
    piece((o) => ({ x: o.x0 + o.W - 3.4, z: o.D + 2.0 }), (k, g, p, b) => {
      const night = b.k.pal.pendants;
      k.add(k.style.cylinder(0.4, 0.08), k.mat('#8e9399'), g, p.x, 0.04, p.z);
      for (let i = 0; i < 3; i++) k.add(k.style.cylinder(0.05, 0.5), k.mat(DARK_WOOD), g, p.x, 0.12, p.z).rotation.set(Math.PI / 2, (i * Math.PI) / 3, 0);
      k.add(k.style.cap(0.18, 0.8), k.style.material(WORLD.orange, { emissive: WORLD.orange, ei: night ? 1.4 : 0.5 }), g, p.x, 0.22, p.z);
      for (const dz of [-0.85, 0.85]) {
        const log = k.add(k.style.cylinder(0.12, 1.1), k.mat('#a0673f'), g, p.x, 0.12, p.z + dz);
        log.rotation.z = Math.PI / 2;
      }
    }),
    // 8 firs all round (the garden's trees), more sheepskins
    piece((o) => decorOf(o).trees[1] ?? o.door),
    // 9 a kubb game in the grass: the king, the kubbs, a baton
    piece((o) => ({ x: o.x0 + o.W + 1.0, z: o.D * 0.6 }), (k, g, p) => {
      k.add(k.style.box(0.12, 0.34, 0.12), k.mat(PINE), g, p.x, 0.17, p.z);
      k.add(k.style.box(0.14, 0.05, 0.14), k.mat(OCHRE), g, p.x, 0.36, p.z);
      for (const dz of [-0.9, -0.45, 0.45, 0.9]) {
        k.add(k.style.box(0.08, 0.18, 0.08), k.mat(PINE), g, p.x - 0.4, 0.09, p.z + dz);
        k.add(k.style.box(0.08, 0.18, 0.08), k.mat(PINE), g, p.x + 0.4, 0.09, p.z + dz);
      }
    }),
    // 10 a wooden hot tub, steaming
    piece((o) => ({ x: o.x0 - 1.9, z: o.D * 0.55 }), (k, g, p, b) => {
      k.add(k.style.cylinder(0.65, 0.6), k.mat('#a0673f'), g, p.x, 0.3, p.z);
      k.add(k.style.cylinder(0.56, 0.03), k.style.material(b.k.pal.pendants ? '#2c5a7a' : '#8fd3ff', { emissive: '#8fd3ff', ei: b.k.pal.pendants ? 0.5 : 0.1 }), g, p.x, 0.58, p.z);
      for (let i = 0; i < 3; i++) k.add(k.style.ball(0.12 + i * 0.04), k.style.material(WORLD.steam, { opacity: 0.45 }), g, p.x + 0.12 * i - 0.1, 0.85 + i * 0.25, p.z);
    }),
    // 11 the sauna grows: its porch and bench, smoke from its chimney
    piece(saunaAt, (k, g, p) => { sauna(k, g, p, true); }),
    // 12 a lake and its jetty for the plunge
    piece((o) => ({ x: o.x0 - 1.9, z: o.D + 2.4 }), (k, g, p, b) => {
      pool(k, g, p.x, p.z, 1.2, 0.9, b.k.pal.pendants);
      k.add(k.style.box(0.4, 0.06, 1.2), k.mat(PINE), g, p.x + 0.6, 0.08, p.z - 0.2);
      for (const dz of [-0.7, 0.3]) k.add(k.style.cylinder(0.04, 0.3), k.mat(DARK_WOOD), g, p.x + 0.6, 0.0, p.z + dz);
    }),
    // 13 a midsummer pole, flowers and leaves on it
    piece((o) => ({ x: o.x0 + o.W + 1.2, z: 1.2 }), (k, g, p) => {
      k.add(k.style.cylinder(0.05, 2.8), k.mat(PINE), g, p.x, 1.4, p.z);
      const bar = k.add(k.style.cylinder(0.04, 1.4), k.mat(PINE), g, p.x, 2.2, p.z);
      bar.rotation.z = Math.PI / 2;
      for (const dx of [-0.6, 0.6]) {
        const ring = k.add(k.style.cylinder(0.22, 0.06), k.mat('#5fb35a'), g, p.x + dx, 1.9, p.z);
        ring.rotation.x = Math.PI / 2;
      }
      for (let i = 0; i < 8; i++) k.add(k.style.ball(0.07), k.mat(['#ffd166', '#fffaf0', '#9b8fe0', '#6cb4ee'][i % 4] ?? WORLD.paper), g, p.x, 0.5 + i * 0.28, p.z + 0.06);
    }),
    // 14 a golden Dala horse on a plinth
    piece((o) => ({ x: o.x0 - 1.9, z: 1.4 }), (k, g, p) => { onPlinth(k, g, p.x, p.z, (gold, y) => {
        k.add(k.style.box(0.5, 0.26, 0.18), gold, g, p.x, y + 0.42, p.z);
        k.add(k.style.box(0.18, 0.34, 0.16), gold, g, p.x + 0.22, y + 0.68, p.z);
        for (const dx of [-0.18, 0.18]) k.add(k.style.box(0.08, 0.24, 0.14), gold, g, p.x + dx, y + 0.17, p.z);
      }); }),
  ],
  tree: (k, parent, x, z, size, i) => { tree(k, parent, x, z, size, i); },
  frameSpan: (o) => ({ xa: boardX(o) + 1.1, xb: o.mainDesk.x - 0.5, y: 1.45, z: 0.02 }),
  frame: plainFrame('#ecd2a6', [BLUE, OCHRE, '#2a9d8f', '#9b8fe0', '#a8c96a']),
  flowers: ['#fffaf0', '#ffd166', '#9b8fe0', '#6cb4ee'],
};

/** the planks, the walls and wainscot, the windows, the long table and its lamps, the skis, the nook */
function shell(b: Build): void {
  const { k, root } = b;
  const { style, pal } = k;
  const o = nd(b.o);
  const { x0, W, D, table: t } = o;
  const night = pal.pendants;
  k.add(style.box(W, 0.14, D), style.floor(pal.floor, W, D), root, x0 + W / 2, -0.05, D / 2);
  k.add(style.box(W + 0.2, 1.9, 0.2), k.mat(pal.wall), root, x0 + W / 2, 0.95, -0.1);
  k.add(style.box(0.2, 1.3, D + 0.2), k.mat(pal.wall), root, x0 - 0.1, 0.65, D / 2);
  k.add(style.box(W, 0.5, 0.05), k.mat(pal.desk), root, x0 + W / 2, 0.25, 0.02);
  k.add(style.box(0.05, 0.5, D), k.mat(pal.desk), root, x0 + 0.02, 0.25, D / 2);
  // tall windows on the left wall: the snow outside
  const glass = style.material(night ? '#2c4a6b' : '#dff1fb', night ? { emissive: '#3c5a8a', ei: 0.5 } : {});
  for (let z = o.island.z1 + 0.4; z < D - 1.2; z += 2.4) {
    k.add(style.box(0.06, 0.9, 1.4), k.mat(DARK_WOOD), root, x0 + 0.01, 0.85, z + 0.7);
    k.add(style.box(0.07, 0.78, 1.28), glass, root, x0 + 0.02, 0.85, z + 0.7);
  }
  // the long table: its top, a runner, candles (lit at night), pendant lamps over it
  const tz = (t.z0 + t.z1) / 2;
  const tl = t.z1 - t.z0;
  k.add(style.box(t.x1 - t.x0 - 0.1, 0.5, tl - 0.1, 0.06), k.mat(pal.desk), root, 0, 0.25, tz);
  k.add(style.box(t.x1 - t.x0, 0.06, tl), k.mat(pal.deskTop), root, 0, 0.52, tz);
  k.add(style.box(0.4, 0.01, tl - 0.2), k.mat(night ? '#9aa4ad' : '#dfe7ee'), root, 0, 0.555, tz);
  const flame = style.material('#ffd166', night ? { emissive: '#ffd166', ei: 2 } : {});
  for (let z = t.z0 + 0.8; z < t.z1; z += 1.6) {
    k.add(style.cylinder(0.04, 0.16), k.mat(WORLD.paper), root, 0, 0.64, z);
    k.add(style.ball(0.035), flame, root, 0, 0.75, z);
  }
  const shade = k.mat(night ? '#d8d2c6' : WORLD.paper);
  const bulb = style.material('#ffd166', night ? { emissive: '#ffd166', ei: 0.8 } : {});
  for (let z = t.z0 + 1.2; z < t.z1; z += 2.4) {
    k.add(style.cylinder(0.005, 0.6), k.mat(WORLD.dark), root, 0, 2.1, z);
    k.add(style.cap(0.3, 0.5), shade, root, 0, 1.75, z);
    k.add(style.ball(0.08), bulb, root, 0, 1.68, z);
  }
  // two skis against the back wall, behind main's desk
  for (const [dx, c] of [[0, BLUE], [0.25, OCHRE]] as const) k.add(style.box(0.1, 1.7, 0.04), k.mat(c), root, x0 + W - 0.35 - dx, 0.85, 0.15).rotation.z = 0.08;
  nook(k, root, o);
  // the sauna on the terrace (its porch: stage 11)
  if (b.grow.stage < 11) sauna(k, root, saunaAt(o), false);
  onFloor(k, root, boxOf(decorOf(o).doorMat), 0.03, 0.03, '#a9b8c8');
}

/** the fika counter: the coffee pot, the cardamom jar */
function island(b: Build): void {
  const { k, root, o } = b;
  const { style, pal } = k;
  const I = o.island;
  const x = counterX(o);
  const zc = (I.z0 + I.z1) / 2;
  const len = I.z1 - I.z0;
  k.add(style.box(I.x1 - I.x0 - 0.1, 0.62, len - 0.1, 0.06), k.mat(pal.island), root, x, 0.31, zc);
  k.add(style.box(I.x1 - I.x0 + 0.05, 0.07, len), k.mat(pal.islandTop), root, x, 0.66, zc);
  k.add(style.cylinder(0.13, 0.3), k.mat(WORLD.dark), root, x, 0.84, I.z0 + 0.4);
  k.add(style.cylinder(0.02, 0.14), k.mat(WORLD.dark), root, x + 0.15, 0.88, I.z0 + 0.4).rotation.z = -0.8;
  k.add(style.cylinder(0.07, 0.18), style.material('#cfe8c3', { opacity: 0.85 }), root, x, 0.78, I.z0 + 0.8);
}

/** the wood stove in the corner, its logs; a sheepskin per bed the stage has reached, a plaid from stage 3 */
function lounge(b: Build): void {
  const { k, root, o } = b;
  const { style, pal } = k;
  const night = pal.pendants;
  const sx = o.x0 + 0.55;
  k.add(style.cylinder(0.35, 0.8), k.mat(WORLD.dark), root, sx, 0.4, 0.55);
  k.add(style.cylinder(0.08, 1.2), k.mat(WORLD.dark), root, sx, 1.4, 0.55);
  k.add(style.box(0.3, 0.22, 0.03), style.material(night ? '#ff9a3d' : '#5c3d2e', night ? { emissive: '#ff9a3d', ei: 1.5 } : {}), root, sx, 0.38, 0.9);
  for (let i = 0; i < 4; i++) k.add(style.cylinder(0.06, 0.5), k.mat('#a0673f'), root, sx - 0.2 + (i % 2) * 0.13, 0.06 + Math.floor(i / 2) * 0.12, 1.5).rotation.x = Math.PI / 2;
  const s3 = b.stage(3);
  if (s3) {
    const [l0, l1] = loungeX(o);
    k.add(style.box(Math.min(2.2, l1 - l0), 0.02, 1.0), k.mat(BLUE), s3, (l0 + l1) / 2, 0.035, 3.0);
    for (let i = 0; i < 4; i++) k.add(style.box(Math.min(2.2, l1 - l0), 0.025, 0.06), k.mat(WORLD.paper), s3, (l0 + l1) / 2, 0.04, 2.65 + i * 0.22);
  }
  beds(b, (kk, parent, box) => {
    const s = kk.add(kk.style.ball(0.4), kk.mat(night ? '#c9c4bb' : SKIN), parent, (box.x0 + box.x1) / 2, 0.05, (box.z0 + box.z1) / 2);
    s.scale.set(1.0, 0.18, 0.9);
  });
}

/** one place at the long table: its chair, its laptop and lamp on the table's edge */
function desk(b: Build, s: { x: number; z: number; face: number; wz: number; ax: number }, name: string): DeskHandles {
  const { k, root } = b;
  const h = hash(name);
  const g = new Group();
  g.position.set(s.x, 0, s.z);
  g.rotation.y = s.face;
  root.add(g);
  const screen = laptop(k, g, 0, 0.47);
  const lamp = deskLamp(k, g, 0.5, 0.85);
  const seat = chair(k, g, 0, -0.05, HOODIE[(h >> 5) % HOODIE.length] ?? PINE, 0);
  if (h % 3 === 0) k.add(k.style.cylinder(0.05, 0.1), k.mat(WORLD.paper), g, -0.45, 0.6, 0.75);
  const c = ahead(s, 0.5);
  return { screen, lamp, top: { x: c.x, y: 0.55, z: c.z }, chair: seat };
}

export const nordic: MapLook = {
  id: 'nordic',
  // its cozy pieces (render/cozy.ts; page bims-cozy v2 « la base, carte par carte »)
  cozy: { plant: 'pothos', small: 'succulent', coffee: 'kettle', bed: 'bench', shelf: 'candles', poster: 'map', wood: '#c9a77c', cloth: ['#4f6d7a', '#e9e2d4', '#9a958c'], art: ['#4f6d7a', '#7cc26b', '#e9c46a'], pot: '#e9e2d4' },
  pal: palettes(
    { floor: '#ead6b4', wall: '#f7f5f0', wallTop: '#d9c7a6', desk: PINE, deskTop: '#ecd2a6', island: '#f7f5f0', islandTop: PINE, grass: '#eef3f7', dirt: '#7a5a3c', terrace: '#e2d2b4', rug: BLUE },
    { grass: '#9fb0c4', wall: '#8c8a84' },
  ),
  shell,
  island,
  lounge,
  desk,
  mainDesk: (b) => {
    const md = b.o.mainDesk;
    const box = boxHolding(b.o, { x: md.x, z: md.z + 0.6 }) ?? { x0: md.x - 1.15, x1: md.x + 1.15, z0: md.z + 0.1, z1: md.z + 1.1 };
    return bigDesk(b, box, md);
  },
  tree: ({ k }, parent, x, z, size) => { tree(k, parent, x, z, size, 1); },
  growth: (b) => { grow(b, grower); },
  pieceAt: pieceAtOf(grower),
  // a striped scarf: two or three rings round the neck
  wear: (w) => {
    const h = hash(w.name);
    const cs = [BLUE, WORLD.paper, OCHRE].slice(0, 2 + (h % 2));
    cs.forEach((c, i) => w.add(w.style.cylinder(0.19, 0.05), w.mat(c), w.body, 0, 0.74 + i * 0.05, 0));
  },
};

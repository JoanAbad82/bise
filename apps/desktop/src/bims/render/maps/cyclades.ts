// The Cyclades' look (Greece, an island; render/maps/look.ts; its plan: maps/cyclades.ts): a
// pebble mosaic floor, low whitewashed walls round the plot, each team's white cube (back and side
// walls, a blue window, a blue door, the first with its blue dome), a cat asleep on the first
// desk, the sea all round; the kafeneio's tables and blue chairs under a reed pergola and its vine;
// a white built-in bench with blue cushions to nap; olive trees; a navy fisherman's cap on every
// bim. Its growth (his note on page bims-maps, Grèce · l'île des Cyclades): basil, olives and
// feta and the first olive tree, two blue rush chairs, a board painted blue, a meander frieze and
// a bouzouki, figs and jasmine, the pergola's vine grows, a new cube and olive trees, a tavli
// table, a whitewashed well, a stair to a cube on the roof, a little harbour and its caïque, the
// windmill, a golden amphora; frames in blue window surrounds, a golden mosaic at 500. Owner: maps-c.
import { Group, type Object3D } from 'three';
import type { Pt } from '../../model';
import type { CycladesOffice } from '../../maps/cyclades';
import type { Kit } from '../kit';
import { DAY, NIGHT, WORLD, hash } from '../palette';
import type { Build, MapLook, Wear } from './look';
import {
  beds, cone, deskOf, floorOf, frames, gameTable, grow, mainDeskOf, nc, palOf, patterned,
  pieceSpots, plinth, potted, terrace, treeSpots, type Piece,
} from './yard';

const BLUE = '#2f5fa7';
const WHITE = '#fbfaf6';
const OLIVE = '#8a9a6a';
const REED = '#c9a66c';
const VINE = '#6b9f3a';
const SEA = '#3d8fd1';

const pal = (night: boolean) =>
  palOf(night ? NIGHT : DAY, {
    floor: nc('#e8e2d4', night, 0.55),
    wall: nc(WHITE, night, 0.55),
    wallTop: nc('#e8e4dc', night, 0.55),
    desk: nc(BLUE, night, 0.9),
    deskTop: nc(WHITE, night, 0.75),
    island: BLUE,
    islandTop: nc(WHITE, night, 0.75),
    grass: nc('#d8c9a0', night),
    dirt: nc('#b39a72', night),
    terrace: nc('#ece6d8', night, 0.6),
    plant: OLIVE,
  });

const office = (b: Build): CycladesOffice => b.o as CycladesOffice;

/** a cube: its back wall and left wall, a blue window and a blue door; a dome on the first */
function cube(k: Kit, parent: Object3D, x: number, z: number, w: number, dome: boolean): void {
  const white = k.mat(k.pal.wall);
  const blue = k.mat(nc(BLUE, k.pal.pendants));
  const hw = w / 2;
  const z0 = z - 0.55;
  k.add(k.style.box(w + 0.1, 0.02, 2.6), k.mat(nc('#f7f4ec', k.pal.pendants, 0.6)), parent, x, 0.035, z + 0.65);
  k.add(k.style.box(w + 0.1, 1.5, 0.22), white, parent, x, 0.75, z0);
  k.add(k.style.box(0.22, 1.2, 2.4), white, parent, x - hw - 0.05, 0.6, z + 0.65);
  k.add(k.style.box(0.5, 0.45, 0.04), blue, parent, x + hw - 0.6, 1.0, z0 + 0.12);
  k.add(k.style.box(0.04, 0.85, 0.5), blue, parent, x - hw + 0.08, 0.45, z + 1.3);
  if (!dome) return;
  k.add(k.style.cylinder(0.55, 0.35), white, parent, x - hw + 0.8, 1.65, z0);
  k.add(k.style.cap(0.55, 0.5), blue, parent, x - hw + 0.8, 1.82, z0);
  k.add(k.style.box(0.05, 0.3, 0.05), k.mat('#e9c46a'), parent, x - hw + 0.8, 2.5, z0);
}

function shell(b: Build): void {
  const { k, root } = b;
  const o = office(b);
  const { x0, W, D } = o;
  const night = k.pal.pendants;
  // the sea all round, under the island's ground
  const sea = k.add(k.style.box(90, 0.02, 90), k.style.material(night ? '#16304a' : SEA), root, x0 + W / 2, -1.4, D / 2);
  sea.receiveShadow = false;
  floorOf(k, root, o, patterned(k, k.pal.floor, W, D, 1.5, (g, px) => {
    for (let i = 0; i < 40; i++) {
      g.fillStyle = i % 3 ? nc(WHITE, night, 0.6) : '#5c677d';
      g.beginPath();
      g.ellipse((i * 37) % px, (i * 53) % px, 4, 2.5, i, 0, 7);
      g.fill();
    }
  }));
  // low whitewashed walls round the plot
  k.add(k.style.box(W + 0.2, 0.8, 0.25), k.mat(k.pal.wall), root, x0 + W / 2, 0.4, -0.12);
  k.add(k.style.box(0.25, 0.8, D + 0.2), k.mat(k.pal.wall), root, x0 - 0.12, 0.4, D / 2);
  o.cubes.forEach((c, i) => {
    cube(k, root, c.x, c.z, c.w, i === 0);
  });
  // the cat, asleep on the first desk's corner
  const first = [...o.desks.values()].sort((p, q) => p.z - q.z || p.x - q.x)[0];
  if (first) {
    k.add(k.style.ball(0.16), k.mat('#e9a65c'), root, first.x + 0.45, 0.62, first.z + 0.75).scale.set(1.4, 0.6, 1);
    k.add(k.style.ball(0.08), k.mat('#e9a65c'), root, first.x + 0.65, 0.66, first.z + 0.75);
  }
  // a blue gate at the door
  for (const dx of [-0.6, 0.6]) k.add(k.style.box(0.12, 0.9, 0.12), k.mat(k.pal.wall), root, o.door.x + dx, 0.45, D - 0.05);
}

/** the kafeneio: two round tables, blue chairs, a reed pergola on white posts */
function island(b: Build): void {
  const { k, root } = b;
  const o = office(b);
  for (const p of o.posts) k.add(k.style.cylinder(0.07, 2.1), k.mat(WHITE), root, p.x, 1.05, p.z);
  const xs = o.posts.map((p) => p.x);
  const zs = o.posts.map((p) => p.z);
  const px = (Math.min(...xs) + Math.max(...xs)) / 2;
  for (let z = Math.min(...zs); z <= Math.max(...zs); z += 0.18) k.add(k.style.box(2.4, 0.03, 0.08), k.mat(REED), root, px, 2.12, z);
  for (const t of o.tables) {
    const tx = (t.x0 + t.x1) / 2;
    const tz = (t.z0 + t.z1) / 2;
    k.add(k.style.cylinder(0.42, 0.05), k.mat(WHITE), root, tx, 0.55, tz);
    k.add(k.style.cylinder(0.05, 0.55), k.mat(WORLD.dark), root, tx, 0.27, tz);
  }
  for (const s of o.islandSpots) {
    const g = new Group();
    g.position.set(s.x, 0, s.z);
    g.rotation.y = s.face;
    root.add(g);
    k.add(k.style.box(0.38, 0.06, 0.38), k.mat(REED), g, 0, 0.32, 0);
    k.add(k.style.box(0.38, 0.4, 0.05), k.mat(BLUE), g, 0, 0.52, -0.18);
    for (const dx of [-0.16, 0.16]) for (const dz of [-0.16, 0.16]) k.add(k.style.box(0.04, 0.3, 0.04), k.mat(BLUE), g, dx, 0.15, dz);
  }
}

/** the built-in white bench along the back wall, a blue cushion per place */
function lounge(b: Build): void {
  const { k, o } = b;
  const xs = o.lounge.map((s) => s.x);
  const s3 = b.stage(3);
  if (s3 && xs.length) {
    const x0 = Math.min(...xs) - 0.5;
    const x1 = Math.max(...xs) + 0.5;
    k.add(k.style.box(x1 - x0, 0.3, 0.45), k.mat(k.pal.wall), s3, (x0 + x1) / 2, 0.15, 0.3);
  }
  beds(b, (g, box) => {
    k.add(k.style.box(0.7, 0.12, 0.5), k.mat(BLUE), g, (box.x0 + box.x1) / 2, 0.08, (box.z0 + box.z1) / 2);
    k.add(k.style.box(0.5, 0.2, 0.1), k.mat(WHITE), g, (box.x0 + box.x1) / 2, 0.22, box.z0 + 0.05);
  });
}

/** an olive tree: a twisted trunk, a grey-green crown */
function tree(k: Kit, parent: Object3D, x: number, z: number, size: number): void {
  const g = new Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(size);
  parent.add(g);
  const lean = ((hash(`${x.toFixed(1)}${z.toFixed(1)}`) % 9) - 4) * 0.05;
  k.add(k.style.cylinder(0.1, 0.8), k.mat('#6b5a48'), g, 0, 0.4, 0).rotation.z = lean;
  k.add(k.style.ball(0.55), k.mat(OLIVE), g, lean * 0.6, 1.1, 0).scale.set(1.2, 0.7, 1.0);
}

const PIECES: Record<number, Piece> = {
  // a pot of basil
  1: (k, g, p) => {
    potted(k, g, p.x, p.z, WHITE, '#5fb35a', 0.3);
  },
  // olives and feta on the first table, the first olive tree
  2: (k, g, p, b) => {
    k.add(k.style.box(0.2, 0.08, 0.14), k.mat(WHITE), g, p.x - 0.1, 0.62, p.z);
    for (let i = 0; i < 5; i++) k.add(k.style.ball(0.035), k.mat('#4b3f2a'), g, p.x + 0.12 + (i % 3) * 0.06, 0.6, p.z - 0.05 + Math.floor(i / 3) * 0.08);
    const t = treeSpots(b.o)[0];
    if (t) tree(k, g, t.x, t.z, 0.8 + b.grow.garden * 0.06);
  },
  3: () => undefined,
  // a board painted blue on the back wall
  4: (k, g, p) => {
    const z = 0.13 + k.style.pictureZ;
    k.add(k.style.box(1.7, 0.6, 0.05), k.mat(BLUE), g, p.x, 0.5, z);
    k.add(k.style.box(1.55, 0.48, 0.02), k.mat(WHITE), g, p.x, 0.5, z + 0.03);
    for (let i = 0; i < 3; i++) k.add(k.style.box(0.5 + i * 0.25, 0.04, 0.01), k.mat(WORLD.board[i] ?? BLUE), g, p.x - 0.3, 0.65 - i * 0.13, z + 0.05);
  },
  // a meander frieze on the low wall, a bouzouki leaning on it
  5: (k, g, p) => {
    const z = 0.02;
    for (let i = 0; i < 12; i++) {
      k.add(k.style.box(0.18, 0.04, 0.02), k.mat(BLUE), g, p.x - 2.0 + i * 0.36, 0.72, z);
      k.add(k.style.box(0.04, 0.14, 0.02), k.mat(BLUE), g, p.x - 1.93 + i * 0.36, 0.66, z);
    }
    const bx = p.x + 2.4;
    k.add(k.style.ball(0.14), k.mat('#c98a3e'), g, bx, 0.3, 0.3).scale.set(1, 1.2, 0.5);
    k.add(k.style.box(0.05, 0.55, 0.03), k.mat('#6b4a32'), g, bx, 0.7, 0.3);
  },
  // figs on the second table, jasmine on the walls
  6: (k, g, p, b) => {
    for (let i = 0; i < 4; i++) k.add(k.style.ball(0.06), k.mat('#5b3a7a'), g, p.x + Math.cos(i * 1.6) * 0.1, 0.6, p.z + 2.1 + Math.sin(i * 1.6) * 0.1);
    const o = b.o;
    for (let i = 0; i < 14; i++) k.add(k.style.ball(0.05), k.mat(i % 3 ? '#fffaf0' : '#7cc26b'), g, o.x0 + 0.5 + i * (o.W / 14), 0.82, -0.05);
  },
  // the pergola grows a vine
  7: (k, g, _p, b) => {
    const o = b.o as CycladesOffice;
    const xs = o.posts.map((p) => p.x);
    const zs = o.posts.map((p) => p.z);
    const px = (Math.min(...xs) + Math.max(...xs)) / 2;
    for (let i = 0; i < 9; i++) k.add(k.style.ball(0.22), k.mat(VINE), g, px - 0.9 + (i % 3) * 0.9, 2.2, Math.min(...zs) + 0.4 + Math.floor(i / 3) * 1.4).scale.y = 0.5;
    for (let i = 0; i < 4; i++) k.add(k.style.ball(0.05), k.mat('#5b3a7a'), g, px - 0.6 + i * 0.4, 2.05, Math.min(...zs) + 1.2 + i * 0.5);
  },
  // a new little cube in the garden, olive trees all round
  8: (k, g, p, b) => {
    k.add(k.style.box(1.0, 0.9, 1.0), k.mat(b.k.pal.wall), g, p.x, 0.45, p.z);
    k.add(k.style.box(0.3, 0.5, 0.02), k.mat(BLUE), g, p.x, 0.25, p.z + 0.51);
    for (const t of treeSpots(b.o).slice(1)) tree(k, g, t.x, t.z, 0.8 + b.grow.garden * 0.06);
  },
  // a tavli table: the board's points
  9: (k, g, p) => {
    gameTable(k, g, p, '#8a5a3c', '#e8d6b0');
    for (let i = 0; i < 6; i++) cone(k, g, 0.04, 0.2, i % 2 ? WHITE : WORLD.dark, p.x - 0.25 + i * 0.1, 0.39, p.z - 0.2).rotation.x = Math.PI / 2;
  },
  // a well whitewashed, its blue lid
  10: (k, g, p) => {
    k.add(k.style.cylinder(0.45, 0.6), k.mat(WHITE), g, p.x, 0.3, p.z);
    k.add(k.style.cylinder(0.4, 0.05), k.mat(BLUE), g, p.x, 0.62, p.z);
  },
  // a stair up to a cube on the roof (the island rises)
  11: (k, g, p, b) => {
    k.add(k.style.box(1.4, 1.0, 1.2), k.mat(b.k.pal.wall), g, p.x, 0.5, p.z);
    k.add(k.style.box(1.0, 0.8, 0.9), k.mat(b.k.pal.wall), g, p.x + 0.1, 1.4, p.z - 0.05);
    k.add(k.style.box(0.3, 0.45, 0.02), k.mat(BLUE), g, p.x + 0.1, 1.3, p.z + 0.41);
    for (let i = 0; i < 5; i++) k.add(k.style.box(0.35, 0.2, 0.2), k.mat(WHITE), g, p.x - 0.85, 0.1 + i * 0.2, p.z + 0.5 - i * 0.2);
  },
  // a little harbour: a jetty into the sea and its caïque
  12: (k, g, p) => {
    k.add(k.style.box(1.8, 0.08, 0.4), k.mat('#c49a6c'), g, p.x, 0.05, p.z);
    const hull = k.add(k.style.box(1.2, 0.25, 0.45), k.mat(BLUE), g, p.x - 0.2, 0.15, p.z + 0.6);
    hull.scale.set(1, 1, 1);
    k.add(k.style.box(1.1, 0.06, 0.4), k.mat(WHITE), g, p.x - 0.2, 0.3, p.z + 0.6);
    k.add(k.style.box(0.04, 0.6, 0.04), k.mat('#6b4a32'), g, p.x - 0.1, 0.6, p.z + 0.6);
  },
  // the windmill and its sails
  13: (k, g, p) => {
    k.add(k.style.cylinder(0.5, 1.6), k.mat(WHITE), g, p.x, 0.8, p.z);
    cone(k, g, 0.6, 0.45, '#a8764a', p.x, 1.82, p.z);
    const hub = new Group();
    hub.position.set(p.x, 1.7, p.z + 0.55);
    g.add(hub);
    for (let i = 0; i < 6; i++) {
      const arm = new Group();
      arm.rotation.z = (i * Math.PI) / 3;
      hub.add(arm);
      k.add(k.style.box(0.06, 0.9, 0.02), k.mat('#6b4a32'), arm, 0, 0.45, 0);
      k.add(k.style.box(0.22, 0.5, 0.01), k.mat(WHITE), arm, 0.12, 0.6, 0);
    }
  },
  // a golden amphora at main's mark
  14: (k, g, p) => {
    plinth(k, g, p, (gold, y) => {
      k.add(k.style.ball(0.22), gold, g, p.x, y + 0.3, p.z).scale.set(1, 1.3, 1);
      k.add(k.style.cylinder(0.07, 0.25), gold, g, p.x, y + 0.65, p.z);
      for (const s of [-1, 1]) k.add(k.style.box(0.04, 0.2, 0.04), gold, g, p.x + s * 0.12, y + 0.62, p.z);
    });
  },
};

/** a frame in a blue window surround; a golden mosaic from 500 */
function frame(k: Kit, parent: Object3D, x: number, y: number, z: number, i: number, golden: boolean): void {
  k.add(k.style.box(0.28, 0.24, 0.02), k.mat(golden ? WORLD.gold : BLUE), parent, x, y, z);
  k.add(k.style.box(0.2, 0.16, 0.01), k.mat(golden ? '#e9c46a' : [SEA, '#e9c46a', OLIVE, WHITE][i % 4] ?? SEA), parent, x, y, z + 0.015);
}

const pieceAt = (o: Parameters<MapLook['pieceAt']>[0], stage: number): Pt => {
  const s = pieceSpots(o);
  // the kafeneio's first table holds the food; the harbour goes past the plot's front, by the sea
  if (stage === 2 || stage === 6) {
    const t = (o as CycladesOffice).tables[0];
    if (t) return { x: (t.x0 + t.x1) / 2, z: (t.z0 + t.z1) / 2 };
  }
  return s[Math.min(stage, 14)] ?? o.door;
};

function growth(b: Build): void {
  terrace(b, b.k.pal.terrace, [BLUE, WHITE]);
  grow(b, PIECES, pieceAt);
  const bx = pieceSpots(b.o)[4]?.x ?? b.o.x0 + b.o.W / 2;
  frames(b, { xa: bx + 1.1, xb: b.o.mainDesk.x - 0.6, y: 0.95 }, frame);
}

/** a navy fisherman's cap */
function wear(w: Wear): void {
  w.add(w.style.cylinder(0.21, 0.12), w.mat('#2b3a67'), w.head, 0, 0.2, 0);
  w.add(w.style.box(0.24, 0.025, 0.12), w.mat('#1d1a17'), w.head, 0, 0.15, 0.2);
}

export const cyclades: MapLook = {
  id: 'cyclades',
  // its cozy pieces (render/cozy.ts; page bims-cozy v2 « la base, carte par carte »)
  cozy: { plant: 'geranium', small: 'succulent', coffee: 'carafe', bed: 'bench', shelf: 'boat', poster: 'sea', wood: '#d8d2c6', cloth: ['#3d6fb6', '#6cb4ee', '#f3efe4'], art: ['#3d6fb6', '#e9c46a', '#6cb4ee'], pot: '#c98a3e' },
  pal,
  shell,
  island,
  lounge,
  desk: (b, d, name) => deskOf(b, d, name, { chair: BLUE }),
  mainDesk: (b) => mainDeskOf(b, WHITE, BLUE),
  tree: ({ k }, parent, x, z, size) => {
    tree(k, parent, x, z, size);
  },
  growth,
  pieceAt,
  wear,
};

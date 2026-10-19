// The patio's look (Mexico; render/maps/look.ts; its plan: maps/patio.ts): terracotta tiles, an
// ochre back wall and a cobalt side wall (Barragán), the free-standing colour walls behind each
// team, papel picado strung across, the violet water trough; the long sobremesa table and its
// stools and two equipales at its ends; hammocks to nap in; saguaros, agaves and jacarandas in the garden;
// a striped sarape on every bim. Its growth (page bims-maps, Mexique · la maison à patio): a
// cactus, pan dulce and the first agave, two equipales, a painted slate, a mural and a guitar,
// café de olla and marigolds, a palapa, jacarandas and hammocks, a lotería table, a talavera
// fountain, a futbolito, a cenote, an alebrije balloon, a golden alebrije; tin frames, a golden
// retablo at 500. Never the app's pink or red. Owner: maps-c.
import { Group, type Object3D, TorusGeometry } from 'three';
import type { Pt } from '../../model';
import type { PatioOffice } from '../../maps/patio';
import type { Kit } from '../kit';
import { hammock } from '../cozy';
import { DAY, NIGHT, WORLD, hash, rng } from '../palette';
import type { Build, MapLook, Wear } from './look';
import {
  balloon, beds, block, cone, deskOf, floorOf, frames, gameTable, grow, mainDeskOf, nc,
  onTop, palOf, patterned, pieceSpots, plinth, pond, terrace, treeSpots, type Piece, pastNap,
} from './yard';

const SLABS = ['#2f5fa7', '#7b5fc0', '#f39a4c', '#2a9d8f', '#e9c46a'] as const;
const PICADO = ['#f28c28', '#e9c46a', '#2a9d8f', '#3d6fb6', '#7b5fc0', '#7cc26b'] as const;
const COBALT = '#2f5fa7';
const TALAVERA = '#3d6fb6';
const AGAVE = '#6b9f7a';
const SAGUARO = '#4f8a5b';
const JACARANDA = '#9b8fe0';
const MARIGOLD = '#f28c28';

const pal = (night: boolean) =>
  palOf(night ? NIGHT : DAY, {
    floor: nc('#df9a6a', night, 0.7),
    wall: nc('#f2b53a', night),
    wallTop: nc('#d99a2a', night),
    desk: nc('#a0673f', night, 0.85),
    deskTop: nc('#c98a5a', night, 0.85),
    island: nc('#6b4a32', night, 0.85),
    islandTop: nc('#f3efe4', night, 0.8),
    grass: nc('#d9c08a', night),
    dirt: nc('#a8764a', night),
    terrace: nc('#e6c9a0', night),
    plant: AGAVE,
  });

const office = (b: Build): PatioOffice => b.o as PatioOffice;

function shell(b: Build): void {
  const { k, root } = b;
  const o = office(b);
  const { x0, W, D } = o;
  const night = k.pal.pendants;
  floorOf(k, root, o, patterned(k, k.pal.floor, W, D, 0.8, (g, px) => {
    g.fillStyle = nc('#c47a48', night, 0.7);
    g.fillRect(0, 0, px, 3);
    g.fillRect(0, 0, 3, px);
    g.fillStyle = nc('#e3a070', night, 0.7);
    g.fillRect(12, 12, 40, 40);
  }));
  // Barragán's walls: ochre at the back, cobalt on the left
  k.add(k.style.box(W + 0.2, 1.7, 0.2), k.mat(k.pal.wall), root, x0 + W / 2, 0.85, -0.1);
  k.add(k.style.box(0.2, 1.1, D + 0.2), k.mat(nc(COBALT, night)), root, x0 - 0.1, 0.55, D / 2);
  // the colour walls, a row of talavera tiles on each
  for (const s of o.slabs) {
    k.add(k.style.box(s.w, 1.2, 0.22), k.mat(nc(SLABS[s.c] ?? COBALT, night, 0.75)), root, s.x, 0.6, s.z);
    for (let i = 0; i < 5; i++) k.add(k.style.box(0.3, 0.16, 0.02), k.mat(i % 2 ? '#fffaf0' : TALAVERA), root, s.x - 1.6 + i * 0.8, 0.95, s.z + 0.12);
  }
  // papel picado over the back corridor from the board on (over the nap place's side the line
  // crossed the nappers' faces on the screen, bims m_34171) and over the long table; each a string
  // (userData.string: never over a napper's head on the screen, render/clip.test.ts)
  const board = Math.max(...o.boardSpots.map((s) => s.x), x0 + W / 2) + 0.5;
  for (const [xa, pz] of [[board, 4.25], [x0 + 0.3, o.island.z0 - 0.35]] as const) {
    const xb = x0 + W - 0.3;
    const line = k.add(k.style.cylinder(0.006, xb - xa), k.mat(WORLD.ink), root, (xa + xb) / 2, 2.0, pz);
    line.rotation.z = Math.PI / 2;
    line.userData.string = true;
    for (let x = xa + 0.3, i = 0; x < xb - 0.2; x += 0.42, i++) {
      k.add(k.style.box(0.28, 0.3, 0.01), k.mat(PICADO[i % PICADO.length] ?? MARIGOLD), root, x, 1.82 - Math.sin(((x - xa) / (xb - xa)) * Math.PI) * 0.12, pz).userData.string = true;
    }
  }
  // the water trough: violet, its spout wall, the water falling in; an alebrije on its rim
  const t = o.trough;
  block(k, root, t, 0.45, nc('#7b5fc0', night));
  k.add(k.style.box(t.x1 - t.x0 - 0.15, 0.02, t.z1 - t.z0 - 0.15), k.style.material('#8fd3ff', { emissive: '#8fd3ff', ei: night ? 0.3 : 0.1 }), root, (t.x0 + t.x1) / 2, 0.46, (t.z0 + t.z1) / 2);
  k.add(k.style.box(0.3, 1.4, 0.7), k.mat(nc('#f39a4c', night)), root, t.x1 + 0.1, 0.7, (t.z0 + t.z1) / 2);
  k.add(k.style.box(0.5, 0.08, 0.08), k.mat('#6b4a32'), root, t.x1 - 0.2, 1.2, (t.z0 + t.z1) / 2);
  k.add(k.style.box(0.06, 0.7, 0.06), k.style.material('#8fd3ff', { opacity: 0.7 }), root, t.x1 - 0.42, 0.82, (t.z0 + t.z1) / 2);
  const az = (t.z0 + t.z1) / 2;
  const al = k.add(k.style.ball(0.12), k.mat('#7b5fc0'), root, t.x0 + 0.3, 0.6, az);
  al.scale.set(1.4, 0.9, 1);
  k.add(k.style.ball(0.07), k.mat('#e9c46a'), root, t.x0 + 0.45, 0.72, az);
  // talavera pots with agaves at the colour walls' right ends
  for (const s of o.slabs) agavePot(k, root, s.x + s.w / 2 + 0.3, s.z - 0.25);
  // the door mat: a striped rug
  for (let i = 0; i < 4; i++) k.add(k.style.box(0.25, 0.02, 0.5), k.mat(PICADO[i] ?? MARIGOLD), root, o.door.x - 0.38 + i * 0.25, 0.03, D - 0.2);
}

function agavePot(k: Kit, g: Object3D, x: number, z: number): void {
  k.add(k.style.cylinder(0.17, 0.34), k.mat('#f3efe4'), g, x, 0.17, z);
  k.add(k.style.cylinder(0.175, 0.06), k.mat(TALAVERA), g, x, 0.28, z);
  for (let i = 0; i < 6; i++) {
    const l = cone(k, g, 0.05, 0.5, AGAVE, x + Math.sin(i) * 0.07, 0.55, z + Math.cos(i) * 0.07);
    l.rotation.set(Math.cos(i) * 0.6, 0, -Math.sin(i) * 0.6);
  }
}

/** the long table: talavera-edged, its stools; what it holds comes with the stages */
function island(b: Build): void {
  const { k, root, o } = b;
  const I = o.island;
  block(k, root, { ...I, x0: I.x0 + 0.05, x1: I.x1 - 0.05, z0: I.z0 + 0.05, z1: I.z1 - 0.05 }, 0.5, k.pal.island);
  block(k, root, I, 0.06, k.pal.islandTop, 0.5);
  for (let x = I.x0 + 0.15; x < I.x1 - 0.1; x += 0.3) for (const z of [I.z0 + 0.04, I.z1 - 0.04]) k.add(k.style.box(0.2, 0.02, 0.06), k.mat(TALAVERA), root, x, 0.57, z);
  for (const s of o.islandSpots) k.add(k.style.box(0.36, 0.3, 0.36), k.mat('#c98a5a'), root, s.x, 0.15, s.z + (s.face === 0 ? -0.1 : 0.1));
}

/** an equipal: a round leather seat on a woven barrel, its low back */
function equipal(k: Kit, g: Object3D, x: number, z: number, back: number): void {
  k.add(k.style.cylinder(0.28, 0.32), k.mat('#c98a3e'), g, x, 0.16, z);
  k.add(k.style.cylinder(0.3, 0.06), k.mat('#8a5a3c'), g, x, 0.34, z);
  k.add(k.style.box(0.56, 0.4, 0.08), k.mat('#a0673f'), g, x, 0.55, z + back * 0.26);
}

/**
 * the nap place: hammocks only, each between a post at its head and one past its napper's toes
 * (render/cozy.ts hammock, the cozy kit's two the same); stage 3's two equipales stand at the long
 * table's ends. Equipales, a low frame and hammocks on posts in one corner read as nothing, and the
 * posts went through the nappers (Gabriel, bims-clip; bims m_33943)
 */
function lounge(b: Build): void {
  const { k, o } = b;
  beds(b, (g, box, i) => {
    hammock(k, g, box, i % 2 ? ['#2a9d8f', '#7b5fc0', '#e9c46a'] : [MARIGOLD, TALAVERA, '#e9c46a'], '#6b4a32');
  });
  const s3 = b.stage(3);
  const I = o.island;
  if (s3) for (const [x, back] of [[I.x0 - 0.38, -1], [I.x1 + 0.38, 1]] as const) equipal(k, s3, x, (I.z0 + I.z1) / 2, back);
}

/** saguaros with arms, agaves, a violet jacaranda */
function tree(k: Kit, parent: Object3D, x: number, z: number, size: number): void {
  const g = new Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(size);
  parent.add(g);
  const kind = hash(`${x.toFixed(1)}:${z.toFixed(1)}`) % 3;
  if (kind === 0) {
    k.add(k.style.capsule(0.16, 1.3), k.mat(SAGUARO), g, 0, 0.8, 0);
    for (const s of [-1, 1]) {
      k.add(k.style.capsule(0.09, 0.35), k.mat(SAGUARO), g, s * 0.3, 1.05 + s * 0.1, 0);
      const arm = k.add(k.style.capsule(0.09, 0.15), k.mat(SAGUARO), g, s * 0.17, 0.82 + s * 0.1, 0);
      arm.rotation.z = Math.PI / 2;
    }
  } else if (kind === 1) {
    for (let i = 0; i < 8; i++) {
      const l = cone(k, g, 0.07, 0.7, AGAVE, Math.sin(i) * 0.1, 0.32, Math.cos(i) * 0.1);
      l.rotation.set(Math.cos(i) * 0.7, 0, -Math.sin(i) * 0.7);
    }
  } else {
    k.add(k.style.cylinder(0.1, 1.1), k.mat('#6b4a32'), g, 0, 0.55, 0);
    k.add(k.style.ball(0.65), k.mat(JACARANDA), g, 0, 1.45, 0).scale.y = 0.75;
  }
}

function panDulce(k: Kit, g: Group, x: number, z: number): void {
  k.add(k.style.cylinder(0.25, 0.03), k.mat('#fffaf0'), g, x, 0.58, z);
  for (let i = 0; i < 4; i++) k.add(k.style.ball(0.07), k.mat(i % 2 ? '#e9c46a' : '#c98a3e'), g, x + Math.sin(i * 1.6) * 0.12, 0.63, z + Math.cos(i * 1.6) * 0.12).scale.y = 0.6;
}

const PIECES: Record<number, Piece> = {
  // a cactus in a talavera pot
  1: (k, g, p) => {
    k.add(k.style.cylinder(0.17, 0.3), k.mat('#f3efe4'), g, p.x, 0.15, p.z);
    k.add(k.style.capsule(0.1, 0.35), k.mat(SAGUARO), g, p.x, 0.55, p.z);
    k.add(k.style.capsule(0.06, 0.12), k.mat(SAGUARO), g, p.x + 0.12, 0.55, p.z);
  },
  // pan dulce on the table, the first agave
  2: (k, g, p, b) => {
    panDulce(k, g, p.x, p.z);
    const t = treeSpots(b.o)[0];
    if (t) tree(k, g, t.x, t.z, 0.8 + b.grow.garden * 0.06);
  },
  // two equipales: lounge() puts them in stage 3's group
  3: () => undefined,
  // a slate painted by hand: a dark board in a painted frame
  4: (k, g, p) => {
    const z = 0.04 + k.style.pictureZ;
    k.add(k.style.box(1.7, 0.95, 0.05), k.mat('#e9c46a'), g, p.x, 1.05, z);
    k.add(k.style.box(1.55, 0.8, 0.02), k.mat('#2b3a2f'), g, p.x, 1.05, z + 0.03);
    const r = rng(hash('pizarra'));
    for (let i = 0; i < 4; i++) k.add(k.style.box(0.4 + r() * 0.6, 0.04, 0.01), k.mat('#fffaf0'), g, p.x - 0.3 + r() * 0.2, 1.3 - i * 0.16, z + 0.05);
  },
  // a mural in bold colours over the nap place, a guitar against the wall
  5: (k, g, p, b) => {
    const z = 0.02 + k.style.pictureZ;
    const cs = ['#2a9d8f', MARIGOLD, '#7b5fc0', '#e9c46a', TALAVERA];
    // the panels a hair apart and the sun a step out: touching, they shared planes and z-fought (walls.test.ts)
    cs.forEach((c, i) => k.add(k.style.box(0.94, 0.5 + (i % 2) * 0.2, 0.02), k.mat(c), g, p.x - 1.9 + i * 0.95, 1.15, z));
    const sun = k.add(k.style.cylinder(0.25, 0.02), k.mat('#e9c46a'), g, p.x, 1.3, z + 0.025);
    sun.rotation.x = Math.PI / 2;
    const gx = pastNap(b.o);
    const body = k.add(k.style.ball(0.2), k.mat('#c98a3e'), g, gx, 0.3, 0.25);
    body.scale.set(1, 1.2, 0.4);
    const neck = k.add(k.style.box(0.07, 0.6, 0.04), k.mat('#6b4a32'), g, gx, 0.75, 0.22);
    neck.rotation.x = -0.15;
  },
  // café de olla in its clay pot; marigolds along the walls
  6: (k, g, p, b) => {
    k.add(k.style.cylinder(0.16, 0.24), k.mat('#a8764a'), g, p.x + 1.2, 0.68, p.z + 0.15);
    k.add(k.style.cylinder(0.05, 0.03), k.mat('#6b4a32'), g, p.x + 1.2, 0.82, p.z + 0.15);
    const r = rng(hash(`cempasuchil${b.o.W}`));
    for (let i = 0; i < 12; i++) k.add(k.style.ball(0.09), k.mat(i % 3 ? MARIGOLD : '#e9c46a'), g, b.o.x0 - 0.3 - r() * 0.5, 0.08, r() * b.o.D);
  },
  // a palapa: a palm-thatched roof on four posts by the terrace
  7: (k, g, p) => {
    for (const [dx, dz] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]] as const) k.add(k.style.cylinder(0.05, 1.7), k.mat('#8a5a3c'), g, p.x + dx, 0.85, p.z + dz);
    cone(k, g, 1.25, 0.7, '#d9b86a', p.x, 2.0, p.z);
  },
  // jacarandas all round (the hammocks: lounge(), in stage 8's group)
  8: (k, g, _p, b) => {
    for (const t of treeSpots(b.o).slice(1)) tree(k, g, t.x, t.z, 0.8 + b.grow.garden * 0.06);
  },
  // a lotería table: its cards in rows
  9: (k, g, p) => {
    gameTable(k, g, p, '#8a5a3c', '#fffaf0');
    for (let i = 0; i < 9; i++) k.add(k.style.box(0.18, 0.01, 0.22), k.mat(PICADO[i % PICADO.length] ?? MARIGOLD), g, p.x - 0.25 + (i % 3) * 0.25, 0.39, p.z - 0.27 + Math.floor(i / 3) * 0.27);
  },
  // a talavera fountain: a blue and white basin, a spout
  10: (k, g, p) => {
    k.add(k.style.cylinder(0.75, 0.35), k.mat('#fffaf0'), g, p.x, 0.17, p.z);
    k.add(k.style.cylinder(0.77, 0.08), k.mat(TALAVERA), g, p.x, 0.3, p.z);
    k.add(k.style.cylinder(0.62, 0.04), k.style.material('#8fd3ff', { emissive: '#8fd3ff', ei: 0.15 }), g, p.x, 0.34, p.z);
    k.add(k.style.cylinder(0.12, 0.6), k.mat(TALAVERA), g, p.x, 0.6, p.z);
    k.add(k.style.ball(0.14), k.mat('#8fd3ff'), g, p.x, 0.95, p.z);
  },
  // a futbolito: its box, its rods, two teams
  11: (k, g, p) => {
    block(k, g, { x0: p.x - 0.6, x1: p.x + 0.6, z0: p.z - 0.35, z1: p.z + 0.35 }, 0.25, '#2a9d8f', 0.5);
    k.add(k.style.box(1.1, 0.02, 0.6), k.mat('#7cc26b'), g, p.x, 0.76, p.z);
    for (const dx of [-0.5, 0.5]) for (const dz of [-0.28, 0.28]) k.add(k.style.box(0.08, 0.5, 0.08), k.mat('#6b4a32'), g, p.x + dx, 0.25, p.z + dz);
    for (let i = 0; i < 4; i++) {
      const rod = k.add(k.style.cylinder(0.015, 0.9), k.mat(WORLD.metal), g, p.x - 0.36 + i * 0.24, 0.82, p.z);
      rod.rotation.x = Math.PI / 2;
      k.add(k.style.box(0.05, 0.12, 0.05), k.mat(i % 2 ? TALAVERA : MARIGOLD), g, p.x - 0.36 + i * 0.24, 0.8, p.z);
    }
  },
  // a cenote: turquoise water in a ring of rock
  12: (k, g, p) => {
    pond(k, g, p, '#2ec4b6', '#b39a72', 1.1);
    for (let i = 0; i < 5; i++) k.add(k.style.ball(0.2), k.mat('#b39a72'), g, p.x + Math.cos(i * 1.3) * 1.1, 0.08, p.z + Math.sin(i * 1.3) * 0.78);
  },
  // an alebrije balloon: stripes, a face
  13: (k, g, p) => {
    const bl = balloon(k, g, p, ['#7b5fc0', MARIGOLD, '#2a9d8f']);
    k.add(k.style.ball(0.12), k.mat('#e9c46a'), bl, 0, 0.1, 0.6);
    for (const s of [-1, 1]) cone(k, bl, 0.06, 0.25, '#2a9d8f', s * 0.25, 0.6, 0.3);
  },
  // a golden alebrije at main's mark
  14: (k, g, p) => {
    plinth(k, g, p, (gold, y) => {
      const body = k.add(k.style.ball(0.22), gold, g, p.x, y + 0.3, p.z);
      body.scale.set(1.5, 0.9, 0.8);
      k.add(k.style.ball(0.13), gold, g, p.x + 0.33, y + 0.5, p.z);
      for (const s of [-1, 1]) cone(k, g, 0.04, 0.18, gold, p.x + 0.36, y + 0.68, p.z + s * 0.06);
      for (const dx of [-0.2, 0.2]) k.add(k.style.box(0.06, 0.2, 0.06), gold, g, p.x + dx, y + 0.1, p.z);
      const tail = cone(k, g, 0.05, 0.35, gold, p.x - 0.42, y + 0.45, p.z);
      tail.rotation.z = 0.8;
    });
  },
};

/** a frame of cut tin (hojalata), its picture in a bright colour; a golden retablo from 500 */
function frame(k: Kit, parent: Object3D, x: number, y: number, z: number, i: number, golden: boolean): void {
  k.add(k.style.box(0.28, 0.24, 0.02), k.mat(golden ? WORLD.gold : WORLD.metal), parent, x, y, z);
  k.add(k.style.box(0.2, 0.16, 0.01), k.mat(PICADO[i % PICADO.length] ?? MARIGOLD), parent, x, y, z + 0.015);
  if (golden) k.add(k.style.box(0.08, 0.06, 0.02), k.mat(WORLD.gold), parent, x, y + 0.15, z);
}

function growth(b: Build): void {
  terrace(b, k(b).pal.terrace, [TALAVERA, '#fffaf0', MARIGOLD]);
  grow(b, PIECES, pieceAt);
  const o = b.o;
  const bx = pieceSpots(o)[4]?.x ?? o.x0 + o.W / 2;
  frames(b, { xa: bx + 1.1, xb: o.mainDesk.x - 0.6, y: 1.45 }, frame);
}

const k = (b: Build): Kit => b.k;
const pieceAt = (o: Parameters<MapLook['pieceAt']>[0], stage: number): Pt => pieceSpots(o)[Math.min(stage, 14)] ?? o.door;

/** a striped sarape over one shoulder */
function wear(w: Wear): void {
  const g = new Group();
  g.position.set(0, 0.55, 0);
  g.rotation.z = 0.7;
  w.body.add(g);
  [MARIGOLD, TALAVERA, '#e9c46a', '#2a9d8f'].forEach((c, i) => {
    w.add(new TorusGeometry(0.235, 0.02, 6, 20), w.mat(c), g, 0, 0, -0.03 + i * 0.03).scale.set(1, 1.15, 0.8);
  });
}

export const patio: MapLook = {
  id: 'patio',
  // its cozy pieces (render/cozy.ts; page bims-cozy v2 « la base, carte par carte »)
  cozy: { plant: 'cactus', small: 'geranium', coffee: 'olla', bed: 'hammock', shelf: 'pottery', poster: 'papel', wood: '#a0673f', cloth: ['#2a9d8f', '#e9c46a', '#7b5fc0'], art: ['#2a9d8f', '#e9c46a', '#7b5fc0'], pot: '#c98a3e', rug: '#2a9d8f' },
  pal,
  shell,
  island,
  lounge,
  // a small agave on the desk top's back left corner (the lamp's on the right): drawn at the floor
  // it stood inside the desk, its leaves through the top (Gabriel, bims-clip; render/clip.test.ts)
  desk: (b, d, name) => deskOf(b, d, name, { thing: (kk, g, h) => { if (h % 3 === 0) agavePot(kk, onTop(g, -0.47, 0.7, 0.3), 0, 0); } }),
  mainDesk: (b) => mainDeskOf(b, '#c98a5a', '#6b4a32'),
  tree: ({ k: kk }, parent, x, z, size) => {
    tree(kk, parent, x, z, size);
  },
  growth,
  pieceAt,
  wear,
};


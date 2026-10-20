// The tropical house's look (Brazil, modernist; render/maps/look.ts; its plan: maps/tropical.ts):
// polished concrete, a cobogó wall at the back (blocks pierced with circles), azulejos on the side
// wall, a thin flat roof on slim pilotis over the hammocks, the Copacabana wave along the front,
// monsteras in pots along each S of desks, the juice bar on the right; hammocks to nap; banana
// trees and palms; bright sneakers on every bim. Its growth (page bims-maps, Brésil · la maison
// moderniste): a monstera, açaí bowls and the first banana tree, two hammocks, a board on the
// cobogó, an azulejo mural and a cavaquinho, tropical fruit and heliconias, a straw parasol and a
// coconut kiosk, palms and hammocks, a pelada pitch, a pool with wavy edges, the batucada drums,
// giant water lilies, a pipa, a golden cup; bossa nova record sleeves, a gold record at 500.
// Owner: maps-c.
import { Group, type Object3D } from 'three';
import type { Pt } from '../../model';
import type { TropicalOffice } from '../../maps/tropical';
import type { Kit } from '../kit';
import { hammock } from '../cozy';
import { DAY, NIGHT, WORLD, hash } from '../palette';
import type { Build, MapLook, Wear } from './look';
import {
  beds, block, cone, deskOf, floorOf, frames, grow, kite, mainDeskOf, nc, palOf, patterned,
  onTop, pieceSpots, plinth, pond, potted, terrace, treeSpots, type Piece, pastNap,
} from './yard';

const LEAF = '#2f7a4a';
const BANANA = '#5fa84a';
const AZUL = '#2f5fa7';
const SUN = '#e9c46a';
const GREEN = '#7cc26b';
const ACAI = '#5b3a7a';
const HAMMOCKS = [['#2a9d8f', SUN, '#fffaf0'], [AZUL, GREEN, '#fffaf0'], ['#f28c28', SUN, '#fffaf0']] as const;

const pal = (night: boolean) =>
  palOf(night ? NIGHT : DAY, {
    floor: nc('#d8d2c6', night, 0.55),
    wall: nc('#e8e4dc', night, 0.55),
    wallTop: nc('#b9b3a8', night),
    desk: nc('#8a5a3c', night, 0.95),
    deskTop: nc('#a0673f', night, 0.95),
    island: SUN,
    islandTop: nc('#fffaf0', night, 0.8),
    grass: nc('#7fbf5a', night),
    dirt: nc('#8a6a4a', night),
    terrace: nc('#f3efe4', night, 0.55),
    plant: LEAF,
  });

const office = (b: Build): TropicalOffice => b.o as TropicalOffice;

/** a monstera in a yellow pot: wide flat leaves */
function monstera(k: Kit, g: Object3D, x: number, z: number): void {
  k.add(k.style.cylinder(0.18, 0.32), k.mat(SUN), g, x, 0.16, z);
  for (let i = 0; i < 6; i++) {
    const l = k.add(k.style.ball(0.2), k.mat(LEAF), g, x + Math.sin(i) * 0.18, 0.5 + (i % 2) * 0.15, z + Math.cos(i) * 0.18);
    l.scale.set(1.2, 0.3, 0.9);
    l.rotation.y = i;
  }
}

function shell(b: Build): void {
  const { k, root } = b;
  const o = office(b);
  const { x0, W, D } = o;
  const night = k.pal.pendants;
  floorOf(k, root, o, patterned(k, k.pal.floor, W, D, 2.0, (g, px) => {
    g.fillStyle = nc('#cfc8bb', night, 0.55);
    g.fillRect(0, 0, px, 1);
    g.fillRect(0, 0, 1, px);
  }));
  // the Copacabana wave along the front edge
  const wave = patterned(k, nc('#f3efe4', night, 0.6), W, 1.0, 2.0, (g, px) => {
    g.fillStyle = '#5c677d';
    g.beginPath();
    g.moveTo(0, px);
    for (let x = 0; x <= px; x += 2) g.lineTo(x, px * 0.55 + Math.sin((x / px) * Math.PI * 2) * px * 0.2);
    g.lineTo(px, px);
    g.fill();
  });
  k.add(k.style.box(W, 0.02, 1.0), wave, root, x0 + W / 2, 0.03, D - 0.5);
  // the cobogó wall: concrete blocks pierced with circles
  k.add(k.style.box(W + 0.2, 1.7, 0.2), k.mat(k.pal.wall), root, x0 + W / 2, 0.85, -0.1);
  const cob = patterned(k, nc('#e8e4dc', night, 0.55), W, 1.6, 0.8, (g) => {
    g.fillStyle = nc('#6b8f71', night);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      g.beginPath();
      g.arc(16 + i * 32, 16 + j * 32, 11, 0, 7);
      g.fill();
    }
  });
  k.add(k.style.box(W, 1.6, 0.02), cob, root, x0 + W / 2, 0.85, 0.01);
  // azulejos on the left wall: blue and white tiles
  k.add(k.style.box(0.2, 1.0, D + 0.2), k.mat(k.pal.wall), root, x0 - 0.1, 0.5, D / 2);
  const az = patterned(k, '#f3f6fb', D, 1.0, 0.5, (g, px) => {
    g.strokeStyle = AZUL;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(px / 2, 6);
    g.lineTo(px - 6, px / 2);
    g.lineTo(px / 2, px - 6);
    g.lineTo(6, px / 2);
    g.closePath();
    g.stroke();
  });
  k.add(k.style.box(0.02, 0.9, D), az, root, x0 + 0.01, 0.5, D / 2);
  // the thin flat roof on slim pilotis over the hammocks (the lounge's corner)
  const lx = o.lounge.map((s) => s.x);
  if (lx.length) {
    const r0 = Math.min(...lx) - 0.7;
    const r1 = Math.max(...lx) + 0.7;
    for (const px of [r0, r1]) k.add(k.style.cylinder(0.05, 1.95), k.mat('#d8d2c6'), root, px, 0.97, 3.0);
    k.add(k.style.box(r1 - r0 + 0.2, 0.08, 3.1), k.mat(nc('#f3efe4', night, 0.7)), root, (r0 + r1) / 2, 1.97, 1.5);
  }
  // monsteras past each row's S, in front of the desks; a football by the door
  for (const path of o.paths) {
    for (let j = 1; j < path.length - 1; j += 3) {
      const p = path[j];
      if (p) monstera(k, root, p.x + 0.78, p.z + 2.05);
    }
  }
  k.add(k.style.ball(0.13), k.mat('#fffaf0'), root, o.door.x - 0.8, 0.13, D - 0.6);
}

/** the juice bar: fruit, a blender, açaí bowls, a pineapple */
function island(b: Build): void {
  const { k, root, o } = b;
  const I = o.island;
  const x = (I.x0 + I.x1) / 2;
  block(k, root, { x0: I.x0 + 0.05, x1: I.x1 - 0.05, z0: I.z0, z1: I.z1 }, 0.62, k.pal.island);
  block(k, root, { x0: I.x0 - 0.05, x1: I.x1 + 0.05, z0: I.z0 - 0.05, z1: I.z1 + 0.05 }, 0.07, k.pal.islandTop, 0.62);
  k.add(k.style.box(0.25, 0.12, 0.25), k.mat(WORLD.dark), root, x, 0.75, I.z0 + 0.5);
  k.add(k.style.cylinder(0.1, 0.3), k.style.material('#cfe8ee', { opacity: 0.7 }), root, x, 0.95, I.z0 + 0.5);
  for (const s of o.islandSpots) {
    k.add(k.style.cylinder(0.04, 0.6), k.mat(WORLD.metal), root, s.x, 0.3, s.z);
    k.add(k.style.cylinder(0.18, 0.06), k.mat(AZUL), root, s.x, 0.62, s.z);
  }
}

/**
 * the nap place under its roof: hammocks only, each between a post at its head and one past its
 * napper's toes (render/cozy.ts hammock, the cozy kit's two the same); hammock-chairs and hammocks
 * on posts through the nappers read as nothing (Gabriel, bims-clip; bims m_33943)
 */
function lounge(b: Build): void {
  const { k } = b;
  beds(b, (g, box, i) => {
    hammock(k, g, box, HAMMOCKS[i % 3] ?? HAMMOCKS[0], '#d8d2c6');
  });
}

/** banana trees and palms */
function tree(k: Kit, parent: Object3D, x: number, z: number, size: number): void {
  const g = new Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(size);
  parent.add(g);
  if (hash(`${x.toFixed(1)}${z.toFixed(1)}`) % 2) {
    k.add(k.style.cylinder(0.08, 1.7), k.mat('#a0673f'), g, 0, 0.85, 0);
    for (let i = 0; i < 6; i++) k.add(k.style.box(0.9, 0.04, 0.2), k.mat(BANANA), g, Math.cos(i) * 0.3, 1.65, Math.sin(i) * 0.3).rotation.y = i;
    return;
  }
  k.add(k.style.cylinder(0.1, 1.3), k.mat('#8a9a5a'), g, 0, 0.65, 0);
  for (let i = 0; i < 6; i++) {
    const l = k.add(k.style.box(0.25, 0.03, 1.0), k.mat(BANANA), g, Math.sin(i) * 0.35, 1.4, Math.cos(i) * 0.35);
    l.rotation.set(0.5 * Math.cos(i), i, 0.5 * Math.sin(i));
  }
}

const PIECES: Record<number, Piece> = {
  1: (k, g, p) => {
    monstera(k, g, p.x, p.z);
  },
  // açaí bowls on the bar, the first banana tree
  2: (k, g, p, b) => {
    for (let i = 0; i < 3; i++) {
      k.add(k.style.cylinder(0.09, 0.07), k.mat('#fffaf0'), g, p.x, 0.73, p.z - 0.5 + i * 0.35);
      k.add(k.style.ball(0.07), k.mat(ACAI), g, p.x, 0.77, p.z - 0.5 + i * 0.35).scale.y = 0.4;
    }
    const t = treeSpots(b.o)[0];
    if (t) tree(k, g, t.x, t.z, 0.8 + b.grow.garden * 0.06);
  },
  3: () => undefined,
  // a board hung on the cobogó
  4: (k, g, p) => {
    const z = 0.05 + k.style.pictureZ;
    k.add(k.style.box(1.7, 0.95, 0.05), k.mat('#c9c3b6'), g, p.x, 1.05, z);
    k.add(k.style.box(1.6, 0.85, 0.02), k.mat(WORLD.paper), g, p.x, 1.05, z + 0.03);
    for (let i = 0; i < 4; i++) k.add(k.style.box(0.5 + (i % 3) * 0.2, 0.04, 0.01), k.mat(WORLD.board[i] ?? WORLD.marker), g, p.x - 0.3, 1.3 - i * 0.16, z + 0.05);
  },
  // an azulejo mural over the hammocks, a cavaquinho on a stand
  5: (k, g, p, b) => {
    const z = 0.04 + k.style.pictureZ;
    for (let i = 0; i < 10; i++) for (let j = 0; j < 3; j++) k.add(k.style.box(0.34, 0.24, 0.02), k.mat((i + j) % 2 ? '#f3f6fb' : AZUL), g, p.x - 1.7 + i * 0.36, 0.95 + j * 0.26, z);
    const cx = pastNap(b.o);
    k.add(k.style.ball(0.12), k.mat('#c98a3e'), g, cx, 0.35, 0.3).scale.set(1, 1.2, 0.4);
    k.add(k.style.box(0.05, 0.4, 0.03), k.mat('#6b4a32'), g, cx, 0.62, 0.3);
  },
  // tropical fruit on the bar, heliconias along the side
  6: (k, g, p, b) => {
    for (let i = 0; i < 6; i++) k.add(k.style.ball(0.08), k.mat(['#f28c28', SUN, GREEN][i % 3] ?? SUN), g, p.x - 0.15 + (i % 3) * 0.15, 0.76 + Math.floor(i / 3) * 0.08, p.z + 1.6);
    for (let i = 0; i < 6; i++) {
      const hx = b.o.x0 - 0.4;
      const hz = 2 + i * (b.o.D / 6);
      k.add(k.style.cylinder(0.03, 0.7), k.mat(BANANA), g, hx, 0.35, hz);
      for (let j = 0; j < 3; j++) cone(k, g, 0.06, 0.18, j % 2 ? SUN : '#f28c28', hx + 0.05, 0.55 + j * 0.12, hz).rotation.z = 1.2;
    }
  },
  // a big straw parasol and a coconut kiosk
  7: (k, g, p) => {
    k.add(k.style.cylinder(0.04, 1.8), k.mat('#8a5a3c'), g, p.x, 0.9, p.z);
    cone(k, g, 1.0, 0.45, '#d9b86a', p.x, 1.9, p.z);
    block(k, g, { x0: p.x + 0.9, x1: p.x + 1.6, z0: p.z - 0.3, z1: p.z + 0.3 }, 0.8, '#d9b86a');
    for (let i = 0; i < 4; i++) k.add(k.style.ball(0.1), k.mat(GREEN), g, p.x + 1.05 + (i % 2) * 0.3, 0.9, p.z - 0.12 + Math.floor(i / 2) * 0.24);
  },
  // palms and banana trees all round (the hammocks: lounge(), in stage 8's group)
  8: (k, g, _p, b) => {
    for (const t of treeSpots(b.o).slice(1)) tree(k, g, t.x, t.z, 0.8 + b.grow.garden * 0.06);
  },
  // a small pitch for the pelada: grass, white lines, two goals, a ball
  9: (k, g, p) => {
    k.add(k.style.box(2.2, 0.02, 1.3), k.mat('#5fb35a'), g, p.x, 0.02, p.z);
    k.add(k.style.box(0.03, 0.01, 1.2), k.mat('#fffaf0'), g, p.x, 0.04, p.z);
    for (const s of [-1, 1]) {
      for (const dz of [-0.3, 0.3]) k.add(k.style.box(0.04, 0.4, 0.04), k.mat('#fffaf0'), g, p.x + s * 1.05, 0.2, p.z + dz);
      k.add(k.style.box(0.04, 0.04, 0.64), k.mat('#fffaf0'), g, p.x + s * 1.05, 0.4, p.z);
    }
    k.add(k.style.ball(0.09), k.mat('#fffaf0'), g, p.x + 0.3, 0.09, p.z + 0.2);
  },
  // a pool with wavy edges (Burle Marx)
  10: (k, g, p) => {
    for (let i = 0; i < 3; i++) {
      const w = k.add(k.style.cylinder(0.55, 0.04), k.style.material('#6cb4ee', { emissive: '#6cb4ee', ei: 0.1 }), g, p.x + Math.sin(i * 2.1) * 0.35, 0.02, p.z - 0.5 + i * 0.5);
      w.scale.x = 1.2;
    }
  },
  // the batucada corner: a surdo, a pandeiro, a snare
  11: (k, g, p) => {
    k.add(k.style.cylinder(0.25, 0.45), k.mat('#c9ccd3'), g, p.x, 0.23, p.z);
    k.add(k.style.cylinder(0.26, 0.03), k.mat('#fffaf0'), g, p.x, 0.47, p.z);
    k.add(k.style.cylinder(0.16, 0.25), k.mat(AZUL), g, p.x + 0.5, 0.13, p.z + 0.2);
    k.add(k.style.cylinder(0.14, 0.04), k.mat(SUN), g, p.x - 0.45, 0.3, p.z + 0.25).rotation.x = 1.2;
  },
  // giant water lilies on a pond
  12: (k, g, p) => {
    pond(k, g, p, '#5aa9a0', '#cfc8bb');
    for (let i = 0; i < 4; i++) k.add(k.style.cylinder(0.3, 0.02), k.mat(BANANA), g, p.x - 0.5 + i * 0.35, 0.05, p.z + Math.sin(i * 2) * 0.25);
  },
  // a pipa (kite) on the wind
  13: (k, g, p) => {
    kite(k, g, p, '#f28c28', AZUL, 2.8);
  },
  // a golden cup at main's mark
  14: (k, g, p) => {
    plinth(k, g, p, (gold, y) => {
      k.add(k.style.cylinder(0.12, 0.1), gold, g, p.x, y + 0.05, p.z);
      k.add(k.style.cylinder(0.04, 0.3), gold, g, p.x, y + 0.25, p.z);
      k.add(k.style.cap(0.22, 0.5), gold, g, p.x, y + 0.42, p.z).rotation.x = Math.PI;
      for (const s of [-1, 1]) k.add(k.style.box(0.05, 0.2, 0.05), gold, g, p.x + s * 0.25, y + 0.55, p.z);
    });
  },
};

/** a bossa nova record sleeve: a square in a colour, a disc peeking out; a gold record from 500 */
function frame(k: Kit, parent: Object3D, x: number, y: number, z: number, i: number, golden: boolean): void {
  k.add(k.style.box(0.28, 0.28, 0.02), k.mat(golden ? WORLD.gold : ['#2a9d8f', SUN, AZUL, '#f28c28'][i % 4] ?? SUN), parent, x, y, z);
  const disc = k.add(k.style.cylinder(0.1, 0.01), k.mat(golden ? WORLD.gold : WORLD.dark), parent, x + 0.06, y, z + 0.015);
  disc.rotation.x = Math.PI / 2;
}

const pieceAt = (o: Parameters<MapLook['pieceAt']>[0], stage: number): Pt => pieceSpots(o)[Math.min(stage, 14)] ?? o.door;

function growth(b: Build): void {
  terrace(b, b.k.pal.terrace, ['#2a9d8f', SUN, '#fffaf0']);
  grow(b, PIECES, pieceAt);
  const bx = pieceSpots(b.o)[4]?.x ?? b.o.x0 + b.o.W / 2;
  const lx = Math.min(...b.o.lounge.map((s) => s.x));
  frames(b, { xa: bx + 1.1, xb: lx - 1.0, y: 1.45 }, frame);
}

/** bright sneakers with a sun-yellow sole */
function wear(w: Wear): void {
  for (const leg of w.legs) {
    w.add(w.style.box(0.15, 0.06, 0.24), w.mat(GREEN), leg, 0, -0.29, 0.04);
    w.add(w.style.box(0.16, 0.02, 0.25), w.mat(SUN), leg, 0, -0.32, 0.04);
  }
}

export const tropical: MapLook = {
  id: 'tropical',
  // its cozy pieces (render/cozy.ts; page bims-cozy v2 « la base, carte par carte »)
  cozy: { plant: 'palm', small: 'pothos', coffee: 'fruit', bed: 'hammock', shelf: 'radio', poster: 'carnival', wood: '#a0673f', cloth: ['#2a9d8f', '#ffd166', '#7cc26b'], art: ['#ffd166', '#2a9d8f', '#f28c28'], pot: '#c98a3e', rug: '#f28c28' },
  pal,
  shell,
  island,
  bedShape: 'sling',
  lounge,
  // a small potted plant on the desk top's back left corner: at the floor it stood inside the desk (bims-clip)
  desk: (b, d, name) => deskOf(b, d, name, { thing: (k, g, h) => { if (h % 4 === 1) potted(k, onTop(g, -0.47, 0.7, 0.33), 0, 0, SUN, LEAF, 0.2); } }),
  mainDesk: (b) => mainDeskOf(b, '#a0673f', '#6b4a32'),
  tree: ({ k }, parent, x, z, size) => {
    tree(k, parent, x, z, size);
  },
  growth,
  pieceAt,
  wear,
};

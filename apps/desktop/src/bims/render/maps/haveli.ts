// The haveli's look (India, Rajasthan; render/maps/look.ts; its plan: maps/haveli.ts): golden
// sandstone, a Jodhpur-blue side wall, two jharokhas with their jali on the back wall, scalloped
// arcades round the courtyard's slabs, the chai cart with its striped awning in the yard, a rangoli
// at the door drawn fresh each day; floor cushions then the jhoola to nap; banyans in the garden;
// a turban on every bim. Its growth (page bims-maps, Inde · la haveli): a tulsi, chai and the
// first neem, two cushions, a chalk slate, a fresco and a harmonium, a thali and marigold
// garlands, a chhatri, the full jhoola and the banyans, a carrom, a stepwell, a cricket net, a
// lotus pond, kites, a golden peacock; painted miniatures, a mirror wall at 500. Owner: maps-c.
import { Group, type Object3D, TorusGeometry } from 'three';
import type { Pt } from '../../model';
import type { HaveliOffice } from '../../maps/haveli';
import type { Kit } from '../kit';
import { DAY, NIGHT, WORLD, hash, rng } from '../palette';
import type { Build, MapLook, Wear } from './look';
import {
  beds, cone, deskOf, floorOf, frames, gameTable, glow, grow, kite, mainDeskOf, nc, palOf,
  patterned, pieceSpots, plinth, pond, potted, terrace, treeSpots, type Piece,
} from './yard';

const BLUE = '#3d6fb6';
const SAFFRON = '#f28c28';
const GOLD = '#e9c46a';
const TEAL = '#2a9d8f';
const CREAM = '#f1dcae';
const NEEM = '#4f8a3e';
const CUSHIONS = [SAFFRON, TEAL, '#7b5fc0', GOLD] as const;

const pal = (night: boolean) =>
  palOf(night ? NIGHT : DAY, {
    floor: nc('#efd19c', night, 0.62),
    wall: nc('#d9a64e', night),
    wallTop: nc('#c48f3a', night),
    desk: nc('#8a5a3c', night, 0.95),
    deskTop: nc('#a0673f', night, 0.95),
    island: TEAL,
    islandTop: GOLD,
    grass: nc('#d8bf86', night),
    dirt: nc('#a8764a', night),
    terrace: nc('#e6c9a0', night),
    plant: NEEM,
  });

const office = (b: Build): HaveliOffice => b.o as HaveliOffice;

/** a scalloped arch between two columns: three bumps, the middle one higher */
function arch(k: Kit, parent: Object3D, a: Pt, b: Pt, color: string): void {
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const g = new Group();
  g.position.set((a.x + b.x) / 2, 1.3, (a.z + b.z) / 2);
  g.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
  parent.add(g);
  const r = len / 6;
  for (let i = -1; i <= 1; i++) k.add(new TorusGeometry(r, 0.06, 6, 12, Math.PI), k.mat(color), g, i * 2 * r, i === 0 ? 0.12 : 0, 0);
  k.add(k.style.box(len, 0.08, 0.14), k.mat(color), g, 0, 0.32, 0);
}

function shell(b: Build): void {
  const { k, root } = b;
  const o = office(b);
  const { x0, W, D, yard } = o;
  const night = k.pal.pendants;
  floorOf(k, root, o, patterned(k, k.pal.floor, W, D, 1.0, (g, px) => {
    g.strokeStyle = nc('#d9b97c', night, 0.62);
    g.lineWidth = 2;
    g.strokeRect(1, 1, px - 2, px - 2);
  }));
  // the courtyard's slabs
  const slab = patterned(k, nc('#e8cf9f', night, 0.62), yard.x1 - yard.x0, yard.z1 - yard.z0, 1.2, (g, px) => {
    g.strokeStyle = nc('#c9a66c', night, 0.62);
    g.lineWidth = 2;
    g.strokeRect(1, 1, px - 2, px - 2);
    g.strokeRect(px / 2, 1, px / 2 - 1, px / 2);
  });
  k.add(k.style.box(yard.x1 - yard.x0, 0.02, yard.z1 - yard.z0), slab, root, (yard.x0 + yard.x1) / 2, 0.03, (yard.z0 + yard.z1) / 2);
  // golden sandstone at the back, Jodhpur blue on the left
  k.add(k.style.box(W + 0.2, 1.8, 0.22), k.mat(k.pal.wall), root, x0 + W / 2, 0.9, -0.11);
  k.add(k.style.box(0.22, 1.1, D + 0.2), k.mat(nc(BLUE, night)), root, x0 - 0.11, 0.55, D / 2);
  // two jharokhas: a closed balcony, its jali lit at night, a little dome
  for (const jx of [x0 + W * 0.45, x0 + W * 0.66]) {
    k.add(k.style.box(1.0, 0.7, 0.4), k.mat(nc('#e0b25c', night)), root, jx, 1.5, 0.2);
    k.add(k.style.box(0.7, 0.5, 0.02), glow(k, '#c48f3a', 0.6), root, jx, 1.5, 0.41);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) k.add(k.style.ball(0.05), k.mat('#5c3d2e'), root, jx - 0.2 + i * 0.2, 1.4 + j * 0.2, 0.42);
    k.add(k.style.box(1.1, 0.08, 0.5), k.mat(k.pal.wallTop), root, jx, 1.88, 0.2);
    k.add(k.style.cap(0.28, 0.5), k.mat(nc(CREAM, night)), root, jx, 1.92, 0.2);
  }
  // the arcades: slim columns, scalloped arches between neighbours on each side
  const col = nc(CREAM, night);
  for (const c of o.columns) k.add(k.style.cylinder(0.09, 1.3), k.mat(col), root, c.x, 0.65, c.z);
  const left = o.columns.filter((c) => c.x < x0 + 2.3).sort((p, q) => p.z - q.z);
  const right = o.columns.filter((c) => c.x > x0 + W - 2.3).sort((p, q) => p.z - q.z);
  const back = o.columns.filter((c) => Math.abs(c.z - 6.0) < 1e-6).sort((p, q) => p.x - q.x);
  for (const line of [left, right, back]) for (let i = 1; i < line.length; i++) arch(k, root, line[i - 1] as Pt, line[i] as Pt, col);
  // the rangoli at the door, its colours following the day
  const day = new Date().getDate();
  const cs = [[SAFFRON, GOLD, TEAL], [BLUE, GOLD, '#7cc26b'], ['#7b5fc0', SAFFRON, '#fffaf0']][day % 3] ?? [SAFFRON, GOLD, TEAL];
  cs.forEach((c, r) => {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      k.add(k.style.box(0.14 - r * 0.02, 0.01, 0.07), k.mat(c), root, o.door.x + Math.cos(a) * (0.42 - r * 0.13), 0.04 + r * 0.002, D - 0.75 + Math.sin(a) * (0.42 - r * 0.13)).rotation.y = -a;
    }
  });
  k.add(k.style.cylinder(0.08, 0.01), k.mat('#fffaf0'), root, o.door.x, 0.045, D - 0.75);
}

/** the chai cart: a kettle on a burner, kulhad cups, its wheels, a striped awning */
function island(b: Build): void {
  const { k, root, o } = b;
  const cx = (o.island.x0 + o.island.x1) / 2;
  const cz = (o.island.z0 + o.island.z1) / 2;
  k.add(k.style.box(1.7, 0.6, 0.8), k.mat(TEAL), root, cx, 0.42, cz);
  k.add(k.style.box(1.8, 0.06, 0.9), k.mat(GOLD), root, cx, 0.75, cz);
  for (const wx of [-0.6, 0.6]) k.add(k.style.cylinder(0.2, 0.06), k.mat(WORLD.dark), root, cx + wx, 0.2, cz + 0.42).rotation.x = Math.PI / 2;
  k.add(k.style.cylinder(0.13, 0.04), glow(k, SAFFRON, 1.4), root, cx - 0.4, 0.8, cz);
  k.add(k.style.cylinder(0.12, 0.2), k.mat('#b08a3c'), root, cx - 0.4, 0.92, cz);
  for (let i = 0; i < 5; i++) k.add(k.style.cylinder(0.04, 0.08), k.mat('#a8764a'), root, cx + 0.15 + i * 0.13, 0.82, cz + 0.15);
  for (const ox of [-0.8, 0.8]) k.add(k.style.cylinder(0.03, 1.1), k.mat('#6b4a32'), root, cx + ox, 1.3, cz - 0.35);
  for (let i = 0; i < 6; i++) k.add(k.style.box(0.3, 0.03, 0.9), k.mat(i % 2 ? '#fffaf0' : SAFFRON), root, cx - 0.75 + i * 0.3, 1.86, cz + 0.05).rotation.x = 0.25;
}

/** floor cushions on a durrie; the jhoola, a swing bench on chains, when the lounge is full */
function lounge(b: Build): void {
  const { k, o } = b;
  const xs = o.lounge.map((s) => s.x);
  const s3 = b.stage(3);
  if (s3 && xs.length) {
    const x0 = Math.min(...xs) - 0.5;
    const x1 = Math.max(...xs) + 0.5;
    for (let i = 0; i < 8; i++) k.add(k.style.box(x1 - x0, 0.02, 0.3), k.mat([BLUE, GOLD, TEAL, CREAM][i % 4] ?? GOLD), s3, (x0 + x1) / 2, 0.035, 0.6 + i * 0.3);
  }
  beds(b, (g, box, i) => {
    k.add(k.style.box(0.58, 0.16, 0.58), k.mat(CUSHIONS[i % 4] ?? SAFFRON), g, (box.x0 + box.x1) / 2, 0.1, (box.z0 + box.z1) / 2);
  });
  // the jhoola along the lounge's side wall, between its two rows, its back to the wall: on the
  // back wall it hung where the first row's nappers lay their heads (Gabriel, bims-life)
  const s8 = b.stage(8);
  const lz = o.lounge.map((s) => s.z);
  if (s8 && xs.length) {
    const side = Math.min(...xs) - o.x0 < o.x0 + o.W - Math.max(...xs) ? 1 : -1;
    const wx = side === 1 ? o.x0 : o.x0 + o.W;
    const sz = (Math.min(...lz) + Math.max(...lz)) / 2;
    const at = (d: number): number => wx + side * d;
    for (const oz of [-1.2, 1.2]) k.add(k.style.cylinder(0.07, 1.6), k.mat('#6b4a32'), s8, at(0.3), 0.8, sz + oz);
    k.add(k.style.box(0.1, 0.1, 2.6), k.mat('#6b4a32'), s8, at(0.3), 1.6, sz);
    for (const oz of [-0.7, 0.7]) k.add(k.style.cylinder(0.012, 1.0), k.mat('#b08a3c'), s8, at(0.3), 1.1, sz + oz);
    k.add(k.style.box(0.45, 0.08, 1.6), k.mat('#8a5a3c'), s8, at(0.3), 0.6, sz);
    k.add(k.style.box(0.06, 0.35, 1.6), k.mat('#8a5a3c'), s8, at(0.11), 0.8, sz);
  }
}

/** a banyan: a wide crown, roots falling from its branches (more the more days) */
function tree(k: Kit, parent: Object3D, x: number, z: number, size: number): void {
  const g = new Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(size);
  parent.add(g);
  k.add(k.style.cylinder(0.17, 1.1), k.mat('#7a6a58'), g, 0, 0.55, 0);
  k.add(k.style.ball(0.6), k.mat(NEEM), g, 0, 1.35, 0).scale.set(1.3, 0.6, 1.1);
  const roots = 2 + (hash(`${x.toFixed(1)}${z.toFixed(1)}`) % 3);
  for (let i = 0; i < roots; i++) k.add(k.style.cylinder(0.025, 1.2), k.mat('#8a7a68'), g, Math.cos(i * 2.1) * 0.6, 0.6, Math.sin(i * 2.1) * 0.45);
}

const PIECES: Record<number, Piece> = {
  // a tulsi in its square planter
  1: (k, g, p) => {
    k.add(k.style.box(0.42, 0.42, 0.42), k.mat(CREAM), g, p.x, 0.21, p.z);
    k.add(k.style.box(0.46, 0.05, 0.46), k.mat(SAFFRON), g, p.x, 0.43, p.z);
    potted(k, g, p.x, p.z, CREAM, NEEM, 0.25);
  },
  // chai glasses on the cart, the first neem
  2: (k, g, p, b) => {
    for (let i = 0; i < 4; i++) k.add(k.style.cylinder(0.035, 0.09), k.style.material('#e9d7b0', { opacity: 0.85 }), g, p.x - 0.65 + i * 0.12, 0.83, p.z - 0.22);
    const t = treeSpots(b.o)[0];
    if (t) tree(k, g, t.x, t.z, 0.8 + b.grow.garden * 0.06);
  },
  3: () => undefined,
  // a chalk slate in a carved frame
  4: (k, g, p) => {
    const z = 0.04 + k.style.pictureZ;
    k.add(k.style.box(1.7, 0.95, 0.05), k.mat('#8a5a3c'), g, p.x, 1.05, z);
    k.add(k.style.box(1.55, 0.8, 0.02), k.mat('#2b3a2f'), g, p.x, 1.05, z + 0.03);
    const r = rng(hash('slate'));
    for (let i = 0; i < 4; i++) k.add(k.style.box(0.4 + r() * 0.6, 0.04, 0.01), k.mat('#fffaf0'), g, p.x - 0.3 + r() * 0.2, 1.3 - i * 0.16, z + 0.05);
  },
  // a fresco on the back wall (an elephant, flowers), a harmonium on the floor
  5: (k, g, p) => {
    const z = 0.02 + k.style.pictureZ;
    k.add(k.style.box(3.6, 0.8, 0.02), k.mat('#f3e2b8'), g, p.x, 1.2, z);
    const el = k.add(k.style.ball(0.22), k.mat('#9a958c'), g, p.x - 0.6, 1.15, z + 0.02);
    el.scale.set(1.4, 0.9, 0.1);
    k.add(k.style.ball(0.12), k.mat('#9a958c'), g, p.x - 0.25, 1.28, z + 0.02).scale.z = 0.1;
    for (let i = 0; i < 6; i++) k.add(k.style.ball(0.07), k.mat(i % 2 ? SAFFRON : TEAL), g, p.x + 0.3 + i * 0.22, 1.1 + (i % 2) * 0.15, z + 0.02).scale.z = 0.2;
    const hx = p.x + 2.4;
    k.add(k.style.box(0.55, 0.22, 0.3), k.mat('#8a5a3c'), g, hx, 0.11, 0.3);
    for (let i = 0; i < 6; i++) k.add(k.style.box(0.07, 0.02, 0.1), k.mat(i % 2 ? WORLD.ink : '#fffaf0'), g, hx - 0.2 + i * 0.08, 0.23, 0.38);
  },
  // a thali on the cart, marigold garlands on the arcade
  6: (k, g, p, b) => {
    k.add(k.style.cylinder(0.22, 0.03), k.mat('#c9ccd3'), g, p.x + 0.45, 0.8, p.z - 0.15);
    for (let i = 0; i < 5; i++) k.add(k.style.cylinder(0.05, 0.04), k.mat([GOLD, '#7cc26b', SAFFRON, '#fffaf0', '#a8764a'][i] ?? GOLD), g, p.x + 0.45 + Math.cos(i * 1.25) * 0.13, 0.83, p.z - 0.15 + Math.sin(i * 1.25) * 0.13);
    const o = b.o as HaveliOffice;
    const back = o.columns.filter((c) => Math.abs(c.z - 6.0) < 1e-6);
    const xs = back.map((c) => c.x);
    if (xs.length > 1) for (let x = Math.min(...xs); x < Math.max(...xs); x += 0.16) k.add(k.style.ball(0.05), k.mat(Math.round(x * 6) % 3 ? SAFFRON : GOLD), g, x, 1.5 - Math.abs(Math.sin((x - (xs[0] ?? 0)) * 1.85)) * 0.2, 6.0);
  },
  // a chhatri: a little domed pavilion on four columns
  7: (k, g, p) => {
    for (const [ox, oz] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]] as const) k.add(k.style.cylinder(0.06, 1.1), k.mat(CREAM), g, p.x + ox, 0.55, p.z + oz);
    k.add(k.style.box(1.15, 0.1, 1.15), k.mat('#c48f3a'), g, p.x, 1.12, p.z);
    k.add(k.style.cap(0.48, 0.5), k.mat(CREAM), g, p.x, 1.17, p.z);
    cone(k, g, 0.06, 0.25, GOLD, p.x, 1.75, p.z);
  },
  // banyans all round (the jhoola: lounge(), in stage 8's group)
  8: (k, g, _p, b) => {
    for (const t of treeSpots(b.o).slice(1)) tree(k, g, t.x, t.z, 0.8 + b.grow.garden * 0.06);
  },
  // a carrom board: its frame, its pockets, its coins
  9: (k, g, p) => {
    gameTable(k, g, p, '#8a5a3c', '#efd19c');
    for (const [dx, dz] of [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]] as const) k.add(k.style.cylinder(0.04, 0.01), k.mat(WORLD.ink), g, p.x + dx, 0.39, p.z + dz);
    for (let i = 0; i < 7; i++) k.add(k.style.cylinder(0.03, 0.02), k.mat(i % 2 ? WORLD.ink : '#fffaf0'), g, p.x + Math.cos(i) * 0.08, 0.4, p.z + Math.sin(i) * 0.08);
  },
  // a stepwell: a square pit, its steps going down
  10: (k, g, p) => {
    for (let i = 0; i < 4; i++) k.add(k.style.box(1.6 - i * 0.35, 0.06, 1.6 - i * 0.35), k.mat(i % 2 ? '#d9b97c' : '#c9a66c'), g, p.x, 0.05 - i * 0.04, p.z);
    k.add(k.style.box(0.5, 0.02, 0.5), k.style.material('#5aa9a0', { emissive: '#5aa9a0', ei: 0.1 }), g, p.x, -0.1, p.z);
  },
  // a cricket net: posts, a pale net, the stumps
  11: (k, g, p) => {
    for (const dx of [-0.8, 0.8]) for (const dz of [-0.4, 0.4]) k.add(k.style.cylinder(0.03, 1.2), k.mat('#8a7a68'), g, p.x + dx, 0.6, p.z + dz);
    k.add(k.style.box(1.6, 1.1, 0.8), k.style.material('#fffaf0', { opacity: 0.25 }), g, p.x, 0.6, p.z);
    for (let i = 0; i < 3; i++) k.add(k.style.cylinder(0.015, 0.4), k.mat('#e9d7b0'), g, p.x - 0.6, 0.2, p.z - 0.06 + i * 0.06);
  },
  // a lotus pond: water, pads, pale flowers
  12: (k, g, p) => {
    pond(k, g, p, '#5aa9a0', '#d9b97c');
    for (let i = 0; i < 5; i++) {
      k.add(k.style.cylinder(0.14, 0.01), k.mat('#4f8a3e'), g, p.x - 0.6 + i * 0.3, 0.05, p.z + Math.sin(i * 2) * 0.3);
      if (i % 2 === 0) k.add(k.style.ball(0.07), k.mat('#fffaf0'), g, p.x - 0.6 + i * 0.3, 0.1, p.z + Math.sin(i * 2) * 0.3);
    }
  },
  // kites in the sky
  13: (k, g, p) => {
    kite(k, g, p, SAFFRON, GOLD, 2.6);
    kite(k, g, { x: p.x - 1.2, z: p.z + 1.4 }, TEAL, '#fffaf0', 2.2);
    kite(k, g, { x: p.x - 0.4, z: p.z + 2.6 }, '#7b5fc0', GOLD, 2.9);
  },
  // a golden peacock at main's mark
  14: (k, g, p) => {
    plinth(k, g, p, (gold, y) => {
      k.add(k.style.ball(0.16), gold, g, p.x, y + 0.25, p.z).scale.set(1, 1.3, 0.9);
      k.add(k.style.capsule(0.05, 0.25), gold, g, p.x, y + 0.5, p.z + 0.05);
      k.add(k.style.ball(0.07), gold, g, p.x, y + 0.68, p.z + 0.08);
      for (let i = 0; i < 7; i++) {
        const f = k.add(k.style.box(0.08, 0.55, 0.02), gold, g, p.x + Math.sin((i - 3) * 0.3) * 0.25, y + 0.45, p.z - 0.2);
        f.rotation.z = (i - 3) * 0.3;
      }
    });
  },
};

/** a painted miniature in a thin gilt frame; a mirror mosaic (sheesh mahal) from 500 */
function frame(k: Kit, parent: Object3D, x: number, y: number, z: number, i: number, golden: boolean): void {
  k.add(k.style.box(0.26, 0.3, 0.02), k.mat(golden ? WORLD.gold : '#b08a3c'), parent, x, y, z);
  k.add(k.style.box(0.2, 0.24, 0.01), k.mat(golden ? '#d8e4ec' : [TEAL, '#7b5fc0', SAFFRON, BLUE][i % 4] ?? TEAL), parent, x, y, z + 0.015);
  if (golden) for (let j = 0; j < 3; j++) k.add(k.style.box(0.05, 0.05, 0.01), k.mat(WORLD.gold), parent, x - 0.06 + j * 0.06, y + (j % 2) * 0.06, z + 0.02);
}

const pieceAt = (o: Parameters<MapLook['pieceAt']>[0], stage: number): Pt => pieceSpots(o)[Math.min(stage, 14)] ?? o.door;

function growth(b: Build): void {
  terrace(b, b.k.pal.terrace, [SAFFRON, '#fffaf0', TEAL]);
  grow(b, PIECES, pieceAt);
  const bx = pieceSpots(b.o)[4]?.x ?? b.o.x0 + b.o.W / 2;
  frames(b, { xa: bx + 1.1, xb: b.o.x0 + b.o.W * 0.45 - 0.6, y: 1.0 }, frame);
}

/** a turban: a wrap round the head, its crown */
function wear(w: Wear): void {
  const c = [SAFFRON, GOLD, TEAL][hash(w.name) % 3] ?? SAFFRON;
  const t = w.add(new TorusGeometry(0.18, 0.08, 8, 18), w.mat(c), w.head, 0, 0.13, -0.01);
  t.rotation.x = Math.PI / 2;
  t.scale.set(1.05, 1.0, 1.2);
  w.add(w.style.ball(0.17), w.mat(c), w.head, 0, 0.19, -0.02).scale.y = 0.55;
}

export const haveli: MapLook = {
  id: 'haveli',
  // its cozy pieces (render/cozy.ts; page bims-cozy v2 « la base, carte par carte »)
  cozy: { plant: 'tulsi', small: 'tulsi', coffee: 'chai', bed: 'charpai', shelf: 'brasslamp', poster: 'tapestry', wood: '#8a5a3c', cloth: ['#e9c46a', '#2a9d8f', '#3d6fb6'], art: ['#3d6fb6', '#e9c46a', '#2a9d8f'], pot: '#c98a3e', rug: '#e9c46a' },
  pal,
  shell,
  island,
  lounge,
  desk: (b, d, name) => deskOf(b, d, name, { mat: CUSHIONS[hash(name) % 4] }),
  mainDesk: (b) => mainDeskOf(b, '#a0673f', '#6b4a32'),
  tree: ({ k }, parent, x, z, size) => {
    tree(k, parent, x, z, size);
  },
  growth,
  pieceAt,
  wear,
};

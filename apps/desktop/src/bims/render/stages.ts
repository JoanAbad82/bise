// What the project's growth adds to the room (three; growth.ts's table, page bims-office v14 "un
// bureau qui grandit"): each building stage's pieces in a group of their own (the unlock moment
// hides the new one until two bims bring it in, unlock.ts), the garden on the wider ground (flowers,
// the trees' size), the wall frames (one per 10 artifacts, golden from 500), and the cones and
// striped barrier where the next piece goes. Bean bags and deck chairs: the stage's count (a bim
// napping or done past them sits on the rug or the slab; the agents size the desks, the stage the
// decor). Built with world.ts's kit; nothing here decides.
// Owner: bims-grow.
import { Group, type Object3D } from 'three';
import type { Box, Office, Pt } from '../model';
import type { Grow } from '../growth';
import { type Decor, decorOf } from './decor';
import { type Kit, boxOf, glyph, onFloor } from './kit';
import { WORLD, hash, rng } from './palette';
import type { Build } from './maps/look';


const BEANS = [0, 0, 0, 2, 2, 4, 4, 4, 8] as const;
const CHAIRS = [0, 1, 1, 1, 2, 2, 2, 4, 4, 4, 8] as const;
const at = <T>(xs: readonly T[], i: number): T => xs[Math.min(i, xs.length - 1)] as T;

export function loftTree(k: Kit, parent: Object3D, x: number, z: number, size: number): void {
  const { style } = k;
  const g = new Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(size);
  parent.add(g);
  if (style.name === 'clay') {
    // clay: a trunk and three soft spheres (bims m_27814)
    k.add(style.cylinder(0.14, 1.3), k.mat(WORLD.trunk), g, 0, 0.65, 0);
    const balls: readonly [number, number, number, number][] = [[0, 1.75, 0, 0.62], [0.42, 1.45, 0.1, 0.45], [-0.38, 1.5, -0.1, 0.48]];
    balls.forEach(([dx, y, dz, r], i) => k.add(style.ball(r), k.mat(WORLD.leaf[i % 2] ?? WORLD.trunk), g, dx, y, dz));
    return;
  }
  k.add(style.box(0.36, 1.4, 0.36), k.mat(WORLD.trunk), g, 0, 0.7, 0);
  const leaves: readonly [number, number, number][] = [[0, 1.6, 0], [0.45, 1.5, 0], [-0.45, 1.5, 0], [0, 2.05, 0], [0, 1.6, 0.45]];
  leaves.forEach(([dx, y, dz], i) => k.add(style.box(0.75, 0.75, 0.75), k.mat(WORLD.leaf[i % 2] ?? WORLD.trunk), g, dx, y, dz));
}

function bigPlant(k: Kit, parent: Object3D, x: number, z: number): void {
  k.add(k.style.cylinder(0.2, 0.36), k.mat(WORLD.pot), parent, x, 0.18, z);
  for (let i = 0; i < 3; i++) {
    const l = k.add(k.style.ball(0.26 - i * 0.04), k.mat(i % 2 ? WORLD.leaf[0] : k.pal.plant), parent, x + (i - 1) * 0.12, 0.55 + i * 0.22, z + (i % 2) * 0.08);
    l.scale.y = 1.2;
  }
}

function pineapple(k: Kit, parent: Object3D, x: number, y: number, z: number): void {
  const b = k.add(k.style.ball(0.11), k.mat(WORLD.pineapple), parent, x, y + 0.1, z);
  b.scale.y = 1.45;
  k.add(k.style.box(0.08, 0.16, 0.08), k.mat(WORLD.pineLeaf), parent, x, y + 0.3, z);
}

function fruitBowl(k: Kit, parent: Object3D, x: number, z: number): void {
  k.add(k.style.box(0.5, 0.12, 0.5), k.mat(WORLD.paper), parent, x, 0.76, z);
  const fr = [WORLD.orange, WORLD.orange, WORLD.banana, WORLD.leaf[0]];
  fr.forEach((c, i) => k.add(k.style.ball(0.09), k.mat(c), parent, x + Math.cos(i * 1.7) * 0.13, 0.86, z + Math.sin(i * 1.7) * 0.12));
  pineapple(k, parent, x + 0.05, 0.84, z - 0.02);
}

/** the whiteboard: coloured strokes for the equations (no text) */
function whiteboard(k: Kit, parent: Object3D, x: number): void {
  const { style } = k;
  const pz = style.pictureZ;
  k.add(style.box(1.8, 0.95, 0.05), k.mat('#d8d2c6'), parent, x, 1.05, 0.02 + pz);
  k.add(style.box(1.7, 0.85, 0.02), k.mat(WORLD.paper), parent, x, 1.05, 0.05 + pz);
  const r = rng(hash('board'));
  for (let i = 0; i < 5; i++) {
    const w = 0.5 + r() * 0.7;
    const c = WORLD.board[i % WORLD.board.length] ?? WORLD.marker;
    k.add(style.box(w, 0.045, 0.01), k.mat(c), parent, x - 0.78 + w / 2 + (i % 2) * 0.08, 1.37 - i * 0.15, 0.065 + pz);
  }
  // a little rising chart in the corner
  const pts = [[0.45, 0.72], [0.55, 0.88], [0.65, 0.8], [0.75, 1.02]];
  for (const [px, py] of pts) k.add(style.box(0.06, 0.06, 0.01), k.mat(WORLD.mat), parent, x + (px ?? 0), py ?? 0, 0.065 + pz);
}

/** the mural over the lounge: colour blobs and an ink :* in blocks */
function mural(k: Kit, parent: Object3D, x0: number, x1: number): void {
  const { style } = k;
  const w = x1 - x0;
  WORLD.mural.forEach((c, i) => {
    const bw = w / 4;
    k.add(style.box(bw, 0.45 + (i % 2) * 0.12, 0.02), k.mat(c), parent, x0 + bw / 2 + (i * (w - bw)) / 4, 1.15 + (i % 2 ? -0.06 : 0.08), 0.01 + style.pictureZ);
  });
  glyph(k, parent, (x0 + x1) / 2, 1.18, 0.035 + style.pictureZ, k.pal.ink, 0.07);
}

/** the boombox on the island's far end (o3's notes, t1's friday party play over it) */
function boombox(k: Kit, parent: Object3D, z: number): void {
  k.add(k.style.box(0.55, 0.28, 0.2), k.mat(WORLD.dark), parent, 0, 0.84, z);
  for (const dx of [-0.15, 0.15]) k.add(k.style.box(0.14, 0.14, 0.02), k.mat(WORLD.wheel), parent, dx, 0.84, z + 0.11);
}

/** the lounge's x range on the back wall (its bean bags' spots) */
function loungeX(o: Office): { l0: number; l1: number } {
  const lx = o.lounge.map((s) => s.x);
  return lx.length ? { l0: Math.min(...lx) - 0.55, l1: Math.max(...lx) + 0.55 } : { l0: o.x0 + 0.1, l1: o.x0 + o.W * 0.4 };
}
const boardX = (o: Office): number => (o.boardSpots.length ? o.boardSpots.reduce((s, p) => s + p.x, 0) / o.boardSpots.length : o.x0 + o.W / 2);

/** where each stage's piece stands (its cones while it is built; the unlock walks there) */
export function pieceAt(o: Office, stage: number): Pt {
  const d = decorOf(o);
  const { l0, l1 } = loungeX(o);
  const x1 = o.x0 + o.W;
  const isl = o.island;
  const spots: readonly Pt[] = [
    o.door,
    d.plants[0] ?? o.door,
    { x: 0, z: isl.z0 + 1.3 },
    { x: (l0 + l1) / 2, z: 1.5 },
    { x: boardX(o), z: 0.9 },
    { x: (l0 + l1) / 2, z: 0.6 },
    { x: 0, z: isl.z1 - 0.8 },
    d.parasol,
    d.trees[1] ?? o.door,
    d.ramp,
    { x: o.x0 - 1.9, z: o.D * 0.55 },
    { x: l1 - 0.35, z: 0.3 },
    { x: o.x0 - 1.9, z: o.D + 2.2 },
    { x: x1 + 1.2, z: 1.2 },
    { x: o.x0 - 1.9, z: 1.4 },
  ];
  return spots[Math.min(stage, spots.length - 1)] ?? o.door;
}

/** the island's length at this stage: a small counter, a short island, then as long as the desk rows */
export function islandLen(o: Office, stage: number): number {
  const full = o.island.z1 - o.island.z0;
  if (stage < 2) return Math.min(full, 1.2);
  if (stage < 6) return Math.min(full, 3.5);
  return full;
}

/** The loft's nap place (its look's lounge): its rug from stage 3, a bean bag per stage count, in its stage's group. */
export function loftLounge(b: Build): void {
  const { k, o, grow: g } = b;
  const { style, pal } = k;
  const s = (n: number): Group | null => b.stage(n);
  const s0 = s(0);
  if (!s0) return;
  const boxes = o.furniture;
  // the lounge: its rug from stage 3, a bean bag per stage count, or per bim that may nap there
  const { l0, l1 } = loungeX(o);
  const lz = o.lounge.map((sp) => sp.z);
  const s3 = s(3);
  if (s3 && lz.length) k.add(style.box(l1 - l0, 0.02, Math.max(...lz) - Math.min(...lz) + 1.1), k.mat(pal.rug), s3, (l0 + l1) / 2, 0.035, (Math.min(...lz) + Math.max(...lz)) / 2);
  const isBean = (b: Box): boolean => b.of !== undefined && o.lounge.some((l) => l.x === b.of?.x && l.z === b.of.z);
  const beans = boxes.filter(isBean);
  const nBeans = at(BEANS, g.stage);
  beans.forEach((b, i) => {
    if (i >= nBeans) return;
    const st = i < 2 ? 3 : i < 4 ? 5 : 8;
    const bag = k.add(style.ball((b.x1 - b.x0) / 2 / 1.05 / 0.92), k.mat(WORLD.bean[i % WORLD.bean.length] ?? pal.rug), s(st) ?? s0, (b.x0 + b.x1) / 2, 0.2, (b.z0 + b.z1) / 2);
    bag.scale.set(1.05, 0.62, 1.05);
  });
}

/** The loft's growth (its look's growth): every piece the stages have reached, each in its stage's group. */
export function buildStages(b: Build): void {
  const { k, o, grow: g } = b;
  const { style, pal } = k;
  const boxes = o.furniture;
  const s = (n: number): Group | null => b.stage(n);
  const d: Decor = decorOf(o);
  const { x0, W, D } = o;
  const x1 = x0 + W;
  const isl = o.island;
  const s0 = s(0);
  if (!s0) return;

  // the terrace: grass in a new office; the first done bim makes it, with its first deck chair
  // (bims m_28178). Its deck chairs come with the stages
  const s1t = s(1);
  if (s1t) onFloor(k, s1t, boxOf(d.terrace), 0.08, 0, pal.terrace);
  const isChair = (b: Box): boolean => b.of !== undefined && o.terrace.some((t) => t.x === b.of?.x && t.z === b.of.z);
  const chairs = boxes.filter(isChair);
  const nChairs = at(CHAIRS, g.stage);
  chairs.forEach((b, i) => {
    if (i >= nChairs) return;
    const st = ([1, 4, 7, 7, 10, 10, 10, 10] as const)[i] ?? 0;
    deckChair(k, s(st) ?? s0, b, WORLD.chair[i % 2] ?? WORLD.paper);
  });

  // stage 1: a plant; 2: the island's fruit, a first tree; 4: the whiteboard, a 2nd plant
  const s1 = s(1);
  if (s1 && d.plants[0]) bigPlant(k, s1, d.plants[0].x, d.plants[0].z);
  const tSize = 0.75 + g.garden * 0.06;
  const s2 = s(2);
  if (s2) {
    fruitBowl(k, s2, 0, isl.z0 + 1.3);
    const t = d.trees[0];
    if (t) loftTree(k, s2, t.x, t.z, tSize);
  }
  const { l0, l1 } = loungeX(o);
  const s4 = s(4);
  if (s4) {
    whiteboard(k, s4, boardX(o));
    if (d.plants[1]) bigPlant(k, s4, d.plants[1].x, d.plants[1].z);
  }
  // 5: the mural and the boombox
  const s5 = s(5);
  if (s5) {
    mural(k, s5, l0 + 0.15, l1 - 0.15);
    boombox(k, s5, isl.z0 + islandLen(o, g.stage) - 0.6);
  }
  // 6: a 2nd fruit bowl on the longer island, flowers along the walls
  const s6 = s(6);
  if (s6) {
    if (isl.z1 - isl.z0 > 3) fruitBowl(k, s6, 0, isl.z0 + 2.9);
    const r = rng(hash(`flowers${W}`));
    for (let i = 0; i < 10; i++) {
      const fx = r() < 0.5 ? x0 - 0.35 - r() * 0.6 : x1 + 0.35 + r() * 0.6;
      k.add(style.box(0.16, 0.16, 0.16), k.mat(WORLD.flowers[i % 4] ?? WORLD.paper), s6, fx, 0.06, r() * (D + 3));
    }
  }
  // 7: the parasol and the palm
  const s7 = s(7);
  if (s7) {
    const p = d.parasol;
    k.add(style.cylinder(0.03, 1.8), k.mat(pal.ink), s7, p.x, 0.9, p.z);
    k.add(style.box(1.4, 0.3, 1.4), k.mat(WORLD.parasol), s7, p.x, 1.85, p.z);
    const pm = d.palm;
    k.add(style.box(0.16, 1.6, 0.16), k.mat(WORLD.palmTrunk), s7, pm.x, 0.8, pm.z);
    for (let i = 0; i < 4; i++) {
      const f = k.add(style.box(0.9, 0.04, 0.22), k.mat(WORLD.leaf[0]), s7, pm.x, 1.62, pm.z);
      f.rotation.y = (i * Math.PI) / 2 + 0.4;
    }
  }
  // 8: trees all round
  const s8 = s(8);
  if (s8) for (const t of d.trees.slice(1)) loftTree(k, s8, t.x, t.z, tSize);
  // 9: the skate ramp
  const s9 = s(9);
  if (s9) onFloor(k, s9, boxOf(d.ramp), 0.3, 0.15, WORLD.ramp);
  // 10: the fountain in the garden
  const s10 = s(10);
  if (s10) {
    const f = pieceAt(o, 10);
    k.add(style.cylinder(0.72, 0.25), k.mat('#d8d2c6'), s10, f.x, 0.12, f.z);
    k.add(style.cylinder(0.6, 0.05), style.material('#8fd3ff', { emissive: '#8fd3ff', ei: 0.15 }), s10, f.x, 0.26, f.z);
    k.add(style.cylinder(0.13, 0.6), k.mat('#d8d2c6'), s10, f.x, 0.5, f.z);
    k.add(style.ball(0.12), k.mat('#8fd3ff'), s10, f.x, 0.85, f.z);
  }
  // 11: an arcade cabinet at the lounge's end, its screen lit
  const s11 = s(11);
  if (s11) {
    const a = pieceAt(o, 11);
    k.add(style.box(0.55, 1.1, 0.45), k.mat(WORLD.ramp), s11, a.x, 0.55, a.z);
    k.add(style.box(0.45, 0.32, 0.03), style.material(WORLD.dark, { emissive: '#6cb4ee', ei: 0.5 }), s11, a.x, 0.82, a.z + 0.24);
    k.add(style.box(0.5, 0.06, 0.25), k.mat(WORLD.dark), s11, a.x, 0.6, a.z + 0.28);
  }
  // 12: a pond with a little dock
  const s12 = s(12);
  if (s12) {
    const p = pieceAt(o, 12);
    const pond = k.add(style.cylinder(1.0, 0.04), k.mat('#6cb4ee'), s12, p.x, 0.0, p.z);
    pond.scale.z = 0.7;
    k.add(style.box(0.9, 0.06, 0.35), k.mat('#c49a6c'), s12, p.x + 0.7, 0.06, p.z - 0.2);
    for (let i = 0; i < 3; i++) k.add(style.ball(0.1), k.mat(WORLD.leaf[0]), s12, p.x - 0.5 + i * 0.35, 0.04, p.z + 0.3 - i * 0.2);
  }
  // 13: a balloon with the mark, floating by the office
  const s13 = s(13);
  if (s13) {
    const b = pieceAt(o, 13);
    const by = 2.3;
    k.add(style.ball(0.6), k.mat(WORLD.parasol), s13, b.x, by, b.z);
    glyph(k, s13, b.x, by, b.z + 0.62, k.pal.ink, 0.05);
    k.add(style.box(0.35, 0.25, 0.35), k.mat('#c49a6c'), s13, b.x, by - 1.0, b.z);
    for (const dx of [-0.15, 0.15]) k.add(style.cylinder(0.01, 0.5), k.mat(WORLD.ink), s13, b.x + dx, by - 0.65, b.z);
  }
  // 14: main's golden statue on a plinth
  const s14 = s(14);
  if (s14) {
    const m = pieceAt(o, 14);
    const gold = style.material(WORLD.gold, { emissive: WORLD.gold, ei: 0.15 });
    k.add(style.box(0.7, 0.4, 0.7), k.mat('#d8d2c6'), s14, m.x, 0.2, m.z);
    k.add(style.capsule(0.22, 0.25), gold, s14, m.x, 0.85, m.z);
    k.add(style.ball(0.22), gold, s14, m.x, 1.32, m.z);
  }

  garden(k, s0, o, g);
  frames(k, s0, o, g);
  if (g.building && g.stage < 14) cones(k, s0, pieceAt(o, g.stage + 1));
}

/** the garden: more flowers on the grass the more days the project was used (the ground widens: camera.ts groundOf) */
function garden(k: Kit, parent: Object3D, o: Office, g: Grow): void {
  if (g.garden === 0) return;
  const r = rng(hash(`garden${o.W}`));
  const m = 0.9 + g.garden * 0.12;
  for (let i = 0; i < g.garden * 4; i++) {
    const left = r() < 0.5;
    const x = left ? o.x0 - 0.3 - r() * m : o.x0 + o.W + 0.3 + r() * m;
    k.add(k.style.box(0.14, 0.14, 0.14), k.mat(WORLD.flowers[i % 4] ?? WORLD.paper), parent, x, 0.06, -0.6 + r() * (o.D + 4.5));
  }
}

/** a frame on the back wall per 10 artifacts (the free span between the whiteboard and main's neon), golden from 500 */
function frames(k: Kit, parent: Object3D, o: Office, g: Grow): void {
  if (g.frames === 0) return;
  const { style } = k;
  const pitch = 0.36;
  const xa = boardX(o) + 1.1;
  const xb = o.mainDesk.x - 0.5;
  const cols = Math.max(1, Math.floor((xb - xa) / pitch));
  const border = k.mat(g.golden ? WORLD.gold : WORLD.crate);
  for (let i = 0; i < g.frames; i++) {
    const c = i % cols;
    const row = Math.floor(i / cols);
    const x = xa + pitch / 2 + c * pitch;
    const y = 1.45 - row * 0.32;
    if (y < 0.6) break;
    k.add(style.box(0.28, 0.22, 0.02), border, parent, x, y, 0.02 + style.pictureZ);
    k.add(style.box(0.22, 0.16, 0.01), k.mat(WORLD.mural[i % WORLD.mural.length] ?? WORLD.paper), parent, x, y, 0.035 + style.pictureZ);
  }
}

/** the next piece under construction: four cones and a striped barrier */
function cones(k: Kit, parent: Object3D, p: Pt): void {
  const { style } = k;
  for (const [dx, dz] of [[-0.5, -0.4], [0.5, -0.4], [-0.5, 0.4], [0.5, 0.4]] as const) {
    k.add(style.cylinder(0.08, 0.28), k.mat(WORLD.orange), parent, p.x + dx, 0.14, p.z + dz);
    k.add(style.cylinder(0.12, 0.03), k.mat(WORLD.orange), parent, p.x + dx, 0.015, p.z + dz);
  }
  for (let i = 0; i < 4; i++) k.add(style.box(0.26, 0.12, 0.05), k.mat(i % 2 ? WORLD.paper : WORLD.parasol), parent, p.x - 0.39 + i * 0.26, 0.32, p.z + 0.45);
  for (const dx of [-0.5, 0.5]) k.add(style.box(0.04, 0.32, 0.04), k.mat(WORLD.ink), parent, p.x + dx, 0.16, p.z + 0.45);
}

/** a deck chair's sizes (office units): its seat's top, its backrest's tilt (the done bim's back, pose.ts) and length */
export const DECK = { seat: 0.24, tilt: 0.6, back: 0.54, cloth: 0.05, rail: 0.04 } as const;

/**
 * A deck chair in its floor box (Gabriel: the slabs didn't read as deck chairs, the bims hovered
 * over them): a wooden frame on four legs, the cloth seat towards the front (+z) and the backrest
 * rising to the back at the done bim's tilt, a prop under it. The done pose (pose.ts) lies on it.
 */
function deckChair(k: Kit, parent: Object3D, b: Box, cloth: string): void {
  const { style, pal } = k;
  const x = (b.x0 + b.x1) / 2;
  const w = b.x1 - b.x0 - 0.04;
  const wood = k.mat(pal.desk);
  const fab = k.mat(cloth);
  // the seat ends where the backrest starts: a little behind the box's middle
  const hinge = b.z0 + 0.42;
  const seatD = b.z1 - hinge;
  k.add(style.box(w, DECK.cloth, seatD), fab, parent, x, DECK.seat - DECK.cloth / 2, hinge + seatD / 2);
  const back = k.add(style.box(w, DECK.cloth, DECK.back), fab, parent, x, 0, 0);
  const c = Math.cos(DECK.tilt);
  const sn = Math.sin(DECK.tilt);
  back.rotation.x = DECK.tilt;
  back.position.set(x, DECK.seat - DECK.cloth / 2 + (DECK.back / 2) * sn, hinge - (DECK.back / 2) * c);
  // the frame: a rail each side under the cloth, four legs, the prop under the backrest
  const legH = DECK.seat - DECK.cloth;
  for (const sx of [-1, 1]) {
    const rx = x + sx * (w / 2 - DECK.rail / 2);
    k.add(style.box(DECK.rail, DECK.rail, seatD), wood, parent, rx, legH - DECK.rail / 2, hinge + seatD / 2);
    k.add(style.box(DECK.rail, legH, DECK.rail), wood, parent, rx, legH / 2, b.z1 - DECK.rail);
    k.add(style.box(DECK.rail, legH, DECK.rail), wood, parent, rx, legH / 2, hinge);
    const propH = DECK.seat + (DECK.back - 0.12) * sn - DECK.cloth;
    k.add(style.box(DECK.rail, propH, DECK.rail), wood, parent, rx, propH / 2, hinge - (DECK.back - 0.12) * c);
  }
}
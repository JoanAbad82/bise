// Chunk C's look helpers (three; the patio, the haveli, the tropical house, the Cyclades, the
// Sahel): a desk turned the way its chair faces, main's desk and its :* neon, a cone, a torus, a
// colour darker at night, the nap places and the terrace's deck chairs by the stage's count (the
// loft's counts: stages.ts), the frames on a wall (one per 10 artifacts, golden from 500), and the
// growth run: each stage's piece in its stage's group, the garden, the cones where the next piece
// goes. Each map gives its own pieces and where they stand. Nothing here decides. Owner: maps-c.
import {
  CanvasTexture,
  Color,
  ConeGeometry,
  Group,
  type Material,
  type Mesh,
  MeshStandardMaterial,
  type Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  TorusGeometry,
} from 'three';
import type { Box, Office, Pt, Spot } from '../../model';
import { BASE_BEDS, bedStage, bedsAt } from '../../growth';
import { boxAhead, chair, deskLamp, laptop } from '../furniture';
import { glyph, type Kit } from '../kit';
import { HOODIE, WORLD, hash, type Palette } from '../palette';
import { cones, deckChair, garden } from '../stages';
import type { Build, DeskHandles } from './look';

/** a colour as the night sees it (the prototype's NC): darker, so the room reads in the dark theme */
export const nc = (c: string, night: boolean, k = 0.62): string => (night ? `#${new Color(c).multiplyScalar(k).getHexString()}` : c);

/**
 * A floor's own pattern (terracotta tiles, sandstone slabs, pebbles, beaten earth): `draw` paints
 * one tile of 64 px, repeated every `size` tiles over w by d. A plain colour without a document.
 */
export function patterned(k: Kit, color: string, w: number, d: number, size: number, draw: (g: CanvasRenderingContext2D, px: number) => void): Material {
  if (typeof document === 'undefined') return k.mat(color);
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (!g) return k.mat(color);
  g.fillStyle = color;
  g.fillRect(0, 0, 64, 64);
  draw(g, 64);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(w / size, d / size);
  return new MeshStandardMaterial({ color: 0xffffff, map: t, roughness: 0.95, metalness: 0 });
}

/** the floor slab of a map: its pattern over x0..x0+W, 0..D */
export function floorOf(k: Kit, root: Object3D, o: Office, m: Material): void {
  k.add(k.style.box(o.W, 0.14, o.D), m, root, o.x0 + o.W / 2, -0.05, o.D / 2);
}

/** where each stage's piece stands on a map of this chunk (the loft's roles, the room's own places) */
export function pieceSpots(o: Office): Pt[] {
  const x1 = o.x0 + o.W;
  const lx = o.lounge.map((s) => s.x);
  const lc = lx.length ? (Math.min(...lx) + Math.max(...lx)) / 2 : o.x0 + 2;
  const tx = o.terrace.map((t) => t.x);
  const left = tx.length ? Math.min(...tx) < o.x0 + o.W / 2 : true;
  const free = left ? x1 - 1.6 : o.x0 + 1.6;
  const isl = o.island;
  const bx = o.boardSpots.length ? o.boardSpots.reduce((s, p) => s + p.x, 0) / o.boardSpots.length : o.x0 + o.W / 2;
  return [
    o.door,
    { x: left ? o.x0 + 0.3 : x1 - 0.3, z: o.D - 0.25 },
    { x: (isl.x0 + isl.x1) / 2, z: (isl.z0 + isl.z1) / 2 },
    { x: lc, z: 1.6 },
    { x: bx, z: 0.9 },
    { x: lc, z: 0.6 },
    { x: (isl.x0 + isl.x1) / 2, z: isl.z0 + 0.3 },
    { x: left ? Math.max(...tx) + 1.7 : Math.min(...tx) - 1.7, z: o.D + 2.3 },
    { x: o.x0 - 0.9, z: o.D * 0.45 },
    { x: free, z: o.D + 2.6 },
    { x: o.x0 - 1.9, z: o.D * 0.55 },
    { x: free + (left ? -1.6 : 1.6), z: o.D + 2.6 },
    { x: o.x0 - 1.9, z: o.D + 2.2 },
    { x: x1 + 1.2, z: 1.2 },
    { x: o.x0 - 1.9, z: 1.4 },
  ];
}

/** the garden's trees: by the left side and behind the back wall (the loft's), in the map's kind */
export function treeSpots(o: Office): Pt[] {
  return [
    { x: o.x0 - 0.7, z: 1.0 },
    { x: o.x0 - 0.7, z: o.D * 0.45 },
    { x: o.x0 - 0.7, z: o.D * 0.85 },
    { x: o.x0 + o.W * 0.3, z: -0.85 },
    { x: o.x0 + o.W * 0.75, z: -0.85 },
  ];
}

/** a palette over the loft's own (the lights, the screens, the lamps) with the map's colours */
export function palOf(base: Palette, own: Partial<Palette>): Palette {
  return { ...base, ...own };
}

/** a cone standing on (x, y, z), its tip up */
export function cone(k: Kit, parent: Object3D, r: number, h: number, color: string | Material, x: number, y: number, z: number): Mesh {
  return k.add(new ConeGeometry(r, h, 10), typeof color === 'string' ? k.mat(color) : color, parent, x, y, z);
}

/** a ring (a turban's wrap, a garland, an arch): lying flat unless turned */
export function ring(k: Kit, parent: Object3D, r: number, tube: number, color: string, x: number, y: number, z: number, arc = Math.PI * 2): Mesh {
  return k.add(new TorusGeometry(r, tube, 8, 20, arc), k.mat(color), parent, x, y, z);
}

/** a soft glow by night (a lantern, a brazier, a diya), plain by day */
export function glow(k: Kit, color: string, ei = 0.9): Material {
  return k.pal.pendants ? k.style.material(color, { emissive: color, ei }) : k.mat(color);
}

/** a box sized from a floor box, on the floor up to h */
export function block(k: Kit, parent: Object3D, b: Box, h: number, color: string, y = 0): Mesh {
  return k.add(k.style.box(b.x1 - b.x0, h, b.z1 - b.z0), k.mat(color), parent, (b.x0 + b.x1) / 2, y + h / 2, (b.z0 + b.z1) / 2);
}

export interface DeskDress {
  /** the chair's colour (else the bim's) */
  readonly chair?: string;
  /** a mat under the desk and its chair */
  readonly mat?: string;
  /** a small thing on the desk's corner, by the desk's hash */
  readonly thing?: (k: Kit, g: Group, h: number) => void;
}

/**
 * One agent's desk: its chair at the spot, the desk ahead of it the way it faces (Office.furniture
 * has its box), a laptop and the cream lamp, the small plate in its bim's hoodie colour (spec §2).
 */
export function deskOf(b: Build, d: Spot, name: string, dress: DeskDress = {}): DeskHandles {
  const { k, root } = b;
  const { style, pal } = k;
  const h = hash(name);
  const g = new Group();
  g.position.set(d.x, 0, d.z);
  g.rotation.y = d.face;
  root.add(g);
  const w = 1.3;
  const dd = 0.72;
  if (dress.mat) k.add(style.box(1.5, 0.02, 1.5), k.mat(dress.mat), g, 0, 0.03, 0.3);
  k.add(style.box(w - 0.1, 0.5, dd - 0.08, 0.12), k.mat(pal.desk), g, 0, 0.25, 0.5);
  k.add(style.box(w, 0.06, dd, 0.03), k.mat(pal.deskTop), g, 0, 0.52, 0.5);
  k.add(style.box(0.22, 0.08, 0.02), k.mat(HOODIE[h % HOODIE.length] ?? pal.desk), g, -w / 3, 0.4, 0.5 + dd / 2 - 0.03);
  const screen = laptop(k, g, 0, 0.47);
  const lamp = deskLamp(k, g, w / 2 - 0.18, 0.5 + dd / 2 - 0.17);
  const seat = chair(k, root, d.x - Math.sin(d.face) * 0.05, d.z - Math.cos(d.face) * 0.05, dress.chair ?? HOODIE[(h >> 5) % HOODIE.length] ?? pal.desk, d.face);
  dress.thing?.(k, g, h);
  return { screen, lamp, top: { x: d.x + Math.sin(d.face) * 0.5, y: 0.55, z: d.z + Math.cos(d.face) * 0.5 }, chair: seat };
}

/** main's desk: its box ahead of its spot, a tray, the neon :* on the wall behind it */
export function mainDeskOf(b: Build, top: string, body: string): DeskHandles {
  const { k, root, o } = b;
  const { style, pal } = k;
  const md = o.mainDesk;
  const mb = boxAhead(o.furniture, md) ?? { x0: md.x - 1.15, x1: md.x + 1.15, z0: md.z + 0.1, z1: md.z + 1.1 };
  const cx = (mb.x0 + mb.x1) / 2;
  const cz = (mb.z0 + mb.z1) / 2;
  const g = new Group();
  g.position.set(cx, 0, cz);
  root.add(g);
  const w = mb.x1 - mb.x0;
  const dd = mb.z1 - mb.z0;
  k.add(style.box(w - 0.1, 0.5, dd - 0.1), k.mat(body), g, 0, 0.25, 0);
  k.add(style.box(w, 0.06, dd), k.mat(top), g, 0, 0.52, 0);
  const screen = laptop(k, g, md.x - cx + 0.2, -0.03);
  const lamp = deskLamp(k, g, w / 2 - 0.2, dd / 2 - 0.2);
  k.add(style.box(0.7, 0.06, 0.5), k.mat(pal.wallTop), g, -w / 2 + 0.5, 0.58, 0);
  k.add(style.box(0.34, 0.24, 0.26), k.mat(WORLD.crate), g, -w / 2 + 0.5, 0.73, 0);
  const seat = chair(k, root, md.x, md.z - 0.05, WORLD.dark, md.face);
  glyph(k, root, md.x, 1.25, 0.02 + style.pictureZ, pal.neon, 0.06, style.material(pal.neon, { flat: true }));
  return { screen, lamp, top: { x: cx, y: 0.55, z: cz }, chair: seat };
}

const CHAIRS = [0, 1, 1, 1, 2, 2, 2, 4, 4, 4, 8] as const;
const at = (xs: readonly number[], i: number): number => xs[Math.min(i, xs.length - 1)] ?? 0;

/** each nap place's bed the stage has reached (growth.ts bedsAt) past the cozy kit's two base beds (render/cozy.ts), in its stage's group (a napper past them naps at its desk) */
export function beds(b: Build, draw: (parent: Group, box: Box, i: number) => void): void {
  const { o, grow } = b;
  const own = o.furniture.filter((x) => x.of !== undefined && o.lounge.some((l) => l.x === x.of?.x && l.z === x.of.z));
  own.forEach((box, i) => {
    if (i < BASE_BEDS || i >= bedsAt(grow.stage)) return;
    const g = b.stage(bedStage(i));
    if (g) draw(g, box, i);
  });
}

/** the terrace: its slab from stage 1 (the first done bim makes it), its deck chairs by the stage's count */
export function terrace(b: Build, slab: string, cloth: readonly string[]): void {
  const { k, o, grow } = b;
  const s1 = b.stage(1);
  if (!s1) return;
  const xs = o.terrace.map((t) => t.x);
  const zs = o.terrace.map((t) => t.z);
  const x0 = Math.min(...xs) - 0.8;
  const x1 = Math.max(...xs) + 0.8;
  const z0 = o.D + 0.15;
  const z1 = Math.max(...zs) + 0.8;
  k.add(k.style.box(x1 - x0, 0.08, z1 - z0), k.mat(slab), s1, (x0 + x1) / 2, 0, (z0 + z1) / 2);
  const own = o.furniture.filter((x) => x.of !== undefined && o.terrace.some((t) => t.x === x.of?.x && t.z === x.of.z));
  own.forEach((box, i) => {
    if (i >= at(CHAIRS, grow.stage)) return;
    const st = ([1, 4, 7, 7, 10, 10, 10, 10] as const)[i] ?? 0;
    deckChair(k, b.stage(st) ?? s1, box, cloth[i % cloth.length] ?? WORLD.paper);
  });
}

/** a wall's span for the frames: x from xa to xb at height y (the top row), on the back wall */
export interface FrameWall {
  readonly xa: number;
  readonly xb: number;
  readonly y: number;
}

/** the frames, one per 10 artifacts in rows on the back wall; `draw` makes one (golden: from 500) */
export function frames(b: Build, wall: FrameWall, draw: (k: Kit, parent: Object3D, x: number, y: number, z: number, i: number, golden: boolean) => void): void {
  const { k, grow } = b;
  const s0 = b.stage(0);
  if (!s0 || grow.frames === 0) return;
  const pitch = 0.36;
  const cols = Math.max(1, Math.floor((wall.xb - wall.xa) / pitch));
  for (let i = 0; i < grow.frames; i++) {
    const y = wall.y - Math.floor(i / cols) * 0.32;
    if (y < 0.6) break;
    draw(k, s0, wall.xa + pitch / 2 + (i % cols) * pitch, y, 0.02 + k.style.pictureZ, i, grow.golden);
  }
}

/** a stage's piece: drawn at its spot (pieceAt) in its stage's group */
export type Piece = (k: Kit, g: Group, p: Pt, b: Build) => void;

/**
 * The growth: each stage's piece (1..14) the stage has reached, at its spot, in its group; the
 * loft's garden flowers, and the cones where the next piece goes.
 */
export function grow(b: Build, pieces: Readonly<Record<number, Piece>>, spot: (o: Office, stage: number) => Pt): void {
  const { k, o, grow: g } = b;
  const s0 = b.stage(0);
  if (!s0) return;
  for (let n = 1; n <= 14; n++) {
    const grp = b.stage(n);
    const piece = pieces[n];
    if (grp && piece) piece(k, grp, spot(o, n), b);
  }
  garden(k, s0, o, g);
  if (g.building && g.stage < 14) cones(k, s0, spot(o, g.stage + 1));
}

/** a golden thing on a plinth (stage 14): the plinth, then `top` draws in gold over it */
export function plinth(k: Kit, g: Group, p: Pt, top: (gold: Material, y: number) => void): void {
  k.add(k.style.box(0.7, 0.4, 0.7), k.mat('#d8d2c6'), g, p.x, 0.2, p.z);
  top(k.style.material(WORLD.gold, { emissive: WORLD.gold, ei: 0.15 }), 0.4);
}

/** a potted plant: a pot and a few leaves (stage 1 everywhere, in the map's own plant) */
export function potted(k: Kit, g: Object3D, x: number, z: number, pot: string, leaf: string, tall = 0.5): void {
  k.add(k.style.cylinder(0.18, 0.32), k.mat(pot), g, x, 0.16, z);
  for (let i = 0; i < 4; i++) {
    const l = k.add(k.style.ball(0.14), k.mat(leaf), g, x + Math.cos(i * 1.6) * 0.1, 0.4 + (i / 4) * tall, z + Math.sin(i * 1.6) * 0.08);
    l.scale.set(0.8, 1.3, 0.8);
  }
}

/** a balloon over the garden (stage 13): its envelope, a basket under it, two ropes */
export function balloon(k: Kit, g: Group, p: Pt, colors: readonly string[], y = 2.3): Group {
  const bl = new Group();
  bl.position.set(p.x, y, p.z);
  g.add(bl);
  colors.forEach((c, i) => {
    const s = k.add(k.style.ball(0.6 - i * 0.001), k.mat(c), bl, 0, 0, 0);
    s.scale.set(1 - i * 0.28, 1.05, 1 - i * 0.28);
  });
  k.add(k.style.box(0.35, 0.25, 0.35), k.mat('#c49a6c'), bl, 0, -1.0, 0);
  for (const dx of [-0.15, 0.15]) k.add(k.style.cylinder(0.01, 0.5), k.mat(WORLD.ink), bl, dx, -0.65, 0);
  return bl;
}

/** a kite on its string (stage 13 for the haveli and the tropical house) */
export function kite(k: Kit, g: Group, p: Pt, color: string, tail: string, y = 2.6): void {
  const kt = k.add(k.style.box(0.5, 0.5, 0.02), k.mat(color), g, p.x, y, p.z);
  kt.rotation.z = Math.PI / 4;
  for (let i = 0; i < 4; i++) k.add(k.style.box(0.1, 0.06, 0.02), k.mat(i % 2 ? tail : color), g, p.x + 0.05 * i, y - 0.42 - i * 0.14, p.z);
  const line = k.add(k.style.cylinder(0.006, y), k.mat(WORLD.ink), g, p.x + 0.4, y / 2, p.z + 0.3);
  line.rotation.z = 0.25;
}

/** a low game table (stage 9's board games: lotería, carrom, tavli, awalé) and its top */
export function gameTable(k: Kit, g: Group, p: Pt, wood: string, top: string): void {
  k.add(k.style.box(0.9, 0.36, 0.9), k.mat(wood), g, p.x, 0.18, p.z);
  k.add(k.style.box(0.8, 0.03, 0.8), k.mat(top), g, p.x, 0.37, p.z);
}

/** a pond (stage 12): water, a rim, a few leaves */
export function pond(k: Kit, g: Group, p: Pt, water: string, rim: string, r = 1.0): void {
  const w = k.add(k.style.cylinder(r, 0.04), k.style.material(water, { emissive: water, ei: 0.1 }), g, p.x, 0.02, p.z);
  w.scale.z = 0.7;
  const e = k.add(k.style.cylinder(r + 0.1, 0.03), k.mat(rim), g, p.x, 0.0, p.z);
  e.scale.z = 0.72;
}

// What maps-b's six looks share (greenhouse, campus, workshop, kyoto, riad, nordic; their plans:
// maps/<id>.ts on maps/bplan.ts): a map's day and night palettes from its day colours, a desk turned
// the way its chair faces, main's desk with its neon :*, the nap place's beds by the stage's count,
// and the growth (page bims-maps « comment chaque map grandit »): the same 15 stages, the garden by
// days, a frame per 10 artifacts (golden from 500), the cones where the next piece goes; each map
// says what each stage's piece is and where it stands (Grower). Never the accent pink or the error
// red (blook.test.ts reads every palette and piece colour). Owner: maps-b.
import { Group, type Object3D } from 'three';
import type { Box, Office, Pt, Spot } from '../../model';
import { BASE_BEDS, bedStage, bedsAt, type Grow } from '../../growth';
import { chair, deskLamp, laptop } from '../furniture';
import { type Kit, boxOf, glyph, onFloor } from '../kit';
import { decorOf, terraceSlab } from '../decor';
import { DAY, HOODIE, NIGHT, type Palette, WORLD, hash, rng } from '../palette';
import { bigPlant, boombox, cones, deckChair, fruitBowl, garden, loftTree, mural, whiteboard } from '../stages';
import type { Build, DeskHandles } from './look';
import { frameXs } from '../cozy';

// ---- palettes

/** a colour times k (the night's dimmer floor and walls), as #rrggbb */
export function dim(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const DIMMED = ['floor', 'wall', 'wallTop', 'desk', 'deskTop', 'island', 'islandTop', 'terrace', 'grass', 'dirt', 'rug', 'islandRug', 'plant'] as const;

/**
 * A map's palettes: its day colours over the loft's day, and by night the same dimmed (0.62, the
 * prototype's) over the loft's night; `night` overrides what dimming gets wrong.
 */
export function palettes(day: Partial<Palette>, night: Partial<Palette> = {}): (n: boolean) => Palette {
  const d: Palette = { ...DAY, ...day };
  const dimmed: Partial<Record<(typeof DIMMED)[number], string>> = {};
  for (const key of DIMMED) if (day[key] !== undefined) dimmed[key] = dim(d[key], 0.62);
  const nt: Palette = { ...NIGHT, ...dimmed, ...night };
  return (n) => (n ? nt : d);
}

// ---- desks

/** where a desk's middle is: ahead of its chair, the way it faces */
export const ahead = (s: Spot, by: number): Pt => ({ x: s.x + by * Math.sin(s.face), z: s.z + by * Math.cos(s.face) });

export interface DeskOpts {
  /** width, depth, height of the desk; how far its middle is ahead of the chair */
  readonly w?: number;
  readonly d?: number;
  readonly h?: number;
  readonly at?: number;
  /** the chair: drawn by the caller (a cushion, a stool) when false */
  readonly chair?: boolean;
  /** what stands on the desk past the laptop and the lamp */
  readonly extra?: (g: Group, h: number) => void;
}

/** A desk turned the way its chair faces (its spot), the laptop towards the chair, the lamp at its far corner. */
export function turnedDesk(b: Build, s: Spot, name: string, o: DeskOpts = {}): DeskHandles {
  const { k, root } = b;
  const { style, pal } = k;
  const w = o.w ?? 1.5;
  const dd = o.d ?? 0.7;
  const at = o.at ?? 0.5;
  const h = hash(name);
  const g = new Group();
  g.position.set(s.x, 0, s.z);
  g.rotation.y = s.face;
  root.add(g);
  k.add(style.box(w - 0.1, 0.5, dd - 0.08, 0.12), k.mat(pal.desk), g, 0, 0.25, at);
  k.add(style.box(w, 0.06, dd, 0.03), k.mat(pal.deskTop), g, 0, 0.52, at);
  k.add(style.box(0.22, 0.08, 0.02), k.mat(HOODIE[h % HOODIE.length] ?? pal.desk), g, -w / 3, 0.4, at - dd / 2 + 0.03);
  const screen = laptop(k, g, 0, at - 0.03);
  const lamp = deskLamp(k, g, w / 2 - 0.18, at + dd / 2 - 0.17);
  const seat = o.chair !== false ? chair(k, g, 0, -0.05, HOODIE[(h >> 5) % HOODIE.length] ?? pal.desk, 0) : undefined;
  o.extra?.(g, h);
  const c = ahead(s, at);
  return { screen, lamp, top: { x: c.x, y: 0.55, z: c.z }, ...(seat ? { chair: seat } : {}) };
}

/** Main's desk at the back (its box in the plan's furniture): bigger, a tray, the neon :* on the wall behind. */
export function bigDesk(b: Build, box: Box, s: Spot, neon: { x?: number; y?: number; z?: number } = {}): DeskHandles {
  const { k, root } = b;
  const { style, pal } = k;
  const mcx = (box.x0 + box.x1) / 2;
  const mcz = (box.z0 + box.z1) / 2;
  const mw = box.x1 - box.x0;
  const mdd = box.z1 - box.z0;
  const mg = new Group();
  mg.position.set(mcx, 0, mcz);
  root.add(mg);
  k.add(style.box(mw - 0.1, 0.5, mdd - 0.1), k.mat(pal.desk), mg, 0, 0.25, 0);
  k.add(style.box(mw, 0.06, mdd), k.mat(pal.deskTop), mg, 0, 0.52, 0);
  const screen = laptop(k, mg, s.x - mcx + 0.2, -0.03);
  const lamp = deskLamp(k, mg, mw / 2 - 0.2, mdd / 2 - 0.2);
  k.add(style.box(0.7, 0.06, 0.5), k.mat(pal.wallTop), mg, -mw / 2 + 0.5, 0.58, 0);
  k.add(style.box(0.34, 0.24, 0.26), k.mat(WORLD.crate), mg, -mw / 2 + 0.5, 0.73, 0);
  const seat = chair(k, root, s.x, s.z - 0.05, WORLD.dark, s.face);
  glyph(k, root, neon.x ?? s.x, neon.y ?? 1.25, (neon.z ?? 0.02) + style.pictureZ, pal.neon, 0.06, style.material(pal.neon, { flat: true }));
  return { screen, lamp, top: { x: mcx, y: 0.55, z: mcz }, chair: seat };
}

/** the furniture box with no place of its own that holds p (a desk, the eating place) */
export const boxHolding = (o: Office, p: Pt): Box | undefined => o.furniture.find((f) => !f.of && p.x > f.x0 && p.x < f.x1 && p.z > f.z0 && p.z < f.z1);

// ---- the nap place

const CHAIRS = [0, 1, 1, 1, 2, 2, 2, 4, 4, 4, 8] as const;
const at = <T>(xs: readonly T[], i: number): T => xs[Math.min(i, xs.length - 1)] as T;

/** A bed on lounge spot i for BASE_BEDS <= i < growth.ts bedsAt(stage) (a napper lies only on one; the first two: the cozy kit's, render/cozy.ts), each in its stage's group (its spot's box: Office.furniture). */
export function beds(b: Build, draw: (k: Kit, parent: Object3D, box: Box, i: number) => void): void {
  const { o, grow } = b;
  const s0 = b.stage(0);
  if (!s0) return;
  const n = bedsAt(grow.stage);
  o.lounge.forEach((sp, i) => {
    if (i < BASE_BEDS || i >= n) return;
    const box = o.furniture.find((f) => f.of && f.of.x === sp.x && f.of.z === sp.z);
    if (!box) return;
    draw(b.k, b.stage(bedStage(i)) ?? s0, box, i);
  });
}

// ---- growth

/** One stage's piece: where it stands and what it is, drawn in its stage's group. */
export interface Piece {
  at(o: Office): Pt;
  draw(k: Kit, g: Group, p: Pt, b: Build): void;
}

export interface Grower {
  /** stages 1..14 (index 0 is unused: the door) */
  readonly pieces: readonly Piece[];
  /** a garden tree (stage 2: the first, 8: all round), its size by the garden's days */
  tree(k: Kit, parent: Object3D, x: number, z: number, size: number, i: number): void;
  /** where the frames hang: the back wall's free span, from xa to xb, at y (rows go down) and z */
  frameSpan(o: Office): { xa: number; xb: number; y: number; z: number };
  /** one frame (its i-th, golden from 500 artifacts) */
  frame(k: Kit, parent: Object3D, x: number, y: number, z: number, i: number, golden: boolean): void;
  /** flowers at stage 6, in the map's colours */
  readonly flowers?: readonly string[];
}

/** where stage n's piece stands (the unlock walks there, its label shows over it) */
export function pieceAtOf(g: Grower): (o: Office, stage: number) => Pt {
  return (o, stage) => (stage <= 0 ? o.door : (g.pieces[Math.min(stage, g.pieces.length - 1)]?.at(o) ?? o.door));
}

/** The growth: the terrace and its deck chairs, each stage's piece, the trees, the garden, the frames, the cones. */
export function grow(b: Build, g: Grower): void {
  const { k, o, grow: gr } = b;
  const s0 = b.stage(0);
  if (!s0) return;
  const d = decorOf(o);
  // the terrace: grass in a new office; its deck chairs come with the stages (the loft's)
  const s1 = b.stage(1);
  if (s1) onFloor(k, s1, terraceSlab(o), 0.08, 0, k.pal.terrace);
  const chairs = o.furniture.filter((f) => f.of !== undefined && o.terrace.some((t) => t.x === f.of?.x && t.z === f.of.z));
  const nChairs = at(CHAIRS, gr.stage);
  chairs.forEach((f, i) => {
    if (i >= nChairs) return;
    deckChair(k, b.stage(([1, 4, 7, 7, 10, 10, 10, 10] as const)[i] ?? 0) ?? s0, f, WORLD.chair[i % 2] ?? WORLD.paper);
  });
  for (let n = 1; n < g.pieces.length && n <= gr.stage; n++) {
    const p = g.pieces[n];
    const grp = b.stage(n);
    if (p && grp) p.draw(k, grp, p.at(o), b);
  }
  // the trees: the first at stage 2, all round at 8, bigger with the garden's days
  const size = 0.75 + gr.garden * 0.06;
  d.trees.forEach((t, i) => {
    const grp = b.stage(i === 0 ? 2 : 8);
    if (grp) g.tree(k, grp, t.x, t.z, size, i);
  });
  // flowers along the walls at stage 6
  const s6 = b.stage(6);
  if (s6) {
    const r = rng(hash(`flowers${String(o.W)}`));
    const cs = g.flowers ?? WORLD.flowers;
    for (let i = 0; i < 10; i++) {
      const fx = r() < 0.5 ? o.x0 - 0.35 - r() * 0.6 : o.x0 + o.W + 0.35 + r() * 0.6;
      k.add(k.style.box(0.16, 0.16, 0.16), k.mat(cs[i % cs.length] ?? WORLD.paper), s6, fx, 0.06, r() * (o.D + 3));
    }
  }
  garden(k, s0, o, gr);
  frames(k, s0, o, gr, g);
  if (gr.building && gr.stage < 14) cones(k, s0, pieceAtOf(g)(o, gr.stage + 1));
}

/** a frame per 10 artifacts along the map's span, rows going down, golden from 500 */
function frames(k: Kit, parent: Object3D, o: Office, gr: Grow, g: Grower): void {
  if (gr.frames === 0) return;
  const span = g.frameSpan(o);
  const { xb, y, z } = span;
  // from stage 11 the arcade cabinet may stand at the span's start (past the board): the frames hang past it
  const a = gr.stage >= 11 ? g.pieces[11]?.at(o) : undefined;
  const xa = a && a.z < 1 && a.x + ARCADE_W / 2 > span.xa && a.x - ARCADE_W / 2 < xb ? Math.max(span.xa, a.x + ARCADE_W / 2 + 0.1) : span.xa;
  const pitch = 0.36;
  // round the cozy posters (render/cozy.ts frameXs)
  const xs = z < 0.5 ? frameXs(o, xa, xb, pitch) : Array.from({ length: Math.max(1, Math.floor((xb - xa) / pitch)) }, (_, c) => xa + pitch / 2 + c * pitch);
  const cols = xs.length;
  for (let i = 0; i < gr.frames; i++) {
    const fy = y - Math.floor(i / cols) * 0.32;
    if (fy < 0.6) break;
    g.frame(k, parent, xs[i % cols] ?? xa, fy, z, i, gr.golden);
  }
}

/** a plain frame: a border (gold from 500) round a picture in one of the mural's colours */
export function plainFrame(border: string, pics: readonly string[]): Grower['frame'] {
  return (k, parent, x, y, z, i, golden) => {
    k.add(k.style.box(0.28, 0.22, 0.02), k.mat(golden ? WORLD.gold : border), parent, x, y, z + k.style.pictureZ);
    k.add(k.style.box(0.22, 0.16, 0.01), k.mat(pics[i % pics.length] ?? WORLD.paper), parent, x, y, z + 0.015 + k.style.pictureZ);
  };
}

/** a big plant in a pot (stage 1 in most maps) */
export function potPlant(k: Kit, parent: Object3D, x: number, z: number, pot: string, leaf: readonly string[], tall = 1): void {
  k.add(k.style.cylinder(0.2, 0.36), k.mat(pot), parent, x, 0.18, z);
  for (let i = 0; i < 3; i++) {
    const l = k.add(k.style.ball((0.26 - i * 0.04) * tall), k.mat(leaf[i % leaf.length] ?? WORLD.leaf[0]), parent, x + (i - 1) * 0.12, 0.5 + i * 0.22 * tall, z + (i % 2) * 0.08);
    l.scale.y = 1.2;
  }
}

/** a balloon over the office, a basket under it (stage 13 in most maps) */
export function balloon(k: Kit, parent: Object3D, x: number, z: number, c: readonly string[], mark: string): void {
  const by = 2.3;
  const env = k.add(k.style.ball(0.6), k.mat(c[0] ?? WORLD.parasol), parent, x, by, z);
  env.scale.y = 1.15;
  if (c[1]) {
    const band = k.add(k.style.cylinder(0.61, 0.18), k.mat(c[1]), parent, x, by, z);
    band.scale.set(1, 1, 1);
  }
  glyph(k, parent, x, by, z + 0.62, mark, 0.05);
  k.add(k.style.box(0.35, 0.25, 0.35), k.mat('#c49a6c'), parent, x, by - 1.0, z);
  for (const dx of [-0.15, 0.15]) k.add(k.style.cylinder(0.01, 0.5), k.mat(WORLD.ink), parent, x + dx, by - 0.65, z);
}

/** a golden thing on a plinth (stage 14): the plinth, then the map's own figure in gold */
export function onPlinth(k: Kit, parent: Object3D, x: number, z: number, figure: (gold: ReturnType<Kit['mat']>, y: number) => void): void {
  k.add(k.style.box(0.7, 0.4, 0.7), k.mat('#d8d2c6'), parent, x, 0.2, z);
  figure(k.style.material(WORLD.gold, { emissive: WORLD.gold, ei: 0.15 }), 0.4);
}

// ---- the loft's growth on another plan (greenhouse, campus, workshop: page bims-maps « la croissance
// reste celle du loft »): the same pieces, where that plan has room for them

/** where a plan puts the loft's pieces that do not stand where the loft's do */
export interface LoftSpots {
  /** the fruit bowls (stages 2 and 6) and the boombox (5): on the eating place's top */
  readonly fruit: (o: Office) => Pt;
  readonly fruit2: (o: Office) => Pt;
  readonly boombox: (o: Office) => Pt;
  /** the mural's span on the back wall (stage 5) */
  readonly mural: (o: Office) => readonly [number, number];
  /** the arcade cabinet (stage 11), against a wall */
  readonly arcade: (o: Office) => Pt;
  /** the nap place's middle (stage 3: its first beds) */
  readonly nap: (o: Office) => Pt;
  /** the frames' span (default: between the board and main's desk on the back wall) */
  readonly frameSpan?: (o: Office) => { xa: number; xb: number; y: number; z: number };
}

const boardXOf = (o: Office): number => (o.boardSpots.length ? o.boardSpots.reduce((s, p) => s + p.x, 0) / o.boardSpots.length : o.x0 + o.W / 2);
const piece = (at: (o: Office) => Pt, draw: Piece['draw'] = () => undefined): Piece => ({ at, draw });

/** The loft's fourteen pieces (stages.ts buildStages), placed by the plan's spots. */
export function loftGrower(s: LoftSpots): Grower {
  const d = (o: Office) => decorOf(o);
  return {
    pieces: [
      piece((o) => o.door),
      piece((o) => d(o).plants[0] ?? o.door, (k, g, p) => { bigPlant(k, g, p.x, p.z); }),
      piece(s.fruit, (k, g, p) => { fruitBowl(k, g, p.x, p.z); }),
      piece(s.nap),
      piece((o) => ({ x: boardXOf(o), z: 0.9 }), (k, g, p, b) => {
        whiteboard(k, g, p.x);
        const p2 = d(b.o).plants[1];
        if (p2) bigPlant(k, g, p2.x, p2.z);
      }),
      piece(s.boombox, (k, g, p, b) => {
        const [m0, m1] = s.mural(b.o);
        mural(k, g, m0, m1);
        const at = new Group();
        at.position.x = p.x;
        g.add(at);
        boombox(k, at, p.z);
      }),
      piece(s.fruit2, (k, g, p) => { fruitBowl(k, g, p.x, p.z); }),
      piece((o) => d(o).parasol, (k, g, _p, b) => {
        const dd = d(b.o);
        k.add(k.style.cylinder(0.03, 1.8), k.mat(k.pal.ink), g, dd.parasol.x, 0.9, dd.parasol.z);
        k.add(k.style.box(1.4, 0.3, 1.4), k.mat(WORLD.parasol), g, dd.parasol.x, 1.85, dd.parasol.z);
        k.add(k.style.box(0.16, 1.6, 0.16), k.mat(WORLD.palmTrunk), g, dd.palm.x, 0.8, dd.palm.z);
        for (let i = 0; i < 4; i++) k.add(k.style.box(0.9, 0.04, 0.22), k.mat(WORLD.leaf[0]), g, dd.palm.x, 1.62, dd.palm.z).rotation.y = (i * Math.PI) / 2 + 0.4;
      }),
      piece((o) => d(o).trees[1] ?? o.door),
      piece((o) => d(o).ramp, (k, g, _p, b) => onFloor(k, g, boxOf(d(b.o).ramp), 0.3, 0.15, WORLD.ramp)),
      piece((o) => ({ x: o.x0 - 1.9, z: o.D * 0.55 }), (k, g, p) => {
        k.add(k.style.cylinder(0.72, 0.25), k.mat('#d8d2c6'), g, p.x, 0.12, p.z);
        k.add(k.style.cylinder(0.6, 0.05), k.style.material('#8fd3ff', { emissive: '#8fd3ff', ei: 0.15 }), g, p.x, 0.26, p.z);
        k.add(k.style.cylinder(0.13, 0.6), k.mat('#d8d2c6'), g, p.x, 0.5, p.z);
        k.add(k.style.ball(0.12), k.mat('#8fd3ff'), g, p.x, 0.85, p.z);
      }),
      piece(s.arcade, (k, g, p) => { arcade(k, g, p); }),
      piece((o) => ({ x: o.x0 - 1.9, z: o.D + 2.2 }), (k, g, p, b) => {
        pool(k, g, p.x, p.z, 1.0, 0.7, b.k.pal.pendants);
        k.add(k.style.box(0.9, 0.06, 0.35), k.mat('#c49a6c'), g, p.x + 0.7, 0.06, p.z - 0.2);
        for (let i = 0; i < 3; i++) k.add(k.style.ball(0.1), k.mat(WORLD.leaf[0]), g, p.x - 0.5 + i * 0.35, 0.04, p.z + 0.3 - i * 0.2);
      }),
      piece((o) => ({ x: o.x0 + o.W + 1.2, z: 1.2 }), (k, g, p) => { balloon(k, g, p.x, p.z, [WORLD.parasol], k.pal.ink); }),
      piece((o) => ({ x: o.x0 - 1.9, z: 1.4 }), (k, g, p) => { onPlinth(k, g, p.x, p.z, (gold, y) => {
          k.add(k.style.capsule(0.22, 0.25), gold, g, p.x, y + 0.45, p.z);
          k.add(k.style.ball(0.22), gold, g, p.x, y + 0.92, p.z);
        }); }),
    ],
    tree: (k, parent, x, z, size) => { loftTree(k, parent, x, z, size); },
    frameSpan: s.frameSpan ?? ((o) => ({ xa: boardXOf(o) + 1.1, xb: o.mainDesk.x - 0.5, y: 1.45, z: 0.02 })),
    frame: plainFrame(WORLD.crate, WORLD.mural),
  };
}

/** the arcade cabinet's width (x) */
export const ARCADE_W = 0.55;

/**
 * The arcade cabinet's place on the back wall past the whiteboard: behind the nap place's last bed
 * the napper laid its head inside it (Gabriel, bims-life; render/lying.test.ts).
 */
export const pastBoard = (o: Office): Pt => ({ x: boardXOf(o) + 0.9 + 0.25 + ARCADE_W / 2, z: 0.3 });

/** an arcade cabinet, its screen lit, facing the room (+z) */
export function arcade(k: Kit, g: Object3D, p: Pt): void {
  k.add(k.style.box(ARCADE_W, 1.1, 0.45), k.mat(WORLD.ramp), g, p.x, 0.55, p.z);
  k.add(k.style.box(0.45, 0.32, 0.03), k.style.material(WORLD.dark, { emissive: '#6cb4ee', ei: 0.5 }), g, p.x, 0.82, p.z + 0.24);
  k.add(k.style.box(0.5, 0.06, 0.25), k.mat(WORLD.dark), g, p.x, 0.6, p.z + 0.28);
}

/** water on the grass: a flat pool (ponds, lakes, basins) */
export function pool(k: Kit, parent: Object3D, x: number, z: number, rx: number, rz: number, night: boolean): void {
  const p = k.add(k.style.cylinder(1, 0.04), k.style.material(night ? '#1d3b52' : '#6cb4ee', { emissive: night ? '#2c5a7a' : '#6cb4ee', ei: night ? 0.3 : 0.08 }), parent, x, 0.0, z);
  p.scale.set(rx, 1, rz);
}

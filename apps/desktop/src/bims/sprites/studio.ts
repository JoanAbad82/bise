// The studio that draws bise.dev's home islands (gags.ts, prototype A) with the app's own bims: a
// little clay island (the hero town's cube in miniature: a dirt slab, a top of floor or grass), its
// props (a tiny desk with a little window, the music family's upright piano) and its bim, in the
// town's 2:1 iso camera and the day palette's fixed light (the hero film's, TownOpts.themed by day),
// with the clay's soft sun shadow, on a transparent ground. Off screen, one canvas: the island alone
// (its base), then each frame with its bim, cropped to where it differs from the base (the bim, its
// shadow, the notes); scripts/bims-sprites.mts packs them into WebP. Owner: bims-proto.
import { type DirectionalLight, Group, type Material, Mesh, type Object3D, Vector3 } from 'three';
import { BACK, DIST } from '../render/camera';
import { makeBim, type Bim } from '../render/bim';
import { makeObject } from '../render/objects';
import { CREAM, INK, PANE, SLATE, SLATE_L, STEEL, WOOD_D, WOOD_L, partOf } from '../render/objects/kit';
import { DAY, WORLD } from '../render/palette';
import { STYLE } from '../render/style';
import { makeView } from '../render/view';
import { castShadows } from '../render/world';
import { SLAB, type Island } from './gags';

/** px per office unit on the sheet (2x: 64 css px a unit, the island ~200 css px wide) */
export const PX = 128;
/** half the view's size, office units: the island and what stands on it fit inside */
const HALF = 2.3;
/** the sun: from the upper left, in front (the town's: its left side lit, its right in the shade) */
const SUN = new Vector3(-2, 9, 3.5);
const NOTE = WORLD.gold;
/** every colour the studio adds to the app's (the palette law checks them: never the accent pink or the error red) */
export const STUDIO_COLOURS: readonly string[] = [NOTE, CREAM, INK, PANE, SLATE, SLATE_L, STEEL, WOOD_D, WOOD_L];

export interface Box { readonly x: number; readonly y: number; readonly w: number; readonly h: number }

export interface Drawn {
  /** the island alone, cropped to its ink */
  readonly base: HTMLCanvasElement;
  /** each frame's box in the base (px, 2x), the same for all */
  readonly at: Box;
  readonly frames: HTMLCanvasElement[];
  /** the bim's own box in its frame at its held pose (px, 2x): its hit area */
  readonly hit: Box;
  /** the slab's underside's four corners in the base (px, 2x): its shadow on the page */
  readonly under: readonly number[];
}

/** a tiny desk: wooden top on four legs, a little app window standing on its back half */
function deskOn(root: Group, d: NonNullable<Island['desk']>): void {
  const g = partOf(root, { off: false, night: 0, n: 5 });
  const top = 0.06;
  g.box(d.w, top, d.d, WOOD_L, d.x, d.h - top / 2, d.z, 0.02);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(0.06, d.h - top, 0.06, WOOD_D, d.x + sx * (d.w / 2 - 0.07), (d.h - top) / 2, d.z + sz * (d.d / 2 - 0.07), 0.015);
  // the window: its frame, a title bar, a sidebar and three lines, on a little foot
  const w = g.at(d.x + d.win, d.h, d.z - 0.08);
  w.root.rotation.y = 0.15;
  w.box(0.18, 0.025, 0.12, SLATE, 0, 0.0125, 0, 0.008);
  w.box(0.04, 0.08, 0.03, SLATE, 0, 0.06, -0.02, 0.01);
  const W = 0.62, H = 0.42, y = 0.1 + H / 2;
  w.box(W, H, 0.035, CREAM, 0, y, 0, 0.02);
  w.box(W - 0.02, 0.06, 0.01, STEEL, 0, y + H / 2 - 0.04, 0.02, 0.005);
  for (let i = 0; i < 3; i++) w.ball(0.012, SLATE_L, -W / 2 + 0.05 + i * 0.035, y + H / 2 - 0.04, 0.027);
  w.box(0.14, H - 0.1, 0.01, PANE, -W / 2 + 0.09, y - 0.04, 0.02, 0.005);
  for (let i = 0; i < 3; i++) w.box([0.3, 0.24, 0.27][i] ?? 0.3, 0.025, 0.01, SLATE_L, 0.06 - (i === 1 ? 0.03 : 0), y + 0.06 - i * 0.08, 0.02, 0.004);
}

/** a music note: a head and a stem in gold */
function makeNote(): Group {
  const g = new Group();
  const p = partOf(g, { off: false, night: 0, n: 5 });
  p.ball(0.05, NOTE, 0, 0, 0).scale.set(1.2, 0.85, 0.7);
  p.box(0.018, 0.17, 0.018, NOTE, 0.05, 0.085, 0, 0);
  p.box(0.06, 0.02, 0.018, NOTE, 0.075, 0.16, 0, 0).rotation.z = -0.5;
  return g;
}

/** the island's slab: the dirt's rounded block, its top's layer (the town's cube in miniature) */
function slabOn(root: Group, top: Island['top']): void {
  const dirt = new Mesh(STYLE.box(SLAB.w, SLAB.h, SLAB.w, SLAB.r), STYLE.material(DAY.dirt));
  dirt.position.y = -SLAB.top - SLAB.h / 2 + 0.02;
  const lid = new Mesh(STYLE.box(SLAB.w, SLAB.top, SLAB.w, 0.04), STYLE.material(top === 'grass' ? DAY.grass : DAY.floor));
  lid.position.y = -SLAB.top / 2;
  root.add(dirt, lid);
}

export function drawIsland(s: Island): Drawn {
  const N = Math.round(HALF * 2 * PX);
  const canvas = document.createElement('canvas');
  canvas.width = N;
  canvas.height = N;
  const view = makeView(canvas, { shadowAuto: true, transparent: true });
  view.renderer.setPixelRatio(1);
  view.renderer.setSize(N, N, false);
  view.tint(DAY);
  view.sky(DAY.bg);
  const sun: DirectionalLight = view.sun;
  sun.position.copy(SUN);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 4;
  sun.shadow.bias = -0.0005;
  const sc = sun.shadow.camera;
  sc.left = -3; sc.right = 3; sc.top = 3; sc.bottom = -3; sc.near = 0.1; sc.far = 20;
  sc.updateProjectionMatrix();
  const { camera, scene } = view;
  const target = new Vector3(0, 0.45, 0);
  camera.position.set(target.x + BACK.x * DIST, target.y + BACK.y * DIST, target.z + BACK.z * DIST);
  camera.up.set(0, 1, 0);
  camera.lookAt(target);
  camera.left = -HALF; camera.right = HALF; camera.top = HALF; camera.bottom = -HALF;
  camera.near = 0.1; camera.far = DIST * 3;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();

  const root = new Group();
  scene.add(root);
  slabOn(root, s.top);
  if (s.desk) deskOn(root, s.desk);
  if (s.piano) {
    const p = makeObject('piano').group;
    p.scale.setScalar(s.piano.scale);
    p.position.set(s.piano.x, 0, s.piano.z);
    p.rotation.y = s.piano.turn;
    root.add(p);
  }
  castShadows(root);
  const first = s.frames[0];
  if (!first) throw new Error(`${s.id}: no frames`);
  const b: Bim = makeBim(first.bim.name, false, STYLE);
  castShadows(b.group);
  root.add(b.group);
  const notes: Group[] = [];

  const grab = (): HTMLCanvasElement => {
    view.render();
    const c = document.createElement('canvas');
    c.width = N;
    c.height = N;
    c.getContext('2d')?.drawImage(canvas, 0, 0);
    return c;
  };
  const island = root.children.filter((c) => c !== b.group);
  // the base: the island with the held bim's shadow on it, the bim itself unseen (it still casts)
  b.apply(s.frames[s.idle]?.bim.rig ?? first.bim.rig);
  unseen([b.group], true);
  const base = grab();
  unseen([b.group], false);
  const pixels = (c: HTMLCanvasElement): Uint8ClampedArray => c.getContext('2d')?.getImageData(0, 0, N, N).data ?? new Uint8ClampedArray(0);
  const basePx = pixels(base);

  // the frames: the bim (and the notes) alone, the island unseen but still in front where it is
  unseen(island, true);
  const full: HTMLCanvasElement[] = [];
  for (const f of s.frames) {
    b.apply(f.bim.rig);
    const ns = f.notes ?? [];
    while (notes.length < ns.length) {
      const n = makeNote();
      castShadows(n);
      n.rotation.y = Math.PI / 4;
      notes.push(n);
      root.add(n);
    }
    notes.forEach((n, i) => {
      const at = ns[i];
      n.visible = at !== undefined && at[3] < 1;
      if (!at) return;
      const [x, y, z, k] = at;
      n.position.set(x + Math.sin(k * 5) * 0.06, y + k * 0.5, z);
      n.scale.setScalar(0.8 + k * 0.4);
    });
    full.push(grab());
  }
  unseen(island, false);
  // the frames' box: what any of them draws, a few px around it
  const drawnBox = (c: HTMLCanvasElement): Box => boxOf(pixels(c), N, (d, i) => (d[i + 3] ?? 0) > 8);
  const at = grow(full.map(drawnBox).reduce(union), 4, N);
  const hit0 = drawnBox(full[s.idle] ?? base);
  const ink = grow(boxOf(basePx, N, (d, i) => (d[i + 3] ?? 0) > 8), 2, N);
  const all = union(ink, at);
  const crop = (c: HTMLCanvasElement, r: Box): HTMLCanvasElement => {
    const o = document.createElement('canvas');
    o.width = r.w;
    o.height = r.h;
    o.getContext('2d')?.drawImage(c, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
    return o;
  };
  // the slab's underside, projected into the base's pixels
  const under: number[] = [];
  const hw = SLAB.w / 2;
  for (const [x, z] of [[-hw, -hw], [hw, -hw], [hw, hw], [-hw, hw]] as const) {
    const p = new Vector3(x, -SLAB.top - SLAB.h + 0.02, z).project(camera);
    under.push(Math.round(((p.x + 1) / 2) * N - all.x), Math.round(((1 - p.y) / 2) * N - all.y));
  }
  const drawn: Drawn = {
    base: crop(base, all),
    at: { x: at.x - all.x, y: at.y - all.y, w: at.w, h: at.h },
    frames: full.map((c) => crop(c, at)),
    hit: { x: hit0.x - at.x, y: hit0.y - at.y, w: hit0.w, h: hit0.h },
    under,
  };
  b.dispose();
  view.dispose();
  return drawn;
}

/** unseen: drawn into depth only (it hides what is behind it, it still casts its shadow), no colour */
function unseen(objs: readonly Object3D[], on: boolean): void {
  for (const o of objs) {
    o.traverse((x) => {
      if (!(x instanceof Mesh)) return;
      const ms = (Array.isArray(x.material) ? x.material : [x.material]) as Material[];
      for (const m of ms) m.colorWrite = !on;
    });
  }
}

function boxOf(d: Uint8ClampedArray, n: number, on: (d: Uint8ClampedArray, i: number) => boolean): Box {
  let x0 = n, y0 = n, x1 = -1, y1 = -1;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!on(d, (y * n + x) * 4)) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? { x: 0, y: 0, w: 0, h: 0 } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function union(a: Box, b: Box): Box {
  if (a.w === 0) return b;
  if (b.w === 0) return a;
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

function grow(a: Box, k: number, n: number): Box {
  const x = Math.max(0, a.x - k), y = Math.max(0, a.y - k);
  // even sizes: the css size is half of it
  const w = Math.min(n - x, a.w + 2 * k), h = Math.min(n - y, a.h + 2 * k);
  return { x, y, w: w - (w % 2), h: h - (h % 2) };
}

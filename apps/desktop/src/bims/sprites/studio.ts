// The studio that draws bise.dev's home islands (gags.ts) with the app's own bims: a little clay
// island (the hero town's cube in miniature: a dirt slab, a top of floor or grass), its props (a tiny
// desk with a little window, the music family's upright piano, a beanbag, a whiteboard, a quarter
// pipe, a floor lamp and a pouf), its bims and their bits (notes, z's, sticky notes, the hero's paper
// plane, a book), in the town's 2:1 iso camera and the day palette's fixed light (the hero film's,
// TownOpts.themed by day), with the clay's soft sun shadow, on a transparent ground. Off screen, one
// canvas: the island alone (its base), then each frame with its bims, cropped to where any frame
// differs from the base; scripts/bims-sprites.mts packs them into WebP. Owner: bims-islands.
import { type DirectionalLight, ExtrudeGeometry, Group, type Material, Mesh, type Object3D, Shape, Vector3 } from 'three';
import { AZ, BACK, DIST } from '../render/camera';
import { makeBim, type Bim } from '../render/bim';
import { makeObject } from '../render/objects';
import { CREAM, GREEN, INK, PANE, PAPER, SKY, SLATE, SLATE_L, STEEL, TEAL, VIOLET, WOOD, WOOD_D, WOOD_L, YELLOW, darker, lighter, partOf } from '../render/objects/kit';
import { DAY, WORLD } from '../render/palette';
import { makePlane, type Plane } from '../render/plane';
import { STYLE } from '../render/style';
import { makeView } from '../render/view';
import { castShadows } from '../render/world';
import { type Bit, type Island, type Prop, SLAB } from './gags';

/** px per office unit on the sheet (2x: 64 css px a unit, the island ~200 css px wide) */
export const PX = 128;
/** half the view's size, office units: the island and what stands on it fit inside */
const HALF = 2.3;
/** the sun: from the upper left, in front (the town's: its left side lit, its right in the shade) */
const SUN = new Vector3(-2, 9, 3.5);
const NOTE = WORLD.gold;
/** the sticky notes' colours, by Bit.n */
const STICKY = [YELLOW, SKY, GREEN] as const;
const BEANBAG = VIOLET;
const POUF = TEAL;
const BOOK = SKY;
/** the lamp's shade, warm (a light yellow, lit from inside) */
const SHADE = lighter(YELLOW, 0.45);
/** every colour the studio adds to the app's (the palette law checks them: never the accent pink or the error red) */
export const STUDIO_COLOURS: readonly string[] = [NOTE, CREAM, INK, PANE, PAPER, SLATE, SLATE_L, STEEL, WOOD, WOOD_D, WOOD_L, ...STICKY, BEANBAG, POUF, BOOK, SHADE];

export interface Box { readonly x: number; readonly y: number; readonly w: number; readonly h: number }

export interface Drawn {
  /** the island alone, cropped to its ink */
  readonly base: HTMLCanvasElement;
  /** each frame's box in the base (px, 2x), the same for all */
  readonly at: Box;
  readonly frames: HTMLCanvasElement[];
  /** the bims' own box in their frame at the held pose (px, 2x): their hit area */
  readonly hit: Box;
  /** the slab's underside's four corners in the base (px, 2x): its shadow on the page */
  readonly under: readonly number[];
}

const OPTS = { off: false, night: 0, n: 5 } as const;

/** a tiny desk: wooden top on four legs, a little app window standing on its back half */
function deskOn(root: Group, d: Extract<Prop, { kind: 'desk' }>): void {
  const g = partOf(root, OPTS);
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

/** a whiteboard on two legs, its front to `turn`: a white face in a steel frame, a tray for its markers */
function boardOn(root: Group, b: Extract<Prop, { kind: 'board' }>): void {
  const g = partOf(root, OPTS).at(b.x, 0, b.z);
  g.root.rotation.y = b.turn;
  const W = 1.05, H = 0.66;
  for (const x of [-W / 2 + 0.03, W / 2 - 0.03]) {
    g.box(0.05, b.mid + H / 2, 0.05, SLATE_L, x, (b.mid + H / 2) / 2, -0.04, 0.015);
    g.box(0.07, 0.04, 0.36, SLATE_L, x, 0.02, -0.04, 0.015);
  }
  g.box(W + 0.05, H + 0.05, 0.035, STEEL, 0, b.mid, 0, 0.015);
  g.box(W - 0.02, H - 0.02, 0.012, CREAM, 0, b.mid, 0.02, 0.004);
  g.box(W * 0.8, 0.025, 0.07, STEEL, 0, b.mid - H / 2 - 0.02, 0.04, 0.008);
  for (const [x, c] of [[-0.2, SKY], [-0.12, INK]] as const) { const m = g.cyl(0.013, 0.09, c, x, b.mid - H / 2 + 0.01, 0.05); m.rotation.z = Math.PI / 2; }
}

/** a beanbag: a soft squashed ball, dented where its sleeper sits */
function beanbagOn(root: Group, b: Extract<Prop, { kind: 'beanbag' }>): void {
  const g = partOf(root, OPTS);
  g.contact(1.0, 1.0, b.x, b.z);
  g.ball(0.52, BEANBAG, b.x, 0.22, b.z).scale.set(1.05, 0.5, 1.05);
  g.ball(0.36, lighter(BEANBAG, 0.12), b.x, 0.34, b.z).scale.set(1, 0.55, 1);
}

/** a little quarter pipe, rising away from its front (`turn`): its curve and deck in one wooden piece (its side shows the curve), a steel coping */
function rampOn(root: Group, r: Extract<Prop, { kind: 'ramp' }>): void {
  const R = 0.5, W = 0.9, DECK_D = 0.2, N = 16;
  // the profile: s back from the front, y up; the curve's foot at s 0
  const shape = new Shape();
  shape.moveTo(0, 0);
  for (let i = 1; i <= N; i++) {
    const a = (i / N) * (Math.PI / 2);
    shape.lineTo(R * Math.sin(a), R * (1 - Math.cos(a)));
  }
  shape.lineTo(R + DECK_D, R);
  shape.lineTo(R + DECK_D, 0);
  shape.lineTo(0, 0);
  const geo = new ExtrudeGeometry(shape, { depth: W, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2, curveSegments: 4 });
  geo.translate(0, 0, -W / 2);
  const g = partOf(root, OPTS).at(r.x, 0, r.z);
  g.root.rotation.y = r.turn;
  g.contact(W + 0.1, R + DECK_D + 0.1, 0, -(R + DECK_D) / 2);
  // s back (local -z), the width along local x
  const ramp = new Mesh(geo, STYLE.material(WOOD));
  ramp.rotation.y = Math.PI / 2;
  g.root.add(ramp);
  const c = g.cyl(0.025, W + 0.02, STEEL, 0, R + 0.02, -R + 0.01);
  c.rotation.z = Math.PI / 2;
}

/** a floor lamp: a round foot, a thin pole, a warm shade lit from inside */
function lampOn(root: Group, l: Extract<Prop, { kind: 'lamp' }>): void {
  const g = partOf(root, OPTS).at(l.x, 0, l.z);
  g.contact(0.36, 0.36);
  g.cyl(0.16, 0.035, SLATE, 0, 0.018, 0);
  g.box(0.035, 1.38, 0.035, SLATE, 0, 0.72, 0, 0.012);
  g.ball(0.05, YELLOW, 0, 1.36, 0, 1.2);
  g.cyl(0.19, 0.22, SHADE, 0, 1.44, 0, 0.5);
  g.cyl(0.13, 0.012, darker(CREAM, 0.9), 0, 1.56, 0);
}

/** a round pouf to sit on */
function poufOn(root: Group, p: Extract<Prop, { kind: 'pouf' }>): void {
  const g = partOf(root, OPTS);
  g.contact(0.62, 0.62, p.x, p.z);
  g.cyl(0.27, p.h - 0.03, POUF, p.x, (p.h - 0.03) / 2, p.z);
  g.cyl(0.25, 0.04, lighter(POUF, 0.18), p.x, p.h - 0.02, p.z);
}

function propOn(root: Group, p: Prop): void {
  switch (p.kind) {
    case 'desk': deskOn(root, p); return;
    case 'board': boardOn(root, p); return;
    case 'beanbag': beanbagOn(root, p); return;
    case 'ramp': rampOn(root, p); return;
    case 'lamp': lampOn(root, p); return;
    case 'pouf': poufOn(root, p); return;
    case 'piano': {
      const m = makeObject('piano').group;
      m.scale.setScalar(p.scale);
      m.position.set(p.x, 0, p.z);
      m.rotation.y = p.turn;
      root.add(m);
    }
  }
}

/** a music note: a head and a stem in gold */
function makeNote(): Group {
  const g = new Group();
  const p = partOf(g, OPTS);
  g.rotation.y = Math.PI / 4;
  p.ball(0.05, NOTE, 0, 0, 0).scale.set(1.2, 0.85, 0.7);
  p.box(0.018, 0.17, 0.018, NOTE, 0.05, 0.085, 0, 0);
  p.box(0.06, 0.02, 0.018, NOTE, 0.075, 0.16, 0, 0).rotation.z = -0.5;
  return g;
}

/** a sleeper's z: three strokes, facing the page */
function makeZ(): Group {
  const g = new Group();
  const p = partOf(g, OPTS);
  const s = 0.11;
  p.box(s, 0.022, 0.02, SLATE_L, 0, s / 2, 0, 0.006);
  p.box(s, 0.022, 0.02, SLATE_L, 0, -s / 2, 0, 0.006);
  p.box(Math.hypot(s, s) * 0.95, 0.022, 0.02, SLATE_L, 0, 0, 0, 0.006).rotation.z = Math.PI / 4;
  g.rotation.y = AZ;
  return g;
}

function makeSticky(n: number): Group {
  const g = new Group();
  const inner = new Group();
  g.add(inner);
  partOf(inner, OPTS).box(0.17, 0.17, 0.012, STICKY[n % STICKY.length] ?? YELLOW, 0, 0, 0, 0.004);
  return g;
}

/** a small open book: its cover toward the page, its pages toward its reader; one page turns about the spine */
function makeBook(): { g: Group; page: Group } {
  const g = new Group();
  const p = partOf(g, OPTS);
  for (const s of [-1, 1]) {
    const half = p.at(0, 0, 0);
    half.root.rotation.y = s * 0.35;
    half.box(0.13, 0.19, 0.012, BOOK, s * 0.065, 0, 0, 0.004);
    half.box(0.12, 0.175, 0.012, PAPER, s * 0.062, 0, -0.012, 0.003);
  }
  const page = new Group();
  g.add(page);
  partOf(page, OPTS).box(0.12, 0.175, 0.006, CREAM, 0.06, 0, -0.022, 0.002);
  return { g, page };
}

/** the bits' pools: one mesh per bit drawn in a frame, by kind, hidden when a frame has fewer */
interface Pools {
  note: Group[];
  z: Group[];
  sticky: Group[];
  plane: Plane[];
  book: { g: Group; page: Group }[];
}

function placeBits(root: Group, pools: Pools, bits: readonly Bit[]): void {
  const used = { note: 0, z: 0, plane: 0, book: 0 };
  const stuck = new Set<number>();
  for (const b of bits) {
    const [x, y, z] = b.at;
    switch (b.kind) {
      case 'note': {
        const n = pools.note[used.note++] ?? more(root, pools.note, makeNote);
        n.visible = b.k < 1;
        n.position.set(x + Math.sin(b.k * 5) * 0.06, y + b.k * 0.5, z);
        n.scale.setScalar(0.8 + b.k * 0.4);
        break;
      }
      case 'z': {
        const n = pools.z[used.z++] ?? more(root, pools.z, makeZ);
        n.visible = true;
        n.position.set(x + Math.sin(b.k * 4) * 0.05, y, z);
        n.scale.setScalar(0.6 + b.k * 0.6);
        break;
      }
      case 'sticky': {
        while (pools.sticky.length <= b.n) more(root, pools.sticky, () => makeSticky(pools.sticky.length));
        const s = pools.sticky[b.n] as Group;
        stuck.add(b.n);
        s.visible = true;
        s.position.set(x, y, z);
        s.rotation.set(0, b.turn, 0);
        (s.children[0] as Group).rotation.z = b.tilt;
        break;
      }
      case 'plane': {
        const p = pools.plane[used.plane++] ?? morePlane(root, pools.plane);
        p.group.visible = true;
        p.group.position.set(x, y, z);
        p.group.rotation.set(-b.pitch, b.dir, 0, 'YXZ');
        p.setFold(b.fold);
        break;
      }
      case 'book': {
        const k = pools.book[used.book++] ?? moreBook(root, pools.book);
        k.g.visible = true;
        k.g.position.set(x, y, z);
        // its pages toward its reader, tilted back toward its eyes
        k.g.rotation.set(-0.45, b.dir + Math.PI, 0, 'YXZ');
        k.page.rotation.y = -0.35 + b.flip * Math.PI * 0.98;
        break;
      }
    }
  }
  pools.note.forEach((n, i) => { n.visible &&= i < used.note; });
  pools.z.forEach((n, i) => { n.visible = i < used.z; });
  pools.sticky.forEach((n, i) => { n.visible = stuck.has(i); });
  pools.plane.forEach((n, i) => { n.group.visible = i < used.plane; });
  pools.book.forEach((n, i) => { n.g.visible = i < used.book; });
}

function more(root: Group, pool: Group[], make: () => Group): Group {
  const g = make();
  castShadows(g);
  root.add(g);
  pool.push(g);
  return g;
}

function moreBook(root: Group, pool: Pools['book']): Pools['book'][number] {
  const b = makeBook();
  castShadows(b.g);
  root.add(b.g);
  pool.push(b);
  return b;
}

function morePlane(root: Group, pool: Plane[]): Plane {
  const p = makePlane(STYLE);
  p.setInk(true);
  p.group.scale.setScalar(0.45);
  castShadows(p.group);
  root.add(p.group);
  pool.push(p);
  return p;
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
  for (const p of s.props) propOn(root, p);
  castShadows(root);
  const island = [...root.children];
  const first = s.frames[0];
  if (!first) throw new Error(`${s.id}: no frames`);
  const bims: Bim[] = first.bims.map((a) => {
    const b = makeBim(a.name, false, STYLE);
    castShadows(b.group);
    root.add(b.group);
    return b;
  });
  const movers = new Group();
  root.add(movers);
  const pools: Pools = { note: [], z: [], sticky: [], plane: [], book: [] };
  const pose = (i: number): void => {
    const f = s.frames[i] ?? first;
    bims.forEach((b, k) => { const a = f.bims[k]; if (a) b.apply(a.rig); });
    placeBits(movers, pools, f.bits ?? []);
  };

  const grab = (): HTMLCanvasElement => {
    view.render();
    const c = document.createElement('canvas');
    c.width = N;
    c.height = N;
    c.getContext('2d')?.drawImage(canvas, 0, 0);
    return c;
  };
  const moving = [...bims.map((b) => b.group), movers];
  // the base: the island with the held pose's shadows on it, the bims and their bits unseen (they still cast)
  pose(s.idle);
  unseen(moving, true);
  const base = grab();
  unseen(moving, false);
  const pixels = (c: HTMLCanvasElement): Uint8ClampedArray => c.getContext('2d')?.getImageData(0, 0, N, N).data ?? new Uint8ClampedArray(0);
  const basePx = pixels(base);

  // the frames: the bims and their bits alone, the island unseen but still in front where it is
  unseen(island, true);
  const full: HTMLCanvasElement[] = [];
  for (let i = 0; i < s.frames.length; i++) {
    pose(i);
    unseen(moving, false);
    full.push(grab());
  }
  unseen(island, false);
  // the frames' box: what any of them draws, a few px around it
  const drawnBox = (c: HTMLCanvasElement): Box => boxOf(pixels(c), N, (d, i) => (d[i + 3] ?? 0) > 8);
  const at = growBox(full.map(drawnBox).reduce(union), 4, N);
  const hit0 = drawnBox(full[s.idle] ?? base);
  const ink = growBox(boxOf(basePx, N, (d, i) => (d[i + 3] ?? 0) > 8), 2, N);
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
  for (const b of bims) b.dispose();
  for (const p of pools.plane) p.dispose();
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

function growBox(a: Box, k: number, n: number): Box {
  const x = Math.max(0, a.x - k), y = Math.max(0, a.y - k);
  // even sizes: the css size is half of it
  const w = Math.min(n - x, a.w + 2 * k), h = Math.min(n - y, a.h + 2 * k);
  return { x, y, w: w - (w % 2), h: h - (h % 2) };
}

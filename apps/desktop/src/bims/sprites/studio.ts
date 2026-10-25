// The studio that draws bise.dev's home gags (gags.ts) with the app's own bims: render/bim.ts in
// the clay style, the music family's upright piano (objects/music.ts), on a transparent ground,
// in the day palette's fixed light (the hero film's, TownOpts.themed by day). Off screen, one
// canvas: each frame is drawn and copied out; scripts/bims-sprites.mts packs them into WebP sheets.
// Owner: bims-home.
import { ConeGeometry, Group, Mesh, MeshStandardMaterial, Vector3, type Object3D } from 'three';
import { makeBim, type Bim } from '../render/bim';
import { makeObject } from '../render/objects';
import { DAY, WORLD } from '../render/palette';
import { STYLE } from '../render/style';
import { makeView } from '../render/view';
import { FRAME_H, type Actor, type Frame, type Sheet } from './gags';

/** the camera's height over the page: a little from above, as the app's office is */
const EL = (12 * Math.PI) / 180;
/** the sun: from the upper left, in front */
const SUN = new Vector3(-2.5, 5, 6);
/** the pencil's colours (the objects' kit yellow, its wood, its graphite) */
const PENCIL = '#ffcc4d';
const WOOD = '#f1d3a1';
const GRAPHITE = '#5b544d';
const BOOK = ['#2a9d8f', '#fffaf0'] as const;
const NOTE = WORLD.gold;
/** every colour the studio adds to the app's (the palette law checks them: never the accent pink or the error red) */
export const STUDIO_COLOURS: readonly string[] = [PENCIL, WOOD, GRAPHITE, ...BOOK, NOTE];

export interface Drawn {
  /** css px */
  readonly w: number;
  readonly h: number;
  /** the anchor (the sheet's origin) in the frame, css px from its top left */
  readonly ax: number;
  readonly ay: number;
  readonly frames: HTMLCanvasElement[];
}

/** a pencil along the hand's marker (bim.ts draws a marker there for 'think'): yellow, its sharpened wood and lead */
function pencilOn(b: Bim): void {
  const marker = new Set<Object3D>();
  b.group.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    const m: unknown = o.material;
    if (m instanceof MeshStandardMaterial && m.color.getHexString() === WORLD.marker.slice(1)) marker.add(o);
  });
  for (const m of marker) {
    if (!(m instanceof Mesh)) continue;
    const was: unknown = m.material;
    if (!(was instanceof MeshStandardMaterial)) continue;
    const yellow = was.clone();
    yellow.color.set(PENCIL);
    m.material = yellow;
    m.scale.set(0.7, 1.5, 0.7);
    const wood = new Mesh(new ConeGeometry(0.02, 0.05, 10), STYLE.material(WOOD));
    wood.position.y = -0.105 / 1.5;
    wood.rotation.x = Math.PI;
    wood.scale.set(1 / 0.7, 1 / 1.5, 1 / 0.7);
    const lead = new Mesh(new ConeGeometry(0.008, 0.02, 8), STYLE.material(GRAPHITE));
    lead.position.y = -0.14 / 1.5;
    lead.rotation.x = Math.PI;
    lead.scale.set(1 / 0.7, 1 / 1.5, 1 / 0.7);
    m.add(wood, lead);
  }
}

/** a small book held before its chest: two covers about the spine, its pages, one turning */
function makeBook(): { group: Group; set(open: number, page: number): void } {
  const group = new Group();
  const cover = STYLE.material(BOOK[0]);
  const paper = STYLE.material(BOOK[1]);
  const half = (side: number): Group => {
    const h = new Group();
    const c = new Mesh(STYLE.box(0.16, 0.22, 0.012), cover);
    c.position.set(side * 0.08, 0, 0);
    const p = new Mesh(STYLE.box(0.145, 0.2, 0.02), paper);
    p.position.set(side * 0.077, 0, 0.012);
    h.add(c, p);
    group.add(h);
    return h;
  };
  const l = half(-1);
  const r = half(1);
  const leaf = new Group();
  const lp = new Mesh(STYLE.box(0.14, 0.2, 0.004), paper);
  lp.position.set(0.072, 0, 0.026);
  leaf.add(lp);
  group.add(leaf);
  return {
    group,
    set(open, page) {
      // shut: both halves together, the cover out; open: flat as a V toward its face
      const a = (1 - open) * (Math.PI / 2) + 0.35;
      l.rotation.y = a;
      r.rotation.y = -a;
      leaf.visible = open > 0.9 && page > 0 && page < 1;
      leaf.rotation.y = -a - Math.PI * page + 0.0;
    },
  };
}

/** a music note: a head and a stem in gold */
function makeNote(): Group {
  const g = new Group();
  const head = new Mesh(STYLE.ball(0.05), STYLE.material(NOTE));
  head.scale.set(1.2, 0.85, 0.7);
  const stem = new Mesh(STYLE.box(0.018, 0.17, 0.018), STYLE.material(NOTE));
  stem.position.set(0.05, 0.085, 0);
  const flag = new Mesh(STYLE.box(0.06, 0.02, 0.018), STYLE.material(NOTE));
  flag.position.set(0.075, 0.16, 0);
  flag.rotation.z = -0.5;
  g.add(head, stem, flag);
  return g;
}

/** px per office unit on the sheet (2x: 96 css px tall = 192 px) */
export const PX = 192 / FRAME_H;

export function drawSheet(s: Sheet, frames: readonly Frame[]): Drawn {
  const W = Math.round((s.x1 - s.x0) * PX);
  const H = Math.round(FRAME_H * PX);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const view = makeView(canvas, { shadowAuto: false, transparent: true });
  view.renderer.setPixelRatio(1);
  view.renderer.setSize(W, H, false);
  view.renderer.shadowMap.enabled = false;
  view.tint(DAY);
  view.sky(DAY.bg);
  view.sun.position.copy(SUN);
  view.sun.target.position.set(0, 0, 0);
  const { camera, scene } = view;
  // the window: its centre on the page plane (z 0), the camera a little above, looking down EL
  const cx = (s.x0 + s.x1) / 2;
  const cy = s.y0 + FRAME_H / 2;
  const back = new Vector3(0, Math.sin(EL), Math.cos(EL)).multiplyScalar(30);
  camera.position.set(cx, cy, 0).add(back);
  camera.up.set(0, 1, 0);
  camera.lookAt(cx, cy, 0);
  camera.left = -(s.x1 - s.x0) / 2;
  camera.right = (s.x1 - s.x0) / 2;
  camera.top = FRAME_H / 2;
  camera.bottom = -FRAME_H / 2;
  camera.near = 0.1;
  camera.far = 80;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();

  const root = new Group();
  scene.add(root);
  if (s.piano) {
    const p = makeObject('piano').group;
    p.scale.setScalar(s.piano.scale);
    p.position.set(s.piano.x, 0, s.piano.z);
    p.rotation.y = s.piano.turn;
    // its contact shadow lies on a floor the page doesn't have
    p.traverse((o) => { if (o.userData.contact === true) o.visible = false; });
    root.add(p);
  }
  const bims = new Map<string, { bim: Bim; book: ReturnType<typeof makeBook> | null }>();
  const bimOf = (a: Actor): { bim: Bim; book: ReturnType<typeof makeBook> | null } => {
    let b = bims.get(a.name);
    if (!b) {
      const bim = makeBim(a.name, false, STYLE);
      if (a.pencil === true) pencilOn(bim);
      let book: ReturnType<typeof makeBook> | null = null;
      if (frames.some((f) => f.bims.some((x) => x.name === a.name && x.book))) {
        book = makeBook();
        // in its hands, before its chest (the body is the bim's first child: bim.ts)
        const body = bim.group.children[0];
        book.group.position.set(0, 0.5, 0.36);
        book.group.rotation.x = -0.75;
        body?.add(book.group);
      }
      b = { bim, book };
      bims.set(a.name, b);
      root.add(bim.group);
    }
    return b;
  };
  const notes: Group[] = [];
  const marks: Mesh[] = [];
  const graphite = STYLE.material(GRAPHITE);
  for (let i = 0; i < 3; i++) {
    // a note's three lines on the page beside its seat, above the edge, as the pencil leaves them
    const m = new Mesh(STYLE.box([0.2, 0.14, 0.17][i] ?? 0.2, 0.014, 0.004), graphite);
    m.position.set(0.62 + (i === 1 ? -0.02 : 0), 0.2 - i * 0.065, 0.05);
    m.rotation.z = [0.05, -0.04, 0.03][i] ?? 0;
    marks.push(m);
    root.add(m);
  }

  const out: HTMLCanvasElement[] = [];
  for (const f of frames) {
    const shown = new Set(f.bims.map((a) => a.name));
    for (const a of f.bims) {
      const b = bimOf(a);
      b.bim.apply(a.rig);
      b.bim.group.visible = true;
      if (b.book) {
        b.book.group.visible = a.book !== undefined;
        if (a.book) b.book.set(a.book.open, a.book.page);
      }
    }
    for (const [name, b] of bims) if (!shown.has(name)) b.bim.group.visible = false;
    const ns = f.notes ?? [];
    while (notes.length < ns.length) {
      const n = makeNote();
      notes.push(n);
      root.add(n);
    }
    notes.forEach((n, i) => {
      const at = ns[i];
      n.visible = at !== undefined && at[2] < 1;
      if (!at) return;
      const [x, y, k] = at;
      n.position.set(x + Math.sin(k * 5) * 0.06, y + k * 0.5, 0.2);
      n.scale.setScalar(0.8 + k * 0.4);
    });
    marks.forEach((m, i) => { m.visible = i < (f.marks ?? 0); });
    view.render();
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    c.getContext('2d')?.drawImage(canvas, 0, 0);
    out.push(c);
  }

  const a = new Vector3(0, 0, 0).project(camera);
  const drawn: Drawn = { w: W / 2, h: H / 2, ax: ((a.x + 1) / 2) * W / 2, ay: ((1 - a.y) / 2) * H / 2, frames: out };
  for (const b of bims.values()) b.bim.dispose();
  view.dispose();
  return drawn;
}

/** the box (css px in the frame) of what a frame draws: the bim alone, for its hit area */
export function inkBox(c: HTMLCanvasElement): { x: number; y: number; w: number; h: number } {
  const ctx = c.getContext('2d');
  if (!ctx) return { x: 0, y: 0, w: 0, h: 0 };
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if ((data[(y * c.width + x) * 4 + 3] ?? 0) < 40) continue;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
  }
  if (x1 < x0) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: Math.floor(x0 / 2), y: Math.floor(y0 / 2), w: Math.ceil((x1 - x0 + 1) / 2), h: Math.ceil((y1 - y0 + 1) / 2) };
}


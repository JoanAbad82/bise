// One home island as a three scene (gags.ts's data, the app's own bims): its slab (a dirt block and
// a top of floor or grass, the hero town's cube in miniature), its props each in its own group (a
// tiny desk with a little window, the music family's upright piano, a beanbag, a quarter pipe, a
// floor lamp and a pouf), its bims and the bits that move with them (notes, z's, a sleep bubble, the
// hero's paper plane, a book), and the day sun that lights them (the hero film's, on both themes).
// Two drawers share it: studio.ts (the WebP sprites, the no-WebGL fallback) and the hero bundle's
// live islands (src/hero/islands.ts, page bims-home v11). Units are the office's (gags.ts). Owner: bims-islands.
import { type DirectionalLight, ExtrudeGeometry, Group, type Material, Mesh, type MeshStandardMaterial, Shape, Vector3 } from 'three';
import { AZ } from '../render/camera';
import { makeBim, type Bim } from '../render/bim';
import { MUSIC } from '../render/objects/music';
import { CREAM, INK, PANE, PAPER, SKY, SLATE, SLATE_L, STEEL, TEAL, VIOLET, WOOD, WOOD_D, WOOD_L, YELLOW, darker, lighter, partOf } from '../render/objects/kit';
import { DAY, WORLD } from '../render/palette';
import { makePlane, type Plane } from '../render/plane';
import { STYLE } from '../render/style';
import { castShadows } from '../render/world';
import { type Bit, type Frame, type Island, type Prop, SLAB } from './gags';

/** half the view's size, office units: the island and what stands on it fit inside */
export const HALF = 2.3;
/** what the camera looks at: the island's middle, a little over its top */
export const TARGET = new Vector3(0, 0.45, 0);
/** the sun: from the upper left, in front (the town's: its left side lit, its right in the shade) */
const SUN = new Vector3(-2, 9, 3.5);
const NOTE = WORLD.gold;
const BEANBAG = VIOLET;
const POUF = TEAL;
const BOOK = SKY;
/** the lamp's shade, warm (a light yellow, lit from inside) */
const SHADE = lighter(YELLOW, 0.45);
/** the sleep bubble: the sky's paler blue, see-through */
const BUBBLE = lighter(SKY, 0.55);
/** every colour the island adds to the app's (the palette law checks them: never the accent pink or the error red) */
export const SCENE_COLOURS: readonly string[] = [NOTE, CREAM, INK, PANE, PAPER, SLATE, SLATE_L, STEEL, WOOD, WOOD_D, WOOD_L, BEANBAG, POUF, BOOK, SHADE, BUBBLE];

const OPTS = { off: false, night: 0, n: 5 } as const;
/** the lamp shade's glow at rest */
const SHADE_GLOW = 0.5;

/** a mesh's own copy of its material (kit.ts shares one per colour), glowing in its colour by `glow(k)` */
function ownGlow(m: Mesh, rest: number, most: number): (k: number) => void {
  const own = (m.material as MeshStandardMaterial).clone();
  own.emissive.copy(own.color);
  own.emissiveIntensity = rest;
  m.material = own;
  return (k) => { own.emissiveIntensity = rest + (most - rest) * k; };
}

/** a tiny desk: wooden top on four legs, a little app window standing on its back half; its window lights up */
function deskOn(root: Group, d: Extract<Prop, { kind: 'desk' }>): (k: number) => void {
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
  const face = w.box(W, H, 0.035, CREAM, 0, y, 0, 0.02);
  w.box(W - 0.02, 0.06, 0.01, STEEL, 0, y + H / 2 - 0.04, 0.02, 0.005);
  for (let i = 0; i < 3; i++) w.ball(0.012, SLATE_L, -W / 2 + 0.05 + i * 0.035, y + H / 2 - 0.04, 0.027);
  const side = w.box(0.14, H - 0.1, 0.01, PANE, -W / 2 + 0.09, y - 0.04, 0.02, 0.005);
  for (let i = 0; i < 3; i++) w.box([0.3, 0.24, 0.27][i] ?? 0.3, 0.025, 0.01, SLATE_L, 0.06 - (i === 1 ? 0.03 : 0), y + 0.06 - i * 0.08, 0.02, 0.004);
  const a = ownGlow(face, 0, 0.55);
  const b = ownGlow(side, 0, 0.8);
  return (k) => { a(k); b(k); };
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

/** a floor lamp: a round foot, a thin pole, a warm shade lit from inside; it flicks brighter */
function lampOn(root: Group, l: Extract<Prop, { kind: 'lamp' }>): (k: number) => void {
  const g = partOf(root, OPTS).at(l.x, 0, l.z);
  g.contact(0.36, 0.36);
  g.cyl(0.16, 0.035, SLATE, 0, 0.018, 0);
  g.box(0.035, 1.38, 0.035, SLATE, 0, 0.72, 0, 0.012);
  const bulb = g.ball(0.05, YELLOW, 0, 1.36, 0, 1.2);
  const shade = g.cyl(0.19, 0.22, SHADE, 0, 1.44, 0, SHADE_GLOW);
  g.cyl(0.13, 0.012, darker(CREAM, 0.9), 0, 1.56, 0);
  const a = ownGlow(shade, SHADE_GLOW, 1.5);
  const b = ownGlow(bulb, 1.2, 2.4);
  return (k) => { a(k); b(k); };
}

/** a round pouf to sit on */
function poufOn(root: Group, p: Extract<Prop, { kind: 'pouf' }>): void {
  const g = partOf(root, OPTS);
  g.contact(0.62, 0.62, p.x, p.z);
  g.cyl(0.27, p.h - 0.03, POUF, p.x, (p.h - 0.03) / 2, p.z);
  g.cyl(0.25, 0.04, lighter(POUF, 0.18), p.x, p.h - 0.02, p.z);
}

/** a prop in its own group (the live island drops each on its own); what it lights, if anything */
function propOn(root: Group, p: Prop): { g: Group; glow: ((k: number) => void) | null } {
  const g = new Group();
  root.add(g);
  switch (p.kind) {
    case 'desk': return { g, glow: deskOn(g, p) };
    case 'lamp': return { g, glow: lampOn(g, p) };
    case 'beanbag': beanbagOn(g, p); break;
    case 'ramp': rampOn(g, p); break;
    case 'pouf': poufOn(g, p); break;
    case 'piano': {
      // the music family's maker alone (objects/index.ts makeObject's way: centred on its foot), not the
      // whole registry: the live islands' chunk stays small
      const m = new Group();
      const inner = new Group();
      m.add(inner);
      const foot = MUSIC.piano(partOf(inner, { ...OPTS, seed: 0 }), { ...OPTS, seed: 0 });
      inner.position.set(-(foot.x ?? 0), 0, -(foot.z ?? 0));
      m.scale.setScalar(p.scale);
      m.position.set(p.x, 0, p.z);
      m.rotation.y = p.turn;
      g.add(m);
    }
  }
  return { g, glow: null };
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

/** a sleep bubble: a see-through ball with a small z inside */
function makeBubble(): Group {
  const g = new Group();
  const ball = new Mesh(STYLE.ball(0.1), STYLE.material(BUBBLE, { opacity: 0.45 }));
  (ball.material).depthWrite = false;
  ball.userData.noShadow = true;
  g.add(ball);
  const z = makeZ();
  z.scale.setScalar(0.6);
  g.add(z);
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
  bubble: Group[];
  plane: Plane[];
  book: { g: Group; page: Group }[];
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

function placeBits(root: Group, pools: Pools, bits: readonly Bit[]): void {
  const used = { note: 0, z: 0, bubble: 0, plane: 0, book: 0 };
  for (const b of bits) {
    const [x, y, z] = b.at;
    switch (b.kind) {
      case 'note': {
        const n = pools.note[used.note++] ?? more(root, pools.note, makeNote);
        n.visible = b.k < 1;
        n.position.set(x + Math.sin(b.k * 5) * 0.06, y + b.k * 0.5, z);
        n.scale.setScalar((0.8 + b.k * 0.4) * (b.fade ?? 1));
        break;
      }
      case 'z': {
        const n = pools.z[used.z++] ?? more(root, pools.z, makeZ);
        n.visible = true;
        n.position.set(x + Math.sin(b.k * 4) * 0.05, y, z);
        n.scale.setScalar(0.6 + b.k * 0.6);
        break;
      }
      case 'bubble': {
        const n = pools.bubble[used.bubble++] ?? more(root, pools.bubble, makeBubble);
        n.visible = b.k < 1;
        n.position.set(x, y + b.k * 0.15, z);
        // it swells, then a quick burst past its size just before it goes
        const s = b.k < 0.85 ? 0.3 + b.k * 0.9 : 1.1 + (b.k - 0.85) * 4;
        n.scale.setScalar(s);
        break;
      }
      case 'plane': {
        const p = pools.plane[used.plane++] ?? morePlane(root, pools.plane);
        p.group.visible = true;
        p.group.position.set(x, y, z);
        p.group.rotation.set(-b.pitch, b.dir, b.roll ?? 0, 'YXZ');
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
  pools.bubble.forEach((n, i) => { n.visible &&= i < used.bubble; });
  pools.plane.forEach((n, i) => { n.group.visible = i < used.plane; });
  pools.book.forEach((n, i) => { n.g.visible = i < used.book; });
}

/** the island's slab: the dirt's rounded block, its top's layer (the town's cube in miniature) */
function slabOn(root: Group, top: Island['top']): Mesh[] {
  const dirt = new Mesh(STYLE.box(SLAB.w, SLAB.h, SLAB.w, SLAB.r), STYLE.material(DAY.dirt));
  dirt.position.y = -SLAB.top - SLAB.h / 2 + 0.02;
  const lid = new Mesh(STYLE.box(SLAB.w, SLAB.top, SLAB.w, 0.04), STYLE.material(topColour(top)));
  lid.position.y = -SLAB.top / 2;
  root.add(dirt, lid);
  return [dirt, lid];
}

/** the island's top's colour */
export const topColour = (top: Island['top']): string => (top === 'grass' ? DAY.grass : DAY.floor);

/** the island's sun: its place over the island and its soft shadow (a map of `mapSize` px) */
export function sunOn(sun: DirectionalLight, mapSize: number): void {
  sun.position.copy(SUN);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mapSize, mapSize);
  sun.shadow.radius = 4;
  sun.shadow.bias = -0.0005;
  const sc = sun.shadow.camera;
  sc.left = -3; sc.right = 3; sc.top = 3; sc.bottom = -3; sc.near = 0.1; sc.far = 20;
  sc.updateProjectionMatrix();
}

export interface IslandScene {
  /** everything; the live island tilts it */
  readonly root: Group;
  /** the slab's dirt and top */
  readonly slab: readonly Mesh[];
  /** each prop's own group, in the island's order */
  readonly props: readonly Group[];
  readonly bims: readonly Bim[];
  /** what moves with the bims (their bits) */
  readonly movers: Group;
  /** what the scene lights up on a hover (the desk's window, the lamp): 0 at rest .. 1 its brightest */
  glow(k: number): void;
  /** the bims and their bits at this frame */
  pose(f: Frame): void;
  dispose(): void;
}

export function buildIsland(s: Island): IslandScene {
  const root = new Group();
  const slab = slabOn(root, s.top);
  const built = s.props.map((p) => propOn(root, p));
  castShadows(root);
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
  const pools: Pools = { note: [], z: [], bubble: [], plane: [], book: [] };
  const glows = built.flatMap((b) => (b.glow ? [b.glow] : []));
  return {
    root,
    slab,
    props: built.map((b) => b.g),
    bims,
    movers,
    glow: (k) => { for (const g of glows) g(k); },
    pose(f) {
      bims.forEach((b, k) => { const a = f.bims[k]; if (a) b.apply(a.rig); });
      placeBits(movers, pools, f.bits ?? []);
    },
    dispose() {
      for (const b of bims) b.dispose();
      for (const p of pools.plane) p.dispose();
      root.traverse((o) => {
        if (o instanceof Mesh) (o as Mesh).geometry.dispose();
      });
    },
  };
}

/** a material's colour write: unseen draws into depth only (it hides what is behind it, it still casts its shadow) */
export function seen(objs: readonly { traverse(f: (x: unknown) => void): void }[], on: boolean): void {
  for (const o of objs) {
    o.traverse((x) => {
      if (!(x instanceof Mesh)) return;
      const ms = (Array.isArray(x.material) ? x.material : [x.material]) as Material[];
      for (const m of ms) m.colorWrite = on;
    });
  }
}

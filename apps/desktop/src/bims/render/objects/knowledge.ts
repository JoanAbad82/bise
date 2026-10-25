// The objects of the knowledge family: the books (a skills folder's shelf, a book per skill; Notion's library, the shelf its compact one), web search's telescope, and
// the study's things: a floor globe, a wall map, a lectern with its big book, a blackboard, a dinosaur's skeleton, a giant hourglass, an orrery.
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import { Vector3 } from 'three';
import { AMBER, CREAM, darker, glyph, GREEN, INK, LEAF_L, lighter, ORANGE, PANE, PAPER, SKY, SLATE, SLATE_L, STEEL, TEAL, VIOLET, WOOD, WOOD_D, WOOD_L, YELLOW, type Maker, type Part } from './kit';

const BOOKS = [VIOLET, CREAM, SKY, YELLOW, TEAL, ORANGE, GREEN, '#6f5fd0', '#e9c46a', '#4f6d7a'];

/** a book with a spine band; lean: tilted against its neighbour */
function book(g: Part, k: number, x: number, y: number, z: number, lean = 0): void {
  const c = BOOKS[k % BOOKS.length] as string;
  const h = 0.28 + ((k * 37) % 5) * 0.025, t = 0.085 + ((k * 13) % 3) * 0.015;
  const b = g.at(x, y, z);
  b.root.rotation.z = lean;
  b.box(t, h, 0.26, c, 0, h / 2, 0, 0.012);
  b.box(t + 0.004, 0.035, 0.005, k % 2 === 0 ? CREAM : darker(c, 0.6), 0, h * 0.72, 0.137, 0.002);
  b.box(t + 0.004, 0.018, 0.005, k % 2 === 0 ? darker(c, 0.6) : YELLOW, 0, h * 0.25, 0.137, 0.002);
}

/** a shelf unit's open box: two sides, top, plinth, back, and its boards */
function carcass(g: Part, w: number, h: number, d: number, boards: number[]): void {
  // the sides stop under the top board (their tops were its top's plane)
  for (const x of [-w / 2 + 0.035, w / 2 - 0.035]) g.box(0.07, h - 0.02, d, WOOD_D, x, (h - 0.02) / 2, 0, 0.025);
  g.box(w + 0.04, 0.07, d + 0.04, WOOD, 0, h - 0.035, 0, 0.025);
  g.box(w, 0.1, d, darker(WOOD_D, 0.8), 0, 0.05, 0.0, 0.02);
  g.box(w - 0.08, h - 0.12, 0.03, darker(WOOD_D, 0.72), 0, h / 2, -d / 2 + 0.02, 0.01);
  for (const y of boards) g.box(w - 0.09, 0.045, d - 0.05, WOOD_L, 0, y, 0.012, 0.012);
}

/** books along a board from x0, a leaning one now and then, n at most */
function row(g: Part, x0: number, x1: number, y: number, z: number, k0: number, n: number): number {
  let x = x0, k = 0;
  while (k < n) {
    const t = 0.085 + (((k0 + k) * 13) % 3) * 0.015;
    if (x + t > x1) break;
    const lean = (k0 + k) % 6 === 4 && x + 0.2 < x1 ? 0.32 : 0;
    book(g, k0 + k, x + t / 2 + (lean ? 0.06 : 0), y, z, -lean);
    x += t + 0.012 + (lean ? 0.12 : 0);
    k++;
  }
  return k;
}

/** a skills folder: a low shelf (half the library's height), a book per skill, a little plant on top */
const shelf: Maker = (g, o) => {
  const w = 1.0, d = 0.42, h = 0.95;
  g.contact(w, d);
  carcass(g, w, h, d, [0.1, 0.52]);
  // the seed turns its books' colours, so two skills folders side by side differ (designer m_40885)
  const s = o.seed ?? 0;
  const k = row(g, -w / 2 + 0.08, w / 2 - 0.08, 0.125, 0.03, s, o.n);
  row(g, -w / 2 + 0.08, w / 2 - 0.08, 0.545, 0.03, s + k, o.n - k);
  // on top: a little cactus in a pot and a stack of two lying books
  g.cyl(0.08, 0.12, ORANGE, 0.28, h + 0.06, 0.02); g.box(0.07, 0.16, 0.07, GREEN, 0.28, h + 0.2, 0.02, 0.03);
  g.box(0.3, 0.05, 0.22, SKY, -0.22, h + 0.025, 0.02, 0.015); g.box(0.26, 0.045, 0.2, YELLOW, -0.2, h + 0.07, 0.0, 0.015);
  return { w: w + 0.06, d: d + 0.06, h: h + 0.3 };
};

/** a knowledge base (Notion): a tall wide shelf, full, a rolling ladder on its rail, a lamp on top */
const library: Maker = (g, o) => {
  const w = 2.0, d = 0.46, h = 2.15;
  g.contact(w, d + 0.4, 0, 0.15);
  const boards = [0.1, 0.56, 1.02, 1.48];
  carcass(g, w, h, d, boards);
  g.box(0.06, h - 0.2, d - 0.06, WOOD_D, 0, h / 2, 0, 0.02);
  let k = 3;
  for (const y of boards) for (const [a, b] of [[-w / 2 + 0.08, -0.05], [0.05, w / 2 - 0.08]] as const) k += row(g, a, b, y + 0.025, 0.04, k, 9 - ((k * 7) % 3));
  // the rail and the ladder hooked on it
  g.box(w - 0.1, 0.035, 0.035, STEEL, 0, 1.92, d / 2 + 0.05, 0.015);
  const lad = g.at(0.5, 0, d / 2 + 0.36); lad.root.rotation.x = -0.17;
  for (const dx of [-0.17, 0.17]) lad.box(0.05, 1.98, 0.05, WOOD, dx, 0.99, 0, 0.02);
  for (let i = 0; i < 6; i++) lad.box(0.36, 0.035, 0.05, WOOD_L, 0, 0.22 + i * 0.32, 0, 0.012);
  for (const dx of [-0.17, 0.17]) lad.cyl(0.035, 0.03, SLATE, dx, 0.02, 0);
  // a globe and a reading lamp on top
  g.cyl(0.06, 0.04, WOOD_D, -0.6, h + 0.02, 0); g.box(0.02, 0.12, 0.02, STEEL, -0.6, h + 0.09, 0, 0.005); g.ball(0.12, SKY, -0.6, h + 0.25, 0); g.box(0.12, 0.05, 0.13, GREEN, -0.62, h + 0.3, 0.05, 0.03);
  g.cyl(0.05, 0.03, SLATE, 0.7, h + 0.015, 0); g.box(0.02, 0.22, 0.02, SLATE, 0.7, h + 0.13, 0, 0.005); g.cyl(0.09, 0.08, YELLOW, 0.7, h + 0.27, 0.02, 0.15 + o.night);
  // the shelf and its ladder leaning in front
  return { w: w + 0.06, d: 0.89, h: h + 0.4, z: 0.18 };
};

/** a telescope on its tripod (web search): legs to the floor, the tube with bands, a finder scope, a star map */
const telescope: Maker = (g) => {
  g.contact(0.75, 0.75);
  const top = 1.0;
  for (const a of [0.5, 2.6, 4.7]) {
    const fx = Math.cos(a) * 0.36, fz = Math.sin(a) * 0.36;
    const len = Math.hypot(fx, top, fz);
    const leg = g.box(0.045, len, 0.045, WOOD_D, fx / 2, top / 2, fz / 2, 0.015);
    leg.rotation.set(-Math.atan2(fz, top), 0, Math.atan2(fx, top));
    g.cyl(0.035, 0.03, INK, fx, 0.015, fz);
  }
  g.box(0.12, 0.08, 0.12, SLATE, 0, top + 0.02, 0, 0.03);
  const t = g.at(0, top + 0.13, 0); t.root.rotation.z = 0.5; t.root.rotation.y = -0.4;
  const tube = t.cyl(0.1, 1.0, YELLOW, 0, 0, 0); tube.rotation.z = Math.PI / 2;
  for (const x of [-0.3, 0.1, 0.42]) { const b = t.cyl(0.108, 0.04, INK, x, 0, 0); b.rotation.z = Math.PI / 2; }
  const lens = t.cyl(0.12, 0.1, SLATE, 0.53, 0, 0); lens.rotation.z = Math.PI / 2;
  const glass = t.cyl(0.08, 0.01, '#bfe1f2', 0.585, 0, 0, 0.3); glass.rotation.z = Math.PI / 2;
  const eye = t.cyl(0.04, 0.16, SLATE, -0.56, 0, 0); eye.rotation.z = Math.PI / 2;
  const fs = t.cyl(0.03, 0.3, SLATE_L, 0.05, 0.14, 0); fs.rotation.z = Math.PI / 2;
  t.box(0.03, 0.06, 0.03, SLATE, 0.05, 0.1, 0, 0.01);
  return { w: 1.13, d: 0.73, h: 1.7, x: 0.01, z: -0.03 };
};

/** a rod of thickness t from a to b (a bone, a meridian's piece, a support) */
function rod(g: Part, a: readonly [number, number, number], b: readonly [number, number, number], t: number, color: string): void {
  const d = new Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const m = g.box(t, d.length(), t, color, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, t * 0.4);
  m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), d.normalize());
}

/** brass: a globe's meridian, an orrery's arms, a plaque */
const BRASS = '#c9a24a';
/** old bone: the dinosaur */
const BONE = '#ece0c4';

/** a floor globe: a turned stand, the wide horizon ring, the tilted globe with its continents and its brass meridian */
const globe: Maker = (g) => {
  g.contact(0.7, 0.7);
  g.cyl(0.28, 0.05, WOOD_D, 0, 0.025, 0);
  for (const a of [0.3, 2.4, 4.5]) g.box(0.07, 0.04, 0.12, WOOD_D, Math.cos(a) * 0.26, 0.02, Math.sin(a) * 0.26, 0.015).rotation.y = -a;
  g.cyl(0.05, 0.42, WOOD, 0, 0.26, 0); g.ball(0.07, WOOD_D, 0, 0.5, 0); g.cyl(0.035, 0.12, WOOD, 0, 0.6, 0);
  // the horizon ring: a wide wooden plate the globe turns through, on its little arms
  g.cyl(0.43, 0.035, WOOD_L, 0, 0.98, 0); g.cyl(0.36, 0.04, WOOD, 0, 0.982, 0);
  for (const a of [0.8, 2.9, 5.0]) rod(g, [0, 0.62, 0], [Math.cos(a) * 0.39, 0.965, Math.sin(a) * 0.39], 0.03, WOOD_D);
  // the globe itself is round: it stays out of the tilted group (a turned ball's box is wider than it)
  g.ball(0.34, SKY, 0, 0.98, 0);
  const t = g.at(0, 0.98, 0); t.root.rotation.z = 0.41; t.root.rotation.y = -0.5;
  // the continents: flattened lumps on its skin
  const up = new Vector3(0, 0, 1);
  for (const [lat, lon, s, c] of [[0.5, 0.2, 1.3, GREEN], [0.1, 0.5, 1, LEAF_L], [-0.4, 0.35, 0.9, YELLOW], [0.7, -0.6, 1.2, GREEN], [-0.2, -0.9, 0.8, LEAF_L], [0.3, 2.4, 1.2, GREEN], [-0.5, 2.0, 0.9, YELLOW], [0.9, 1.4, 0.8, CREAM]] as const) {
    const dir = new Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
    const m = t.ball(0.11 * s, c, dir.x * 0.29, dir.y * 0.29, dir.z * 0.29);
    m.quaternion.setFromUnitVectors(up, dir);
    m.scale.set(1.3, 0.85, 0.5);
  }
  // the meridian: a brass ring in front of the axis, and the axis's pins
  const n = 28, r = 0.385;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    if (Math.abs(Math.sin(a)) < 0.12 && Math.cos(a) < 0) continue;
    const s = t.box(0.035, (2 * Math.PI * r) / n + 0.01, 0.03, BRASS, Math.cos(a) * r, Math.sin(a) * r, 0, 0.01);
    s.rotation.z = a;
  }
  t.cyl(0.015, 0.84, STEEL, 0, 0, 0);
  return { w: 0.92, d: 0.9, h: 1.4 };
};

/** a pull-down school map hung on the wall: two rods, the sea, the lands, a route in dots and a pin on it */
const map: Maker = (g) => {
  const z = 0.045, w = 1.36;
  g.ball(0.03, SLATE, 0, 2.08, 0.025);
  for (const dx of [-1, 1]) rod(g, [0, 2.07, 0.03], [dx * 0.6, 1.93, 0.04], 0.012, INK);
  for (const y of [1.92, 1.02]) { const c = g.cyl(0.035, w + 0.08, WOOD_D, 0, y, z); c.rotation.z = Math.PI / 2; for (const dx of [-1, 1]) g.ball(0.045, WOOD, dx * (w / 2 + 0.06), y, z); }
  g.box(w, 0.88, 0.012, PAPER, 0, 1.47, z, 0.004);
  g.box(w - 0.1, 0.72, 0.01, lighter(SKY, 0.45), 0, 1.45, z + 0.007, 0.01);
  // the lands, each a hair out of the one below (no two faces in one plane)
  for (const [i, [x, y, lw, lh, c]] of ([[-0.38, 1.58, 0.36, 0.26, GREEN], [-0.3, 1.36, 0.22, 0.3, LEAF_L], [0.1, 1.6, 0.42, 0.2, '#b9d99a'], [0.18, 1.4, 0.2, 0.28, YELLOW], [0.44, 1.52, 0.24, 0.36, GREEN], [0.42, 1.2, 0.18, 0.12, '#b9d99a']] as const).entries()) {
    g.box(lw, lh, 0.008, c, x, y, z + 0.014 + i * 0.003, Math.min(lw, lh) * 0.45);
  }
  // a route in amber dots from one land to another, a violet pin at the end, a compass rose and the title band
  for (let k = 0; k < 9; k++) g.ball(0.013, AMBER, -0.3 + k * 0.075, 1.42 + Math.sin(k * 0.5) * 0.08, z + 0.04);
  g.cyl(0.006, 0.05, STEEL, 0.3, 1.47, z + 0.05).rotation.x = Math.PI / 2; g.ball(0.03, VIOLET, 0.3, 1.47, z + 0.075);
  for (const a of [0, Math.PI / 2]) g.box(0.12, 0.02, 0.01, INK, -0.52, 1.18, z + 0.03, 0.005).rotation.z = a;
  g.ball(0.02, YELLOW, -0.52, 1.18, z + 0.04);
  g.box(0.5, 0.05, 0.008, darker(WOOD, 0.9), 0, 1.86, z + 0.012, 0.005);
  return { w: 1.54, d: 0.16, h: 2.11, z: 0.08, wall: true };
};

/** a lectern: a turned column, a sloped desk, a big open book with its ribbon, a candle lamp, books stacked at its foot */
const lectern: Maker = (g) => {
  g.contact(0.7, 0.6);
  g.box(0.52, 0.06, 0.42, WOOD_D, 0, 0.03, 0, 0.02);
  g.box(0.14, 0.92, 0.14, WOOD, 0, 0.52, -0.02, 0.03);
  for (const y of [0.2, 0.86]) g.box(0.18, 0.05, 0.18, WOOD_D, 0, y, -0.02, 0.02);
  const t = g.at(0, 1.03, 0.02); t.root.rotation.x = 0.38;
  t.box(0.64, 0.045, 0.46, WOOD_D, 0, 0, 0, 0.015);
  t.box(0.64, 0.06, 0.03, WOOD, 0, 0.04, 0.235, 0.01);
  // the book: its cover, two blocks of pages bowed up at the spine, lines of text, the ribbon
  t.box(0.58, 0.02, 0.4, VIOLET, 0, 0.032, -0.01, 0.008);
  for (const s of [-1, 1]) {
    const pg = t.at(s * 0.14, 0.05, -0.01); pg.root.rotation.z = s * -0.06;
    pg.box(0.27, 0.035, 0.36, CREAM, 0, 0, 0, 0.012);
    for (let r = 0; r < 6; r++) pg.box(0.19 - (r % 3) * 0.03, 0.004, 0.012, '#9aa7b2', -s * 0.01, 0.019, -0.13 + r * 0.05, 0.002);
    if (s < 0) pg.box(0.08, 0.004, 0.07, lighter(TEAL, 0.3), 0.04, 0.019, 0.1, 0.004);
  }
  t.box(0.025, 0.004, 0.26, YELLOW, 0.01, 0.075, 0.08, 0.002);
  // a brass candle lamp on the corner, lit at night
  g.cyl(0.05, 0.02, BRASS, 0.24, 1.09, -0.1); g.cyl(0.022, 0.1, CREAM, 0.24, 1.15, -0.1); g.ball(0.02, YELLOW, 0.24, 1.22, -0.1, 0.3);
  // two big books lying at its foot
  g.box(0.32, 0.06, 0.24, TEAL, 0.0, 0.09, 0.0, 0.015); g.box(0.28, 0.05, 0.22, ORANGE, 0.02, 0.145, -0.01, 0.015);
  return { w: 0.72, d: 0.62, h: 1.25 };
};

/** a blackboard on its rolling stand: chalk sums and a sketch of a curve, the :* in chalk, a tray with chalks and the eraser */
const blackboard: Maker = (g) => {
  const board = '#2f4a40';
  g.contact(1.5, 0.6);
  for (const x of [-0.68, 0.68]) {
    g.box(0.08, 0.06, 0.6, WOOD_D, x, 0.1, 0, 0.02);
    for (const z of [-0.25, 0.25]) g.ball(0.04, INK, x, 0.04, z);
    g.box(0.07, 1.78, 0.07, WOOD, x, 0.98, 0, 0.02);
    g.ball(0.04, STEEL, x + (x < 0 ? 0.045 : -0.045), 1.32, 0);
  }
  g.box(1.28, 0.06, 0.06, WOOD_D, 0, 0.3, 0, 0.02);
  const b = g.at(0, 1.32, 0); b.root.rotation.x = -0.05;
  b.box(1.26, 0.9, 0.05, WOOD, 0, 0, 0, 0.02);
  // the slate stands out of the frame's rounded front (a clay box bulges by its bevel)
  b.box(1.16, 0.8, 0.012, board, 0, 0, 0.036, 0.004);
  const z = 0.046;
  // chalk: two lines of sums, a rising curve with its axes, the :* signature
  for (const [x, y, w] of [[-0.42, 0.28, 0.18], [-0.19, 0.28, 0.06], [-0.06, 0.28, 0.14], [-0.42, 0.18, 0.1], [-0.27, 0.18, 0.22], [-0.42, 0.08, 0.26]] as const) b.box(w, 0.018, 0.004, CREAM, x + w / 2, y, z, 0.004);
  b.box(0.012, 0.36, 0.004, CREAM, 0.12, -0.12, z, 0.003); b.box(0.42, 0.012, 0.004, CREAM, 0.33, -0.3, z, 0.003);
  for (let k = 0; k < 6; k++) {
    const x0 = 0.15 + k * 0.065, x1 = x0 + 0.065, f = (x: number) => -0.28 + Math.pow((x - 0.15) / 0.4, 2) * 0.4;
    const s = b.box(Math.hypot(0.065, f(x1) - f(x0)) + 0.01, 0.016, 0.004, YELLOW, (x0 + x1) / 2, (f(x0) + f(x1)) / 2, z + 0.002, 0.004);
    s.rotation.z = Math.atan2(f(x1) - f(x0), 0.065);
  }
  glyph(b, -0.3, -0.18, z + 0.004, SKY, 0.035);
  // the tray, its chalks and the eraser
  b.box(1.16, 0.03, 0.09, WOOD_L, 0, -0.44, 0.06, 0.01);
  for (const [x, c] of [[-0.3, CREAM], [-0.22, YELLOW], [-0.15, SKY]] as const) { const ch = b.cyl(0.012, 0.07, c, x, -0.413, 0.07); ch.rotation.z = Math.PI / 2; }
  b.box(0.15, 0.035, 0.06, WOOD_L, 0.32, -0.41, 0.07, 0.01); b.box(0.15, 0.025, 0.06, SLATE_L, 0.32, -0.38, 0.07, 0.008);
  return { w: 1.5, d: 0.62, h: 1.9 };
};

/** a dinosaur's skeleton on its museum plinth: a T. rex walking, its spine in vertebrae, ribs, the skull, steel supports, the brass plaque */
const dinosaur: Maker = (g) => {
  g.contact(1.7, 0.66);
  g.box(1.66, 0.18, 0.62, WOOD_D, 0, 0.09, 0, 0.03);
  g.box(1.56, 0.02, 0.52, WOOD_L, 0, 0.19, 0, 0.01);
  g.box(0.32, 0.08, 0.01, BRASS, 0.3, 0.1, 0.33, 0.004);
  // the spine: tail low at the right, hips, the back, the neck up to the head at the left
  const spine = (i: number): [number, number] => { const u = i / 18; return [0.78 - u * 1.3, 0.55 + Math.sin(u * Math.PI * 0.95) * 0.45 + u * 0.18]; };
  for (let i = 0; i <= 18; i++) { const [x, y] = spine(i); g.ball(0.035 + Math.sin((i / 18) * Math.PI) * 0.02, BONE, x, y, 0); }
  for (let i = 0; i < 18; i++) { const [a, b] = [spine(i), spine(i + 1)]; rod(g, [a[0], a[1], 0], [b[0], b[1], 0], 0.04, darker(BONE, 0.92)); }
  // ribs: pairs hanging down from the back, shorter toward the hips
  for (let k = 0; k < 6; k++) {
    const [x, y] = spine(8 + k);
    const l = 0.32 - Math.abs(k - 2) * 0.03;
    for (const s of [-1, 1]) rod(g, [x, y - 0.02, s * 0.03], [x + 0.04, y - l, s * 0.13], 0.025, BONE);
  }
  // the skull, its jaw a little open, the eye holes; tiny arms
  const [hx, hy] = spine(18);
  const sk = g.at(hx - 0.08, hy + 0.02, 0); sk.root.rotation.z = -0.15;
  sk.box(0.34, 0.15, 0.15, BONE, 0, 0, 0, 0.04);
  for (const s of [-1, 1]) sk.box(0.06, 0.05, 0.01, INK, 0.06, 0.03, s * 0.073, 0.015);
  const jaw = sk.at(0.04, -0.07, 0); jaw.root.rotation.z = 0.22; jaw.box(0.28, 0.05, 0.12, darker(BONE, 0.92), -0.1, 0, 0, 0.02);
  for (let k = 0; k < 4; k++) sk.cone(0.01, 0.03, CREAM, -0.14 + k * 0.05, -0.085, 0.05);
  const [ax, ay] = spine(14);
  for (const s of [-1, 1]) { rod(g, [ax, ay - 0.08, s * 0.08], [ax - 0.05, ay - 0.2, s * 0.1], 0.025, BONE); rod(g, [ax - 0.05, ay - 0.2, s * 0.1], [ax - 0.12, ay - 0.22, s * 0.1], 0.02, BONE); }
  // the legs from the hips: thigh, shin, foot on the plinth; the steel supports
  const [px, py] = spine(5);
  for (const [s, step] of [[-1, 0.12], [1, -0.1]] as const) {
    const knee: [number, number, number] = [px + step * 0.3 - 0.1, py - 0.38, s * 0.13];
    const ankle: [number, number, number] = [px + step - 0.02, 0.32, s * 0.14];
    g.ball(0.06, BONE, px, py - 0.05, s * 0.1);
    rod(g, [px, py - 0.05, s * 0.1], knee, 0.06, BONE);
    rod(g, knee, ankle, 0.045, BONE);
    rod(g, ankle, [ankle[0] - 0.1, 0.23, s * 0.14], 0.04, BONE);
    g.box(0.16, 0.03, 0.08, BONE, ankle[0] - 0.12, 0.215, s * 0.14, 0.012);
  }
  for (const [x, y] of [spine(6), spine(13)]) g.cyl(0.012, y - 0.24, STEEL, x, 0.2 + (y - 0.24) / 2, -0.06);
  return { w: 1.7, d: 0.64, h: 1.45 };
};

/** a giant hourglass: two turned wooden plates, three posts, the glass bulbs, sand falling onto its heap */
const hourglass: Maker = (g) => {
  const sand = '#e9c46a';
  g.contact(0.62, 0.62);
  for (const y of [0.05, 1.3]) { g.cyl(0.3, 0.07, WOOD_D, 0, y, 0); g.cyl(0.26, 0.035, WOOD, 0, y + (y < 1 ? 0.05 : -0.05), 0); }
  g.ball(0.05, WOOD, 0, 1.36, 0);
  for (const a of [Math.PI / 2, Math.PI / 2 + 2.09, Math.PI / 2 + 4.19]) {
    const x = Math.cos(a) * 0.23, z = Math.sin(a) * 0.23;
    g.cyl(0.028, 1.18, WOOD, x, 0.675, z);
    for (const y of [0.3, 0.675, 1.05]) g.ball(0.042, WOOD_L, x, y, z);
  }
  // the sand: the heap below, what is left above (a cone upside down), the thread falling
  g.cyl(0.17, 0.06, sand, 0, 0.12, 0); g.cone(0.17, 0.13, sand, 0, 0.215, 0);
  g.cyl(0.15, 0.08, sand, 0, 0.83, 0); g.cone(0.15, 0.1, sand, 0, 0.74, 0).rotation.x = Math.PI;
  g.cyl(0.008, 0.38, darker(sand, 0.9), 0, 0.47, 0);
  // the glass: two bulbs and the neck
  g.pane(0.4, 0.5, 0.4, PANE, 0.3, 0, 0.36, 0, 0.19);
  g.pane(0.4, 0.5, 0.4, PANE, 0.3, 0, 0.98, 0, 0.19);
  g.pane(0.09, 0.14, 0.09, PANE, 0.3, 0, 0.67, 0, 0.04);
  return { w: 0.62, d: 0.62, h: 1.41 };
};

/** an orrery on a round side table: the sun in brass and yellow, the planets on their arms, one with a ring, one with its moon */
const orrery: Maker = (g, o) => {
  g.contact(0.8, 0.8);
  g.cyl(0.22, 0.04, WOOD_D, 0, 0.02, 0); g.cyl(0.05, 0.64, WOOD, 0, 0.36, 0); g.cyl(0.38, 0.05, WOOD, 0, 0.705, 0); g.cyl(0.35, 0.02, WOOD_L, 0, 0.735, 0);
  g.cyl(0.13, 0.06, BRASS, 0, 0.775, 0); g.cyl(0.02, 0.32, BRASS, 0, 0.95, 0);
  g.ball(0.1, YELLOW, 0, 1.18, 0, 0.25 + o.night * 0.5);
  for (const [i, [len, a, r, c]] of ([[0.15, 0.6, 0.03, ORANGE], [0.23, 2.6, 0.042, SKY], [0.31, 4.3, 0.05, TEAL], [0.38, 5.6, 0.038, VIOLET]] as const).entries()) {
    const y = 0.83 + i * 0.05, x = Math.cos(a) * len, z = Math.sin(a) * len;
    const arm = g.box(len, 0.014, 0.014, BRASS, x / 2, y, z / 2, 0.004); arm.rotation.y = -a;
    const top = 1.0 + i * 0.03;
    g.cyl(0.008, top - y, BRASS, x, (top + y) / 2, z);
    g.ball(r, c, x, top + r, z);
    if (c === TEAL) { const ring = g.cyl(r * 1.8, 0.006, lighter(YELLOW, 0.3), x, top + r, z); ring.rotation.x = 0.4; ring.rotation.z = 0.25; }
    if (c === SKY) { rod(g, [x, top + r, z], [x + 0.07, top + r + 0.03, z + 0.04], 0.006, BRASS); g.ball(0.015, CREAM, x + 0.075, top + r + 0.032, z + 0.043); }
  }
  return { w: 0.84, d: 0.84, h: 1.28 };
};

export const KNOWLEDGE = { shelf, library, globe, telescope, map, lectern, blackboard, dinosaur, hourglass, orrery } satisfies Record<string, Maker>;

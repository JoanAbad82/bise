// The objects of the knowledge family: the books (a skills folder's shelf, a book per skill; Notion's library, the shelf its compact one) and web search's telescope.
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import { CREAM, darker, GREEN, INK, ORANGE, SKY, SLATE, SLATE_L, STEEL, TEAL, VIOLET, WOOD, WOOD_D, WOOD_L, YELLOW, type Maker, type Part } from './kit';

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
  const k = row(g, -w / 2 + 0.08, w / 2 - 0.08, 0.125, 0.03, 0, o.n);
  row(g, -w / 2 + 0.08, w / 2 - 0.08, 0.545, 0.03, k, o.n - k);
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

export const KNOWLEDGE = { shelf, library, telescope } satisfies Record<string, Maker>;

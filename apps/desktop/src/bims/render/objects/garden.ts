// The objects of the garden family: the potted plant (any plugin with no object of its own: its pot is its kind's colour, n 1 amber, 2 sky, 3 violet, else teal), and the outdoor ones of page bims-plugins' collection table: the campfire, a fish pond, a beehive, a vegetable bed, a swing, a hammock, a fountain, a birdhouse, a treehouse, a glasshouse (a greenhouse; the id says glasshouse so it never reads as the greenhouse map).
// A rounded box's bevel stands 0.4 r out of its w and d and its top sits r/4 low (style.ts roundBox): what sits on one or on its face is placed past it.
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import { AMBER, CREAM, darker, GREEN, INK, LEAF, LEAF_L, lighter, ORANGE, PANE, SKY, SLATE, SLATE_L, TEAL, VIOLET, WOOD, WOOD_D, WOOD_L, YELLOW, type Maker, type Part } from './kit';

const STONE = '#c9c2b6';
const STONE_D = '#9aa7b2';
const SOIL = '#6a4a2f';
const WATER = '#7cc8f0';

/** a few flowers on their stems at (x, z): no pink, no red */
function flowers(g: Part, x: number, z: number, n: number): void {
  const cs = [YELLOW, VIOLET, CREAM, SKY, AMBER];
  for (let i = 0; i < n; i++) {
    const a = i * 2.1, r = 0.05 + (i % 2) * 0.04, h = 0.16 + (i % 3) * 0.05;
    const fx = x + Math.cos(a) * r, fz = z + Math.sin(a) * r;
    g.box(0.012, h, 0.012, LEAF, fx, h / 2, fz, 0);
    g.ball(0.03, cs[i % cs.length] as string, fx, h + 0.015, fz);
  }
}

/** a potted plant whose pot is its kind's colour: a plugin with no object of its own */
const plant: Maker = (g, o) => {
  const pot = o.n === 1 ? AMBER : o.n === 2 ? SKY : o.n === 3 ? VIOLET : TEAL;
  g.contact(0.42, 0.42);
  g.cyl(0.18, 0.32, pot, 0, 0.16, 0);
  g.cyl(0.21, 0.07, darker(pot, 0.85), 0, 0.33, 0);
  g.cyl(0.17, 0.02, '#6a4a2f', 0, 0.36, 0);
  for (const [a, h, l] of [[0, 0.75, 0.42], [1.3, 0.65, 0.36], [2.5, 0.8, 0.4], [3.7, 0.6, 0.34], [4.9, 0.72, 0.38]] as const) {
    const leaf = g.at(0, 0.36, 0); leaf.root.rotation.y = a;
    const stem = leaf.box(0.025, h, 0.025, '#4a7a35', 0, h / 2, 0.05, 0.01); stem.rotation.x = 0.18;
    const blade = leaf.ball(l / 2, a % 2.4 < 1.2 ? LEAF : LEAF_L, 0, h + 0.02, 0.18); blade.scale.set(0.55, 0.22, 1); blade.rotation.x = 0.5;
  }
  g.ball(0.15, LEAF_L, 0, 1.12, 0).scale.set(0.8, 1.2, 0.8);
  // its leaves reach out of the pot
  return { w: 0.76, d: 0.76, h: 1.32 };
};

/** a campfire (outdoor): a stone ring, logs, a flame that glows at night, two log seats */
const campfire: Maker = (g, o) => {
  g.contact(1.6, 1.0);
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; g.ball(0.07, i % 2 ? '#9aa7b2' : '#c9c2b6', Math.cos(a) * 0.3, 0.05, Math.sin(a) * 0.3).scale.set(1.2, 0.7, 1); }
  for (const r of [0.3, 1.2, 2.2]) { const l = g.box(0.38, 0.08, 0.08, WOOD_D, 0, 0.12, 0, 0.03); l.rotation.set(0, r, 0.35); }
  const f = g.ball(0.13, YELLOW, 0, 0.26, 0, 0.6 + o.night * 1.2); f.scale.set(1, 1.5, 1);
  const f2 = g.ball(0.08, AMBER, 0.03, 0.4, 0.02, 0.6 + o.night * 1.2); f2.scale.set(1, 1.6, 1);
  for (const x of [-0.75, 0.75]) { const lg = g.cyl(0.13, 0.7, WOOD, x, 0.13, 0); lg.rotation.x = Math.PI / 2; g.cyl(0.11, 0.02, WOOD_L, x, 0.13, 0.355).rotation.x = Math.PI / 2; }
  return { w: 1.76, d: 0.8, h: 0.6 };
};

/** a fish pond: a ring of stones, water, lily pads with a cream flower, a frog, two goldfish under the surface, reeds */
const pond: Maker = (g) => {
  g.contact(1.5, 1.0);
  g.pane(1.3, 0.06, 0.86, WATER, 0.75, 0, 0.03, 0, 0.03);
  g.box(1.24, 0.02, 0.8, darker(WATER, 0.7), 0, 0.012, 0, 0.005);
  for (const [x, c] of [[-0.2, ORANGE], [0.18, YELLOW]] as const) { const f = g.ball(0.04, c, x, 0.035, 0.05 - x * 0.3); f.scale.set(1.6, 0.6, 0.8); }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const st = g.ball(0.08 + (i % 3) * 0.015, i % 2 ? STONE : STONE_D, Math.cos(a) * 0.68, 0.05, Math.sin(a) * 0.43);
    st.scale.set(1.3, 0.65, 1);
  }
  for (const [x, z, r] of [[-0.35, -0.1, 0.1], [0.3, 0.15, 0.09], [0.05, -0.2, 0.08]] as const) g.cyl(r, 0.01, LEAF, x, 0.062, z);
  g.ball(0.035, CREAM, -0.35, 0.09, -0.1);
  g.ball(0.025, YELLOW, -0.35, 0.115, -0.1);
  // the frog on its pad
  const fr = g.ball(0.05, GREEN, 0.3, 0.1, 0.15); fr.scale.set(1.1, 0.75, 1);
  for (const dx of [-0.02, 0.02]) { g.ball(0.016, GREEN, 0.3 + dx, 0.135, 0.18); g.ball(0.008, INK, 0.3 + dx, 0.14, 0.192); }
  for (let i = 0; i < 6; i++) { const r = g.box(0.02, 0.4 + (i % 3) * 0.08, 0.02, i % 2 ? LEAF : LEAF_L, -0.6 + (i % 3) * 0.05, 0.22 + (i % 3) * 0.04, -0.28 + Math.floor(i / 3) * 0.05, 0.005); r.rotation.z = (i - 2.5) * 0.06; }
  return { w: 1.68, d: 1.04, h: 0.6 };
};

/** a beehive on its stand: three boxes, the roof, the entrance and its landing board, bees about, flowers below */
const beehive: Maker = (g) => {
  g.contact(0.9, 0.7);
  for (const x of [-0.24, 0.24]) for (const z of [-0.18, 0.18]) g.box(0.06, 0.4, 0.06, WOOD_D, x, 0.2, z, 0.015);
  g.box(0.62, 0.05, 0.5, WOOD, 0, 0.425, 0, 0.01);
  for (const [i, c, w] of [[0, WOOD_L, 0.52], [1, YELLOW, 0.48], [2, WOOD_L, 0.52]] as const) g.box(w, 0.22, 0.42, c, 0, 0.56 + i * 0.22, 0, 0.02);
  const roof = g.at(0, 1.18, 0);
  for (const s of [-1, 1]) { const r = roof.box(0.66, 0.04, 0.3, SLATE_L, 0, 0.06, s * 0.13, 0.01); r.rotation.x = s * 0.45; }
  roof.box(0.68, 0.05, 0.05, SLATE, 0, 0.13, 0, 0.015);
  g.box(0.24, 0.03, 0.01, INK, 0, 0.475, 0.225, 0);
  g.box(0.32, 0.02, 0.08, WOOD, 0, 0.455, 0.27, 0.005);
  for (const [x, y, z] of [[0.38, 0.9, 0.1], [-0.36, 1.05, 0.2], [0.2, 0.6, 0.3], [-0.12, 1.38, 0.15]] as const) {
    const b = g.ball(0.03, YELLOW, x, y, z); b.scale.set(1.3, 1, 1);
    g.box(0.012, 0.05, 0.05, INK, x, y, z, 0);
    for (const dz of [-0.03, 0.03]) g.pane(0.03, 0.005, 0.03, CREAM, 0.7, x, y + 0.035, z + dz, 0);
  }
  flowers(g, -0.33, 0.22, 4);
  flowers(g, 0.32, -0.22, 3);
  return { w: 0.86, d: 0.7, h: 1.44 };
};

/** a vegetable bed: a raised wooden box of soil, cabbages, carrot tops, orange and yellow tomatoes on stakes, a watering can */
const veggies: Maker = (g) => {
  g.contact(1.6, 0.9);
  for (const z of [-0.33, 0.33]) g.box(1.4, 0.3, 0.06, WOOD, -0.08, 0.15, z, 0.015);
  for (const x of [-0.75, 0.59]) g.box(0.06, 0.28, 0.6, WOOD_D, x, 0.14, 0, 0.015);
  g.box(1.28, 0.26, 0.6, SOIL, -0.08, 0.13, 0, 0.01);
  // cabbages at the front, carrots in the middle, tomatoes at the back
  for (let i = 0; i < 4; i++) { const c = g.ball(0.09, i % 2 ? LEAF_L : LEAF, -0.58 + i * 0.3, 0.3, 0.17); c.scale.set(1, 0.75, 1); g.ball(0.05, lighter(LEAF_L, 0.3), -0.58 + i * 0.3, 0.34, 0.17); }
  for (let i = 0; i < 6; i++) {
    const x = -0.62 + i * 0.22;
    g.cyl(0.025, 0.03, ORANGE, x, 0.27, -0.01);
    for (const r of [-0.3, 0, 0.3]) { const l = g.box(0.012, 0.14, 0.012, LEAF, x, 0.34, -0.01, 0); l.rotation.z = r; }
  }
  for (const x of [-0.5, -0.1, 0.3]) {
    g.box(0.025, 0.7, 0.025, WOOD_L, x, 0.55, -0.18, 0.008);
    for (let k = 0; k < 4; k++) { const lf = g.ball(0.06, k % 2 ? LEAF : LEAF_L, x + (k % 2 ? 0.05 : -0.05), 0.45 + k * 0.12, -0.18); lf.scale.set(1, 0.6, 0.8); }
    for (let k = 0; k < 3; k++) g.ball(0.035, k % 2 ? YELLOW : ORANGE, x + (k - 1) * 0.06, 0.5 + k * 0.13, -0.11);
  }
  // the watering can on the ground at the side
  g.box(0.16, 0.16, 0.12, SKY, 0.7, 0.08, 0.15, 0.04);
  const sp = g.box(0.03, 0.03, 0.18, SKY, 0.7, 0.13, 0.27, 0.01); sp.rotation.x = 0.5;
  const hd = g.box(0.02, 0.1, 0.1, darker(SKY, 0.8), 0.7, 0.2, 0.13, 0.008); hd.rotation.x = 0.2;
  return { w: 1.6, d: 0.8, h: 0.92, z: 0.02 };
};

/** a swing: an A-frame, the top beam, two ropes and a seat */
const swing: Maker = (g) => {
  g.contact(1.7, 0.9);
  for (const x of [-0.75, 0.75]) for (const s of [-1, 1]) { const l = g.box(0.08, 1.9, 0.08, WOOD, x + s * 0.006, 0.92, s * 0.2, 0.02); l.rotation.x = s * 0.22; }
  g.box(1.66, 0.1, 0.1, WOOD_D, 0, 1.86, 0, 0.02);
  for (const x of [-0.3, 0.3]) g.box(0.018, 1.36, 0.018, CREAM, x, 1.12, 0.0, 0);
  g.box(0.74, 0.05, 0.26, TEAL, 0, 0.44, 0.0, 0.015);
  return { w: 1.66, d: 0.94, h: 1.91 };
};

/** a hammock between two posts: the striped cloth sags, a cushion, a book left on it */
const hammock: Maker = (g) => {
  g.contact(2.0, 0.7);
  for (const x of [-0.9, 0.9]) { g.cyl(0.06, 1.3, WOOD_D, x, 0.65, 0); g.cyl(0.11, 0.06, SOIL, x, 0.03, 0); }
  const n = 9;
  const yAt = (t: number): number => 0.5 + 0.35 * (2 * t - 1) ** 2;
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n;
    const x0 = -0.6 + t0 * 1.2, x1 = -0.6 + t1 * 1.2;
    const seg = g.box(1.2 / n + 0.01, 0.025, 0.5, i % 2 ? CREAM : TEAL, (x0 + x1) / 2, (yAt(t0) + yAt(t1)) / 2, 0, 0);
    seg.rotation.z = Math.atan2(yAt(t1) - yAt(t0), x1 - x0);
  }
  for (const s of [-1, 1]) for (const z of [-0.2, 0.2]) {
    const r = g.box(0.33, 0.012, 0.012, CREAM, s * 0.75, 1.0, z * 0.5, 0); r.rotation.z = s * 0.4; r.rotation.y = s * z * 0.5;
  }
  const cu = g.box(0.26, 0.1, 0.36, YELLOW, -0.38, 0.73, 0, 0.04); cu.rotation.z = -0.45;
  const bk = g.box(0.18, 0.03, 0.13, VIOLET, 0.12, 0.54, 0.04, 0.01); bk.rotation.z = 0.12;
  return { w: 2.04, d: 0.56, h: 1.3 };
};

/** a stone fountain: a round basin of water, a column, a bowl on top, water falling back */
const fountain: Maker = (g) => {
  g.contact(1.3, 1.3);
  g.cyl(0.6, 0.3, STONE, 0, 0.15, 0);
  g.cyl(0.52, 0.02, WATER, 0, 0.305, 0);
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; const s = g.box(0.18, 0.08, 0.1, i % 2 ? STONE : lighter(STONE, 0.2), Math.cos(a) * 0.58, 0.33, Math.sin(a) * 0.58, 0.02); s.rotation.y = -a + Math.PI / 2; }
  g.cyl(0.09, 0.62, STONE_D, 0, 0.6, 0);
  g.cyl(0.3, 0.08, STONE, 0, 0.92, 0);
  g.cyl(0.26, 0.015, WATER, 0, 0.965, 0);
  g.cyl(0.05, 0.16, STONE_D, 0, 1.04, 0);
  g.ball(0.07, STONE, 0, 1.15, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    for (let k = 0; k < 3; k++) g.ball(0.022, lighter(WATER, 0.4), Math.cos(a) * (0.33 + k * 0.03), 0.84 - k * 0.17, Math.sin(a) * (0.33 + k * 0.03));
  }
  for (const [x, z] of [[0.2, 0.15], [-0.25, -0.1]] as const) { const f = g.ball(0.035, ORANGE, x, 0.3, z); f.scale.set(1.5, 0.5, 0.7); }
  return { w: 1.3, d: 1.3, h: 1.22 };
};

/** a birdhouse on its pole: a little house, its round door and perch, a blue bird on the roof, flowers at its foot */
const birdhouse: Maker = (g) => {
  g.contact(0.5, 0.5);
  g.box(0.06, 1.2, 0.06, WOOD_D, 0, 0.6, 0, 0.015);
  g.box(0.3, 0.32, 0.28, TEAL, 0, 1.36, 0, 0.03);
  const door = g.cyl(0.05, 0.02, INK, 0, 1.4, 0.155); door.rotation.x = Math.PI / 2;
  const perch = g.cyl(0.012, 0.08, WOOD, 0, 1.31, 0.18); perch.rotation.x = Math.PI / 2;
  const roof = g.at(0, 1.52, 0);
  for (const s of [-1, 1]) { const r = roof.box(0.22, 0.03, 0.38, AMBER, s * 0.09, 0.06, 0, 0.01); r.rotation.z = -s * 0.6; }
  // the bird
  const b = g.at(0.04, 1.66, 0.02); b.root.rotation.y = 0.5;
  b.ball(0.06, SKY, 0, 0.05, 0).scale.set(1.3, 1, 1);
  b.ball(0.045, SKY, 0.06, 0.1, 0);
  const bk = b.cone(0.015, 0.04, YELLOW, 0.11, 0.1, 0); bk.rotation.z = -Math.PI / 2;
  b.ball(0.01, INK, 0.085, 0.115, 0.03);
  b.ball(0.035, CREAM, 0.02, 0.03, 0.04).scale.set(1, 1, 0.6);
  flowers(g, 0.1, 0.08, 4);
  return { w: 0.5, d: 0.48, h: 1.8 };
};

/** a treehouse: a trunk, its leafy crown, a deck on it with a little house (a window that glows at night), a ladder up */
const treehouse: Maker = (g, o) => {
  g.contact(1.4, 1.3);
  g.cyl(0.15, 2.2, WOOD_D, -0.3, 1.1, -0.3);
  for (const [x, z, a] of [[-0.48, -0.3, 0], [-0.3, -0.12, 1.6]] as const) { const rt = g.box(0.25, 0.07, 0.08, WOOD_D, x, 0.03, z, 0.02); rt.rotation.y = a; }
  for (const [x, y, z, r, c] of [[-0.25, 2.35, -0.25, 0.4, LEAF], [-0.02, 2.15, -0.38, 0.3, LEAF_L], [-0.42, 2.1, -0.08, 0.28, LEAF_L], [-0.36, 2.55, -0.22, 0.26, LEAF_L]] as const) g.ball(r, c, x, y, z);
  // the deck on four posts, its rail
  g.box(1.1, 0.08, 1.0, WOOD, 0, 1.2, 0, 0.02);
  for (const [x, z] of [[0.48, 0.42], [0.48, -0.42], [-0.48, 0.42]] as const) g.box(0.07, 1.16, 0.07, WOOD_D, x, 0.58, z, 0.02);
  for (const x of [-0.5, -0.2]) g.box(0.04, 0.3, 0.04, WOOD_L, x, 1.39, 0.47, 0.01);
  g.box(0.42, 0.04, 0.04, WOOD_L, -0.35, 1.55, 0.47, 0.01);
  // the house
  g.box(0.56, 0.5, 0.5, WOOD_L, 0.22, 1.5, 0.08, 0.03);
  g.box(0.16, 0.3, 0.02, WOOD_D, 0.08, 1.42, 0.345, 0.01);
  g.box(0.14, 0.14, 0.02, YELLOW, 0.34, 1.55, 0.345, 0.01, 0.15 + o.night);
  const roof = g.at(0.22, 1.76, 0.08);
  for (const s of [-1, 1]) { const r = roof.box(0.36, 0.04, 0.62, TEAL, s * 0.15, 0.09, 0, 0.01); r.rotation.z = -s * 0.6; }
  // the ladder down the front
  const lad = g.at(-0.05, 0, 0.6); lad.root.rotation.x = -0.15;
  for (const x of [-0.14, 0.14]) lad.box(0.04, 1.2, 0.04, WOOD, x, 0.6, 0, 0.01);
  for (let i = 0; i < 5; i++) lad.box(0.26, 0.03, 0.03, WOOD_L, 0, 0.18 + i * 0.22, 0, 0.008);
  return { w: 1.44, d: 1.44, h: 2.86 };
};

/** a glasshouse (a greenhouse): a stone kerb, glass walls and roof on a cream frame, a shelf of pots, a tall plant, its door */
const glasshouse: Maker = (g) => {
  g.contact(1.4, 1.0);
  g.box(1.3, 0.12, 0.9, STONE, 0, 0.06, 0, 0.02);
  g.pane(1.2, 0.86, 0.8, PANE, 0.28, 0, 0.55, 0, 0.01);
  for (const x of [-0.62, 0.62]) for (const z of [-0.42, 0.42]) g.box(0.04, 0.9, 0.04, CREAM, x, 0.57, z, 0.01);
  for (const z of [-0.42, 0.42]) g.box(1.28, 0.04, 0.04, CREAM, 0, 1.0, z, 0.01);
  const roof = g.at(0, 1.0, 0);
  for (const s of [-1, 1]) {
    const p = roof.at(0, 0.13, s * 0.21); p.root.rotation.x = s * 0.55;
    p.pane(1.2, 0.02, 0.5, PANE, 0.28, 0, 0, 0, 0.005);
    for (const x of [-0.6, 0, 0.6]) p.box(0.04, 0.04, 0.5, CREAM, x, 0.03, 0, 0.01);
  }
  roof.box(1.3, 0.05, 0.05, CREAM, 0, 0.27, 0, 0.015);
  // inside: a shelf of pots along the back, a tall plant at the side
  g.box(0.9, 0.04, 0.24, WOOD, -0.1, 0.5, -0.24, 0.01);
  for (const x of [-0.5, 0.3]) g.box(0.04, 0.38, 0.2, WOOD_D, x, 0.31, -0.24, 0.01);
  for (const [x, c] of [[-0.42, TEAL], [-0.22, AMBER], [-0.02, SKY], [0.18, TEAL]] as const) {
    g.cyl(0.06, 0.09, c, x, 0.565, -0.24);
    g.ball(0.07, c === AMBER ? LEAF_L : LEAF, x, 0.66, -0.24);
  }
  g.cyl(0.11, 0.18, AMBER, 0.38, 0.21, 0.14);
  for (const [dx, h] of [[-0.04, 0.5], [0.05, 0.42], [0, 0.6]] as const) { g.box(0.02, h, 0.02, LEAF, 0.38 + dx, 0.3 + h / 2, 0.14, 0); g.ball(0.07, LEAF_L, 0.38 + dx, 0.3 + h, 0.14); }
  // the door's frame on the front
  for (const x of [-0.3, 0.0]) g.box(0.03, 0.82, 0.03, CREAM, x, 0.54, 0.43, 0.008);
  g.ball(0.018, YELLOW, -0.04, 0.55, 0.45);
  return { w: 1.34, d: 0.94, h: 1.3 };
};

export const GARDEN = { plant, campfire, pond, beehive, veggies, swing, hammock, fountain, birdhouse, treehouse, glasshouse } satisfies Record<string, Maker>;

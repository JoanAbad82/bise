// The objects of the kitchen family (page bims-plugins' collection table): an espresso machine on its
// cart, a pizza oven, a barbecue, a popcorn cart, an ice-cream cart, a drinks dispenser, a juice bar, a
// tea set, a candy dispenser, a vintage fridge. A bim's trip to the island sometimes ends at one (p6).
// No red anywhere (tomato, sauce, embers are orange or amber; palette law).
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import { AMBER, CREAM, darker, GREEN, INK, LEAF, LEAF_L, lighter, ORANGE, PANE, PAPER, SKY, SLATE, SLATE_L, STEEL, TEAL, VIOLET, WOOD, WOOD_D, WOOD_L, YELLOW, type Maker, type Part } from './kit';

/** a warm terracotta, far enough from the error red's hue (palette.testkit) */
const CLAY = '#d08a55';
const MINT = '#a8e0c8';
const CHOC = '#7a4e2e';

/** a wheel standing in the xy plane (it rolls along x) at (x, y, z): tyre and hub */
function wheel(g: Part, x: number, y: number, z: number, r: number): void {
  const t = g.cyl(r, 0.05, SLATE, x, y, z); t.rotation.x = Math.PI / 2;
  const h = g.cyl(r * 0.4, 0.07, STEEL, x, y, z); h.rotation.x = Math.PI / 2;
}

/** an espresso machine on its wooden cart: two group heads, cups under them, a grinder, a gauge */
const espresso: Maker = (g, o) => {
  g.contact(0.9, 0.56);
  g.box(0.86, 0.86, 0.52, WOOD, 0, 0.43, 0, 0.03);
  for (const x of [-0.2, 0.2]) g.box(0.36, 0.6, 0.02, WOOD_D, x, 0.42, 0.27, 0.01);
  g.box(0.9, 0.05, 0.56, SLATE, 0, 0.885, 0, 0.01);
  // the machine: body, cup tray on top, front panel and its gauge
  g.box(0.5, 0.34, 0.32, STEEL, -0.05, 1.08, -0.06, 0.04);
  g.box(0.46, 0.03, 0.28, darker(STEEL, 0.8), -0.05, 1.265, -0.06, 0.01);
  for (const x of [-0.2, -0.1, 0.0]) g.cyl(0.035, 0.05, CREAM, x, 1.305, -0.1);
  g.box(0.3, 0.12, 0.02, TEAL, -0.05, 1.17, 0.11, 0.01);
  g.ball(0.035, CREAM, -0.05, 1.17, 0.13);
  g.ball(0.015, YELLOW, 0.06, 1.17, 0.125, 0.3 + o.night);
  // group heads, handles, cups on the drip tray, the steam wand
  g.box(0.42, 0.02, 0.12, SLATE_L, -0.05, 0.92, 0.05, 0.005);
  for (const x of [-0.17, 0.07]) {
    g.cyl(0.045, 0.06, SLATE, x, 1.0, 0.13);
    g.box(0.03, 0.03, 0.14, INK, x, 0.985, 0.23, 0.01);
    g.cyl(0.035, 0.05, CREAM, x, 0.955, 0.13);
    g.cyl(0.026, 0.01, CHOC, x, 0.98, 0.13);
  }
  const wand = g.box(0.02, 0.16, 0.02, STEEL, 0.17, 1.0, 0.12, 0.008); wand.rotation.z = 0.2;
  // the grinder and its bean hopper
  g.box(0.12, 0.2, 0.12, SLATE, 0.32, 1.01, -0.12, 0.02);
  const hop = g.cone(0.08, 0.14, AMBER, 0.32, 1.18, -0.12); hop.rotation.x = Math.PI;
  return { w: 0.9, d: 0.6, h: 1.34 };
};

/** a wood-fired pizza oven: a clay dome on a stone base, the fire inside, a peel, a pizza, logs */
const pizzaoven: Maker = (g, o) => {
  g.contact(1.2, 1.0);
  g.box(1.1, 0.7, 0.9, '#c9c2b6', 0, 0.35, 0, 0.04);
  g.box(0.6, 0.4, 0.02, darker('#c9c2b6', 0.6), 0, 0.3, 0.476, 0.02);
  for (let i = 0; i < 3; i++) { const l = g.cyl(0.06, 0.5, WOOD_D, -0.12 + i * 0.12, 0.17 + (i % 2) * 0.1, 0.25); l.rotation.z = Math.PI / 2; l.rotation.y = Math.PI / 2; }
  g.box(1.14, 0.06, 0.94, SLATE_L, 0, 0.73, 0, 0.02);
  const dome = g.ball(0.44, CLAY, 0, 0.76, -0.04); dome.scale.set(1, 0.85, 1);
  g.box(0.42, 0.3, 0.12, darker(CLAY, 0.9), 0, 0.9, 0.36, 0.05);
  g.box(0.3, 0.2, 0.02, INK, 0, 0.87, 0.452, 0.04);
  const f = g.ball(0.07, YELLOW, 0, 0.82, 0.4, 0.6 + o.night); f.scale.set(1.4, 1, 0.5);
  g.ball(0.05, AMBER, 0.08, 0.81, 0.405, 0.6 + o.night).scale.set(1, 0.8, 0.5);
  g.cyl(0.07, 0.36, SLATE, 0.18, 1.3, -0.2);
  g.cyl(0.085, 0.04, SLATE_L, 0.18, 1.5, -0.2);
  // a pizza on a board at the side, the peel leaning on the base
  g.cyl(0.18, 0.025, WOOD_L, -0.36, 0.775, 0.26);
  g.cyl(0.15, 0.02, ORANGE, -0.36, 0.797, 0.26);
  g.cyl(0.12, 0.01, YELLOW, -0.36, 0.81, 0.26);
  for (const [x, z] of [[-0.4, 0.22], [-0.3, 0.3], [-0.38, 0.32]] as const) g.ball(0.022, LEAF, x, 0.82, z).scale.set(1, 0.4, 1);
  const peel = g.at(0.5, 0, 0.4); peel.root.rotation.x = -0.2;
  peel.box(0.04, 0.7, 0.04, WOOD, 0, 0.35, 0, 0.015); peel.box(0.24, 0.24, 0.02, WOOD_L, 0, 0.8, 0, 0.04);
  return { w: 1.28, d: 1.0, h: 1.53, z: 0.03 };
};

/** a barbecue cart: the grill with its lid open, sausages and corn, embers that glow at night, side shelves, a little smoke */
const grill: Maker = (g, o) => {
  g.contact(1.3, 0.62);
  for (const x of [-0.3, 0.3]) for (const z of [-0.2, 0.2]) g.box(0.05, 0.6, 0.05, SLATE, x, 0.3, z, 0.015);
  g.box(0.62, 0.03, 0.42, SLATE_L, 0, 0.2, 0, 0.01);
  wheel(g, -0.3, 0.09, 0.25, 0.09);
  g.box(0.7, 0.32, 0.5, INK, 0, 0.76, 0, 0.06);
  g.box(0.64, 0.02, 0.44, AMBER, 0, 0.9, 0, 0.01, 0.4 + o.night);
  for (let i = 0; i < 6; i++) g.box(0.012, 0.012, 0.44, STEEL, -0.28 + i * 0.112, 0.925, 0, 0);
  for (const [x, c] of [[-0.18, CHOC], [-0.08, CHOC], [0.05, CHOC]] as const) { const s = g.box(0.05, 0.05, 0.28, c, x, 0.955, 0.02, 0.024); s.rotation.y = 0.15; }
  const corn = g.box(0.07, 0.07, 0.26, YELLOW, 0.2, 0.96, 0.0, 0.03); corn.rotation.y = -0.2;
  // the lid, open behind
  const lid = g.at(0, 0.92, -0.25); lid.root.rotation.x = -1.2;
  lid.box(0.7, 0.04, 0.48, SLATE, 0, 0.02, 0.24, 0.02); lid.box(0.2, 0.03, 0.03, STEEL, 0, 0.06, 0.46, 0.01);
  // side shelves with a plate and tongs
  for (const x of [-0.5, 0.5]) g.box(0.28, 0.03, 0.4, WOOD, x, 0.86, 0, 0.01);
  g.cyl(0.09, 0.015, CREAM, -0.5, 0.883, 0);
  const tong = g.box(0.03, 0.015, 0.24, STEEL, 0.5, 0.884, 0, 0.005); tong.rotation.y = 0.3;
  for (const [x, y, r] of [[0.02, 1.15, 0.06], [0.07, 1.27, 0.05], [0.03, 1.37, 0.04]] as const) g.ball(r, lighter(STEEL, 0.6), x, y, 0.0);
  return { w: 1.28, d: 0.62, h: 1.42, z: 0.02 };
};

/** a popcorn cart: wheels, a glass case full of popcorn, the kettle, a striped roof */
const popcorn: Maker = (g, o) => {
  g.contact(0.9, 0.6);
  for (const z of [-0.27, 0.27]) wheel(g, -0.15, 0.2, z, 0.2);
  for (const z of [-0.18, 0.18]) g.box(0.04, 0.25, 0.04, SLATE, 0.3, 0.125, z, 0.01);
  g.box(0.76, 0.5, 0.5, SKY, 0, 0.45, 0, 0.04);
  g.box(0.4, 0.2, 0.02, CREAM, 0.12, 0.48, 0.276, 0.02);
  g.box(0.8, 0.04, 0.54, CREAM, 0, 0.72, 0, 0.01);
  g.pane(0.72, 0.56, 0.48, PANE, 0.35, 0, 1.02, 0, 0.02);
  for (let i = 0; i < 18; i++) g.ball(0.05, i % 3 ? CREAM : YELLOW, -0.28 + (i % 6) * 0.11, 0.78 + Math.floor(i / 6) * 0.06, -0.12 + ((i * 7) % 5) * 0.06);
  g.cyl(0.11, 0.14, STEEL, 0, 1.2, 0);
  g.ball(0.04, AMBER, 0, 1.12, 0, 0.3 + o.night * 0.6);
  // corner posts, the roof in sky and cream stripes, its finial
  for (const x of [-0.37, 0.37]) for (const z of [-0.23, 0.23]) g.box(0.03, 0.56, 0.03, CREAM, x, 1.02, z, 0.01);
  g.box(0.84, 0.05, 0.58, CREAM, 0, 1.325, 0, 0.01);
  for (let i = 0; i < 5; i++) g.box(0.17, 0.08, 0.6, i % 2 ? CREAM : SKY, -0.34 + i * 0.17, 1.39, 0, 0.02);
  g.ball(0.05, YELLOW, 0, 1.48, 0);
  return { w: 0.9, d: 0.64, h: 1.53 };
};

/** an ice-cream cart: a cream box on wheels with a teal band, a parasol, cones on top (vanilla, mint, chocolate, lemon) */
const icecream: Maker = (g) => {
  g.contact(1.0, 0.6);
  for (const z of [-0.27, 0.27]) wheel(g, -0.2, 0.17, z, 0.17);
  g.box(0.78, 0.5, 0.48, CREAM, 0.02, 0.5, 0, 0.05);
  g.box(0.8, 0.1, 0.5, TEAL, 0.02, 0.6, 0, 0.02);
  g.box(0.8, 0.04, 0.5, STEEL, 0.02, 0.77, 0, 0.01);
  for (const [x, c] of [[-0.24, CREAM], [-0.08, MINT], [0.08, CHOC], [0.24, YELLOW]] as const) g.cyl(0.06, 0.03, c, x, 0.8, 0.08);
  // the push bar and its legs
  g.box(0.04, 0.04, 0.44, SLATE, 0.47, 0.82, 0, 0.015);
  for (const z of [-0.2, 0.2]) { const a = g.box(0.03, 0.3, 0.03, SLATE, 0.43, 0.7, z, 0.01); a.rotation.z = -0.3; }
  for (const z of [-0.18, 0.18]) g.box(0.04, 0.25, 0.04, SLATE, 0.32, 0.125, z, 0.01);
  // three cones up
  for (const [x, c] of [[-0.12, MINT], [0.0, CHOC], [0.12, YELLOW]] as const) {
    const cn = g.cone(0.04, 0.14, WOOD_L, x, 0.86, -0.12); cn.rotation.x = Math.PI;
    g.ball(0.045, c, x, 0.95, -0.12);
  }
  // the parasol
  g.box(0.025, 0.95, 0.025, STEEL, -0.1, 1.2, -0.06, 0.01);
  const um = g.cone(0.42, 0.22, YELLOW, -0.1, 1.75, -0.06); um.scale.set(1, 1, 0.6);
  g.ball(0.03, CREAM, -0.1, 1.87, -0.06);
  return { w: 1.06, d: 0.64, h: 1.9, x: -0.02 };
};

/** a drinks dispenser: three big jars with taps (lemonade, orange, mint) on a little counter, cups stacked */
const drinks: Maker = (g) => {
  g.contact(1.1, 0.55);
  g.box(1.06, 0.8, 0.5, WOOD_L, 0, 0.4, 0, 0.03);
  for (let i = 0; i < 4; i++) g.box(0.24, 0.6, 0.02, i % 2 ? CREAM : SKY, -0.39 + i * 0.26, 0.4, 0.255, 0.01);
  g.box(1.1, 0.04, 0.54, WOOD, 0, 0.82, 0, 0.01);
  for (const [x, c] of [[-0.32, YELLOW], [0.0, ORANGE], [0.32, MINT]] as const) {
    g.cyl(0.11, 0.05, STEEL, x, 0.865, -0.04);
    g.box(0.18, 0.3, 0.18, c, x, 1.04, -0.04, 0.06);
    g.pane(0.24, 0.42, 0.24, PANE, 0.35, x, 1.1, -0.04, 0.08);
    g.box(0.25, 0.04, 0.25, STEEL, x, 1.33, -0.04, 0.02);
    g.box(0.04, 0.05, 0.08, STEEL, x, 0.93, 0.11, 0.01);
    g.cyl(0.035, 0.06, CREAM, x, 0.87, 0.18);
  }
  for (let i = 0; i < 4; i++) g.cyl(0.04, 0.03, i % 2 ? CREAM : PAPER, 0.48, 0.855 + i * 0.03, 0.15);
  return { w: 1.1, d: 0.54, h: 1.36 };
};

/** a juice bar: a counter under a striped awning, a blender, baskets of oranges, lemons and green apples */
const juicebar: Maker = (g, o) => {
  g.contact(1.3, 0.7);
  g.box(1.2, 0.9, 0.5, TEAL, 0, 0.45, 0.05, 0.03);
  g.box(1.0, 0.25, 0.02, CREAM, 0, 0.58, 0.31, 0.02);
  for (const [x, c] of [[-0.3, ORANGE], [0.0, YELLOW], [0.3, GREEN]] as const) g.ball(0.07, c, x, 0.58, 0.325).scale.set(1, 1, 0.5);
  g.box(1.26, 0.05, 0.58, WOOD_L, 0, 0.925, 0.05, 0.01);
  // posts and the awning
  for (const x of [-0.58, 0.58]) g.box(0.04, 0.95, 0.04, WOOD, x, 1.42, -0.18, 0.01);
  const aw = g.at(0, 1.86, -0.04); aw.root.rotation.x = 0.3;
  for (let i = 0; i < 7; i++) aw.box(0.18, 0.04, 0.5, i % 2 ? CREAM : ORANGE, -0.54 + i * 0.18, 0, 0, 0.01);
  // the blender, the baskets, two glasses
  g.box(0.14, 0.06, 0.14, SLATE, -0.38, 0.98, 0.0, 0.02);
  g.pane(0.12, 0.22, 0.12, PANE, 0.4, -0.38, 1.12, 0.0, 0.03);
  g.box(0.09, 0.12, 0.09, ORANGE, -0.38, 1.07, 0.0, 0.03);
  g.box(0.13, 0.03, 0.13, SLATE, -0.38, 1.245, 0.0, 0.01);
  for (const [x, c] of [[-0.05, ORANGE], [0.22, YELLOW]] as const) {
    g.box(0.22, 0.08, 0.18, WOOD, x, 0.99, -0.05, 0.03);
    for (let i = 0; i < 5; i++) g.ball(0.045, c, x - 0.07 + (i % 3) * 0.07, 1.05 + Math.floor(i / 3) * 0.04, -0.07 + (i % 2) * 0.05);
  }
  for (let i = 0; i < 3; i++) g.ball(0.045, LEAF_L, 0.46 + (i % 2) * 0.05, 0.99, -0.12 + i * 0.06);
  for (const [x, c] of [[0.1, ORANGE], [0.3, GREEN]] as const) { g.cyl(0.04, 0.12, c, x, 1.01, 0.22); g.box(0.008, 0.1, 0.008, CREAM, x + 0.02, 1.1, 0.22, 0); }
  g.ball(0.02, YELLOW, 0.55, 1.4, -0.16, 0.2 + o.night);
  return { w: 1.3, d: 0.72, h: 2.0, z: 0.0 };
};

/** a tea set on a low round table: the teapot, four cups on saucers, the sugar bowl, two floor cushions */
const teaset: Maker = (g) => {
  g.contact(1.3, 0.9);
  g.cyl(0.42, 0.04, WOOD, 0, 0.36, 0);
  g.cyl(0.38, 0.02, WOOD_D, 0, 0.33, 0);
  for (const [x, z] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]] as const) g.box(0.05, 0.32, 0.05, WOOD_D, x, 0.16, z, 0.015);
  // teapot: body, lid, knob, spout, handle
  const tp = g.ball(0.12, TEAL, 0, 0.48, -0.04); tp.scale.set(1.1, 0.85, 1);
  g.cyl(0.06, 0.03, lighter(TEAL, 0.3), 0, 0.585, -0.04);
  g.ball(0.025, CREAM, 0, 0.61, -0.04);
  const sp = g.box(0.04, 0.14, 0.04, TEAL, 0.15, 0.5, -0.04, 0.015); sp.rotation.z = -0.8;
  const hd = g.box(0.03, 0.12, 0.08, TEAL, -0.14, 0.49, -0.04, 0.015); hd.rotation.z = 0.2;
  for (const [x, z] of [[-0.24, 0.16], [0.24, 0.16], [-0.26, -0.16], [0.26, -0.18]] as const) {
    g.cyl(0.07, 0.01, CREAM, x, 0.385, z);
    g.cyl(0.04, 0.05, CREAM, x, 0.415, z);
    g.cyl(0.032, 0.005, AMBER, x, 0.44, z);
  }
  g.cyl(0.05, 0.06, SKY, 0.02, 0.41, 0.2); g.ball(0.02, CREAM, 0.02, 0.45, 0.2);
  // two floor cushions (designer m_40562): flat, round-cornered, puffed either side of a sunk button
  for (const x of [-0.5, 0.5]) {
    const c = x < 0 ? VIOLET : YELLOW;
    const cu = g.at(x, 0, 0.14); cu.root.rotation.y = x * 0.4;
    cu.box(0.34, 0.05, 0.34, c, 0, 0.03, 0, 0.1);
    for (const [dx, dz] of [[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]] as const) cu.ball(0.09, c, dx, 0.05, dz).scale.set(1, 0.3, 1);
    cu.ball(0.018, darker(c, 0.7), 0, 0.064, 0);
  }
  return { w: 1.44, d: 0.86, h: 0.64 };
};

/** a candy dispenser: a glass globe of sweets on a sky-blue body and a stand, its coin knob and chute */
const candy: Maker = (g) => {
  g.contact(0.6, 0.6);
  g.cyl(0.24, 0.05, SLATE, 0, 0.025, 0);
  g.cyl(0.04, 0.6, STEEL, 0, 0.35, 0);
  g.cyl(0.17, 0.3, SKY, 0, 0.8, 0);
  g.cyl(0.19, 0.03, darker(SKY, 0.8), 0, 0.965, 0);
  g.box(0.1, 0.1, 0.06, STEEL, 0, 0.84, 0.17, 0.02);
  const knob = g.cyl(0.04, 0.03, YELLOW, 0, 0.84, 0.215); knob.rotation.x = Math.PI / 2;
  g.box(0.08, 0.05, 0.08, SLATE, 0, 0.7, 0.18, 0.02);
  g.pane(0.36, 0.36, 0.36, PANE, 0.35, 0, 1.16, 0, 0.17);
  const sweets = [YELLOW, SKY, GREEN, ORANGE, VIOLET, CREAM, TEAL, AMBER];
  for (let i = 0; i < 20; i++) {
    const a = i * 2.4, r = 0.1 * ((i % 3) / 2);
    g.ball(0.035, sweets[i % sweets.length] as string, Math.cos(a) * r, 1.02 + Math.floor(i / 5) * 0.06, Math.sin(a) * r);
  }
  g.cyl(0.08, 0.04, darker(SKY, 0.8), 0, 1.36, 0);
  g.ball(0.035, YELLOW, 0, 1.4, 0);
  return { w: 0.6, d: 0.6, h: 1.44 };
};

/** a vintage fridge: rounded, mint, a freezer door and a big door, chrome handles, a badge, little feet, a fruit bowl on top */
const fridge: Maker = (g) => {
  g.contact(0.78, 0.66);
  for (const x of [-0.26, 0.26]) for (const z of [-0.2, 0.2]) g.cyl(0.03, 0.08, SLATE, x, 0.04, z);
  // a rounded box's bevel stands 0.4 r out of its w and d (style.ts roundBox): the doors sit on it
  g.box(0.7, 1.5, 0.56, MINT, 0, 0.83, 0, 0.14);
  g.box(0.62, 0.36, 0.03, lighter(MINT, 0.25), 0, 1.36, 0.35, 0.08);
  g.box(0.62, 0.92, 0.03, lighter(MINT, 0.25), 0, 0.66, 0.35, 0.08);
  g.box(0.05, 0.18, 0.06, STEEL, 0.24, 1.32, 0.39, 0.02);
  g.box(0.05, 0.3, 0.06, STEEL, 0.24, 0.92, 0.39, 0.02);
  g.box(0.16, 0.05, 0.02, STEEL, -0.16, 1.05, 0.38, 0.02);
  g.box(0.5, 0.04, 0.02, darker(MINT, 0.85), 0, 0.12, 0.35, 0.01);
  // a fruit bowl on top
  g.cyl(0.14, 0.06, CREAM, 0.08, 1.575, 0);
  for (const [x, z, c] of [[0.03, 0.02, ORANGE], [0.12, -0.03, YELLOW], [0.1, 0.06, GREEN]] as const) g.ball(0.05, c, x, 1.64, z);
  return { w: 0.82, d: 0.78, h: 1.7, z: 0.045 };
};

export const KITCHEN = { espresso, pizzaoven, grill, popcorn, icecream, drinks, juicebar, teaset, candy, fridge } satisfies Record<string, Maker>;

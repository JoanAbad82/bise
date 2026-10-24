// The objects of the workshop family: making things (Blender's easel; the printer of docs 1, sheets 2, slides 3: its pages show which), and the makers' tools:
// a 3D printer, a workbench, a sewing machine, a potter's wheel, a loom, a letterpress, an electronics bench, a robot arm.
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import { Vector3 } from 'three';
import { AMBER, CREAM, darker, glyph, GREEN, INK, lighter, ORANGE, PANE, PAPER, SCREEN, SKY, SLATE, SLATE_L, STEEL, TEAL, VIOLET, WOOD, WOOD_D, WOOD_L, YELLOW, type Maker, type Part } from './kit';

/** an easel (Blender, image generation): an A-frame, a canvas with clay blobs, a palette, a jar of brushes */
const easel: Maker = (g) => {
  g.contact(0.85, 0.75);
  for (const dx of [-0.28, 0.28]) { const l = g.box(0.055, 1.75, 0.055, WOOD, dx, 0.85, 0.08, 0.02); l.rotation.z = dx > 0 ? -0.13 : 0.13; l.rotation.x = -0.05; }
  const back = g.box(0.055, 1.6, 0.055, WOOD, 0, 0.78, -0.26, 0.02); back.rotation.x = 0.34;
  g.box(0.06, 0.06, 0.06, WOOD_D, 0, 1.68, 0.04, 0.02);
  g.box(0.8, 0.05, 0.14, WOOD_D, 0, 0.6, 0.14, 0.02);
  const cv = g.at(0, 1.03, 0.11); cv.root.rotation.x = -0.1;
  cv.box(0.86, 0.72, 0.05, WOOD_L, 0, 0, 0, 0.02);
  cv.box(0.8, 0.66, 0.02, CREAM, 0, 0, 0.026, 0.01);
  for (const [x, y, c, r] of [[-0.18, 0.06, ORANGE, 0.13], [0.13, 0.12, SKY, 0.1], [0.04, -0.13, GREEN, 0.1], [-0.2, -0.17, VIOLET, 0.06]] as const) cv.box(r * 2, r * 2, 0.02, c, x, y, 0.035, r * 0.95);
  // the palette on the tray and the brush jar on the floor
  const pal = g.at(0.22, 0.64, 0.18); pal.root.rotation.x = -0.3;
  pal.box(0.24, 0.02, 0.16, WOOD_L, 0, 0, 0, 0.06);
  for (const [x, c] of [[-0.06, ORANGE], [0.0, SKY], [0.06, YELLOW]] as const) pal.ball(0.022, c, x, 0.015, -0.03);
  g.cyl(0.07, 0.16, PANE, 0.42, 0.08, 0.3);
  for (const [dx, c] of [[-0.02, ORANGE], [0.02, SKY], [0.0, YELLOW]] as const) { const br = g.box(0.015, 0.3, 0.015, WOOD, 0.42 + dx, 0.24, 0.3, 0.005); br.rotation.z = dx * 6; g.ball(0.018, c, 0.42 + dx * 2.2, 0.39, 0.3); }
  return { w: 0.94, d: 0.94, h: 1.75, x: 0.03, z: -0.1 };
};

/** a printer on its stand (docs, sheets, slides): paper in, pages out with coloured lines, a ream below */
const printer: Maker = (g, o) => {
  g.contact(0.72, 0.6);
  g.box(0.72, 0.6, 0.56, WOOD, 0, 0.3, 0, 0.04);
  g.box(0.62, 0.22, 0.02, darker(WOOD, 0.85), 0, 0.42, 0.3, 0.02); g.box(0.14, 0.025, 0.02, STEEL, 0, 0.45, 0.314, 0.008);
  g.box(0.3, 0.1, 0.22, CREAM, -0.12, 0.13, 0.12, 0.01); g.box(0.31, 0.03, 0.23, SKY, -0.12, 0.13, 0.12, 0.005);
  // the printer: body, lid, the paper tray at the back with paper standing
  g.box(0.64, 0.3, 0.5, PAPER, 0, 0.75, 0, 0.07);
  g.box(0.66, 0.06, 0.52, lighter(STEEL, 0.4), 0, 0.92, -0.01, 0.03);
  g.box(0.5, 0.05, 0.03, SLATE, 0, 0.66, 0.255, 0.01);
  const tray = g.box(0.44, 0.3, 0.03, SLATE_L, 0, 1.05, -0.24, 0.015); tray.rotation.x = -0.3;
  const pp = g.box(0.4, 0.26, 0.01, CREAM, 0, 1.08, -0.22, 0.004); pp.rotation.x = -0.3;
  // panel: a little screen and two buttons
  g.box(0.2, 0.06, 0.1, SLATE, 0.18, 0.955, 0.17, 0.015); g.box(0.1, 0.035, 0.01, '#bfe1f2', 0.15, 0.97, 0.232, 0.004, 0.3 + o.night);
  g.ball(0.018, GREEN, 0.25, 0.97, 0.22, 0.5 + o.night);
  // pages out: what this plugin makes (o.n 1 docs: text lines, 2 sheets: a grid, 3 slides: a slide with a chart block)
  for (let i = 0; i < 3; i++) {
    const p = g.at(-0.03 + i * 0.012, 0.64 + i * 0.012, 0.36); p.root.rotation.x = 0.1; p.root.rotation.y = (i - 1) * 0.06;
    const top = i === 2;
    if (o.n === 3) {
      p.box(0.4, 0.008, 0.26, CREAM, 0, 0, 0, 0.002);
      if (top) { p.box(0.3, 0.006, 0.03, AMBER, 0, 0.006, -0.08, 0.002); for (let b = 0; b < 3; b++) p.box(0.05, 0.006, 0.06 + b * 0.025, [AMBER, YELLOW, SKY][b] as string, -0.1 + b * 0.08, 0.006, 0.05 - b * 0.012, 0.002); }
    } else if (o.n === 2) {
      p.box(0.36, 0.008, 0.3, CREAM, 0, 0, 0, 0.002);
      if (top) { for (let r = 0; r < 4; r++) p.box(0.3, 0.006, 0.008, GREEN, 0, 0.006, -0.11 + r * 0.07, 0); for (let c = 0; c < 4; c++) p.box(0.008, 0.006, 0.24, GREEN, -0.13 + c * 0.087, 0.006, -0.005, 0); p.box(0.08, 0.006, 0.06, lighter(GREEN, 0.5), -0.09, 0.005, -0.075, 0); }
    } else {
      p.box(0.3, 0.008, 0.36, CREAM, 0, 0, 0, 0.002);
      if (top) { p.box(0.16, 0.006, 0.03, SKY, -0.05, 0.006, -0.13, 0.002); for (let r = 0; r < 5; r++) p.box(0.22 - (r % 2) * 0.05, 0.006, 0.015, '#9aa7b2', -0.02 - (r % 2) * 0.025, 0.006, -0.07 + r * 0.045, 0.002); }
    }
  }
  // the stand and the pages out in front
  return { w: 0.76, d: 0.86, h: 1.21, z: 0.12 };
};

/** a rod of thickness t from a to b (an arm, a lever, a thread) */
function rod(g: Part, a: readonly [number, number, number], b: readonly [number, number, number], t: number, color: string): void {
  const d = new Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const m = g.box(t, d.length(), t, color, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, t * 0.4);
  m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), d.normalize());
}

/** a horizontal cylinder along x (a spool, a beam, a roller) */
function xcyl(g: Part, r: number, len: number, color: string, x: number, y: number, z: number, glow = 0): void {
  g.cyl(r, len, color, x, y, z, glow).rotation.z = Math.PI / 2;
}

/** cast iron: the presses' and the machines' frames */
const IRON = '#2e3a44';
/** brass: the press's eagle ball */
const BRASS = '#c9a24a';
/** wet clay and fired terracotta (orange-brown, never a red) */
const CLAY = '#c98a5e';

/** a 3D printer on its cabinet: the frame, the bed with a vase half printed, the head on its gantry, a violet spool, a glowing screen */
const printer3d: Maker = (g, o) => {
  g.contact(0.8, 0.6);
  g.box(0.8, 0.6, 0.6, WOOD, 0, 0.3, 0, 0.04);
  // the drawers stand out of the cabinet's rounded front (a clay box bulges by its bevel)
  for (const y of [0.17, 0.43]) { g.box(0.7, 0.2, 0.02, darker(WOOD, 0.88), 0, y, 0.322, 0.008); g.box(0.14, 0.025, 0.02, STEEL, 0, y + 0.04, 0.338, 0.008); }
  // the printer: a dark base, four posts, a top frame (its side bars a hair lower and wider than the front ones)
  g.box(0.62, 0.08, 0.52, SLATE, 0, 0.64, 0, 0.02);
  g.box(0.24, 0.05, 0.01, '#bfe1f2', -0.12, 0.64, 0.268, 0.006, 0.3 + o.night * 0.4);
  for (const x of [-0.28, 0.28]) for (const z of [-0.23, 0.23]) g.box(0.04, 0.72, 0.04, SLATE_L, x, 1.04, z, 0.01);
  for (const z of [-0.23, 0.23]) g.box(0.62, 0.04, 0.045, SLATE, 0, 1.41, z, 0.012);
  for (const x of [-0.28, 0.28]) g.box(0.05, 0.05, 0.5, SLATE, x, 1.398, 0, 0.012);
  // the bed and the vase on it, its layers a little lighter each
  g.box(0.42, 0.025, 0.38, INK, 0, 0.82, 0, 0.006);
  for (let k = 0; k < 6; k++) g.cyl(0.07 + Math.sin(k * 0.6) * 0.025, 0.026, k % 2 ? ORANGE : lighter(ORANGE, 0.18), 0, 0.846 + k * 0.026, 0);
  // the gantry, the head over the vase, the nozzle
  g.box(0.52, 0.035, 0.035, STEEL, 0, 1.15, 0, 0.01);
  g.box(0.1, 0.1, 0.08, ORANGE, 0.03, 1.12, 0.03, 0.02);
  g.cone(0.018, 0.04, INK, 0.03, 1.05, 0.03).rotation.x = Math.PI;
  g.box(0.06, 0.03, 0.01, YELLOW, 0.03, 1.13, 0.075, 0.006, 0.4);
  // the spool on its arm at the side, the filament to the head
  g.box(0.08, 0.025, 0.025, SLATE, 0.33, 1.25, 0, 0.008);
  xcyl(g, 0.11, 0.06, VIOLET, 0.39, 1.25, 0); xcyl(g, 0.045, 0.065, CREAM, 0.39, 1.25, 0);
  rod(g, [0.36, 1.17, 0.02], [0.06, 1.17, 0.03], 0.008, VIOLET);
  return { w: 0.92, d: 0.66, h: 1.44, x: 0.04 };
};

/** a workbench: a thick top, a vise, a plane and its shavings on a plank, a pegboard of tools, a clamp lamp, a toolbox below */
const workbench: Maker = (g, o) => {
  const w = 1.6, d = 0.7;
  g.contact(w, d);
  g.box(w, 0.08, d, WOOD_L, 0, 0.86, 0, 0.02);
  for (const x of [-0.72, 0.72]) for (const z of [-0.28, 0.28]) g.box(0.09, 0.82, 0.09, WOOD_D, x, 0.41, z, 0.02);
  g.box(1.38, 0.04, 0.52, WOOD, 0, 0.2, 0, 0.012);
  g.box(0.42, 0.22, 0.24, ORANGE, -0.32, 0.33, 0.02, 0.03); g.box(0.2, 0.03, 0.04, INK, -0.32, 0.46, 0.02, 0.01);
  g.box(0.36, 0.14, 0.3, SKY, 0.3, 0.29, 0.0, 0.02);
  // the vise at the front right: body, jaw, the screw and its bar
  g.box(0.16, 0.12, 0.14, IRON, 0.6, 0.96, 0.2, 0.02); g.box(0.16, 0.12, 0.04, IRON, 0.6, 0.96, 0.3, 0.015);
  g.cyl(0.02, 0.08, STEEL, 0.6, 0.93, 0.35).rotation.x = Math.PI / 2; xcyl(g, 0.012, 0.22, STEEL, 0.6, 0.93, 0.385);
  // a plank with the plane on it and three curls of shaving
  g.box(0.7, 0.04, 0.16, WOOD, -0.15, 0.92, 0.12, 0.01);
  g.box(0.22, 0.07, 0.07, WOOD_D, -0.05, 0.975, 0.12, 0.02); g.box(0.2, 0.012, 0.075, STEEL, -0.05, 1.014, 0.12, 0.004); g.ball(0.035, WOOD_D, 0.04, 1.03, 0.12);
  for (const [x, z] of [[-0.35, 0.18], [-0.42, 0.06], [-0.28, 0.0]] as const) g.ball(0.03, WOOD_L, x, 0.945, z);
  // the pegboard behind, its tools on hooks
  g.box(1.5, 0.8, 0.04, WOOD, 0, 1.32, -0.31, 0.015);
  for (const x of [-0.7, 0.7]) g.box(0.06, 0.86, 0.06, WOOD_D, x, 1.33, -0.29, 0.015);
  const z = -0.28;
  // a hammer, a saw, a wrench, three screwdrivers, a ruler
  g.box(0.03, 0.3, 0.02, WOOD_D, -0.55, 1.36, z, 0.01); g.box(0.14, 0.05, 0.03, IRON, -0.55, 1.53, z + 0.005, 0.01);
  g.box(0.3, 0.14, 0.008, STEEL, -0.25, 1.4, z, 0.004); g.box(0.09, 0.12, 0.025, WOOD_D, -0.07, 1.42, z + 0.005, 0.02);
  const wr = g.box(0.035, 0.3, 0.015, STEEL, 0.13, 1.35, z, 0.008); wr.rotation.z = 0.25; g.box(0.08, 0.06, 0.018, STEEL, 0.17, 1.5, z + 0.002, 0.02);
  for (const [k, c] of [TEAL, YELLOW, SKY].entries()) { g.box(0.035, 0.11, 0.03, c, 0.33 + k * 0.08, 1.48, z + 0.005, 0.012); g.box(0.012, 0.14, 0.012, STEEL, 0.33 + k * 0.08, 1.36, z, 0.004); }
  g.box(0.5, 0.04, 0.008, YELLOW, -0.3, 1.0 + 0.12, z, 0.004);
  for (let k = 0; k < 8; k++) g.box(0.006, 0.02, 0.004, INK, -0.52 + k * 0.06, 1.13, z + 0.006, 0);
  // the clamp lamp on the board's top, lit at night
  rod(g, [0.62, 1.72, -0.3], [0.5, 1.85, -0.15], 0.025, IRON);
  g.cyl(0.08, 0.1, YELLOW, 0.48, 1.8, -0.1, 0.2 + o.night * 0.5);
  return { w: 1.66, d: 0.8, h: 1.9 };
};

/** a sewing machine on its treadle table: the iron stand and wheel, the machine in teal with gold lines, its spool, the fabric under the needle, a pincushion and scissors */
const sewing: Maker = (g) => {
  const body = '#2f8a80';
  g.contact(1.0, 0.55);
  // the iron stand: two openwork sides, the treadle, the big wheel
  for (const x of [-0.42, 0.42]) {
    for (const z of [-0.18, 0.18]) g.box(0.05, 0.72, 0.045, IRON, x, 0.37, z, 0.015);
    g.box(0.05, 0.045, 0.44, IRON, x, 0.05, 0, 0.015);
    rod(g, [x, 0.1, -0.18], [x, 0.62, 0.18], 0.035, IRON);
  }
  const tr = g.box(0.6, 0.03, 0.3, IRON, 0, 0.1, 0.04, 0.01); tr.rotation.x = -0.12;
  xcyl(g, 0.2, 0.035, IRON, 0.36, 0.36, 0); xcyl(g, 0.05, 0.05, STEEL, 0.36, 0.36, 0);
  g.box(1.0, 0.05, 0.5, WOOD, 0, 0.76, 0, 0.015);
  g.box(0.3, 0.12, 0.42, WOOD_D, -0.3, 0.67, 0, 0.015); g.ball(0.02, YELLOW, -0.3, 0.67, 0.215);
  // the machine: base plate, pillar, arm, head with the needle, the handwheel, the spool on top
  g.box(0.52, 0.05, 0.24, body, 0, 0.81, 0, 0.015);
  g.box(0.11, 0.24, 0.16, body, 0.17, 0.95, -0.02, 0.03);
  g.box(0.46, 0.1, 0.14, body, 0.0, 1.1, -0.02, 0.04);
  g.box(0.1, 0.17, 0.14, body, -0.18, 1.0, -0.02, 0.03);
  g.box(0.007, 0.07, 0.007, STEEL, -0.18, 0.88, 0.0, 0);
  g.box(0.3, 0.012, 0.004, YELLOW, 0.0, 1.11, 0.054, 0.002); g.box(0.07, 0.04, 0.004, YELLOW, 0.17, 0.95, 0.064, 0.008);
  xcyl(g, 0.075, 0.035, STEEL, 0.27, 1.06, -0.02);
  g.cyl(0.006, 0.08, STEEL, 0.05, 1.18, -0.02); g.cyl(0.028, 0.05, YELLOW, 0.05, 1.18, -0.02);
  // the fabric: on the plate under the needle and hanging over the table's front edge
  g.box(0.36, 0.006, 0.22, SKY, -0.1, 0.84, 0.06, 0.002);
  for (let k = 0; k < 3; k++) g.box(0.36, 0.004, 0.025, YELLOW, -0.1, 0.845, -0.02 + k * 0.06, 0);
  g.box(0.36, 0.14, 0.006, SKY, -0.1, 0.72, 0.258, 0.002);
  // the pincushion with its pins, the scissors
  g.ball(0.045, ORANGE, 0.36, 0.83, 0.12); for (const [dx, c] of [[-0.02, YELLOW], [0.02, SKY], [0, CREAM]] as const) g.ball(0.01, c, 0.36 + dx, 0.875, 0.12 + dx);
  for (const s of [-1, 1]) { const b = g.box(0.012, 0.005, 0.16, STEEL, 0.28 + s * 0.012, 0.79, -0.15, 0.002); b.rotation.y = s * 0.2; g.cyl(0.022, 0.006, ORANGE, 0.28 + s * 0.03, 0.79, -0.06); }
  return { w: 1.04, d: 0.56, h: 1.22 };
};

/** a potter's wheel: its body and splash pan, a pot rising on the wheel head, a stool, a bucket, the fired pots on a board */
const pottery: Maker = (g) => {
  g.contact(1.2, 0.95, 0, 0.0);
  g.box(0.55, 0.36, 0.5, SLATE_L, 0, 0.18, 0, 0.05);
  g.box(0.5, 0.02, 0.01, SLATE, 0, 0.3, 0.255, 0.006);
  g.cyl(0.31, 0.12, '#e8e1d6', 0, 0.42, 0); g.cyl(0.27, 0.01, lighter(CLAY, 0.45), 0, 0.44, 0);
  g.cyl(0.04, 0.06, STEEL, 0, 0.48, 0); g.cyl(0.2, 0.03, SLATE, 0, 0.5, 0);
  // the pot: wet clay, its belly, the neck, the lip
  const pot = g.at(0, 0.515, 0);
  pot.cyl(0.08, 0.04, CLAY, 0, 0.02, 0);
  const belly = pot.ball(0.12, CLAY, 0, 0.13, 0); belly.scale.set(1, 0.85, 1);
  pot.cyl(0.065, 0.1, CLAY, 0, 0.27, 0); pot.cyl(0.085, 0.025, darker(CLAY, 0.9), 0, 0.325, 0);
  // the pedal, the stool at its side, a bucket of water with a sponge
  g.box(0.12, 0.05, 0.18, IRON, 0.36, 0.025, 0.12, 0.015);
  g.cyl(0.17, 0.05, WOOD, -0.46, 0.42, 0.1); for (const [dx, dz] of [[-0.1, -0.06], [0.1, -0.06], [0, 0.11]] as const) g.box(0.04, 0.4, 0.04, WOOD_D, -0.46 + dx, 0.2, 0.1 + dz, 0.012);
  g.cyl(0.11, 0.22, STEEL, 0.45, 0.11, 0.32); g.cyl(0.095, 0.01, SKY, 0.45, 0.2, 0.32); g.box(0.08, 0.04, 0.06, YELLOW, 0.47, 0.215, 0.3, 0.015);
  // fired pots on a board on two bricks, behind
  for (const x of [-0.35, 0.35]) g.box(0.12, 0.16, 0.12, CLAY, x, 0.08, -0.38, 0.01);
  g.box(0.9, 0.04, 0.18, WOOD, 0, 0.18, -0.38, 0.01);
  for (const [x, c, s] of [[-0.3, TEAL, 1], [-0.05, CREAM, 0.8], [0.2, ORANGE, 1.1]] as const) { g.cyl(0.06 * s, 0.14 * s, c, x, 0.2 + 0.07 * s, -0.38); g.cyl(0.045 * s, 0.03, darker(c, 0.85), x, 0.2 + 0.14 * s + 0.015, -0.38); }
  return { w: 1.28, d: 0.95, h: 0.92 };
};

/** a floor loom: the frame, the warp beam at the back, the threads through two shafts, the cloth growing in stripes, the beater, the shuttle, treadles, its bench */
const loom: Maker = (g) => {
  g.contact(1.3, 1.25, 0, 0.1);
  for (const x of [-0.55, 0.55]) {
    for (const z of [-0.38, 0.38]) g.box(0.08, 1.5, 0.08, WOOD_D, x, 0.75, z, 0.02);
    g.box(0.085, 0.08, 0.86, WOOD, x, 1.48, 0, 0.02);
    g.box(0.085, 0.06, 0.86, WOOD, x, 0.25, 0, 0.02);
  }
  g.box(1.18, 0.08, 0.08, WOOD, 0, 1.5, 0, 0.02);
  // the warp beam wound in cream, the cloth beam at the front
  xcyl(g, 0.045, 1.1, WOOD_D, 0, 0.62, -0.38); xcyl(g, 0.09, 0.84, CREAM, 0, 0.62, -0.38);
  xcyl(g, 0.045, 1.1, WOOD_D, 0, 0.82, 0.38);
  // the threads from the back to the shafts
  for (let k = 0; k < 18; k++) rod(g, [-0.38 + k * 0.045, 0.7, -0.32], [-0.38 + k * 0.045, 0.88, 0.0], 0.008, CREAM);
  // two shafts hanging from the top beam
  for (const [i, zz] of [-0.06, -0.01].entries()) {
    for (const y of [0.72, 1.12]) g.box(0.86, 0.03, 0.025, STEEL, 0, y + i * 0.01, zz, 0.008);
    for (const x of [-0.42, 0.42]) g.box(0.025, 0.42, 0.025, STEEL, x + i * 0.015, 0.92, zz, 0.008);
    for (const x of [-0.42, 0.42]) g.box(0.012, 0.32, 0.012, INK, x * 0.6 + i * 0.03, 1.31, zz, 0.004);
  }
  // the cloth: woven in stripes toward the front, the beater against it
  const cloth = [TEAL, YELLOW, CREAM, SKY, TEAL, ORANGE, CREAM];
  for (const [k, c] of cloth.entries()) g.box(0.82, 0.014, 0.04, c, 0, 0.885, 0.1 + k * 0.04, 0.003);
  g.box(0.82, 0.03, 0.015, WOOD_L, 0, 0.9, 0.06, 0.006);
  g.box(0.95, 0.04, 0.05, WOOD_L, 0, 1.05, 0.06, 0.012); for (const x of [-0.46, 0.46]) g.box(0.04, 0.8, 0.04, WOOD_L, x, 0.66, 0.06, 0.012);
  g.box(0.24, 0.035, 0.06, WOOD_L, 0.15, 0.91, 0.24, 0.015); g.box(0.12, 0.02, 0.03, YELLOW, 0.15, 0.935, 0.24, 0.008);
  // the treadles on the floor, the bench in front
  for (let k = 0; k < 4; k++) g.box(0.06, 0.04, 0.6, WOOD_D, -0.18 + k * 0.12, 0.05, 0.05, 0.012);
  g.box(0.95, 0.05, 0.28, WOOD, 0, 0.48, 0.66, 0.015);
  for (const x of [-0.4, 0.4]) g.box(0.05, 0.46, 0.22, WOOD_D, x, 0.23, 0.66, 0.012);
  return { w: 1.2, d: 1.4, h: 1.54, z: 0.12 };
};

/** a letterpress: an iron hand press on its table, the brass eagle ball, the lever, the type in its bed, the ink roller, printed sheets with the :* */
const press: Maker = (g) => {
  g.contact(1.3, 0.8);
  g.box(1.26, 0.06, 0.74, WOOD_D, 0, 0.64, 0, 0.02);
  for (const x of [-0.58, 0.58]) for (const z of [-0.32, 0.32]) g.box(0.08, 0.62, 0.08, WOOD_D, x, 0.31, z, 0.02);
  g.box(1.1, 0.04, 0.6, WOOD, 0, 0.18, 0, 0.012);
  // the type case below, its little compartments
  g.box(0.5, 0.06, 0.4, WOOD_L, -0.3, 0.23, 0, 0.01);
  for (let k = 0; k < 6; k++) g.box(0.06, 0.03, 0.06, [INK, SLATE, IRON][k % 3] as string, -0.48 + k * 0.07, 0.27, 0.1 - (k % 2) * 0.12, 0.008);
  // the press: two rails out to the front, the cheeks, the crown, the brass ball, the platen, the lever
  const x0 = 0.18;
  for (const dz of [-0.13, 0.13]) g.box(0.05, 0.05, 0.7, IRON, x0 + dz, 0.695, 0, 0.012);
  g.box(0.36, 0.05, 0.3, SLATE, x0, 0.735, 0.15, 0.01);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) g.box(0.035, 0.02, 0.035, INK, x0 - 0.1 + c * 0.04, 0.765, 0.08 + r * 0.045, 0.004);
  for (const dx of [-0.2, 0.2]) g.box(0.08, 0.66, 0.16, IRON, x0 + dx, 1.05, -0.12, 0.02);
  g.box(0.5, 0.12, 0.2, IRON, x0, 1.42, -0.12, 0.03);
  g.ball(0.07, YELLOW, x0, 1.55, -0.12); g.cyl(0.03, 0.04, BRASS, x0, 1.49, -0.12);
  g.box(0.3, 0.06, 0.24, SLATE_L, x0, 0.98, -0.1, 0.015);
  g.cyl(0.04, 0.3, STEEL, x0, 1.2, -0.12);
  rod(g, [x0 + 0.2, 1.15, -0.12], [x0 + 0.41, 1.05, 0.18], 0.035, IRON);
  g.cyl(0.03, 0.14, WOOD, x0 + 0.41, 1.12, 0.18);
  // the ink roller and the slab
  g.box(0.24, 0.02, 0.2, STEEL, -0.48, 0.68, 0.2, 0.006); g.box(0.16, 0.006, 0.12, INK, -0.48, 0.693, 0.2, 0.002);
  xcyl(g, 0.03, 0.14, INK, -0.48, 0.73, 0.2); rod(g, [-0.48, 0.73, 0.2], [-0.48, 0.78, 0.3], 0.02, WOOD);
  // printed sheets on the table: the :* and a headline
  for (let k = 0; k < 3; k++) {
    const s = g.at(-0.3 + k * 0.01, 0.675 + k * 0.004, -0.15); s.root.rotation.y = 0.1 - k * 0.07;
    s.box(0.3, 0.004, 0.36, CREAM, 0, 0, 0, 0.002);
    if (k === 2) { s.box(0.2, 0.004, 0.035, VIOLET, 0, 0.004, -0.12, 0.002); const f = s.at(0, 0.006, 0.04); f.root.rotation.x = -Math.PI / 2; glyph(f, 0, 0, 0, INK, 0.022); }
  }
  return { w: 1.3, d: 0.78, h: 1.63 };
};

/** an electronics bench: a teal mat, a breadboard with chips, LEDs and wires, an oscilloscope with its wave, a soldering station, a magnifier lamp, a shelf of parts and spools */
const electronics: Maker = (g, o) => {
  const lit = 0.3 + o.night * 0.5;
  g.contact(1.4, 0.7);
  g.box(1.4, 0.06, 0.66, WOOD_L, 0, 0.75, 0, 0.015);
  for (const x of [-0.64, 0.64]) for (const z of [-0.27, 0.27]) g.box(0.05, 0.72, 0.05, STEEL, x, 0.36, z, 0.012);
  g.box(0.8, 0.006, 0.44, TEAL, 0.05, 0.783, 0.06, 0.003);
  // the breadboard: chips, LEDs, wires in arcs
  g.box(0.3, 0.03, 0.18, CREAM, 0.05, 0.8, 0.12, 0.006);
  for (const dx of [-0.07, 0.04]) g.box(0.07, 0.02, 0.04, INK, 0.05 + dx, 0.824, 0.12, 0.004);
  for (const [k, c] of [GREEN, YELLOW, SKY].entries()) g.ball(0.012, c, -0.06 + k * 0.03, 0.824, 0.18, lit);
  for (const [k, c] of [ORANGE, SKY, YELLOW].entries()) { const x = -0.04 + k * 0.06; rod(g, [x, 0.815, 0.06], [x + 0.03, 0.85, 0.12], 0.008, c); rod(g, [x + 0.03, 0.85, 0.12], [x + 0.06, 0.815, 0.17], 0.008, c); }
  // a green board with its chip
  g.box(0.22, 0.012, 0.15, GREEN, 0.38, 0.792, 0.16, 0.003); g.box(0.06, 0.012, 0.06, INK, 0.36, 0.804, 0.16, 0.003);
  // the oscilloscope, its screen and wave
  g.box(0.38, 0.26, 0.3, SLATE, -0.45, 0.91, -0.1, 0.03);
  g.box(0.2, 0.15, 0.01, SCREEN, -0.5, 0.93, 0.055, 0.01, 0.15 + o.night * 0.3);
  for (let k = 0; k < 6; k++) { const s = g.box(0.04, 0.01, 0.004, GREEN, -0.585 + k * 0.034, 0.93 + Math.sin(k * 1.4) * 0.035, 0.064, 0.002, lit); s.rotation.z = Math.cos(k * 1.4) * 0.8; }
  for (const y of [0.97, 0.89]) g.cyl(0.02, 0.02, STEEL, -0.32, y, 0.06).rotation.x = Math.PI / 2;
  // the soldering station, the iron in its holder
  g.box(0.16, 0.1, 0.14, SLATE_L, 0.45, 0.83, -0.15, 0.02);
  g.box(0.08, 0.035, 0.01, AMBER, 0.45, 0.85, -0.066, 0.004, lit);
  rod(g, [0.58, 0.79, -0.15], [0.62, 0.92, -0.08], 0.03, STEEL);
  rod(g, [0.6, 0.86, -0.12], [0.66, 0.98, -0.02], 0.016, INK); g.cyl(0.02, 0.08, YELLOW, 0.67, 1.0, -0.01);
  // the magnifier lamp: clamp, two arms, the ring with its lens
  rod(g, [0.2, 0.79, -0.28], [0.15, 1.2, -0.22], 0.03, IRON);
  rod(g, [0.15, 1.2, -0.22], [0.08, 1.12, 0.02], 0.03, IRON);
  const ring = g.cyl(0.1, 0.03, STEEL, 0.06, 1.08, 0.06, 0.1 + o.night * 0.4); ring.rotation.x = 0.4;
  const lens = g.pane(0.15, 0.012, 0.15, PANE, 0.4, 0.06, 1.065, 0.065, 0.07); lens.rotation.x = 0.4;
  // the back shelf: parts drawers and spools of wire
  g.box(1.3, 0.04, 0.2, WOOD, 0, 1.25, -0.24, 0.012);
  for (const x of [-0.62, 0.62]) g.box(0.04, 0.47, 0.04, WOOD_D, x, 1.015, -0.24, 0.012);
  for (let k = 0; k < 4; k++) { g.box(0.14, 0.12, 0.16, k % 2 ? SKY : CREAM, -0.52 + k * 0.15, 1.33, -0.24, 0.015); g.box(0.04, 0.015, 0.01, SLATE, -0.52 + k * 0.15, 1.33, -0.155, 0.004); }
  for (const [k, c] of [ORANGE, SKY, YELLOW].entries()) { xcyl(g, 0.06, 0.05, c, 0.18 + k * 0.12, 1.33, -0.24); xcyl(g, 0.02, 0.055, WOOD_L, 0.18 + k * 0.12, 1.33, -0.24); }
  return { w: 1.44, d: 0.7, h: 1.45 };
};

/** a robot arm on its platform: a turret, the arm in amber with steel joints, a gripper holding a block, blocks stacked, a status light */
const robotarm: Maker = (g, o) => {
  g.contact(0.9, 0.9);
  g.box(0.9, 0.12, 0.9, SLATE, 0, 0.06, 0, 0.02);
  // a band of hazard stripes along its front edge
  for (let k = 0; k < 7; k++) g.box(0.06, 0.004, 0.06, k % 2 ? INK : YELLOW, -0.36 + k * 0.12, 0.122, 0.39, 0.002);
  g.cyl(0.2, 0.12, SLATE_L, 0, 0.18, -0.1); g.cyl(0.16, 0.06, IRON, 0, 0.27, -0.1);
  g.box(0.22, 0.2, 0.22, AMBER, 0, 0.4, -0.1, 0.05);
  xcyl(g, 0.09, 0.3, STEEL, 0, 0.46, -0.1);
  const sh: [number, number, number] = [0, 0.46, -0.1], el: [number, number, number] = [0.04, 0.98, -0.2], wr: [number, number, number] = [0.15, 0.72, 0.18];
  rod(g, sh, el, 0.14, AMBER);
  xcyl(g, 0.075, 0.2, STEEL, el[0], el[1], el[2]);
  rod(g, el, wr, 0.11, AMBER);
  g.ball(0.06, STEEL, wr[0], wr[1], wr[2]);
  rod(g, [0.08, 0.98, -0.2], [0.21, 0.74, 0.18], 0.02, INK);
  // the gripper's two fingers and the block between them
  g.box(0.1, 0.04, 0.06, IRON, wr[0], wr[1] - 0.07, wr[2], 0.01);
  for (const dx of [-0.045, 0.045]) g.box(0.02, 0.1, 0.05, IRON, wr[0] + dx, wr[1] - 0.14, wr[2], 0.006);
  g.box(0.07, 0.07, 0.07, TEAL, wr[0], wr[1] - 0.17, wr[2], 0.012);
  // blocks stacked on the platform, the status light on the base
  for (const [k, c] of [YELLOW, SKY, ORANGE].entries()) g.box(0.1, 0.1, 0.1, c, -0.26 + (k === 2 ? 0.02 : 0), 0.17 + (k === 2 ? 0.1 : 0), 0.22 + (k === 1 ? -0.12 : 0), 0.015).rotation.y = k * 0.3;
  g.cyl(0.03, 0.04, GREEN, 0.15, 0.31, 0.0, 0.3 + o.night * 0.5);
  return { w: 0.9, d: 0.9, h: 1.08 };
};

export const WORKSHOP = { easel, printer, printer3d, workbench, sewing, pottery, loom, press, electronics, robotarm } satisfies Record<string, Maker>;

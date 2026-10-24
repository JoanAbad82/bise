// The objects of the machines family: an MCP server's rack (a yellow light per tool group on, n) and computer use's desk,
// and the rest of the collection (page bims-plugins): a retro computer, a CRT television, a snack machine, a photo booth,
// a little robot, a drone on its pad, a grandfather clock, a console of lights.
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import { AMBER, CREAM, darker, GREEN, INK, LEAF, LEAF_L, lighter, ORANGE, PANE, PAPER, SCREEN, SKY, SLATE, SLATE_L, STEEL, TEAL, VIOLET, WOOD, WOOD_D, WOOD_L, YELLOW, type Maker } from './kit';

/** a server rack (an MCP server): units, a yellow light per tool group on, handles, vents, cables */
const rack: Maker = (g, o) => {
  const w = 0.72, d = 0.78;
  g.contact(w, d);
  g.box(w, 1.82, d, SLATE, 0, 0.91, 0, 0.06);
  g.box(w + 0.03, 0.07, d + 0.03, SKY, 0, 1.84, 0, 0.025);
  for (const [x, z] of [[-w / 2 + 0.08, -d / 2 + 0.08], [w / 2 - 0.08, -d / 2 + 0.08], [-w / 2 + 0.08, d / 2 - 0.08], [w / 2 - 0.08, d / 2 - 0.08]] as const) g.cyl(0.04, 0.05, INK, x, 0.02, z);
  g.box(w - 0.1, 1.6, 0.03, '#252e36', 0, 0.94, d / 2 + 0.012, 0.02);
  for (let i = 0; i < 7; i++) {
    const y = 0.28 + i * 0.22;
    g.box(w - 0.16, 0.17, 0.03, i % 2 ? SLATE_L : '#4a5866', 0, y, d / 2 + 0.02, 0.012);
    for (let v = 0; v < 5; v++) g.box(0.035, 0.012, 0.01, INK, -0.18 + v * 0.05, y + 0.03, d / 2 + 0.037, 0);
    g.box(0.02, 0.1, 0.02, STEEL, -w / 2 + 0.11, y, d / 2 + 0.045, 0.005);
    const live = i < o.n;
    g.box(0.07, 0.045, 0.02, live ? YELLOW : '#5b6a78', w / 2 - 0.15, y + 0.02, d / 2 + 0.04, 0.01, live ? 0.7 + o.night : 0);
    if (live) g.ball(0.018, GREEN, w / 2 - 0.15, y - 0.04, d / 2 + 0.04, 0.6 + o.night);
  }
  // cables out of the side, down to the floor in a loop
  for (const [i, c] of [[0, YELLOW], [1, SKY], [2, ORANGE]] as const) {
    const x = w / 2 + 0.01, y = 1.5 - i * 0.18;
    g.box(0.06, 0.03, 0.03, INK, x, y, 0.2 - i * 0.1, 0.008);
    g.box(0.03, y - 0.05, 0.03, c, x + 0.04 + i * 0.03, y / 2, 0.2 - i * 0.1, 0.012);
    g.box(0.25, 0.03, 0.03, c, x + 0.16 + i * 0.03, 0.03, 0.2 - i * 0.1, 0.012);
  }
  g.box(0.3, 0.07, 0.005, CREAM, 0, 1.76, d / 2 + 0.03, 0.01);
  // the rack and its cables looping out on the right
  return { w: 1.11, d: 0.87, h: 1.88, x: 0.17, z: 0.02 };
};

/** a desk with a desktop computer (computer use): the screen shows windows and a cursor, a mug, a plant */
const macdesk: Maker = (g, o) => {
  g.contact(1.35, 0.72);
  g.box(1.36, 0.07, 0.72, WOOD_L, 0, 0.745, 0, 0.025);
  for (const x of [-0.6, 0.6]) g.box(0.07, 0.72, 0.62, WOOD, x, 0.36, 0, 0.025);
  g.box(0.38, 0.22, 0.6, WOOD, 0.4, 0.58, 0, 0.025);
  for (const y of [0.52, 0.63]) g.box(0.12, 0.02, 0.01, STEEL, 0.4, y, 0.316, 0.005);
  // the computer: foot, neck, screen with two windows and a cursor
  g.box(0.2, 0.025, 0.16, STEEL, -0.05, 0.79, -0.12, 0.01);
  const st = g.box(0.06, 0.3, 0.035, STEEL, -0.05, 0.93, -0.14, 0.012); st.rotation.x = 0.12;
  g.box(0.76, 0.5, 0.045, STEEL, -0.05, 1.25, -0.12, 0.035);
  // the glass out of the frame's rounded front (z -0.089), then each layer 2 mm out of the one under it
  g.box(0.7, 0.38, 0.01, '#e8f4fd', -0.05, 1.28, -0.083, 0.01, 0.25 + o.night * 0.6);
  g.box(0.3, 0.22, 0.01, CREAM, -0.18, 1.29, -0.076, 0.008); g.box(0.3, 0.035, 0.01, SKY, -0.18, 1.385, -0.07, 0.006);
  g.box(0.26, 0.2, 0.01, CREAM, 0.12, 1.25, -0.075, 0.008); g.box(0.26, 0.035, 0.01, ORANGE, 0.12, 1.335, -0.069, 0.006);
  g.box(0.04, 0.06, 0.006, INK, 0.05, 1.23, -0.064, 0.0).rotation.z = 0.5;
  g.box(0.76, 0.08, 0.045, lighter(STEEL, 0.3), -0.05, 0.99, -0.115, 0.02);
  // keyboard with key rows, mouse, mug, a little plant
  g.box(0.52, 0.025, 0.17, CREAM, -0.08, 0.792, 0.14, 0.01);
  for (let r = 0; r < 3; r++) g.box(0.46, 0.01, 0.03, '#e8e1d6', -0.08, 0.807, 0.09 + r * 0.045, 0.004);
  g.ball(0.045, CREAM, 0.3, 0.8, 0.16).scale.set(0.8, 0.45, 1.3);
  g.cyl(0.055, 0.1, TEAL, 0.5, 0.83, -0.16); g.box(0.02, 0.06, 0.04, TEAL, 0.56, 0.83, -0.16, 0.01);
  g.cyl(0.07, 0.1, ORANGE, -0.55, 0.83, -0.2); g.ball(0.09, LEAF, -0.55, 0.95, -0.2); g.ball(0.06, LEAF_L, -0.5, 1.0, -0.17);
  return { w: 1.36, d: 0.72, h: 1.5 };
};

/** an old computer's beige */
const BEIGE = '#e6dcc4';
/** a green-screen terminal's glass */
const TERM = '#1d3a2c';
/** brass: a clock's pendulum and its finials */
const BRASS = '#d6a94e';

/**
 * A rounded box's faces stand 0.4 r out of its nominal sides (style.ts's bevel): a detail set on a face
 * stands at least this far out of the nominal side, so no two faces meet in one plane.
 */
const out = (r: number): number => r * 0.4 + 0.004;

/** a retro computer (an old API, a terminal plugin): a beige all-in-one on its little desk, green text, a floppy slot, disks */
const retro: Maker = (g, o) => {
  g.contact(0.9, 0.56);
  g.box(0.9, 0.05, 0.56, WOOD_L, 0, 0.7, 0, 0.02);
  for (const x of [-0.41, 0.41]) g.box(0.05, 0.675, 0.5, WOOD, x, 0.3375, 0, 0.015);
  // the machine: its case, the glass set in its bezel, a few lines of text, the floppy slot
  const z0 = -0.08, d = 0.34, f = z0 + d / 2 + out(0.04);
  g.box(0.34, 0.42, d, BEIGE, 0, 0.94, z0, 0.04);
  g.box(0.28, 0.22, 0.01, darker(BEIGE, 0.85), 0, 1.0, f + 0.005, 0.02);
  g.box(0.23, 0.17, 0.01, TERM, 0, 1.0, f + 0.012, 0.015, 0.3 + o.night * 0.5);
  for (let i = 0; i < 4; i++) g.box([0.14, 0.09, 0.16, 0.05][i] as number, 0.014, 0.008, GREEN, -0.08 + ([0.14, 0.09, 0.16, 0.05][i] as number) / 2, 1.05 - i * 0.03, f + 0.02, 0, 0.5 + o.night);
  g.box(0.12, 0.014, 0.01, INK, 0.05, 0.84, f + 0.005, 0.003);
  g.box(0.03, 0.02, 0.008, VIOLET, -0.12, 0.84, f + 0.005, 0.004);
  // the keyboard and its key rows, the mouse, a stack of floppy disks, a mug
  g.box(0.36, 0.03, 0.13, BEIGE, 0, 0.74, 0.16, 0.01);
  for (let r = 0; r < 3; r++) g.box(0.32, 0.012, 0.025, lighter(BEIGE, 0.4), 0, 0.756, 0.125 + r * 0.035, 0.004);
  g.ball(0.035, BEIGE, 0.27, 0.735, 0.16).scale.set(0.8, 0.5, 1.2);
  for (let i = 0; i < 3; i++) g.box(0.09, 0.01, 0.09, [SKY, INK, YELLOW][i] as string, -0.32 + i * 0.006, 0.73 + i * 0.012, -0.12 + i * 0.008, 0.004).rotation.y = i * 0.15;
  g.cyl(0.04, 0.09, TEAL, 0.32, 0.77, -0.15);
  return { w: 0.93, d: 0.59, h: 1.15 };
};

/** a CRT television (a video plugin): a wooden cabinet on splayed legs, a rounded screen showing colour bars, knobs, rabbit ears */
const crt: Maker = (g, o) => {
  const w = 0.8, d = 0.5, r = 0.05;
  g.contact(w, d);
  for (const x of [-0.32, 0.32]) for (const z of [-0.17, 0.17]) { const l = g.box(0.04, 0.38, 0.04, WOOD_D, x, 0.18, z, 0.012); l.rotation.z = x > 0 ? -0.12 : 0.12; l.rotation.x = z > 0 ? 0.12 : -0.12; }
  g.box(w, 0.58, d, WOOD, 0, 0.66, 0, r);
  const f = d / 2 + out(r);
  // the screen: its cream bezel, the glass, the bars
  g.box(0.52, 0.46, 0.01, CREAM, -0.1, 0.66, f + 0.005, 0.04);
  g.box(0.46, 0.38, 0.01, SCREEN, -0.1, 0.66, f + 0.012, 0.06, 0.2 + o.night * 0.4);
  const bars = [CREAM, YELLOW, TEAL, GREEN, VIOLET, SKY];
  for (let i = 0; i < bars.length; i++) g.box(0.065, 0.26, 0.008, bars[i] as string, -0.1 - 0.1625 + i * 0.065, 0.69, f + 0.02, 0, 0.3 + o.night * 0.6);
  g.box(0.39, 0.05, 0.008, SLATE_L, -0.1, 0.53, f + 0.02, 0, 0.2 + o.night * 0.3);
  // the speaker and the knobs on the right
  for (let i = 0; i < 5; i++) g.box(0.12, 0.012, 0.01, WOOD_D, 0.28, 0.82 - i * 0.03, f + 0.005, 0.004);
  for (const y of [0.6, 0.48]) g.cyl(0.03, 0.03, CREAM, 0.28, y, f + 0.015).rotation.x = Math.PI / 2;
  g.ball(0.015, AMBER, 0.2, 0.42, f + 0.008, 0.4 + o.night);
  // the rabbit ears
  const top = 0.95 - r / 4;
  g.ball(0.07, SLATE, 0.18, top, -0.05).scale.set(1, 0.6, 1);
  for (const s of [-1, 1]) { const a = g.at(0.18, top + 0.03, -0.05); a.root.rotation.z = s * 0.5; a.root.rotation.x = -0.15; a.cyl(0.006, 0.42, STEEL, 0, 0.21, 0); a.ball(0.013, STEEL, 0, 0.42, 0); }
  return { w: 0.85, d: 0.59, h: 1.36, z: 0.02 };
};

/** a snack machine (a store's plugin, an order): glass front, rows of packets on spirals, a keypad, the lit header */
const snacks: Maker = (g, o) => {
  const w = 0.9, d = 0.7, C = SKY, f = d / 2;
  g.contact(w, d);
  g.box(w, 0.12, d, darker(C, 0.7), 0, 0.06, 0, 0.02);
  g.box(0.06, 1.56, d, C, -w / 2 + 0.03, 0.9, 0, 0.02);
  g.box(0.26, 1.56, d, C, w / 2 - 0.13, 0.9, 0, 0.02);
  g.box(0.58, 0.35, d, C, -0.1, 0.295, 0, 0.02);
  g.box(0.58, 1.21, 0.04, CREAM, -0.1, 1.075, -f + 0.02, 0.01);
  g.box(w + 0.02, 0.22, d + 0.02, darker(C, 0.8), 0, 1.79, 0, 0.03);
  g.box(0.7, 0.13, 0.01, CREAM, 0, 1.79, f + 0.01 + out(0.03), 0.03, 0.4 + o.night);
  g.box(0.3, 0.035, 0.008, SKY, 0, 1.79, f + 0.02 + out(0.03), 0.01, 0.3 + o.night * 0.5);
  // the shelves and their packets
  const packs = [YELLOW, ORANGE, GREEN, VIOLET, TEAL, CREAM, AMBER, SKY];
  for (let s = 0; s < 4; s++) {
    const y = 0.56 + s * 0.28;
    g.box(0.56, 0.02, 0.56, STEEL, -0.1, y, -0.02, 0.005);
    for (let i = 0; i < 4; i++) {
      const c = packs[(s * 3 + i) % packs.length] as string;
      g.box(0.1, 0.17 - (i % 2) * 0.03, 0.05, c, -0.32 + i * 0.145, y + 0.1 - (i % 2) * 0.015, 0.16, 0.025);
      g.cyl(0.03, 0.2, STEEL, -0.32 + i * 0.145, y + 0.04, 0.0).rotation.x = Math.PI / 2;
    }
  }
  g.pane(0.58, 1.19, 0.02, PANE, 0.25, -0.1, 1.075, f - 0.02);
  // the keypad column: a display, the keys, a coin slot; the pickup flap
  const k = f + out(0.02) + 0.005;
  g.box(0.16, 0.06, 0.01, SCREEN, w / 2 - 0.13, 1.42, k, 0.01, 0.3 + o.night * 0.6);
  g.box(0.1, 0.03, 0.006, GREEN, w / 2 - 0.13, 1.42, k + 0.008, 0, 0.5 + o.night);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) g.box(0.035, 0.03, 0.012, CREAM, w / 2 - 0.18 + c * 0.05, 1.3 - r * 0.045, k, 0.006);
  g.box(0.012, 0.06, 0.01, INK, w / 2 - 0.13, 1.06, k, 0.003);
  g.box(0.4, 0.14, 0.02, INK, -0.1, 0.3, f + out(0.02) + 0.01, 0.02);
  return { w: 0.95, d: 0.77, h: 1.9, z: 0.01 };
};

/** a photo booth (a camera, a screenshot plugin): the curtain half drawn on its stool, sample strips, the PHOTO sign, a strip coming out */
const photobooth: Maker = (g, o) => {
  const C = YELLOW, f = 0.45;
  g.contact(1.0, 0.9);
  g.box(1.0, 0.08, 0.9, SLATE, 0, 0.04, 0, 0.02);
  g.box(0.06, 1.84, 0.9, C, -0.47, 1.0, 0, 0.02);
  g.box(0.59, 1.84, 0.06, C, -0.145, 1.0, -0.42, 0.02);
  g.box(0.35, 1.84, 0.9, C, 0.325, 1.0, 0, 0.02);
  g.box(1.04, 0.12, 0.94, darker(C, 0.8), 0, 1.98, 0, 0.03);
  // inside: the camera and its ring light on the back, the stool
  g.box(0.12, 0.1, 0.02, INK, -0.15, 1.3, -0.38, 0.02);
  g.cyl(0.08, 0.012, CREAM, -0.15, 1.3, -0.383, 0.3 + o.night).rotation.x = Math.PI / 2;
  g.cyl(0.035, 0.03, SCREEN, -0.15, 1.3, -0.36).rotation.x = Math.PI / 2;
  g.cyl(0.13, 0.05, ORANGE, -0.05, 0.52, -0.05); g.cyl(0.03, 0.42, STEEL, -0.05, 0.29, -0.05);
  // the curtain on its rod, pleated, half drawn
  g.box(0.62, 0.03, 0.03, STEEL, -0.15, 1.86, f - 0.03, 0.01);
  for (let i = 0; i < 4; i++) g.box(0.11, 1.56, 0.04, i % 2 ? darker(VIOLET, 0.88) : VIOLET, -0.385 + i * 0.1, 1.06, f - 0.05 + (i % 2) * 0.02, 0.02);
  // the column's front: the lit sign, two sample strips, the slot and its strip
  const k = f + out(0.02) + 0.005;
  g.box(0.28, 0.13, 0.01, CREAM, 0.325, 1.7, k, 0.02, 0.4 + o.night);
  for (let i = 0; i < 3; i++) g.ball(0.018, [ORANGE, SKY, GREEN][i] as string, 0.25 + i * 0.075, 1.7, k + 0.01, 0.4 + o.night);
  for (const x of [0.27, 0.38]) {
    g.box(0.08, 0.36, 0.01, CREAM, x, 1.25, k, 0.008);
    for (let j = 0; j < 4; j++) g.box(0.06, 0.065, 0.006, [SKY, TEAL, YELLOW, VIOLET][(j + (x > 0.3 ? 2 : 0)) % 4] as string, x, 1.39 - j * 0.085, k + 0.007, 0);
  }
  g.box(0.1, 0.014, 0.01, INK, 0.325, 0.85, k, 0.003);
  const strip = g.box(0.06, 0.16, 0.006, PAPER, 0.325, 0.76, k + 0.02, 0.003); strip.rotation.x = 0.2;
  g.box(0.012, 0.05, 0.01, INK, 0.42, 1.0, k, 0.003);
  return { w: 1.07, d: 1.0, h: 2.04, z: 0.01 };
};

/** a little robot (an automation, a bot plugin): on treads, a screen face with two lit eyes, an antenna, one arm waving; a machine, never a bim */
const robot: Maker = (g, o) => {
  const B = STEEL, A = YELLOW;
  g.contact(0.5, 0.42);
  for (const x of [-0.15, 0.15]) {
    g.box(0.12, 0.16, 0.4, SLATE, x, 0.08, 0, 0.05);
    for (const z of [-0.12, 0.12]) g.cyl(0.05, 0.13, SLATE_L, x, 0.08, z).rotation.z = Math.PI / 2;
  }
  g.box(0.34, 0.08, 0.28, SLATE, 0, 0.2, 0, 0.02);
  g.box(0.4, 0.36, 0.3, B, 0, 0.42, 0, 0.05);
  const f = 0.15 + out(0.05);
  g.box(0.22, 0.14, 0.01, SCREEN, 0, 0.45, f + 0.005, 0.02, 0.2 + o.night * 0.4);
  for (let i = 0; i < 3; i++) g.ball(0.018, [YELLOW, GREEN, SKY][i] as string, -0.06 + i * 0.06, 0.45, f + 0.012, 0.5 + o.night);
  g.box(0.3, 0.03, 0.01, A, 0, 0.31, f + 0.005, 0.01);
  // the neck and the head: a visor with two eyes, ears, the antenna
  g.cyl(0.05, 0.08, SLATE_L, 0, 0.63, 0);
  g.box(0.34, 0.24, 0.26, B, 0, 0.78, 0, 0.06);
  const h = 0.13 + out(0.06);
  g.box(0.26, 0.12, 0.01, SCREEN, 0, 0.78, h + 0.005, 0.04, 0.2 + o.night * 0.3);
  for (const x of [-0.06, 0.06]) g.ball(0.03, SKY, x, 0.79, h + 0.012, 0.6 + o.night).scale.set(1, 1.1, 0.4);
  for (const x of [-0.19, 0.19]) g.cyl(0.04, 0.04, A, x, 0.78, 0).rotation.z = Math.PI / 2;
  g.cyl(0.008, 0.14, SLATE_L, 0, 0.95, 0); g.ball(0.028, A, 0, 1.03, 0, 0.4 + o.night);
  // the arms: one down holding a wrench, one up waving
  g.ball(0.05, SLATE_L, -0.23, 0.54, 0); g.ball(0.05, SLATE_L, 0.23, 0.54, 0);
  const l = g.at(-0.23, 0.54, 0); l.root.rotation.z = -0.2;
  l.box(0.07, 0.24, 0.07, B, 0, -0.13, 0, 0.03); l.ball(0.04, A, 0, -0.27, 0);
  l.box(0.025, 0.14, 0.02, SLATE, 0, -0.3, 0.04, 0.008);
  const rr = g.at(0.23, 0.54, 0); rr.root.rotation.z = 2.4;
  rr.box(0.07, 0.24, 0.07, B, 0, -0.13, 0, 0.03); rr.ball(0.04, A, 0, -0.27, 0);
  return { w: 0.81, d: 0.45, h: 1.07, x: 0.07 };
};

/** a drone on its charging pad (a maps or a delivery plugin): a crate with its lit status, the H pad, the quadcopter with four rotors */
const drone: Maker = (g, o) => {
  g.contact(0.72, 0.72);
  g.box(0.7, 0.3, 0.7, SLATE_L, 0, 0.15, 0, 0.03);
  const f = 0.35 + out(0.03);
  g.box(0.2, 0.06, 0.01, SCREEN, -0.15, 0.16, f + 0.005, 0.01, 0.3 + o.night * 0.5);
  g.box(0.12, 0.025, 0.006, GREEN, -0.17, 0.16, f + 0.012, 0, 0.5 + o.night);
  for (const x of [0.12, 0.2]) g.box(0.05, 0.012, 0.01, INK, x, 0.2, f + 0.005, 0.003);
  const top = 0.3 - 0.03 / 4;
  g.cyl(0.3, 0.03, SLATE, 0, top + 0.015, 0);
  for (const x of [-0.08, 0.08]) g.box(0.035, 0.01, 0.22, YELLOW, x, top + 0.035, 0, 0);
  g.box(0.13, 0.016, 0.035, YELLOW, 0, top + 0.036, 0, 0);
  for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]] as const) g.ball(0.018, GREEN, x, top + 0.01, z, 0.5 + o.night);
  // the drone on its skids
  const y = top + 0.05;
  for (const x of [-0.07, 0.07]) { g.box(0.025, 0.018, 0.24, STEEL, x, y, 0.0, 0.008); for (const z of [-0.06, 0.06]) g.box(0.014, 0.05, 0.014, STEEL, x, y + 0.03, z, 0.004); }
  g.box(0.16, 0.07, 0.2, CREAM, 0, y + 0.085, 0, 0.03);
  g.ball(0.03, INK, 0, y + 0.05, 0.09);
  g.ball(0.012, GREEN, 0, y + 0.1, -0.1, 0.6 + o.night);
  for (const [i, a] of [Math.PI / 4, -Math.PI / 4].entries()) g.box(0.5, 0.025, 0.035, SLATE, 0, y + 0.092 + i * 0.005, 0, 0.01).rotation.y = a;
  for (const [i, [x, z]] of ([[0.177, 0.177], [-0.177, 0.177], [0.177, -0.177], [-0.177, -0.177]] as const).entries()) {
    g.cyl(0.028, 0.04, INK, x, y + 0.125, z);
    g.box(0.22, 0.006, 0.026, SKY, x, y + 0.15, z, 0.003).rotation.y = i * 0.7 + 0.3;
  }
  return { w: 0.74, d: 0.76, h: 0.51, z: 0.01 };
};

/** a grandfather clock (a scheduler, a cron plugin): its hood and dial, the brass pendulum behind the trunk's glass door, finials */
const clock: Maker = (g, o) => {
  g.contact(0.52, 0.36);
  g.box(0.5, 0.12, 0.32, WOOD_D, 0, 0.06, 0, 0.02);
  g.box(0.46, 0.5, 0.28, WOOD, 0, 0.37, 0, 0.03);
  g.box(0.3, 0.3, 0.01, WOOD_D, 0, 0.37, 0.14 + out(0.03) + 0.005, 0.02);
  // the trunk, its glass door framed, the pendulum behind it
  g.box(0.36, 0.92, 0.24, WOOD, 0, 1.08, 0, 0.03);
  const f = 0.12 + out(0.03);
  for (const x of [-0.125, 0.125]) g.box(0.03, 0.76, 0.02, WOOD_D, x, 1.06, f + 0.012, 0.006);
  for (const y of [0.695, 1.425]) g.box(0.22, 0.03, 0.02, WOOD_D, 0, y, f + 0.012, 0.006);
  g.box(0.012, 0.5, 0.008, BRASS, 0, 1.18, f + 0.008, 0);
  g.cyl(0.05, 0.012, BRASS, 0, 0.9, f + 0.01).rotation.x = Math.PI / 2;
  g.pane(0.22, 0.7, 0.01, PANE, 0.25, 0, 1.06, f + 0.03, 0.004);
  // the hood, its pillars, the dial with its hours and hands
  g.box(0.44, 0.4, 0.3, WOOD, 0, 1.74, 0, 0.03);
  for (const x of [-0.2, 0.2]) g.cyl(0.02, 0.4, WOOD_D, x, 1.735, 0.15 + out(0.03) + 0.02);
  const h = 0.15 + out(0.03);
  g.cyl(0.155, 0.012, BRASS, 0, 1.74, h + 0.006).rotation.x = Math.PI / 2;
  g.cyl(0.14, 0.02, CREAM, 0, 1.74, h + 0.012, 0.1 + o.night * 0.3).rotation.x = Math.PI / 2;
  for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; g.box(0.008, i % 3 ? 0.018 : 0.03, 0.006, INK, Math.sin(a) * 0.115, 1.74 + Math.cos(a) * 0.115, h + 0.025, 0).rotation.z = -a; }
  for (const [len, wd, turn, dz] of [[0.07, 0.014, -1.0, 0.029], [0.1, 0.01, 2.0, 0.035]] as const) { const hand = g.at(0, 1.74, h + dz); hand.root.rotation.z = turn; hand.box(wd, len, 0.006, INK, 0, len / 2, 0, 0); }
  g.ball(0.012, BRASS, 0, 1.74, h + 0.04);
  // the crown and its finials
  g.box(0.48, 0.06, 0.34, WOOD_D, 0, 1.97, 0, 0.02);
  g.cyl(0.02, 0.05, BRASS, 0, 2.01, 0);
  for (const x of [-0.18, 0, 0.18]) g.ball(0.03, BRASS, x, x === 0 ? 2.05 : 2.02, 0);
  return { w: 0.53, d: 0.41, h: 2.09, z: 0.02 };
};

/** a console of lights (a monitoring plugin, a status page): a sloped desk of lamps and switches, a screen with a wave, two gauges, a lever */
const dashboard: Maker = (g, o) => {
  const LIT = [YELLOW, GREEN, SKY, AMBER];
  g.contact(1.2, 0.5);
  g.box(1.2, 0.7, 0.5, SLATE, 0, 0.35, 0, 0.03);
  for (const x of [-0.3, 0.3]) g.box(0.5, 0.4, 0.01, SLATE_L, x, 0.36, 0.25 + out(0.03) + 0.005, 0.02);
  // the sloped desk: three rows of lamps, a row of switches
  const p = g.at(0, 0.74, 0.04); p.root.rotation.x = 0.45;
  p.box(1.16, 0.04, 0.46, SLATE_L, 0, 0, 0, 0.015);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) {
    const lit = (c * 7 + r * 3) % 5 < 3;
    p.cyl(0.02, 0.02, lit ? (LIT[(c + r) % LIT.length] as string) : SLATE, -0.48 + c * 0.107, 0.025, -0.14 + r * 0.09, lit ? 0.5 + o.night : 0);
  }
  for (let c = 0; c < 8; c++) { p.box(0.05, 0.012, 0.04, INK, -0.42 + c * 0.12, 0.022, 0.15, 0.004); p.box(0.016, 0.05, 0.016, STEEL, -0.42 + c * 0.12, 0.045, 0.15, 0.006).rotation.x = c % 3 ? 0.4 : -0.4; }
  // the riser: a screen with its wave, two gauges, a row of lamps
  g.box(1.2, 0.66, 0.14, SLATE, 0, 1.03, -0.18, 0.03);
  const f = -0.11 + out(0.03);
  g.box(0.42, 0.26, 0.01, SCREEN, -0.25, 1.06, f + 0.005, 0.02, 0.25 + o.night * 0.5);
  for (let i = 0; i < 9; i++) g.box(0.04, 0.012, 0.006, GREEN, -0.41 + i * 0.04, 1.06 + Math.sin(i * 0.9) * 0.07, f + 0.012, 0, 0.5 + o.night);
  for (const x of [0.15, 0.38]) {
    g.cyl(0.08, 0.012, CREAM, x, 1.08, f + 0.006).rotation.x = Math.PI / 2;
    const n = g.at(x, 1.08, f + 0.016); n.root.rotation.z = x > 0.2 ? -0.7 : 0.5;
    n.box(0.008, 0.065, 0.006, INK, 0, 0.03, 0, 0);
  }
  for (let i = 0; i < 9; i++) g.ball(0.022, i % 2 ? AMBER : SLATE_L, -0.48 + i * 0.12, 1.29, f + 0.012, i % 2 ? 0.5 + o.night : 0);
  // the lever on the right, a mug on top
  g.box(0.06, 0.08, 0.1, SLATE_L, 0.63, 0.72, 0.1, 0.015);
  const lv = g.at(0.63, 0.75, 0.1); lv.root.rotation.x = -0.5;
  lv.cyl(0.012, 0.25, STEEL, 0, 0.125, 0); lv.ball(0.035, ORANGE, 0, 0.26, 0);
  g.cyl(0.04, 0.08, TEAL, -0.45, 1.395, -0.18);
  return { w: 1.29, d: 0.55, h: 1.44, x: 0.03, z: 0.01 };
};

export const MACHINES = { rack, macdesk, retro, crt, snacks, photobooth, robot, drone, clock, dashboard } satisfies Record<string, Maker>;

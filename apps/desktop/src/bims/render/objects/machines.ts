// The objects of the machines family: an MCP server's rack (a yellow light per tool group on, n) and computer use's desk.
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import { CREAM, GREEN, INK, LEAF, LEAF_L, lighter, ORANGE, SKY, SLATE, SLATE_L, STEEL, TEAL, WOOD, WOOD_L, YELLOW, type Maker } from './kit';

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

export const MACHINES = { rack, macdesk } satisfies Record<string, Maker>;

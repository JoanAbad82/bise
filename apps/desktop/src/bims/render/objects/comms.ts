// The objects of the comms family: Gmail's mailbox, Slack's phone booth, Granola's visio set.
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import { CREAM, darker, GREEN, INK, ORANGE, PANE, PAPER, SKY, SLATE, SLATE_L, STEEL, TEAL, WOOD, WOOD_D, WOOD_L, YELLOW, type Maker } from './kit';

/** a mailbox on its post (Gmail): the box at a bim's chest, the flag up, letters in, a number plate */
const mailbox: Maker = (g) => {
  g.contact(0.4, 0.4);
  g.box(0.36, 0.06, 0.36, darker(WOOD_D, 0.85), 0, 0.03, 0, 0.02);
  g.box(0.12, 0.78, 0.12, WOOD_D, 0, 0.42, 0, 0.025);
  g.box(0.3, 0.05, 0.4, WOOD, 0, 0.82, 0.04, 0.015);
  // the round-topped box
  g.box(0.44, 0.3, 0.7, SKY, 0, 0.99, 0.04, 0.06);
  const top = g.cyl(0.22, 0.7, SKY, 0, 1.13, 0.04); top.rotation.x = Math.PI / 2;
  g.box(0.4, 0.36, 0.03, darker(SKY, 0.82), 0, 1.06, 0.4, 0.08);
  g.box(0.08, 0.04, 0.04, STEEL, 0, 1.18, 0.42, 0.01);
  // letters peeking from the door, the flag up
  for (let i = 0; i < 3; i++) { const l = g.box(0.22, 0.012, 0.16, [CREAM, PAPER, YELLOW][i] as string, -0.02 + i * 0.02, 0.88 + i * 0.015, 0.46, 0.003); l.rotation.x = 0.25; }
  g.box(0.035, 0.36, 0.035, STEEL, 0.25, 1.15, -0.1, 0.01);
  g.box(0.025, 0.14, 0.2, YELLOW, 0.25, 1.28, -0.0, 0.015);
  g.box(0.2, 0.1, 0.02, CREAM, 0, 0.62, 0.065, 0.01);
  for (let i = 0; i < 2; i++) g.box(0.04, 0.06, 0.008, INK, -0.03 + i * 0.06, 0.62, 0.077, 0.004);
  return { w: 0.53, d: 0.88, h: 1.4, z: 0.1 };
};

/** a phone booth (Slack): teal, glass on two sides, a phone with its coiled cord, a stool, a lit sign */
const booth: Maker = (g, o) => {
  const w = 0.98, d = 0.98, h = 2.15;
  g.contact(w, d);
  g.box(w, 0.1, d, darker(TEAL, 0.75), 0, 0.05, 0, 0.03);
  g.box(w + 0.04, 0.16, d + 0.04, TEAL, 0, h - 0.08, 0, 0.05);
  g.box(0.08, h, d, TEAL, -w / 2 + 0.04, h / 2, 0, 0.025);
  g.box(w, h, 0.08, TEAL, 0, h / 2, -d / 2 + 0.04, 0.025);
  for (const [x, z] of [[w / 2 - 0.04, -d / 2 + 0.04], [w / 2 - 0.04, d / 2 - 0.04], [-w / 2 + 0.04, d / 2 - 0.04]] as const) g.box(0.08, h, 0.08, TEAL, x, h / 2, z, 0.025);
  // glass panes with mullions
  g.pane(w - 0.16, h - 0.32, 0.02, PANE, 0.28, 0, h / 2, d / 2 - 0.04, 0.01);
  g.pane(0.02, h - 0.32, d - 0.16, PANE, 0.28, w / 2 - 0.04, h / 2, 0, 0.01);
  for (const y of [0.75, 1.4]) { g.box(w - 0.12, 0.04, 0.04, TEAL, 0, y, d / 2 - 0.04, 0.01); g.box(0.04, 0.04, d - 0.12, TEAL, w / 2 - 0.04, y, 0, 0.01); }
  g.box(0.04, 0.25, 0.04, STEEL, w / 2 - 0.06, 1.05, d / 2 - 0.12, 0.01);
  // the lit sign: a speech bubble
  g.box(w - 0.28, 0.18, 0.06, CREAM, 0, h - 0.08, d / 2 + 0.02, 0.04, 0.3 + o.night);
  g.ball(0.06, TEAL, 0, h - 0.08, d / 2 + 0.05).scale.set(1.4, 0.8, 0.3);
  // the phone on the back wall, its coiled cord, a little shelf with a notepad
  g.box(0.22, 0.34, 0.06, SLATE, -0.15, 1.35, -d / 2 + 0.11, 0.03);
  g.box(0.06, 0.26, 0.07, INK, -0.07, 1.36, -d / 2 + 0.16, 0.025);
  for (let i = 0; i < 8; i++) g.ball(0.022, INK, -0.12 + Math.sin(i * 1.4) * 0.02, 1.2 - i * 0.035, -d / 2 + 0.17 + Math.cos(i * 1.4) * 0.02);
  g.box(0.36, 0.035, 0.18, WOOD_L, 0.15, 1.05, -d / 2 + 0.17, 0.01); g.box(0.12, 0.012, 0.09, YELLOW, 0.15, 1.075, -d / 2 + 0.17, 0.004);
  g.cyl(0.16, 0.06, ORANGE, 0, 0.52, -0.05); g.cyl(0.035, 0.42, STEEL, 0, 0.29, -0.05); g.cyl(0.12, 0.02, STEEL, 0, 0.11, -0.05);
  return { w: w + 0.08, d: 1.1, h: h + 0.01, z: 0.01 };
};

/** a visio set (Granola): a screen on a rolling stand, two tiles on the call, a camera, a mic on a side table */
const visio: Maker = (g, o) => {
  g.contact(1.35, 0.95, 0, 0.2);
  for (const [dx, dz] of [[-0.25, -0.18], [0.25, -0.18], [-0.25, 0.18], [0.25, 0.18]] as const) { g.box(0.06, 0.04, 0.06, SLATE, dx, 0.06, dz, 0.02); g.cyl(0.035, 0.03, INK, dx, 0.02, dz); }
  g.box(0.6, 0.05, 0.42, SLATE_L, 0, 0.1, 0, 0.02);
  g.box(0.09, 1.05, 0.07, SLATE, 0, 0.62, -0.03, 0.025);
  g.box(1.34, 0.82, 0.08, INK, 0, 1.48, 0.0, 0.05);
  // the glass out of the frame's rounded front (z 0.056), then each layer 2 mm out of the one under it
  g.box(1.22, 0.7, 0.01, '#d8eefc', 0, 1.49, 0.057, 0.02, 0.25 + o.night * 0.6);
  // two tiles on the call: a face blob each, a name strip
  for (const [x, c, bg] of [[-0.3, ORANGE, '#fde8d0'], [0.3, TEAL, '#d6f0ec']] as const) {
    g.box(0.56, 0.5, 0.01, bg, x, 1.52, 0.064, 0.02, 0.2 + o.night * 0.5);
    g.ball(0.12, c, x, 1.55, 0.072).scale.set(1, 1, 0.3);
    g.box(0.24, 0.12, 0.012, c, x, 1.37, 0.07, 0.04);
    g.box(0.14, 0.025, 0.01, INK, x - 0.16, 1.3, 0.074, 0.008);
  }
  g.box(0.5, 0.05, 0.012, SLATE_L, 0, 1.17, 0.064, 0.01);
  for (let i = 0; i < 3; i++) g.ball(0.018, i === 1 ? ORANGE : CREAM, -0.08 + i * 0.08, 1.17, 0.074);
  // the camera clipped on top
  g.box(0.26, 0.09, 0.1, SLATE, 0, 1.94, 0.02, 0.035); g.cyl(0.035, 0.02, '#1f3a5c', 0, 1.94, 0.075).rotation.x = Math.PI / 2; g.ball(0.012, GREEN, 0.09, 1.95, 0.075, 1);
  // the side table with a mic and a mug
  g.box(0.62, 0.05, 0.42, WOOD_L, 0.45, 0.72, 0.62, 0.02); g.cyl(0.04, 0.7, WOOD, 0.45, 0.35, 0.62); g.cyl(0.16, 0.03, WOOD, 0.45, 0.015, 0.62);
  g.cyl(0.06, 0.03, SLATE, 0.35, 0.76, 0.62); g.box(0.025, 0.14, 0.025, SLATE, 0.35, 0.84, 0.62, 0.01); g.ball(0.05, SLATE_L, 0.35, 0.93, 0.62);
  g.cyl(0.05, 0.09, CREAM, 0.58, 0.79, 0.68); g.box(0.02, 0.05, 0.035, CREAM, 0.635, 0.79, 0.68, 0.01);
  // the screen on its stand and the side table in front, on its right
  return { w: 1.46, d: 1.06, h: 2.0, x: 0.04, z: 0.31 };
};

export const COMMS = { mailbox, booth, visio } satisfies Record<string, Maker>;

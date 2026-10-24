// The objects of the comms family: Gmail's mailbox, Slack's phone booth, Granola's visio set, and the rest
// of the collection (page bims-plugins): a valve radio, a dovecote, a rotary phone, a telegraph, a satellite
// dish, a pneumatic tube station, a switchboard.
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import type { Mesh } from 'three';
import { AMBER, CREAM, darker, GREEN, INK, lighter, ORANGE, PANE, PAPER, type Part, SKY, SLATE, SLATE_L, STEEL, TEAL, VIOLET, WOOD, WOOD_D, WOOD_L, YELLOW, type Maker } from './kit';

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

/** brass, a warm yellow (never a copper that reads red) */
const BRASS = '#d6a94e';
/** a pigeon's pale grey, and its wings' darker one */
const DOVE = '#d5dae0';
const WING = '#8e98a4';

type V3 = readonly [number, number, number];

/** a round bar from a to b (a cord, a strut), laid along its length */
function rod(g: Part, r: number, color: string, a: V3, b: V3): Mesh {
  const [dx, dy, dz] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const m = g.box(r * 2, r * 2, Math.hypot(dx, dy, dz), color, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, r * 0.9);
  m.rotation.set(-Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(dx, dz), 0, 'YXZ');
  return m;
}

/** a valve radio (a radio, a podcast): on its side table, an arched wooden case, a cloth grille, the dial lit amber, an aerial */
const radio: Maker = (g, o) => {
  g.contact(0.62, 0.46);
  g.box(0.62, 0.05, 0.46, WOOD_L, 0, 0.575, 0, 0.02);
  for (const x of [-0.25, 0.25]) for (const z of [-0.17, 0.17]) g.box(0.05, 0.55, 0.05, WOOD, x, 0.275, z, 0.015);
  g.box(0.5, 0.03, 0.34, WOOD, 0, 0.18, 0, 0.01);
  g.box(0.22, 0.02, 0.16, SKY, -0.1, 0.205, 0, 0.005); g.box(0.2, 0.02, 0.15, CREAM, -0.09, 0.226, 0.01, 0.005);
  // the case: a block and its arched top
  g.box(0.46, 0.3, 0.24, WOOD_D, 0, 0.75, -0.02, 0.03);
  g.cyl(0.22, 0.22, WOOD_D, 0, 0.9, -0.02).rotation.x = Math.PI / 2;
  // the grille: cloth behind wooden slats, the dial and its needle, two knobs
  g.box(0.24, 0.3, 0.01, CREAM, -0.08, 0.86, 0.12, 0.02);
  for (let i = 0; i < 4; i++) g.box(0.018, 0.3, 0.012, WOOD, -0.17 + i * 0.06, 0.86, 0.128, 0.004);
  g.box(0.13, 0.07, 0.01, AMBER, 0.13, 0.84, 0.12, 0.01, 0.4 + o.night);
  g.box(0.006, 0.06, 0.01, INK, 0.11, 0.84, 0.127, 0);
  for (const x of [0.09, 0.17]) g.cyl(0.028, 0.03, CREAM, x, 0.7, 0.125).rotation.x = Math.PI / 2;
  // the aerial, leaning back
  const ae = g.at(0.15, 1.04, -0.08); ae.root.rotation.z = -0.4;
  ae.cyl(0.007, 0.48, STEEL, 0, 0.24, 0); ae.ball(0.018, STEEL, 0, 0.49, 0);
  return { w: 0.69, d: 0.49, h: 1.52, x: 0.02 };
};

/** a pigeon perched at (x, y, z) its feet, looking to +z turned by `turn`: pale grey, darker wings, big enough to read at 256 px */
function pigeon(g: Part, x: number, y: number, z: number, turn: number): void {
  const p = g.at(x, y, z); p.root.rotation.y = turn;
  p.ball(0.1, DOVE, 0, 0.08, 0).scale.set(0.8, 0.75, 1.25);
  for (const s of [-1, 1]) p.ball(0.07, WING, s * 0.06, 0.1, -0.02).scale.set(0.35, 0.6, 1.3);
  p.box(0.08, 0.02, 0.1, WING, 0, 0.08, -0.15, 0.008).rotation.x = -0.35;
  p.ball(0.035, lighter(TEAL, 0.3), 0, 0.13, 0.085).scale.set(1.2, 1, 0.8);
  p.ball(0.05, DOVE, 0, 0.17, 0.08);
  p.box(0.018, 0.016, 0.04, YELLOW, 0, 0.165, 0.135, 0.005);
  for (const e of [-1, 1]) p.ball(0.01, INK, e * 0.036, 0.18, 0.105);
}

/** a dovecote (a pigeon post, notifications going out): a little house on its post, two rows of doors, perches, three pigeons */
const dovecote: Maker = (g) => {
  g.contact(0.6, 0.6);
  g.box(0.46, 0.06, 0.46, darker(WOOD_D, 0.85), 0, 0.03, 0, 0.02);
  g.box(0.12, 1.12, 0.12, WOOD_D, 0, 0.6, 0, 0.025);
  for (const s of [-1, 1]) rod(g, 0.02, WOOD_D, [s * 0.2, 0.07, 0], [s * 0.05, 0.45, 0]);
  g.box(0.74, 0.05, 0.6, WOOD, 0, 1.18, 0, 0.015);
  // the house, its doors and perches, its slate gable roof
  g.box(0.64, 0.5, 0.5, CREAM, 0, 1.455, 0, 0.03);
  for (const row of [0, 1]) for (const i of [-1, 0, 1]) g.cyl(0.055, 0.012, INK, i * 0.2, 1.33 + row * 0.22, 0.256).rotation.x = Math.PI / 2;
  // the landing board under the lower doors, a perch under the upper ones
  g.box(0.6, 0.025, 0.16, WOOD_D, 0, 1.265, 0.33, 0.008);
  g.box(0.6, 0.02, 0.06, WOOD_D, 0, 1.485, 0.28, 0.006);
  const roof = g.at(0, 1.7, 0);
  roof.box(0.32, 0.32, 0.48, CREAM, 0, 0, 0, 0.01).rotation.z = Math.PI / 4;
  for (const s of [-1, 1]) roof.box(0.43, 0.04, 0.62, SLATE_L, -s * 0.16, 0.11, 0, 0.012).rotation.z = s * 0.6;
  roof.box(0.06, 0.06, 0.64, SLATE, 0, 0.24, 0, 0.02);
  // two on the ridge, one on the landing board
  const ridge = 1.7 + 0.27 - 0.02 / 4;
  pigeon(g, 0, ridge, 0.17, 0.6);
  pigeon(g, 0, ridge, -0.15, Math.PI / 2);
  pigeon(g, 0.17, 1.278, 0.33, -0.3);
  return { w: 0.77, d: 0.83, h: 2.19, z: 0.08 };
};

/** a rotary phone (a phone, a call): on its round side table, the dial tilted up, the handset on its cradle, a notepad */
const rotary: Maker = (g) => {
  const P = TEAL;
  g.contact(0.5, 0.5);
  g.cyl(0.25, 0.04, WOOD_L, 0, 0.68, 0);
  g.cyl(0.035, 0.64, WOOD, 0, 0.34, 0);
  g.cyl(0.17, 0.03, WOOD, 0, 0.015, 0);
  g.box(0.12, 0.012, 0.16, PAPER, -0.15, 0.706, 0.07, 0.003);
  g.box(0.012, 0.014, 0.14, YELLOW, -0.07, 0.709, 0.08, 0.004).rotation.y = 0.3;
  // the body and its dial, tilted to whoever dials
  g.box(0.26, 0.1, 0.22, P, 0.04, 0.75, -0.02, 0.04);
  const dial = g.at(0.04, 0.8, 0.06); dial.root.rotation.x = 0.6;
  dial.cyl(0.075, 0.016, CREAM, 0, 0, 0);
  for (let i = 0; i < 10; i++) { const a = -1.1 + i * 0.52; dial.ball(0.012, INK, Math.cos(a) * 0.052, 0.006, Math.sin(a) * 0.052); }
  dial.cyl(0.026, 0.024, P, 0, 0.004, 0);
  // the cradle and the handset across it, its coiled cord
  for (const x of [-0.06, 0.14]) g.box(0.04, 0.05, 0.05, darker(P, 0.85), x, 0.82, -0.08, 0.015);
  g.box(0.24, 0.04, 0.05, P, 0.04, 0.865, -0.08, 0.018);
  for (const x of [-0.1, 0.18]) g.ball(0.045, P, x, 0.86, -0.08).scale.set(0.9, 0.75, 1.15);
  for (let i = 0; i < 7; i++) g.ball(0.016, darker(P, 0.8), -0.15 - Math.sin(i * 1.3) * 0.012, 0.83 - i * 0.022, -0.06 + Math.cos(i * 1.3) * 0.012);
  return { w: 0.51, d: 0.51, h: 0.9 };
};

/** a telegraph (a messaging plugin): a desk with a Morse key, its sounder, a paper tape running off its reel, a green banker's lamp */
const telegraph: Maker = (g, o) => {
  g.contact(0.9, 0.5);
  g.box(0.9, 0.05, 0.5, WOOD_L, 0, 0.72, 0, 0.02);
  for (const x of [-0.4, 0.4]) for (const z of [-0.2, 0.2]) g.box(0.05, 0.695, 0.05, WOOD, x, 0.3475, z, 0.015);
  g.box(0.5, 0.12, 0.42, WOOD, 0.08, 0.635, 0, 0.02);
  g.box(0.12, 0.025, 0.01, BRASS, 0.08, 0.635, 0.225, 0.006);
  // the key: its base, the brass lever, the black knob
  g.box(0.22, 0.03, 0.11, WOOD_D, -0.2, 0.76, 0.1, 0.01);
  for (const x of [-0.28, -0.12]) g.cyl(0.012, 0.04, BRASS, x, 0.79, 0.07);
  g.box(0.18, 0.016, 0.022, BRASS, -0.2, 0.795, 0.1, 0.006).rotation.z = 0.06;
  g.cyl(0.026, 0.022, INK, -0.12, 0.812, 0.1);
  // the sounder: two coils under a brass bar
  g.box(0.2, 0.03, 0.13, WOOD_D, 0.02, 0.76, -0.1, 0.01);
  for (const x of [-0.03, 0.05]) g.cyl(0.028, 0.08, INK, x, 0.815, -0.1);
  g.box(0.16, 0.014, 0.03, BRASS, 0.01, 0.865, -0.1, 0.005);
  // the tape: off its reel, along the desk, over its edge
  const reel = g.cyl(0.07, 0.05, CREAM, 0.26, 0.82, -0.12); reel.rotation.x = Math.PI / 2;
  g.cyl(0.03, 0.06, WOOD_D, 0.26, 0.82, -0.12).rotation.x = Math.PI / 2;
  g.box(0.04, 0.06, 0.06, WOOD_D, 0.26, 0.775, -0.12, 0.01);
  g.box(0.04, 0.01, 0.38, PAPER, 0.26, 0.752, 0.06, 0.002);
  for (let i = 0; i < 6; i++) g.box(0.01, 0.006, i % 2 ? 0.03 : 0.012, INK, 0.26, 0.759, 0.0 + i * 0.04, 0);
  g.box(0.04, 0.18, 0.01, PAPER, 0.26, 0.66, 0.257, 0.002);
  // the lamp
  g.cyl(0.06, 0.02, BRASS, -0.34, 0.755, -0.16);
  g.cyl(0.01, 0.2, BRASS, -0.34, 0.86, -0.16);
  g.box(0.22, 0.06, 0.1, GREEN, -0.3, 0.97, -0.16, 0.03);
  g.box(0.18, 0.012, 0.07, YELLOW, -0.3, 0.936, -0.16, 0.005, 0.5 + o.night);
  return { w: 0.93, d: 0.53, h: 1.0 };
};

/** a satellite dish (a webhook, a feed from far away): on its mast and weighted base, tilted to the sky, the feed at its focus */
const dish: Maker = (g, o) => {
  g.contact(0.56, 0.56);
  g.box(0.5, 0.08, 0.5, SLATE, 0, 0.04, 0, 0.02);
  for (const x of [-0.16, 0.16]) g.box(0.12, 0.06, 0.4, SLATE_L, x, 0.11, 0, 0.015);
  g.cyl(0.04, 0.92, STEEL, 0, 0.54, -0.02);
  g.box(0.12, 0.12, 0.1, SLATE, 0, 1.0, -0.02, 0.02);
  g.ball(0.022, GREEN, 0.07, 0.125, 0.205, 0.5 + o.night);
  g.box(0.03, 0.03, 0.2, INK, -0.07, 0.155, 0.12, 0.01);
  // the dish, 35° up: its inside a step darker than its rolled lip (the lightest edge), its back shell, the feed horn on three struts at its focus
  const d = g.at(0, 1.1, 0.03); d.root.rotation.x = -0.61;
  d.ball(0.43, STEEL, 0, 0, -0.08).scale.set(1, 1, 0.18);
  d.cyl(0.42, 0.02, darker(CREAM, 0.8), 0, 0, 0).rotation.x = Math.PI / 2;
  // the rolled lip: one smooth torus, short tube segments meeting in balls of the same radius (the kit has no torus)
  const LIP = 36, R = 0.43;
  for (let i = 0; i < LIP; i++) {
    const a = (i / LIP) * Math.PI * 2, m = a + Math.PI / LIP;
    d.ball(0.035, CREAM, Math.cos(a) * R, Math.sin(a) * R, 0.02);
    d.cyl(0.035, 2 * R * Math.sin(Math.PI / LIP), CREAM, Math.cos(m) * R * Math.cos(Math.PI / LIP), Math.sin(m) * R * Math.cos(Math.PI / LIP), 0.02).rotation.z = m;
  }
  d.cyl(0.1, 0.06, STEEL, 0, 0, -0.17).rotation.x = Math.PI / 2;
  for (const a of [Math.PI / 2, (7 * Math.PI) / 6, (11 * Math.PI) / 6]) rod(d, 0.008, STEEL, [Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0.03], [0, 0, 0.33]);
  d.cone(0.06, 0.1, SLATE, 0, 0, 0.34).rotation.x = Math.PI / 2;
  d.box(0.06, 0.06, 0.1, SLATE, 0, 0, 0.42, 0.02);
  d.cyl(0.022, 0.02, INK, 0, 0, 0.475).rotation.x = Math.PI / 2;
  return { w: 0.95, d: 0.8, h: 1.53, z: 0.05 };
};

/** a pneumatic tube station (a send-and-receive plugin): a brass tube up into the wall, its chamber, a capsule in the tray, a gauge */
const pneumatic: Maker = (g, o) => {
  g.contact(0.56, 0.44);
  // the cabinet, two drawers
  g.box(0.54, 0.9, 0.4, WOOD, 0, 0.45, 0, 0.03);
  for (const y of [0.25, 0.6]) { g.box(0.46, 0.28, 0.02, WOOD_L, 0, y, 0.205, 0.015); g.box(0.12, 0.025, 0.02, BRASS, 0, y + 0.06, 0.222, 0.008); }
  // the chamber, its hatch, the tube going up and back into the wall
  g.cyl(0.1, 0.3, BRASS, 0.1, 1.05, -0.06);
  g.cyl(0.12, 0.04, darker(BRASS, 0.85), 0.1, 0.92, -0.06);
  g.cyl(0.12, 0.04, darker(BRASS, 0.85), 0.1, 1.19, -0.06);
  g.box(0.1, 0.16, 0.02, PANE, 0.1, 1.05, 0.048, 0.01);
  g.cyl(0.06, 0.7, BRASS, 0.1, 1.55, -0.06);
  g.ball(0.07, BRASS, 0.1, 1.9, -0.06);
  g.cyl(0.06, 0.12, BRASS, 0.1, 1.9, -0.14).rotation.x = Math.PI / 2;
  for (const y of [1.35, 1.7]) g.cyl(0.07, 0.03, darker(BRASS, 0.85), 0.1, y, -0.06);
  // a gauge on the tube, a lamp that lights when a capsule comes
  g.cyl(0.05, 0.02, CREAM, 0.1, 1.5, 0.005).rotation.x = Math.PI / 2;
  g.box(0.006, 0.04, 0.006, INK, 0.11, 1.51, 0.018, 0).rotation.z = -0.6;
  g.ball(0.03, AMBER, -0.12, 1.02, 0.02, 0.3 + o.night);
  // the tray and its capsule, a rolled message out of it
  g.box(0.3, 0.04, 0.16, BRASS, -0.08, 0.92, 0.1, 0.015);
  const cap = g.at(-0.08, 0.98, 0.1); cap.root.rotation.z = Math.PI / 2;
  cap.cyl(0.045, 0.2, TEAL, 0, 0, 0);
  for (const y of [-0.105, 0.105]) cap.ball(0.045, STEEL, 0, y, 0).scale.set(1, 0.4, 1);
  g.cyl(0.018, 0.08, PAPER, -0.21, 0.99, 0.1).rotation.z = Math.PI / 2;
  return { w: 0.57, d: 0.45, h: 1.98, z: 0.01 };
};

/** a switchboard (a router of calls: the agents' many connectors): a panel of jacks and lamps, cords plugged across, a headset on the desk */
const switchboard: Maker = (g, o) => {
  const w = 1.0;
  g.contact(w, 0.7, 0, 0.08);
  g.box(w, 1.5, 0.35, WOOD, 0, 0.75, -0.1, 0.03);
  g.box(w + 0.04, 0.08, 0.39, WOOD_D, 0, 1.54, -0.1, 0.02);
  g.box(w + 0.04, 0.05, 0.42, WOOD_L, 0, 0.75, 0.25, 0.015);
  for (const x of [-w / 2 + 0.04, w / 2 - 0.04]) g.box(0.05, 0.72, 0.05, WOOD_D, x, 0.365, 0.42, 0.015);
  // the panel: lamps over a grid of jacks
  g.box(0.86, 0.62, 0.02, SLATE, 0, 1.12, 0.085, 0.015);
  const cols = 7;
  for (let c = 0; c < cols; c++) {
    const x = -0.36 + c * 0.12;
    const lit = c < o.n;
    g.ball(0.022, lit ? AMBER : SLATE_L, x, 1.36, 0.1, lit ? 0.5 + o.night : 0);
    for (let r = 0; r < 4; r++) g.cyl(0.016, 0.012, INK, x, 1.24 - r * 0.11, 0.1).rotation.x = Math.PI / 2;
  }
  g.box(0.36, 0.07, 0.01, CREAM, 0, 1.47, 0.08, 0.01);
  // the plugs on the desk, their cords up to the jacks
  const cords: [number, number, number, string][] = [[-0.3, -0.24, 1.24, YELLOW], [-0.1, 0.12, 1.13, SKY], [0.1, -0.12, 1.02, VIOLET], [0.3, 0.36, 0.91, ORANGE], [0.2, 0.24, 1.24, GREEN]];
  for (const [x0, x1, y1, c] of cords) {
    g.cyl(0.014, 0.05, INK, x0, 0.8, 0.3);
    rod(g, 0.008, c, [x0, 0.82, 0.3], [x1, y1, 0.115]);
  }
  // the headset, a pad
  g.box(0.03, 0.03, 0.2, SLATE, -0.32, 0.79, 0.3, 0.012).rotation.z = 0.0;
  for (const z of [0.2, 0.4]) g.cyl(0.04, 0.03, SLATE, -0.32, 0.79, z);
  g.box(0.16, 0.012, 0.12, PAPER, 0.38, 0.781, 0.33, 0.003);
  return { w: 1.07, d: 0.78, h: 1.58, z: 0.08 };
};

export const COMMS = { mailbox, booth, visio, radio, dovecote, rotary, telegraph, dish, pneumatic, switchboard } satisfies Record<string, Maker>;

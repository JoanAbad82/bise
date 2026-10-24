// The objects of the games family: what the bims play on a break (Hacker News' arcade, Reddit's ping-pong table, a chess table, a pinball, a table football: ping-pong's compact one).
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import { CREAM, darker, GREEN, INK, ORANGE, PANE, SCREEN, SKY, SLATE, STEEL, TEAL, VIOLET, WOOD, WOOD_D, WOOD_L, YELLOW, type Maker } from './kit';

/** a chess table: a checkered board, the pieces mid-game, two stools */
const chess: Maker = (g) => {
  g.contact(1.3, 0.8);
  g.cyl(0.34, 0.06, WOOD_D, 0, 0.7, 0); g.cyl(0.06, 0.66, WOOD_D, 0, 0.35, 0); g.cyl(0.22, 0.04, WOOD_D, 0, 0.02, 0);
  g.box(0.5, 0.04, 0.5, WOOD, 0, 0.75, 0, 0.015);
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) g.box(0.055, 0.006, 0.055, darker(WOOD_D, 0.75), -0.1925 + i * 0.055, 0.772, -0.1925 + j * 0.055, 0);
  const piece = (i: number, j: number, white: boolean, h: number, crown = false) => {
    const x = -0.1925 + i * 0.055, z = -0.1925 + j * 0.055, c = white ? CREAM : INK;
    g.cyl(0.02, 0.012, c, x, 0.78, z); g.cyl(0.012, h, c, x, 0.786 + h / 2, z); g.ball(crown ? 0.02 : 0.016, c, x, 0.79 + h, z);
  };
  for (const [i, j, h] of [[0, 6, 0.03], [1, 6, 0.03], [3, 4, 0.03], [5, 6, 0.03], [6, 5, 0.03], [7, 6, 0.03], [4, 7, 0.08], [3, 7, 0.07], [6, 7, 0.05], [2, 5, 0.05]] as const) piece(i, j, true, h, h > 0.06);
  for (const [i, j, h] of [[0, 1, 0.03], [2, 1, 0.03], [4, 3, 0.03], [5, 1, 0.03], [7, 2, 0.03], [4, 0, 0.08], [3, 0, 0.07], [1, 0, 0.05], [5, 2, 0.05]] as const) piece(i, j, false, h, h > 0.06);
  // a taken piece beside the board, and the clock
  g.box(0.16, 0.08, 0.07, SLATE, 0.27, 0.77, 0, 0.02); for (const dz of [-0.025, 0.025]) g.cyl(0.012, 0.02, YELLOW, 0.29, 0.82, dz);
  for (const x of [-0.5, 0.5]) { g.cyl(0.16, 0.05, ORANGE, x, 0.45, 0); g.cyl(0.03, 0.42, STEEL, x, 0.22, 0); g.cyl(0.12, 0.02, STEEL, x, 0.02, 0); }
  return { w: 1.3, d: 0.7, h: 0.9 };
};

/** a ping-pong table (Reddit): blue top with white lines, net and posts, paddles, balls, a bucket */
const pingpong: Maker = (g) => {
  const w = 2.4, d = 1.36;
  g.contact(w, d);
  g.box(w, 0.07, d, '#2f73c9', 0, 0.76, 0, 0.025);
  g.box(w + 0.01, 0.03, d + 0.01, darker('#2f73c9', 0.7), 0, 0.71, 0, 0.012);
  for (const z of [d / 2 - 0.025, -d / 2 + 0.025, 0]) g.box(w - 0.02, 0.006, z === 0 ? 0.018 : 0.03, CREAM, 0, 0.797, z, 0);
  for (const x of [w / 2 - 0.025, -w / 2 + 0.025]) g.box(0.03, 0.006, d - 0.02, CREAM, x, 0.797, 0, 0);
  for (const x of [-w / 2 + 0.25, w / 2 - 0.25]) {
    for (const z of [-d / 2 + 0.18, d / 2 - 0.18]) { g.box(0.07, 0.7, 0.07, SLATE, x, 0.37, z, 0.02); g.cyl(0.05, 0.04, INK, x, 0.03, z); }
    g.box(0.05, 0.05, d - 0.4, SLATE, x, 0.25, 0, 0.015);
  }
  g.box(w - 0.6, 0.05, 0.05, SLATE, 0, 0.25, 0, 0.015);
  // the net: a cream mesh band with a dark tape, two posts
  g.box(0.02, 0.15, d + 0.06, CREAM, 0, 0.87, 0, 0.005);
  g.box(0.03, 0.025, d + 0.06, INK, 0, 0.95, 0, 0.008);
  for (let i = 0; i < 10; i++) g.box(0.024, 0.13, 0.008, '#e8e1d6', 0, 0.87, -d / 2 + 0.1 + i * 0.13, 0);
  for (const z of [-d / 2 - 0.04, d / 2 + 0.04]) g.box(0.06, 0.2, 0.04, INK, 0, 0.86, z, 0.01);
  for (const [x, z, c, r] of [[-0.62, 0.28, ORANGE, 0.4], [0.72, -0.24, TEAL, -0.7]] as const) {
    const p = g.at(x, 0.81, z); p.root.rotation.y = r;
    p.cyl(0.095, 0.025, c, 0, 0, 0); p.cyl(0.097, 0.012, INK, 0, -0.016, 0); p.box(0.045, 0.035, 0.13, WOOD_L, 0, 0, 0.14, 0.015);
  }
  g.ball(0.03, CREAM, 0.25, 0.84, 0.18);
  // a bucket of balls by the leg
  g.cyl(0.14, 0.24, YELLOW, w / 2 + 0.1, 0.12, d / 2 - 0.05);
  for (let i = 0; i < 5; i++) g.ball(0.035, i % 2 ? CREAM : ORANGE, w / 2 + 0.05 + (i % 3) * 0.05, 0.25, d / 2 - 0.08 + Math.floor(i / 3) * 0.06);
  // the table and its ball bucket on the right
  return { w: 2.66, d: 1.52, h: 0.97, x: 0.11, z: 0.01 };
};

/** an arcade cabinet (Hacker News): marquee, pixel screen, joystick, buttons, coin slots, side art */
const arcade: Maker = (g, o) => {
  const w = 0.78, d = 0.78;
  g.contact(w, d);
  g.box(w, 0.14, d, INK, 0, 0.07, 0, 0.03);
  g.box(w, 1.1, d, VIOLET, 0, 0.69, 0, 0.05);
  g.box(w, 0.72, d * 0.62, VIOLET, 0, 1.6, -d * 0.19, 0.05);
  // the marquee, lit, with three pixel blocks
  g.box(w + 0.04, 0.24, d * 0.64, YELLOW, 0, 2.04, -d * 0.18, 0.04, 0.25 + o.night * 0.9);
  for (const [x, c] of [[-0.16, ORANGE], [0, INK], [0.16, TEAL]] as const) g.box(0.09, 0.09, 0.02, c, x, 2.04, 0.13, 0.01);
  // the screen, tilted back: a little game (ground, a hero, a coin)
  const sc = g.at(0, 1.5, 0.12); sc.root.rotation.x = -0.28;
  sc.box(w - 0.12, 0.54, 0.05, INK, 0, 0, 0, 0.03);
  sc.box(w - 0.22, 0.42, 0.01, SCREEN, 0, 0.01, 0.037, 0.01, 0.4 + o.night * 0.6);
  sc.box(w - 0.24, 0.05, 0.012, GREEN, 0, -0.15, 0.043, 0.0, 0.6 + o.night);
  sc.box(0.06, 0.08, 0.012, YELLOW, -0.12, -0.08, 0.043, 0.0, 0.6 + o.night);
  sc.ball(0.025, YELLOW, 0.1, 0.02, 0.043, 0.6 + o.night);
  sc.box(0.08, 0.04, 0.012, SKY, 0.15, 0.13, 0.043, 0.0, 0.6 + o.night);
  // the control deck: joystick and six buttons
  const deck = g.at(0, 1.2, 0.3); deck.root.rotation.x = 0.35;
  deck.box(w + 0.02, 0.08, 0.38, INK, 0, 0, 0, 0.03);
  deck.cyl(0.05, 0.02, SLATE, -0.2, 0.05, 0.02); deck.box(0.025, 0.12, 0.025, STEEL, -0.2, 0.11, 0.02, 0.01); deck.ball(0.05, ORANGE, -0.2, 0.19, 0.02);
  for (let i = 0; i < 6; i++) deck.cyl(0.033, 0.03, [YELLOW, SKY, GREEN, YELLOW, SKY, GREEN][i] as string, 0.0 + (i % 3) * 0.1, 0.05, -0.05 + Math.floor(i / 3) * 0.1);
  // coin door: two slots and their lit returns, a kick plate
  g.box(0.3, 0.26, 0.02, darker(VIOLET, 0.7), 0, 0.62, d / 2 + 0.005, 0.02);
  for (const x of [-0.07, 0.07]) { g.box(0.05, 0.08, 0.02, YELLOW, x, 0.68, d / 2 + 0.015, 0.01, 0.4 + o.night); g.box(0.012, 0.05, 0.02, INK, x, 0.68, d / 2 + 0.025, 0.002); }
  // side art: a zigzag of two stripes
  for (let i = 0; i < 4; i++) { const s = g.box(0.012, 0.32, 0.09, i % 2 ? TEAL : YELLOW, w / 2 + 0.006, 0.5 + i * 0.24, -0.1 + (i % 2) * 0.12, 0.004); s.rotation.x = i % 2 ? 0.5 : -0.5; }
  // speaker grill on the deck's front
  for (let i = 0; i < 4; i++) g.box(0.22, 0.015, 0.01, INK, 0, 1.0 + i * 0.03, d / 2 + 0.005, 0.0);
  return { w: 0.86, d: 0.92, h: 2.15, z: 0.05 };
};

/** a pinball machine: the playfield under glass, a lit backbox, flippers */
const pinball: Maker = (g, o) => {
  g.contact(0.75, 1.3, 0, 0);
  // the playfield cabinet, lower at the player's end (+z), its backbox standing on its far end, joined
  for (const [x, z, h] of [[-0.3, 0.52, 0.72], [0.3, 0.52, 0.72], [-0.3, -0.52, 0.8], [0.3, -0.52, 0.8]] as const) g.box(0.05, h, 0.05, INK, x, h / 2, z, 0.015);
  const body = g.at(0, 0.88, 0); body.root.rotation.x = 0.07;
  body.box(0.7, 0.24, 1.25, SKY, 0, 0, 0, 0.04);
  body.box(0.62, 0.01, 1.15, SCREEN, 0, 0.125, 0, 0.01, 0.2);
  for (const [x, z, c] of [[-0.12, -0.3, YELLOW], [0.12, -0.3, ORANGE], [0, -0.1, GREEN]] as const) body.cyl(0.07, 0.06, c, x, 0.16, z, 0.5 + o.night);
  for (const dx of [-1, 1]) { const fl = body.box(0.16, 0.03, 0.04, CREAM, dx * 0.09, 0.15, 0.42, 0.01); fl.rotation.y = dx * 0.4; }
  body.ball(0.025, STEEL, 0.05, 0.16, 0.15);
  body.pane(0.66, 0.01, 1.2, PANE, 0.2, 0, 0.2, 0, 0.01);
  // the backbox: its foot inside the cabinet's far end, no gap
  g.box(0.7, 0.2, 0.16, SKY, 0, 0.96, -0.57, 0.03);
  g.box(0.7, 0.62, 0.16, SKY, 0, 1.36, -0.6, 0.04);
  // the lit glass out of the backbox's rounded front (z -0.504), the score plate out of the glass
  g.box(0.6, 0.48, 0.02, YELLOW, 0, 1.38, -0.497, 0.02, 0.5 + o.night);
  for (let i = 0; i < 3; i++) g.ball(0.05, [ORANGE, VIOLET, TEAL][i] as string, -0.15 + i * 0.15, 1.4, -0.49);
  g.box(0.2, 0.06, 0.02, INK, 0, 1.2, -0.49, 0.01);
  return { w: 0.75, d: 1.36, h: 1.7, z: -0.02 };
};

/** a table football: green pitch, rods with little players in two colours, handles */
const babyfoot: Maker = (g) => {
  const w = 1.5, d = 0.85;
  g.contact(w, d);
  for (const x of [-0.6, 0.6]) for (const z of [-0.3, 0.3]) g.box(0.08, 0.75, 0.08, WOOD_D, x, 0.375, z, 0.02);
  g.box(w - 0.3, 0.26, d - 0.12, WOOD, 0, 0.88, 0, 0.03);
  g.box(w - 0.4, 0.02, d - 0.22, GREEN, 0, 0.9, 0, 0.005);
  g.box(0.01, 0.005, d - 0.24, CREAM, 0, 0.912, 0, 0);
  for (const x of [-0.56, 0.56]) g.box(0.04, 0.1, 0.2, CREAM, x, 0.94, 0, 0.01);
  for (let r = 0; r < 6; r++) {
    const x = -0.45 + r * 0.18, col = r % 2 ? SKY : YELLOW;
    const rod = g.cyl(0.012, d + 0.3, STEEL, x, 1.0, 0); rod.rotation.x = Math.PI / 2;
    g.cyl(0.03, 0.1, INK, x, 1.0, (r % 2 ? 1 : -1) * (d / 2 + 0.17)).rotation.x = Math.PI / 2;
    const n = r === 0 || r === 5 ? 1 : r % 3 === 0 ? 2 : 3;
    for (let k = 0; k < n; k++) { const z = (k - (n - 1) / 2) * 0.2; g.box(0.04, 0.12, 0.04, col, x, 0.96, z, 0.015); g.ball(0.025, col, x, 1.04, z); }
  }
  g.ball(0.02, CREAM, 0.05, 0.92, 0.1);
  // the rods' handles stick out of both long sides
  return { w, d: d + 0.45, h: 1.1 };
};

export const GAMES = { chess, pingpong, arcade, pinball, babyfoot } satisfies Record<string, Maker>;

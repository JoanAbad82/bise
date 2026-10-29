// The objects of the games family: what the bims play on a break (Hacker News' arcade, Reddit's ping-pong table, a chess table, a pinball, a table football: ping-pong's compact one; p2: a pool table, a go board, a giant tumbling tower, a claw machine, a card table).
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

/** a pool table: green cloth in wooden rails, six pockets, the balls racked, the cue ball and a cue lying on the cloth */
const billiards: Maker = (g) => {
  const w = 2.2, d = 1.24;
  g.contact(w, d);
  for (const x of [-w / 2 + 0.22, w / 2 - 0.22]) for (const z of [-d / 2 + 0.2, d / 2 - 0.2]) { g.box(0.14, 0.56, 0.14, WOOD_D, x, 0.28, z, 0.03); g.cyl(0.1, 0.04, INK, x, 0.02, z); }
  g.box(w - 0.04, 0.2, d - 0.04, WOOD_D, 0, 0.62, 0, 0.04);
  g.box(w - 0.2, 0.03, d - 0.2, '#2f8f5a', 0, 0.735, 0, 0.005);
  // the rails: long ones end to end, short ones between them, a cream sight dot on each long one
  for (const z of [-d / 2 + 0.05, d / 2 - 0.05]) { g.box(w, 0.07, 0.1, WOOD, 0, 0.755, z, 0.02); for (const x of [-0.5, 0.5]) g.cyl(0.012, 0.006, CREAM, x, 0.792, z); }
  for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) g.box(0.1, 0.07, d - 0.2, WOOD, x, 0.755, 0, 0.02);
  for (const [x, z] of [[-w / 2 + 0.07, -d / 2 + 0.07], [w / 2 - 0.07, -d / 2 + 0.07], [-w / 2 + 0.07, d / 2 - 0.07], [w / 2 - 0.07, d / 2 - 0.07], [0, -d / 2 + 0.06], [0, d / 2 - 0.06]] as const) g.cyl(0.055, 0.012, INK, x, 0.796, z);
  // the rack: five rows, the eight ball in the middle; never a red ball
  const cols = [YELLOW, SKY, VIOLET, ORANGE, GREEN, TEAL, WOOD_D, INK, darker(YELLOW, 0.8), darker(SKY, 0.75), darker(VIOLET, 0.8), CREAM, darker(GREEN, 0.75), darker(ORANGE, 0.8), darker(TEAL, 0.8)];
  let k = 0;
  for (let r = 0; r < 5; r++) for (let i = 0; i <= r; i++) {
    const c = r === 2 && i === 1 ? INK : (cols[k % cols.length] as string);
    k++;
    g.ball(0.034, c, 0.42 + r * 0.06, 0.785, (i - r / 2) * 0.07);
  }
  g.ball(0.034, CREAM, -0.1, 0.785, 0.16);
  // the cue: a pale shaft and a dark butt, lying on the cloth, aimed at the cue ball
  const cue = g.at(-0.62, 0.766, 0.1); cue.root.rotation.y = -0.12;
  cue.cyl(0.011, 0.9, WOOD_L, 0, 0, 0).rotation.z = Math.PI / 2;
  cue.cyl(0.016, 0.34, INK, -0.2, 0, 0).rotation.z = Math.PI / 2;
  g.box(0.03, 0.03, 0.03, SKY, w / 2 - 0.05, 0.806, -0.3, 0.005);
  return { w, d, h: 0.83 };
};

/** a go board: a thick goban on its short legs, a game half played, two bowls of stones, two floor cushions */
const go: Maker = (g) => {
  g.contact(0.62, 0.62);
  for (const x of [-0.22, 0.22]) for (const z of [-0.22, 0.22]) g.cyl(0.045, 0.1, WOOD_D, x, 0.05, z);
  g.box(0.6, 0.22, 0.6, WOOD_L, 0, 0.21, 0, 0.02);
  // a 9 x 9 grid, the two directions 3 mm apart in height
  for (let i = 0; i < 9; i++) {
    const t = -0.24 + i * 0.06;
    g.box(0.49, 0.004, 0.006, INK, 0, 0.321, t, 0);
    g.box(0.006, 0.004, 0.49, INK, t, 0.324, 0, 0);
  }
  const stones: readonly (readonly [number, number, boolean])[] = [[2, 2, true], [6, 6, false], [2, 6, true], [6, 2, false], [3, 3, false], [4, 2, true], [5, 3, false], [4, 4, true], [3, 5, false], [5, 5, true], [2, 4, true], [6, 4, false], [4, 6, false], [5, 6, true]];
  for (const [i, j, black] of stones) g.ball(0.026, black ? INK : CREAM, -0.24 + i * 0.06, 0.334, -0.24 + j * 0.06).scale.y = 0.4;
  // the players kneel on either side: a cushion and their bowl, its lid against it
  for (const [s, c, black] of [[-1, VIOLET, true], [1, TEAL, false]] as const) {
    g.box(0.46, 0.08, 0.46, c, s * 0.62, 0.04, 0, 0.04);
    g.cyl(0.085, 0.09, WOOD_D, s * 0.42, 0.045, 0.24);
    for (let i = 0; i < 4; i++) g.ball(0.026, black ? INK : CREAM, s * 0.42 + (i - 1.5) * 0.03, 0.093 + (i % 2) * 0.006, 0.24 + (i % 2 ? 0.02 : -0.02)).scale.y = 0.4;
    g.cyl(0.085, 0.02, WOOD_D, s * 0.42, 0.01, -0.24);
  }
  return { w: 1.74, d: 0.66, h: 0.35 };
};

/** a giant tumbling tower: 16 layers of three pale blocks, a few pushed out or gone, two on the floor */
const jenga: Maker = (g) => {
  const L = 0.3, t = 0.098, h = 0.06;
  g.contact(0.42, 0.42);
  // the pushed ones (layer, block, how far) and the gone ones
  const pushed = new Map<string, number>([['3,1', 0.09], ['7,0', -0.07], ['10,1', 0.12], ['13,2', 0.06]]);
  const gone = new Set(['5,1', '8,1', '11,0', '12,1']);
  for (let l = 0; l < 16; l++) {
    const y = h / 2 + l * h;
    for (let b = 0; b < 3; b++) {
      if (gone.has(`${l},${b}`)) continue;
      const off = pushed.get(`${l},${b}`) ?? 0;
      const c = (l + b) % 3 === 0 ? WOOD : (l + b) % 3 === 1 ? WOOD_L : '#dcae74';
      const across = (b - 1) * (t + 0.003);
      if (l % 2 === 0) g.box(L, h - 0.003, t, c, off, y, across, 0.01);
      else g.box(t, h - 0.003, L, c, across, y, off, 0.01);
    }
  }
  // the one just pulled, laid on top across, and two that fell
  g.box(L, h - 0.003, t, WOOD_L, 0.02, h / 2 + 16 * h, 0.04, 0.01).rotation.y = 0.3;
  g.box(L, h - 0.003, t, WOOD, 0.36, h / 2, 0.22, 0.01).rotation.y = 0.7;
  const lean = g.box(L, h - 0.003, t, '#dcae74', -0.32, 0.075, 0.16, 0.01); lean.rotation.y = -0.4; lean.rotation.z = 0.35;
  return { w: 1.0, d: 0.59, h: 1.02, x: 0.015, z: 0.068 };
};

/** a claw machine: a glass case full of plush, the claw on its gantry, a lit marquee, the stick and the prize door */
const claw: Maker = (g, o) => {
  const w = 0.8, d = 0.8;
  g.contact(w, d);
  g.box(w, 0.8, d, TEAL, 0, 0.4, 0, 0.04);
  g.box(0.24, 0.2, 0.02, INK, -0.2, 0.3, d / 2 + 0.03, 0.02);
  g.box(0.12, 0.1, 0.02, YELLOW, 0.22, 0.52, d / 2 + 0.03, 0.01, 0.4 + o.night);
  // the stick and the button on a ledge
  const deck = g.at(0, 0.84, d / 2 + 0.06); deck.root.rotation.x = 0.25;
  deck.box(w - 0.06, 0.06, 0.18, SLATE, 0, 0, 0, 0.02);
  deck.cyl(0.035, 0.012, INK, -0.15, 0.035, 0); deck.box(0.018, 0.1, 0.018, STEEL, -0.15, 0.08, 0, 0.005); deck.ball(0.04, ORANGE, -0.15, 0.14, 0);
  deck.cyl(0.04, 0.03, SKY, 0.15, 0.04, 0, 0.3 + o.night * 0.6);
  // the case: four posts and four panes, a pile of plush on its floor
  for (const x of [-w / 2 + 0.03, w / 2 - 0.03]) for (const z of [-d / 2 + 0.03, d / 2 - 0.03]) g.box(0.06, 0.8, 0.06, SLATE, x, 1.2, z, 0.015);
  for (const z of [-d / 2 + 0.03, d / 2 - 0.03]) g.pane(w - 0.12, 0.76, 0.01, PANE, 0.18, 0, 1.2, z, 0.005);
  for (const x of [-w / 2 + 0.03, w / 2 - 0.03]) g.pane(0.01, 0.76, d - 0.12, PANE, 0.18, x, 1.2, 0, 0.005);
  const plush = [YELLOW, SKY, VIOLET, GREEN, ORANGE, CREAM, TEAL, YELLOW, SKY];
  for (let i = 0; i < 9; i++) {
    const x = -0.2 + (i % 3) * 0.2 + (i % 2 ? 0.02 : -0.02), z = -0.2 + Math.floor(i / 3) * 0.2, y = 0.87 + ((i * 7) % 3) * 0.025, c = plush[i] as string;
    g.ball(0.075, c, x, y, z);
    for (const e of [-1, 1]) g.ball(0.024, c, x + e * 0.045, y + 0.065, z);
    g.ball(0.012, INK, x - 0.022, y + 0.015, z + 0.066); g.ball(0.012, INK, x + 0.022, y + 0.015, z + 0.066);
  }
  // the gantry, the carriage, the string and the claw's three fingers
  g.box(w - 0.1, 0.04, 0.04, STEEL, 0, 1.54, -0.08, 0.01);
  g.box(0.1, 0.06, 0.1, SLATE, 0.08, 1.52, -0.08, 0.02);
  g.cyl(0.006, 0.22, INK, 0.08, 1.38, -0.08);
  g.cyl(0.035, 0.05, STEEL, 0.08, 1.25, -0.08);
  for (let i = 0; i < 3; i++) {
    const a = (i * 2 * Math.PI) / 3, f = g.at(0.08 + Math.cos(a) * 0.035, 1.2, -0.08 + Math.sin(a) * 0.035);
    f.root.rotation.y = -a; f.root.rotation.z = 0.35;
    f.box(0.015, 0.1, 0.015, STEEL, 0, -0.04, 0, 0.005);
  }
  // the top: a box with its lit marquee and a row of bulbs
  g.box(w, 0.26, d, VIOLET, 0, 1.73, 0, 0.04);
  g.box(w - 0.1, 0.16, 0.02, YELLOW, 0, 1.73, d / 2 + 0.03, 0.02, 0.4 + o.night * 0.9);
  for (let i = 0; i < 5; i++) g.ball(0.022, [ORANGE, SKY, GREEN, SKY, ORANGE][i] as string, -0.28 + i * 0.14, 1.73, d / 2 + 0.045, 0.4 + o.night);
  return { w: 0.84, d: 0.98, h: 1.86, z: 0.07 };
};

/** a card table: a round green baize, four stools, the hands fanned out, chips stacked, the deck in the middle */
const cards: Maker = (g) => {
  g.contact(1.4, 1.4);
  g.cyl(0.28, 0.04, WOOD_D, 0, 0.02, 0); g.cyl(0.06, 0.66, WOOD_D, 0, 0.36, 0);
  g.cyl(0.5, 0.06, WOOD_D, 0, 0.72, 0);
  g.cyl(0.44, 0.012, '#2f8f5a', 0, 0.754, 0);
  for (let s = 0; s < 4; s++) {
    const a = Math.PI / 4 + (s * Math.PI) / 2, cx = Math.cos(a), sz = Math.sin(a);
    // a stool
    g.cyl(0.16, 0.05, s % 2 ? VIOLET : ORANGE, cx * 0.72, 0.45, sz * 0.72); g.cyl(0.03, 0.42, STEEL, cx * 0.72, 0.22, sz * 0.72); g.cyl(0.12, 0.02, STEEL, cx * 0.72, 0.01, sz * 0.72);
    // the player's hand: five cards fanned, each 3 mm over the last, the backs up
    for (let c = 0; c < 5; c++) {
      const card = g.at(cx * 0.3 + -sz * (c - 2) * 0.03, 0.763 + c * 0.003, sz * 0.3 + cx * (c - 2) * 0.03);
      card.root.rotation.y = -a + Math.PI / 2 + (c - 2) * 0.2;
      card.box(0.06, 0.002, 0.09, s === 0 ? CREAM : SKY, 0, 0, 0, 0);
    }
    // the player's chips: two stacks
    for (const [k, col] of [[-1, YELLOW], [1, s % 2 ? INK : TEAL]] as const) {
      const x = cx * 0.36 + -sz * k * 0.12, z = sz * 0.36 + cx * k * 0.12;
      for (let i = 0; i < 3 + s; i++) g.cyl(0.024, 0.008, i % 2 ? CREAM : col, x, 0.765 + i * 0.008, z);
    }
  }
  // the deck and two face-up cards
  g.box(0.07, 0.03, 0.1, SKY, 0, 0.775, 0, 0.005);
  for (const [x, r] of [[-0.12, 0.2], [0.12, -0.15]] as const) {
    const c = g.at(x, 0.762, 0.04); c.root.rotation.y = r;
    c.box(0.06, 0.002, 0.09, CREAM, 0, 0, 0, 0); c.box(0.02, 0.002, 0.02, INK, 0, 0.003, 0, 0);
  }
  return { w: 1.34, d: 1.34, h: 0.82 };
};

export const GAMES = { chess, pingpong, arcade, pinball, babyfoot, billiards, go, jenga, claw, cards } satisfies Record<string, Maker>;

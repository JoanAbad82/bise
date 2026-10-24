// The objects of the music family: an upright piano and a jukebox (the piano's compact one).
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import { CREAM, darker, GREEN, INK, ORANGE, SCREEN, SKY, SLATE, SLATE_L, STEEL, TEAL, VIOLET, WOOD, WOOD_D, WOOD_L, YELLOW, type Maker } from './kit';

/** an upright piano, its lid open on a score, a stool */
const piano: Maker = (g, o) => {
  const w = 1.4, d = 0.55;
  g.contact(w, d + 0.4, 0, 0.15);
  g.box(w, 1.2, d, INK, 0, 0.6 + 0.04, -0.05, 0.04);
  g.box(w + 0.04, 0.05, d + 0.04, '#2b2724', 0, 1.27, -0.05, 0.02);
  g.box(w - 0.1, 0.06, 0.34, '#2b2724', 0, 0.76, 0.3, 0.02);
  g.box(w - 0.16, 0.025, 0.16, CREAM, 0, 0.8, 0.36, 0.005);
  for (let i = 0; i < 18; i++) if (i % 7 !== 2 && i % 7 !== 6) g.box(0.035, 0.03, 0.09, INK, -0.58 + i * 0.07 + 0.035, 0.82, 0.32, 0.005);
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) g.box(0.08, 0.76, 0.08, INK, x, 0.38, 0.38, 0.02);
  const sc = g.box(0.36, 0.26, 0.01, CREAM, 0, 1.0, 0.2, 0.01); sc.rotation.x = -0.25;
  for (let r = 0; r < 4; r++) g.box(0.3, 0.006, 0.006, INK, 0, 1.06 - r * 0.05, 0.21 + r * 0.012, 0).rotation.x = -0.25;
  for (const x of [-0.5, 0.5]) { g.cyl(0.04, 0.12, YELLOW, x, 1.36, -0.1, 0.4 + o.night); g.cyl(0.012, 0.04, CREAM, x, 1.44, -0.1, 0.6 + o.night); }
  g.box(0.6, 0.06, 0.32, WOOD_D, 0, 0.48, 0.8, 0.02); for (const x of [-0.25, 0.25]) for (const z of [0.68, 0.92]) g.box(0.05, 0.45, 0.05, WOOD_D, x, 0.225, z, 0.01);
  g.box(0.58, 0.04, 0.3, VIOLET, 0, 0.52, 0.8, 0.015);
  // the piano and its stool in front
  return { w: 1.46, d: 1.33, h: 1.46, z: 0.31 };
};

/** a jukebox: an arched top, a lit window on the records, bubble tubes */
const jukebox: Maker = (g, o) => {
  const w = 0.82, d = 0.6;
  g.contact(w, d);
  g.box(w, 1.1, d, WOOD_D, 0, 0.55, 0, 0.05);
  const arch = g.cyl(w / 2, d, WOOD_D, 0, 1.1, 0); arch.rotation.x = Math.PI / 2;
  // the front's layers stand out of the cabinet's rounded front (z d/2 + 0.02), 3 mm apart at least
  const glow = g.cyl(w / 2 - 0.06, 0.02, YELLOW, 0, 1.1, d / 2 + 0.022, 0.5 + o.night); glow.rotation.x = Math.PI / 2;
  const inner = g.cyl(w / 2 - 0.14, 0.03, ORANGE, 0, 1.1, d / 2 + 0.033, 0.3 + o.night); inner.rotation.x = Math.PI / 2;
  g.box(0.5, 0.3, 0.02, SCREEN, 0, 0.8, d / 2 + 0.043, 0.02, 0.2 + o.night * 0.4);
  for (let i = 0; i < 5; i++) g.cyl(0.11, 0.008, INK, 0, 0.7 + i * 0.045, d / 2 - 0.05);
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) { g.box(0.06, 0.9, 0.06, SKY, x, 0.6, d / 2 - 0.01, 0.025, 0.4 + o.night); }
  g.box(0.6, 0.2, 0.02, darker(WOOD_D, 0.75), 0, 0.3, d / 2 + 0.03, 0.02);
  for (let i = 0; i < 6; i++) g.box(0.5, 0.012, 0.01, YELLOW, 0, 0.23 + i * 0.026, d / 2 + 0.047, 0);
  for (let i = 0; i < 4; i++) g.cyl(0.018, 0.02, [YELLOW, GREEN, SKY, ORANGE][i] as string, -0.12 + i * 0.08, 0.53, d / 2 + 0.032).rotation.x = Math.PI / 2;
  return { w: 0.86, d: 0.68, h: 1.55, z: 0.02 };
};

/** a record player on a low sideboard, two small speakers, a crate of records on the floor beside it */
const turntable: Maker = (g, o) => {
  const w = 1.2, d = 0.5;
  g.contact(1.6, d, 0.2, 0);
  for (const x of [-w / 2 + 0.08, w / 2 - 0.08]) for (const z of [-d / 2 + 0.08, d / 2 - 0.08]) g.cyl(0.03, 0.12, WOOD_D, x, 0.06, z);
  g.box(w, 0.42, d, WOOD, 0, 0.33, 0, 0.03);
  // the front: a door with its knob, an open cubby of records
  g.box(0.54, 0.34, 0.02, WOOD_L, -0.28, 0.33, d / 2 + 0.004, 0.015); g.ball(0.018, INK, -0.08, 0.33, d / 2 + 0.02);
  g.box(0.5, 0.34, 0.02, darker(WOOD_D, 0.6), 0.29, 0.33, d / 2 + 0.004, 0.015);
  for (let i = 0; i < 9; i++) g.box(0.03, 0.28, 0.02, SLEEVES[i % SLEEVES.length] as string, 0.1 + i * 0.045, 0.32, d / 2 + 0.012, 0.004);
  // the deck: plinth, platter, the record, its label, the arm
  g.box(0.46, 0.08, 0.36, SLATE, -0.1, 0.58, 0, 0.02);
  g.cyl(0.15, 0.02, STEEL, -0.15, 0.63, 0);
  g.cyl(0.142, 0.008, INK, -0.15, 0.644, 0);
  g.cyl(0.045, 0.004, YELLOW, -0.15, 0.65, 0); g.cyl(0.006, 0.03, STEEL, -0.15, 0.655, 0);
  g.cyl(0.03, 0.04, STEEL, 0.06, 0.64, -0.11);
  const arm = g.at(0.06, 0.67, -0.11); arm.root.rotation.y = -0.5;
  arm.box(0.012, 0.012, 0.24, STEEL, 0, 0, 0.12, 0); arm.box(0.03, 0.02, 0.04, INK, 0, -0.008, 0.25, 0.005);
  g.box(0.03, 0.01, 0.03, GREEN, 0.06, 0.625, 0.13, 0.004, 0.4 + o.night);
  // the speakers, their cones facing out
  for (const x of [-0.5, 0.42]) {
    g.box(0.18, 0.28, 0.18, INK, x, 0.68, 0, 0.03);
    for (const [y, r] of [[0.73, 0.04], [0.63, 0.065]] as const) g.cyl(r, 0.02, SLATE_L, x, y, 0.094).rotation.x = Math.PI / 2;
  }
  // the crate: four slats walls on a bottom, records standing in it, one leaning out
  const cx = 0.86, cz = 0.04;
  g.box(0.36, 0.03, 0.36, WOOD_L, cx, 0.015, cz, 0.01);
  for (const s of [-1, 1]) { g.box(0.36, 0.26, 0.03, WOOD_L, cx, 0.13, cz + s * 0.165, 0.01); g.box(0.03, 0.26, 0.3, WOOD_L, cx + s * 0.165, 0.13, cz, 0.01); }
  for (let i = 0; i < 6; i++) { const r = g.box(0.3, 0.3, 0.012, SLEEVES[(i + 3) % SLEEVES.length] as string, cx, 0.18, cz - 0.12 + i * 0.045, 0.004); r.rotation.x = -0.12; }
  const out = g.at(cx, 0.2, cz + 0.2); out.root.rotation.x = 0.35;
  out.box(0.3, 0.3, 0.012, YELLOW, 0, 0, 0, 0.004); out.cyl(0.1, 0.006, INK, 0, 0, 0.007).rotation.x = Math.PI / 2;
  return { w: 1.66, d: 0.56, h: 0.82, x: 0.216, z: 0.018 };
};

/** the record sleeves' colours, and the spines' */
const SLEEVES = [YELLOW, SKY, VIOLET, TEAL, ORANGE, CREAM, GREEN, SLATE_L];

/** an acoustic guitar leaning in its stand, a little amp beside it */
const guitar: Maker = (g, o) => {
  g.contact(0.8, 0.4, 0.2, 0);
  // the stand: two front legs, one back, the cradle and the neck's fork
  for (const s of [-1, 1]) { const l = g.box(0.025, 0.42, 0.025, INK, s * 0.14, 0.2, 0.08, 0.008); l.rotation.z = s * 0.3; }
  const back = g.box(0.025, 0.9, 0.025, INK, 0, 0.45, -0.15, 0.008); back.rotation.x = 0.12;
  g.box(0.34, 0.03, 0.08, INK, 0, 0.36, 0.1, 0.01);
  g.box(0.1, 0.03, 0.05, INK, 0, 0.92, -0.08, 0.01);
  // the guitar, leaning back on the fork: two bouts, a waist, the hole, the bridge, the neck, the head
  const gt = g.at(0, 0.38, 0.07); gt.root.rotation.x = -0.18;
  for (const [y, r, t] of [[0.2, 0.2, 0.1], [0.46, 0.155, 0.094]] as const) gt.cyl(r, t, ORANGE, 0, y, 0).rotation.x = Math.PI / 2;
  gt.box(0.24, 0.14, 0.07, darker(ORANGE, 0.9), 0, 0.33, 0, 0.02);
  gt.cyl(0.055, 0.006, darker(ORANGE, 0.55), 0, 0.4, 0.05).rotation.x = Math.PI / 2;
  gt.cyl(0.05, 0.004, INK, 0, 0.4, 0.054).rotation.x = Math.PI / 2;
  gt.box(0.14, 0.025, 0.012, WOOD_D, 0, 0.16, 0.053, 0.004);
  gt.box(0.06, 0.6, 0.04, WOOD_D, 0, 0.88, 0, 0.012);
  gt.box(0.05, 0.56, 0.006, INK, 0, 0.86, 0.022, 0);
  for (let i = 0; i < 4; i++) gt.box(0.052, 0.004, 0.004, STEEL, 0, 0.66 + i * 0.12, 0.027, 0);
  gt.box(0.09, 0.16, 0.035, WOOD_D, 0, 1.25, -0.01, 0.015);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) gt.ball(0.014, CREAM, s * 0.056, 1.2 + i * 0.045, -0.01);
  for (let i = 0; i < 6; i++) gt.cyl(0.0018, 1.02, STEEL, (i - 2.5) * 0.007, 0.68, 0.03);
  // the amp: grille, a row of knobs, its little light
  g.box(0.32, 0.3, 0.22, SLATE, 0.5, 0.15, 0, 0.03);
  g.box(0.26, 0.18, 0.01, darker(WOOD_L, 0.75), 0.5, 0.13, 0.112, 0.01);
  g.box(0.3, 0.04, 0.03, INK, 0.5, 0.31, -0.06, 0.01);
  for (let i = 0; i < 4; i++) g.cyl(0.012, 0.015, CREAM, 0.42 + i * 0.05, 0.255, 0.112).rotation.x = Math.PI / 2;
  g.ball(0.01, GREEN, 0.38, 0.255, 0.11, 0.6 + o.night);
  return { w: 0.89, d: 0.36, h: 1.69, x: 0.229, z: -0.036 };
};

/** a drum kit: bass drum, snare, two toms, a floor tom, the hi-hat, a crash cymbal and the stool */
const drums: Maker = (g) => {
  const SHELL = TEAL, HEAD = CREAM, BRASS = darker(YELLOW, 0.85);
  g.contact(1.4, 1.3, 0, -0.05);
  // the bass drum, lying on its side, its front head out to +z, two little feet
  g.cyl(0.28, 0.36, SHELL, 0, 0.29, 0.2).rotation.x = Math.PI / 2;
  g.cyl(0.27, 0.02, HEAD, 0, 0.29, 0.386).rotation.x = Math.PI / 2;
  g.cyl(0.12, 0.006, VIOLET, 0, 0.29, 0.398).rotation.x = Math.PI / 2;
  g.cyl(0.292, 0.03, STEEL, 0, 0.29, 0.37).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) { const f = g.box(0.02, 0.2, 0.02, STEEL, s * 0.25, 0.08, 0.34, 0.006); f.rotation.z = s * 0.4; }
  // two toms on the bass drum, tilted to the player
  for (const s of [-1, 1]) {
    const t = g.at(s * 0.15, 0.7, 0.14); t.root.rotation.x = -0.3; t.root.rotation.z = -s * 0.15;
    t.cyl(0.12, 0.16, SHELL, 0, 0, 0); t.cyl(0.115, 0.01, HEAD, 0, 0.083, 0);
  }
  g.cyl(0.015, 0.14, STEEL, 0, 0.6, 0.18);
  // the snare at the player's left, on its stand, the sticks across it
  for (let i = 0; i < 3; i++) { const a = (i * 2 * Math.PI) / 3; const l = g.at(-0.38 + Math.cos(a) * 0.1, 0.18, -0.18 + Math.sin(a) * 0.1); l.root.rotation.y = -a; l.root.rotation.z = 0.5; l.box(0.015, 0.36, 0.015, STEEL, 0, 0, 0, 0.004); }
  g.cyl(0.012, 0.3, STEEL, -0.38, 0.4, -0.18);
  g.cyl(0.17, 0.12, SKY, -0.38, 0.6, -0.18); g.cyl(0.165, 0.01, HEAD, -0.38, 0.664, -0.18);
  for (const dz of [-0.03, 0.03]) { const s = g.cyl(0.008, 0.4, WOOD_L, -0.36, 0.675, -0.18 + dz); s.rotation.z = Math.PI / 2; s.rotation.y = dz * 4; }
  // the floor tom at the player's right, on three legs
  for (const [dx, dz] of [[-0.17, 0.08], [0.17, 0.08], [0, -0.18]] as const) g.cyl(0.012, 0.3, STEEL, 0.42 + dx, 0.15, -0.12 + dz);
  g.cyl(0.19, 0.3, SHELL, 0.42, 0.42, -0.12); g.cyl(0.185, 0.01, HEAD, 0.42, 0.575, -0.12);
  // the hi-hat: its stand and pedal, two cymbals 3 cm apart
  g.cyl(0.012, 0.86, STEEL, -0.58, 0.43, 0.08); g.box(0.08, 0.02, 0.2, INK, -0.58, 0.01, -0.02, 0.006);
  g.cyl(0.15, 0.008, BRASS, -0.58, 0.82, 0.08); g.cyl(0.15, 0.008, BRASS, -0.58, 0.85, 0.08);
  // the crash on a tall stand at the back right, tilted
  g.cyl(0.012, 1.1, STEEL, 0.5, 0.55, 0.3);
  const cr = g.at(0.5, 1.12, 0.3); cr.root.rotation.x = -0.25; cr.root.rotation.z = 0.2;
  cr.cyl(0.2, 0.008, BRASS, 0, 0, 0); cr.cyl(0.03, 0.014, darker(YELLOW, 0.7), 0, 0.009, 0);
  // the stool behind, where the player sits
  g.cyl(0.15, 0.08, INK, 0, 0.5, -0.55); g.cyl(0.025, 0.44, STEEL, 0, 0.23, -0.55); g.cyl(0.14, 0.02, STEEL, 0, 0.01, -0.55);
  return { w: 1.43, d: 1.21, h: 1.22, x: -0.017, z: -0.098 };
};

/** a synthesizer on its X stand: keys, knobs, a little lit screen, a row of pads, the sustain pedal */
const synth: Maker = (g, o) => {
  const w = 1.0;
  g.contact(w, 0.5);
  // the stand: two X frames, the bars of each 3 cm apart so they never share a face, a bar between
  for (const z of [-0.1, 0.1]) for (const [s, dz] of [[1, -0.015], [-1, 0.015]] as const) {
    const b = g.box(0.035, 0.92, 0.025, INK, 0, 0.37, z + dz, 0.01); b.rotation.z = s * 0.95;
    for (const e of [-1, 1]) g.box(0.06, 0.03, 0.035, SLATE, e * 0.3, 0.015, z + dz, 0.01);
  }
  g.cyl(0.015, 0.24, STEEL, 0, 0.37, 0).rotation.x = Math.PI / 2;
  // the instrument: the body, the white keys, the black keys over them, the panel at the back
  g.box(w, 0.08, 0.36, SLATE, 0, 0.78, 0, 0.02);
  g.box(w - 0.14, 0.03, 0.15, CREAM, 0.03, 0.83, 0.09, 0.004);
  for (let i = 0; i < 25; i++) if (i % 7 !== 2 && i % 7 !== 6) g.box(0.016, 0.022, 0.09, INK, -0.37 + i * 0.033, 0.852, 0.06, 0.003);
  for (let i = 1; i < 26; i++) g.box(0.002, 0.031, 0.13, darker(CREAM, 0.85), -0.398 + i * 0.033, 0.832, 0.1, 0);
  g.box(0.05, 0.03, 0.12, INK, -w / 2 + 0.06, 0.83, 0.09, 0.01);
  for (const x of [-w / 2 + 0.045, -w / 2 + 0.075]) g.box(0.016, 0.03, 0.06, STEEL, x, 0.858, 0.09, 0.006);
  g.box(0.22, 0.07, 0.006, SCREEN, -0.24, 0.86, -0.05, 0.01, 0.4 + o.night * 0.6);
  g.box(0.16, 0.012, 0.008, SKY, -0.24, 0.87, -0.045, 0, 0.7 + o.night);
  g.box(0.24, 0.07, 0.12, darker(SLATE, 0.85), -0.24, 0.84, -0.1, 0.01);
  for (let i = 0; i < 8; i++) g.cyl(0.018, 0.03, [YELLOW, CREAM, TEAL, CREAM][i % 4] as string, -0.06 + (i % 4) * 0.06, 0.835, -0.12 + Math.floor(i / 4) * 0.07);
  for (let i = 0; i < 4; i++) g.box(0.05, 0.016, 0.05, [ORANGE, SKY, GREEN, VIOLET][i] as string, 0.24 + (i % 2) * 0.07, 0.828, -0.12 + Math.floor(i / 2) * 0.07, 0.008, 0.3 + o.night * 0.7);
  // the pedal on the floor, in front
  g.box(0.1, 0.03, 0.16, INK, 0.25, 0.015, 0.2, 0.01);
  return { w: 1.02, d: 0.48, h: 0.9, z: 0.048 };
};

/** a gramophone on a little round table: its crank, the record, the brass horn opening up and out */
const gramophone: Maker = (g) => {
  const BRASS = darker(YELLOW, 0.85);
  g.contact(0.56, 0.56);
  g.cyl(0.28, 0.04, WOOD_D, 0, 0.6, 0); for (let i = 0; i < 3; i++) { const a = (i * 2 * Math.PI) / 3 + 0.5; g.cyl(0.025, 0.58, WOOD_D, Math.cos(a) * 0.18, 0.29, Math.sin(a) * 0.18); }
  g.box(0.36, 0.16, 0.36, WOOD, 0, 0.7, 0, 0.02);
  g.box(0.3, 0.1, 0.01, WOOD_L, 0, 0.7, 0.196, 0.01);
  g.cyl(0.15, 0.015, STEEL, 0, 0.788, 0); g.cyl(0.14, 0.006, INK, 0, 0.798, 0); g.cyl(0.04, 0.004, YELLOW, 0, 0.803, 0);
  // the crank out of its side
  g.cyl(0.012, 0.08, STEEL, 0.215, 0.7, 0).rotation.z = Math.PI / 2; g.box(0.012, 0.08, 0.012, STEEL, 0.258, 0.67, 0, 0.004); g.ball(0.016, WOOD_D, 0.258, 0.62, 0);
  // the arm, the elbow and the horn
  g.cyl(0.02, 0.12, BRASS, 0.13, 0.84, -0.13);
  const neck = g.cyl(0.018, 0.2, BRASS, 0.07, 0.92, -0.08); neck.rotation.z = 0.9;
  const horn = g.at(0, 1.08, -0.04); horn.root.rotation.x = 0.75;
  horn.cone(0.24, 0.4, BRASS, 0, 0, 0).rotation.x = Math.PI;
  horn.cyl(0.255, 0.03, darker(BRASS, 0.85), 0, -0.2, 0);
  horn.cyl(0.21, 0.01, darker(BRASS, 0.55), 0, -0.22, 0);
  horn.cyl(0.03, 0.08, BRASS, 0, 0.2, 0);
  return { w: 0.56, d: 0.66, h: 1.4, z: -0.047 };
};

/** a cello standing on its spike, a wooden chair beside it, the bow on the seat */
const cello: Maker = (g) => {
  g.contact(0.92, 0.42, 0.18, 0);
  // the cello, leaning a little back: two bouts, the waist, f-holes, bridge, tailpiece, fingerboard, scroll
  g.cyl(0.035, 0.008, INK, -0.05, 0.004, 0.06);
  const c = g.at(-0.05, 0.1, 0.06); c.root.rotation.x = -0.12;
  c.cyl(0.008, 0.12, STEEL, 0, -0.04, 0);
  for (const [y, r, t] of [[0.26, 0.23, 0.16], [0.68, 0.19, 0.154]] as const) c.cyl(r, t, WOOD_D, 0, y, 0).rotation.x = Math.PI / 2;
  c.cyl(0.16, 0.148, darker(WOOD_D, 0.85), 0, 0.47, 0).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) { const f = c.box(0.012, 0.13, 0.006, INK, s * 0.08, 0.44, 0.081, 0.004); f.rotation.z = s * 0.12; }
  c.box(0.12, 0.05, 0.012, CREAM, 0, 0.42, 0.087, 0.004);
  c.box(0.07, 0.17, 0.014, INK, 0, 0.18, 0.084, 0.01);
  c.box(0.06, 0.62, 0.025, INK, 0, 0.88, 0.075, 0.01);
  c.box(0.045, 0.36, 0.04, WOOD_D, 0, 1.06, 0.03, 0.012);
  c.box(0.05, 0.12, 0.05, WOOD_D, 0, 1.28, 0.02, 0.015); c.ball(0.04, WOOD_D, 0, 1.36, 0.035);
  for (const s of [-1, 1]) c.ball(0.014, INK, s * 0.04, 1.27, 0.02);
  for (let i = 0; i < 4; i++) c.box(0.0025, 0.95, 0.003, STEEL, (i - 1.5) * 0.012, 0.73, 0.09, 0);
  // the chair: four legs, the seat, a slatted back, the bow across the seat
  for (const x of [0.25, 0.59]) for (const z of [-0.15, 0.15]) g.box(0.04, 0.46, 0.04, WOOD, x, 0.23, z, 0.01);
  g.box(0.42, 0.04, 0.4, WOOD_L, 0.42, 0.48, 0, 0.012);
  for (const x of [0.25, 0.59]) g.box(0.04, 0.42, 0.04, WOOD, x, 0.71, -0.18, 0.01);
  for (const y of [0.74, 0.86]) g.box(0.34, 0.06, 0.02, WOOD_L, 0.42, y, -0.18, 0.008);
  const bow = g.at(0.42, 0.512, 0.04); bow.root.rotation.y = 0.35;
  bow.box(0.66, 0.012, 0.012, WOOD_D, 0, 0, 0, 0.004); bow.box(0.62, 0.004, 0.004, CREAM, 0, -0.012, 0, 0); bow.box(0.05, 0.025, 0.02, INK, -0.3, -0.004, 0, 0.005);
  return { w: 1.02, d: 0.41, h: 1.5, x: 0.226 };
};

/** a little stage: a riser, the mic on its stand, a floor monitor, a spotlight on its pole, a cable coiled */
const mic: Maker = (g, o) => {
  const w = 1.2, d = 0.9;
  g.contact(w, d);
  g.box(w, 0.14, d, SLATE, 0, 0.07, 0, 0.02);
  g.box(w - 0.06, 0.02, d - 0.06, WOOD_D, 0, 0.15, 0, 0.006);
  for (let i = 1; i < 6; i++) g.box(0.006, 0.006, d - 0.08, darker(WOOD_D, 0.75), -w / 2 + 0.03 + i * 0.19, 0.162, 0, 0);
  // the mic stand: a round base, the pole, the mic tilted to the singer
  g.cyl(0.14, 0.02, INK, -0.05, 0.17, 0.05); g.cyl(0.012, 1.2, STEEL, -0.05, 0.78, 0.05);
  const m = g.at(-0.05, 1.42, 0.08); m.root.rotation.x = 0.45;
  m.cyl(0.02, 0.16, INK, 0, -0.04, 0); m.ball(0.045, STEEL, 0, 0.06, 0); m.cyl(0.03, 0.008, darker(STEEL, 0.7), 0, 0.03, 0);
  // the floor monitor: a wedge at the front edge, its cone up to the singer
  const mon = g.at(0.1, 0.3, 0.3); mon.root.rotation.x = -0.6;
  mon.box(0.42, 0.24, 0.24, INK, 0, 0, 0, 0.03);
  mon.cyl(0.07, 0.02, SLATE_L, -0.08, 0, 0.122).rotation.x = Math.PI / 2; mon.cyl(0.03, 0.02, SLATE_L, 0.12, 0, 0.122).rotation.x = Math.PI / 2;
  // the spotlight at the back right on its pole, its lens lit
  g.cyl(0.11, 0.02, INK, 0.44, 0.17, -0.3); g.cyl(0.015, 0.9, STEEL, 0.44, 0.62, -0.3);
  const sp = g.at(0.44, 1.1, -0.28); sp.root.rotation.x = 0.9; sp.root.rotation.z = 0.3;
  sp.cyl(0.08, 0.2, INK, 0, 0, 0); sp.cyl(0.065, 0.01, YELLOW, 0, -0.103, 0, 0.6 + o.night * 1.2);
  // the cable, coiled on the stage
  for (let i = 0; i < 3; i++) g.cyl(0.1 - i * 0.02, 0.012, INK, -0.38, 0.166 + i * 0.012, -0.22);
  return { w: 1.22, d: 0.94, h: 1.54, z: 0.012 };
};

/** a concert harp: its column, the curved neck, the sounding board leaning back, the strings, the pedals */
const harp: Maker = (g) => {
  const GOLD = darker(YELLOW, 0.85);
  g.contact(0.8, 0.5, 0.02, 0);
  // the base and its pedals
  g.box(0.42, 0.12, 0.42, WOOD_D, 0.12, 0.06, 0, 0.03);
  for (let i = 0; i < 7; i++) g.box(0.025, 0.015, 0.08, STEEL, -0.04 + i * 0.05, 0.03, 0.24, 0.005);
  // the column at the front, a crown on top
  g.cyl(0.04, 1.6, GOLD, 0.3, 0.92, 0); g.cyl(0.07, 0.1, GOLD, 0.3, 1.76, 0); g.ball(0.07, GOLD, 0.3, 1.85, 0);
  // the sounding board: from the base up and back, toward the player
  const sb = g.at(-0.08, 0.84, 0); sb.root.rotation.z = 0.42;
  sb.box(0.16, 1.5, 0.22, WOOD, 0, 0, 0, 0.04);
  sb.box(0.04, 1.42, 0.01, WOOD_L, 0.08, 0, 0, 0.004);
  // the neck: two curved pieces from the board's top to the column
  const n1 = g.box(0.32, 0.08, 0.06, WOOD_D, -0.25, 1.62, 0, 0.03); n1.rotation.z = -0.22;
  const n2 = g.box(0.36, 0.08, 0.06, WOOD_D, 0.1, 1.66, 0, 0.03); n2.rotation.z = 0.12;
  // the strings: from the board to the neck, cream, every seventh dark and every fourth blue (never a red)
  // the board's face toward the column: y = 0.873 - 2.238 (x + 0.007); the neck's underside above
  for (let i = 0; i < 18; i++) {
    const x = -0.3 + i * 0.032;
    const bot = Math.max(0.13, 0.873 - 2.238 * (x + 0.007) + 0.01);
    const top = x < -0.08 ? 1.6 - 0.223 * (x + 0.25) : 1.64 + 0.12 * (x - 0.1);
    const len = top - bot;
    if (len < 0.05) continue;
    g.cyl(0.004, len, i % 7 === 3 ? INK : i % 4 === 1 ? SKY : CREAM, x, bot + len / 2, 0);
  }
  return { w: 0.84, d: 0.51, h: 1.92, x: -0.05, z: 0.029 };
};

export const MUSIC = { piano, jukebox, turntable, guitar, drums, synth, gramophone, cello, mic, harp } satisfies Record<string, Maker>;

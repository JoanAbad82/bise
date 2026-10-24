// The objects of the animals family: bise's office cat on its round :* cushion, the cat out on a walk and its empty cushion, the dog by its square basket, an aquarium. Pets are never bims (one bim = one agent); here they only sit still (their life is p6).
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import { CREAM, darker, glyph, INK, LEAF, lighter, ORANGE, SKY, SLATE, STEEL, WOOD_D, YELLOW, type Maker, type Part } from './kit';

/** a cat that reads as a cat (Gabriel on v5): sitting up, pear body, round head, pointed ears, whiskers, the tail round its paws */
function catBody(g: Part, x: number, y: number, z: number, face: number): void {
  const c = g.at(x, y, z); c.root.rotation.y = face;
  const fur = '#4f6d7a', belly = '#e8eef1', pink = '#e9b48a';
  const body = c.ball(0.17, fur, 0, 0.17, 0); body.scale.set(0.95, 1.15, 0.9);
  const chest = c.ball(0.1, belly, 0, 0.2, 0.1); chest.scale.set(0.9, 1.3, 0.6);
  for (const dx of [-0.06, 0.06]) { c.box(0.05, 0.16, 0.05, fur, dx, 0.08, 0.12, 0.02); c.ball(0.032, belly, dx, 0.02, 0.14); }
  const head = c.ball(0.13, fur, 0, 0.42, 0.04); head.scale.set(1.08, 0.95, 1);
  const muzzle = c.ball(0.055, belly, 0, 0.39, 0.14); muzzle.scale.set(1.3, 0.8, 0.8);
  c.ball(0.016, pink, 0, 0.41, 0.18);
  for (const dx of [-0.08, 0.08]) {
    const ear = c.cone(0.055, 0.12, fur, dx, 0.54, 0.02); ear.rotation.z = -dx * 2.2;
    const inner = c.cone(0.03, 0.07, pink, dx * 0.95, 0.53, 0.04); inner.rotation.z = -dx * 2.2;
    c.ball(0.02, YELLOW, dx * 0.6, 0.45, 0.12, 0.2); c.ball(0.011, INK, dx * 0.6, 0.45, 0.135);
    for (const dy of [-0.012, 0.012]) { const w = c.box(0.12, 0.004, 0.004, CREAM, dx * 1.25, 0.39 + dy, 0.14, 0); w.rotation.z = dx > 0 ? dy * 8 : -dy * 8; }
  }
  // the tail curled round the front paws
  for (let i = 0; i < 9; i++) { const a = -2.6 + i * 0.42; c.ball(0.036, i > 6 ? darker(fur, 0.8) : fur, Math.cos(a) * 0.17, 0.03, Math.sin(a) * 0.17 + 0.02); }
}

/** bise's own: the office cat, sitting up on its round cushion with the mono :* */
const cat: Maker = (g, o) => {
  g.contact(0.8, 0.8);
  g.cyl(0.4, 0.12, YELLOW, 0, 0.06, 0); g.cyl(0.42, 0.035, darker(YELLOW, 0.82), 0, 0.025, 0); g.cyl(0.32, 0.03, lighter(YELLOW, 0.3), 0, 0.13, 0);
  if (!o.off) { const p = g.at(0.28, 0.065, 0.28); p.root.rotation.y = Math.PI / 4; glyph(p, 0, 0, 0.0, INK, 0.012); }
  catBody(g, 0, 0.14, 0, Math.PI / 4);
  return { w: 0.84, d: 0.84, h: 0.75 };
};

/** the cat out on a walk (it leaves its cushion now and then): four legs, its tail up */
const catwalk: Maker = (g) => {
  g.contact(0.5, 0.25);
  const fur = '#4f6d7a', belly = '#e8eef1', pink = '#e9b48a';
  const body = g.ball(0.15, fur, 0, 0.27, 0); body.scale.set(1.7, 0.8, 0.8);
  for (const [x, z] of [[-0.15, -0.06], [-0.15, 0.06], [0.15, -0.06], [0.15, 0.06]] as const) { g.box(0.05, 0.2, 0.05, fur, x, 0.11, z, 0.02); g.ball(0.032, belly, x + 0.01, 0.02, z); }
  const head = g.ball(0.12, fur, 0.3, 0.4, 0); head.scale.set(1, 0.95, 1.05);
  g.ball(0.05, belly, 0.39, 0.37, 0).scale.set(0.8, 0.8, 1.3);
  g.ball(0.015, pink, 0.43, 0.39, 0);
  for (const dz of [-0.075, 0.075]) {
    const ear = g.cone(0.05, 0.11, fur, 0.29, 0.52, dz); ear.rotation.x = dz * 2.4;
    g.ball(0.018, YELLOW, 0.4, 0.43, dz * 0.6, 0.2); g.ball(0.01, INK, 0.415, 0.43, dz * 0.6);
  }
  for (let i = 0; i < 12; i++) { const a = i / 11; g.ball(0.042 - a * 0.008, i > 9 ? darker(fur, 0.8) : fur, -0.24 - Math.sin(a * 2.2) * 0.1, 0.3 + a * 0.34, 0); }
  return { w: 0.83, d: 0.3, h: 0.72, x: 0.03 };
};

/** the cat's cushion, empty while it walks */
const cushion: Maker = (g, o) => {
  g.contact(0.8, 0.8);
  g.cyl(0.42, 0.14, YELLOW, 0, 0.07, 0); g.cyl(0.44, 0.04, darker(YELLOW, 0.82), 0, 0.03, 0); g.cyl(0.34, 0.03, lighter(YELLOW, 0.3), 0, 0.15, 0);
  if (!o.off) { const p = g.at(0.3, 0.075, 0.3); p.root.rotation.y = Math.PI / 4; glyph(p, 0, 0, 0.0, INK, 0.012); }
  return { w: 0.88, d: 0.88, h: 0.2 };
};

/** a dog that reads as a dog (Gabriel on v5): sitting by its basket, long snout, floppy ears, a collar, tail up */
const dog: Maker = (g) => {
  g.contact(1.1, 0.8);
  const wick = '#c8955a';
  const bk = g.at(-0.22, 0, 0);
  bk.box(0.7, 0.07, 0.62, darker(wick, 0.85), 0, 0.035, 0, 0.03);
  for (const [w, d, x, z] of [[0.7, 0.07, 0, -0.28], [0.07, 0.62, -0.32, 0]] as const) bk.box(w, 0.22, d, wick, x, 0.14, z, 0.03);
  bk.box(0.58, 0.05, 0.5, '#7fb3d5', 0.02, 0.09, 0.02, 0.025);
  const fur = '#d99a5b', dark = '#8a5530', light = '#f3e2c8';
  const d = g.at(0.25, 0, 0.12); d.root.rotation.y = 0.55;
  // haunches, chest, front legs straight
  const hip = d.ball(0.16, fur, -0.1, 0.16, 0); hip.scale.set(1.1, 0.95, 1);
  const chest = d.ball(0.14, fur, 0.04, 0.3, 0); chest.scale.set(0.9, 1.3, 0.9);
  d.ball(0.08, light, 0.12, 0.3, 0).scale.set(0.6, 1.4, 1);
  for (const dz of [-0.06, 0.06]) { d.box(0.06, 0.26, 0.06, fur, 0.1, 0.13, dz, 0.025); d.ball(0.04, light, 0.12, 0.02, dz); d.ball(0.05, fur, -0.05, 0.04, dz * 1.6).scale.set(1.6, 0.6, 1); }
  // head with a long snout, black nose, floppy ears
  const head = d.ball(0.12, fur, 0.1, 0.55, 0); head.scale.set(1.05, 1, 0.95);
  d.box(0.16, 0.09, 0.1, light, 0.21, 0.51, 0, 0.04);
  d.ball(0.028, INK, 0.29, 0.53, 0);
  d.box(0.04, 0.008, 0.05, INK, 0.27, 0.48, 0, 0.003);
  for (const dz of [-0.11, 0.11]) { const ear = d.box(0.08, 0.17, 0.035, dark, 0.07, 0.5, dz, 0.025); ear.rotation.x = dz * 2; }
  for (const dz of [-0.05, 0.05]) d.ball(0.016, INK, 0.19, 0.59, dz);
  // collar and its tag, the tail up
  const col = d.cyl(0.1, 0.035, SKY, 0.07, 0.43, 0); col.rotation.z = 0.5;
  d.ball(0.022, YELLOW, 0.15, 0.39, 0);
  const tail = d.box(0.04, 0.2, 0.04, fur, -0.26, 0.24, 0, 0.02); tail.rotation.z = 0.7;
  // its bowl and ball
  g.cyl(0.09, 0.06, SKY, 0.45, 0.03, -0.25); g.cyl(0.07, 0.02, '#c98f52', 0.45, 0.065, -0.25);
  g.ball(0.06, YELLOW, 0.5, 0.06, 0.3);
  return { w: 1.16, d: 0.8, h: 0.7, z: 0.03 };
};

/** an aquarium on its cabinet: water, two fish, weed, a castle, bubbles */
const aquarium: Maker = (g, o) => {
  const w = 1.1, d = 0.45;
  g.contact(w, d);
  g.box(w, 0.72, d, WOOD_D, 0, 0.36, 0, 0.03);
  for (const x of [-0.26, 0.26]) g.box(0.48, 0.5, 0.02, darker(WOOD_D, 0.82), x, 0.38, d / 2 + 0.005, 0.02);
  g.box(w, 0.04, d, SLATE, 0, 0.74, 0, 0.01);
  g.pane(w - 0.04, 0.52, d - 0.04, '#7cc8f0', 0.55, 0, 1.02, 0, 0.01, 0.15);
  g.box(w - 0.06, 0.05, d - 0.06, '#e8d3a8', 0, 0.785, 0, 0.01);
  for (const [x, h] of [[-0.4, 0.34], [-0.33, 0.24], [0.38, 0.3]] as const) g.box(0.04, h, 0.04, LEAF, x, 0.8 + h / 2, -0.05, 0.015);
  g.box(0.14, 0.16, 0.1, STEEL, 0.15, 0.89, -0.06, 0.01); g.box(0.06, 0.08, 0.06, STEEL, 0.15, 1.0, -0.06, 0.01);
  for (const [x, y, c, dir] of [[-0.1, 1.08, ORANGE, 1], [0.25, 1.15, YELLOW, -1]] as const) {
    const f = g.ball(0.05, c, x, y, 0.02, 0.1); f.scale.set(1.5, 1, 0.6);
    const t = g.box(0.05, 0.06, 0.02, c, x - dir * 0.09, y, 0.02, 0.01); t.rotation.z = 0.78;
  }
  for (let i = 0; i < 4; i++) g.ball(0.012 + i * 0.003, CREAM, -0.3 + (i % 2) * 0.02, 0.95 + i * 0.08, 0.05);
  g.box(w + 0.02, 0.05, d + 0.02, SLATE, 0, 1.3, 0, 0.015);
  g.box(0.3, 0.03, 0.15, YELLOW, -0.2, 1.33, 0, 0.01, 0.3 + o.night);
  return { w, d, h: 1.35 };
};

export const ANIMALS = { cat, catwalk, cushion, dog, aquarium } satisfies Record<string, Maker>;

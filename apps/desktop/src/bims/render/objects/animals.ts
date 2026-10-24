// The objects of the animals family: bise's office cat on its round :* cushion, the cat out on a walk and its empty cushion, the dog by its square basket, an aquarium, and the rest of page bims-plugins' collection table: a parrot on its perch, hens by their coop, a tortoise, a rabbit, a hamster in its cage, a goldfish bowl, ducks on a puddle. Pets are never bims (one bim = one agent); here they only sit still (their life is p6). No red: a hen's comb is amber.
// A rounded box's bevel stands 0.4 r out of its w and d and its top sits r/4 low (style.ts roundBox): what sits on one is placed past it.
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import { AMBER, CREAM, darker, glyph, INK, LEAF, LEAF_L, lighter, ORANGE, PANE, SKY, SLATE, SLATE_L, STEEL, TEAL, WOOD, WOOD_D, WOOD_L, YELLOW, type Maker, type Part } from './kit';

const STRAW = '#e8d3a8';
const WATER = '#7cc8f0';

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

/** a blue and yellow parrot on its perch stand: a base, a pole, the bar, a seed cup, its long tail down */
const parrot: Maker = (g) => {
  g.contact(0.7, 0.5);
  g.cyl(0.22, 0.05, SLATE, 0, 0.025, 0);
  g.box(0.05, 1.12, 0.05, WOOD, 0, 0.6, 0, 0.015);
  const bar = g.cyl(0.025, 0.62, WOOD_D, 0, 1.17, 0); bar.rotation.z = Math.PI / 2;
  g.cyl(0.06, 0.06, STEEL, 0.26, 1.22, 0);
  for (let i = 0; i < 4; i++) g.ball(0.015, i % 2 ? YELLOW : STRAW, 0.24 + (i % 2) * 0.03, 1.25, -0.02 + i * 0.012);
  const p = g.at(-0.08, 1.19, 0); p.root.rotation.y = 0.5;
  const body = p.ball(0.09, SKY, 0, 0.12, 0); body.scale.set(0.85, 1.3, 0.85);
  p.ball(0.065, YELLOW, 0, 0.1, 0.04).scale.set(0.9, 1.3, 0.6);
  for (const dx of [-0.07, 0.07]) { const w = p.box(0.03, 0.16, 0.1, darker(SKY, 0.8), dx, 0.13, -0.01, 0.015); w.rotation.z = -dx * 1.5; }
  const tail = p.box(0.05, 0.3, 0.02, darker(SKY, 0.85), 0, -0.08, -0.07, 0.01); tail.rotation.x = 0.25;
  p.ball(0.07, SKY, 0, 0.29, 0.01);
  p.ball(0.04, CREAM, 0, 0.29, 0.05).scale.set(1.3, 0.9, 0.6);
  const beak = p.cone(0.025, 0.06, INK, 0, 0.27, 0.085); beak.rotation.x = 2.2;
  for (const dx of [-0.035, 0.035]) p.ball(0.012, INK, dx, 0.31, 0.06);
  for (const dx of [-0.03, 0.03]) p.ball(0.018, SLATE_L, dx, 0.0, 0.02);
  return { w: 0.66, d: 0.46, h: 1.57 };
};

/** a hen: plump, a tail up, an amber comb and wattle, a yellow beak and legs */
function hen(g: Part, x: number, z: number, face: number, color: string, k: number): void {
  const h = g.at(x, 0, z); h.root.rotation.y = face; h.root.scale.setScalar(k);
  for (const dz of [-0.04, 0.04]) h.box(0.015, 0.1, 0.015, YELLOW, 0, 0.05, dz, 0);
  const body = h.ball(0.12, color, 0, 0.19, 0); body.scale.set(1.25, 0.95, 0.9);
  const tail = h.box(0.06, 0.14, 0.12, darker(color, 0.85), -0.15, 0.28, 0, 0.03); tail.rotation.z = 0.5;
  const wing = h.ball(0.07, darker(color, 0.92), -0.01, 0.2, 0.09); wing.scale.set(1.3, 0.8, 0.4);
  h.ball(0.07, color, 0.12, 0.33, 0);
  for (let i = 0; i < 3; i++) h.ball(0.022, AMBER, 0.09 + i * 0.025, 0.41 - Math.abs(i - 1) * 0.01, 0);
  h.ball(0.018, AMBER, 0.17, 0.27, 0);
  const beak = h.cone(0.02, 0.05, YELLOW, 0.2, 0.32, 0); beak.rotation.z = -Math.PI / 2;
  for (const dz of [-0.04, 0.04]) h.ball(0.011, INK, 0.16, 0.35, dz);
}

/** hens by their little coop: the coop, its ramp, two hens and a chick pecking grain */
const hens: Maker = (g) => {
  g.contact(1.2, 0.8);
  const c = g.at(-0.28, 0, -0.12);
  for (const x of [-0.22, 0.22]) for (const z of [-0.16, 0.16]) c.box(0.05, 0.3, 0.05, WOOD_D, x, 0.15, z, 0.015);
  c.box(0.56, 0.36, 0.42, WOOD_L, 0, 0.48, 0, 0.03);
  c.box(0.12, 0.16, 0.02, INK, 0.08, 0.4, 0.225, 0);
  for (const s of [-1, 1]) { const r = c.box(0.66, 0.04, 0.3, AMBER, 0, 0.75, s * 0.12, 0.01); r.rotation.x = s * 0.5; }
  c.box(0.68, 0.05, 0.05, darker(AMBER, 0.8), 0, 0.82, 0, 0.015);
  const ramp = c.box(0.12, 0.02, 0.36, WOOD, 0.08, 0.17, 0.38, 0); ramp.rotation.x = 0.75;
  hen(g, 0.28, 0.12, -0.4, CREAM, 1);
  hen(g, -0.12, 0.25, 0.5, '#c8955a', 0.95);
  const ck = g.at(0.42, 0, 0.3); ck.root.rotation.y = 2.4;
  ck.ball(0.045, YELLOW, 0, 0.05, 0).scale.set(1.2, 1, 1); ck.ball(0.03, YELLOW, 0.04, 0.1, 0);
  const cb = ck.cone(0.01, 0.025, ORANGE, 0.075, 0.1, 0); cb.rotation.z = -Math.PI / 2;
  for (let i = 0; i < 7; i++) g.ball(0.012, STRAW, 0.08 + (i % 4) * 0.05, 0.012, 0.28 + Math.floor(i / 4) * 0.05);
  return { w: 1.28, d: 0.84, h: 0.86 };
};

/** a tortoise on a patch of straw: a domed shell with its plates, head out towards a lettuce leaf */
const tortoise: Maker = (g) => {
  g.contact(0.8, 0.55);
  g.box(0.74, 0.02, 0.5, STRAW, 0, 0.01, 0, 0);
  const t = g.at(-0.04, 0, 0); t.root.rotation.y = 0.25;
  for (const [x, z] of [[-0.12, -0.12], [-0.12, 0.12], [0.12, -0.12], [0.12, 0.12]] as const) t.cyl(0.04, 0.08, '#b8b07a', x, 0.06, z);
  const shell = t.ball(0.2, '#8a9a4a', 0, 0.12, 0); shell.scale.set(1.15, 0.65, 0.95);
  for (const [x, z, y] of [[0, 0, 0.25], [-0.11, 0, 0.22], [0.11, 0, 0.22], [0, -0.1, 0.22], [0, 0.1, 0.22]] as const) t.ball(0.05, '#a9b366', x, y, z).scale.set(1, 0.35, 1);
  t.box(0.48, 0.03, 0.4, darker('#8a9a4a', 0.8), 0, 0.08, 0, 0.012);
  t.ball(0.06, '#b8b07a', 0.29, 0.12, 0).scale.set(1.2, 0.9, 0.9);
  for (const dz of [-0.03, 0.03]) t.ball(0.01, INK, 0.33, 0.145, dz);
  const tl = t.cone(0.02, 0.06, '#b8b07a', -0.27, 0.06, 0); tl.rotation.z = Math.PI / 2;
  const leaf = g.ball(0.07, LEAF_L, 0.28, 0.03, 0.15); leaf.scale.set(1.2, 0.25, 0.9);
  return { w: 0.78, d: 0.54, h: 0.32 };
};

/** a rabbit sitting up on its straw mat: long ears, a cream tail, a carrot by its paws */
const rabbit: Maker = (g) => {
  g.contact(0.62, 0.5);
  g.box(0.6, 0.02, 0.46, STRAW, 0, 0.01, 0, 0);
  const fur = '#d8cfc4', inner = '#e9b48a';
  const r = g.at(-0.05, 0, -0.02); r.root.rotation.y = 0.4;
  const body = r.ball(0.14, fur, -0.03, 0.15, 0); body.scale.set(1.15, 1.05, 0.95);
  r.ball(0.05, CREAM, -0.18, 0.12, 0);
  for (const dz of [-0.06, 0.06]) { const h = r.ball(0.06, fur, -0.06, 0.06, dz * 1.5); h.scale.set(1.8, 0.6, 0.8); r.ball(0.03, fur, 0.1, 0.03, dz); }
  r.ball(0.09, fur, 0.1, 0.3, 0);
  r.ball(0.04, CREAM, 0.17, 0.28, 0).scale.set(0.8, 0.7, 1.2);
  r.ball(0.012, '#9a6a4a', 0.195, 0.3, 0);
  for (const dz of [-0.04, 0.04]) {
    r.ball(0.014, INK, 0.16, 0.33, dz);
    const ear = r.box(0.04, 0.2, 0.07, fur, 0.06, 0.47, dz * 1.2, 0.02); ear.rotation.x = dz * 3; ear.rotation.z = 0.25;
    const ein = r.box(0.01, 0.14, 0.04, inner, 0.096, 0.46, dz * 1.2, 0); ein.rotation.x = dz * 3; ein.rotation.z = 0.25;
  }
  const carrot = g.cone(0.025, 0.14, ORANGE, 0.18, 0.025, 0.14); carrot.rotation.z = -Math.PI / 2; carrot.rotation.y = 0.4;
  for (const r2 of [-0.4, 0, 0.4]) { const l = g.box(0.06, 0.008, 0.012, LEAF, 0.06, 0.03, 0.19 + r2 * 0.05, 0); l.rotation.y = r2 + 0.4; }
  return { w: 0.62, d: 0.48, h: 0.6 };
};

/** a hamster in its cage on a little table: the tray, the bars, the wheel, its house, a water bottle */
const hamster: Maker = (g) => {
  g.contact(0.8, 0.5);
  for (const x of [-0.32, 0.32]) for (const z of [-0.18, 0.18]) g.box(0.05, 0.4, 0.05, WOOD_D, x, 0.2, z, 0.015);
  g.box(0.78, 0.05, 0.48, WOOD, 0, 0.425, 0, 0.01);
  g.box(0.7, 0.1, 0.4, SKY, 0, 0.5, 0, 0.02);
  g.box(0.64, 0.02, 0.34, STRAW, 0, 0.55, 0, 0);
  // the bars, the roof
  for (let i = 0; i <= 10; i++) { const x = -0.33 + i * 0.066; for (const z of [-0.19, 0.19]) g.box(0.01, 0.36, 0.01, STEEL, x, 0.72, z, 0); }
  for (let i = 1; i < 6; i++) { const z = -0.19 + i * 0.063; for (const x of [-0.33, 0.33]) g.box(0.01, 0.36, 0.01, STEEL, x, 0.72, z, 0); }
  g.box(0.7, 0.03, 0.4, darker(SKY, 0.85), 0, 0.915, 0, 0.01);
  // the wheel on its stand
  const w = g.at(-0.14, 0.72, -0.02);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const s = w.box(0.05, 0.02, 0.06, YELLOW, Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0, 0); s.rotation.z = a + Math.PI / 2; }
  w.cyl(0.02, 0.07, SLATE, 0, 0, -0.01).rotation.x = Math.PI / 2;
  w.box(0.03, 0.17, 0.02, SLATE, 0, -0.085, -0.05, 0);
  // the hamster by its little house, the bottle on the bars
  const hm = g.at(0.12, 0.56, 0.08); hm.root.rotation.y = 0.6;
  hm.ball(0.06, ORANGE, 0, 0.05, 0).scale.set(1.3, 0.9, 1);
  hm.ball(0.04, CREAM, 0.05, 0.04, 0).scale.set(1, 0.9, 1.1);
  for (const dz of [-0.03, 0.03]) { hm.ball(0.015, ORANGE, 0.04, 0.1, dz); hm.ball(0.008, INK, 0.09, 0.07, dz * 0.6); }
  g.box(0.16, 0.1, 0.12, TEAL, 0.22, 0.61, -0.08, 0.03);
  g.box(0.06, 0.06, 0.02, INK, 0.22, 0.595, -0.008, 0);
  g.pane(0.04, 0.14, 0.04, WATER, 0.6, 0.3, 0.76, 0.21, 0.015);
  g.box(0.01, 0.06, 0.01, STEEL, 0.3, 0.66, 0.21, 0);
  return { w: 0.82, d: 0.5, h: 0.94 };
};

/** a goldfish bowl on a little round table: water, gravel, a weed, the goldfish */
const goldfish: Maker = (g) => {
  g.contact(0.5, 0.5);
  for (const [x, z] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]] as const) g.box(0.04, 0.6, 0.04, WOOD_D, x, 0.3, z, 0.012);
  g.cyl(0.24, 0.04, WOOD, 0, 0.62, 0);
  g.cyl(0.11, 0.03, CREAM, 0, 0.655, 0);
  g.pane(0.36, 0.34, 0.36, PANE, 0.3, 0, 0.84, 0, 0.17);
  g.box(0.3, 0.22, 0.3, WATER, 0, 0.8, 0, 0.12);
  for (let i = 0; i < 6; i++) g.ball(0.025, i % 2 ? STRAW : lighter(SKY, 0.4), -0.07 + (i % 3) * 0.07, 0.69, -0.04 + Math.floor(i / 3) * 0.08);
  for (const [dx, h] of [[-0.08, 0.16], [-0.05, 0.12]] as const) g.box(0.015, h, 0.015, LEAF, dx, 0.7 + h / 2, -0.06, 0);
  const f = g.at(0.03, 0.84, 0.05); f.root.rotation.y = 0.3;
  f.ball(0.04, ORANGE, 0, 0, 0).scale.set(1.5, 1, 0.7);
  const t = f.box(0.05, 0.06, 0.012, AMBER, -0.07, 0, 0, 0); t.rotation.z = 0.78;
  f.ball(0.008, INK, 0.04, 0.01, 0.022);
  return { w: 0.5, d: 0.5, h: 1.01 };
};

/** a duck and her three ducklings in a line by a puddle */
const ducks: Maker = (g) => {
  g.contact(1.1, 0.7);
  g.pane(0.5, 0.03, 0.4, WATER, 0.75, -0.25, 0.015, -0.05, 0.015);
  const duck = (x: number, z: number, face: number, k: number, c: string, bill: string): void => {
    const d = g.at(x, 0, z); d.root.rotation.y = face; d.root.scale.setScalar(k);
    for (const dz of [-0.035, 0.035]) d.box(0.06, 0.012, 0.04, bill, 0.02, 0.006, dz, 0);
    d.box(0.012, 0.07, 0.012, bill, 0, 0.045, 0, 0);
    const body = d.ball(0.11, c, 0, 0.15, 0); body.scale.set(1.35, 0.85, 0.9);
    const tail = d.cone(0.04, 0.08, c, -0.15, 0.2, 0); tail.rotation.z = 0.9;
    d.ball(0.065, c, 0.11, 0.28, 0);
    const b = d.box(0.07, 0.025, 0.05, bill, 0.18, 0.27, 0, 0.01); b.rotation.z = -0.1;
    for (const dz of [-0.035, 0.035]) d.ball(0.011, INK, 0.15, 0.3, dz);
    const w = d.ball(0.06, darker(c, 0.92), -0.01, 0.16, 0.07); w.scale.set(1.5, 0.7, 0.4);
  };
  duck(0.25, 0.02, -0.15, 1, CREAM, ORANGE);
  for (const [i, z] of [[0, 0.16], [1, 0.22], [2, 0.18]] as const) duck(-0.02 - i * 0.15, z, -0.2, 0.5, YELLOW, AMBER);
  return { w: 1.1, d: 0.66, h: 0.36 };
};

export const ANIMALS = { cat, catwalk, cushion, dog, aquarium, parrot, hens, tortoise, rabbit, hamster, goldfish, ducks } satisfies Record<string, Maker>;

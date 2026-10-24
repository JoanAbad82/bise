// The objects of the garden family: the potted plant (any plugin with no object of its own: its pot is its kind's colour, n 1 amber, 2 sky, 3 violet, else teal) and the campfire (outdoor).
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import { AMBER, darker, LEAF, LEAF_L, SKY, TEAL, VIOLET, WOOD, WOOD_D, WOOD_L, YELLOW, type Maker } from './kit';

/** a potted plant whose pot is its kind's colour: a plugin with no object of its own */
const plant: Maker = (g, o) => {
  const pot = o.n === 1 ? AMBER : o.n === 2 ? SKY : o.n === 3 ? VIOLET : TEAL;
  g.contact(0.42, 0.42);
  g.cyl(0.18, 0.32, pot, 0, 0.16, 0);
  g.cyl(0.21, 0.07, darker(pot, 0.85), 0, 0.33, 0);
  g.cyl(0.17, 0.02, '#6a4a2f', 0, 0.36, 0);
  for (const [a, h, l] of [[0, 0.75, 0.42], [1.3, 0.65, 0.36], [2.5, 0.8, 0.4], [3.7, 0.6, 0.34], [4.9, 0.72, 0.38]] as const) {
    const leaf = g.at(0, 0.36, 0); leaf.root.rotation.y = a;
    const stem = leaf.box(0.025, h, 0.025, '#4a7a35', 0, h / 2, 0.05, 0.01); stem.rotation.x = 0.18;
    const blade = leaf.ball(l / 2, a % 2.4 < 1.2 ? LEAF : LEAF_L, 0, h + 0.02, 0.18); blade.scale.set(0.55, 0.22, 1); blade.rotation.x = 0.5;
  }
  g.ball(0.15, LEAF_L, 0, 1.12, 0).scale.set(0.8, 1.2, 0.8);
  // its leaves reach out of the pot
  return { w: 0.76, d: 0.76, h: 1.32 };
};

/** a campfire (outdoor): a stone ring, logs, a flame that glows at night, two log seats */
const campfire: Maker = (g, o) => {
  g.contact(1.6, 1.0);
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; g.ball(0.07, i % 2 ? '#9aa7b2' : '#c9c2b6', Math.cos(a) * 0.3, 0.05, Math.sin(a) * 0.3).scale.set(1.2, 0.7, 1); }
  for (const r of [0.3, 1.2, 2.2]) { const l = g.box(0.38, 0.08, 0.08, WOOD_D, 0, 0.12, 0, 0.03); l.rotation.set(0, r, 0.35); }
  const f = g.ball(0.13, YELLOW, 0, 0.26, 0, 0.6 + o.night * 1.2); f.scale.set(1, 1.5, 1);
  const f2 = g.ball(0.08, AMBER, 0.03, 0.4, 0.02, 0.6 + o.night * 1.2); f2.scale.set(1, 1.6, 1);
  for (const x of [-0.75, 0.75]) { const lg = g.cyl(0.13, 0.7, WOOD, x, 0.13, 0); lg.rotation.x = Math.PI / 2; g.cyl(0.11, 0.02, WOOD_L, x, 0.13, 0.355).rotation.x = Math.PI / 2; }
  return { w: 1.76, d: 0.8, h: 0.6 };
};

export const GARDEN = { plant, campfire } satisfies Record<string, Maker>;

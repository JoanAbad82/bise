// The objects of the travel family: Kit's scooter (the newsletter's delivery) and a city bike, and the rest of
// the collection (page bims-plugins): a basketball hoop, a surfboard on its stand, a kayak on trestles, a tethered
// balloon, a rocket on its pad, a retro car, a yoga mat, a trampoline.
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import type { Mesh } from 'three';
import { AMBER, CREAM, darker, GREEN, INK, LEAF, LEAF_L, lighter, ORANGE, PANE, PAPER, type Part, SKY, SLATE, SLATE_L, STEEL, TEAL, VIOLET, WOOD, WOOD_D, WOOD_L, YELLOW, type Maker } from './kit';

/** a leather seat: a dark brown, never the reddish one (#7a4a30 read as the error red, objects.test.ts) */
const SADDLE = '#6a4a2f';

/** a scooter (Kit, the newsletter's delivery): mirrors, headlight, seat, a crate of letters strapped on */
const scooter: Maker = (g, o) => {
  const col = SKY, trim = CREAM;
  g.contact(1.25, 0.45);
  for (const x of [-0.42, 0.44]) {
    const wh = g.cyl(0.18, 0.12, INK, x, 0.18, 0); wh.rotation.x = Math.PI / 2;
    const hub = g.cyl(0.08, 0.13, STEEL, x, 0.18, 0); hub.rotation.x = Math.PI / 2;
  }
  g.box(0.66, 0.12, 0.32, col, -0.02, 0.32, 0, 0.05);
  g.box(0.5, 0.06, 0.3, darker(col, 0.75), -0.02, 0.4, 0, 0.02);
  // the back body, round, with a cream side stripe
  const back = g.ball(0.26, col, -0.32, 0.5, 0); back.scale.set(1.15, 0.85, 0.75);
  g.box(0.32, 0.04, 0.005, trim, -0.34, 0.5, 0.2, 0.01);
  g.box(0.46, 0.09, 0.28, SADDLE, -0.3, 0.74, 0, 0.045);
  // the front shield and the fender
  const leg = g.box(0.12, 0.64, 0.34, col, 0.34, 0.58, 0, 0.055); leg.rotation.z = -0.2;
  const fender = g.ball(0.2, col, 0.45, 0.32, 0); fender.scale.set(1.0, 0.5, 0.55);
  // the steering column, handlebar, grips, mirrors, headlight
  g.box(0.07, 0.34, 0.07, STEEL, 0.45, 0.98, 0, 0.025);
  g.box(0.12, 0.1, 0.22, col, 0.47, 1.12, 0, 0.04);
  g.box(0.05, 0.05, 0.62, STEEL, 0.46, 1.16, 0, 0.02);
  for (const z of [-0.31, 0.31]) { g.box(0.06, 0.06, 0.08, INK, 0.46, 1.16, z, 0.02); g.box(0.015, 0.14, 0.015, STEEL, 0.44, 1.25, z * 0.8, 0.005); const mir = g.cyl(0.055, 0.02, STEEL, 0.44, 1.33, z * 0.8); mir.rotation.z = Math.PI / 2; }
  const lamp = g.cyl(0.07, 0.05, CREAM, 0.54, 1.12, 0, 0.3 + o.night); lamp.rotation.z = Math.PI / 2;
  // the tail light (amber, never red) and the kickstand
  g.box(0.03, 0.04, 0.1, AMBER, -0.6, 0.6, 0, 0.01, 0.4 + o.night);
  const ks = g.box(0.02, 0.16, 0.02, STEEL, -0.05, 0.1, 0.12, 0.005); ks.rotation.x = 0.4;
  // the crate of newsletters on its rack, a strap over it
  g.box(0.34, 0.03, 0.32, STEEL, -0.48, 0.82, 0, 0.01);
  g.box(0.3, 0.22, 0.3, WOOD, -0.48, 0.95, 0, 0.03);
  for (let i = 0; i < 4; i++) { const l = g.box(0.22, 0.012, 0.16, i % 2 ? CREAM : PAPER, -0.5 + i * 0.01, 1.07 + i * 0.012, 0.02, 0.003); l.rotation.y = i * 0.2; }
  g.box(0.32, 0.02, 0.04, ORANGE, -0.48, 1.07, 0, 0.005);
  g.box(0.12, 0.08, 0.005, CREAM, -0.48, 0.95, 0.153, 0.01);
  return { w: 1.31, d: 0.72, h: 1.4 };
};

/** a city bike on its stand: a basket in front, a bell */
const bike: Maker = (g) => {
  g.contact(1.4, 0.3);
  for (const x of [-0.5, 0.5]) { const wh = g.cyl(0.3, 0.04, INK, x, 0.32, 0); wh.rotation.x = Math.PI / 2; const in2 = g.cyl(0.25, 0.045, CREAM, x, 0.32, 0); in2.rotation.x = Math.PI / 2; const hub = g.cyl(0.04, 0.06, STEEL, x, 0.32, 0); hub.rotation.x = Math.PI / 2; }
  const col = GREEN;
  const t1 = g.box(0.62, 0.05, 0.05, col, 0.0, 0.62, 0, 0.02); t1.rotation.z = -0.1;
  const t2 = g.box(0.6, 0.05, 0.05, col, -0.08, 0.45, 0, 0.02); t2.rotation.z = 0.55;
  const t3 = g.box(0.05, 0.42, 0.05, col, -0.2, 0.55, 0, 0.02); t3.rotation.z = 0.25;
  const t4 = g.box(0.05, 0.4, 0.05, col, 0.42, 0.5, 0, 0.02); t4.rotation.z = -0.3;
  g.box(0.24, 0.06, 0.12, SADDLE, -0.27, 0.8, 0, 0.03);
  g.box(0.05, 0.05, 0.5, STEEL, 0.36, 0.85, 0, 0.02);
  g.box(0.28, 0.18, 0.3, WOOD_L, 0.52, 0.82, 0, 0.03); for (let i = 0; i < 3; i++) g.ball(0.06, [ORANGE, GREEN, YELLOW][i] as string, 0.48 + i * 0.05, 0.94, -0.06 + i * 0.06);
  g.ball(0.03, YELLOW, 0.33, 0.9, 0.18);
  return { w: 1.6, d: 0.52, h: 1.0 };
};

type V3 = readonly [number, number, number];

/** a round bar from a to b (a rope, a strut, a net's cord), laid along its length */
function rod(g: Part, r: number, color: string, a: V3, b: V3): Mesh {
  const [dx, dy, dz] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const m = g.box(r * 2, r * 2, Math.hypot(dx, dy, dz), color, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, r * 0.9);
  m.rotation.set(-Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(dx, dz), 0, 'YXZ');
  return m;
}

/** a rounded box's faces stand 0.4 r out of its nominal sides (style.ts's bevel): a detail on a face stands this far out */
const out = (r: number): number => r * 0.4 + 0.004;

/** a basketball hoop (a sports or a scores plugin): on its weighted base, the backboard and its square, the orange rim, a net, a ball */
const hoop: Maker = (g) => {
  g.contact(0.62, 0.82, 0, -0.2);
  g.box(0.6, 0.22, 0.8, SLATE, 0, 0.11, -0.2, 0.04);
  for (const x of [-0.22, 0.22]) g.cyl(0.06, 0.05, INK, x, 0.06, -0.62).rotation.z = Math.PI / 2;
  g.box(0.1, 1.96, 0.1, STEEL, 0, 1.2, -0.5, 0.03);
  g.box(0.08, 0.08, 0.36, STEEL, 0, 1.86, -0.31, 0.02);
  // the backboard, its border and square
  g.box(0.9, 0.58, 0.04, CREAM, 0, 1.9, -0.11, 0.015);
  const f = -0.09 + out(0.015);
  for (const [w, h, x, y] of [[0.86, 0.025, 0, 2.17], [0.86, 0.025, 0, 1.63], [0.025, 0.52, -0.43, 1.9], [0.025, 0.52, 0.43, 1.9], [0.28, 0.02, 0, 1.86], [0.28, 0.02, 0, 1.68], [0.02, 0.16, -0.13, 1.77], [0.02, 0.16, 0.13, 1.77]] as const) g.box(w, h, 0.008, ORANGE, x, y, f + 0.004, 0);
  // the rim on its bracket, the net hanging from it
  const rz = 0.12, ry = 1.66, R = 0.17;
  g.box(0.1, 0.06, 0.1, ORANGE, 0, ry, f + 0.05, 0.01);
  for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; g.ball(0.014, ORANGE, Math.cos(a) * R, ry, rz + Math.sin(a) * R); }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, b = a + 0.3;
    rod(g, 0.005, CREAM, [Math.cos(a) * R, ry - 0.015, rz + Math.sin(a) * R], [Math.cos(b) * 0.11, ry - 0.26, rz + Math.sin(b) * 0.11]);
  }
  // the ball on the floor
  const ball = g.at(0.2, 0.12, 0.08);
  ball.ball(0.12, ORANGE, 0, 0, 0);
  ball.cyl(0.123, 0.008, INK, 0, 0, 0).rotation.x = Math.PI / 2;
  ball.cyl(0.123, 0.008, INK, 0, 0, 0).rotation.z = Math.PI / 2;
  return { w: 0.93, d: 1.0, h: 2.2, z: -0.19 };
};

/** a surfboard (a weather or a waves plugin): upright in its wooden stand, a teal stringer, its fin; a towel and a bar of wax */
const surf: Maker = (g) => {
  g.contact(0.62, 0.42);
  g.box(0.6, 0.06, 0.4, WOOD_D, 0, 0.03, 0, 0.02);
  for (const x of [-0.24, 0.24]) { g.box(0.05, 0.44, 0.08, WOOD, x, 0.27, 0, 0.015); g.box(0.07, 0.08, 0.1, ORANGE, x, 0.46, 0, 0.03); }
  // the board, its stringer, its fin
  const b = g.at(0, 0.92, 0); b.root.rotation.z = 0.04;
  b.ball(0.85, YELLOW, 0, 0, 0).scale.set(0.3, 1, 0.05);
  b.ball(0.85, TEAL, 0, 0, 0).scale.set(0.05, 1.001, 0.052);
  b.box(0.012, 0.12, 0.1, SLATE, 0, -0.62, -0.08, 0.005);
  // a towel folded on the base, the wax
  g.box(0.16, 0.05, 0.14, SKY, -0.18, 0.085, 0.11, 0.02);
  g.box(0.16, 0.012, 0.14, CREAM, -0.18, 0.115, 0.11, 0.004);
  g.box(0.07, 0.03, 0.05, CREAM, 0.18, 0.075, 0.12, 0.01);
  return { w: 0.63, d: 0.43, h: 1.79 };
};

/** a kayak (a trip, a maps plugin): on two trestles, its cockpit and seat, the deck lines, the paddle across */
const kayak: Maker = (g) => {
  g.contact(1.8, 0.6);
  for (const x of [-0.5, 0.5]) {
    g.box(0.08, 0.05, 0.56, WOOD, x, 0.45, 0, 0.015);
    for (const s of [-1, 1]) for (const z of [-0.22, 0.22]) rod(g, 0.018, WOOD_D, [x + s * 0.12, 0.0, z], [x, 0.43, z]);
  }
  // the hull, its cockpit coaming and the seat back, the deck lines
  g.ball(0.95, ORANGE, 0, 0.61, 0).scale.set(1, 0.17, 0.26);
  g.ball(0.22, SLATE, -0.05, 0.75, 0).scale.set(1.6, 0.25, 1);
  g.ball(0.19, INK, -0.05, 0.757, 0).scale.set(1.6, 0.3, 1);
  g.box(0.04, 0.1, 0.18, SLATE_L, -0.25, 0.78, 0, 0.02);
  for (const x of [0.4, 0.55]) for (const s of [-1, 1]) { const c = g.box(0.01, 0.01, 0.2, INK, x, 0.745, 0, 0); c.rotation.y = s * 0.5; c.position.y = 0.745 + (s > 0 ? 0.004 : 0); }
  // the paddle laid across the cockpit
  const p = g.at(-0.05, 0.8, 0.0); p.root.rotation.y = 0.5;
  p.cyl(0.015, 1.3, STEEL, 0, 0, 0).rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) { const bl = p.box(0.22, 0.012, 0.11, YELLOW, s * 0.72, 0, 0, 0.005); bl.rotation.x = s * 0.4; }
  return { w: 1.91, d: 0.9, h: 0.84 };
};

/** a tethered balloon (a trip plugin, a view from above): its striped envelope, the basket and burner, roped down to four pegs */
const balloon: Maker = (g, o) => {
  g.contact(0.9, 0.9);
  for (const [x, z] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]] as const) {
    g.cyl(0.025, 0.08, WOOD_D, x, 0.04, z);
    rod(g, 0.006, WOOD_L, [x, 0.07, z], [x * 0.45, 0.84, z * 0.45]);
  }
  // the basket, its rim, the frame and burner
  g.box(0.4, 0.32, 0.4, WOOD, 0, 0.7, 0, 0.03);
  g.box(0.42, 0.05, 0.42, WOOD_D, 0, 0.845, 0, 0.02);
  for (const [x, z] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]] as const) rod(g, 0.008, STEEL, [x, 0.86, z], [x * 0.35, 1.06, z * 0.35]);
  g.box(0.14, 0.08, 0.14, STEEL, 0, 1.08, 0, 0.02);
  g.ball(0.03, AMBER, 0, 1.13, 0, 0.6 + o.night);
  // the envelope: twelve gores in two colours, its skirt, its crown
  const cy = 1.62, R = 0.48;
  for (let k = 0; k < 6; k++) { const e = g.ball(R, k % 2 ? SKY : YELLOW, 0, cy, 0); e.scale.set(0.3, 1.12, 1); e.rotation.y = (k * Math.PI) / 6; }
  const skirt = g.cone(0.3, 0.42, TEAL, 0, cy - 0.5, 0); skirt.rotation.x = Math.PI;
  g.cyl(0.09, 0.04, TEAL, 0, 1.17, 0);
  g.ball(0.1, CREAM, 0, cy + R * 1.12 - 0.04, 0).scale.set(1, 0.5, 1);
  for (const [x, z] of [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]] as const) rod(g, 0.005, WOOD_D, [x, cy - 0.32, z], [x * 0.7, 0.87, z * 0.7]);
  return { w: 0.99, d: 0.99, h: 2.18 };
};

/** a rocket on its pad (a deploy, a launch plugin): cream body, orange nose and fins, two portholes, the gantry tower with its arm */
const rocket: Maker = (g, o) => {
  g.contact(0.92, 0.92);
  g.box(0.9, 0.12, 0.9, SLATE, 0, 0.06, 0, 0.03);
  const top = 0.12 - 0.03 / 4;
  for (const [w, d, x, z] of [[0.84, 0.03, 0, 0.42], [0.84, 0.03, 0, -0.42], [0.03, 0.78, 0.42, 0], [0.03, 0.78, -0.42, 0]] as const) g.box(w, 0.01, d, YELLOW, x, top + 0.006, z, 0);
  // the rocket: nozzle, body and bands, nose, fins, portholes
  const X = -0.12;
  const nz = g.cone(0.12, 0.2, STEEL, X, top + 0.1, 0);
  nz.position.y = top + 0.1;
  g.cyl(0.16, 1.1, CREAM, X, 0.85, 0);
  for (const [y, c] of [[0.55, VIOLET], [1.25, SKY]] as const) g.cyl(0.166, 0.05, c, X, y, 0);
  g.cone(0.16, 0.4, ORANGE, X, 1.6, 0);
  for (let i = 0; i < 3; i++) { const fin = g.at(X, 0, 0); fin.root.rotation.y = (i * 2 * Math.PI) / 3 + 0.5; fin.box(0.03, 0.42, 0.18, ORANGE, 0, top + 0.21, 0.22, 0.012); }
  for (const y of [1.0, 1.15]) {
    const w = g.at(X, y, 0); w.root.rotation.y = 0.5;
    w.cyl(0.055, 0.012, STEEL, 0, 0, 0.164).rotation.x = Math.PI / 2;
    w.cyl(0.042, 0.012, SKY, 0, 0, 0.17, 0.3 + o.night * 0.6).rotation.x = Math.PI / 2;
  }
  // the gantry: two posts, rungs, the arm to the rocket, a lamp on top
  const T = 0.3;
  for (const z of [-0.1, 0.1]) g.box(0.04, 1.6, 0.04, STEEL, T, top + 0.8, z, 0.01);
  for (let i = 0; i < 7; i++) g.box(0.03, 0.025, 0.2, STEEL, T, 0.3 + i * 0.2, 0, 0.008);
  g.box(0.22, 0.04, 0.06, STEEL, T - 0.13, 1.3, 0, 0.012);
  g.ball(0.03, AMBER, T, top + 1.63, 0, 0.5 + o.night);
  return { w: 0.94, d: 0.94, h: 1.81 };
};

/** a retro car (a travel, a ride plugin): rounded mint body, fenders over its wheels, round headlights, a suitcase on the roof rack */
const car: Maker = (g, o) => {
  const C = lighter(TEAL, 0.35);
  g.contact(1.8, 0.86);
  for (const x of [-0.58, 0.58]) for (const z of [-0.33, 0.33]) {
    g.cyl(0.18, 0.12, INK, x, 0.18, z).rotation.x = Math.PI / 2;
    g.cyl(0.08, 0.13, CREAM, x, 0.18, z).rotation.x = Math.PI / 2;
  }
  g.box(1.7, 0.3, 0.74, C, 0, 0.38, 0, 0.12);
  for (const x of [-0.58, 0.58]) for (const z of [-0.31, 0.31]) g.ball(0.22, C, x, 0.38, z).scale.set(1.15, 0.8, 0.5);
  // the cabin and its windows
  g.box(0.95, 0.36, 0.7, C, -0.08, 0.7, 0, 0.16);
  const s = 0.35 + out(0.16);
  for (const x of [-0.3, 0.12]) for (const z of [-1, 1]) g.pane(0.32, 0.2, 0.01, PANE, 0.75, x, 0.74, z * (s + 0.005), 0.03);
  g.pane(0.01, 0.2, 0.52, PANE, 0.75, 0.395 + out(0.16), 0.74, 0, 0.03);
  g.pane(0.01, 0.18, 0.46, PANE, 0.75, -0.555 - out(0.16), 0.74, 0, 0.03);
  // the front: grille, headlights; the bumpers, the amber tail lights
  const fx = 0.85 + out(0.12);
  g.box(0.01, 0.14, 0.2, STEEL, fx + 0.005, 0.38, 0, 0.01);
  for (const z of [-0.24, 0.24]) g.ball(0.065, CREAM, fx, 0.48, z, 0.3 + o.night);
  for (const x of [-1, 1]) g.box(0.06, 0.06, 0.82, STEEL, x * (fx + 0.04), 0.27, 0, 0.025);
  for (const z of [-0.26, 0.26]) g.box(0.02, 0.06, 0.08, AMBER, -fx - 0.005, 0.46, z, 0.008, 0.4 + o.night);
  // the roof rack and the suitcase
  const roof = 0.88 - 0.16 / 4;
  for (const x of [-0.3, 0.14]) g.box(0.03, 0.03, 0.62, STEEL, x, roof + 0.02, 0, 0.01);
  g.box(0.42, 0.16, 0.3, ORANGE, -0.08, roof + 0.115, 0, 0.03);
  g.box(0.03, 0.17, 0.31, darker(ORANGE, 0.8), -0.08, roof + 0.115, 0, 0.01);
  g.box(0.1, 0.03, 0.03, INK, -0.08, roof + 0.205, 0, 0.01);
  return { w: 1.98, d: 0.87, h: 1.07 };
};

/** a yoga mat (a health, a calm plugin): rolled out, its end curling, two blocks, a strap, a cushion, a water bottle, a little plant */
const yoga: Maker = (g) => {
  g.contact(1.9, 0.9, -0.08, 0.1);
  // the mat, its far end curled up
  g.box(1.6, 0.02, 0.6, VIOLET, 0, 0.01, 0, 0.008);
  g.cyl(0.06, 0.6, VIOLET, 0.84, 0.06, 0).rotation.x = Math.PI / 2;
  g.cyl(0.035, 0.61, darker(VIOLET, 0.8), 0.84, 0.06, 0).rotation.x = Math.PI / 2;
  // the strap and the cushion on it
  g.box(0.5, 0.012, 0.04, CREAM, -0.1, 0.026, -0.12, 0.004).rotation.y = 0.3;
  g.cyl(0.18, 0.1, ORANGE, -0.5, 0.072, 0.02);
  g.ball(0.02, darker(ORANGE, 0.8), -0.5, 0.122, 0.02);
  // two blocks, a water bottle and a plant beside it
  g.box(0.23, 0.08, 0.15, LEAF_L, -0.55, 0.04, 0.42, 0.02);
  g.box(0.15, 0.23, 0.08, LEAF_L, -0.27, 0.115, 0.42, 0.02).rotation.y = 0.3;
  g.cyl(0.04, 0.22, SKY, 0.1, 0.11, 0.42); g.cyl(0.03, 0.03, CREAM, 0.1, 0.235, 0.42);
  g.cyl(0.08, 0.12, WOOD, 0.55, 0.06, 0.43); g.ball(0.1, LEAF, 0.55, 0.19, 0.43); g.ball(0.07, LEAF_L, 0.6, 0.25, 0.46);
  return { w: 1.71, d: 0.85, h: 0.33, x: 0.05, z: 0.11 };
};

/** a trampoline (a fun, a bounce plugin): legs, its padded ring and springs, the dark mat, a ball on it, a step */
const trampoline: Maker = (g) => {
  g.contact(1.46, 1.46);
  // six legs, joined in pairs at the floor
  const legs: [number, number][] = [];
  for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3 + Math.PI / 6; legs.push([Math.cos(a) * 0.62, Math.sin(a) * 0.62]); }
  for (const [x, z] of legs) g.box(0.045, 0.5, 0.045, STEEL, x, 0.25, z, 0.015);
  for (let k = 0; k < 6; k += 2) { const [a, b] = [legs[k] as [number, number], legs[k + 1] as [number, number]]; rod(g, 0.02, STEEL, [a[0], 0.03, a[1]], [b[0], 0.03, b[1]]); }
  // the padded ring, its stripe, the mat, a ball resting on it
  g.cyl(0.72, 0.07, TEAL, 0, 0.52, 0);
  g.cyl(0.725, 0.02, lighter(TEAL, 0.5), 0, 0.51, 0);
  g.cyl(0.58, 0.02, INK, 0, 0.56, 0);
  g.ball(0.1, YELLOW, 0.18, 0.67, 0.1);
  // a step to climb on
  g.box(0.36, 0.04, 0.2, WOOD, 0, 0.25, 0.82, 0.015);
  for (const x of [-0.15, 0.15]) g.box(0.04, 0.23, 0.04, WOOD_D, x, 0.115, 0.82, 0.01);
  return { w: 1.46, d: 1.67, h: 0.78, z: 0.1 };
};

export const TRAVEL = { scooter, bike, hoop, surf, kayak, balloon, rocket, car, yoga, trampoline } satisfies Record<string, Maker>;

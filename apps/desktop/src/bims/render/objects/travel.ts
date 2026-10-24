// The objects of the travel family: Kit's scooter (the newsletter's delivery) and a city bike.
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import { AMBER, CREAM, darker, GREEN, INK, ORANGE, PAPER, SKY, STEEL, WOOD, WOOD_L, YELLOW, type Maker } from './kit';

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

export const TRAVEL = { scooter, bike } satisfies Record<string, Maker>;

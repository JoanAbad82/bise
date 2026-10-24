// The objects of the music family: an upright piano and a jukebox (the piano's compact one).
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import { CREAM, darker, GREEN, INK, ORANGE, SCREEN, SKY, VIOLET, WOOD_D, YELLOW, type Maker } from './kit';

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

export const MUSIC = { piano, jukebox } satisfies Record<string, Maker>;

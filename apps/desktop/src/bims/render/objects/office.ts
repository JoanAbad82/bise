// The objects of the office family: the plugins' work things (Outlook's wall calendar, Drive's filing cabinet, bise-stats' trophies, Sentry's extinguisher: yellow, never red; the data plugins' whiteboard, GitHub's packing table).
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import { AMBER, CREAM, darker, GREEN, INK, LEAF, LEAF_L, lighter, ORANGE, SKY, SLATE, STEEL, TEAL, VIOLET, WOOD, WOOD_D, WOOD_L, YELLOW, type Maker } from './kit';

/** a wall calendar (Outlook Calendar): hung on a pin, ring-bound, a month grid, today in yellow, a picture on top */
const calendar: Maker = (g) => {
  const z0 = -0.03;
  g.ball(0.03, SLATE, 0, 1.95, z0 + 0.02);
  g.box(0.012, 0.12, 0.012, SLATE, 0, 1.88, z0 + 0.02, 0.003);
  g.box(0.74, 0.44, 0.03, CREAM, 0, 1.6, z0 + 0.03, 0.02);
  g.box(0.66, 0.34, 0.01, SKY, 0, 1.6, z0 + 0.05, 0.015);
  g.ball(0.06, YELLOW, 0.18, 1.68, z0 + 0.06, 0.2);
  g.box(0.4, 0.12, 0.012, GREEN, -0.08, 1.48, z0 + 0.055, 0.04);
  for (let i = 0; i < 7; i++) g.cyl(0.012, 0.05, STEEL, -0.3 + i * 0.1, 1.37, z0 + 0.04).rotation.x = Math.PI / 2;
  g.box(0.74, 0.62, 0.03, CREAM, 0, 1.04, z0 + 0.03, 0.02);
  g.box(0.66, 0.08, 0.01, SKY, 0, 1.29, z0 + 0.05, 0.01);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) {
    const today = r === 2 && c === 3;
    // today stands out of its ink frame, the frame out of the page (2 mm apart at least: objects.test.ts)
    g.box(0.075, 0.075, 0.01, today ? YELLOW : (r * 7 + c) % 9 === 5 ? lighter(TEAL, 0.5) : '#e8e1d6', -0.28 + c * 0.093, 1.19 - r * 0.098, z0 + (today ? 0.058 : 0.05), 0.012);
  }
  g.box(0.1, 0.1, 0.008, INK, -0.28 + 3 * 0.093, 1.19 - 2 * 0.098, z0 + 0.049, 0.03);
  return { w: 0.78, d: 0.14, h: 2.0, z: 0.02, wall: true };
};

/** a filing cabinet (Google Drive): label cards, handles, one drawer open on coloured folders, a plant on top */
const files: Maker = (g) => {
  const col = '#4fa79c';
  g.contact(0.62, 0.66);
  g.box(0.62, 1.32, 0.66, col, 0, 0.66, 0, 0.045);
  g.box(0.64, 0.05, 0.68, darker(col, 0.8), 0, 1.33, 0, 0.02);
  for (let i = 0; i < 4; i++) {
    const open = i === 1, y = 0.2 + i * 0.31, z = 0.335 + (open ? 0.26 : 0);
    if (open) { g.box(0.5, 0.26, 0.5, darker(col, 0.75), 0, y, 0.28, 0.02); for (let f = 0; f < 5; f++) { g.box(0.44, 0.2, 0.02, [YELLOW, SKY, CREAM, ORANGE, GREEN][f] as string, 0, y + 0.08, 0.12 + f * 0.08, 0.005); g.box(0.1, 0.04, 0.02, [YELLOW, SKY, CREAM, ORANGE, GREEN][f] as string, -0.15 + f * 0.07, y + 0.2, 0.12 + f * 0.08, 0.005); } }
    g.box(0.56, 0.27, 0.04, lighter(col, 0.12), 0, y, z, 0.02);
    g.box(0.16, 0.03, 0.035, STEEL, 0, y - 0.04, z + 0.035, 0.01);
    g.box(0.14, 0.06, 0.01, CREAM, 0, y + 0.06, z + 0.03, 0.006);
  }
  g.cyl(0.08, 0.12, CREAM, 0.15, 1.42, -0.1); g.ball(0.1, LEAF, 0.15, 1.56, -0.1); g.ball(0.07, LEAF_L, 0.2, 1.62, -0.06);
  // the cabinet and its drawer open in front
  return { w: 0.66, d: 1.01, h: 1.7, z: 0.15 };
};

/** a trophy cabinet (bise-stats): glass doors, three cups on plinths, a ribbon and a star */
const trophies: Maker = (g) => {
  const w = 1.1, d = 0.42;
  g.contact(w, d);
  g.box(w, 0.92, d, WOOD_D, 0, 0.46, 0, 0.04);
  for (const x of [-0.27, 0.27]) { g.box(0.48, 0.34, 0.02, darker(WOOD_D, 0.8), x, 0.44, d / 2 + 0.012, 0.02); g.box(0.06, 0.025, 0.02, YELLOW, x + (x < 0 ? 0.17 : -0.17), 0.44, d / 2 + 0.024, 0.008); }
  g.box(w + 0.04, 0.05, d + 0.04, WOOD, 0, 0.945, 0, 0.02);
  for (const [x, s, c] of [[-0.36, 1, '#e9c46a'], [0, 1.35, YELLOW], [0.34, 0.9, STEEL]] as const) {
    g.box(0.16 * s, 0.07, 0.16 * s, INK, x, 1.005, 0, 0.02);
    g.box(0.12 * s, 0.025, 0.005, c, x, 1.005, 0.08 * s + 0.011, 0.003);
    g.cyl(0.035, 0.12 * s, c, x, 1.04 + 0.06 * s, 0);
    g.cyl(0.1 * s, 0.17 * s, c, x, 1.1 + 0.2 * s, 0, 0.15);
    g.cyl(0.105 * s, 0.025, lighter(c, 0.3), x, 1.1 + 0.29 * s, 0);
    for (const dx of [-1, 1]) { const h = g.box(0.035, 0.1 * s, 0.035, c, x + dx * 0.12 * s, 1.12 + 0.2 * s, 0, 0.012); h.rotation.z = dx * 0.3; }
  }
  // a medal on a blue ribbon hung on the front, a star sticker
  g.box(0.06, 0.2, 0.01, SKY, 0.0, 0.76, d / 2 + 0.018, 0.005); g.cyl(0.06, 0.02, YELLOW, 0.0, 0.64, d / 2 + 0.026).rotation.x = Math.PI / 2;
  return { w: w + 0.06, d: d + 0.08, h: 1.51 };
};

/** a fire extinguisher on its bracket (Sentry: it catches errors): yellow, never red; gauge, hose, a sign */
const extinguisher: Maker = (g) => {
  g.contact(0.4, 0.34);
  g.box(0.4, 0.05, 0.34, SLATE, 0, 0.025, 0, 0.02);
  g.box(0.07, 1.4, 0.06, SLATE, 0, 0.72, -0.12, 0.02);
  g.box(0.34, 0.24, 0.02, CREAM, 0, 1.34, -0.08, 0.02);
  for (let i = 0; i < 2; i++) g.box(0.2 - i * 0.06, 0.03, 0.01, SLATE, 0, 1.38 - i * 0.07, -0.068, 0.005);
  g.box(0.22, 0.04, 0.06, SLATE, 0, 0.82, -0.06, 0.01);
  g.cyl(0.12, 0.6, YELLOW, 0, 0.42, 0.04);
  g.ball(0.12, YELLOW, 0, 0.72, 0.04).scale.set(1, 0.5, 1);
  g.cyl(0.125, 0.06, INK, 0, 0.55, 0.04);
  g.box(0.14, 0.18, 0.01, CREAM, 0, 0.38, 0.163, 0.02);
  g.cyl(0.035, 0.012, INK, 0, 0.42, 0.168).rotation.x = Math.PI / 2;
  // valve, lever, gauge, hose
  g.cyl(0.04, 0.1, SLATE, 0, 0.8, 0.04);
  g.box(0.2, 0.03, 0.05, INK, 0.06, 0.88, 0.04, 0.012).rotation.z = 0.2;
  g.cyl(0.04, 0.02, CREAM, 0.06, 0.8, 0.09).rotation.x = Math.PI / 2;
  const hose = g.box(0.035, 0.42, 0.035, INK, 0.14, 0.58, 0.1, 0.015); hose.rotation.z = 0.18;
  g.cyl(0.03, 0.08, SLATE, 0.18, 0.36, 0.1);
  return { w: 0.4, d: 0.34, h: 1.5 };
};

/** a whiteboard on wheels (Metabase, BigQuery, W&B): bars and a line chart, a marker tray */
const charts: Maker = (g) => {
  g.contact(1.1, 0.5);
  for (const dx of [-0.48, 0.48]) {
    g.box(0.05, 1.72, 0.05, STEEL, dx, 0.92, 0, 0.02);
    g.box(0.07, 0.05, 0.5, STEEL, dx, 0.1, 0, 0.02);
    for (const dz of [-0.2, 0.2]) { g.cyl(0.04, 0.035, INK, dx, 0.04, dz).rotation.z = Math.PI / 2; }
  }
  g.box(1.0, 0.05, 0.05, STEEL, 0, 0.12, 0, 0.015);
  // the board stands 1 cm before its posts (their fronts were one plane)
  g.box(1.04, 0.8, 0.05, STEEL, 0, 1.3, 0.01, 0.02);
  g.box(0.96, 0.72, 0.01, CREAM, 0, 1.3, 0.045, 0.01);
  const hs = [0.14, 0.24, 0.2, 0.36, 0.3];
  hs.forEach((h, i) => g.box(0.08, h, 0.012, [SKY, TEAL, SKY, AMBER, SKY][i] as string, -0.36 + i * 0.12, 1.02 + h / 2, 0.053, 0.008));
  g.box(0.6, 0.01, 0.012, INK, -0.12, 1.015, 0.053, 0.0);
  // the line chart on the right, three segments and its points
  const pts = [[0.24, 1.1], [0.32, 1.22], [0.4, 1.18], [0.46, 1.4]] as const;
  for (let i = 0; i < 3; i++) {
    const [x0, y0] = pts[i] as readonly [number, number], [x1, y1] = pts[i + 1] as readonly [number, number];
    const seg = g.box(Math.hypot(x1 - x0, y1 - y0), 0.016, 0.012, VIOLET, (x0 + x1) / 2, (y0 + y1) / 2, 0.053, 0.004);
    seg.rotation.z = Math.atan2(y1 - y0, x1 - x0);
  }
  for (const [x, y] of pts) g.ball(0.018, VIOLET, x, y, 0.057);
  g.box(0.3, 0.02, 0.012, INK, -0.2, 1.58, 0.053, 0.004);
  g.box(0.9, 0.03, 0.08, STEEL, 0, 0.88, 0.06, 0.01);
  for (const [x, c] of [[-0.3, SKY], [-0.2, INK], [0.25, GREEN]] as const) { const m = g.cyl(0.014, 0.12, c, x, 0.91, 0.07); m.rotation.z = Math.PI / 2; }
  return { w: 1.1, d: 0.52, h: 1.78 };
};

/** a packing table (GitHub: it ships): crates taped and labelled, a tape gun, a kraft roll, a box below */
const packing: Maker = (g) => {
  g.contact(1.42, 0.72);
  g.box(1.42, 0.07, 0.72, WOOD_L, 0, 0.78, 0, 0.025);
  for (const x of [-0.63, 0.63]) for (const z of [-0.29, 0.29]) g.box(0.07, 0.76, 0.07, WOOD, x, 0.38, z, 0.02);
  g.box(1.32, 0.04, 0.62, WOOD, 0, 0.2, 0, 0.012);
  // the kraft roll at the back on its bar
  const roll = g.cyl(0.09, 1.1, '#c8a06e', 0, 0.98, -0.28); roll.rotation.z = Math.PI / 2;
  for (const x of [-0.58, 0.58]) g.box(0.03, 0.22, 0.03, SLATE, x, 0.9, -0.28, 0.008);
  g.box(0.6, 0.006, 0.4, '#d7b07d', -0.1, 0.82, -0.05, 0.002);
  for (const [x, z, w, h, d] of [[-0.38, 0.05, 0.42, 0.3, 0.36], [0.18, 0.1, 0.34, 0.24, 0.3]] as const) {
    g.box(w, h, d, WOOD, x, 0.815 + h / 2, z, 0.035);
    g.box(w + 0.006, 0.03, 0.07, '#e9c46a', x, 0.815 + h - 0.01, z, 0.006);
    g.box(0.07, h + 0.006, 0.006, '#e9c46a', x, 0.815 + h / 2, z + d / 2, 0.003);
    g.box(0.12, 0.08, 0.005, CREAM, x + w / 4, 0.815 + h / 2, z + d / 2 + 0.004, 0.006);
    g.box(0.08, 0.012, 0.004, TEAL, x + w / 4, 0.815 + h / 2 + 0.01, z + d / 2 + 0.008, 0.002);
  }
  // the tape gun
  g.cyl(0.07, 0.05, YELLOW, 0.5, 0.86, 0.12).rotation.x = Math.PI / 2; g.box(0.04, 0.14, 0.04, SLATE, 0.55, 0.88, 0.16, 0.015).rotation.z = -0.5;
  g.box(0.52, 0.36, 0.42, WOOD, 0.28, 0.4, 0.0, 0.035); g.box(0.53, 0.03, 0.08, '#e9c46a', 0.28, 0.575, 0.0, 0.005);
  return { w: 1.42, d: 0.72, h: 1.15 };
};

export const OFFICE = { calendar, files, trophies, extinguisher, charts, packing } satisfies Record<string, Maker>;

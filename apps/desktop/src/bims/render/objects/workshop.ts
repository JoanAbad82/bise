// The objects of the workshop family: making things (Blender's easel; the printer of docs 1, sheets 2, slides 3: its pages show which).
// Built with the objects' kit (kit.ts): at the origin on the floor, front to +z, centred on the foot it returns.
import { AMBER, CREAM, darker, GREEN, lighter, ORANGE, PANE, PAPER, SKY, SLATE, SLATE_L, STEEL, VIOLET, WOOD, WOOD_D, WOOD_L, YELLOW, type Maker } from './kit';

/** an easel (Blender, image generation): an A-frame, a canvas with clay blobs, a palette, a jar of brushes */
const easel: Maker = (g) => {
  g.contact(0.85, 0.75);
  for (const dx of [-0.28, 0.28]) { const l = g.box(0.055, 1.75, 0.055, WOOD, dx, 0.85, 0.08, 0.02); l.rotation.z = dx > 0 ? -0.13 : 0.13; l.rotation.x = -0.05; }
  const back = g.box(0.055, 1.6, 0.055, WOOD, 0, 0.78, -0.26, 0.02); back.rotation.x = 0.34;
  g.box(0.06, 0.06, 0.06, WOOD_D, 0, 1.68, 0.04, 0.02);
  g.box(0.8, 0.05, 0.14, WOOD_D, 0, 0.6, 0.14, 0.02);
  const cv = g.at(0, 1.03, 0.11); cv.root.rotation.x = -0.1;
  cv.box(0.86, 0.72, 0.05, WOOD_L, 0, 0, 0, 0.02);
  cv.box(0.8, 0.66, 0.02, CREAM, 0, 0, 0.026, 0.01);
  for (const [x, y, c, r] of [[-0.18, 0.06, ORANGE, 0.13], [0.13, 0.12, SKY, 0.1], [0.04, -0.13, GREEN, 0.1], [-0.2, -0.17, VIOLET, 0.06]] as const) cv.box(r * 2, r * 2, 0.02, c, x, y, 0.035, r * 0.95);
  // the palette on the tray and the brush jar on the floor
  const pal = g.at(0.22, 0.64, 0.18); pal.root.rotation.x = -0.3;
  pal.box(0.24, 0.02, 0.16, WOOD_L, 0, 0, 0, 0.06);
  for (const [x, c] of [[-0.06, ORANGE], [0.0, SKY], [0.06, YELLOW]] as const) pal.ball(0.022, c, x, 0.015, -0.03);
  g.cyl(0.07, 0.16, PANE, 0.42, 0.08, 0.3);
  for (const [dx, c] of [[-0.02, ORANGE], [0.02, SKY], [0.0, YELLOW]] as const) { const br = g.box(0.015, 0.3, 0.015, WOOD, 0.42 + dx, 0.24, 0.3, 0.005); br.rotation.z = dx * 6; g.ball(0.018, c, 0.42 + dx * 2.2, 0.39, 0.3); }
  return { w: 0.94, d: 0.94, h: 1.75, x: 0.03, z: -0.1 };
};

/** a printer on its stand (docs, sheets, slides): paper in, pages out with coloured lines, a ream below */
const printer: Maker = (g, o) => {
  g.contact(0.72, 0.6);
  g.box(0.72, 0.6, 0.56, WOOD, 0, 0.3, 0, 0.04);
  g.box(0.62, 0.22, 0.02, darker(WOOD, 0.85), 0, 0.42, 0.3, 0.02); g.box(0.14, 0.025, 0.02, STEEL, 0, 0.45, 0.314, 0.008);
  g.box(0.3, 0.1, 0.22, CREAM, -0.12, 0.13, 0.12, 0.01); g.box(0.31, 0.03, 0.23, SKY, -0.12, 0.13, 0.12, 0.005);
  // the printer: body, lid, the paper tray at the back with paper standing
  g.box(0.64, 0.3, 0.5, PAPER, 0, 0.75, 0, 0.07);
  g.box(0.66, 0.06, 0.52, lighter(STEEL, 0.4), 0, 0.92, -0.01, 0.03);
  g.box(0.5, 0.05, 0.03, SLATE, 0, 0.66, 0.255, 0.01);
  const tray = g.box(0.44, 0.3, 0.03, SLATE_L, 0, 1.05, -0.24, 0.015); tray.rotation.x = -0.3;
  const pp = g.box(0.4, 0.26, 0.01, CREAM, 0, 1.08, -0.22, 0.004); pp.rotation.x = -0.3;
  // panel: a little screen and two buttons
  g.box(0.2, 0.06, 0.1, SLATE, 0.18, 0.955, 0.17, 0.015); g.box(0.1, 0.035, 0.01, '#bfe1f2', 0.15, 0.97, 0.232, 0.004, 0.3 + o.night);
  g.ball(0.018, GREEN, 0.25, 0.97, 0.22, 0.5 + o.night);
  // pages out: what this plugin makes (o.n 1 docs: text lines, 2 sheets: a grid, 3 slides: a slide with a chart block)
  for (let i = 0; i < 3; i++) {
    const p = g.at(-0.03 + i * 0.012, 0.64 + i * 0.012, 0.36); p.root.rotation.x = 0.1; p.root.rotation.y = (i - 1) * 0.06;
    const top = i === 2;
    if (o.n === 3) {
      p.box(0.4, 0.008, 0.26, CREAM, 0, 0, 0, 0.002);
      if (top) { p.box(0.3, 0.006, 0.03, AMBER, 0, 0.006, -0.08, 0.002); for (let b = 0; b < 3; b++) p.box(0.05, 0.006, 0.06 + b * 0.025, [AMBER, YELLOW, SKY][b] as string, -0.1 + b * 0.08, 0.006, 0.05 - b * 0.012, 0.002); }
    } else if (o.n === 2) {
      p.box(0.36, 0.008, 0.3, CREAM, 0, 0, 0, 0.002);
      if (top) { for (let r = 0; r < 4; r++) p.box(0.3, 0.006, 0.008, GREEN, 0, 0.006, -0.11 + r * 0.07, 0); for (let c = 0; c < 4; c++) p.box(0.008, 0.006, 0.24, GREEN, -0.13 + c * 0.087, 0.006, -0.005, 0); p.box(0.08, 0.006, 0.06, lighter(GREEN, 0.5), -0.09, 0.005, -0.075, 0); }
    } else {
      p.box(0.3, 0.008, 0.36, CREAM, 0, 0, 0, 0.002);
      if (top) { p.box(0.16, 0.006, 0.03, SKY, -0.05, 0.006, -0.13, 0.002); for (let r = 0; r < 5; r++) p.box(0.22 - (r % 2) * 0.05, 0.006, 0.015, '#9aa7b2', -0.02 - (r % 2) * 0.025, 0.006, -0.07 + r * 0.045, 0.002); }
    }
  }
  // the stand and the pages out in front
  return { w: 0.76, d: 0.86, h: 1.21, z: 0.12 };
};

export const WORKSHOP = { easel, printer } satisfies Record<string, Maker>;

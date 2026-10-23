// The office's inbox (bims/inbox.ts places it; bims m_38198, designer m_38202): a low wooden stand
// with two stacked letter trays in the map's desk palette, its top tray holding his open items in
// cream sheets, 0 to 3 (3: three or more). No colour, no glow, no '?': it is the room's, the pills
// stay the only UI colours. Static: the sheets show or hide when the count changes, nothing moves.
import { Group, type Mesh } from 'three';
import { INBOX_D, INBOX_W } from '../inbox';
import type { Build } from './maps/look';
import { WORLD } from './palette';

/** the stand's top (m) and the trays' sizes and lift */
const STAND_H = 0.62;
const TRAY_W = 0.4;
const TRAY_D = 0.3;
const TRAY_H = 0.07;
const TRAY_GAP = 0.13;
const SHEET_MAX = 3;

export interface InboxHandles {
  /** the top tray's floor of sheets, world units (the welcome's pin 3) */
  readonly top: { readonly x: number; readonly y: number; readonly z: number };
  /** show `n` sheets (0..3, more reads 3) */
  sheets(n: number): void;
}

/** the number of sheets shown for `n` open items. Pure. */
export const sheetsFor = (n: number): number => Math.max(0, Math.min(SHEET_MAX, Math.floor(n)));

/** the inbox at Office.inbox, on stage 0; null when the plan has none */
export function inboxStand({ k, root, o }: Build): InboxHandles | null {
  const at = o.inbox;
  if (at === undefined) return null;
  const { style, pal } = k;
  const g = new Group();
  g.position.set(at.x, 0, at.z);
  root.add(g);
  // the stand: four legs into a shelf top, in the desk's wood (pieces sink into each other, never
  // meet face to face: the coplanar check)
  const leg = style.box(0.04, STAND_H + 0.02, 0.04);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.add(leg, k.mat(pal.desk), g, sx * (INBOX_W / 2 - 0.03), (STAND_H + 0.02) / 2, sz * (INBOX_D / 2 - 0.03));
  k.add(style.box(INBOX_W, 0.04, INBOX_D), k.mat(pal.deskTop), g, 0, STAND_H + 0.02, 0);
  // two letter trays: a floor and a low rim at the back and the sides, the top one on four posts
  const tray = (y: number): void => {
    k.add(style.box(TRAY_W - 0.04, 0.02, TRAY_D - 0.03), k.mat(pal.desk), g, 0, y + 0.018, 0);
    k.add(style.box(TRAY_W, TRAY_H, 0.02), k.mat(pal.desk), g, 0, y + 0.016 + TRAY_H / 2, -TRAY_D / 2 + 0.01);
    for (const sx of [-1, 1]) k.add(style.box(0.02, TRAY_H - 0.02, TRAY_D - 0.005), k.mat(pal.desk), g, sx * (TRAY_W / 2 - 0.02), y + 0.022 + (TRAY_H - 0.02) / 2, 0.0025);
  };
  const y0 = STAND_H + 0.04;
  const y1 = y0 + TRAY_GAP;
  tray(y0);
  const post = style.box(0.02, TRAY_GAP, 0.02);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.add(post, k.mat(pal.desk), g, sx * 0.13, y0 + 0.018 + TRAY_GAP / 2, sz * (TRAY_D / 2 - 0.05));
  tray(y1);
  // the sheets in the top tray, a little turned one on the other, cream paper
  const sheets: Mesh[] = [];
  for (let i = 0; i < SHEET_MAX; i++) {
    const m = k.add(style.box(0.3, 0.008, 0.22), k.mat(WORLD.paper), g, (i - 1) * 0.012, y1 + 0.04 + i * 0.016, (1 - i) * 0.01);
    m.rotation.y = (i - 1) * 0.08;
    m.visible = false;
    sheets.push(m);
  }
  return {
    top: { x: at.x, y: y1 + 0.05, z: at.z },
    sheets(n) {
      const shown = sheetsFor(n);
      sheets.forEach((m, i) => {
        m.visible = i < shown;
      });
    },
  };
}

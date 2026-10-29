// A new project's empty desks (Office.ghosts, bims/ghosts.ts; page new-project-home, bims m_38078):
// the desk's footprint as a dashed rounded rect on the floor, short thin flat boxes 1 cm over it,
// the ink at 45%, no chair, no laptop. One piece for every map: the footprint is the plan's
// furniture box ahead of the spot. The same values day and night: it takes the light like the floor.
import type { Material } from 'three';
import type { Box, Spot } from '../model';
import { boxAhead } from './furniture';
import type { Build } from './maps/look';

/** a dash's length, the gap after it, its width and height; its lift over the floor (m) */
const DASH = 0.25;
const GAP = 0.25;
const THICK = 0.08;
const H = 0.008;
const LIFT = 0.01;
/** the ink's alpha */
const ALPHA = 0.45;
/** what each corner leaves out: the rect reads rounded */
const CORNER = 0.08;

/** the dashes of one side from a to b, along x or z: their centres and lengths. Pure. */
export function dashes(a: number, b: number): { readonly at: number; readonly len: number }[] {
  const span = b - a;
  if (span <= 0) return [];
  // whole dashes, the gaps spread so the side starts and ends on a dash
  const n = Math.max(1, Math.floor((span + GAP) / (DASH + GAP)));
  const gap = n > 1 ? (span - n * DASH) / (n - 1) : 0;
  const len = n > 1 ? DASH : Math.min(DASH, span);
  const out: { at: number; len: number }[] = [];
  for (let i = 0; i < n; i++) out.push({ at: a + len / 2 + i * (len + gap), len });
  return out;
}

/** the footprint of the desk ahead of a spot (the plan's box, else the loft's default). Pure. */
export function ghostBox(furniture: readonly Box[], s: Spot): Box {
  return boxAhead(furniture, s) ?? { x0: s.x - 0.8, x1: s.x + 0.8, z0: s.z + 0.11, z1: s.z + 0.89 };
}

/** every ghost desk of the office, on stage 0 */
export function ghostDesks({ k, root, o }: Build): void {
  const spots = o.ghosts ?? [];
  if (spots.length === 0) return;
  const ink: Material = k.style.material(k.pal.ink, { opacity: ALPHA });
  const y = LIFT + H / 2;
  for (const s of spots) {
    const b = ghostBox(o.furniture, s);
    for (const z of [b.z0 + THICK / 2, b.z1 - THICK / 2])
      for (const d of dashes(b.x0 + CORNER, b.x1 - CORNER)) k.add(k.style.box(d.len, H, THICK), ink, root, d.at, y, z);
    for (const x of [b.x0 + THICK / 2, b.x1 - THICK / 2])
      for (const d of dashes(b.z0 + CORNER, b.z1 - CORNER)) k.add(k.style.box(THICK, H, d.len), ink, root, x, y, d.at);
  }
}

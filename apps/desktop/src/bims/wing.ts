// What his sketch's wing (extensions.ts) keeps for itself: its floor lamp and the floor under its
// window. render/extensions.ts draws them, corners.ts keeps his objects off them. Pure, three-free.
// Owner: bims-life.
import type { Box } from './model';

/** the wing's floor lamp, in its far back corner (render/extensions.ts draws it, corners.ts keeps off it) */
export function wingLamp(w: Box): Box {
  return { x0: w.x1 - 0.75, x1: w.x1 - 0.25, z0: 0.2, z1: 0.7 };
}

/** the wing's window on its back wall and the floor under it, kept so it shows (designer m_41450) */
export function wingWindow(w: Box): Box {
  const half = Math.min(0.8, (w.x1 - w.x0) / 5);
  const cx = (w.x0 + w.x1) / 2;
  return { x0: cx - half, x1: cx + half, z0: 0, z1: 0.5 };
}

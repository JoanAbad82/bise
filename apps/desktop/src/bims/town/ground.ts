// What the town's plan gets from each office (render side: it reads render/camera.ts, so only the
// renderer's chunk imports it; the bims-budget keeps src/bims/render out of the entry chunk): its
// ground (the grass block its growth has grown) and its door, and the town's seed. Pure. Owner: maps-e.
import type { Office } from '../model';
import { groundOf } from '../render/camera';
import type { Grow } from '../growth';
import { seedOf, type TownSite } from './plan';

/** the home's ground over its office's own (bims m_29650: a little bigger, never its office or bims) */
export const HOME_GROUND = 1.15;

/** An office's site for the plan: its grass block (what its growth has grown) and its door; bise's home's 15% wider. Pure. */
export function siteOf(id: string, o: Office, g: Grow, home = false): TownSite {
  const s = groundOf(o, g);
  if (!home) return { id, fp: { x0: s.x0, x1: s.x1, z0: s.z0, z1: s.z1 }, doorX: o.door.x };
  const cx = (s.x0 + s.x1) / 2;
  const cz = (s.z0 + s.z1) / 2;
  const hw = ((s.x1 - s.x0) * HOME_GROUND) / 2;
  const hd = ((s.z1 - s.z0) * HOME_GROUND) / 2;
  return { id, fp: { x0: cx - hw, x1: cx + hw, z0: cz - hd, z1: cz + hd }, doorX: o.door.x, home: true };
}

/** The town's seed: its projects' ids, so the same projects make the same town. Pure. */
export const townSeed = (ids: readonly string[]): number => seedOf(ids.join('\u0000'));

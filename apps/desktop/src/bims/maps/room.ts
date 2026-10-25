// The room a map's office makes for his plugins' objects (bims-plugins p4 step 2, Gabriel's note n3
// on v6: the office rebuilt to make room, no desk moved): a band along its left wall (the reading
// corner's front, the play corner's back by the nap place) and one past its right side (the
// machine corner's, by main's desk). The plan lays everything as before; the room's walls move
// out (x0, W), the way out moves with the left one (its walkway leg follows), so nothing a bim
// stands at or walks to moves. The loft has its bands in its own plan (maps/loft.ts). The band's
// back by the nap place is the play corner's: no cozy piece goes there (roomKeepOut). Pure.
// Owner: bims-life.
import type { Box, Leg, Office } from '../model';

/** how much room a plan's office makes: the left band's and the right band's widths (office units) */
export interface Room {
  readonly left: number;
  readonly right: number;
}

/** the loft's bands (maps/loft.ts READ_BAND, MACHINE_BAND): every other map's first room */
export const ROOM: Room = { left: 1.6, right: 1.4 };

/** how far past the nap place's last row the play corner's back of the band reaches */
const PLAY_DEPTH = 1.5;

const same = (a: { x: number; z: number }, b: { x: number; z: number }): boolean => Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.z - b.z) < 1e-9;

/** the office with its bands: wider to the left and right, the exit as far past the new left edge as it was. Pure. */
export function withRoom<O extends Office>(o: O, r: Room): O {
  if (r.left <= 0 && r.right <= 0) return o;
  const old = o.exit;
  const exit = { ...old, x: old.x - r.left, ax: old.ax - r.left };
  // the leg that ends at the way out runs on to its new place (along the walkway it was on)
  const walks: Leg[] = o.walks.map(([a, b]) => [same(a, old) ? exit : a, same(b, old) ? exit : b] as const);
  return { ...o, x0: o.x0 - r.left, W: o.W + r.left + r.right, exit, walks };
}

/** what the cozy pieces keep off in a roomier office: the left band's back, by the nap place (the play corner's). Pure. */
export function roomKeepOut(o: Office, r: Room): Box[] {
  if (r.left <= 0) return [];
  const back = Math.max(0, ...o.lounge.map((l) => l.z)) + PLAY_DEPTH;
  return [{ x0: o.x0, x1: o.x0 + r.left, z0: 0, z1: back }];
}

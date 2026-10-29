// The office's inbox (page new-project-home; bims m_38198, designer m_38202): a low stand with two
// letter trays just inside the door, on the side away from the walk lane, its top tray holding his
// inbox count in sheets (render/inbox.ts draws it). Here: where it stands on any map, a pure search
// around the plan's door spot: inside the floor, clear of every walk leg by a bim's body and a
// margin, of the furniture and the cozy pieces, and never in front of the nap place (nothing taller
// than a napper's head there). Owner: project-home.
import type { Box, Leg, Office, Pt } from './model';
import { BODY_R } from './avoid';

/** the stand's footprint (m): the trays are 0.4 x 0.3, the stand a little wider */
export const INBOX_W = 0.46;
export const INBOX_D = 0.36;
/** room between its box and a walk leg past a bim's body */
const CLEAR = BODY_R + 0.06;
/** room from the floor's edge and from another piece */
const EDGE = 0.1;
const AROUND = 0.12;
/** the search: rings around the door, this far at most, this step */
const MAX_R = 4;
const STEP = 0.15;
/** how deep in front of a bed the stand would hide a napper's head at the office's camera */
const NAP_FRONT = 2.2;

/** the box of a stand at `p`. Pure. */
export const inboxBox = (p: Pt): Box => ({ x0: p.x - INBOX_W / 2, x1: p.x + INBOX_W / 2, z0: p.z - INBOX_D / 2, z1: p.z + INBOX_D / 2 });

/** how far a box is from a leg (0 when it crosses it). Pure. */
export function boxLegGap(b: Box, [a, c]: Leg): number {
  // sampled along the leg: legs are short and the room is in metres, 5 cm steps are exact enough
  const n = Math.max(1, Math.ceil(Math.hypot(c.x - a.x, c.z - a.z) / 0.05));
  let best = Infinity;
  for (let i = 0; i <= n; i++) {
    const x = a.x + ((c.x - a.x) * i) / n;
    const z = a.z + ((c.z - a.z) * i) / n;
    const dx = Math.max(b.x0 - x, 0, x - b.x1);
    const dz = Math.max(b.z0 - z, 0, z - b.z1);
    best = Math.min(best, Math.hypot(dx, dz));
    if (best === 0) return 0;
  }
  return best;
}

const overlaps = (a: Box, b: Box, m: number): boolean => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.z0 < b.z1 + m && a.z1 > b.z0 - m;

/** Whether a stand fits at `p` in this office. Pure. */
export function inboxFits(o: Office, p: Pt): boolean {
  const b = inboxBox(p);
  if (b.x0 < o.x0 + EDGE || b.x1 > o.x0 + o.W - EDGE || b.z0 < EDGE || b.z1 > o.D - EDGE) return false;
  if (o.walks.some((l) => boxLegGap(b, l) < CLEAR)) return false;
  if (o.furniture.some((f) => overlaps(b, f, AROUND))) return false;
  const c = o.cozy;
  if (c !== undefined) {
    const items = [c.coffee, c.shelf, ...c.lamps, ...c.plants];
    if (items.some((it) => overlaps(b, it.box, AROUND))) return false;
    if (c.rug !== null && overlaps(b, c.rug, AROUND)) return false;
  }
  if (o.park !== undefined && overlaps(b, o.park.area, AROUND)) return false;
  // just in front of the nap place (towards the viewer, +z, a bed's reach across, NAP_FRONT deep):
  // nothing taller than a napper's head there
  if (o.lounge.some((l) => Math.abs(l.x - p.x) < 1.2 && p.z > l.z && p.z - l.z < NAP_FRONT)) return false;
  // every place a bim stands keeps its body's room
  const spots = [o.door, o.mainDesk, ...o.desks.values(), ...o.islandSpots, ...o.lounge, ...o.boardSpots, ...o.queue];
  return !spots.some((s) => Math.max(b.x0 - s.x, 0, s.x - b.x1) ** 2 + Math.max(b.z0 - s.z, 0, s.z - b.z1) ** 2 < CLEAR ** 2);
}

/**
 * Where the inbox stands: the nearest place to the door (just inside it) where it fits, searched
 * ring by ring; null when nothing fits within MAX_R (the office goes without one). Pure.
 */
export function inboxAt(o: Office): Pt | null {
  const d = o.door;
  // just inside: the door spot may sit on the edge or past it
  const z0 = Math.min(d.z, o.D - EDGE - INBOX_D / 2);
  const tries: { p: Pt; r: number }[] = [];
  for (let dx = -MAX_R; dx <= MAX_R + 1e-9; dx += STEP)
    for (let dz = 0; dz <= MAX_R + 1e-9; dz += STEP) {
      const p = { x: d.x + dx, z: z0 - dz };
      tries.push({ p, r: Math.hypot(dx, dz) });
    }
  tries.sort((a, b) => a.r - b.r || a.p.x - b.p.x);
  return tries.find((t) => inboxFits(o, t.p))?.p ?? null;
}

/** The office with its inbox placed (maps/index.ts layoutOf). Pure. */
export function withInbox(o: Office): Office {
  const at = inboxAt(o);
  return at === null ? o : { ...o, inbox: at };
}

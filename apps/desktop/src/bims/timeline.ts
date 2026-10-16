// les bims: each bim's life as segments (the prototype's plan(), made live). `update` takes the
// activities of a snapshot (activity.ts) and appends a segment for each bim whose activity
// changed: it walks from where it is now (a walk cut by a new state restarts from its current
// point: no teleport, spec §1 rule 5) along the network (paths.ts) to its new spot, at the
// spec §3 speed, faster when far (no walk past MAX_WALK_S, §10). A new agent comes in by the
// door; an archived one (gone from the activities) skates off the terrace. His messages (q-planes,
// BimEvent 'his') put a paper plane on the target's pose. `poseAt` / `names` / `moving` read it
// at any t. Pure: the same updates give the same poses. Spots shared by several bims (bean
// bags, island, whiteboard, deck chairs) go first come first served; past the last one, a bim
// stands beside (spec §3).
import type { Activity, BimEvent, Office, Pose, Segment, Spot, Timeline } from './model';
import { exitOf } from './layout';
import { along, makePath, path } from './paths';

/** tiles per second (spec §3): walk, hurry (an urgent ask), skate (done, leaving), carrying a box (landing) */
export const SPEED = { walk: 2.4, hurry: 3.5, skate: 3.4, carry: 1.8 } as const;
/** no walk lasts longer (spec §10): a far spot is walked faster */
export const MAX_WALK_S = 6;
/** after a walk (or a change in place), the renderer's transition (spec §5): the loop still runs */
export const SETTLE_S = 1.5;
/** his paper plane: the flight from the top edge (~1.5 s), then the catch, read, thumbs up (~2 s) */
export const PLANE_S = 3.5;
/** the segments kept per bim (a pose asked a bit in the past still answers) */
const KEEP = 8;

type Shared = 'lounge' | 'island' | 'board' | 'terrace';

interface Bim {
  segs: Segment[];
  /** the shared spot it holds ('lounge:3', 'island:+0' beside the island) */
  key: string | null;
  /** archived: it skates off, out of the map at `outAt` */
  leaving: boolean;
  outAt: number;
  /** the shared spot it had last, per kind: back from a snack, the same bean bag */
  pref: Map<Shared, number>;
  /** when his planes left for it */
  planes: number[];
}

export function newTimeline(): Timeline {
  const bims = new Map<string, Bim>();
  let office: Office | null = null;

  const segAt = (b: Bim, t: number): Segment | null => {
    return b.segs.findLast((s) => s.t <= t) ?? null;
  };

  const poseOf = (b: Bim, t: number): Pose | null => {
    if (b.leaving && t >= b.outAt) return null;
    const seg = segAt(b, t);
    if (!seg) return null;
    const d = (t - seg.t) * seg.speed;
    const walking = d < seg.path.len - 1e-9;
    const p = walking ? along(seg.path, d) : { x: seg.spot.x, z: seg.spot.z, dir: seg.spot.face };
    const plane = b.planes.findLast((te) => te <= t && t - te < PLANE_S);
    return {
      x: p.x, z: p.z, dir: p.dir, moving: walking, since: t - seg.t, seg,
      ...(plane === undefined ? {} : { plane: { since: t - plane } }),
    };
  };

  const push = (b: Bim, seg: Segment): void => {
    b.segs.push(seg);
    if (b.segs.length > KEEP) b.segs.splice(0, b.segs.length - KEEP);
  };

  return {
    update(acts: ReadonlyMap<string, Activity>, next: Office, t: number, events: readonly BimEvent[]): void {
      const first = office === null;
      // a room that grew (more rows, 3 columns): its world is rebuilt, every bim at its spot in it
      const rebuilt = office !== null && (office.side !== next.side || office.rows !== next.rows);
      office = next;
      const held = new Map<string, string>();
      for (const [name, b] of bims) if (b.key && !b.leaving) held.set(b.key, name);

      for (const [name, act] of acts) {
        let b = bims.get(name);
        const sig = sigOf(act);
        const last = b?.segs.at(-1);
        const fixed = fixedSpot(next, name, act);
        if (b && last && !b.leaving && last.sig === sig && !rebuilt && (!fixed || near(fixed, last.spot))) continue;
        if (b?.key) held.delete(b.key);
        const shared = fixed ? null : sharedSpot(next, act.at as Shared, held, b?.pref);
        const spot = fixed ?? shared?.spot ?? next.door;
        const key = shared?.key ?? null;
        if (key) held.set(key, name);
        if (b && shared?.ix !== undefined) b.pref.set(act.at as Shared, shared.ix);
        if (!b) {
          b = { segs: [], key, leaving: false, outAt: Infinity, pref: new Map(), planes: [] };
          if (shared?.ix !== undefined) b.pref.set(act.at as Shared, shared.ix);
          bims.set(name, b);
          // the office's first look: everyone at their spot; later, a new agent comes in by the door
          const from = first ? spot : next.door;
          push(b, walk(next, t, act, sig, from, spot, null));
          continue;
        }
        b.key = key;
        b.leaving = false;
        b.outAt = Infinity;
        if (rebuilt && last) {
          // the world moved under it: it stands at its spot in the new room, its segment's clock kept
          push(b, { ...last, act, sig, spot, path: makePath([spot]), t: last.sig === sig ? last.t : t });
          continue;
        }
        const now = poseOf(b, t);
        push(b, walk(next, t, act, sig, now ?? spot, spot, last ? last.act.k : null));
      }

      // gone from the activities (archived): it skates off the terrace's edge
      for (const [name, b] of bims) {
        if (acts.has(name) || b.leaving) continue;
        const last = b.segs.at(-1);
        if (b.key) held.delete(b.key);
        b.key = null;
        b.leaving = true;
        const act: Activity = { k: 'done', at: 'terrace' };
        const now = rebuilt ? null : poseOf(b, t);
        const seg = walk(next, t, act, 'gone', now ?? exitOf(next), exitOf(next), last?.act.k ?? null);
        push(b, seg);
        b.outAt = t + seg.path.len / seg.speed;
      }
      for (const [name, b] of bims) if (b.leaving && b.outAt < t) bims.delete(name);

      for (const e of events) {
        if (e.kind !== 'his') continue;
        const b = bims.get(e.to);
        if (!b || b.planes.includes(e.t)) continue;
        b.planes.push(e.t);
        b.planes.sort((x, y) => x - y);
      }
      for (const b of bims.values()) b.planes = b.planes.filter((te) => te > t - PLANE_S - 60);
    },

    poseAt(name: string, t: number): Pose | null {
      const b = bims.get(name);
      return b ? poseOf(b, t) : null;
    },

    names(t: number): readonly string[] {
      return [...bims].filter(([, b]) => poseOf(b, t) !== null).map(([name]) => name);
    },

    moving(t: number): boolean {
      for (const b of bims.values()) {
        const pose = poseOf(b, t);
        if (!pose) continue;
        if (pose.moving || pose.plane) return true;
        const seg = pose.seg;
        if (seg.from !== null && t < seg.t + seg.path.len / seg.speed + SETTLE_S) return true;
      }
      return false;
    },
  };
}

/** what makes two activities the same stretch: its kind, its rank in the queue, its trip */
function sigOf(a: Activity): string {
  return `${a.k}|${a.rank === undefined ? '' : String(a.rank)}|${a.key === undefined ? '' : String(a.key)}`;
}

/** a walk from `from` (where it stands) to `spot`, at its activity's speed, capped at MAX_WALK_S */
function walk(o: Office, t: number, act: Activity, sig: string, from: { x: number; z: number }, spot: Spot, prev: Segment['from']): Segment {
  const p = path(o, from, spot);
  const base = sig === 'gone' || act.k === 'done' ? SPEED.skate : act.k === 'landing' ? SPEED.carry : act.urgent ? SPEED.hurry : SPEED.walk;
  return { t, act, sig, spot, path: p, speed: Math.max(base, p.len / MAX_WALK_S), from: prev };
}

/** a spot that belongs to the bim or to its rank (desk, main's desk, the door, the queue); null for a shared one */
function fixedSpot(o: Office, name: string, act: Activity): Spot | null {
  switch (act.at) {
    case 'desk':
      return o.desks.get(name) ?? o.door;
    case 'main':
      return o.mainDesk;
    case 'door':
      return o.door;
    case 'queue': {
      const rank = Math.max(1, act.rank ?? 1);
      const place = o.queue[rank - 1];
      if (place) return place;
      // past the queue's end: on the back corridor, in line behind the last place
      const x = Math.max(o.x0 + 1.5, (o.queue[0]?.x ?? o.mainDesk.x) - 0.5 * (rank - o.queue.length));
      return { x, z: o.crossBack, wz: o.crossBack, ax: x, face: Math.PI / 2 };
    }
    default:
      return null;
  }
}

/** the first free spot of that kind (its last one if free); all taken: standing beside one; none: null */
function sharedSpot(o: Office, at: Shared, held: ReadonlyMap<string, string>, pref: ReadonlyMap<Shared, number> | undefined): { spot: Spot; key: string; ix?: number } | null {
  const list = at === 'lounge' ? o.lounge : at === 'island' ? o.islandSpots : at === 'board' ? o.boardSpots : o.terrace;
  const free = (i: number) => !held.has(`${at}:${String(i)}`);
  const mine = pref?.get(at);
  const ix = mine !== undefined && mine < list.length && free(mine) ? mine : list.findIndex((_, i) => free(i));
  const spot = list[ix];
  if (spot) return { spot, key: `${at}:${String(ix)}`, ix };
  let k = 0;
  while (held.has(`${at}:+${String(k)}`)) k++;
  const s = list[k % list.length];
  if (!s) return null;
  return { spot: { x: s.ax, z: s.wz, wz: s.wz, ax: s.ax, face: s.face }, key: `${at}:+${String(k)}` };
}

const near = (a: { x: number; z: number }, b: { x: number; z: number }): boolean => Math.hypot(a.x - b.x, a.z - b.z) < 1e-4;

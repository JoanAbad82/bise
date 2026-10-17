// les bims: each bim's life as segments (the prototype's plan(), made live). `update` takes the
// activities of a snapshot (activity.ts) and appends a segment for each bim whose activity
// changed: it walks from where it is now (a walk cut by a new state restarts from its current
// point: no teleport, spec §1 rule 5) along the network (paths.ts) to its new spot, at the
// spec §3 speed, faster when far (no walk past MAX_WALK_S, §10). A new agent comes in by the
// door; an archived one (gone from the activities) skates off the terrace. His messages (q-planes,
// a BimEvent message from { who: 'you' }) put a paper plane on the target's pose; the agents'
// messages and reports (the hub's hub/activity, spec §6) play a coffee, a visit or a report for a
// few seconds over the row's activity (playEvents). `poseAt` / `names` / `moving` read it
// at any t. Pure: the same updates give the same poses. Spots shared by several bims (bean
// bags, island, whiteboard, deck chairs) go first come first served; past the last one, a bim
// stands beside (spec §3).
import { type Activity, type BimEvent, type Office, type Pose, QUEUE_GAP, type Segment, type Spot, type Timeline } from './model';
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
  /** a hub event it plays now (coffee, visit, report), over its row's activity until `until` */
  over: Over | null;
}

/** an event's activity over the row's: `stay` s once there; `until` set when its walk is known */
interface Over {
  act: Activity;
  stay: number;
  until: number;
}

/** seconds at the spot (spec §6): a coffee and a chat, a post-it or a tap, a sheet handed to main */
export const COFFEE_S = 6;
export const VISIT_S = 3;
export const REPORT_S = 3;
/** an event older than this when it reaches the office is not played (a late or replayed one) */
const STALE_S = 10;

/** the kinds a sender is in when it can get up for a message or a report: busy in its turn, never asking or failed */
const CAN_GO: ReadonlySet<Activity['k']> = new Set(['work', 'hot', 'nap', 'snack', 'done']);

export function newTimeline(): Timeline {
  const bims = new Map<string, Bim>();
  let office: Office | null = null;
  /** the hub events already played (an event passed again is not played twice) */
  const seen = new Set<string>();

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
    update(acts: ReadonlyMap<string, Activity>, next: Office, t: number, events: readonly BimEvent[], beds?: number): void {
      const first = office === null;
      // a room that grew (the loft's rows, its 3 columns) or another map: its world is rebuilt, every bim at its spot in it
      const rebuilt = office !== null && (office.map !== next.map || office.size !== next.size);
      office = next;
      const held = new Map<string, string>();
      for (const [name, b] of bims) if (b.key && !b.leaving) held.set(b.key, name);
      playEvents(bims, acts, events, t, seen);

      for (const [name, row] of acts) {
        let b = bims.get(name);
        if (b?.over && t >= b.over.until) b.over = null;
        const act = bedFor(b?.over?.act ?? row, b?.key ?? null, held, next.lounge.length, beds);
        const sig = sigOf(act);
        const last = b?.segs.at(-1);
        const fixed = fixedSpot(next, name, act);
        // a napper at its desk goes to a bean bag built since (bedFor): the same sig, another place
        if (b && last && !b.leaving && last.sig === sig && last.act.at === act.at && !rebuilt && (!fixed || near(fixed, last.spot))) continue;
        if (b?.key) held.delete(b.key);
        const shared = fixed ? null : sharedSpot(next, act.at as Shared, held, b?.pref);
        const spot = fixed ?? shared?.spot ?? next.door;
        const key = shared?.key ?? null;
        if (key) held.set(key, name);
        if (b && shared?.ix !== undefined) b.pref.set(act.at as Shared, shared.ix);
        if (!b) {
          b = { segs: [], key, leaving: false, outAt: Infinity, pref: new Map(), planes: [], over: null };
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
        const seg = walk(next, t, act, sig, now ?? spot, spot, last ? last.act.k : null);
        push(b, seg);
        if (b.over && b.over.act === act) b.over.until = t + seg.path.len / seg.speed + b.over.stay;
      }

      // an event whose walk wasn't made here (the room was rebuilt, the same stretch went on): it ends anyway
      for (const b of bims.values()) if (b.over && b.over.until === Infinity) b.over.until = t + MAX_WALK_S + b.over.stay;

      // gone from the activities (archived): it skates off the terrace's edge
      for (const [name, b] of bims) {
        if (acts.has(name) || b.leaving) continue;
        const last = b.segs.at(-1);
        if (b.key) held.delete(b.key);
        b.key = null;
        b.leaving = true;
        const act: Activity = { k: 'done', at: 'terrace' };
        const now = rebuilt ? null : poseOf(b, t);
        const seg = walk(next, t, act, 'gone', now ?? next.exit, next.exit, last?.act.k ?? null);
        push(b, seg);
        b.outAt = t + seg.path.len / seg.speed;
      }
      for (const [name, b] of bims) if (b.leaving && b.outAt < t) bims.delete(name);

      for (const e of events) {
        // his message (from { who: 'you' }) is a paper plane to its agent (agents' messages: playEvents)
        if (e.kind !== 'message' || e.from.who !== 'you' || e.to.who !== 'agent') continue;
        const b = bims.get(e.to.name);
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
        // an event played (a coffee, a visit, a report): the loop runs until the bim is back
        if (b.over) return true;
        const seg = pose.seg;
        if (seg.from !== null && t < seg.t + seg.path.len / seg.speed + SETTLE_S) return true;
      }
      return false;
    },
  };
}

/** what makes two activities the same stretch: its kind, its rank in the queue, its trip, the other bim of a message */
function sigOf(a: Activity): string {
  return `${a.k}|${a.rank === undefined ? '' : String(a.rank)}|${a.key === undefined ? '' : String(a.key)}|${a.with ?? ''}`;
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
      if (act.k === 'visit' && act.with !== undefined) return behind(o.desks.get(act.with) ?? o.mainDesk);
      return o.desks.get(name) ?? o.door;
    case 'main':
      return act.k === 'report' ? behind(o.mainDesk) : o.mainDesk;
    case 'door':
      return o.door;
    case 'queue': {
      const rank = Math.max(1, act.rank ?? 1);
      const place = o.queue[rank - 1];
      if (place) return place;
      // past the queue's end: in line along the map's queueMore leg, from its first end
      const [a, b] = o.queueMore;
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      const f = len > 0 ? Math.min(1, (QUEUE_GAP * (rank - o.queue.length)) / len) : 0;
      const x = a.x + (b.x - a.x) * f;
      const z = a.z + (b.z - a.z) * f;
      return { x, z, wz: z, ax: x, face: o.queue.at(-1)?.face ?? Math.PI / 2 };
    }
    default:
      return null;
  }
}

/**
 * A napper with no bean bag free at this stage (`beds`: the lounge spots that have one) naps at its
 * desk, head down: never lying in the air where a bean bag isn't built yet (his bug, bims-fix). The
 * bean bag it holds stays its own. Pure.
 */
function bedFor(act: Activity, mine: string | null, held: ReadonlyMap<string, string>, spots: number, beds: number | undefined): Activity {
  if (act.k !== 'nap' || act.at !== 'lounge') return act;
  const n = Math.min(spots, beds ?? spots);
  const free = (i: number): boolean => { const k = `lounge:${String(i)}`; return k === mine || !held.has(k); };
  for (let i = 0; i < n; i++) if (free(i)) return act;
  return { ...act, at: 'desk' };
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

/** where a visitor stands at someone's desk: on its walkway, facing the desk */
const behind = (d: Spot): Spot => ({ x: d.x, z: d.wz, wz: d.wz, ax: d.ax, face: d.face });

/**
 * The hub's events (BimEvent, spec §6), each played once: an agent's message to an idle bim = both
 * at the island for a coffee; to a busy one = the sender at its desk (a post-it if queued, a tap if
 * steer); a report = the sender at main's desk with a sheet. A bim asking you, failed or in line
 * stays put (the map never lies); his messages are planes (update). Pure: `seen` is the caller's.
 */
function playEvents(bims: Map<string, Bim>, acts: ReadonlyMap<string, Activity>, events: readonly BimEvent[], t: number, seen: Set<string>): void {
  const free = (name: string): Bim | null => {
    const b = bims.get(name);
    const k = b?.over?.act.k ?? acts.get(name)?.k;
    return b && !b.leaving && b.over === null && k !== undefined && CAN_GO.has(k) ? b : null;
  };
  for (const e of [...events].sort((x, y) => x.t - y.t)) {
    const id = e.kind === 'report' ? `r|${e.agent}|${String(e.t)}` : `m|${JSON.stringify(e.from)}|${JSON.stringify(e.to)}|${String(e.t)}`;
    if (seen.has(id) || e.t > t || t - e.t > STALE_S) continue;
    seen.add(id);
    if (e.kind === 'report') {
      const b = acts.get(e.agent)?.k === 'main' ? null : free(e.agent);
      if (b) b.over = { act: { k: 'report', at: 'main' }, stay: REPORT_S, until: Infinity };
      continue;
    }
    if (e.from.who !== 'agent' || e.to.who !== 'agent' || e.from.name === e.to.name) continue;
    const from = free(e.from.name);
    if (!from || acts.get(e.from.name)?.k === 'main') continue;
    const to = acts.get(e.to.name)?.k;
    const idle = to === 'nap' || to === 'snack';
    const other = idle ? free(e.to.name) : null;
    if (other) {
      from.over = { act: { k: 'coffee', at: 'island', with: e.to.name }, stay: COFFEE_S, until: Infinity };
      other.over = { act: { k: 'coffee', at: 'island', with: e.from.name }, stay: COFFEE_S, until: Infinity };
    } else if (e.mode !== 'unknown' && to !== undefined) {
      from.over = { act: { k: 'visit', at: 'desk', with: e.to.name, mode: e.mode }, stay: VISIT_S, until: Infinity };
    }
  }
  if (seen.size > 500) for (const k of [...seen].slice(0, seen.size - 500)) seen.delete(k);
}

const near = (a: { x: number; z: number }, b: { x: number; z: number }): boolean => Math.hypot(a.x - b.x, a.z - b.z) < 1e-4;

// les bims: what the overlay shows over each bim at t (the spec's §2). Nothing at rest; the hover
// card (its name, its state, its title: Office.tsx lays it out on lines); the name alone while it walks or while ctrl is held; name + 2-3
// words for EVENT_S after an event (an activity change, read from the pose's segment: seg.from,
// seg.t), at most EVENT_SLOTS at once, the newest first and the others after, in turn; the '?'
// pink / '✗' red pill always, without a name. Pure: frames in, labels out; the fades are the
// overlay's. His paper planes and BimEvents get no label (the plane is the shape, §1 rule 4).
import { bims } from '@/proto/words_bims.gen';
import type { Agent } from '@/proto';
import { ordinal } from '@/scheduled/model';
import { shortAge } from '@/agents/model';
import type { Activity, ActivityKind, BimFrame, Label, LabelsFn, Segment } from './model';
import { trickNow, type TrickKey } from './skate';

/** how long an event label shows (s) */
export const EVENT_S = 3;
/** how many event labels show at once */
export const EVENT_SLOTS = 3;

/** office life: never an event (rule 1: it's no news) */
// office life, and the hub's message/report events: their shape is the event (spec §1 rule 4), no label
const DECOR: ReadonlySet<ActivityKind> = new Set(['nap', 'snack', 'coffee', 'visit', 'report']);
/** main's plain turns: no label at rest, so no event either */
const MAIN_PLAIN: ReadonlySet<ActivityKind> = new Set(['main', 'mainidle']);

/** whether a segment's start is news worth a label */
export function isEvent(seg: Segment): boolean {
  const k = seg.act.k;
  if (seg.from === null) return k === 'starting';
  if (DECOR.has(k)) return false;
  if (MAIN_PLAIN.has(k) && MAIN_PLAIN.has(seg.from)) return false;
  if (k === seg.from) return k === 'landing' && seg.act.rank === 1;
  return true;
}

/** an event's 2-3 words, after the name (`done`, `waits on signup-perf`) */
export function eventWords(act: Activity, from: ActivityKind | null): string {
  switch (act.k) {
    case 'starting':
      return bims.ev_started;
    case 'work':
    case 'main':
      return bims.working;
    case 'hot':
      return bims.ev_running_hot;
    case 'sleep':
      return bims.waiting;
    case 'waitagent':
      return bims.ev_waits_on({ agent: act.on ?? '' });
    case 'asks':
      return bims.asks_you;
    case 'landing':
      return act.rank === 1 ? bims.landing : bims.ev_in_line;
    case 'done':
      return from === 'landing' ? bims.ev_landed : bims.done;
    case 'failed':
      return bims.failed;
    case 'blocked':
      return bims.blocked;
    case 'stopped':
      return bims.ev_stopped;
    case 'mainidle':
      return bims.idle;
    case 'nap':
    case 'snack':
    case 'coffee':
    case 'visit':
    case 'report':
      return '';
  }
}

/**
 * The hover tip's state, between the name and the title: the state the row says, never the scene
 * (designer m_27605: office life never reaches a word). `watch`: the name of the first watch it
 * sleeps on (`cargo test`), '' for none.
 */
export function stateWords(act: Activity, watch = ''): string {
  switch (act.k) {
    case 'work':
    case 'main':
      return bims.working;
    case 'hot':
      return bims.state_hot;
    case 'sleep':
      return watch ? bims.state_waiting_for({ what: watch }) : bims.waiting;
    case 'waitagent':
      return bims.state_waits_on({ agent: act.on ?? '' });
    case 'nap':
    case 'snack':
    case 'mainidle':
      return bims.idle;
    case 'asks':
      return act.urgent ? bims.state_urgent : bims.asks_you;
    case 'blocked':
      return bims.blocked;
    case 'failed':
      return bims.failed;
    case 'landing':
      return act.rank === 1 || act.rank == null ? bims.landing : bims.state_in_line({ nth: ordinal(act.rank) });
    case 'done':
      return bims.done;
    case 'stopped':
      return bims.state_stopped;
    case 'starting':
      return bims.state_starting;
    // a message or a report in flight: the sender is in its turn, the receiver of a message wakes to it
    case 'coffee':
    case 'visit':
    case 'report':
      return bims.working;
  }
}

/** a trick's name over a followed skater (skate.ts keeps keys, the words are here) */
export function trickWords(k: TrickKey): string {
  const W: Readonly<Record<TrickKey, string>> = {
    drop_in: bims.trick_drop_in, pump: bims.trick_pump, rock_to_fakie: bims.trick_rock_to_fakie, axle_stall: bims.trick_axle_stall,
    fs_180: bims.trick_fs_180, bs_180: bims.trick_bs_180, ollie: bims.trick_ollie, kickflip: bims.trick_kickflip,
    heelflip: bims.trick_heelflip, shove_it: bims.trick_shove_it, tre_flip: bims.trick_tre_flip, fifty: bims.trick_fifty,
    five_o: bims.trick_five_o, boardslide: bims.trick_boardslide, nosegrind: bims.trick_nosegrind, manual: bims.trick_manual,
    no_comply: bims.trick_no_comply, carve: bims.trick_carve, fs_air: bims.trick_fs_air, nine: bims.trick_nine,
  };
  return W[k];
}

/** the pill a bim wears whatever else shows: '?' asks you, '✗' failed */
export function pillOf(act: Activity): Label['pill'] {
  return act.k === 'asks' ? 'asks' : act.k === 'failed' ? 'failed' : null;
}

/**
 * The event labels showing at t, by name: each current event (its segment's start) gets an
 * EVENT_S window in one of EVENT_SLOTS slots, the newest first, from its own start or when a slot
 * frees. An event whose segment was replaced is gone with it.
 */
export function eventsShowing(frames: readonly BimFrame[], t: number): ReadonlySet<string> {
  const evs = frames
    .filter((b) => b.pose.seg.t <= t && isEvent(b.pose.seg))
    .map((b) => ({ name: b.name, at: b.pose.seg.t }))
    .sort((a, b) => b.at - a.at || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const free = Array.from({ length: EVENT_SLOTS }, () => -Infinity);
  const out = new Set<string>();
  for (const e of evs) {
    let i = 0;
    for (let j = 1; j < free.length; j++) if ((free[j] ?? 0) < (free[i] ?? 0)) i = j;
    const start = Math.max(e.at, free[i] ?? -Infinity);
    free[i] = start + EVENT_S;
    if (start <= t && t < start + EVENT_S) out.add(e.name);
  }
  return out;
}

/** labelsOf (model.ts LabelsFn): the label over each bim that has one at t */
export const labelsOf: LabelsFn = (frames, o) => {
  const rows = new Map<string, Agent>(o.agents.map((a) => [a.name, a]));
  const events = eventsShowing(frames, o.t);
  const out = new Map<string, Label>();
  for (const b of frames) {
    const { act, from } = b.pose.seg;
    const pill = pillOf(act);
    const at = (mode: Label['mode'], words: string, title = ''): void => void out.set(b.name, { name: b.name, mode, words, title, pill });
    const trick = o.follow === b.name ? trickNow(b.name, b.pose, o.park) : null;
    const poked = o.pokes?.get(b.name);
    // his poke plays: its word in the label's place, the card steps aside (the '?' / '✗' pill stays)
    if (poked !== undefined) {
      if (poked !== '') at('egg', poked);
      else if (pill) at('pill', '');
    } else if (o.hover === b.name) {
      const row = rows.get(b.name);
      // a skater (skate.ts): how long it has been idle, and what it does with it
      const words = b.pose.seg.pastime && row ? bims.state_skating({ dur: shortAge(o.t * 1000 - row.since_ms) }) : stateWords(act, row?.watching[0]?.what ?? '');
      at('hover', words, row?.title ?? '');
    } else if (events.has(b.name)) at('event', eventWords(act, from));
    else if (trick !== null) at('egg', trickWords(trick));
    else if (o.eggs?.has(b.name) === true) at('egg', o.eggs.get(b.name) ?? '');
    else if (o.held || (b.pose.moving && !b.main)) at('name', '');
    else if (pill) at('pill', '');
  }
  return out;
};

// The demo's guided tips (bar L25 / S37, the TUI's tour.rs, BISE-286): while bise's built-in demo
// runs (prompts/skills/bise-demo), a tip at each step says what to press, so he does things
// instead of reading a recap. Pure: the screens that show the tip (the agents list, a demo agent's
// thread, the inbox: amb-win's and amb-home's) build a Snap from the store and keep one Tour; a new
// state goes through observe(), his send through sent(), and tip()/tipText() say what to show.
// No timeout: each tip waits for its action. Owner: amb-kit (src/setup).
//
//   1 start   the agents appear: at the first one. Goes when he looks inside one.
//   2 inside  inside a demo agent: at the top of its thread. Goes when he is back in main.
//   3 card    a card is in the inbox: above it. Goes when answered.
//   4 steer   once answered, the last agent waits for a word from him: at its row. Goes when he
//             leaves its thread after writing to it.
//   5 end     a demo agent is archived (main dropped it). Goes when he opens the agent list
//             (the palette) or another demo agent.
// Any tip goes when he sends a message (its step counts as done).

import { settings } from '@/proto/words.gen';

/** How a demo agent's objective starts (the bise-demo skill's spawns). */
export const MARK = 'bise demo';

/** `objective` is a demo agent's. */
export function isDemo(objective: string): boolean {
  return objective.trimStart().toLowerCase().startsWith(MARK);
}

/** A demo agent as the window sees it. */
export interface Member {
  name: string;
  /** its ⌥ number in the list (live ones) */
  number?: number | null;
  archived: boolean;
}

/** What the tour looks at, read from the store. */
export interface Snap {
  /** the demo agents, in the hub's (creation) order */
  members: readonly Member[];
  /** the thread in view (an agent's name; main's is 'main') */
  focus: string;
  /** a card of the hub waits in the inbox, and who it is about */
  card: string | null;
  /** the agent list (the palette) is open */
  palette: boolean;
}

export type Tip = 'start' | 'inside' | 'card' | 'steer' | 'end';

/** The tour's progress (immutable: every step returns a new one). */
export interface Tour {
  /** the demo agents seen so far (null before the first state) */
  readonly known: readonly string[] | null;
  /** this run's agents: the ones that appeared since it started */
  readonly run: readonly string[];
  readonly on: boolean;
  readonly opened: boolean;
  readonly back: boolean;
  readonly cardSeen: boolean;
  readonly cardDone: boolean;
  readonly steered: boolean;
  readonly steerDone: boolean;
  /** a demo agent was archived: the end; the thread in view then */
  readonly ended: string | null;
}

export const TOUR: Tour = { known: null, run: [], on: false, opened: false, back: false, cardSeen: false, cardDone: false, steered: false, steerDone: false, ended: null };

const live = (s: Snap): Member[] => s.members.filter((m) => !m.archived);
const inside = (s: Snap): Member | undefined => live(s).find((m) => m.name === s.focus);
/** who waits for a word from him: the last demo agent spawned */
const target = (s: Snap): Member | undefined => live(s).at(-1);

/** `s` with this run's agents only (an earlier demo's, left idle or archived, are not part of it). */
export function scoped(t: Tour, s: Snap): Snap {
  return { ...s, members: s.members.filter((m) => t.run.includes(m.name)) };
}

/** A new state: start, move on, or end the tour. A window opened during a demo shows none. */
export function observe(t0: Tour, all: Snap): Tour {
  const names = all.members.map((m) => m.name);
  if (t0.known === null) return { ...t0, known: names };
  const fresh = live(all).filter((m) => !(t0.known ?? []).includes(m.name)).map((m) => m.name);
  const known = [...t0.known, ...names.filter((n) => !(t0.known ?? []).includes(n))];
  let t: Tour = { ...t0, known };
  if (fresh.length > 0 && !t.on) t = { ...TOUR, known, on: true };
  if (!t.on) return t;
  t = { ...t, run: [...t.run, ...fresh] };
  const s = scoped(t, all);
  if (live(s).length === 0) return { ...t, on: false };
  const inn = inside(s)?.name ?? null;
  if (inn !== null) t = { ...t, opened: true };
  else if (t.opened) t = { ...t, back: true };
  if (s.card !== null) t = { ...t, cardSeen: true };
  else if (t.cardSeen) t = { ...t, cardDone: true };
  const tg = target(s);
  if (t.steered && (tg === undefined || tg.name !== s.focus)) t = { ...t, steerDone: true };
  if (t.ended === null && s.members.some((m) => m.archived)) t = { ...t, ended: s.focus };
  if (t.ended !== null && (s.palette || (inn !== null && inn !== t.ended))) t = { ...t, on: false };
  return t;
}

/** The tip to show now, or none. */
export function tip(t: Tour, all: Snap): Tip | null {
  if (!t.on) return null;
  const s = scoped(t, all);
  // a card still open comes first, even at the end (a quick main can drop one before he answered)
  const card = s.card !== null && !t.cardDone;
  if (t.ended !== null) return card && inside(s) === undefined ? 'card' : 'end';
  const steer = t.cardDone && !t.steerDone && target(s) !== undefined;
  const m = inside(s);
  if (m !== undefined) {
    if (!t.back) return 'inside';
    return target(s)?.name === m.name && steer ? 'steer' : null;
  }
  if (card) return 'card';
  if (!t.opened) return 'start';
  return t.back && steer ? 'steer' : null;
}

/** He sent a message: the tip up goes (its step counts as done); writing in the target's thread is the steer. */
export function sent(t0: Tour, all: Snap): Tour {
  const s = scoped(t0, all);
  const atTarget = target(s)?.name === s.focus;
  let t = t0;
  switch (tip(t0, all)) {
    case 'start':
      t = { ...t, opened: true, back: true };
      break;
    case 'inside':
      t = { ...t, back: true };
      break;
    case 'card':
      t = { ...t, cardDone: true };
      break;
    case 'steer':
      t = atTarget ? { ...t, steered: true } : { ...t, steerDone: true };
      break;
    case 'end':
      t = { ...t, on: false };
      break;
    case null:
      break;
  }
  if (atTarget && t.back) t = { ...t, steered: true };
  return t;
}

/** A part of a tip's words: plain text, or a key to draw as a key. */
export type TipPart = string | { key: string };

// The words are bise_proto's (words::settings tour_*, the TUI's tour.rs reads them too): a key is a
// marked hole (KEY…KEY, drawn as a key), and a hole holding a sub-template (how, rest) is its own
// parts (PART on both sides). tipParts cuts the filled words there and drops the empty pieces.
const KEY = '\uE000';
const PART = '\uE001';
const mark = (key: string): string => `${KEY}${key}${KEY}`;
const part = (words: string): string => `${PART}${words}${PART}`;

/** Filled words -> their parts: the text between the marks, the marked keys as keys. Pure. */
export function tipParts(words: string): TipPart[] {
  return words
    .split(PART)
    .flatMap((piece) => piece.split(KEY).map((p, i): TipPart | null => (i % 2 === 1 ? { key: p } : p === '' ? null : p)))
    .filter((p): p is TipPart => p !== null);
}

const keyOf = (m: Member): string => (m.number != null ? mark(`⌥${String(m.number)}`) : '');
const keysOf = (ms: readonly Member[]): string => ms.map((m, i) => (i > 0 && m.number != null ? ` ${keyOf(m)}` : keyOf(m))).join('');

/** The words of a tip, the TUI's, with ⌘ for the Mac where the TUI says ctrl. */
export function tipText(t: Tip, all: Snap): TipPart[] {
  const s = all;
  const liveM = live(s);
  switch (t) {
    case 'start': {
      const m = liveM[0];
      if (m === undefined) return [];
      const k = keyOf(m);
      return tipParts(settings.tour_start({ key: k !== '' ? k : mark('⌘K'), name: m.name }));
    }
    case 'inside': {
      const others = keysOf(liveM.filter((m) => m.name !== s.focus));
      return tipParts(settings.tour_inside({ name: s.focus, others: others !== '' ? settings.tour_others({ keys: others }) : '', esc: mark('esc') }));
    }
    case 'card': {
      const who = s.card !== null && liveM.some((m) => m.name === s.card) ? s.card : settings.tour_your_team;
      return tipParts(settings.tour_card({ who, key: mark('⌘I'), one: mark('1'), two: mark('2') }));
    }
    case 'steer': {
      const m = target(s);
      if (m === undefined) return [];
      const how = s.focus === m.name || keyOf(m) === '' ? '' : settings.tour_steer_how({ key: keyOf(m) });
      return tipParts(settings.tour_steer({ name: m.name, how: part(how), enter: mark('⏎'), got: '✓', read: '✓✓' }));
    }
    case 'end': {
      const gone = s.members.find((m) => m.archived)?.name ?? settings.tour_it;
      const keys = keysOf(liveM);
      const rest =
        liveM.length === 0
          ? ''
          : liveM.length === 1
            ? settings.tour_end_one({ keys, name: liveM[0]?.name ?? '' })
            : liveM.length === 2
              ? settings.tour_end_two({ keys })
              : settings.tour_end_more({ keys });
      return tipParts(settings.tour_end({ gone, key: mark('⌘K'), rest: part(rest) }));
    }
  }
}

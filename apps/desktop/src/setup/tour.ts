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

const keyOf = (m: Member): TipPart[] => (m.number != null ? [{ key: `⌥${String(m.number)}` }] : []);
const keysOf = (ms: readonly Member[]): TipPart[] => ms.flatMap((m, i) => (i > 0 && m.number != null ? [' ', ...keyOf(m)] : keyOf(m)));

/** The words of a tip, the TUI's, with ⌘ for the Mac where the TUI says ctrl. */
export function tipText(t: Tip, all: Snap): TipPart[] {
  const s = all;
  const liveM = live(s);
  switch (t) {
    case 'start': {
      const m = liveM[0];
      if (m === undefined) return [];
      const k = keyOf(m);
      return ['your team just started. they work on their own. ', ...(k.length > 0 ? k : [{ key: '⌘K' }]), ` looks inside ${m.name}. →`];
    }
    case 'inside': {
      const others = keysOf(liveM.filter((m) => m.name !== s.focus));
      return [`this is ${s.focus}'s own thread, live. `, ...(others.length > 0 ? [...others, ' the others · '] : []), { key: 'esc' }, ' back to main.'];
    }
    case 'card': {
      const who = s.card !== null && liveM.some((m) => m.name === s.card) ? s.card : 'your team';
      return [`${who} needs you. `, { key: '⌘I' }, ' opens the question, ', { key: '1' }, ' or ', { key: '2' }, ' answers. ↓'];
    }
    case 'steer': {
      const m = target(s);
      if (m === undefined) return [];
      const how = s.focus === m.name ? [] : [...keyOf(m), ...(keyOf(m).length > 0 ? [', '] : [])];
      return [`${m.name} waits for a word from you: `, ...how, 'type, ', { key: '⏎' }, '. ✓ it got it, ✓✓ it read it.'];
    }
    case 'end': {
      const gone = s.members.find((m) => m.archived)?.name ?? 'it';
      const rest: TipPart[] =
        liveM.length === 0
          ? []
          : liveM.length === 1
            ? [' ', ...keysOf(liveM), ` opens ${liveM[0]?.name ?? ''}.`]
            : [' ', ...keysOf(liveM), liveM.length === 2 ? ' open the other two.' : ' open the others.'];
      return [`that's it. ${gone} is archived: `, { key: '⌘K' }, ' finds it.', ...rest];
    }
  }
}

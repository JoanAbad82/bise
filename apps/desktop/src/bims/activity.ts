// les bims: one agent row -> where its bim is and what it does (the spec's §4, the [a] lines and Agent.doing:
// rows.ts fields, never a thread's words). Pure: the same row, snapshot and t give the same
// activity, so a timeline computed ahead replays. Rule 1 (the map never lies): only an idle bim
// goes for office life (nap / snack); a busy one stays at its desk. `doing` is the hub's
// Agent.doing (bims-facts, typed): a working bim's pose, the whiteboard for think. An archived agent
// has no bim: the caller leaves it out.
import type { Agent, DoingKind } from '@/proto';
import type { Activity, Snapshot } from './model';

/** a turn longer than this runs hot (sweat, steam): the spec's 10 min, to tune */
export const HOT_MS = 10 * 60_000;
/** office life (§7): one trip every SNACK_EVERY..SNACK_EVERY+SNACK_SPREAD s per bim, SNACK_S s long */
export const SNACK_EVERY = 30;
export const SNACK_SPREAD = 31;
export const SNACK_S = 6;

/** FNV-1a of a name: the bim's own rhythm, the same on every run */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * An idle bim at time t (s): in its bean bag, or on a snack trip to the island. Each bim has its
 * own cycle (30-60 s, from its name) and phase; trip n's fruit comes from the name and n.
 */
export function idleLife(name: string, t: number): Activity {
  const h = hash(name);
  const cyc = SNACK_EVERY + (h % SNACK_SPREAD);
  const at = t + (h % cyc);
  const n = Math.floor(at / cyc);
  if (at - n * cyc < SNACK_S) return { k: 'snack', at: 'island', key: n, fruit: (h + n) % 3 };
  return { k: 'nap', at: 'lounge' };
}

/**
 * The activity of `a` in `s` at time t (s), first rule that holds: stopped, done, failed, asks
 * you (its cards, `waits`, `waiting_on` you), in the land queue, starting, main, working (hot
 * past HOT_MS), blocked, waits on an agent, waits on a watch, idle with a watch, idle.
 */
export function activity(a: Agent, s: Snapshot, t: number): Activity {
  const desk = a.main ? 'main' : 'desk';
  if (a.phase === 'stopped') return { k: 'stopped', at: desk };
  if (a.status === 'done') return { k: 'done', at: 'terrace' };
  if (a.status === 'failed') return { k: 'failed', at: desk };
  const cards = s.cards.filter((c) => c.agent === a.name);
  if (a.waits > 0 || a.waiting_on?.who === 'you' || cards.length > 0) {
    return cards.some((c) => c.urgent) ? { k: 'asks', at: desk, urgent: true } : { k: 'asks', at: desk };
  }
  if (!a.main) {
    const rank = s.places.find((p) => p.id === a.place_id)?.landing;
    if (rank != null && rank > 0) return { k: 'landing', at: 'queue', rank };
  }
  if (a.phase === 'starting') return { k: 'starting', at: a.main ? 'main' : 'door' };
  const doing = a.doing?.kind;
  if (a.main) return a.status === 'working' ? withDoing({ k: 'main', at: 'main' }, doing, false) : { k: 'mainidle', at: 'main' };
  if (a.status === 'working') return withDoing((a.turn_ms ?? 0) > HOT_MS ? { k: 'hot', at: 'desk' } : { k: 'work', at: 'desk' }, doing, true);
  if (a.status === 'blocked') return { k: 'blocked', at: 'desk' };
  if (a.waiting_on?.who === 'agent') return { k: 'waitagent', at: 'desk', on: a.waiting_on.name };
  // paused on a backgrounded command that still runs: the hub says build (arms crossed, a progress bar), not asleep
  if (doing === 'build') return { k: 'work', at: 'desk', doing };
  if (a.status === 'waiting' || a.watching.length > 0) return { k: 'sleep', at: 'desk' };
  return idleLife(a.name, t);
}

/**
 * A working bim's activity with what its turn does (the hub's Agent.doing, spec §4 [t]): the
 * renderer poses it; thinking goes to the whiteboard (`board`), except main, who stays at his desk.
 */
function withDoing(act: Activity, doing: DoingKind | undefined, board: boolean): Activity {
  if (doing === undefined) return act;
  return { ...act, doing, ...(doing === 'think' && board ? { at: 'board' as const } : {}) };
}

/** every live agent's activity at t, by name (archived agents have no bim) */
export function activities(s: Snapshot, t: number): ReadonlyMap<string, Activity> {
  const out = new Map<string, Activity>();
  for (const a of s.agents) if (!a.archived) out.set(a.name, activity(a, s, t));
  return out;
}

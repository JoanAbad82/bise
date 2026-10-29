// bise's routing hold, as the thread's pending row shows it (bar ⛔3,
// lead m_9854): his words to bise go to the project bise picks, and he has
// 2 s to change it. Owner: amb-win.
//
// The hub sends `route {rid, to, name, text, correct_until_ms, why}` (again
// after a correction, same rid) then `route_done {rid, state, to, msg}`; both are
// one-shot events the store doesn't keep (store.ts: "read through
// onEvent"), so this module keeps, per store, which of his sends each hold
// is: the oldest pending send of bise's thread (home project, main) with the
// same words and no hold yet. View state only: nothing here decides where
// his words go (the hub does; the row only sends route_cancel/route_correct).
import { useMemo, useSyncExternalStore } from 'react';
import { threadKey, type Store, type EvOf } from '@/store';

export interface Hold {
  readonly rid: number;
  /** bise's thread (the home project's main) */
  readonly key: string;
  readonly cid: number;
  /** the home hub, where route_cancel / route_correct go */
  readonly home: string;
  readonly to: string;
  readonly name: string;
  readonly why: string;
  readonly until: number;
  readonly state: 'held' | 'sent' | 'cancelled';
}

type Pend = { readonly cid: number; readonly text: string };

/** The routes as they come, applied to the holds. Pure, exported for the tests. */
export function applyRoute(holds: readonly Hold[], ev: EvOf<'route'> | EvOf<'route_done'>, pending: readonly Pend[]): Hold[] {
  const i = holds.findIndex((h) => h.rid === ev.rid && h.home === ev.project);
  if (ev.ev === 'route_done') {
    if (i < 0) return [...holds];
    const h = holds[i];
    if (h === undefined) return [...holds];
    const next: Hold = { ...h, to: ev.to, state: ev.state === 'sent' ? 'sent' : 'cancelled' };
    return holds.map((x, j) => (j === i ? next : x));
  }
  const old = i >= 0 ? holds[i] : undefined;
  if (old !== undefined) {
    // a correction: same rid, the new project
    const next: Hold = { ...old, to: ev.to, name: ev.name, why: ev.why, until: ev.correct_until_ms };
    return holds.map((x, j) => (j === i ? next : x));
  }
  const bound = new Set(holds.filter((h) => h.home === ev.project).map((h) => h.cid));
  const p = pending.find((x) => !bound.has(x.cid) && x.text.trim() === ev.text.trim());
  if (p === undefined) return [...holds];
  return [...holds, { rid: ev.rid, key: threadKey(ev.project, 'main'), cid: p.cid, home: ev.project, to: ev.to, name: ev.name, why: ev.why, until: ev.correct_until_ms, state: 'held' }];
}

/**
 * A route's end as the answer for his pending send (the window-local 'sent', echo.ts; the send's
 * own answer said 'routed' and kept the row): sent, his message in bise's main with its id (made);
 * cancelled, the row goes (sb-core says his words to main as a new message, its 'you' entry shows
 * them; docs/issues/33 gives it that message's id). Null: not an end, a route of no row, or a
 * sent one without its id (an older hub: the row says 'sent to'). Pure.
 */
export function settleOf(
  holds: readonly Hold[],
  ev: EvOf<'route'> | EvOf<'route_done'>,
): { ev: 'sent'; project: string; agent: 'main'; cid: number; msg_id: number | null; reason: 'made' | null } | null {
  if (ev.ev !== 'route_done') return null;
  const h = holds.find((x) => x.rid === ev.rid && x.home === ev.project);
  if (h === undefined) return null;
  const at = { ev: 'sent', project: ev.project, agent: 'main', cid: h.cid } as const;
  if (ev.state !== 'sent') return { ...at, msg_id: null, reason: null };
  return typeof ev.msg === 'number' ? { ...at, msg_id: ev.msg, reason: 'made' } : null;
}

interface Tracker {
  holds: readonly Hold[];
  listeners: Set<() => void>;
}

const trackers = new WeakMap<Store, Tracker>();

function trackerOf(store: Store): Tracker {
  let t = trackers.get(store);
  if (t !== undefined) return t;
  const tr: Tracker = { holds: [], listeners: new Set() };
  store.onEvent((ev) => {
    if (ev.ev !== 'route' && ev.ev !== 'route_done') return;
    const pending = store.pending(threadKey(ev.project, 'main'));
    const next = applyRoute(tr.holds, ev, pending);
    // the last 50 are enough for any thread on screen
    tr.holds = next.slice(-50);
    for (const l of [...tr.listeners]) l();
    // sent: his message in bise's main has its id now (the send's own answer had none: the
    // hub makes it when the route fires), so its pending row meets its 'you' entry by that id
    // and leaves (the entry says 'sent to <project>'), never a bubble stuck under the thread
    const settle = settleOf(next, ev);
    if (settle !== null) store.apply(settle);
  });
  trackers.set(store, tr);
  t = tr;
  return t;
}

function useHolds(store: Store): readonly Hold[] {
  const t = trackerOf(store);
  return useSyncExternalStore(
    (l) => {
      t.listeners.add(l);
      return () => t.listeners.delete(l);
    },
    () => t.holds,
  );
}

/** The hold of one pending send, if bise is routing it. */
export function useHoldOf(store: Store, key: string, cid: number): Hold | undefined {
  return useHolds(store).find((h) => h.key === key && h.cid === cid);
}

/** Every hold of a thread's sends, cancelled ones too (the tail keeps those rows: sendInThread). */
export function useHoldsOf(store: Store, key: string): readonly Hold[] {
  const all = useHolds(store);
  return useMemo(() => all.filter((h) => h.key === key), [all, key]);
}

/** The thread's route still held (esc keeps it with bise). */
export function useHeld(store: Store, key: string): Hold | undefined {
  return useHolds(store).find((h) => h.key === key && h.state === 'held');
}

/** Start listening before the first send (the thread screen calls it on mount). */
export function trackRoutes(store: Store): void {
  trackerOf(store);
}

// The order a pin holds under his pointer (artifact-pin, designer m_49505; his m_49499: « quand je
// clique j'ai pas de feedback »): a click on a row's hover pin (pinbutton.tsx) flips its state at
// once, but the list it is in keeps its order while the pointer is in that list's card (`scope`),
// so the row he clicked stays under his pointer showing its new state. When the pointer leaves the
// card the hold ends: the lists re-sort, and each row that changed place slides there (160 ms
// ease-out as side-sort's, calm.ts SLIDE_MS; none under reduced motion). A keyboard click holds
// nothing. The lists order by `usePinOrder` (the pins as they were before his held clicks), and
// show the state by `usePins` (pins.ts). Holds are window state, never saved. The agents' lines
// hold their own order already (useCalm). Owner: nm-frame.
import { useLayoutEffect, useMemo, useSyncExternalStore } from 'react';
import { reducedMotion } from '@/ds/hooks';
import { SLIDE_MS } from './side3d/calm';
import { usePins, type PinKind, type PinSet } from './pins';

/** One held click: the thing he pinned or unpinned and its state before. */
export interface Hold {
  readonly kind: PinKind;
  readonly project: string;
  readonly id: string;
  /** pinned before his click */
  readonly was: boolean;
}

/** The pins a list orders by: `set` with each held thing of `kind` as it was before his click. Pure. */
export function heldSet(set: PinSet, holds: readonly Hold[], kind: PinKind): PinSet {
  const mine = holds.filter((h) => h.kind === kind);
  if (mine.length === 0) return set;
  const out = new Map(set);
  for (const h of mine) {
    const ids = out.get(h.project) ?? [];
    const without = ids.filter((x) => x !== h.id);
    // a pinned one before goes back to its place in the pin order when it is there, else at the end
    const back = h.was ? (ids.includes(h.id) ? ids : [...without, h.id]) : without;
    if (back.length === 0) out.delete(h.project);
    else out.set(h.project, back);
  }
  return out;
}

/** The pin rows' slides: each key that moved, by how many px it starts from its old place. Pure. */
export function slidesOf(was: ReadonlyMap<string, number>, now: ReadonlyMap<string, number>): Map<string, number> {
  const out = new Map<string, number>();
  for (const [k, top] of now) {
    const a = was.get(k);
    if (a !== undefined && a !== top) out.set(k, a - top);
  }
  return out;
}

interface Held extends Hold {
  readonly scope: Element;
}

let holds: readonly Held[] = [];
const subs = new Set<() => void>();
/** the rows' tops in a scope whose hold just ended, slid by the next commit */
let pending: { readonly scope: Element; readonly tops: Map<string, number> } | null = null;

const notify = () => {
  for (const fn of [...subs]) fn();
};

/** The rows that carry a hover pin in `scope`: the pin's key, its row (the pin's parent). */
function pinRows(scope: Element): Map<string, HTMLElement> {
  const out = new Map<string, HTMLElement>();
  for (const el of scope.querySelectorAll<HTMLElement>('[data-pin-key]')) {
    const row = el.parentElement;
    if (row !== null) out.set(el.dataset.pinKey ?? '', row);
  }
  return out;
}

const topsIn = (scope: Element): Map<string, number> =>
  new Map([...pinRows(scope)].map(([k, r]) => [k, r.getBoundingClientRect().top]));

/** Ends the holds of `scope`: the lists re-sort on the next render, slid from where the rows are now. */
function release(scope: Element): void {
  if (!holds.some((h) => h.scope === scope)) return;
  pending = { scope, tops: topsIn(scope) };
  holds = holds.filter((h) => h.scope !== scope);
  notify();
}

/** Where a row's hold lasts: its card (the outer card, a float), else the row itself. */
export function scopeOf(el: Element): Element {
  return el.closest('.s3-outer, .s3-card') ?? el.closest('.s3-row, .s3-orow') ?? el;
}

/**
 * Holds the order of `h`'s lists while the pointer is in `scope` (a click with the pointer). A
 * second click on the same thing keeps the first one's state before.
 */
export function holdPin(h: Hold, scope: Element): void {
  const same = (x: Hold) => x.kind === h.kind && x.project === h.project && x.id === h.id;
  const first = holds.find(same);
  holds = [...holds.filter((x) => !same(x)), { ...(first ?? h), scope }];
  if (first === undefined || first.scope !== scope) {
    scope.addEventListener('pointerleave', () => {
      release(scope);
    }, { once: true });
  }
  notify();
}

/** Drops the hold of one thing (its pin did not save: it is back as it was). */
export function unholdPin(kind: PinKind, project: string, id: string): void {
  const next = holds.filter((x) => !(x.kind === kind && x.project === project && x.id === id));
  if (next.length === holds.length) return;
  holds = next;
  notify();
}

const subscribe = (fn: () => void) => {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
};
const snapshot = () => holds;

/** One kind's pins to order a list by: the pins now, each held click as before it (module header). */
export function usePinOrder(kind: PinKind): PinSet {
  const live = usePins(kind);
  const all = useSyncExternalStore(subscribe, snapshot, snapshot);
  // a hold whose card went (a float closed) holds nothing
  const set = useMemo(() => heldSet(live, all.filter((h) => h.scope.isConnected), kind), [live, all, kind]);
  useLayoutEffect(() => {
    const p = pending;
    if (p === null) return;
    pending = null;
    if (!p.scope.isConnected || reducedMotion()) return;
    const rows = pinRows(p.scope);
    for (const [k, dy] of slidesOf(p.tops, topsIn(p.scope))) {
      const r = rows.get(k);
      if (r === undefined || typeof r.animate !== 'function') continue;
      r.animate([{ transform: `translateY(${String(dy)}px)` }, { transform: 'translateY(0)' }], { duration: SLIDE_MS, easing: 'ease-out' });
    }
  }, [set]);
  return set;
}

/** @internal tests: no hold left */
export function resetHolds(): void {
  holds = [];
  pending = null;
  notify();
}

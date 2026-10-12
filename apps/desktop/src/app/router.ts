// The router: the current route and his way back and forward, like a
// browser (designer's desktop-history: ‹ › in the titlebar and their menu,
// ⌘[ ⌘], the mouse's side buttons, esc up the hierarchy in esc-up.ts).
// Owner: amb-win; the history part amb-web (m_19808). The route lives here
// and nowhere else; screens read it with useRoute() and move with go(). A
// move to the route already shown does nothing (no new history step, no
// listener call), so a deep link sent twice never stacks. 50 places per
// window; App.tsx keeps the stack in the window's sessionStorage, so a
// reload gives it back and a relaunch starts fresh.
import { createContext, useContext, useSyncExternalStore } from 'react';
import { formatRoute, parseRoute, type Route, sameRoute } from './route';

export type Side = 'back' | 'forward';

export interface Router {
  get(): Route;
  /** show `r`; a new step of his history (the forward steps go), or in place of this one when only a section changes (stepOf) */
  go(r: Route): void;
  /** show `r` in place of the current step: no new step, the forward ones stay */
  replace(r: Route): void;
  back(): void;
  forward(): void;
  /** `n` steps on that side at once (the ‹ › menu's rows: 1 is the nearest) */
  jump(side: Side, n: number): void;
  canBack(): boolean;
  canForward(): boolean;
  /** the places on that side, the nearest first, at most `max` (the ‹ › menu, 10) */
  places(side: Side, max: number): Route[];
  /** the stack as strings, for the window's session (sessionStorage: a reload keeps it, a relaunch does not) */
  saved(): SavedHistory;
  subscribe(listener: () => void): () => void;
}

/** The stack as its route strings: what a reload gives back. */
export interface SavedHistory {
  past: string[];
  now: string;
  future: string[];
}

/** How many places he can go back to (designer's desktop-history: 50 per window). */
export const DEPTH = 50;

/**
 * How a move from `from` to `to` enters his history (designer's desktop-history, 'what enters
 * history'): the same place adds nothing; one settings section to another replaces the step;
 * anything else is a new step. Pure.
 */
export function stepOf(from: Route, to: Route): 'none' | 'replace' | 'push' {
  if (sameRoute(from, to)) return 'none';
  if (from.screen === 'settings' && to.screen === 'settings') return 'replace';
  return 'push';
}

/**
 * The stack a window starts with (amb-win's note m_19808): keep.ts picks the start route (a
 * reload, a relaunch, a deep link); the session only adds what was behind and ahead of it. The
 * session's place is the start route: its past and future come back. Another start route (a
 * deep link, a notification): it is a new step after the session's place, nothing ahead. Bad
 * strings drop out. Pure.
 */
export function restoreHistory(start: Route, saved: SavedHistory | undefined): { past: Route[]; future: Route[] } {
  if (saved === undefined) return { past: [], future: [] };
  const routes = (xs: readonly string[]) => xs.map(parseRoute).filter((r) => r.screen !== 'notfound' && r.screen !== 'lab');
  const [was] = routes([saved.now]);
  if (was !== undefined && sameRoute(was, start)) return { past: routes(saved.past).slice(-DEPTH), future: routes(saved.future).slice(0, DEPTH) };
  const past = was === undefined ? routes(saved.past) : [...routes(saved.past), was];
  return { past: past.slice(-DEPTH), future: [] };
}

export function createRouter(start: Route, saved?: SavedHistory): Router {
  let { past, future } = restoreHistory(start, saved);
  let now = start;
  const listeners = new Set<() => void>();
  const emit = () => {
    for (const l of [...listeners]) l();
  };
  const move = (side: Side, n: number) => {
    const from = side === 'back' ? past : future;
    if (n < 1 || n > from.length) return;
    if (side === 'back') {
      const to = past.length - n;
      future = [...past.slice(to + 1), now, ...future].slice(0, DEPTH);
      now = past[to] ?? now;
      past = past.slice(0, to);
    } else {
      past = [...past, now, ...future.slice(0, n - 1)].slice(-DEPTH);
      now = future[n - 1] ?? now;
      future = future.slice(n);
    }
    emit();
  };
  return {
    get: () => now,
    go(r) {
      const step = stepOf(now, r);
      if (step === 'none') return;
      if (step === 'push') {
        past = [...past, now].slice(-DEPTH);
        future = [];
      }
      now = r;
      emit();
    },
    replace(r) {
      if (sameRoute(r, now)) return;
      now = r;
      emit();
    },
    back: () => {
      move('back', 1);
    },
    forward: () => {
      move('forward', 1);
    },
    jump: move,
    canBack: () => past.length > 0,
    canForward: () => future.length > 0,
    places: (side, max) => (side === 'back' ? [...past].reverse() : future).slice(0, max),
    saved: () => ({ past: past.map(formatRoute), now: formatRoute(now), future: future.map(formatRoute) }),
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export const RouterContext = createContext<Router | null>(null);

export function useRouter(): Router {
  const r = useContext(RouterContext);
  if (r === null) throw new Error('useRouter outside <RouterContext>');
  return r;
}

/** The current route; re-renders only when it changes. */
export function useRoute(): Route {
  const r = useRouter();
  return useSyncExternalStore(
    (l) => r.subscribe(l),
    () => r.get(),
  );
}

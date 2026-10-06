// The router: the current route and his way back and forward (⌘[ ⌘]).
// Owner: amb-win. The route lives here and nowhere else; screens read it
// with useRoute() and move with go(). A move to the route already shown
// does nothing (no new history step, no listener call), so a deep link
// sent twice never stacks.
import { createContext, useContext, useSyncExternalStore } from 'react';
import { type Route, sameRoute } from './route';

export interface Router {
  get(): Route;
  /** show `r`; a new step of his history (the forward steps go) */
  go(r: Route): void;
  back(): void;
  forward(): void;
  canBack(): boolean;
  canForward(): boolean;
  subscribe(listener: () => void): () => void;
}

/** How many steps back he can go. */
const DEPTH = 100;

export function createRouter(start: Route): Router {
  let past: Route[] = [];
  let now = start;
  let future: Route[] = [];
  const listeners = new Set<() => void>();
  const emit = () => {
    for (const l of [...listeners]) l();
  };
  return {
    get: () => now,
    go(r) {
      if (sameRoute(r, now)) return;
      past = [...past, now].slice(-DEPTH);
      future = [];
      now = r;
      emit();
    },
    back() {
      const prev = past.at(-1);
      if (prev === undefined) return;
      past = past.slice(0, -1);
      future = [now, ...future];
      now = prev;
      emit();
    },
    forward() {
      const [next, ...rest] = future;
      if (next === undefined) return;
      past = [...past, now];
      future = rest;
      now = next;
      emit();
    },
    canBack: () => past.length > 0,
    canForward: () => future.length > 0,
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

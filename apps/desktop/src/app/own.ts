// A window of its own (bise fait mac: an artifact, an agent's thread; main/windows.ts
// OwnWindows): the same app on the route main opened it on, its URL saying '?own=<kind>'. Such a
// window never keeps its route as the main window's (keep.ts 'route' stays the main window's).
// Settings is a route of the main window (r2-settings), never a window. Owner: nm-frame.
import type { WindowOpen } from '@/shared/api';

export type OwnKind = WindowOpen['kind'];

/** The kind of own window this page is in, from its URL's query; none: the main window. Pure. */
export function ownOf(search: string): OwnKind | undefined {
  const own = new URLSearchParams(search).get('own');
  return own === 'artifact' || own === 'agent' ? own : undefined;
}

/** This page's own window kind (none in the main window, the capsule, a test's DOM). */
export function ownWindow(): OwnKind | undefined {
  return typeof window === 'undefined' ? undefined : ownOf(window.location.search);
}

/** Where a window keeps its route: the main window's 'route'; the others keep none. Pure. */
export function routeKeyOf(own: OwnKind | undefined): string | null {
  return own === undefined ? 'route' : null;
}

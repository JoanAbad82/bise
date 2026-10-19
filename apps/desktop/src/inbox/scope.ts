// Whose items the inbox block lists where it is (his ask, inbox-scope: « l'inbox est cross-project si
// on parle à global bise, ou si on est dans /inbox, mais bouger dans un projet filtre l'inbox »): in a
// project's view, that project's items only; on bise's own view (global bise, its home project) and on
// the inbox screen, every project's. Pure. Owner: amb-home.
import type { Card } from '@/proto';

/**
 * The project the block lists here, or null for every project's items: the screen's project, unless
 * it is bise's home (global bise and its agents) or the block sits on the inbox screen
 * (`rest: 'open-only'`). Pure.
 */
export function inboxScope(here: { readonly project: string | null }, home: string, rest?: 'open-only'): string | null {
  if (rest === 'open-only' || here.project === null || here.project === home) return null;
  return here.project;
}

/** Whether an item is listed under that scope (null: every project's). Pure. */
export function inScope(scope: string | null, c: Pick<Card, 'project'>): boolean {
  return scope === null || c.project === scope;
}

/**
 * How many items wait outside the scope: the scoped block's head says '· 2 in other projects', a link
 * to the inbox screen (designer m_32874); 0 for every project's. Pure.
 */
export function othersWaiting(items: readonly Pick<Card, 'project'>[], scope: string | null): number {
  return scope === null ? 0 : items.reduce((n, c) => n + (c.project === scope ? 0 : 1), 0);
}

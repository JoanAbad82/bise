// src/composer/home · when main's thread shows the empty home (bise fait mac, mockup 5; designer's
// pick (c), native-lead m_42546): his first words are not there yet. Derived from the thread the
// window holds, never a kept flag (he may have written from the terminal, another Mac), as the
// welcome's rule (welcome/rule.ts). Pure. Owner: nm-composer.
import type { ThreadOrder } from '@/store/types';

/** The home shows over main's thread while it is empty: no row at all (main's own lines too: the
 *  home would sit on them), nothing of his on its way, its paging at the start. Pure. */
export function homeShows(view: ThreadOrder, hasYou: boolean, pending: number): boolean {
  if (!view.loaded || hasYou || pending > 0 || view.order.length > 0) return false;
  return !view.more && view.gap === undefined;
}

/** The home's line under its question: who works and what waits, from the projects' rows. Pure. */
export function homeFacts(rows: readonly { readonly home: boolean; readonly project: string; readonly working: number; readonly waits: number }[], project: string | null): { working: number; waits: number } {
  const of = project === null ? rows.filter((r) => !r.home) : rows.filter((r) => r.project === project);
  return of.reduce((n, r) => ({ working: n.working + r.working, waits: n.waits + r.waits }), { working: 0, waits: 0 });
}

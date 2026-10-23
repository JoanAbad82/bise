// When a project's main thread shows its welcome (page new-project-home, pick A; architect m_38075):
// derived from the thread the window holds, never a kept flag (he may have written from the
// terminal, another Mac, before a reinstall). Pure. Owner: project-home.
import type { ThreadOrder } from '@/store/types';

/**
 * The welcome shows iff main's thread, as the window holds it, has no entry of his, nothing of his
 * on its way (his first send leaves the composer: it goes at once, before the hub's entry comes
 * back), and its paging reached the start: a thread with an older page isn't new, and the window
 * never loads the whole history to decide.
 */
export function welcomeShows(view: ThreadOrder, hasYou: boolean, pending: number): boolean {
  if (!view.loaded || hasYou || pending > 0) return false;
  return !view.more && view.gap === undefined;
}

/**
 * The lead's intro as main's first row: the thread's start is in the window (no older page, no
 * window around a far entry) and the welcome went (he wrote, or his first send is on its way).
 */
export function introShows(view: ThreadOrder, hasYou: boolean, pending: number): boolean {
  if (!view.loaded || view.more || view.gap !== undefined) return false;
  return hasYou || pending > 0;
}

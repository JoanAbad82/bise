// answered-link: the thread screen's side of openAnswer (answerlink.ts). When the pending jump names
// this thread and knows where his answer sits (its pos, the inbox's record), the store reads the
// page around it however old (store.jumpTo, its window: inbox-open); else it finds his answer among
// the loaded entries (the approval for that card), loads older pages for it up to ANSWER_PAGES (the
// thread's own 'loading earlier…' line). Either way it brings it into
// view only when it is outside it, and flashes it once; not found, the miss line for MISS_MS
// (designer m_24211). Owner: amb-win.
import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { threadKey, useThreadOrder, type Store } from '@/store';
import { answerDone, answerPos, MISS_MS, pendingAnswer, revealStep, subscribeAnswer, type AnswerAt } from './answerlink';
import { entryKey } from './entry';
import type { ThreadListHandle } from './ThreadList';

/** Flash an entry's row once (the quote source's, his answer's): a short tint, then gone. */
export function flashEntry(pos: number): void {
  const el = document.querySelector<HTMLElement>(`[data-testid="thread.entry.${String(pos)}"]`);
  if (el === null) return;
  el.classList.remove('th-flash');
  el.getBoundingClientRect(); // a reflow: the flash runs again on a second click
  el.classList.add('th-flash');
}

/** The pending jump to his answer in this thread; true while the miss line shows. */
export function useAnswerReveal(store: Store, project: string, agent: string, list: RefObject<ThreadListHandle | null>): boolean {
  const tkey = threadKey(project, agent);
  const at = useSyncExternalStore(subscribeAnswer, pendingAnswer);
  const want = at !== null && at.project === project && at.agent === agent ? at : null;
  const view = useThreadOrder(tkey);
  // the pages asked for this jump, and the `before` of the last one (its answer moves it)
  const asked = useRef<{ at: AnswerAt | null; n: number; before: number | null }>({ at: null, n: 0, before: null });
  const [miss, setMiss] = useState(false);

  useEffect(() => {
    if (want === null) return;
    if (asked.current.at !== want) asked.current = { at: want, n: 0, before: null };
    const a = asked.current;
    // where it sits is known (the inbox's record): the store reads the page around it, however
    // old (its window, a gap row to the latest); else look for the card's answer page by page
    const at = want.pos === undefined ? null : store.jumpTo(project, agent, want.pos);
    if (at !== null && at.kind !== 'held') return;
    const waiting = a.before !== null && view.before === a.before && view.more;
    const found = at !== null ? at.pos : answerPos(view.order, (p) => store.entry(tkey, p), want.card);
    const step = revealStep({ loaded: view.loaded, found, more: view.more, asked: a.n, waiting });
    switch (step.kind) {
      case 'wait':
        return;
      case 'older':
        a.n += 1;
        a.before = view.before;
        store.olderPage(project, agent);
        return;
      case 'show': {
        // after the list placed itself (its kept place, its end): then the answer, then the flash.
        // Done only once shown: done first, the jump's end re-ran this effect, whose cleanup took
        // the timer away before it fired
        const t = window.setTimeout(() => {
          answerDone(want);
          // flashed once its row is drawn and whole (a fixed 120 ms found no row under load)
          list.current?.reveal(entryKey(step.pos), () => {
            flashEntry(step.pos);
          });
        }, 60);
        return () => {
          window.clearTimeout(t);
        };
      }
      case 'miss':
        answerDone(want);
        list.current?.scrollToEnd();
        setMiss(true);
        return;
    }
  }, [want, view, store, tkey, project, agent, list]);

  useEffect(() => {
    if (!miss) return;
    const t = window.setTimeout(() => {
      setMiss(false);
    }, MISS_MS);
    return () => {
      window.clearTimeout(t);
    };
  }, [miss]);

  return miss;
}

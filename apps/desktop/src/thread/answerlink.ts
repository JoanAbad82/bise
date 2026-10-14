// answered-link (his ask, architect m_24206, designer m_24211): a '✓ answered: <question>' row (an
// answered card), a '✓ you answered docs' row (a hub's route row, a window-local aside) opens the
// thread of the agent the answer went to and brings his answer there into view. The answer is the
// entry whose `approval.card` is the card's id in that thread (the hub's route line, typed); never
// found by its words. Here: the target of a row, the search in a thread's loaded entries, and the
// one pending jump the thread screen takes (useAnswerReveal). Owner: amb-win.
import type { Entry, EntryCard } from '@/proto';
import type { Router } from '@/app/router';

/** His answer to card `card` of `project`, in `agent`'s thread (the agent it went to). */
export interface AnswerAt {
  readonly project: string;
  readonly agent: string;
  readonly card: number;
}

/** How many older pages the thread loads looking for the answer before it says it is further up (designer m_24211). */
export const ANSWER_PAGES = 20;

/** How long the 'your answer is further up' line stays (designer m_24211). */
export const MISS_MS = 4000;

/** The miss line's words (designer m_24211). */
export const MISS_WORDS = 'your answer is further up';

/**
 * An answered card's row: its asker's thread (the card's `@agent`; an older hub's card without it
 * is this thread's own). Null while it waits for him: the inbox opens it then. Pure.
 */
export function cardTarget(project: string, here: string, c: EntryCard): AnswerAt | null {
  if (!c.answered) return null;
  return { project, agent: c.agent ?? here, card: c.id };
}

/**
 * A 'you answered <agent>' row of the hub's (an approval with its card and the agent it went to):
 * that agent's thread, or null in that thread itself (the row is the answer) and for a gate's
 * approval (no card). Pure.
 */
export function approvalTarget(project: string, here: string, e: Entry): AnswerAt | null {
  const a = e.approval;
  if (a == null || a.card == null || a.to == null || a.to === '' || a.to === here) return null;
  return { project, agent: a.to, card: a.card };
}

/** A window-local aside: the asker it names (an aside kept before it named one: none). Pure. */
export function asideTarget(a: { project: string; card: number; agent?: string }): AnswerAt | null {
  return a.agent === undefined || a.agent === '' ? null : { project: a.project, agent: a.agent, card: a.card };
}

/** The answer's pos among a thread's loaded entries: the newest approval for that card. Pure. */
export function answerPos(order: readonly number[], entry: (pos: number) => Entry | undefined, card: number): number | null {
  for (let i = order.length - 1; i >= 0; i--) {
    const pos = order[i];
    if (pos === undefined) continue;
    if (entry(pos)?.approval?.card === card) return pos;
  }
  return null;
}

/** What the thread does next for a pending jump. Pure. */
export type RevealStep = { kind: 'show'; pos: number } | { kind: 'older' } | { kind: 'wait' } | { kind: 'miss' };

/**
 * The next step: the answer found, shown; not yet, an older page while there is one and the bound
 * isn't reached; the thread not loaded yet or a page asked, wait; else the miss line. Pure.
 */
export function revealStep(s: { loaded: boolean; found: number | null; more: boolean; asked: number; waiting: boolean }): RevealStep {
  if (s.found !== null) return { kind: 'show', pos: s.found };
  if (!s.loaded || s.waiting) return { kind: 'wait' };
  if (s.more && s.asked < ANSWER_PAGES) return { kind: 'older' };
  return { kind: 'miss' };
}

// the one pending jump: set by a click, taken by the thread it names
let pending: AnswerAt | null = null;
const listeners = new Set<() => void>();

/** The pending jump, for the thread screen. */
export function pendingAnswer(): AnswerAt | null {
  return pending;
}

/** The thread took it (shown or missed): nothing pends. */
export function answerDone(at: AnswerAt): void {
  if (pending !== at) return;
  pending = null;
  for (const l of [...listeners]) l();
}

export function subscribeAnswer(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/**
 * Go to his answer: the asker's thread (a step of his history, ⌘[ back), its answer brought into
 * view and flashed once there (useAnswerReveal). From that thread itself: the jump alone.
 */
export function openAnswer(router: Pick<Router, 'go'>, at: AnswerAt): void {
  pending = at;
  for (const l of [...listeners]) l();
  router.go({ screen: 'thread', project: at.project, agent: at.agent });
}

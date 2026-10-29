// The thread's words about its agent: whether it has started (nothing of its own yet), its context
// gauge, the working row, the composer's label and placeholder, the empty composer's ⏎. Its head is
// the window's bar since bise fait mac (nm-frame's title, the '…' menu): no chip, no role line here.
// Pure. The words are the TUI's. Owner: nm-thread.
import type { Agent, EntryKind } from '@/proto';
import { common, thread } from '@/proto/words.gen';
import { shownName } from '@/agents/model';
import { MAIN } from '@/app/route';
import { paused } from './wake';
import { composer } from '../proto/words.gen';

/**
 * A thread with nothing of the agent's own yet (designer's v6 (5), m_18624): no entry, or only
 * the message that started it (his, or the brief another agent sent). An agent whose one entry
 * is its own words is working, not starting. Pure: the kinds of the thread's entries, in order.
 */
export function nothingOwnYet(kinds: readonly (EntryKind | undefined)[]): boolean {
  if (kinds.length === 0) return true;
  return kinds.length === 1 && (kinds[0] === 'you' || kinds[0] === 'from_agent');
}

/**
 * The context gauge in the head (designer D7: no unnamed numbers): the hub's words named,
 * 'context 42k · 17%'; an empty context ('15 · 0%') says nothing worth a place: none. Pure.
 */
export function usageLine(words: string | null | undefined): string {
  const w = (words ?? '').trim();
  if (w === '' || /(^|\s)0%$/.test(w)) return '';
  return thread.head_context({ words: w });
}

/** The composer's label and placeholder: 'to perf' / 'write to perf, then ⏎'. */
/**
 * The working row shows at the thread's end (designer's desktop-working page): the agent works and
 * nothing waits on him (no question, no approval) nor is it paused (a pause keeps its own line). Pure.
 */
export function workingRowShows(a: Agent | undefined): boolean {
  return a !== undefined && !a.archived && !paused(a) && a.status === 'working' && a.waits === 0 && a.waiting_on?.who !== 'you';
}

export function composerWords(name: string): { label: string; placeholder: string } {
  return { label: common.to_agent({ agent: name }), placeholder: composer.placeholder_to({ agent: name }) };
}

/**
 * The placeholder's end in a thread: 'esc back to bise' where esc on the empty composer goes up to
 * the project's main (a sub-agent's thread, app/esc-up.ts), the terminal's same words with its own
 * name for main (designer m_41726). None on main's own composer, nor while the composer says
 * something else (an answer, an artifact, voice typing): there esc is theirs. Pure.
 */
export function escTail(agent: string, busyWords: boolean): string | undefined {
  return agent === MAIN || busyWords ? undefined : composer.esc_back_to({ lead: shownName(MAIN) });
}

/** K2, ⏎ on an empty composer (the TUI's sb/keys.rs + input.rs): never an empty send. A sign-in
 *  that expired and stopped this agent (a 'signin' item waiting on it): sign in again, his ⏎ is
 *  his click. Else nothing. (The computer-use 'give it back' waits on S29.) Pure. */
/**
 * K2 whole, in the TUI's order (sb/keys.rs): the thread's last row says his message was not
 * delivered: ⏎ sends it again (BISE-86); else an expired sign-in: sign in again; else nothing. The
 * TUI's other two acts: 'agent selected: enters it' is the sidebar's and the agents list's own ⏎ in
 * the window (the composer has no agent selection), and 'give a stopped computer-use agent the
 * wheel back' waits on S29. Pure.
 */
export function emptyEnterAct(
  cards: readonly { kind: string; waiting?: readonly string[] | null }[],
  agent: string,
  last: { kind: string; pos: number } | undefined,
): { act: 'again'; pos: number } | { act: 'sign_in'; cmd: { cmd: 'sign_in'; id: 'chatgpt' } } | null {
  if (last?.kind === 'not_delivered') return { act: 'again', pos: last.pos };
  const s = emptyEnter(cards, agent);
  return s === null ? null : { act: 'sign_in', cmd: s };
}

export function emptyEnter(cards: readonly { kind: string; waiting?: readonly string[] | null }[], agent: string): { cmd: 'sign_in'; id: 'chatgpt' } | null {
  return cards.some((c) => c.kind === 'signin' && (c.waiting ?? []).includes(agent)) ? { cmd: 'sign_in', id: 'chatgpt' } : null;
}

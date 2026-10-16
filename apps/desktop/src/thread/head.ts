// The agent view's head words (designer's desktop-screens v6, (1) and (3)): the state chip, the
// role line, the branch line, the composer's label and placeholder. Pure: AgentHead.tsx draws
// them. The words are the TUI's. Owner: amb-home.
import type { Agent, EntryKind } from '@/proto';
import { common, thread } from '@/proto/words.gen';
import { ago } from '@/agents/model';
import { paused, pauseLine } from './wake';
import { composer } from '../proto/words.gen';

/** The state chip: '<breath> working · 14 min', 'starting', '? waiting for you' (accent). */
export interface StateChip {
  readonly text: string;
  /** what waits on him: accent on accent 13% */
  readonly needs: boolean;
  /** working or starting */
  readonly live: boolean;
  /** working: the TUI's 1-cell breath before its words (designer's desktop-working page) */
  readonly breath?: boolean;
}

/**
 * A thread with nothing of the agent's own yet (designer's v6 (5), m_18624): no entry, or only
 * the message that started it (his, or the brief another agent sent). An agent whose one entry
 * is its own words is working, not starting. Pure: the kinds of the thread's entries, in order.
 */
export function nothingOwnYet(kinds: readonly (EntryKind | undefined)[]): boolean {
  if (kinds.length === 0) return true;
  return kinds.length === 1 && (kinds[0] === 'you' || kinds[0] === 'from_agent');
}

/** A working agent under this long is still starting (its first turn, its folder). */
export const STARTING_MS = 20_000;

/** An agent's state chip at `now`. Pure. */
export function stateChip(a: Pick<Agent, 'status' | 'since_ms' | 'waits' | 'waiting_on'> & { watching?: Agent['watching']; turn_ms?: Agent['turn_ms'] }, now: number): StateChip {
  // R9/S3: whom it waits on, the hub's own fact (the TUI's panel reads the same field)
  if (a.waits > 0 || a.waiting_on?.who === 'you') return { text: thread.chip_waits, needs: true, live: false };
  // a pause (agent-waiting-states A): it continues when a command ends or another agent answers, a
  // dim chip with how long ('… waiting · 3 min'); what for in the line over the composer. An alarm
  // leaves it idle: it is free.
  const pause = pauseLine(a, now);
  if (pause !== null) return { text: thread.chip_paused({ len: pause.len }), needs: false, live: false };
  if (a.status === 'waiting' || a.status === 'blocked') return { text: thread.chip_waits, needs: true, live: false };
  switch (a.status) {
    case 'working': {
      const since = now - a.since_ms;
      if (a.since_ms > 0 && since < STARTING_MS) return { text: thread.chip_starting, needs: false, live: true };
      // the current turn's age, the one the composer's label and the right bar say (designer m_20272 (1))
      const t = ago(a.turn_ms != null ? now - a.turn_ms : a.since_ms, now);
      return { text: t === 'now' ? thread.chip_working : thread.chip_working_for({ age: t }), needs: false, live: true, breath: true };
    }
    case 'done':
      return { text: thread.chip_done, needs: false, live: false };
    case 'failed':
      return { text: thread.chip_failed, needs: false, live: false };
    default:
      // at rest is the default: no chip (desktop-delight v2); only working, waiting, failed or done
      return { text: '', needs: false, live: false };
  }
}

/** The role line: what it was asked to do ('product page speed'), else what it says it does. */
export function roleOf(a: Pick<Agent, 'purpose' | 'title'>): string {
  return a.purpose !== '' ? a.purpose : a.title;
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

/** A project's bise chip: '2 agents at work', '1 waiting for you', 'all quiet'. */
export function biseChip(agents: readonly Pick<Agent, 'main' | 'archived' | 'status' | 'waits'>[]): StateChip {
  const waits = agents.reduce((n, a) => n + a.waits, 0);
  if (waits > 0) return { text: common.waiting_for_you({ n: waits }), needs: true, live: false };
  const work = agents.filter((a) => !a.main && !a.archived && a.status === 'working').length;
  if (work > 0) return { text: thread.bise_at_work({ n: work }), needs: false, live: true };
  return { text: common.all_quiet, needs: false, live: false };
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

/**
 * An archived maker's head beside its artifact (designer m_21714): it clips at its column, never runs
 * under the panel. Its purpose cuts with '…' first, down to nothing (css), then its name down to 12
 * chars (`who`: that short name and the gaps after it); then the 'archived' chip goes; last, '↺ restore'
 * becomes the '↺' icon button. 0: all shown, 1: no chip, 2: no chip and the icon.
 */
export function archivedFit(widths: { avail: number; gap: number; who: number; chip: number; restore: number }): 0 | 1 | 2 {
  if (widths.who + widths.gap + widths.chip + widths.gap + widths.restore <= widths.avail) return 0;
  if (widths.who + widths.gap + widths.restore <= widths.avail) return 1;
  return 2;
}

// The agent view's head words (designer's desktop-screens v6, (1) and (3)): the state chip, the
// role line, the branch line, the composer's label and placeholder. Pure: AgentHead.tsx draws
// them. The words are the TUI's. Owner: amb-home.
import type { Agent } from '@/proto';
import { ago, shownName } from '@/agents/model';
import { waitingFor, waitsEvent } from './wake';

/** The state chip: '∿ working · 14 min', 'starting', '? waiting for you' (accent). */
export interface StateChip {
  readonly text: string;
  /** what waits on him: accent on accent 13% */
  readonly needs: boolean;
  /** working: its ∿ breathes */
  readonly live: boolean;
}

/** A working agent under this long is still starting (its first turn, its folder). */
export const STARTING_MS = 20_000;

/** An agent's state chip at `now`. Pure. */
export function stateChip(a: Pick<Agent, 'status' | 'since_ms' | 'waits' | 'waiting_on'> & { watching?: Agent['watching'] }, now: number): StateChip {
  // R9/S3: whom it waits on, the hub's own fact (the TUI's panel reads the same field)
  if (a.waits > 0 || a.waiting_on?.who === 'you') return { text: '? waiting for you', needs: true, live: false };
  if (a.waiting_on?.who === 'agent') return { text: `⋯ waiting on ${shownName(a.waiting_on.name)}`, needs: false, live: false };
  // event-wake (designer's page): it waits for an event, a dim chip with what and how long, not 'idle'
  if (waitsEvent(a) && a.watching !== undefined) return { text: `… ${waitingFor(a.watching, now) ?? 'waiting'}`, needs: false, live: false };
  if (a.status === 'waiting' || a.status === 'blocked') return { text: '? waiting for you', needs: true, live: false };
  switch (a.status) {
    case 'working': {
      const since = now - a.since_ms;
      if (a.since_ms > 0 && since < STARTING_MS) return { text: 'starting', needs: false, live: true };
      const t = ago(a.since_ms, now);
      return { text: t === 'now' ? '∿ working' : `∿ working · ${t}`, needs: false, live: true };
    }
    case 'done':
      return { text: '✓ done', needs: false, live: false };
    case 'failed':
      return { text: '✗ failed', needs: false, live: false };
    default:
      return { text: 'idle', needs: false, live: false };
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
  return `context ${w}`;
}

/** The branch line: 'sb/perf · ± 2 files' (no files known yet: the branch alone; no branch: none). */
export function branchLine(branch: string | null | undefined, files: number | undefined): string {
  if (branch == null || branch === '') return '';
  if (files === undefined || files === 0) return branch;
  return `${branch} · ± ${String(files)} ${files === 1 ? 'file' : 'files'}`;
}

/** A project's bise chip: '2 agents at work', '1 waiting for you', 'all quiet'. */
export function biseChip(agents: readonly Pick<Agent, 'main' | 'archived' | 'status' | 'waits'>[]): StateChip {
  const waits = agents.reduce((n, a) => n + a.waits, 0);
  if (waits > 0) return { text: `${String(waits)} waiting for you`, needs: true, live: false };
  const work = agents.filter((a) => !a.main && !a.archived && a.status === 'working').length;
  if (work > 0) return { text: `${String(work)} ${work === 1 ? 'agent' : 'agents'} at work`, needs: false, live: true };
  return { text: 'all quiet', needs: false, live: false };
}

/** The composer's label and placeholder: 'to perf' / 'write to perf, then ⏎'. */
/**
 * S40/W3, the TUI's divider (`you → main · model · effort · approvals mode · state · context`,
 * chrome.rs + sb/panel.rs status_state): what the composer's label line says on its right. The
 * model as the catalog names it (its label, else the id's last part), its effort, the hub's
 * approvals mode (yolo / auto), its state ('working · 4 min', 'idle'), its context ('42k · 17%',
 * the hub's words). Any part it doesn't know is left out. Pure.
 */
export function dividerEnd(a: {
  model?: string | null;
  modelLabel?: string | null;
  effort?: string | null;
  mode?: string | null;
  status?: string | null;
  turnMs?: number | null;
  context?: string | null;
}): string {
  const model = (a.modelLabel ?? '').trim() || (a.model ?? '').split('/').at(-1)?.trim() || '';
  const mode = a.mode === 'yolo' || a.mode === 'auto' ? a.mode : '';
  const status = (a.status ?? '').trim();
  const state = status === 'working' && a.turnMs != null && a.turnMs > 0 ? `working · ${turnAge(a.turnMs)}` : status;
  return [model, (a.effort ?? '').trim(), mode, state, (a.context ?? '').trim()].filter((x) => x !== '').join(' · ');
}

/** A turn's running time on the divider: '12 s', '4 min', '2 h'. Pure. */
function turnAge(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${String(s)} s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${String(m)} min` : `${String(Math.floor(m / 60))} h`;
}

export function composerWords(name: string): { label: string; placeholder: string } {
  return { label: `to ${name}`, placeholder: `write to ${name}, then ⏎` };
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
 * What the head drops so the rest fits (designer m_17194): a meta item shows whole or not at all, never
 * cut. The context note goes first, then the branch; the role takes the room they leave and ends with '…'
 * only if it still doesn't fit. Dropped items stay in the DOM out of the flow ('ah-gone'), so their
 * width is still read; the head re-measures when it resizes or its words change. 0: all shown, 1: no
 * context note, 2: no branch either.
 */
export function dropsFor(widths: { avail: number; who: number; chip: number; notes: number[]; usage: number; branch: number; end: number }): 0 | 1 | 2 {
  const GAP = 10;
  const END_GAP = 6;
  const items = [widths.who, widths.chip, ...widths.notes].filter((w) => w > 0);
  const base = items.reduce((n, w) => n + w, 0) + GAP * items.length + widths.end;
  const withUsage = widths.usage > 0 ? widths.usage + GAP : 0;
  const withBranch = widths.branch > 0 ? widths.branch + END_GAP : 0;
  if (base + withUsage + withBranch <= widths.avail) return 0;
  if (base + withBranch <= widths.avail) return 1;
  return 2;
}

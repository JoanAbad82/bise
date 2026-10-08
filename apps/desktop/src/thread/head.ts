// The agent view's head words (designer's desktop-screens v6, (1) and (3)): the state chip, the
// role line, the branch line, the composer's label and placeholder. Pure: AgentHead.tsx draws
// them. The words are the TUI's. Owner: amb-home.
import type { Agent } from '@/proto';
import { ago } from '@/agents/model';

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
export function stateChip(a: Pick<Agent, 'status' | 'since_ms' | 'waits'>, now: number): StateChip {
  if (a.waits > 0 || a.status === 'waiting' || a.status === 'blocked') return { text: '? waiting for you', needs: true, live: false };
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
export function composerWords(name: string): { label: string; placeholder: string } {
  return { label: `to ${name}`, placeholder: `write to ${name}, then ⏎` };
}

/** K2, ⏎ on an empty composer (the TUI's sb/keys.rs + input.rs): never an empty send. A sign-in
 *  that expired and stopped this agent (a 'signin' item waiting on it): sign in again, his ⏎ is
 *  his click. Else nothing. (The computer-use 'give it back' waits on S29.) Pure. */
export function emptyEnter(cards: readonly { kind: string; waiting?: readonly string[] | null }[], agent: string): { cmd: 'sign_in'; id: 'chatgpt' } | null {
  return cards.some((c) => c.kind === 'signin' && (c.waiting ?? []).includes(agent)) ? { cmd: 'sign_in', id: 'chatgpt' } : null;
}

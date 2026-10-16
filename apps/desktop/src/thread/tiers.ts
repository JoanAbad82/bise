// The thread's hierarchy (designer's thread tiers, m_19387, http://127.0.0.1:47438/p/thread-tiers):
// 1 needs you (a card's one line), 2 for him (answers, reports, errors, his bubbles: body text),
// 3 news (landed, PR, artifact, scheduled, stopped, its own wake: one mono row), 4 ignorable
// (messages between agents, tools, thinking, compaction, notices that are plumbing: dim mono).
// Owner: amb-win. Pure.
import { thread } from '@/proto/words.gen';

/** The kinds drawn as one dim row (tiers 3 and 4): 8 px between two of them. */
export const ROW_KINDS: ReadonlySet<string> = new Set([
  'tools',
  'thinking',
  'compacting',
  'compacted',
  'landed',
  'pr',
  'artifact',
  'scheduled',
  'stopped',
  'wake',
  'to_agent',
  'from_agent',
  'notice',
  'unknown',
]);

/**
 * The rows with no name line (tier 3 news and the plumbing of tier 4): a new author there opens no
 * 20 px group, it sits 8 px under the row before (designer m_19387: 'no name line, 8 px between rows').
 */
export const NAMELESS_KINDS: ReadonlySet<string> = new Set(['landed', 'pr', 'artifact', 'scheduled', 'stopped', 'wake', 'notice', 'compacting', 'compacted', 'unknown']);

/** A report folded to one quiet row (H8: the message under it repeats it), for gapOf. */
export const QUIET_REPORT = 'quiet-report';

/**
 * The quiet rows (tui-parity H1, designer m_19832): news, wake, scheduled, a new agent, plumbing,
 * the fold of a run ('fold'). Two of them in a row touch (--gap-tight 4); a run of them sits
 * --gap-block 12 from a message or prose; tool rows keep their 8.
 */
export const QUIET_KINDS: ReadonlySet<string> = new Set([...NAMELESS_KINDS, 'fold', QUIET_REPORT]);

/** A message between agents (tier 4): its ✉ chip 'sender → receiver' and one row. */
export const NOTE_KINDS: ReadonlySet<string> = new Set(['to_agent', 'from_agent']);

/** A message's route 'sender→receiver' in `agent`'s thread (to_agent: from it; from_agent: to it unless said). Pure. */
export function routeOf(e: { readonly kind: string; readonly from?: string | null; readonly to?: string | null }, agent: string): string {
  const from = e.kind === 'to_agent' ? agent : (e.from ?? '');
  const to = e.kind === 'to_agent' ? (e.to ?? 'main') : e.to != null && e.to !== '' ? e.to : agent;
  return `${from}→${to}`;
}

/**
 * The message right before this one went the same way (designer m_19784 (2): same sender → same
 * receiver in a row share one chip): this one shows no chip of its own. Pure.
 */
export function sameRoute(prev: Parameters<typeof routeOf>[0] | undefined, e: Parameters<typeof routeOf>[0], agent: string): boolean {
  return prev !== undefined && NOTE_KINDS.has(prev.kind) && NOTE_KINDS.has(e.kind) && routeOf(prev, agent) === routeOf(e, agent);
}

/** The kinds drawn as body text (tier 2): 12 px between one of them and a dim row. */
export const BODY_KINDS: ReadonlySet<string> = new Set(['agent', 'answered', 'turn_failed', 'page', 'report']);

/** What a row in a list needs here. */
export interface TierEntry {
  readonly kind: string;
  readonly text: string;
  readonly landed?: { readonly sha: string } | null;
}

// the hub's sentence for a land: 'flake-roots landed 1 commit on main (2c24ce15) · pushed'
const LANDED_LINE = /\blanded \d+ commits? on \S+ \(([0-9a-f]{7,40})\)/u;

/**
 * One land per sha (designer m_19387, his shot: a land drawn twice): the positions of the rows that
 * only say again a land the thread has as a typed 'landed' row (a notice, a message or a report with
 * the hub's 'X landed N commit(s) on <target> (<sha>)' sentence). Pure.
 */
export function landedEchoes(order: readonly number[], entry: (pos: number) => TierEntry | undefined): Set<number> {
  const shas: string[] = [];
  for (const pos of order) {
    const sha = entry(pos)?.landed?.sha;
    if (sha != null && sha !== '') shas.push(sha);
  }
  const out = new Set<number>();
  if (shas.length === 0) return out;
  for (const pos of order) {
    const e = entry(pos);
    if (e === undefined || e.kind === 'landed') continue;
    const m = LANDED_LINE.exec(e.text);
    const short = m?.[1];
    if (short !== undefined && shas.some((s) => s.startsWith(short) || short.startsWith(s))) out.add(pos);
  }
  return out;
}

/** A model call's retry notice, as the hub words it (proto words.rs provider_retry). */
export interface Retry {
  readonly attempt: number;
  readonly of: number;
  readonly why: string;
  /** the next try: 'retry 3/10 in 4s'; none when this try was the last */
  readonly next?: { readonly attempt: number; readonly wait: string };
  /** how the run ended, when the hub says it (amb-feed's typed Notice.retry, dd17152f) */
  readonly end?: 'recovered' | 'failed' | 'unknown';
}

/** The hub's typed retry (Notice.retry: one entry per run, sent again at its pos) as a Retry. Pure. */
export function typedRetry(r: { attempt: number; max: number; why: string; wait_ms: number; end?: 'recovered' | 'failed' | 'unknown' | null }): Retry {
  const base = { attempt: r.attempt, of: r.max, why: r.why };
  if (r.end != null) return { ...base, end: r.end };
  const s = r.wait_ms / 1000;
  return { ...base, next: { attempt: r.attempt + 1, wait: `${Number.isInteger(s) ? String(s) : s.toFixed(1)}s` } };
}

const RETRY = /^model call failed \(attempt (\d+)\/(\d+)\): ([\s\S]*?)(?: · retry (\d+)\/\d+ in (\S+))?$/u;

/** 'model call failed (attempt 2/10): provider 529 (transient) · retry 3/10 in 4s' read; null for any other words. Pure. */
export function retryOf(text: string): Retry | null {
  const m = RETRY.exec(text.trim());
  if (m === null) return null;
  const base = { attempt: Number(m[1]), of: Number(m[2]), why: m[3] ?? '' };
  return m[4] === undefined ? base : { ...base, next: { attempt: Number(m[4]), wait: m[5] ?? '' } };
}

/** What a retry run needs of an entry. */
export interface RetryEntry {
  readonly kind: string;
  readonly text: string;
  readonly notice?: { readonly text: string } | null;
}

/**
 * Consecutive retry notices of one model call (tui-parity H9, designer m_19832): one row that
 * updates in place. `hidden`: every notice of a run but its last; `runs`: the last's pos -> the
 * words of each try, oldest first (the full errors under its ▸). Pure.
 */
export function retryRuns(order: readonly number[], entry: (pos: number) => RetryEntry | undefined): { hidden: Set<number>; runs: Map<number, string[]> } {
  const hidden = new Set<number>();
  const runs = new Map<number, string[]>();
  let run: { pos: number; text: string }[] = [];
  const close = () => {
    const last = run.at(-1);
    if (last !== undefined) {
      for (const r of run.slice(0, -1)) hidden.add(r.pos);
      runs.set(
        last.pos,
        run.map((r) => r.text),
      );
    }
    run = [];
  };
  for (const pos of order) {
    const e = entry(pos);
    const text = e?.kind === 'notice' ? (e.notice?.text ?? e.text) : '';
    if (e === undefined || text === '' || retryOf(text) === null) {
      close();
      continue;
    }
    run.push({ pos, text });
  }
  close();
  return { hidden, runs };
}

/** The retry row's words: 'model call failed · retry 3 of 10 in 4 s', or '… · try 10 of 10 failed' at the end. Pure. */
export function retryWords(r: Retry): string {
  // the hub says the run ended and the call went through: one dim line that says so
  if (r.end === 'recovered' || r.end === 'unknown') return thread.retry_through({ n: r.attempt });
  if (r.next === undefined) return thread.retry_last({ attempt: r.attempt, max: r.of });
  // '4s' reads '4 s' (a duration's format)
  return thread.retry_next({ attempt: r.next.attempt, max: r.of, wait: r.next.wait.replace(/^(\d+(?:\.\d+)?)([a-z]+)$/u, '$1 $2') });
}

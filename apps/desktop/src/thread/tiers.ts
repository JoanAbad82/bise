// The thread's hierarchy (designer's thread tiers, m_19387, http://127.0.0.1:47438/p/thread-tiers):
// 1 needs you (a card's one line), 2 for him (answers, reports, errors, his bubbles: body text),
// 3 news (landed, PR, artifact, scheduled, stopped, its own wake: one mono row), 4 ignorable
// (messages between agents, tools, thinking, compaction, notices that are plumbing: dim mono).
// Owner: amb-win. Pure.

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

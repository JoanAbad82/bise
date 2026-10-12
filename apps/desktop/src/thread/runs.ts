// Runs of agent-to-agent messages folded (tui-parity R13; rust/tui/src/feed.rs folded_run, render.rs
// fold_line): since designer's thread tiers (m_19387) a run of 2 or more messages between agents shows
// as one line '▸ 4 messages between 2 agents' that opens them in place. Owner: amb-win. Pure.

/** A run folds when it has more than this many messages (2 and more: designer m_19387, tier 4). */
export const FOLD_AFTER = 1;

/** What a run needs of an entry. */
export interface RunEntry {
  readonly kind: string;
  readonly from?: string | null;
  readonly to?: string | null;
  /** a question that waits for the reply: never folded away */
  readonly asks?: boolean | null;
  /** its words: a report ('[report: done] …') is for him, never folded away */
  readonly text?: string;
}

export interface Run {
  /** its first message's pos (the fold's place and key) */
  readonly start: number;
  readonly members: readonly number[];
  /** how many agents speak in it */
  readonly agents: number;
}

// a question that waits for its reply (asks) stays in view: it breaks a run
// and a report (tier 2, designer m_19387: reports on his requests are for him) stays in view too
const isAgentMsg = (e: RunEntry | undefined): e is RunEntry => e !== undefined && (e.kind === 'to_agent' || e.kind === 'from_agent') && e.asks !== true && !/^\s*\[report:/u.test(e.text ?? '');

/** The folded runs of a thread's entries in order (`agent`: whose thread it is). Pure. */
export function foldedRuns(order: readonly number[], entry: (pos: number) => RunEntry | undefined, agent: string): Run[] {
  const runs: Run[] = [];
  let members: number[] = [];
  let names = new Set<string>();
  const close = () => {
    if (members.length > FOLD_AFTER && members[0] !== undefined) runs.push({ start: members[0], members, agents: names.size });
    members = [];
    names = new Set();
  };
  for (const pos of order) {
    const e = entry(pos);
    if (!isAgentMsg(e)) {
      close();
      continue;
    }
    members.push(pos);
    const from = e.kind === 'to_agent' ? agent : (e.from ?? '');
    const to = e.kind === 'to_agent' ? (e.to ?? '') : (e.to ?? agent);
    if (from !== '') names.add(from);
    if (to !== '') names.add(to);
  }
  close();
  return runs;
}

/** The fold's words: '▸ 4 messages between 2 agents' (▾ when open). Pure. */
export function runWords(run: Pick<Run, 'members' | 'agents'>, open: boolean): string {
  return `${open ? '▾' : '▸'} ${String(run.members.length)} messages between ${String(run.agents)} agent${run.agents === 1 ? '' : 's'}`;
}

export const runKey = (start: number) => `r:${String(start)}`;

/** The list's keys with each folded run: its fold line, then its messages only when open. Pure. */
export function withRuns(order: readonly number[], runs: readonly Run[], open: ReadonlySet<number>, key: (pos: number) => string): string[] {
  const head = new Map(runs.map((r) => [r.start, r]));
  const hidden = new Set(runs.filter((r) => !open.has(r.start)).flatMap((r) => r.members));
  const out: string[] = [];
  for (const pos of order) {
    if (head.has(pos)) out.push(runKey(pos));
    if (!hidden.has(pos)) out.push(key(pos));
  }
  return out;
}

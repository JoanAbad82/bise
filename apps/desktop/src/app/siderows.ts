// The sidebar's rows (bise fait mac, page native-mac §6, mockup 1): 'Pinned' (the agents he
// pinned, pins.ts), then 'Projects', each project a folder row and, under it, its live agents in
// the hub's one order (rows::Agent.rank through agents/model rankedOf: the sidebar has no order of
// its own, ⌥1-9 read the same numbers), the first 4 then 'Show N more'; the agent in view always
// shows. At a row's end only what asks something: the accent dot (it waits on him) or the ring (it
// works); no count, no date, no mark. A pinned agent leaves its project's list (it sits in Pinned).
// Pure: Sidebar.tsx draws them. Owner: nm-frame.
import type { Agent, ProjectRow } from '@/proto';
import { liveOf } from '@/agents/model';

/** How many agents a project shows before 'Show N more'. */
export const SHOWN_AGENTS = 4;

/** What a row's end says: it waits on him (the accent dot), it works (the ring), or nothing. */
export type RowEnd = 'waits' | 'works' | null;

export type SideRow =
  | { readonly kind: 'label'; readonly label: 'pinned' | 'projects' }
  | { readonly kind: 'project'; readonly p: ProjectRow; readonly open: boolean; readonly end: RowEnd }
  | { readonly kind: 'agent'; readonly project: string; readonly a: Agent; readonly pinned: boolean; readonly on: boolean; readonly end: RowEnd; readonly stopped: boolean }
  | { readonly kind: 'more'; readonly project: string; readonly n: number; readonly open: boolean };

/** An agent's end: the dot when it asks him (a card, or the hub says it waits on him), the ring at work. Pure. */
export function endOf(a: Agent): RowEnd {
  if (a.waits > 0 || a.waiting_on?.who === 'you') return 'waits';
  if (a.status === 'working') return 'works';
  return null;
}

/** A stopped agent reads text-2 (the hub folds 'stopped' into done). Pure. */
export const stoppedOf = (a: Agent): boolean => a.status === 'done' || a.status === 'failed';

/** His projects in his order, bise's own out (the rail's ':*' is it). Pure. */
export function projectsOf(rows: readonly ProjectRow[]): ProjectRow[] {
  return rows.filter((p) => !p.home).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/** A project's live agents in the hub's order: main first, then by rank (`numbers`: agents/model numbersOf). Pure. */
export function rankedAgents(agents: readonly Agent[], numbers: ReadonlyMap<string, number>): Agent[] {
  const live = liveOf(agents);
  const at = (a: Agent) => numbers.get(a.name) ?? Number.MAX_SAFE_INTEGER;
  return live.map((a, i) => ({ a, i })).sort((x, y) => at(x.a) - at(y.a) || x.i - y.i).map((x) => x.a);
}

/** One project's block: its folder row, then its agents (pinned ones out), then 'Show N more'. Pure. */
export function projectBlockOf(c: {
  readonly p: ProjectRow;
  /** the project's agents (the store's rows) */
  readonly agents: readonly Agent[];
  /** its ⌥ numbers (agents/model numbersOf: the hub's rank, held while ⌥ is down) */
  readonly numbers: ReadonlyMap<string, number>;
  /** the names of its agents he pinned (they sit in Pinned) */
  readonly pinned: readonly string[];
  /** he folded it (its agents hidden) */
  readonly folded: boolean;
  /** he opened its 'Show N more' */
  readonly all: boolean;
  /** the agent in view, when it is one of this project's */
  readonly at?: string;
}): SideRow[] {
  const project = c.p.project;
  const agents = rankedAgents(c.agents, c.numbers).filter((a) => !c.pinned.includes(a.name));
  const open = !c.folded;
  // folded, the folder row says what its agents ask (the dot); open, each agent says its own
  const end: RowEnd = !open && agents.some((a) => endOf(a) === 'waits') ? 'waits' : null;
  const out: SideRow[] = [{ kind: 'project', p: c.p, open, end }];
  if (!open) return out;
  const shown = c.all ? agents : agents.filter((a, i) => i < SHOWN_AGENTS || a.name === c.at);
  for (const a of shown) out.push({ kind: 'agent', project, a, pinned: false, on: a.name === c.at, end: endOf(a), stopped: stoppedOf(a) });
  const rest = agents.length - shown.length;
  if (c.all && agents.length > SHOWN_AGENTS) out.push({ kind: 'more', project, n: 0, open: true });
  else if (rest > 0) out.push({ kind: 'more', project, n: rest, open: false });
  return out;
}

/** A pinned agent's row; none when it left its project's live rows (renamed, archived). Pure. */
export function pinRowOf(project: string, agent: string, agents: readonly Agent[], at?: string): SideRow | null {
  const a = liveOf(agents).find((x) => x.name === agent);
  if (a === undefined) return null;
  return { kind: 'agent', project, a, pinned: true, on: at === agent, end: endOf(a), stopped: stoppedOf(a) };
}

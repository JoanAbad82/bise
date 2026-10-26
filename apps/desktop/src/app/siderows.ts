// The sidebar's rows: 'Pinned' (the agents he pinned himself, pins.ts: his shortcuts, designer
// m_44271), then 'Projects', one row per project in his order (Settings › Projects), no agent under
// it: the agents of a project live on the right side. A project row is Gabriel's H1 (round 3, page
// sidebar-projects, designer m_44783): its name, the inbox pill or its age, one plain sentence and
// its week (projectfacts.ts says them); a quiet one is one line. With ⌘ held, its ⌘ digit in the
// pill's place (⌘1-9 opens it, keys.ts). A pinned agent's row keeps the dot (it waits on him) or
// the breath (it works).
// Pure: Sidebar.tsx draws them. Owner: r3-projects this round (nm-frame's, archived).
import type { Agent, ProjectRow } from '@/proto';
import { liveOf } from '@/agents/model';
import { projectFacts, type ProjectFacts, type PulseRow } from './projectfacts';

/** A pinned agent's end: it waits on him (the accent dot), it works (the breath), or nothing. */
export type RowEnd = 'waits' | 'works' | null;

export type SideRow =
  | { readonly kind: 'project'; readonly p: ProjectRow; readonly on: boolean; readonly facts: ProjectFacts; readonly digit?: number }
  | { readonly kind: 'agent'; readonly project: string; readonly a: Agent; readonly on: boolean; readonly end: RowEnd; readonly stopped: boolean };

/** An agent's end: the dot when it asks him (a card, or the hub says it waits on him), the breath at work. Pure. */
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

/** How many of a project's live agents work now. Pure. */
export function workingOf(agents: readonly Agent[]): number {
  return liveOf(agents).filter((a) => a.status === 'working').length;
}

/** A project's row: `waits` is the inbox's own count for it (inbox/waiting useProjectWaiting), `index` its place in projectsOf (⌘ index+1, up to 9). Pure. */
export function projectRowOf(c: {
  readonly p: PulseRow;
  readonly agents: readonly Agent[];
  readonly waits: number;
  readonly index: number;
  /** the project in view */
  readonly on: boolean;
  /** ⌘ is held: the row shows its digit */
  readonly cmd: boolean;
  /** when he last looked at it (seen.ts) */
  readonly seen?: number | undefined;
  readonly now: number;
}): SideRow {
  const facts = projectFacts({ p: c.p, working: workingOf(c.agents), waits: c.waits, seen: c.seen, now: c.now });
  const digit = c.cmd && c.index < 9 ? c.index + 1 : undefined;
  return { kind: 'project', p: c.p, on: c.on, facts, ...(digit === undefined ? {} : { digit }) };
}

/** A pinned agent's row; none when it left its project's live rows (renamed, archived). Pure. */
export function pinRowOf(project: string, agent: string, agents: readonly Agent[], at?: string): SideRow | null {
  const a = liveOf(agents).find((x) => x.name === agent);
  if (a === undefined) return null;
  return { kind: 'agent', project, a, on: at === agent, end: endOf(a), stopped: stoppedOf(a) };
}

// The sidebar's rows (bise fait mac round 2, his m_44263 and r2-img11: projects only, as before
// native-mac): 'Pinned' (the agents he pinned himself, pins.ts: his shortcuts, designer m_44271),
// then 'Projects', one row per project in his order (Settings › Projects), no agent under it: the
// agents of a project live on the right side. A project row's end says one fact, the bubbles'
// grammar (designer m_44271): what waits on him (the count in the accent), else its agents at work
// (the ring and the count), else nothing; with ⌘ held, its ⌘ digit instead (⌘1-9 opens it,
// keys.ts). A pinned agent's row keeps the dot (it waits on him) or the ring (it works).
// Pure: Sidebar.tsx draws them. Owner: r2-pointer (nm-frame's, archived).
import type { Agent, ProjectRow } from '@/proto';
import { liveOf } from '@/agents/model';

/** A pinned agent's end: it waits on him (the accent dot), it works (the ring), or nothing. */
export type RowEnd = 'waits' | 'works' | null;

/** A project row's end: how many things wait on him, else how many of its agents work, else nothing. */
export type ProjectEnd = { readonly kind: 'waits' | 'works'; readonly n: number } | null;

export type SideRow =
  | { readonly kind: 'project'; readonly p: ProjectRow; readonly on: boolean; readonly end: ProjectEnd; readonly working: number; readonly waits: number; readonly digit?: number }
  | { readonly kind: 'agent'; readonly project: string; readonly a: Agent; readonly on: boolean; readonly end: RowEnd; readonly stopped: boolean };

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

/** How many of a project's live agents work now. Pure. */
export function workingOf(agents: readonly Agent[]): number {
  return liveOf(agents).filter((a) => a.status === 'working').length;
}

/** A project row's one fact: what waits on him first, else its agents at work, else nothing. Pure. */
export function projectEndOf(waits: number, working: number): ProjectEnd {
  if (waits > 0) return { kind: 'waits', n: waits };
  if (working > 0) return { kind: 'works', n: working };
  return null;
}

/** A project's row: `waits` is the inbox's own count for it (inbox/waiting useProjectWaiting), `index` its place in projectsOf (⌘ index+1, up to 9). Pure. */
export function projectRowOf(c: {
  readonly p: ProjectRow;
  readonly agents: readonly Agent[];
  readonly waits: number;
  readonly index: number;
  /** the project in view */
  readonly on: boolean;
  /** ⌘ is held: the row shows its digit */
  readonly cmd: boolean;
}): SideRow {
  const working = workingOf(c.agents);
  const digit = c.cmd && c.index < 9 ? c.index + 1 : undefined;
  return { kind: 'project', p: c.p, on: c.on, end: projectEndOf(c.waits, working), working, waits: c.waits, ...(digit === undefined ? {} : { digit }) };
}

/** A pinned agent's row; none when it left its project's live rows (renamed, archived). Pure. */
export function pinRowOf(project: string, agent: string, agents: readonly Agent[], at?: string): SideRow | null {
  const a = liveOf(agents).find((x) => x.name === agent);
  if (a === undefined) return null;
  return { kind: 'agent', project, a, on: at === agent, end: endOf(a), stopped: stoppedOf(a) };
}

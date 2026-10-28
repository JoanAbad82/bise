// The Overview's agent rows, live (desktop-agents-bar): a project's agents (every project's on
// bise's own, project ''), their worktrees and PRs, the computer marks, the next wakes and the ⌥
// numbers, made into barrows.ts's rows: AGENTS (main first, the ψ groups, the orphan PRs) and
// ARCHIVED. One hook for the two places that list them: the Overview (RightBar.tsx) and the
// folded side's agents float (side3d FloatAgents.tsx, folded-side v9: A's floats take Overview's
// rows). Owner: nm-panel; the float reads it (nm-side).
import { useMemo } from 'react';
import type { Card } from '@/proto';
import { numbersOf } from '@/agents/model';
import { useAllScheduled } from '@/scheduled';
import { useCards, useComputerLive, usePlaces, useProjects } from '@/store';
import { pauseInSeconds } from '@/thread/wake';
import { useNowFor } from './clock';
import { useBarAgents } from './baragents';
import { usePins } from './pins';
import { agentRows, archivedRows, wakesOf, type BarRow, type ProjAgent } from './barrows';

export interface AgentRowsNow {
  /** the agents read (archived too) */
  readonly agents: readonly ProjAgent[];
  /** AGENTS' rows: main first, the agents by their ⌥ number, the orphan PRs, the ψ groups */
  readonly live: readonly BarRow[];
  /** ARCHIVED's rows, newest first */
  readonly archived: readonly BarRow[];
  /** the project's open cards (an ask's options) */
  readonly cards: readonly Card[];
  readonly now: number;
}

/** `project`'s agents as the Overview's rows ('' every project's); `alt`: ⌥ held, ⌥N for the signs. */
export function useAgentRows(project: string, alt: boolean): AgentRowsNow {
  const all = project === '';
  const agents = useBarAgents(project);
  // a live row's pause under a minute ends on seconds: the second clock while one does
  const now = useNowFor((t) => agents.some((x) => !x.a.archived && pauseInSeconds(x.a, t)));
  const tasks = useAllScheduled(all ? undefined : project);
  const places = usePlaces(project);
  const cards = useCards(project);
  const computer = useComputerLive();
  const wakes = useMemo(() => wakesOf(tasks), [tasks]);
  // the hub's rank as ⌥ numbers, held while ⌥ is (agents/model numbersOf): a project's only; bise's thread keeps start order
  // his pinned agents first (pins.ts), so ⌥N is the Nth row he sees
  const pins = usePins('agent');
  const numbers = all ? undefined : numbersOf(project, agents.map((x) => x.a), alt, undefined, pins.get(project));
  const home = useProjects().find((p) => p.home)?.project;
  const live = agentRows(agents, now, all, alt, { wakes, places, cards, computer, ...(numbers === undefined ? {} : { numbers }), ...(home === undefined ? {} : { home }) });
  const archived = archivedRows(agents, now, all);
  return { agents, live, archived, cards, now };
}

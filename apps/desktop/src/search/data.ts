// The store's shapes (generated from rust/proto) mapped to the search's own view types: the one
// place a protocol change reaches the search. Pure.
// Today: the agents (archived too), cards and artifacts of the projects the core holds; the
// projects it does not hold come with amb-core's index, the scheduled tasks with amb-feed's typed
// list (lead m_11859): both are inputs here when they land.
import type { Agent, Artifact, Card, ProjectRow } from '@/proto';
import type { SearchData, SearchScheduled } from './rank';

export interface StoreView {
  readonly projects: readonly ProjectRow[];
  readonly agents: (project: string) => readonly Agent[];
  readonly artifacts: (project: string) => readonly Artifact[];
  readonly cards: (project: string) => readonly Card[];
  readonly scheduled?: (project: string) => readonly SearchScheduled[];
}

/** An artifact's dim words: 'page · v2', 'image'. */
const whatOf = (a: Artifact): string => (a.version > 1 ? `${a.kind} · v${String(a.version)}` : a.kind);

/** Everything the search reads, bise's home first, then his projects in his order. */
export function searchDataOf(v: StoreView): SearchData {
  const projects = [...v.projects].sort((a, b) => Number(b.home) - Number(a.home) || a.order - b.order);
  return {
    projects: projects.map((p) => ({ id: p.project, name: p.name, home: p.home })),
    agents: projects.flatMap((p) => {
      const cards = v.cards(p.project);
      const open = cards.length > 0 ? cards : (p.cards ?? []);
      return v.agents(p.project).map((a) => {
        const ask = open.find((c) => c.agent === a.name)?.question;
        return {
          project: p.project,
          name: a.name,
          main: a.main,
          archived: a.archived,
          status: a.status,
          title: a.title,
          purpose: a.purpose,
          waits: a.waits,
          since_ms: a.since_ms,
          ...(ask === undefined ? {} : { ask }),
          ...(a.main ? { atWork: p.working } : {}),
        };
      });
    }),
    artifacts: projects.flatMap((p) =>
      v.artifacts(p.project).map((a) => ({ project: p.project, id: a.id, title: a.title, kind: a.kind, what: whatOf(a), agent: a.agent, at_ms: a.at_ms })),
    ),
    scheduled: projects.flatMap((p) => v.scheduled?.(p.project) ?? []),
  };
}

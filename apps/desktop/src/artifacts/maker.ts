// Who an open artifact's words go to (designer's artifact-open v2, ambient-lead m_19604, amb-win
// m_19613): the agent that made it, whose thread sits in the centre beside the artifact, with the
// screen's ONE composer ('to perf · about “title”'). An archived maker keeps its
// thread readable, dim, and the composer goes to the project's main. The frame (amb-win) reads
// useArtifactMaker for the centre's thread and aboutWords for the composer's words. Owner:
// task-panel. Pure parts here, laws in maker.test.ts.
import type { Agent } from '@/proto';
import { useAgents } from '@/store';
import { MAIN } from '@/app/route';
import { useAllArtifacts } from './hooks';

/** The composer's words on an open artifact: whom they go to, the label and the empty field's words. Pure. */
export interface AboutWords {
  /** the agent his words go to: the maker, or the project's main when the maker is archived */
  readonly agent: string;
  /** the maker's thread reads dim (archived or gone) */
  readonly archived: boolean;
  /** the composer's label line: 'to perf · about “product page speed”' */
  readonly to: string;
  /** the empty field: 'ask perf about it, then ⏎' */
  readonly placeholder: string;
}

/** The words for an artifact made by `maker` (its row in the agents list, if any). Pure. */
export function aboutWords(maker: string, title: string, row: Pick<Agent, 'archived'> | undefined): AboutWords {
  // not in the list (yet: the agents event may come after the artifacts'): its own name, as listed
  const archived = row?.archived === true;
  const agent = archived ? MAIN : maker;
  return { agent, archived, to: `to ${agent} · about “${title}”`, placeholder: `ask ${agent} about it, then ⏎` };
}

/** The agent that made this artifact (its thread goes in the centre); undefined while the artifact isn't listed (the frame shows main's). */
export function useArtifactMaker(project: string, id: string): string | undefined {
  return useAllArtifacts(project).find((x) => x.a.id === id)?.a.agent;
}

/** The composer's words for this artifact, from the live agents list; undefined while it isn't listed. */
export function useAboutWords(project: string, id: string): AboutWords | undefined {
  const it = useAllArtifacts(project).find((x) => x.a.id === id);
  const agents = useAgents(project);
  if (it === undefined) return undefined;
  return aboutWords(it.a.agent, it.a.title, agents.find((a) => a.name === it.a.agent));
}

// Who an open artifact's words go to (designer's artifact-open v2, ambient-lead m_19604, amb-win
// m_19613): the agent that made it, whose thread sits in the centre beside the artifact, with the
// screen's ONE composer ('to perf · about “title”'). An archived maker keeps its
// thread readable, dim, and the composer goes to the project's main. The frame (amb-win) reads
// useArtifactMaker for the centre's thread and aboutWords for the composer's words. Owner:
// task-panel. Pure parts here, laws in maker.test.ts.
import type { Agent } from '@/proto';
import { useAgents } from '@/store';
import { MAIN } from '@/app/route';
import { useRouter } from '@/app/router';
import { aboutTip } from '@/app/tipwords';
import { shownName } from '@/agents/model';
import { useAllArtifacts } from './hooks';
import { composer } from '../proto/words.gen';

/** The composer's words on an open artifact: whom they go to, the label and the empty field's words. Pure. */
export interface AboutWords {
  /** the agent his words go to: the maker, or the project's main when the maker is archived */
  readonly agent: string;
  /** the maker's thread reads dim (archived or gone) */
  readonly archived: boolean;
  /** the composer's label line: 'to perf · about “product page speed”', '↳ to perf · about “…”' when pink */
  readonly to: string;
  /** the empty field: 'ask perf about it, then ⏎' */
  readonly placeholder: string;
  /**
   * his words go to a live sub-agent, not main (art-target, his ask): the composer's pink (the
   * answering state's 1.5 px accent border, accent tab and send); the border's tip says so. None:
   * main's own artifact, an archived maker, one not listed (yet): the plain composer.
   */
  readonly pink?: { readonly tip: string };
  /** the tab's right while pink: 'esc to bise instead' (where esc goes back); none when esc lands on the same agent */
  readonly end?: string;
}

/**
 * The words for an artifact made by `maker` (its row in the agents list, if any). `back`: the agent
 * of the thread esc goes back to (the router's last place, when it is a thread), else none. Pure.
 */
export function aboutWords(maker: string, title: string, row: Pick<Agent, 'archived'> | undefined, back?: string): AboutWords {
  // not in the list (yet: the agents event may come after the artifacts'): its own name, as listed
  const archived = row?.archived === true;
  const agent = archived ? MAIN : maker;
  // the project's main is 'bise' here as in every other composer (designer m_27021); `agent` routes
  const name = shownName(agent);
  const plain = { agent, archived, to: composer.tab_about({ agent: name, title }), placeholder: composer.placeholder_about({ agent: name }) };
  if (row === undefined || archived || agent === MAIN) return plain;
  const escTo = back === undefined || back === agent ? undefined : shownName(back);
  return { ...plain, to: `${ABOUT_HEAD}${plain.to}`, pink: { tip: aboutTip(agent, escTo) }, ...(escTo === undefined ? {} : { end: composer.tab_esc_instead({ agent: escTo }) }) };
}

/** The pink tab's head (the answering state's '↳', composer-target A): the tab keeps 'to perf' whole. */
export const ABOUT_HEAD = '↳ ';

/** The agent that made this artifact (its thread goes in the centre); undefined while the artifact isn't listed (the frame shows main's). */
export function useArtifactMaker(project: string, id: string): string | undefined {
  return useAllArtifacts(project).find((x) => x.a.id === id)?.a.agent;
}

/** The composer's words for this artifact, from the live agents list; undefined while it isn't listed. */
export function useAboutWords(project: string, id: string): AboutWords | undefined {
  const it = useAllArtifacts(project).find((x) => x.a.id === id);
  const agents = useAgents(project);
  // where esc and ✕ go back to (ArtifactView's useClose): the last place, when it is a thread
  const last = useRouter().places('back', 1)[0];
  if (it === undefined) return undefined;
  return aboutWords(it.a.agent, it.a.title, agents.find((a) => a.name === it.a.agent), last?.screen === 'thread' ? last.agent : undefined);
}

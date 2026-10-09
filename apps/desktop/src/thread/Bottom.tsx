// b1 (his card #476, decision 2026-10-09, page inbox-native v2): one inbox and one composer at the
// bottom of every view, like the terminal's, on the screens with no composer of their own (an
// agent's review, a project's agents / changes / feature / artifacts, settings, scheduled…). It
// writes to whom the route says (bottomTarget: the review's agent, else the project's main, else
// bise's main) and stays on the screen (the block never moves from screen to screen). The inbox
// part is amb-home's InboxBlock (b2, eb3da983), the same as a thread's: an item opens in place and
// tells the composer what his words do (a question's answer, or a plain message). Owner: amb-win.
import { useCallback, useState } from 'react';
import { InboxBlock, type Answering } from '@/inbox';
import { shownName } from '@/agents/model';
import { useAgents, useProjects, useStore } from '@/store';
import { MAIN } from '@/app/route';
import { answerOf, HERE_BISE, ThreadComposer } from './ThreadScreen';
import { composerWords } from './head';

const NOOP = (): void => undefined;

export function BottomBlock({ project, agent }: { project: string; agent: string }) {
  const store = useStore();
  const row = useProjects().find((p) => p.project === project);
  const me = useAgents(project).find((a) => a.name === agent);
  const [answering, setAnswering] = useState<Answering | null>(null);
  // whom he writes to, as a thread names it: bise (its home or a project's main), else the agent
  const name = agent === MAIN ? 'bise' : shownName(agent);
  const words = composerWords(name);
  const label = agent === MAIN && row !== undefined && !row.home ? `${words.label} · ${row.name}` : words.label;
  const stop = useCallback(() => {
    store.stop(project, agent);
  }, [store, project, agent]);
  return (
    <div className="app-bottom th-screen" data-testid="app.bottom" data-project={project} data-agent={agent} data-answering={answering !== null}>
      <InboxBlock here={row?.home === true && agent === MAIN ? HERE_BISE : { project, agent }} onAnswer={setAnswering} />
      <ThreadComposer
        project={project}
        agent={agent}
        busy={me?.status === 'working'}
        to={answering?.label ?? label}
        {...(answering?.end === undefined ? {} : { toEnd: answering.end })}
        placeholder={answering?.answer != null ? 'your answer, then ⏎' : words.placeholder}
        answer={answerOf(answering)}
        onStop={stop}
        quoting={false}
        onReady={NOOP}
        onSent={NOOP}
      />
    </div>
  );
}

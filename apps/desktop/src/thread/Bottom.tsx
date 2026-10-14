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
import { answerOf, HERE_BISE, ThreadComposer } from './ThreadComposer';
import { composerWords, usageLine } from './head';
import { useTabPlace } from './ComposerTab';
import { useRoute } from '@/app/router';
import { crumbOf } from '@/app/side';

const NOOP = (): void => undefined;

export function BottomBlock({ project, agent }: { project: string; agent: string }) {
  const store = useStore();
  const row = useProjects().find((p) => p.project === project);
  const me = useAgents(project).find((a) => a.name === agent);
  const [answering, setAnswering] = useState<Answering | null>(null);
  // whom he writes to, as a thread names it: bise (its home or a project's main), else the agent
  const name = agent === MAIN ? 'bise' : shownName(agent);
  const words = composerWords(name);
  // the tab (designer's composer-strip A): the project only where this screen's crumb doesn't name it
  const route = useRoute();
  const place = useTabPlace(project, me, row?.home === true);
  const project_ = row === undefined || row.home ? undefined : row.name;
  const crumbHas = project_ !== undefined && crumbOf(route, () => project_).includes(project_);
  const tab = {
    label: answering?.label ?? words.label,
    place,
    project: crumbHas ? undefined : project_,
    context: usageLine(me?.usage?.words),
    who: name,
  };
  const stop = useCallback(() => {
    store.stop(project, agent);
  }, [store, project, agent]);
  return (
    <div className="app-bottom th-screen" data-testid="app.bottom" data-project={project} data-agent={agent} data-answering={answering !== null}>
      {/* on the inbox screen the list is the inbox: the block shows only an item he opens (designer m_25639) */}
      <InboxBlock here={row?.home === true && agent === MAIN ? HERE_BISE : { project, agent }} onAnswer={setAnswering}
        {...(route.screen === 'inbox' ? { rest: 'open-only' as const } : {})} />
      <ThreadComposer
        project={project}
        agent={agent}
        busy={me?.status === 'working'}
        tab={tab}
        tabEnd={answering?.end}
        me={me}
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

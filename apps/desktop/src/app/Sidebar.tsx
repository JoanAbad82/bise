// The sidebar: bise, his projects (the core's rows, his order), and the
// agents of the project in view. Owner: amb-win.
//
// It reads only projects, the route and the agents of the project in view:
// a thread's entries never re-render it. A project's dot says, in this
// order: its folder is gone, its hub is down, an agent works, something
// waits on him, all quiet.
import { Fragment, memo, useEffect } from 'react';
import { Row, SectionHead, Side, type DotState } from '@/ds';
import type { Agent, Feature, ProjectRow } from '@/proto';
import { useAgents, useFeatures, useProjects } from '@/store';
import { groupsOf } from '@/review/feature';
import { dotOf, endOf, liveOf, numbersOf } from '@/agents/model';
import { MAIN, projectOf, type Route } from './route';
import { useRoute, useRouter } from './router';
import { useNow } from './clock';
import { Tip } from '@/setup';
import { useTour } from '@/setup/useTour';
import { Hint, hintUsed, useHint } from './hints';

/** A project row's dot. Pure. */
export function projectDot(p: ProjectRow): DotState {
  if (p.missing === true) return 'er';
  if (!p.running) return 'off';
  // its '2 at work' is the row's words: a project's sign never moves for its agents' work (ambient m_11472)
  if (p.waits > 0) return 'nd';
  return 'ok';
}

/** A project row's end: what waits on him (accent), else how many work, else its gone folder. Pure. */
export function projectEnd(p: ProjectRow): { text: string; needs: boolean } {
  if (p.missing === true) return { text: 'folder gone', needs: true };
  if (p.waits > 0) return { text: String(p.waits), needs: true };
  if (p.working > 0) return { text: `${p.working} at work`, needs: false };
  return { text: '', needs: false };
}

/** His projects in his order, bise's own out (it is the bise row). Pure. */
export function projectsOf(rows: readonly ProjectRow[]): ProjectRow[] {
  return rows.filter((p) => !p.home).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function Sidebar() {
  const router = useRouter();
  const route = useRoute();
  const rows = useProjects();
  const home = rows.find((p) => p.home);
  const inView = projectOf(route);
  const waits = rows.reduce((n, p) => n + p.waits, 0);
  return (
    <Side
      testId="app.sidebar"
      foot="+ add a project"
      footTestId="app.sidebar.add"
      onFoot={() => {
        router.go({ screen: 'settings', page: 'projects' });
      }}
    >
      <Row
        kind="me"
        name="bise"
        sub={waits > 0 ? `${waits} waiting for you` : 'every project'}
        on={route.screen === 'bise' || (home !== undefined && inView === home.project)}
        onClick={() => {
          router.go({ screen: 'bise' });
        }}
        testId="app.sidebar.bise"
      />
      {home !== undefined && inView === home.project && <Agents project={home.project} route={route} />}
      <SectionHead>projects</SectionHead>
      {projectsOf(rows).map((p) => (
        <ProjectItem key={p.project} p={p} on={inView === p.project} route={route} />
      ))}
    </Side>
  );
}

const ProjectItem = memo(function ProjectItem({ p, on, route }: { p: ProjectRow; on: boolean; route: Route }) {
  const router = useRouter();
  const end = projectEnd(p);
  return (
    <>
      <Row
        kind="pj"
        name={p.name}
        dot={projectDot(p)}
        end={end.text}
        needs={end.needs}
        on={on && route.screen === 'thread' && route.agent === MAIN}
        onClick={() => {
          router.go({ screen: 'thread', project: p.project, agent: MAIN });
        }}
        testId={`app.sidebar.project.${p.project}`}
      />
      {on && <Agents project={p.project} route={route} />}
    </>
  );
});

/**
 * The live agents of the project in view, main out (it is the project's
 * row), as the TUI's panel: the ones in no feature, then each feature's
 * head ('ψ gift-cards', opens the feature) with its agents under it.
 */
function Agents({ project, route }: { project: string; route: Route }) {
  const router = useRouter();
  const all = useAgents(project);
  const features = useFeatures(project);
  const { solo, groups } = groupsOf(
    liveOf(all).filter((a) => !a.main),
    features,
  );
  // the TUI's numbers: kept while an agent lives, a newcomer takes the smallest free one
  const nums = numbersOf(project, all);
  const now = useNow();
  // L25: the demo's 'start' tip under the first demo agent, 'steer' under the one that waits for him
  const tour = useTour(project);
  const liveDemo = tour.snap.members.filter((m) => !m.archived);
  const tipAt = tour.tip === 'start' ? liveDemo[0]?.name : tour.tip === 'steer' ? liveDemo.at(-1)?.name : undefined;
  // S36: the first agent's one-time hint under the first agent's row (a demo tip there wins)
  const first = solo[0]?.name ?? groups[0]?.agents[0]?.name;
  const hint = useHint('first_agent', first !== undefined && tour.tip === null);
  const inAgent = route.screen === 'thread' && route.project === project && route.agent !== MAIN;
  useEffect(() => {
    if (inAgent) hintUsed('first_agent');
  }, [inAgent]);
  const row = (a: Agent) =>
    tipAt === a.name && tour.tip !== null ? (
      <Fragment key={a.name}>
        <AgentRow project={project} a={a} n={nums.get(a.name) ?? 0} route={route} now={now} />
        <div className="app-tip">
          <Tip tip={tour.tip} snap={tour.snap} />
        </div>
      </Fragment>
    ) : hint && first === a.name ? (
      <Fragment key={a.name}>
        <AgentRow project={project} a={a} n={nums.get(a.name) ?? 0} route={route} now={now} />
        <div className="app-tip">
          <Hint name="first_agent" />
        </div>
      </Fragment>
    ) : (
      <AgentRow key={a.name} project={project} a={a} n={nums.get(a.name) ?? 0} route={route} now={now} />
    );
  return (
    <>
      {solo.map(row)}
      {groups.map((g) => (
        <Fragment key={`ψ ${g.feature.name}`}>
          <Row
            kind="ag"
            name={`ψ ${g.feature.name}`}
            end={distanceShort(g.feature)}
            on={route.screen === 'feature' && route.project === project && route.name === g.feature.name}
            onClick={() => {
              router.go({ screen: 'feature', project, name: g.feature.name });
            }}
            testId={`app.sidebar.feature.${g.feature.name}`}
          />
          {g.agents.map(row)}
        </Fragment>
      ))}
    </>
  );
}

/** A feature's end in the sidebar: what it waits for, else how far it is. */
function distanceShort(f: Feature): string {
  if (f.building) return 'building';
  if (f.trial) return 'on trial';
  return `${String(f.ahead)} ahead`;
}

function AgentRow({ project, a, n, route, now }: { project: string; a: Agent; n: number; route: Route; now: number }) {
  const router = useRouter();
  const end = endOf(a, now);
  return (
    <Row
      kind="ag"
      name={
        // its ⌥ number (tui-parity W4: the panel's numbers for ⌥1-9)
        <>
          {n >= 1 && n <= 9 && <span className="app-n">{n}</span>}
          {a.name}
          {/* its context gauge, the TUI panel's short form as the hub sends it ('17%', or '42k'
              without a known window; amb-feed c317fc32); the head keeps the long words */}
          {a.usage != null && a.usage.short !== '' && (
            <span className="app-gauge" data-testid={`app.sidebar.agent.${a.name}.gauge`}>
              {a.usage.short}
            </span>
          )}
        </>
      }
      dot={dotOf(a.status)}
      end={end.text}
      needs={end.needs}
      on={route.screen === 'thread' && route.project === project && route.agent === a.name}
      onClick={() => {
        router.go({ screen: 'thread', project, agent: a.name });
      }}
      testId={`app.sidebar.agent.${a.name}`}
    />
  );
}

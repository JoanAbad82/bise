// The sidebar: bise, his projects (the core's rows, his order), and the
// agents of the project in view. Owner: amb-win.
//
// It reads only projects, the route and the agents of the project in view:
// a thread's entries never re-render it. A project's dot says, in this
// order: its folder is gone, its hub is down, an agent works, something
// waits on him, all quiet.
import { memo } from 'react';
import { Row, SectionHead, Side, type DotState } from '@/ds';
import type { ProjectRow } from '@/proto';
import { useAgents, useProjects } from '@/store';
import { dotOf, endOf, liveOf } from '@/agents/model';
import { MAIN, projectOf, type Route } from './route';
import { useRoute, useRouter } from './router';
import { useNow } from './clock';

/** A project row's dot. Pure. */
export function projectDot(p: ProjectRow): DotState {
  if (p.missing === true) return 'er';
  if (!p.running) return 'off';
  if (p.working > 0) return 'wk';
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

/** The live agents of the project in view, main out (it is the project's row). */
function Agents({ project, route }: { project: string; route: Route }) {
  const router = useRouter();
  const agents = liveOf(useAgents(project)).filter((a) => !a.main);
  const now = useNow();
  return (
    <>
      {agents.map((a, i) => {
        const end = endOf(a, now);
        return (
          <Row
            key={a.name}
            kind="ag"
            name={
              // its ⌥ number (tui-parity W4: the panel's numbers for ⌥1-9)
              i < 9 ? (
                <>
                  <span className="app-n">{i + 1}</span>
                  {a.name}
                </>
              ) : (
                a.name
              )
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
      })}
    </>
  );
}

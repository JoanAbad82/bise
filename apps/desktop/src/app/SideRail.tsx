// The left bar folded to a 56 px icon rail while an artifact is open under 1200 px (designer's
// artifact-open page, m_20435 (f)): bise's ':*', ↗ artifacts, ◷ scheduled, then each project's
// initials. The title bar's sidebar button slides the whole bar back over it. Owner: amb-win.
import { IconButton } from '@/ds';
import { useProjects } from '@/store';
import { LiveBiseMark } from './Marks';
import { MAIN, projectOf } from './route';
import { useRoute, useRouter } from './router';
import { projectsOf, useWaitingTotal } from './Sidebar';

/** The rail's width: the left bar folded to its icons. */
export const RAIL_PX = 56;

/** A project's initials on the rail: its first two words' first letters ('gift-cards' 'GC'), else its first letter. Pure. */
export function initialsOf(name: string): string {
  const words = name.split(/[\s\-_.]+/u).filter((w) => w !== '');
  const first = (w: string | undefined) => (w === undefined ? '' : (Array.from(w)[0] ?? '').toUpperCase());
  return words.length >= 2 ? first(words[0]) + first(words[1]) : first(words[0] ?? name);
}

export function SideRail() {
  const router = useRouter();
  const route = useRoute();
  const rows = useProjects();
  const waits = useWaitingTotal();
  const inView = projectOf(route);
  return (
    <nav className="app-rail" data-testid="app.rail" aria-label="places">
      <div className="app-rail-lights" />
      <IconButton
        label={waits > 0 ? `bise · ${String(waits)} waiting for you` : 'bise'}
        size="bar"
        pressed={route.screen === 'bise'}
        onClick={() => {
          router.go({ screen: 'bise' });
        }}
        testId="app.rail.bise"
      >
        <LiveBiseMark testId="app.rail.bise.mark" />
      </IconButton>
      <IconButton
        label="artifacts"
        size="bar"
        onClick={() => {
          router.go({ screen: 'artifacts', project: '' });
        }}
        testId="app.rail.artifacts"
      >
        <span className="app-rail-g" aria-hidden="true">
          ↗
        </span>
      </IconButton>
      <IconButton
        label="scheduled"
        size="bar"
        pressed={route.screen === 'scheduled'}
        onClick={() => {
          router.go({ screen: 'scheduled' });
        }}
        testId="app.rail.scheduled"
      >
        <span className="app-rail-g" aria-hidden="true">
          ◷
        </span>
      </IconButton>
      <div className="app-rail-sep" />
      {projectsOf(rows).map((p) => (
        <IconButton
          key={p.project}
          label={p.name}
          size="bar"
          pressed={inView === p.project}
          onClick={() => {
            router.go({ screen: 'thread', project: p.project, agent: MAIN });
          }}
          testId={`app.rail.project.${p.project}`}
        >
          <span className="app-rail-init" aria-hidden="true">
            {initialsOf(p.name)}
          </span>
        </IconButton>
      ))}
    </nav>
  );
}

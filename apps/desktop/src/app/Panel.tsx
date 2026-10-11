// The right panel, option A (designer's desktop-screens v6/v7, signed): what
// was made here, 320 px: 'artifacts · storefront' and 'all ›' (every
// project's), the project's artifacts by day (amb-kit's ArtifactList fills
// the rows), its keys line; ⌥⌘0 shows or hides it. The titlebar's
// '↗ artifacts · 5 ⌥⌘0' says how many and is tinted while it shows. Open by
// default from 1100 px, his choice kept; under 1000 px it slides over the
// thread (App.tsx). Owner: amb-win (the frame); amb-kit (the rows).
import { useSyncExternalStore } from 'react';
import { ArtifactList } from '@/artifacts';
import { Act } from '@/ds';
import { ScheduledHere } from '@/scheduled';
import { useStore, type Store } from '@/store';
import { useRouter } from './router';

/** The projects the panel reads: one, or every one for '' (bise's own thread). */
function idsOf(store: Store, project: string | undefined): string[] {
  if (project === undefined) return [];
  return project === '' ? store.projects().map((p) => p.project) : [project];
}

/** How many artifacts a project has (every project's for ''): the titlebar button's count, a number. */
export function useArtifactCount(project: string | undefined): number {
  const store = useStore();
  const ids = idsOf(store, project).join('\n');
  return useSyncExternalStore(
    (cb) => {
      const offs = (ids === '' ? [] : ids.split('\n')).map((p) => store.subscribe(`artifacts:${p}`, cb));
      offs.push(store.subscribe('projects', cb));
      return () => {
        for (const off of offs) off();
      };
    },
    () => idsOf(store, project).reduce((n, p) => n + store.artifacts(p).length, 0),
  );
}

export function Panel({ project, name, over }: { project: string; name: string; over?: boolean }) {
  const router = useRouter();
  const store = useStore();
  // every project's list ('') opens an artifact in the project that made it
  const open = (id: string) => {
    const p = project !== '' ? project : idsOf(store, '').find((x) => store.artifacts(x).some((a) => a.id === id));
    if (p !== undefined) router.go({ screen: 'artifacts', project: p, id });
  };
  return (
    <aside className={over === true ? 'app-panel over' : 'app-panel'} data-testid="app.panel" aria-label={`artifacts of ${name}`}>
      <div className="app-panel-head">
        <b>artifacts</b>
        <span className="app-panel-dim">· {name}</span>
        <Act onClick={() => { router.go({ screen: 'artifacts', project: '' }); }} testId="app.panel.all">
          all ›
        </Act>
      </div>
      <div className="app-panel-body">
        <ArtifactList project={project} onOpen={open} />
        {/* then its scheduled tasks (amb-kit 5d0cd8b9; nothing when it has none) */}
        <ScheduledHere project={project} onOpen={() => { router.go({ screen: 'scheduled' }); }} />
      </div>
      {/* the designer's keys line: space looks at its file since the hub sends Artifact.path (amb-feed 2f4ce9c9) */}
      <div className="app-panel-keys" data-testid="app.panel.keys">
        <span><kbd>⏎</kbd> open</span>
        <span><kbd>space</kbd> quick look</span>
        <span><kbd>⌥⌘0</kbd> hide</span>
      </div>
    </aside>
  );
}

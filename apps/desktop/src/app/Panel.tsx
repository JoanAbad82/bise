// The right panel, option A (designer's desktop-screens v6/v7, signed): what
// was made here, 320 px: 'artifacts · storefront' and 'all ›' (every
// project's), the project's artifacts by day (amb-kit's ArtifactList fills
// the rows), its keys line; ⌥⌘0 shows or hides it. The titlebar's
// '↗ artifacts · 5 ⌥⌘0' says how many and is tinted while it shows. Open by
// default from 1100 px, his choice kept; under 1000 px it slides over the
// thread (App.tsx). Owner: amb-win (the frame); amb-kit (the rows).
import { useSyncExternalStore } from 'react';
import { ArtifactList } from '@/artifacts';
import { useStore } from '@/store';
import { useRouter } from './router';

/** How many artifacts a project has: the titlebar button's count (a number, so no new snapshot for nothing). */
export function useArtifactCount(project: string | undefined): number {
  const store = useStore();
  return useSyncExternalStore(
    (cb) => (project === undefined ? () => undefined : store.subscribe(`artifacts:${project}`, cb)),
    () => (project === undefined ? 0 : store.artifacts(project).length),
  );
}

export function Panel({ project, name, over }: { project: string; name: string; over?: boolean }) {
  const router = useRouter();
  return (
    <aside className={over === true ? 'app-panel over' : 'app-panel'} data-testid="app.panel" aria-label={`artifacts of ${name}`}>
      <div className="app-panel-head">
        <b>artifacts</b>
        <span className="app-panel-dim">· {name}</span>
        <button type="button" className="app-panel-all" onClick={() => { router.go({ screen: 'artifacts', project: '' }); }} data-testid="app.panel.all">
          all ›
        </button>
      </div>
      <div className="app-panel-body">
        <ArtifactList project={project} onOpen={(id) => { router.go({ screen: 'artifacts', project, id }); }} />
      </div>
      {/* only the keys that work (amb-kit's law 5): space looks once the hub sends a file path */}
      <div className="app-panel-keys" data-testid="app.panel.keys">
        <span><kbd>⏎</kbd> open</span>
        <span><kbd>⌥⌘0</kbd> hide</span>
      </div>
    </aside>
  );
}

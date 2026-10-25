// src/app/panel · the Overview tab (page native-mac mockup 1): what the right bar was (agents,
// archived, artifacts, scheduled, processes), restyled to the panel's rows (RightBar.tsx draws the
// sections). Its project is the view's (side.ts panelProject: on bise's own thread every project's),
// or the one a card pinned (openOverview). A section a card asked for scrolls into view once.
// Owner: nm-panel.
import { useEffect } from 'react';
import { useProjects } from '@/store';
import { useRoute } from '@/app/router';
import { panelProject } from '@/app/side';
import { RightBar } from '@/app/RightBar';
import { takeSection } from './state';

/** The Overview of `pinned`, else of the view. */
export function Overview({ pinned, shown }: { pinned: string | undefined; shown: boolean }) {
  const route = useRoute();
  const rows = useProjects();
  const home = rows.find((p) => p.home)?.project;
  const project = pinned ?? panelProject(route, home, rows.filter((p) => !p.home).length) ?? home;
  useEffect(() => {
    if (!shown) return;
    const s = takeSection();
    if (s === null) return;
    const id = s === 'processes' ? 'running' : s;
    requestAnimationFrame(() => {
      document.querySelector(`[data-testid="app.right.${id}"]`)?.scrollIntoView({ block: 'start' });
    });
  }, [shown, pinned]);
  if (project === undefined) return null;
  const name = project === '' ? '' : (rows.find((p) => p.project === project)?.name ?? project);
  return <RightBar project={project} name={name} />;
}

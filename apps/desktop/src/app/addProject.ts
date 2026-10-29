// '+ add a project' and ⌘N (designer's S11 v2 shot 19, ambient-lead m_18949): the ds Sheet amb-home
// built (settings/AddSheet.tsx, fee2a555) opens over the window; with no sheet mounted (a test that
// draws one screen) the settings' projects page is the way in, as before. Owner: amb-win.
import { openAddSheet } from '@/settings/AddSheet';
import type { Router } from './router';

/** Open the add-a-project sheet; with none mounted, go to settings › projects. */
export function addProject(router: Pick<Router, 'go'>): void {
  if (!openAddSheet()) router.go({ screen: 'settings', page: 'projects' });
}

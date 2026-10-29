// His plugins' objects in a project's office (plugin-objects.ts officeObjects): the project's
// plugins and his picks (prefs bims.objects.<project>). Every office view asks the core for the
// plugins itself on mount: the core sends a project's list only when asked (or on a change), so a
// view that only read the store drew none until another one asked (the side tile's empty wing
// until the Office tab opened, his m_49375).
import { useEffect, useMemo } from 'react';
import { getPref, type Prefs } from '@/settings/prefs';
import { usePlugins, usePrefs, useStore } from '@/store';
import { objectsPrefKey, officeObjects, picksOf, type PluginObject } from './plugin-objects';

/** The project's plugin objects, its plugins asked once per mount and project. */
export function useOfficeObjects(project: string): readonly PluginObject[] {
  const store = useStore();
  const prefs = usePrefs() as Prefs | null;
  const plugins = usePlugins(project);
  useEffect(() => {
    store.command({ cmd: 'plugins', project });
  }, [store, project]);
  const picks = getPref(prefs, objectsPrefKey(project));
  return useMemo(() => officeObjects(plugins, picksOf(picks)), [plugins, picks]);
}

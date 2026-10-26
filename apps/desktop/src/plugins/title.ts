// A plugin's title for the window's bar ('Plugins › Linear'): the one its page shows, from the
// installed rows or, for one not installed yet (mistral:linear), from the browse lists, as
// PluginsScreen finds its page (ui-review m_44027). Owner: nm-pages-b.
import { useBrowse, useBrowseSources, usePlugins, useStore } from '@/store';
import { pluginCrumb } from '@/app/side';
import { titleOf } from './model';

/** id → the plugin's title; its id without its kind's prefix while no row has it. */
export function usePluginTitle(): (id: string) => string {
  const store = useStore();
  const rows = usePlugins();
  const mistral = useBrowse('mistral');
  const sources = useBrowseSources();
  return (id) => {
    const p = (rows ?? []).find((r) => (r.id === '' ? r.name : r.id) === id)
      ?? [mistral ?? [], ...sources.map((s) => store.browse(s) ?? [])].flat().find((r) => r.id === id);
    return p === undefined ? pluginCrumb(id) : titleOf(p);
  };
}

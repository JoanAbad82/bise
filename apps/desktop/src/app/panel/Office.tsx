// src/app/panel · a project's office in a tab (Entity { kind: 'office', project }): the bims world's
// click opens it (nm-side), the full view of bims/Office. It was the right bar's head of AGENTS; it
// moved here with the bar's end (bise fait mac: the world floats on the right side, the office opens
// in a tab, the Overview lists rows only). A bim's click opens its agent's thread; an object's '?'
// its plugin; the map chip his pick (/bims <map>). Owner: nm-panel.
import { useEffect, useMemo } from 'react';
import { Office } from '@/bims/Office';
import { parts as bimsParts } from '@/bims/feed';
import { mapOf, mapPrefKey } from '@/bims/maps/ids';
import { objectsPrefKey, officeObjects, picksOf } from '@/bims/plugin-objects';
import { followOf } from '@/bims/focus';
import { getPref, type Prefs } from '@/settings/prefs';
import { useAgents, useCards, useGrowth, usePlaces, usePlugins, usePrefs, useStore } from '@/store';
import { useRoute, useRouter } from '@/app/router';

/** A project's office, the whole tab. */
export function OfficeTab({ project }: { project: string }) {
  const store = useStore();
  const router = useRouter();
  const route = useRoute();
  const agents = useAgents(project);
  const cards = useCards(project);
  const places = usePlaces(project);
  const growth = useGrowth(project);
  const prefs = usePrefs() as Prefs | null;
  const map = mapOf(getPref(prefs, mapPrefKey(project)));
  // his plugins' objects in the office: the project's plugins, asked once here (the core sends them
  // again on each change), and his picks (prefs bims.objects.<project>)
  const plugins = usePlugins(project);
  useEffect(() => {
    store.command({ cmd: 'plugins', project });
  }, [store, project]);
  const picks = getPref(prefs, objectsPrefKey(project));
  const objects = useMemo(() => officeObjects(plugins, picksOf(picks)), [plugins, picks]);
  const live = useMemo(() => agents.filter((a) => !a.archived), [agents]);
  const follow = followOf(route, project, agents);
  return (
    <div className="pn-office" data-testid="app.panel.office" data-project={project}>
      <Office
        project={project}
        agents={live}
        cards={cards}
        places={places}
        objects={objects}
        growth={growth}
        map={map}
        parts={bimsParts}
        follow={follow}
        onOpen={(agent) => {
          router.go({ screen: 'thread', project, agent });
        }}
        onOpenPlugin={(key) => {
          router.go({ screen: 'plugins', id: key });
        }}
        onPickMap={(m) => {
          store.command({ cmd: 'prefs_set', key: mapPrefKey(project), value: m });
        }}
      />
    </div>
  );
}

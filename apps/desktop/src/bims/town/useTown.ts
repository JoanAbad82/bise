// The town's rows from the store (bise's thread reads every project): each project's agents, cards,
// places, growth (the hub's when it said, else the index's) and his map pick (prefs
// bims.map.<project>), bise's own home among them (at the town's heart, bims m_29650). One snapshot,
// stable while nothing it reads changed, so the town builds again only on a change. Owner: maps-e.
import { useSyncExternalStore } from 'react';
import type { Growth, IndexRow } from '@/proto';
import { useStore, type Store } from '@/store';
import { getPref, type Prefs } from '@/settings/prefs';
import { mapOf, mapPrefKey } from '../maps/ids';
import type { TownProject } from './sites';

let last: { from: readonly unknown[]; items: readonly TownProject[] } | null = null;

const all = (s: Store) => s.projects();

/** every slice the town reads, in a fixed order: the snapshot is the same while they are */
function sources(s: Store): unknown[] {
  const rows = all(s);
  const out: unknown[] = [s.projects(), s.prefs(), s.index()];
  for (const p of rows) out.push(s.agents(p.project), s.cards(p.project), s.places(p.project), s.growth(p.project));
  return out;
}

function snapshot(s: Store): readonly TownProject[] {
  const from = sources(s);
  if (last !== null && last.from.length === from.length && last.from.every((x, i) => x === from[i])) return last.items;
  const prefs = s.prefs() as Prefs | null;
  const index = new Map<string, IndexRow>(s.index().map((r) => [r.project, r]));
  const items = all(s).map((p): TownProject => {
    const growth: Growth | null = s.growth(p.project) ?? index.get(p.project)?.growth ?? null;
    return {
      id: p.project,
      name: p.name !== '' ? p.name : p.project,
      map: mapOf(getPref(prefs, mapPrefKey(p.project))),
      growth,
      agents: s.agents(p.project),
      cards: s.cards(p.project),
      places: s.places(p.project),
      order: p.order,
      home: p.home,
    };
  });
  last = { from, items };
  return items;
}

/** The town's projects, bise's home among them, kept fresh. */
export function useTownProjects(): readonly TownProject[] {
  const store = useStore();
  return useSyncExternalStore(
    (cb) => {
      const keys = ['projects', 'prefs', 'index'];
      for (const p of all(store)) keys.push(`agents:${p.project}`, `places:${p.project}`, `growth:${p.project}`);
      const offs = keys.map((k) => store.subscribe(k, cb));
      return () => {
        for (const off of offs) off();
      };
    },
    () => snapshot(store),
  );
}

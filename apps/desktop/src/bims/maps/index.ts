// The maps' plans by id (maps/<id>.ts each, one file per map so the chunks build them side by side;
// their looks: render/maps/index.ts) and the office for a project's map. A map not ready yet draws
// the loft. Pure, no three. Owner: maps-a.
import type { Agent } from '@/proto';
import type { MapId, Office } from '../model';
import { DEFAULT_MAP, MAP_IDS } from './ids';
import type { Plan } from './plan';
import { loft } from './loft';
import { greenhouse } from './greenhouse';
import { campus } from './campus';
import { workshop } from './workshop';
import { kyoto } from './kyoto';
import { riad } from './riad';
import { nordic } from './nordic';
import { patio } from './patio';
import { haveli } from './haveli';
import { tropical } from './tropical';
import { cyclades } from './cyclades';
import { sahel } from './sahel';
import { california } from './california';

export const PLANS: Readonly<Record<MapId, Plan>> = {
  loft, greenhouse, campus, workshop, kyoto, riad, nordic, patio, haveli, tropical, cyclades, sahel, california,
};

/** The plan that draws a map: its own when ready, else the loft's. */
export function planOf(id: MapId): Plan {
  const p = PLANS[id];
  return p.ready ? p : PLANS[DEFAULT_MAP];
}

/** The maps the /bims picker offers: the ready ones, in MAP_IDS's order. */
export const readyMaps = (): MapId[] => MAP_IDS.filter((id) => PLANS[id].ready);

/**
 * The office for these agents on that map (the loft by default). `prev`: the office on screen,
 * passed on only when it is the same map's (its agents keep their desks).
 */
export function layoutOf(agents: readonly Agent[], map: MapId = DEFAULT_MAP, prev?: Office): Office {
  const p = planOf(map);
  return p.layout(agents, prev?.map === p.id ? prev : undefined);
}

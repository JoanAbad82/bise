// The maps' plans by id (maps/<id>.ts each, one file per map so the chunks build them side by side;
// their looks: render/maps/index.ts) and the office for a project's map. A map not ready yet draws
// the loft. Pure, no three. Owner: maps-a.
import type { Agent } from '@/proto';
import type { MapId, Office } from '../model';
import { DEFAULT_MAP, MAP_IDS } from './ids';
import type { Plan } from './plan';
import { withCozy } from '../cozy';
import { withSeats } from '../sit';
import { withInbox } from '../inbox';
import { roomKeepOut, withRoom } from './room';
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
import { climb } from './climb';

export const PLANS: Readonly<Record<MapId, Plan>> = {
  loft, greenhouse, campus, workshop, kyoto, riad, nordic, patio, haveli, tropical, cyclades, sahel, california, climb,
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
 * passed on only when it is the same map's (its agents keep their desks). With its cozy pieces
 * (cozy.ts withCozy: the plan's hints, the coffee corner's leg on the walks), each desk's way in
 * round its chair first (sit.ts withSeats), so the cozy pieces keep off it too.
 */
export function layoutOf(agents: readonly Agent[], map: MapId = DEFAULT_MAP, prev?: Office): Office {
  const p = planOf(map);
  const laid = p.layout(agents, prev?.map === p.id ? prev : undefined);
  const room = p.room;
  if (room === undefined) return withInbox(withCozy(withSeats(laid), p.cozy ?? {}));
  // the room for his plugins' objects (maps/room.ts): its walls out, the play corner's band kept from the cozy pieces
  const o = withRoom(laid, room);
  const hints = p.cozy ?? {};
  const keepOut = (x: Office) => [...(hints.keepOut?.(x) ?? []), ...roomKeepOut(x, room)];
  return withInbox(withCozy(withSeats(o), { ...hints, keepOut }));
}

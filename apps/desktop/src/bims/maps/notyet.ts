// A map not built yet (maps-b, maps-c, maps-d replace theirs): the loft's plan under its id, ready:
// false, so planOf (maps/index.ts) draws the loft for it and the /bims picker leaves it out. Pure.
import type { MapId } from '../model';
import { loftLayout } from './loft';
import type { Plan } from './plan';

export function notYet(id: MapId): Plan {
  return { id, ready: false, layout: (agents) => loftLayout(agents) };
}

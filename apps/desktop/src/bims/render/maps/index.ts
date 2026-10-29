// The maps' looks by id (render/maps/<id>.ts each, one file per map so the chunks build them side by
// side; their plans: maps/index.ts). The office's look is its map's (Office.map: planOf already
// drew the loft for a map not ready). Owner: maps-a.
import type { MapId } from '../../model';
import type { MapLook } from './look';
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

export const LOOKS: Readonly<Record<MapId, MapLook>> = {
  loft, greenhouse, campus, workshop, kyoto, riad, nordic, patio, haveli, tropical, cyclades, sahel, california, climb,
};

export const lookOf = (id: MapId): MapLook => LOOKS[id];

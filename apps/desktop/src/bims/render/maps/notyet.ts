// A map's look not built yet (maps-b, maps-c, maps-d replace theirs): the loft's under its id. Its
// plan is not ready either (maps/notyet.ts), so the office never asks for it but in a test. Owner: maps-a.
import type { MapId } from '../../model';
import { loft } from './loft';
import type { MapLook } from './look';

export const notYetLook = (id: MapId): MapLook => ({ ...loft, id });

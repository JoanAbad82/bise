// The town's real parts for Town.tsx: the office's (bims/feed.ts, its dive opens one), the pure
// modules it reads, and its renderer, in the office's chunk (import('../render')) so three loads
// once and the list never pays for it. Owner: maps-e.
import { activities } from '../activity';
import { layoutOf } from '../maps';
import { parts as office } from '../feed';
import type { TownParts } from './Town';

export const townParts: TownParts = {
  office,
  activities,
  layoutOf,
  load: () => import('../render').then((m) => m.makeTownRenderer),
};

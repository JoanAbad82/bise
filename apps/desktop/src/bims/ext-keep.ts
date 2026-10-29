// His sketch's extensions per project and map (extensions.ts): a high-water mark kept in the
// window's view record (keep.ts, no age), so a reload or a plugin he removes never takes a wing or a
// garden away (nothing visibly disappears). The client's rule, like the growth's (grow-keep.ts).
// Owner: bims-life.
import { keep } from '@/app/keep';
import { NO_NEED, either, type Need } from './extensions';
import type { MapId } from './maps/ids';

const key = (project: string, map: MapId): string => `bims.ext.${project}.${map}`;

/** a kept value as a need: anything else is none */
export function needOfKept(v: unknown): Need {
  if (v === null || typeof v !== 'object') return NO_NEED;
  const r = v as { wing?: unknown; garden?: unknown };
  const wing = typeof r.wing === 'number' && Number.isFinite(r.wing) && r.wing > 0 ? r.wing : 0;
  return { wing, garden: r.garden === true };
}

/** The extensions this project's map already had. */
export function extKept(project: string, map: MapId): Need {
  return needOfKept(keep.view(key(project, map)));
}

/** Keep the mark raised by `need` (written only when it moved). */
export function keepExt(project: string, map: MapId, need: Need): void {
  const kept = extKept(project, map);
  const high = either(kept, need);
  if (high.wing !== kept.wing || high.garden !== kept.garden) keep.setView(key(project, map), high);
}

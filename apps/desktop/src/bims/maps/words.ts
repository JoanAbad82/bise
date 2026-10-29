// The maps' words (rust/proto/src/words/bims.rs, designer's): each map's name and its one-line mood,
// and the /bims picker's rows: the ready maps, the project's one checked, a tip on each saying
// what picking it does. Pure. Owner: maps-a.
import type { Choice } from '@/composer/sources';
import { bims } from '@/proto/words_bims.gen';
import type { MapId } from './ids';

const WORDS: Readonly<Record<MapId, { readonly name: string; readonly mood: string }>> = {
  loft: { name: bims.map_loft, mood: bims.map_loft_mood },
  greenhouse: { name: bims.map_greenhouse, mood: bims.map_greenhouse_mood },
  campus: { name: bims.map_campus, mood: bims.map_campus_mood },
  workshop: { name: bims.map_workshop, mood: bims.map_workshop_mood },
  kyoto: { name: bims.map_kyoto, mood: bims.map_kyoto_mood },
  riad: { name: bims.map_riad, mood: bims.map_riad_mood },
  nordic: { name: bims.map_nordic, mood: bims.map_nordic_mood },
  patio: { name: bims.map_patio, mood: bims.map_patio_mood },
  haveli: { name: bims.map_haveli, mood: bims.map_haveli_mood },
  tropical: { name: bims.map_tropical, mood: bims.map_tropical_mood },
  cyclades: { name: bims.map_cyclades, mood: bims.map_cyclades_mood },
  sahel: { name: bims.map_sahel, mood: bims.map_sahel_mood },
  california: { name: bims.map_california, mood: bims.map_california_mood },
  climb: { name: bims.map_climb, mood: bims.map_climb_mood },
};

export const mapName = (id: MapId): string => WORDS[id].name;
export const mapMood = (id: MapId): string => WORDS[id].mood;

/** The /bims rows: one per map offered, its name, its mood, the current one checked; picking one runs /bims <id>. */
export function mapChoices(offered: readonly MapId[], current: MapId): Choice[] {
  return offered.map((id) => ({
    value: id,
    label: mapName(id),
    desc: mapMood(id),
    runs: true,
    ...(id === current ? { current: true, tip: bims.map_current_tip({ map: mapName(id) }) } : { tip: bims.map_pick_tip({ map: mapName(id) }) }),
  }));
}

// The office's maps (page bims-maps v7: « un menu /bims où on peut choisir l'ambiance de la map pour
// le projet »): their ids, in the /bims picker's order, and the one a project has when he never
// picked one. The hub's prefs keep his pick as a slug (bims.map.<project>, architect m_28589) and
// never list them: an id this table does not know reads as the loft. Pure, no import. Owner: maps-a.

export const MAP_IDS = [
  'loft',
  'greenhouse',
  'campus',
  'workshop',
  'kyoto',
  'riad',
  'nordic',
  'patio',
  'haveli',
  'tropical',
  'cyclades',
  'sahel',
  'california',
] as const;

export type MapId = (typeof MAP_IDS)[number];

export const DEFAULT_MAP: MapId = 'loft';

/** A map id from anything (his prefs' value): a known id, else the loft. */
export function mapOf(v: unknown): MapId {
  return (MAP_IDS as readonly unknown[]).includes(v) ? (v as MapId) : DEFAULT_MAP;
}

/** The prefs key of a project's map (rust/home prefs.rs bims_key: the hub id's shape). */
export const mapPrefKey = (project: string): string => `bims.map.${project}`;

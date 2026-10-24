// The objects' ids, three-free (like maps/ids.ts): what the app's entry chunk may read (the plugins'
// objects of plugin-objects.ts, a prefs pick) without loading the renderer; the makers stay behind
// import('./render'). A new object adds its id here, in its family's place: the registry's law
// (index.test.ts) names an id missing on either side. Pure, no import. Owner: bims-objects.

/** every object, in the families' order (index.ts FAMILIES) */
export const OBJ_IDS = [
  // games
  'chess',
  'pingpong',
  'arcade',
  'pinball',
  'babyfoot',
  // music
  'piano',
  'jukebox',
  // knowledge
  'shelf',
  'library',
  'telescope',
  // workshop
  'easel',
  'printer',
  // garden
  'plant',
  'campfire',
  // animals
  'cat',
  'catwalk',
  'cushion',
  'dog',
  'aquarium',
  // comms
  'mailbox',
  'booth',
  'visio',
  // machines
  'rack',
  'macdesk',
  // travel
  'scooter',
  'bike',
  // office
  'calendar',
  'files',
  'trophies',
  'extinguisher',
  'charts',
  'packing',
] as const;

export type ObjId = (typeof OBJ_IDS)[number];

const IDS: ReadonlySet<string> = new Set(OBJ_IDS);

export const isObjId = (s: string): s is ObjId => IDS.has(s);

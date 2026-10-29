// The plugins' objects in the bims' office (bims-plugins plan p1, page bims-plugins): the registry.
// A plugin is a real thing in the office (an arcade, a mailbox, a rack), never a bim (one bim = one
// agent). Each family has its file (games.ts, music.ts, ...); its makers land here by the family's
// line in FAMILIES, nothing else to touch. makeObject builds one at the origin, on the floor, its
// front to +z, centred on its foot:
// - off (a disabled plugin): glass, 30%, no shadow (kit.ts);
// - compact (a small office): its compact one (COMPACT: the library a shelf, the ping-pong table a
//   table football, the piano a jukebox), else the same one scaled down by COMPACT_SCALE;
// - n: its parts (books, lights, cups) or its variant (the printer's pages, the plant's pot).
// The laws (objects.test.ts): no pink or red, no two faces in one plane, every mesh inside its foot,
// glass is glass, compact is smaller.
import { Group } from 'three';
import { ANIMALS } from './animals';
import { COMMS } from './comms';
import { GAMES } from './games';
import { GARDEN } from './garden';
import { KITCHEN } from './kitchen';
import { KNOWLEDGE } from './knowledge';
import { type Foot, glassDepth, type Maker, partOf } from './kit';
import { MACHINES } from './machines';
import { MUSIC } from './music';
import { OFFICE } from './office';
import { TRAVEL } from './travel';
import { WORKSHOP } from './workshop';
import type { ObjId } from './ids';

export type { Foot } from './kit';
export { OBJ_IDS, isObjId, type ObjId } from './ids';

/** the families, as the collection table of page bims-plugins sorts them */
export const FAMILIES = {
  games: GAMES,
  music: MUSIC,
  knowledge: KNOWLEDGE,
  workshop: WORKSHOP,
  kitchen: KITCHEN,
  garden: GARDEN,
  animals: ANIMALS,
  comms: COMMS,
  machines: MACHINES,
  travel: TRAVEL,
  office: OFFICE,
} as const;

export type Family = keyof typeof FAMILIES;

type Ids<F> = F extends unknown ? Extract<keyof F, string> : never;
/** the makers' ids: the same as ids.ts OBJ_IDS (the law in index.test.ts) */
export type MakerId = Ids<(typeof FAMILIES)[Family]>;

const MAKERS = new Map<ObjId, { maker: Maker; family: Family }>();
for (const [family, makers] of Object.entries(FAMILIES) as [Family, Record<string, Maker>][]) {
  for (const [id, maker] of Object.entries(makers)) MAKERS.set(id as ObjId, { maker, family });
}

/** every maker's id, in the families' order (the law: the same list as ids.ts OBJ_IDS) */
export const MAKER_IDS: readonly ObjId[] = [...MAKERS.keys()];

export function familyOf(id: ObjId): Family {
  const m = MAKERS.get(id);
  if (!m) throw new Error(`no object ${id}`);
  return m.family;
}

/** a big object's compact one, for a small office */
export const COMPACT: Partial<Record<ObjId, ObjId>> = { library: 'shelf', pingpong: 'babyfoot', piano: 'jukebox' };
/** the others, in a small office: scaled down */
export const COMPACT_SCALE = 0.8;

export interface MakeOpts {
  /** a disabled plugin: the object in glass (default false) */
  readonly off?: boolean;
  /** 0 day .. 1 night: its screens and lamps glow (default 0) */
  readonly night?: number;
  /** its parts or its variant (default 5) */
  readonly n?: number;
  /** a small office: its compact one (default false) */
  readonly compact?: boolean;
  /** which of its looks, where it has several (the shelf's book colours; default 0) */
  readonly seed?: number;
}

export interface Made {
  readonly group: Group;
  /** the floor it takes, centred on the group's origin, and its height */
  readonly foot: Foot;
  /** it hangs on a wall, its back on z = -d/2 (the calendar) */
  readonly wall?: boolean;
}

export function makeObject(id: ObjId, opts: MakeOpts = {}): Made {
  const compact = opts.compact ?? false;
  const swap = compact ? COMPACT[id] : undefined;
  const m = MAKERS.get(swap ?? id);
  if (!m) throw new Error(`no object ${id}`);
  const group = new Group();
  group.name = swap ?? id;
  const o = { off: opts.off ?? false, night: opts.night ?? 0, n: opts.n ?? 5, seed: opts.seed ?? 0 };
  const s = m.maker(partOf(group, o), o);
  const k = compact && !swap ? COMPACT_SCALE : 1;
  const cx = s.x ?? 0;
  const cz = s.z ?? 0;
  if (k !== 1 || cx !== 0 || cz !== 0) {
    // the pieces move onto the foot's centre and scale; the group stays at the origin and at scale 1,
    // so whoever places it can still move, turn and scale it
    const inner = new Group();
    inner.scale.setScalar(k);
    inner.position.set(-cx * k, 0, -cz * k);
    for (const c of [...group.children]) inner.add(c);
    group.add(inner);
  }
  // off: one flat 30% layer, its own layers never stacked (kit.ts glassDepth)
  if (o.off) glassDepth(group);
  const foot = { w: s.w * k, d: s.d * k, h: s.h * k };
  return s.wall ? { group, foot, wall: true } : { group, foot };
}

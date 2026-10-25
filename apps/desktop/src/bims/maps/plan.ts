// A map's plan (the pure half of the prototype's REG entry, page bims-maps v5: plan + after): where
// the room, the desks, main's desk and its land queue, the eating place and its spots, the nap
// place, the board, the door, the terrace and the way out are, the furniture a walk never crosses,
// and the map's own walk graph, and the words for what each growth stage brings (things). One
// file per map (maps/<id>.ts); the look that draws it is render/maps/<id>.ts. maps/contract.test.ts checks every plan for 0..31 agents: every place on
// the graph, the graph connected, no leg through furniture. Pure, no three. Owner: maps-a.
import type { Agent } from '@/proto';
import type { Box, Leg, MapId, Office, Pt, Spot } from '../model';
import type { Stage, Things } from '../growth';
import type { CozyHints } from '../cozy';
import type { Room } from './room';

export type { Stage, Things };

export interface Plan<O extends Office = Office> {
  readonly id: MapId;
  /** drawn yet: a map whose plan and look are not built yet shows the loft (maps/index.ts planOf) */
  readonly ready: boolean;
  /**
   * The office for these agents (main and the others, in start order; archived rows have no desk).
   * `prev`: the office on screen, on this map: its living agents keep their desks. Method syntax on
   * purpose: a plan's own office type (the loft's LoftOffice) stands for Office in the table.
   */
  layout(agents: readonly Agent[], prev?: O): O;
  /**
   * What each building stage brings on this map, in words (growth.ts thingOf: the tag over a new
   * piece, the corner tip's next): the words_bims catalog's entries, never text. Absent: the loft's.
   */
  readonly things?: Things;
  /** where its cozy pieces may stand and what they keep off (cozy.ts placeCozy); absent: the loft's walls */
  readonly cozy?: CozyHints;
  /** the room its office makes for his plugins' objects past what its layout lays (maps/room.ts withRoom); absent: none (the loft has its bands in its layout) */
  readonly room?: Room;
  /** the floor boxes of the pieces its look draws past the furniture and the cozy kit, from the same numbers (Office.props); absent: none */
  props?(o: Office): readonly Box[];
}


/** The non-main live agents' names, in start order: one desk each. Pure. */
export const deskNames = (agents: readonly Agent[]): string[] => agents.filter((a) => !a.main && !a.archived).map((a) => a.name);

/** A box of w by d centred on (x, z); `of`: the place that sits in it (a bed, a deck chair). Pure. */
export function boxAt(x: number, z: number, w: number, d: number, of?: Pt): Box {
  return { x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, ...(of ? { of } : {}) };
}

/**
 * A nap bed's floor box (w across, d from back to front) and how far its middle sits behind the
 * napper's spot. The napper (pose.ts napping: reclined, hands folded on its belly, always facing the
 * room, +z) spans 0.54 across, from 0.83 behind its spot to 0.26 ahead: the box holds it with a
 * margin all round, its head inside (Gabriel, bims-clip: nappers lay across each other and off
 * their beds; render/clip.test.ts). Every map's beds are this box, its look draws the bed to it.
 */
export const NAP_BED = { w: 0.76, d: 1.35, back: 0.35 } as const;
/** a row of beds' spots from the back wall: the first row's z (its bed a step off the wall and what hangs on it), the next row's step (a bed and a lane) */
export const NAP_Z0 = 1.2;
export const NAP_ROW = 1.8;

/** The bed of a nap spot (NAP_BED, behind it: its napper faces the room whichever way the spot does), with its spot. Pure. */
export function napBedAt(s: Spot): Box {
  return boxAt(s.x, s.z - NAP_BED.back, NAP_BED.w, NAP_BED.d, s);
}

/**
 * A place's way in, as the loft does it: from the spot to its walkway (`wz`), then along it to its
 * aisle or lane (`ax`). Two legs (fewer when they are points); the plan joins (ax, wz) to its trunk.
 */
export function wayIn(s: Spot): Leg[] {
  const walk = { x: s.x, z: s.wz };
  const entry = { x: s.ax, z: s.wz };
  return ([[s, walk], [walk, entry]] as const).filter(([a, b]) => Math.hypot(a.x - b.x, a.z - b.z) > 1e-6);
}

/** Every place of an office a bim may walk to (the contract: each is on the walk graph), its park's spots too. Pure. */
export function placesOf(o: Office): Spot[] {
  return [...o.desks.values(), o.mainDesk, ...o.islandSpots, ...o.lounge, ...o.boardSpots, ...o.queue, o.door, ...o.terrace, o.exit, ...(o.park?.spots ?? []), ...(o.cozy?.coffeeSpots ?? []), ...(o.nooks ?? [])];
}

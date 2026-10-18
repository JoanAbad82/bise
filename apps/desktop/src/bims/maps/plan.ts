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
}


/** The non-main live agents' names, in start order: one desk each. Pure. */
export const deskNames = (agents: readonly Agent[]): string[] => agents.filter((a) => !a.main && !a.archived).map((a) => a.name);

/** A box of w by d centred on (x, z); `of`: the place that sits in it (a bed, a deck chair). Pure. */
export function boxAt(x: number, z: number, w: number, d: number, of?: Pt): Box {
  return { x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, ...(of ? { of } : {}) };
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
  return [...o.desks.values(), o.mainDesk, ...o.islandSpots, ...o.lounge, ...o.boardSpots, ...o.queue, o.door, ...o.terrace, o.exit, ...(o.park?.spots ?? []), ...(o.cozy?.coffeeSpots ?? [])];
}

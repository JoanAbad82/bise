// The town's night lamp pools (bims-town-light, bims m_34661): each office's own (render/world.ts
// poolsOf: main's desk, the island, the lounge, one desk), placed in the town's frame, capped by the
// budget (POOLS_MAX lights for the whole town: every light costs each lit pixel, and a count that
// changes compiles every material again). The offices nearest where he looks get theirs first, one
// pool per office per round (each office's main desk before any office's second pool). Pure. Owner: maps-e.

/** the town's lamp pools at most, lit or not (a fixed count: the materials compile once) */
export const POOLS_MAX = 8;

export interface Pool {
  readonly x: number;
  readonly z: number;
  /** its intensity when the lamps are fully on */
  readonly i: number;
}

/** an office's pools in its own units, and where the town put it */
export interface OfficePools {
  readonly x: number;
  readonly z: number;
  readonly pools: readonly Pool[];
}

/** the pools drawn, town units: the offices nearest `at` first, round by round, `max` at most */
export function townPools(offices: readonly OfficePools[], at: { readonly x: number; readonly z: number }, max = POOLS_MAX): Pool[] {
  const near = [...offices].sort((a, b) => Math.hypot(a.x - at.x, a.z - at.z) - Math.hypot(b.x - at.x, b.z - at.z) || a.x - b.x || a.z - b.z);
  const out: Pool[] = [];
  const rounds = Math.max(0, ...near.map((o) => o.pools.length));
  for (let r = 0; r < rounds; r++) {
    for (const o of near) {
      if (out.length >= max) return out;
      const p = o.pools[r];
      if (p) out.push({ x: o.x + p.x, z: o.z + p.z, i: p.i });
    }
  }
  return out;
}

// The cozy curve and its places, pure (cozy.ts; page bims-cozy v2): what each stage adds, the beds'
// curve, the coffee corner's goal, the same places for the same office. The 13 maps x 15 stages
// law on the built worlds: render/cozy.test.ts.
import { describe, expect, it } from 'vitest';
import { crowd } from './fixtures';
import { BASE_BEDS, LAST_STAGE, bedStage, bedsAt } from './growth';
import { COZY_AT, coffeeAtCorner, cozyAt, placeCozy } from './cozy';
import { PLANS, layoutOf } from './maps';
import { placesOf } from './maps/plan';
import { roomKeepOut, withRoom } from './maps/room';
import type { Office } from './model';
import { network } from './paths';
import { withSeats } from './sit';

describe('the cozy curve', () => {
  it('beds: 2 from day one, then 3, 4, 5, 6 and 8 (page bims-cozy v2)', () => {
    expect(Array.from({ length: LAST_STAGE + 1 }, (_, s) => bedsAt(s))).toEqual([2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 8]);
    expect(bedsAt(40)).toBe(8);
    expect(BASE_BEDS).toBe(bedsAt(0));
    // bed i comes with the first stage that counts it
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(bedStage)).toEqual([0, 0, 3, 7, 10, 13, 14, 14]);
    for (let i = 0; i < 8; i++) expect(bedsAt(bedStage(i))).toBeGreaterThan(i);
  });

  it('adds one thing at each stage and never takes one away', () => {
    const at = Array.from({ length: LAST_STAGE + 1 }, (_, s) => cozyAt(s));
    expect(at[0]).toMatchObject({ floorPlants: 2, hanging: false, coffeeOnIsland: false, deskObjects: 1, framed: false, shelfRows: 1, floorLamps: 1, trophy: 'none' });
    expect(at[1]?.floorPlants).toBe(3);
    expect(at[2]?.coffeeOnIsland).toBe(true);
    expect(at[3]?.cushions).toBe(true);
    expect(at[4]?.deskObjects).toBe(2);
    expect(at[5]).toMatchObject({ floorPlants: 4, hanging: true });
    expect(at[6]?.framed).toBe(true);
    expect(at[7]?.throwOn).toBe(true);
    expect(at[8]?.shelfRows).toBe(2);
    expect(at[9]?.deskLamps).toBe(true);
    expect(at[10]?.floorLamps).toBe(2);
    expect(at[11]?.bigPlants).toBe(true);
    expect(at[12]?.trophy).toBe('plain');
    expect(at[14]?.trophy).toBe('golden');
    // never less from one stage to the next
    const n = (c: ReturnType<typeof cozyAt>): number[] => [c.floorPlants, +c.hanging, +c.cushions, c.deskObjects, +c.framed, +c.throwOn, c.shelfRows, +c.deskLamps, c.floorLamps, +c.bigPlants, ['none', 'plain', 'golden'].indexOf(c.trophy)];
    for (let s = 1; s <= LAST_STAGE; s++) n(cozyAt(s)).forEach((v, i) => { expect(v, `stage ${String(s)}, ${String(i)}`).toBeGreaterThanOrEqual(n(cozyAt(s - 1))[i] ?? 0); });
    expect(Object.values(COZY_AT).every((s) => s >= 1 && s <= LAST_STAGE)).toBe(true);
  });
});

describe('the cozy places', () => {
  it('the same office gives the same places; a new agent count may move them, a stage never does', () => {
    const o = layoutOf(crowd(5).agents, 'riad');
    // layoutOf places them on the office with its room for objects (maps/room.ts) and its chairs' ways in (sit.ts withSeats)
    const room = PLANS.riad.room ?? { left: 0, right: 0 };
    const hints = PLANS.riad.cozy ?? {};
    const keepOut = (x: Office) => [...(hints.keepOut?.(x) ?? []), ...roomKeepOut(x, room)];
    expect(placeCozy(withSeats(withRoom(PLANS.riad.layout(crowd(5).agents), room)), { ...hints, keepOut })).toEqual(o.cozy);
    expect(JSON.stringify(layoutOf(crowd(5).agents, 'riad').cozy)).toBe(JSON.stringify(o.cozy));
  });

  it("puts the coffee corner's spot on the walk graph, a place like the others", () => {
    for (const map of ['loft', 'sahel', 'kyoto'] as const) {
      const o = layoutOf(crowd(9).agents, map);
      const s = o.cozy?.coffeeSpots[0];
      expect(s, map).toBeDefined();
      if (!s) continue;
      expect(placesOf(o)).toContain(s);
      expect(network(o).some(([a, b]) => (Math.hypot(a.x - s.x, a.z - s.z) < 1e-6 || Math.hypot(b.x - s.x, b.z - s.z) < 1e-6))).toBe(true);
    }
  });

  it('sends a coffee to the corner at stages 0-1, to the island from 2 where it has a top', () => {
    const o = layoutOf(crowd(3).agents, 'loft');
    expect(o.cozy?.islandTop).toBeDefined();
    expect(coffeeAtCorner(o, 0, true)).toBe(true);
    expect(coffeeAtCorner(o, 1, true)).toBe(true);
    expect(coffeeAtCorner(o, 2, true)).toBe(false);
    expect(coffeeAtCorner(o, 0, false)).toBe(false);
    // no stage known (a test's timeline): the island, as before
    expect(coffeeAtCorner(o, undefined, true)).toBe(false);
    // a map whose eating place has no top (a fountain, a tree): the corner at every stage
    if (o.cozy) expect(coffeeAtCorner({ ...o, cozy: { ...o.cozy, islandTop: undefined } }, 9, true)).toBe(true);
  });
});

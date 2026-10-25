// The objects' pills (objpills.ts): only the '?' and '✗' ones, over each object's top, none off view.
import { describe, expect, it } from 'vitest';
import { layoutOf } from './maps';
import { objectSpots } from './corners';
import { crewOf, objsOf } from './corners.test';
import { PILL_LIFT, objPillsOf } from './objpills';

describe("the objects' pills", () => {
  const o = layoutOf(crewOf(5), 'loft');
  const objs = objsOf(10).map((p, i) => ({ ...p, pill: i === 0 ? ('✗' as const) : i === 1 ? ('?' as const) : null }));
  const { placed } = objectSpots(o, objs);

  it("shows a pill over each object that has one, at its top, and no other", () => {
    const asked: { x: number; y: number; z: number }[] = [];
    const pills = objPillsOf(placed, (x, y, z) => {
      asked.push({ x, y, z });
      return { x: x * 10, y: z * 10 };
    });
    const want = placed.filter((p) => p.pill !== null);
    expect(want.length).toBeGreaterThan(0);
    expect(pills.map((p) => [p.key, p.pill])).toEqual(want.map((p) => [p.key, p.pill]));
    expect(asked).toEqual(want.map((p) => ({ x: p.x, y: p.foot.h + PILL_LIFT, z: p.z })));
  });

  it('drops the pill of an object off view', () => {
    expect(objPillsOf(placed, () => null)).toEqual([]);
  });
});

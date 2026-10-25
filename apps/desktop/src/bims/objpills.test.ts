// The objects' pills (objpills.ts): only the '?' and '✗' ones, on each object's drawn top, none off view.
import { describe, expect, it } from 'vitest';
import { layoutOf } from './maps';
import { objectSpots } from './corners';
import { crewOf, objsOf } from './corners.test';
import { objPillsOf } from './objpills';

describe("the objects' pills", () => {
  const o = layoutOf(crewOf(5), 'loft');
  const objs = objsOf(10).map((p, i) => ({ ...p, pill: i === 0 ? ('✗' as const) : i === 1 ? ('?' as const) : null }));
  const { placed } = objectSpots(o, objs);

  it('shows a pill on the top of each object that has one, and no other', () => {
    const asked: string[] = [];
    const pills = objPillsOf(placed, (key) => {
      asked.push(key);
      return { x: key.length * 10.4, y: 7.6 };
    });
    const want = placed.filter((p) => p.pill !== null);
    expect(want.length).toBeGreaterThan(0);
    expect(pills).toEqual(want.map((p) => ({ key: p.key, pill: p.pill, x: Math.round(p.key.length * 10.4), y: 8 })));
    expect(asked).toEqual(want.map((p) => p.key));
  });

  it("an object's pill for a plugin not drawn is that plugin's: its key opens it, the object's own places it", () => {
    const p = placed[0];
    if (p === undefined) throw new Error('no object placed');
    const asked: string[] = [];
    const pills = objPillsOf([{ ...p, pill: '✗', pillOf: 'slides' }], (key) => {
      asked.push(key);
      return { x: 1, y: 2 };
    });
    expect(pills).toEqual([{ key: 'slides', pill: '✗', x: 1, y: 2 }]);
    expect(asked).toEqual([p.key]);
  });

  it('drops the pill of an object off view or not drawn', () => {
    expect(objPillsOf(placed, () => null)).toEqual([]);
  });
});

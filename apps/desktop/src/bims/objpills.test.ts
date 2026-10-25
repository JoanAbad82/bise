// The objects' pills (objpills.ts): only the '?' and '✗' ones, on each object's drawn top, none off view.
import { describe, expect, it } from 'vitest';
import { layoutOf } from './maps';
import { objectSpots } from './corners';
import { crewOf, objsOf } from './corners.test';
import { settings } from '@/proto/words.gen';
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
    expect(pills).toEqual(want.map((p) => ({ key: p.key, pill: p.pill, tip: p.pill === '✗' ? settings.plugins_waits_error({ name: p.key }) : settings.plugins_waits_login({ name: p.key }), x: Math.round(p.key.length * 10.4), y: 8 })));
    expect(asked).toEqual(want.map((p) => p.key));
  });

  it("an object's pill for a plugin not drawn is that plugin's: its key opens it, the object's own places it", () => {
    const p = placed[0];
    if (p === undefined) throw new Error('no object placed');
    const asked: string[] = [];
    const pills = objPillsOf([{ ...p, pill: '✗', pillOf: 'slides', pillName: 'Slides' }], (key) => {
      asked.push(key);
      return { x: 1, y: 2 };
    });
    // its tip names that plugin and its state (designer m_43241)
    expect(pills).toEqual([{ key: 'slides', pill: '✗', tip: 'Slides failed to start', x: 1, y: 2 }]);
    expect(objPillsOf([{ ...p, pill: '?', pillName: 'Gmail' }], () => ({ x: 0, y: 0 }))[0]?.tip).toBe('Gmail needs a login');
    expect(asked).toEqual([p.key]);
  });

  it('drops the pill of an object off view or not drawn', () => {
    expect(objPillsOf(placed, () => null)).toEqual([]);
  });
});

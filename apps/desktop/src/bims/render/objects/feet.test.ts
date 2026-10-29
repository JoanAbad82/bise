// The three-free feet (feet.ts) are the makers' own: the office's placement (corners.ts) reads
// them without the renderer, so a maker whose foot changes fails here until the table follows.
import { describe, expect, it } from 'vitest';
import { FEET } from './feet';
import { makeObject, OBJ_IDS } from './index';

describe('feet: the placement reads the makers own foot', () => {
  it.each(OBJ_IDS)('%s', (id) => {
    const m = makeObject(id);
    const f = FEET[id];
    expect(f.w).toBeCloseTo(m.foot.w, 2);
    expect(f.d).toBeCloseTo(m.foot.d, 2);
    expect(f.h).toBeCloseTo(m.foot.h, 2);
    expect(f.wall === true).toBe(m.wall === true);
  });
});

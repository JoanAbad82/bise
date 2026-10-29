import { describe, expect, it } from 'vitest';
import { labelFits } from './headroom';

// the 320 bar's head, measured off screen (bims-toggle): 303 px; 'AGENTS · 15' with its ▾ slot 95.3,
// '320 · wide' 68.4 + 12, 'all ›' 25.4 + 8, the cube 24 + 16, 'the bims' 49.8 + 4
const at320 = { head: 303, title: 95.3, others: [80.4, 33.4], cube: 40, label: 53.8 };

describe('labelFits', () => {
  it('fits when every part is whole, to the half px', () => {
    expect(labelFits(at320)).toBe(true);
    expect(labelFits({ ...at320, head: 302.5 })).toBe(true);
  });
  it('goes as soon as a part would have to shrink: a longer count, a narrower head', () => {
    expect(labelFits({ ...at320, title: 102.3 })).toBe(false);
    expect(labelFits({ ...at320, head: 302 })).toBe(false);
  });
  it('comes back with the room: the office closed (no switch), a wider bar', () => {
    expect(labelFits({ ...at320, title: 102.3, others: [33.4] })).toBe(true);
    expect(labelFits({ ...at320, title: 102.3, head: 359 })).toBe(true);
  });
  it('a head too small for even the cube still says no (the cube alone, the title cut)', () => {
    expect(labelFits({ ...at320, head: 100 })).toBe(false);
  });
});

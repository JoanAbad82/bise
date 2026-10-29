import { describe, expect, it } from 'vitest';
import { reachedZero } from './Zero';

describe('reachedZero (desktop-delight TOUCH 3)', () => {
  it('is his answer to the last item, never a list that empties without him', () => {
    expect(reachedZero({ count: 1, acted: 0 }, { count: 0, acted: 1 })).toBe(true);
    // the hub withdrew it, or another window answered: no acted entry here
    expect(reachedZero({ count: 1, acted: 0 }, { count: 0, acted: 0 })).toBe(false);
    // mounted on an empty list
    expect(reachedZero({ count: 0, acted: 0 }, { count: 0, acted: 1 })).toBe(false);
    // one left
    expect(reachedZero({ count: 2, acted: 0 }, { count: 1, acted: 1 })).toBe(false);
  });
});

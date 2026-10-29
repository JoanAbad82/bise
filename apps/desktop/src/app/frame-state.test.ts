// The room the left takes (the right side's layout reads it): the rail always, the sidebar only
// docked (shown, from 1000 px).
import { describe, expect, it } from 'vitest';
import { leftWidthOf, RAIL_W } from './frame-state';

describe('leftWidthOf', () => {
  it('is the rail plus the shown sidebar', () => {
    expect(leftWidthOf(1440, { hidden: false, width: 240 })).toBe(RAIL_W + 240);
  });

  it('is the rail alone with the sidebar hidden', () => {
    expect(leftWidthOf(1440, { hidden: true, width: 240 })).toBe(RAIL_W);
  });

  it('is the rail alone under 1000 px (the sidebar slides over)', () => {
    expect(leftWidthOf(999, { hidden: false, width: 240 })).toBe(RAIL_W);
    expect(leftWidthOf(1000, { hidden: false, width: 240 })).toBe(RAIL_W + 240);
  });
});

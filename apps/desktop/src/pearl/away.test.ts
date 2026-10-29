// When the pearl has no loop (away.ts): the window hidden, or not in front outside the capsule.
import { describe, expect, it } from 'vitest';
import { awayOf } from './away';

describe('away', () => {
  it('is away hidden, in any window', () => {
    expect(awayOf({ hidden: true, focused: true, capsule: false })).toBe(true);
    expect(awayOf({ hidden: true, focused: false, capsule: true })).toBe(true);
  });
  it('is away when the main window is not in front', () => {
    expect(awayOf({ hidden: false, focused: false, capsule: false })).toBe(true);
    expect(awayOf({ hidden: false, focused: true, capsule: false })).toBe(false);
  });
  it('never for focus in the capsule: shown inactive while he talks from another app', () => {
    expect(awayOf({ hidden: false, focused: false, capsule: true })).toBe(false);
  });
});

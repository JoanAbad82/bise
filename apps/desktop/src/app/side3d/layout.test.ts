// sideLayout at the widths of plan §2 (1000, 1100, 1280, 1440, 1728, 1920), the panel open and closed.
import { describe, expect, it } from 'vitest';
import { BUBBLE_BAND, COL_W, MIN_LEFT, sideLayout, WORLD_BAND } from './layout';

/** rail 56 + sidebar 240 */
const SIDE = 296;

/** what the right side leaves between the column and the window's edge */
const right = (winW: number, l: { colLeft: number; colW: number }) => winW - l.colLeft - l.colW;

describe('sideLayout, the panel folded', () => {
  it('1920 and 1728: the column centred in what the sidebar leaves, the world small', () => {
    for (const w of [1920, 1728]) {
      const l = sideLayout(w, SIDE, false);
      expect(l).toMatchObject({ colW: COL_W, world: 'small', gutter: WORLD_BAND, side: true });
      expect(l.colLeft - SIDE).toBe(right(w, l));
    }
  });
  it('1440: still centred (212 each side, more than the world band)', () => {
    const l = sideLayout(1440, SIDE, false);
    expect(l).toMatchObject({ colLeft: SIDE + 212, colW: COL_W, world: 'small' });
    expect(right(1440, l)).toBe(212);
  });
  it('1280: centring would leave 132 on the right, so the column slides left and keeps the band', () => {
    const l = sideLayout(1280, SIDE, false);
    expect(l).toMatchObject({ colW: COL_W, world: 'small', gutter: WORLD_BAND });
    expect(right(1280, l)).toBe(WORLD_BAND);
    expect(l.colLeft - SIDE).toBe(92);
  });
  it('1100: the world folds into a 5th bubble, then the column narrows, 24 from the sidebar', () => {
    const l = sideLayout(1100, SIDE, false);
    expect(l).toMatchObject({ colLeft: SIDE + MIN_LEFT, world: 'bubble', gutter: BUBBLE_BAND, side: true });
    expect(l.colW).toBe(1100 - SIDE - MIN_LEFT - BUBBLE_BAND);
    expect(right(1100, l)).toBe(BUBBLE_BAND);
  });
  it('1100 with the sidebar hidden (the rail alone): the world fits again', () => {
    const l = sideLayout(1100, 56, false);
    expect(l).toMatchObject({ colW: COL_W, world: 'small' });
    expect(right(1100, l)).toBeGreaterThanOrEqual(WORLD_BAND);
  });
  it('1000: the column narrows, never under the bubbles', () => {
    const l = sideLayout(1000, SIDE, false);
    expect(l.world).toBe('bubble');
    expect(right(1000, l)).toBe(BUBBLE_BAND);
    expect(l.colLeft).toBe(SIDE + MIN_LEFT);
  });
  it('the world as a bubble while the column still fits whole: slid left by the small band', () => {
    // room 900: 720 + 172 + 24 = 916 does not fit, 720 + 92 + 24 = 836 does
    const l = sideLayout(900 + SIDE, SIDE, false);
    expect(l).toMatchObject({ colW: COL_W, world: 'bubble' });
    expect(right(900 + SIDE, l)).toBe(BUBBLE_BAND);
  });
  it('never a negative width', () => {
    expect(sideLayout(200, SIDE, false).colW).toBe(0);
  });
});

describe('sideLayout, the panel open', () => {
  it('the right side hides, the column centred between the sidebar and the panel', () => {
    for (const w of [1000, 1100, 1280, 1440, 1728, 1920]) {
      const l = sideLayout(w, SIDE, true, 384);
      expect(l).toMatchObject({ side: false, gutter: 0 });
      expect(l.colW).toBeLessThanOrEqual(COL_W);
      expect(l.colLeft - SIDE).toBeCloseTo(w - 384 - l.colLeft - l.colW);
    }
  });
  it('1440 with a 384 panel: 760 of room, the column 712 with 24 each side', () => {
    expect(sideLayout(1440, SIDE, true, 384)).toMatchObject({ colLeft: SIDE + MIN_LEFT, colW: 712 });
  });
  it('1920 with a 640 panel: 720, centred', () => {
    expect(sideLayout(1920, SIDE, true, 640)).toMatchObject({ colW: COL_W, colLeft: SIDE + (1920 - SIDE - 640 - COL_W) / 2 });
  });
});

import { describe, expect, it } from 'vitest';
import { isOffscreen, offscreenPlace, OFFSCREEN_ENV } from './offscreen';
import { OFF, OFF_DISPLAY } from './place';

// BISE_DESKTOP_OFFSCREEN (ambient-lead m_18341): unset = today's behaviour,
// set = every window placed off every display and never ordered in.
describe('the off-screen knob', () => {
  it("unset, empty or anything but '1': off (today's behaviour, windows placed as before)", () => {
    for (const v of [undefined, '', '0', 'true', 'yes']) {
      expect(isOffscreen({ [OFFSCREEN_ENV]: v }, false)).toBe(false);
    }
    expect(offscreenPlace(false)).toEqual({});
  });
  it("'1': on, every window created at -30000, -30000", () => {
    expect(isOffscreen({ [OFFSCREEN_ENV]: '1' }, false)).toBe(true);
    expect(offscreenPlace(true)).toEqual({ x: OFF, y: OFF });
    expect(OFF).toBe(-30000);
  });
  it('test mode has its own fence (guard.ts): the knob never turns on there', () => {
    expect(isOffscreen({ [OFFSCREEN_ENV]: '1' }, true)).toBe(false);
  });
  it('the display the capsule places on with the knob covers no NSScreen (any real display is near 0,0)', () => {
    const b = OFF_DISPLAY.bounds;
    expect(b.x + b.width).toBeLessThan(-10_000);
    expect(b.y + b.height).toBeLessThan(-10_000);
  });
});

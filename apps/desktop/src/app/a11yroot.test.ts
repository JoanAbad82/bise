// macOS's settings as <html>'s flags (ds/tokens.css's fallbacks read them).
import { describe, expect, it } from 'vitest';
import { a11yAttrs, noVibrancy } from './a11yroot';

describe('a11yAttrs', () => {
  it('sets each flag that is on and removes the others', () => {
    expect(a11yAttrs({ reduceTransparency: true, reduceMotion: false, increaseContrast: true })).toEqual({
      'data-reduce-transparency': '',
      'data-reduce-motion': null,
      'data-increase-contrast': '',
    });
  });
});

describe('noVibrancy', () => {
  it("the harness's offscreen window and a non-Mac have nothing native under the frame; his Mac has", () => {
    expect(noVibrancy(true, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe(true);
    expect(noVibrancy(false, 'Mozilla/5.0 (X11; Linux x86_64)')).toBe(true);
    expect(noVibrancy(false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe(false);
  });
});

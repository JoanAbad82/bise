import { describe, expect, it } from 'vitest';
import { claimZoomKeys, takeZoomKey } from './zoomKeys';

const key = (over: Partial<KeyboardEvent>) => ({ key: '', code: '', metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...over });

describe("the window's esc and ⌘0 while an image artifact is zoomed (his m_22822; image-pinch)", () => {
  it('go back to fit only while an image is zoomed', () => {
    let back = 0;
    expect(takeZoomKey(key({ key: 'Escape' }))).toBe(false);
    const free = claimZoomKeys(() => (back += 1));
    expect(takeZoomKey(key({ key: 'Escape' }))).toBe(true);
    expect(takeZoomKey(key({ code: 'Digit0', metaKey: true }))).toBe(true);
    expect(takeZoomKey(key({ code: 'Digit0', metaKey: true, altKey: true })), '⌥⌘0 stays the panel').toBe(false);
    expect(back).toBe(2);
    free();
    expect(takeZoomKey(key({ key: 'Escape' }))).toBe(false);
  });
});

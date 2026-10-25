import { describe, expect, it } from 'vitest';
import { centred, doubleClickOf, framesText, keepFrame, MAIN_SIZE, MARGIN, NO_FRAMES, openFrame, parseFrames, screenOf, type Screen } from './mainsize';

// two displays side by side: a laptop (menu bar 25, Dock 70) and an external one to its right
const LAPTOP: Screen = { id: '1', bounds: { x: 0, y: 0, width: 1512, height: 982 }, workArea: { x: 0, y: 25, width: 1512, height: 887 } };
const EXT: Screen = { id: '2', bounds: { x: 1512, y: -200, width: 2560, height: 1440 }, workArea: { x: 1512, y: -175, width: 2560, height: 1415 } };
const SMALL: Screen = { id: '3', bounds: { x: 0, y: 0, width: 1024, height: 640 }, workArea: { x: 0, y: 25, width: 1024, height: 615 } };
const BOTH = [LAPTOP, EXT];

describe('MAIN_SIZE (the main window)', () => {
  it('its narrowest fits the sidebar, one 380 px column and margins; it opens at 1280 x 720 (designer m_21506)', () => {
    expect(MAIN_SIZE.minWidth).toBe(680);
    expect(MAIN_SIZE.minWidth).toBeGreaterThanOrEqual(264 + 380);
    expect(MAIN_SIZE).toMatchObject({ width: 1280, height: 720 });
    expect(MARGIN).toBe(24);
  });
});

describe('openFrame: where the main window opens', () => {
  it('first open: 1280 x 720 centred in the work area of the pointer screen', () => {
    expect(openFrame(NO_FRAMES, BOTH, LAPTOP)).toEqual({ x: 116, y: 109, width: 1280, height: 720 });
    expect(openFrame(NO_FRAMES, BOTH, EXT)).toEqual({ x: 1512 + 640, y: -175 + 348, width: 1280, height: 720 });
  });

  it('first open on a small screen: clamped to its work area minus 24 px each side, centred', () => {
    expect(openFrame(NO_FRAMES, [SMALL], SMALL)).toEqual({ x: 24, y: 49, width: 976, height: 567 });
  });

  it('a kept frame opens where he left it, per display: the pointer screen first, else his last', () => {
    const onLaptop = { x: 40, y: 60, width: 1400, height: 800 };
    const onExt = { x: 2000, y: 0, width: 1800, height: 1100 };
    const kept = keepFrame(keepFrame(NO_FRAMES, '1', onLaptop), '2', onExt);
    expect(kept.last).toBe('2');
    expect(openFrame(kept, BOTH, LAPTOP)).toEqual(onLaptop);
    expect(openFrame(kept, BOTH, EXT)).toEqual(onExt);
    // a third screen under the pointer with no frame of its own: his last one, where it was
    expect(openFrame(kept, [...BOTH, { ...SMALL, id: '9', bounds: { ...SMALL.bounds, y: 2000 }, workArea: { ...SMALL.workArea, y: 2025 } }], { ...SMALL, id: '9' })).toEqual(onExt);
  });

  it('a kept frame off every screen (its display gone) is centred again at its size, clamped; never off-screen', () => {
    const kept = keepFrame(NO_FRAMES, '2', { x: 2000, y: 0, width: 1800, height: 1100 });
    // the external display unplugged: only the laptop is left
    const f = openFrame(kept, [LAPTOP], LAPTOP);
    expect(f).toEqual({ x: 24, y: 49, width: 1464, height: 839 });
    expect(screenOf(f, [LAPTOP])).toBe(LAPTOP);
    // a frame of the right size, saved at a place no screen covers now
    const away = keepFrame(NO_FRAMES, '1', { x: -5000, y: 3000, width: 1000, height: 700 });
    expect(openFrame(away, [LAPTOP], LAPTOP)).toEqual({ x: 256, y: 119, width: 1000, height: 700 });
  });

  it('a kept frame needs a grip of its top on a work area; under the menu bar or past an edge it is centred again', () => {
    const under = keepFrame(NO_FRAMES, '1', { x: 100, y: 0, width: 1000, height: 600 });
    expect(openFrame(under, [LAPTOP], LAPTOP)).toEqual(centred({ width: 1000, height: 600 }, LAPTOP));
    const edge = keepFrame(NO_FRAMES, '1', { x: 1450, y: 100, width: 1000, height: 600 });
    expect(openFrame(edge, [LAPTOP], LAPTOP)).toEqual(centred({ width: 1000, height: 600 }, LAPTOP));
    const grip = keepFrame(NO_FRAMES, '1', { x: 1300, y: 100, width: 1000, height: 600 });
    expect(openFrame(grip, [LAPTOP], LAPTOP)).toEqual({ x: 1300, y: 100, width: 1000, height: 600 });
  });

  it('a kept frame larger than its screen now (a lower resolution) is never larger than its work area', () => {
    const kept = keepFrame(NO_FRAMES, '1', { x: 0, y: 25, width: 2400, height: 1400 });
    expect(openFrame(kept, [LAPTOP], LAPTOP)).toEqual({ x: 0, y: 25, width: 1512, height: 887 });
  });
});

describe('the frames file', () => {
  it('round-trips, and keeps at most 16 displays', () => {
    let kept = NO_FRAMES;
    for (let i = 0; i < 20; i++) kept = keepFrame(kept, String(i), { x: i, y: i, width: 900.4, height: 700 });
    expect(Object.keys(kept.frames)).toHaveLength(16);
    expect(kept.frames['19']).toEqual({ x: 19, y: 19, width: 900, height: 700 });
    expect(kept.frames['0']).toBeUndefined();
    expect(parseFrames(framesText(kept))).toEqual(kept);
  });

  it('anything unreadable or malformed is no frame: the first-open size', () => {
    for (const t of [null, '', 'nope', '[]', '42', '{"frames":{"1":{"x":"a","y":0,"width":1,"height":1}}}', '{"frames":{"1":{"x":0,"y":0,"width":0,"height":5}}}']) {
      expect(openFrame(parseFrames(t), [LAPTOP], LAPTOP), String(t)).toEqual(openFrame(NO_FRAMES, [LAPTOP], LAPTOP));
    }
    expect(parseFrames('{"last":"7","frames":{}}').last).toBeNull();
  });
});

describe('doubleClickOf', () => {
  it("follows macOS's AppleActionOnDoubleClick: zoom when unset or Maximize, else minimise or nothing", () => {
    expect(doubleClickOf('')).toBe('zoom');
    expect(doubleClickOf('Maximize')).toBe('zoom');
    expect(doubleClickOf('Minimize')).toBe('minimize');
    expect(doubleClickOf('None')).toBe('none');
  });
});

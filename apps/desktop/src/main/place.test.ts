import { describe, expect, it } from 'vitest';
import { BOTTOM, capsuleBounds, MENU_GAP, OFF_DISPLAY, TOP, type DisplayBox } from './place';

// a 1512x982 MacBook display: the menu bar 33 px, the Dock 70 px
const mac: DisplayBox = {
  bounds: { x: 0, y: 0, width: 1512, height: 982 },
  workArea: { x: 0, y: 33, width: 1512, height: 879 },
};
const size = { width: 640, height: 120 };

describe('capsuleBounds', () => {
  it('top: centred, its top 170 px under the display top', () => {
    expect(capsuleBounds(size, mac, { at: 'top' })).toEqual({ x: 436, y: TOP, width: 640, height: 120 });
  });

  it('top: grows downward, the top never moves', () => {
    expect(capsuleBounds({ width: 640, height: 400 }, mac, { at: 'top' }).y).toBe(TOP);
  });

  it('bottom: its bottom 96 px above the Dock, grows upward', () => {
    const b = capsuleBounds(size, mac, { at: 'bottom' });
    expect(b.y + b.height).toBe(33 + 879 - BOTTOM);
    const tall = capsuleBounds({ width: 640, height: 300 }, mac, { at: 'bottom' });
    expect(tall.y + tall.height).toBe(33 + 879 - BOTTOM);
  });

  it('menu: the glass 6 px under the tray icon, centred on it', () => {
    const icon = { x: 1200, y: 4, width: 30, height: 24 };
    const b = capsuleBounds({ width: 360, height: 300 }, mac, { at: 'menu', icon });
    expect(b.y).toBe(33 + MENU_GAP);
    expect(b.x + 180).toBe(1215);
  });

  it('menu: an icon near the right edge keeps the box on the display', () => {
    const b = capsuleBounds({ width: 360, height: 300 }, mac, { at: 'menu', icon: { x: 1490, y: 4, width: 20, height: 24 } });
    expect(b.x + b.width).toBe(1512);
  });

  it('a glass inside a transparent margin is what gets placed', () => {
    const glass = { x: 20, y: 16, width: 600, height: 88 };
    const b = capsuleBounds({ width: 640, height: 120 }, mac, { at: 'top' }, glass);
    expect(b.y + glass.y).toBe(TOP);
    expect(b.x + glass.x + glass.width / 2).toBe(756);
  });

  it('never outside the work area, even bigger than it', () => {
    const b = capsuleBounds({ width: 3000, height: 3000 }, mac, { at: 'bottom' });
    expect(b).toEqual({ x: 0, y: 33, width: 1512, height: 879 });
  });

  it("a test run's display is far from every real one", () => {
    const b = capsuleBounds(size, OFF_DISPLAY, { at: 'top' });
    expect(b.x).toBeLessThan(-20000);
    expect(b.y).toBeLessThan(-20000);
  });
});

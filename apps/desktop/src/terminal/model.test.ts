import { afterEach, describe, expect, it } from 'vitest';
import { clampHeight, DEFAULT_H, dragHeight, isToggleKey, KEEP_ABOVE, MIN_H, shellProject, shellTakes, shortPath, writesOf } from './model';
import { panel } from './panel';

const key = (code: string, mods: Partial<{ metaKey: boolean; altKey: boolean; ctrlKey: boolean; shiftKey: boolean }> = {}, k = '') => ({
  code,
  key: k,
  metaKey: false,
  altKey: false,
  ctrlKey: false,
  shiftKey: false,
  ...mods,
});

describe('terminal panel height (M16)', () => {
  it('drags up taller, down shorter, inside its bounds', () => {
    expect(dragHeight(240, 500, 400, 720)).toBe(340);
    expect(dragHeight(240, 500, 560, 720)).toBe(180);
    expect(dragHeight(240, 500, 900, 720)).toBe(MIN_H);
    expect(dragHeight(240, 500, -400, 720)).toBe(720 - KEEP_ABOVE);
  });
  it('a tiny window still gives it its smallest height', () => {
    expect(clampHeight(300, 150)).toBe(MIN_H);
    expect(clampHeight(Number.NaN, 720)).toBe(DEFAULT_H);
  });
});

describe('terminal keys', () => {
  it('ctrl+` toggles the panel, nothing else does', () => {
    expect(isToggleKey(key('Backquote', { ctrlKey: true }))).toBe(true);
    expect(isToggleKey(key('Backquote'))).toBe(false);
    expect(isToggleKey(key('Backquote', { ctrlKey: true, shiftKey: true }))).toBe(false);
    expect(isToggleKey(key('Backquote', { metaKey: true }))).toBe(false);
  });
  it('the shell takes every key but ⌘ ones and ctrl+`', () => {
    expect(shellTakes(key('Digit1', { altKey: true }))).toBe(true);
    expect(shellTakes(key('KeyY', { ctrlKey: true }))).toBe(true);
    expect(shellTakes(key('Escape', {}, 'Escape'))).toBe(true);
    expect(shellTakes(key('KeyC', { ctrlKey: true }))).toBe(true);
    expect(shellTakes(key('KeyC', { metaKey: true }))).toBe(false);
    expect(shellTakes(key('KeyV', { metaKey: true }))).toBe(false);
    expect(shellTakes(key('KeyK', { metaKey: true }))).toBe(false);
    expect(shellTakes(key('Backquote', { ctrlKey: true }))).toBe(false);
  });
});

describe('writes', () => {
  it('cuts a long paste in parts main takes, the same text joined', () => {
    const s = 'é'.repeat(40_000);
    const parts = writesOf(s);
    expect(parts.length).toBe(3);
    expect(parts.join('')).toBe(s);
    for (const p of parts) expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(64 * 1024);
  });
  it('never splits an emoji', () => {
    const parts = writesOf('ab😀cd', 3);
    expect(parts).toEqual(['ab', '😀c', 'd']);
  });
  it('a key is one write', () => {
    expect(writesOf('x')).toEqual(['x']);
    expect(writesOf('')).toEqual([]);
  });
});

describe('shell project', () => {
  it("the route's project, else bise's own", () => {
    expect(shellProject('shop', 'home')).toBe('shop');
    expect(shellProject(undefined, 'home')).toBe('home');
    expect(shellProject(undefined, undefined)).toBeUndefined();
  });
});

describe('panel state', () => {
  afterEach(() => {
    panel.reset();
  });
  it('ctrl+` shows then hides it; once shown it stays opened (the same shell)', () => {
    panel.toggleByKey(1000);
    expect(panel.get()).toMatchObject({ shown: true, opened: true });
    panel.toggleByKey(2000);
    expect(panel.get()).toMatchObject({ shown: false, opened: true });
  });
  it("the menu's echo of the same key is dropped, a menu click later toggles", () => {
    panel.toggleByKey(1000);
    panel.toggleByMenu(1100);
    expect(panel.get().shown).toBe(true);
    panel.toggleByMenu(2000);
    expect(panel.get().shown).toBe(false);
  });
  it('keeps the dragged height', () => {
    panel.setHeight(333);
    expect(panel.get().height).toBe(333);
  });
});

describe('the panel head folder', () => {
  it('home as ~, the middle cut, the last folder kept', () => {
    expect(shortPath('/Users/g/code/shop')).toBe('~/…/shop');
    expect(shortPath('/Users/g/shop')).toBe('~/shop');
    expect(shortPath('/Users/g')).toBe('~');
    expect(shortPath('/tmp/bh-1/home/term-panel-x', '/tmp/bh-1/home')).toBe('~/term-panel-x');
    expect(shortPath('/srv/repos/acme/web')).toBe('/…/web');
    expect(shortPath('')).toBe('');
  });
});

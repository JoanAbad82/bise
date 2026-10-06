import type { MenuItemConstructorOptions } from 'electron';
import { describe, expect, it } from 'vitest';
import type { MenuAction } from '../shared/api';
import { externalUrl } from './external';
import { menuTemplate } from './menu';

function flat(items: readonly MenuItemConstructorOptions[]): MenuItemConstructorOptions[] {
  return items.flatMap((i) => [i, ...(Array.isArray(i.submenu) ? flat(i.submenu) : [])]);
}

function build(platform: NodeJS.Platform, dev = false): { items: MenuItemConstructorOptions[]; sent: MenuAction[] } {
  const sent: MenuAction[] = [];
  const t = menuTemplate({ platform, appName: 'bise', dev, send: (a) => sent.push(a) });
  return { items: flat(t), sent };
}

const roles = (items: MenuItemConstructorOptions[]): Set<string> =>
  new Set(items.flatMap((i) => (i.role === undefined ? [] : [i.role])));

describe('the application menu (bar ⛔2)', () => {
  it('has every edit key as the OS action, on mac and elsewhere', () => {
    for (const p of ['darwin', 'win32', 'linux'] as const) {
      const r = roles(build(p).items);
      for (const want of ['undo', 'redo', 'cut', 'copy', 'paste', 'selectAll', 'close']) expect(r, `${p} ${want}`).toContain(want);
    }
  });

  it('has the mac app keys: ⌘H hide, ⌘Q quit, ⌘W close, the Window menu', () => {
    const r = roles(build('darwin').items);
    for (const want of ['hide', 'hideOthers', 'quit', 'close', 'windowMenu', 'about']) expect(r).toContain(want);
  });

  it("sends bise's own keys to the renderer: ⌘, settings, ⌘I inbox, ⌘F find", () => {
    const { items, sent } = build('darwin');
    const keys = new Map(items.filter((i) => i.click !== undefined).map((i) => [i.accelerator, i]));
    expect([...keys.keys()].sort()).toEqual(['CmdOrCtrl+,', 'CmdOrCtrl+F', 'CmdOrCtrl+I']);
    for (const k of ['CmdOrCtrl+,', 'CmdOrCtrl+I', 'CmdOrCtrl+F']) {
      const click = keys.get(k)?.click as (() => void) | undefined;
      click?.();
    }
    expect(sent).toEqual(['settings', 'inbox', 'find']);
  });

  it('settings once per platform, never twice', () => {
    for (const p of ['darwin', 'win32'] as const) {
      expect(build(p).items.filter((i) => i.accelerator === 'CmdOrCtrl+,')).toHaveLength(1);
    }
  });

  it('no accelerator twice', () => {
    const acc = build('darwin', true).items.flatMap((i) => (typeof i.accelerator === 'string' ? [i.accelerator] : []));
    expect(new Set(acc).size).toBe(acc.length);
  });

  it('the devtools only in dev builds', () => {
    expect(roles(build('darwin').items)).not.toContain('toggleDevTools');
    expect(roles(build('darwin', true).items)).toContain('toggleDevTools');
  });
});

describe('externalUrl (window.bise.openExternal)', () => {
  it('opens web and mail links', () => {
    expect(externalUrl('https://github.com/acme/checkout/pull/42')).toBe('https://github.com/acme/checkout/pull/42');
    expect(externalUrl('http://localhost:5173/')).toBe('http://localhost:5173/');
    expect(externalUrl('mailto:camille@example.com')).toBe('mailto:camille@example.com');
  });

  it('refuses every other scheme, junk and non-strings', () => {
    for (const bad of ['file:///etc/passwd', 'javascript:alert(1)', 'vscode://file/x', 'x-apple.systempreferences:a', '', 'not a url', 'https://']) {
      expect(externalUrl(bad), bad).toBeNull();
    }
    expect(externalUrl(42)).toBeNull();
    expect(externalUrl(undefined)).toBeNull();
    expect(externalUrl(`https://a.example/${'x'.repeat(9000)}`)).toBeNull();
  });
});

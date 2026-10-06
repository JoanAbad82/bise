import type { MenuItemConstructorOptions } from 'electron';
import { describe, expect, it } from 'vitest';
import type { MenuAction } from '../shared/api';
import type { ClipOp } from './clipfence';
import { externalUrl } from './external';
import { menuTarget, menuTemplate } from './menu';

function flat(items: readonly MenuItemConstructorOptions[]): MenuItemConstructorOptions[] {
  return items.flatMap((i) => [i, ...(Array.isArray(i.submenu) ? flat(i.submenu) : [])]);
}

function build(platform: NodeJS.Platform, dev = false): { items: MenuItemConstructorOptions[]; sent: MenuAction[] } {
  const sent: MenuAction[] = [];
  const t = menuTemplate({ platform, appName: 'bise', dev, send: (a) => sent.push(a) });
  return { items: flat(t), sent };
}

function buildTest(): { items: MenuItemConstructorOptions[]; ops: ClipOp[] } {
  const ops: ClipOp[] = [];
  const t = menuTemplate({ platform: 'darwin', appName: 'bise', dev: false, send: () => undefined, clip: (op) => ops.push(op) });
  return { items: flat(t), ops };
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

  it("sends bise's own keys to the renderer: ⌘, settings, ⌘I inbox, ⌘F find, ⌃` terminal", () => {
    const { items, sent } = build('darwin');
    const keys = new Map(items.filter((i) => i.click !== undefined).map((i) => [i.accelerator, i]));
    expect([...keys.keys()].sort()).toEqual(['CmdOrCtrl+,', 'CmdOrCtrl+F', 'CmdOrCtrl+I', 'Ctrl+`']);
    for (const k of ['CmdOrCtrl+,', 'CmdOrCtrl+I', 'CmdOrCtrl+F', 'Ctrl+`']) {
      const click = keys.get(k)?.click as (() => void) | undefined;
      click?.();
    }
    expect(sent).toEqual(['settings', 'inbox', 'find', 'terminal']);
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

  it('test mode: no clipboard role at all, the items play on the private buffer', () => {
    const { items, ops } = buildTest();
    const r = roles(items);
    for (const role of ['cut', 'copy', 'paste', 'pasteAndMatchStyle']) expect(r).not.toContain(role);
    for (const role of ['undo', 'redo', 'selectAll', 'delete']) expect(r).toContain(role);
    for (const k of ['CmdOrCtrl+X', 'CmdOrCtrl+C', 'CmdOrCtrl+V', 'Shift+CmdOrCtrl+V']) {
      const click = items.find((i) => i.accelerator === k)?.click as (() => void) | undefined;
      click?.();
    }
    expect(ops).toEqual(['cut', 'copy', 'paste', 'paste']);
  });

  it('the devtools only in dev builds', () => {
    expect(roles(build('darwin').items)).not.toContain('toggleDevTools');
    expect(roles(build('darwin', true).items)).toContain('toggleDevTools');
  });
});

describe('menuTarget (qa-native m_9724)', () => {
  it('settings and the inbox open the main window when it has no keys (closed, or the capsule has them)', () => {
    expect(menuTarget('settings', false)).toEqual({ open: 'settings' });
    expect(menuTarget('inbox', false)).toEqual({ open: 'inbox' });
    expect(menuTarget('terminal', false)).toEqual({ open: 'terminal' });
  });

  it('View > Terminal is ctrl+` (bar T W25) and sends terminal', () => {
    const { items, sent } = build('darwin');
    const t = items.find((i) => i.label === 'Terminal');
    expect(t?.accelerator).toBe('Ctrl+`');
    (t?.click as (() => void) | undefined)?.();
    expect(sent).toEqual(['terminal']);
  });

  it('the main window with the keys gets them itself; find always goes to the focused page', () => {
    expect(menuTarget('settings', true)).toEqual({ send: 'focused' });
    expect(menuTarget('find', false)).toEqual({ send: 'focused' });
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

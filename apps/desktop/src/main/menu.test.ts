import type { MenuItemConstructorOptions } from 'electron';
import { describe, expect, it } from 'vitest';
import type { MenuAction } from '../shared/api';
import type { ClipOp } from './clipfence';
import { externalUrl } from './external';
import { menuTarget, menuTemplate } from './menu';
import { nativeItems, popupPoint } from './menu-popup';
import { KEYS, menuOf } from '../app/menus/registry';
import { menus } from '../proto/words_menus.gen';

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

  it("sends bise's own keys to the renderer: ⌘, settings, ⌘I inbox, ⌘F find, ⌃` terminal, ⌘S save", () => {
    const { items, sent } = build('darwin');
    const keys = new Map(items.filter((i) => i.click !== undefined).map((i) => [i.accelerator, i]));
    expect([...keys.keys()].sort()).toEqual(['CmdOrCtrl+,', 'CmdOrCtrl+F', 'CmdOrCtrl+I', 'CmdOrCtrl+S', 'Ctrl+`']);
    for (const k of ['CmdOrCtrl+,', 'CmdOrCtrl+I', 'CmdOrCtrl+F', 'Ctrl+`', 'CmdOrCtrl+S']) {
      const click = keys.get(k)?.click as (() => void) | undefined;
      click?.();
    }
    expect(sent).toEqual(['settings', 'inbox', 'find', 'terminal', 'save']);
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

  it('⌘S (art-save) goes to the focused page, never opens a route', () => {
    expect(menuTarget('save', false)).toEqual({ send: 'focused' });
    const { items } = build('darwin');
    expect(items.find((i) => i.accelerator === 'CmdOrCtrl+S')?.label).toBe('Save a Copy…');
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

describe("Help › 'send a test notification' (a0, lead m_14515)", () => {
  it('try and check builds and tests have it; his release app never does', async () => {
    const { hasTestNotify, menuTemplate } = await import('./menu');
    expect(hasTestNotify('bise try', false)).toBe(true);
    expect(hasTestNotify('bise check', false)).toBe(true);
    expect(hasTestNotify('bise', true)).toBe(true);
    expect(hasTestNotify('bise', false)).toBe(false);
    let clicked = 0;
    const base = { platform: 'darwin' as const, appName: 'bise try', dev: false, send: () => undefined };
    const help = menuTemplate({ ...base, testNotify: () => (clicked += 1) }).find((m) => m.role === 'help');
    const item = (help?.submenu as { label?: string; click?: () => void }[] | undefined)?.[0];
    expect(item?.label).toBe('send a test notification');
    item?.click?.();
    expect(clicked).toBe(1);
    expect(menuTemplate(base).some((m) => m.role === 'help')).toBe(false);
  });
});

describe("the Agent menu (bise fait mac, d4): the agent in view's '…' in the menu bar", () => {
  const perf = { name: 'perf', main: false, status: 'working', archived: false, title: '', purpose: '', since_ms: 1, waits: 0, dir: '/h/perf', path: '/w/perf', changes: { files: 1, add: 1, del: 0 }, watching: [] as never[] } as const;
  const items = menuOf({ e: { kind: 'agent', project: 'acme', agent: 'perf' }, row: perf, pinned: false, reply: false });
  const base = { platform: 'darwin' as const, appName: 'bise', dev: true, send: () => undefined };

  it('hidden with no agent in view; with one, its items, keys live, a pick says its id', () => {
    expect(menuTemplate(base).some((m) => m.label === menus.agent_menu)).toBe(false);
    const picked: string[] = [];
    const t = menuTemplate({ ...base, agent: nativeItems(items, (id) => picked.push(id), () => undefined, true) });
    const agent = t.find((m) => m.label === menus.agent_menu);
    const sub = flat((agent?.submenu ?? []) as MenuItemConstructorOptions[]);
    const stop = sub.find((i) => i.id === 'stop');
    expect(stop?.accelerator).toBe(KEYS.stop);
    expect(stop?.registerAccelerator).toBe(true);
    (stop?.click as (() => void) | undefined)?.();
    expect(picked).toEqual(['stop']);
    // nothing dimmed: an item it can't do is not there
    expect(sub.some((i) => i.enabled === false)).toBe(false);
    // its place: after View, before Window (macOS's order)
    const labels = t.map((m) => m.label ?? m.role);
    expect(labels.indexOf(menus.agent_menu)).toBe(labels.indexOf('View') + 1);
  });

  it('no accelerator twice across the whole bar; ⌥⌘0-4 left to the panel and the bubbles', () => {
    const all = flat(menuTemplate({ ...base, agent: nativeItems(items, () => undefined, () => undefined, true) }));
    const acc = all.flatMap((i) => (typeof i.accelerator === 'string' ? [i.accelerator] : []));
    expect(acc).toContain('CmdOrCtrl+.');
    expect(new Set(acc).size).toBe(acc.length);
    for (const n of [0, 1, 2, 3, 4]) expect(acc).not.toContain(`Alt+CmdOrCtrl+${String(n)}`);
  });

  it("a popup's keys are shown, never registered (the menu bar's are the live ones)", () => {
    const pop = flat(nativeItems(items, () => undefined, () => undefined, false));
    expect(pop.filter((i) => i.accelerator !== undefined).every((i) => i.registerAccelerator === false)).toBe(true);
  });

  it("the '…' opens its menu under the button, at its left edge; a right click at the pointer", () => {
    expect(popupPoint({ x: 100.4, y: 40, width: 28, height: 28 })).toEqual({ x: 100, y: 68 });
    expect(popupPoint(undefined)).toBeUndefined();
  });
});

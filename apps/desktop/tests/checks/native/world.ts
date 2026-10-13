// The native checks' shared world (qa-native): the new app on the scripted helper and the
// scripted core (fixture world), the capsule's page, main's stdout lines, the application menu.
// Inputs only through the real paths a check may use: the helper's lines (what fn means, as the
// helper says it), the core's lines, real keys in a page, a click on a menu item. Effects are read
// outside the app: the helper's and the core's command logs, main's stdout lines (test mode's
// CAPSULE_LINE), the window server's proof (launch.ts).
import type { Page } from '@playwright/test';
import { FakeCore, FakeHelper, launchDesktop, type Session } from '../../harness';

export type World = { s: Session; helper: FakeHelper; core: FakeCore; out: Lines };

/** main's stdout, line by line, from the moment the world starts listening */
export class Lines {
  private buf = '';
  readonly lines: string[] = [];

  push(chunk: string): void {
    const parts = (this.buf + chunk).split('\n');
    this.buf = parts.pop() ?? '';
    this.lines.push(...parts.map((l) => l.trim()).filter((l) => l !== ''));
  }

  /** the lines that start with `prefix`, without it */
  of(prefix: string): string[] {
    return this.lines.filter((l) => l.startsWith(prefix)).map((l) => l.slice(prefix.length).trim());
  }

  /** waits until a line starting with `prefix` matches `pred` (its rest), or throws */
  async wait(prefix: string, pred: (rest: string) => boolean, ms = 2000): Promise<string> {
    const end = Date.now() + ms;
    for (;;) {
      const hit = this.of(prefix).find(pred);
      if (hit !== undefined) return hit;
      if (Date.now() > end) throw new Error(`no '${prefix}' line matched in ${ms} ms; got ${JSON.stringify(this.of(prefix))}`);
      await new Promise((r) => setTimeout(r, 25));
    }
  }
}

/** The app on the scripted helper and core; `body` runs, then everything is closed and proven. */
export async function onWorld(
  body: (w: World) => Promise<void>,
  o: { route?: string; core?: FakeCore; env?: Record<string, string>; size?: string } = {},
): Promise<void> {
  const helper = new FakeHelper();
  const core = o.core ?? new FakeCore();
  const s = await launchDesktop({
    helper,
    core,
    ...(o.route === undefined ? {} : { route: o.route }),
    ...(o.env === undefined ? {} : { env: o.env }),
    ...(o.size === undefined ? {} : { size: o.size }),
  });
  const out = new Lines();
  s.app.process().stdout?.setEncoding('utf8');
  s.app.process().stdout?.on('data', (d: string) => { out.push(d); });
  try {
    await body({ s, helper, core, out });
  } finally {
    await s.close();
    helper.dispose();
    core.dispose();
  }
}

/** The capsule's page (its URL says ?surface=capsule, amb-mac 968e69a9). */
export async function capsulePage(s: Session): Promise<Page> {
  for (let i = 0; i < 40; i++) {
    const p = s.app.windows().find((w) => w.url().includes('surface=capsule'));
    if (p) {
      await p.waitForLoadState('load');
      return p;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('the app has no capsule window');
}

export type MenuEntry = { label: string; role: string | null; key: string | null; path: string; sub: MenuEntry[] };

/** The application menu as the menu bar draws it: labels, roles and keys, by path ("Edit/Copy"). */
export async function appMenu(s: Session): Promise<MenuEntry[]> {
  return s.app.evaluate(({ Menu }) => {
    type E = { label: string; role: string | null; key: string | null; path: string; sub: E[] };
    const walk = (m: Electron.Menu | null | undefined, at: string): E[] =>
      (m?.items ?? [])
        .filter((i) => i.type !== 'separator')
        .map((i) => {
          const path = at === '' ? i.label : `${at}/${i.label}`;
          return { label: i.label, role: i.role ?? null, key: i.accelerator ?? null, path, sub: walk(i.submenu, path) };
        });
    return walk(Menu.getApplicationMenu(), '');
  });
}

export const flat = (es: readonly MenuEntry[]): MenuEntry[] => es.flatMap((e) => [e, ...flat(e.sub)]);

/**
 * Clicks a menu item of the menu bar, found by its path ("Go/Inbox"): Electron's MenuItem.click,
 * the same call NSMenu makes when he clicks the item. The keys themselves only reach NSMenu from
 * the window server with a key window: the VM pass (docs in native/README.md).
 */
export async function clickMenu(s: Session, path: string): Promise<void> {
  const found = await s.app.evaluate(({ Menu }, p) => {
    const find = (m: Electron.Menu | null | undefined, at: string): Electron.MenuItem | null => {
      for (const i of m?.items ?? []) {
        const here = at === '' ? i.label : `${at}/${i.label}`;
        if (here === p) return i;
        const sub = find(i.submenu, here);
        if (sub) return sub;
      }
      return null;
    };
    const item = find(Menu.getApplicationMenu(), '');
    if (!item) return false;
    // MenuItem.click(event, focusedWindow, focusedWebContents): what Electron's NSMenu target calls
    (item as unknown as { click: (...a: unknown[]) => void }).click();
    return true;
  }, path);
  if (!found) throw new Error(`no menu item ${path}`);
}

/** The data-testids drawn in a page right now. */
export const ids = (p: Page): Promise<string[]> =>
  p.locator('[data-testid]').evaluateAll((es) => es.map((e) => e.getAttribute('data-testid') ?? ''));

/** The capsule window's bounds and whether it may take the keys, from Electron's main. */
export async function capsuleWindow(s: Session): Promise<{ x: number; y: number; width: number; height: number; focused: boolean }> {
  return s.app.evaluate(({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows().find((b) => b.webContents.getURL().includes('surface=capsule'));
    if (!w) throw new Error('no capsule window');
    return { ...w.getBounds(), focused: w.isFocused() };
  });
}

export const CAPSULE = 'bise-desktop: capsule';
export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

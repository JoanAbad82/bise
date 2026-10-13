// app/title-status · the title bar's status slot (designer's desktop-notices v2, ambient-lead
// m_21070): the room between the crumb's end +16 and the right bar's toggle (8 before it), in the
// title bar's own row (no extra height). Passes when, at 1400, 1100, 800 and 680 wide, sidebar open
// and folded: the slot is in the title bar's band, starts 16 px after the crumb's end and ends 8 px
// before the toggle, the crumb shows whole (never cut for it), the bar stays --h-bar high, and
// data-narrow says whether its room is under 160 px. Empty until amb-home's TitleStatus fills it.
// Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const prefs = { ev: 'prefs', prefs: { onboarded: true, theme: 'light', excluded_apps: [] } };
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 60_000, waits: 0 });
const world = () => [
  prefs,
  { ev: 'projects', projects: [{ project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 0, agents: 2, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [ag('main'), ag('perf')] },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: NOW - 30_000, kind: 'agent', text: 'on it' }], before: null, more: false },
];

test("app/title-status: the slot sits between the crumb's end +16 and the toggle -8, at every width, the crumb whole", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  try {
    const { page } = s;
    await expect(page.getByTestId('app.title.status')).toHaveCount(1, { timeout: 10_000 });
    for (const size of ['1400x900', '1100x720', '800x700', '680x700']) {
      const [w = 0, h = 0] = size.split('x').map(Number);
      await s.app.evaluate(({ BrowserWindow }, [ww, hh]) => {
        const win = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
        win?.setContentSize(ww, hh);
      }, [w, h] as const);
      await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(w);
      for (const fold of [false, true]) {
        // fold the sidebar at the wide sizes (under 1000 it is away already)
        const sideShown = (await page.getByTestId('app.sidebar').count()) > 0;
        if (fold === sideShown && w >= 1000) await page.keyboard.press('Meta+Backslash');
        await page.waitForTimeout(200);
        const m = await page.evaluate(() => {
          const r = (sel: string) => document.querySelector(sel)?.getBoundingClientRect() ?? null;
          const bar = r('[data-testid="app.title"]');
          const crumb = document.querySelector<HTMLElement>('[data-testid="app.title.crumb"]');
          const slot = document.querySelector<HTMLElement>('[data-testid="app.title.status"]');
          const tog = r('[data-testid="app.title.panel"]');
          const sr = slot?.getBoundingClientRect() ?? null;
          const cr = crumb?.getBoundingClientRect() ?? null;
          return {
            barH: Math.round(bar?.height ?? 0),
            inBar: sr !== null && bar !== null && sr.top >= bar.top && sr.bottom <= bar.bottom,
            afterCrumb: sr !== null && cr !== null ? Math.round(sr.left - cr.right) : -1,
            beforeToggle: sr !== null && tog !== null ? Math.round(tog.left - sr.right) : null,
            crumbWhole: crumb !== null && crumb.scrollWidth <= crumb.clientWidth,
            room: Math.round(sr?.width ?? -1),
            narrow: slot?.dataset['narrow'] ?? '',
          };
        });
        const at = `${size}, sidebar ${fold ? 'folded' : 'open'}`;
        expect(m.barH, `${at}: the title bar stays --h-bar (+ its 1 px rule)`).toBeLessThanOrEqual(41);
        expect(m.inBar, `${at}: the slot is in the title bar's own row`).toBe(true);
        expect(m.afterCrumb, `${at}: 16 px after the crumb's end`).toBe(16);
        if (m.beforeToggle !== null) expect(m.beforeToggle, `${at}: 8 px before the right bar's toggle`).toBe(8);
        expect(m.crumbWhole, `${at}: the crumb is never cut for it`).toBe(true);
        expect(m.narrow, `${at}: data-narrow says its room (${String(m.room)} px) is under 160`).toBe(String(m.room < 160));
      }
    }
  } finally {
    await s.close();
    core.dispose();
  }
});

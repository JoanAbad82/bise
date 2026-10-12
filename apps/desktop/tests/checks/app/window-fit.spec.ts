// app/window-fit · his try d94b7996 (main m_13676, lead m_13678): 'the onboarding message isn't
// centred and there's a window-wide scrollbar from an x and y padding on the whole window'.
// Passes when, at 800x600, 1024x640 (his window), 1100x720 and 1400x860, with panel A open and
// shut, on a project's empty main thread and on bise's empty thread: the page itself never scrolls
// (document.scrollingElement's scroll size <= its client size, both ways; the body has no margin),
// and the first-run block ('what's on your mind?') has its centre on the thread column's axis (the
// composer's, within 2 px) and in the middle of the list's place (within 2 px). Shots light and
// dark at 1024 and 1400 for designer's sign-off. The scripted core (FakeCore). Owner: amb-win.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'opencode-1a2b3c4d';
const NOW = Date.now();
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 60_000, waits: 0 });
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const world = () => [
  prefs('dark'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'opencode', path: '/nowhere/opencode', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/opencode', name: 'opencode' },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  { ev: 'agents', project: P, agents: [agent('main')] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
  { ev: 'thread', project: P, agent: 'main', entries: [], before: null, more: false },
];

const SIZES = ['800x600', '1024x640', '1100x720', '1400x860'];
const shot = (name: string) => test.info().outputPath(`${name}.png`);

/** The page's scroll sizes, the body's margin, and where the first-run block sits against the column. */
async function fit(page: Page) {
  return page.evaluate(() => {
    const se = document.scrollingElement ?? document.documentElement;
    const box = (sel: string) => document.querySelector(sel)?.getBoundingClientRect() ?? null;
    const block = box('[data-testid="thread.first"] > *');
    const main = box('.th-main');
    const comp = box('.th-screen .b-composer');
    return {
      sh: se.scrollHeight, ch: se.clientHeight, sw: se.scrollWidth, cw: se.clientWidth,
      margin: getComputedStyle(document.body).margin,
      bx: block === null ? null : block.x + block.width / 2,
      by: block === null ? null : block.y + block.height / 2,
      mx: main === null ? null : main.x + main.width / 2,
      my: main === null ? null : main.y + main.height / 2,
      cx: comp === null ? null : comp.x + comp.width / 2,
    };
  });
}

for (const route of [`project/${P}`, 'bise']) {
  test(`app/window-fit: ${route}'s empty thread: no window scroll, the first-run block centred, at every size, panel A open and shut`, async () => {
    const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route, size: '1400x860' });
    try {
      const { page } = s;
      await expect(page.getByTestId('setup.firstrun')).toBeVisible({ timeout: 10_000 });
      for (const size of SIZES) {
        const [w = 0, h = 0] = size.split('x').map(Number);
        // the main window (the widest; the capsule stays as it is)
        await s.app.evaluate(({ BrowserWindow }, [ww, hh]) => {
          const win = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
          win?.setContentSize(ww, hh);
        }, [w, h] as const);
        await expect.poll(() => page.evaluate(() => window.innerWidth), { message: `the window is ${size}` }).toBe(w);
        // the frame follows the resize on its next render: read the panel (and press ⌥⌘0) after it,
        // never in between (under load the key reached the old frame: a slide-over opened at 800)
        await page.evaluate(() => new Promise<void>((done) => { requestAnimationFrame(() => { requestAnimationFrame(() => { done(); }); }); }));
        const panel = page.getByTestId('app.panel');
        for (const open of [true, false]) {
          // panel A: open or shut as asked (under 1000 px it's a slide-over: shut only)
          if (w < 1000 && open) continue;
          if ((await panel.count()) > 0 !== open) await page.keyboard.press('Meta+Alt+Digit0');
          await expect(panel).toHaveCount(open ? 1 : 0);
          await page.waitForTimeout(150);
          const f = await fit(page);
          const at = `${route} ${size} panel ${open ? 'open' : 'shut'}`;
          expect(f.margin, `${at}: the body has no margin`).toBe('0px');
          expect(f.sh, `${at}: the window's page never scrolls up/down`).toBeLessThanOrEqual(f.ch);
          expect(f.sw, `${at}: the window's page never scrolls sideways`).toBeLessThanOrEqual(f.cw);
          expect(f.bx, `${at}: the block is there`).not.toBeNull();
          expect(Math.abs((f.bx ?? 0) - (f.cx ?? 0)), `${at}: the block on the composer's axis`).toBeLessThanOrEqual(2);
          expect(Math.abs((f.bx ?? 0) - (f.mx ?? 0)), `${at}: the block in the column's middle`).toBeLessThanOrEqual(2);
          expect(Math.abs((f.by ?? 0) - (f.my ?? 0)), `${at}: the block halfway down the list's place`).toBeLessThanOrEqual(2);
          if ((size === '1024x640' || size === '1400x860') && open) {
            const name = `${route.replace(/\W+/g, '-')}-${String(w)}`;
            await page.mouse.move(1, 300);
            await page.screenshot({ path: shot(`${name}-dark`) });
            await core.send(prefs('light') as never);
            await page.waitForTimeout(300);
            await page.screenshot({ path: shot(`${name}-light`) });
            await core.send(prefs('dark') as never);
            await page.waitForTimeout(300);
          }
        }
      }
    } finally {
      await s.close();
      core.dispose();
    }
  });
}

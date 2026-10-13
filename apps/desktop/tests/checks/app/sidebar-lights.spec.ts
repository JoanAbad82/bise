// app/sidebar-lights · his bug (ambient-lead m_14497, main m_14470, verbatim: « Il y a un overlap
// entre la barre de recherche et les boutons de la fenêtre mac en haut à gauche de l'écran »; his
// shot: a long sidebar scrolled, 'search or jump ⌘K' under the red/yellow/green lights). macOS
// draws its lights at x 16, y 15 (src/main/windows.ts LIGHTS, titleBarStyle hiddenInset), about
// 54 x 14 px. Passes when, on the REAL shell with a long sidebar (22 projects of 6 agents), at
// 1100 and 1400 px wide, before and after the sidebar is scrolled to its end: the search field
// starts under the lights' 40 px room, the lights' points hit the sidebar's lights strip (never the
// field or a row), the field is still on screen, and the window never scrolls. Shots light and dark.
// The scripted core (FakeCore). Owner: amb-win.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const ids = 'abcdefghijklmnopqrstuv'.split('').map((x) => `${x}proj-1a2b3c4${x}`);
const agent = (name: string) => ({ name, main: name === 'main', status: 'working', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      ...ids.map((p, i) => ({ project: p, name: p.slice(0, 5), path: `/nowhere/${p}`, git: true, home: false, order: i + 1, agents: 6, working: 5, waits: 0, running: true })),
    ],
  },
  ...ids.map((p) => ({ ev: 'agents', project: p, agents: ['main', 'one', 'two', 'three', 'four', 'five'].map(agent) })),
];

// macOS's three lights (12 px each, 8 px apart) from x 16, y 15: their centres
const LIGHTS = [22, 42, 62].map((x) => ({ x, y: 21 }));

async function clear(page: Page, what: string): Promise<void> {
  const r = await page.evaluate((points) => {
    const side = document.querySelector('[data-testid="app.sidebar"]');
    const field = document.querySelector('[data-testid="app.sidebar.search"]');
    const strip = document.querySelector('[data-testid="app.sidebar.lights"]');
    const se = document.scrollingElement ?? document.documentElement;
    return {
      fieldTop: field?.getBoundingClientRect().top ?? -1,
      fieldBottom: field?.getBoundingClientRect().bottom ?? -1,
      scrolled: side instanceof HTMLElement ? side.scrollTop : -1,
      hits: points.map((p) => {
        const top = document.elementFromPoint(p.x, p.y);
        return top !== null && strip !== null && (top === strip || strip.contains(top));
      }),
      pageScrolls: se.scrollHeight > se.clientHeight,
    };
  }, LIGHTS);
  expect(r.fieldTop, `${what}: the search field starts under the lights' 40 px room`).toBeGreaterThanOrEqual(40);
  expect(r.fieldBottom, `${what}: the field is on screen`).toBeLessThan(120);
  expect(r.hits, `${what}: under each light, the sidebar's lights strip, never the field or a row`).toEqual([true, true, true]);
  expect(r.pageScrolls, `${what}: the window never scrolls`).toBe(false);
}

for (const size of ['1100x720', '1400x900']) {
  test(`app/sidebar-lights: the search field never under macOS's lights, scrolled or not, at ${size}`, async () => {
    const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, size });
    try {
      const { page } = s;
      await expect(page.getByTestId('app.sidebar.search')).toBeVisible({ timeout: 10_000 });
      await clear(page, `${size} at rest`);
      const top = page.getByTestId('app.sidebar.top');
      const fade = () => top.evaluate((el) => getComputedStyle(el, '::after').opacity);
      await expect(top, 'at rest: no fade under the field').toHaveAttribute('data-scrolled', 'false');
      expect(await fade()).toBe('0');
      // the user's case: the sidebar scrolled down its rows
      const scrolled = await page.getByTestId('app.sidebar').evaluate((el) => {
        el.scrollTop = el.scrollHeight;
        return el.scrollTop;
      });
      expect(scrolled, 'the sidebar is long enough to scroll').toBeGreaterThan(100);
      await page.waitForTimeout(100);
      await clear(page, `${size} scrolled to its end`);
      // designer m_15023: scrolled, the edge under the field fades (16 px), 'more above'
      await expect(top, 'scrolled: the fade under the field').toHaveAttribute('data-scrolled', 'true');
      expect(await fade()).toBe('1');
      expect(await top.evaluate((el) => getComputedStyle(el, '::after').height)).toBe('16px');
      // macOS full screen (amb-mac's onFullScreen, f58585d2): no lights, so no 40 px room; back on leave
      const emit = (what: 'enter-full-screen' | 'leave-full-screen') =>
        s.app.evaluate(({ BrowserWindow }, ev) => {
          for (const w of BrowserWindow.getAllWindows()) w.emit(ev);
        }, what);
      await emit('enter-full-screen');
      await expect(top, 'full screen').toHaveAttribute('data-full', 'true');
      const fieldTop = () => page.getByTestId('app.sidebar.search').evaluate((el) => el.getBoundingClientRect().top);
      expect(await fieldTop(), 'full screen: the field moves up, no room for lights that are not there').toBeLessThan(20);
      await page.screenshot({ path: test.info().outputPath(`lights-${size.replace('x', '-')}-fullscreen.png`) });
      await emit('leave-full-screen');
      await expect(top, 'out of full screen').toHaveAttribute('data-full', 'false');
      await clear(page, `${size} back from full screen`);
      const name = size.replace('x', '-');
      await page.mouse.move(600, 300);
      await page.screenshot({ path: test.info().outputPath(`lights-${name}-light.png`) });
      await core.send(prefs('dark') as never);
      await page.waitForTimeout(300);
      await clear(page, `${size} scrolled, dark`);
      await page.screenshot({ path: test.info().outputPath(`lights-${name}-dark.png`) });
    } finally {
      await s.close();
      core.dispose();
    }
  });
}

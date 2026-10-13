// thread/steady-bottom (his feedback main m_21487, designer m_21505 (2), ambient-lead m_21788): scrolling
// moves only the thread. Wheel up and down a long thread: the composer, its keys line (the tip row) and the
// inbox block keep the same boxes at every step, nothing hides; a 16 px fade at the list's bottom edge
// separates the rows from them. Shots: steady-<theme>-1100-rest / -reading. Owner: amb-win.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'telemetry-cf9cb2fe';
const NOW = Date.now();
const agent = (name: string, over: Record<string, unknown> = {}) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: NOW - 3_600_000, waits: 0, watching: [], ...over });
const LONG = Array.from({ length: 80 }, (_, i) => ({ pos: i + 1, at_ms: NOW - 3_600_000 + i * 1000, kind: 'agent', text: `bench note ${String(i + 1)}: p95 moved by ${String(i % 7)} ms on the cold path, nothing else changed.` }));
const card = { id: 1, project: P, kind: 'question', agent: 'perf', question: 'keep the webp next to the avif?', options: [{ n: 1, label: 'yes' }, { n: 2, label: 'no' }], urgent: false, since_ms: NOW - 120_000 };
const world = (theme: string) => [
  {
    ev: 'prefs',
    prefs: {
      onboarded: true,
      theme,
      context: { shot: true, url: true, file: true, window_text: false },
      excluded_apps: [],
      quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
      voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
      shots_keep_days: 7,
    },
  },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'telemetry', path: '/nowhere/telemetry', git: true, home: false, order: 1, agents: 2, working: 0, waits: 1, running: true, cards: [card] },
    ],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/telemetry', name: 'telemetry' },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf', { waits: 1 })] },
  { ev: 'thread', project: P, agent: 'main', entries: LONG, before: null, more: false },
];

/** the boxes that must never move on scroll, rounded */
const boxes = (page: Page) =>
  page.evaluate(() => {
    const at = (sel: string) => {
      const e = document.querySelector(sel);
      if (e === null) return null;
      const r = e.getBoundingClientRect();
      return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)].join(',');
    };
    return { composer: at('.th-screen .b-composer'), keys: at('[data-testid="composer.keys"]'), block: at('[data-testid="inbox.block"]'), list: at('[data-testid="thread.list"]') };
  });
/** the list stopped (the same scrollTop over 3 frames) */
const still = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((done) => {
        const s = document.querySelector<HTMLElement>('[data-virtuoso-scroller]');
        let last = Number.NaN;
        let same = 0;
        const t0 = performance.now();
        const f = () => {
          const t = s?.scrollTop ?? 0;
          same = t === last ? same + 1 : 0;
          last = t;
          if (same >= 3 || performance.now() - t0 > 3000) done();
          else requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
      }),
  );

for (const theme of ['light', 'dark']) {
  test(`thread/steady-bottom: wheel up and down, the composer, its keys line and the inbox block never move; a 16 px fade at the list's bottom (${theme})`, async () => {
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x820' });
    try {
      const { page } = s;
      await page.setViewportSize({ width: 1100, height: 820 });
      await expect(page.getByText('bench note 80:')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('inbox.block')).toBeVisible();
      await expect(page.getByTestId('composer.keys')).toBeVisible();
      await still(page);
      const rest = await boxes(page);
      expect(rest.keys, 'the keys line at rest').not.toBeNull();
      expect(rest.block, 'the inbox block at rest').not.toBeNull();
      // the fade: 16 px over the list's bottom edge, not catching the mouse
      const fade = await page.getByTestId('thread.list').evaluate((e) => {
        const a = getComputedStyle(e, '::after');
        return { h: a.height, pe: a.pointerEvents, bg: a.backgroundImage };
      });
      expect(fade.h, 'a 16 px fade').toBe('16px');
      expect(fade.pe).toBe('none');
      expect(fade.bg, 'a gradient').toContain('gradient');
      await page.mouse.move(1, 300);
      await page.screenshot({ path: test.info().outputPath(`steady-${theme}-1100-rest.png`) });

      await page.getByTestId('thread.list').hover();
      const steps = [-300, -300, -600, -900, 400, -200, 600, 20_000];
      for (const [i, dy] of steps.entries()) {
        await page.mouse.wheel(0, dy);
        // mid-scroll too: read while it moves, then once it stops
        await page.waitForTimeout(60);
        expect(await boxes(page), `step ${String(i)} (${String(dy)}), moving`).toEqual(rest);
        await still(page);
        expect(await boxes(page), `step ${String(i)} (${String(dy)}), stopped`).toEqual(rest);
        await expect(page.getByTestId('composer.keys'), `step ${String(i)}: the keys line shows`).toBeVisible();
        if (i === 3) {
          await expect(page.getByText('bench note 80:'), 'he reads up').toBeHidden();
          await page.mouse.move(1, 300);
          await page.screenshot({ path: test.info().outputPath(`steady-${theme}-1100-reading.png`) });
          await page.getByTestId('thread.list').hover();
        }
      }
      // back at the end: the last row whole above the block, the fade on the list's own bottom space
      await expect(page.getByText('bench note 80:')).toBeVisible();
      const last = await page.getByText('bench note 80:').evaluate((e) => e.getBoundingClientRect().bottom);
      const listBottom = await page.getByTestId('thread.list').evaluate((e) => e.getBoundingClientRect().bottom);
      expect(last, 'the last row clear of the fade').toBeLessThanOrEqual(listBottom - 16);
    } finally {
      await s.close();
      core.dispose();
    }
  });
}

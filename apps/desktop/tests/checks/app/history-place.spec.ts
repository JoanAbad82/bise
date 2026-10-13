// app/history-place · history's remaining parts (designer's desktop-history, ambient-lead m_20977).
// Storefront on FakeCore at 1400, perf with a long thread and an artifact. Passes when:
//   - the walk: storefront's main → perf (its right bar row) → he scrolls perf's thread up → the
//     artifact (its right bar row) → esc closes it: perf's thread is back at the row he read → ‹
//     storefront's main → › perf, still at that row;
//   - the scheduled list, scrolled down: away and ‹ back, it is where he left it;
//   - the trackpad's two-finger swipe: fingers to the right (wheel deltaX < 0) go back, to the
//     left forward, once per swipe; nothing while ⌘K is open; never over a box that scrolls
//     sideways that way.
// Shots for designer: walk-1-perf-scrolled, walk-2-artifact, walk-3-esc, walk-4-back, walk-5-forward.
// Owner: amb-web.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const PREFS = {
  ev: 'prefs',
  prefs: { onboarded: true, theme: 'light', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
};
const agent = (name: string, status: string) => ({ name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [] });
const PAGE = '<!doctype html><html><body style="margin:0;padding:40px;font:17px -apple-system;background:#f4efe6"><h1>product page, before / after</h1></body></html>';
const task = (id: number) => ({ id, agent: 'perf', by: 'main', words: `check the build, round ${String(id)}`, every: '1h', done: 0, next_ms: NOW + id * MIN });
const world = () => [
  PREFS,
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main', 'idle'), agent('perf', 'idle')] },
  { ev: 'agents', project: HOME, agents: [agent('main', 'idle')] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'perf made the product page for you.' }], before: null, more: false },
  {
    ev: 'thread',
    project: P,
    agent: 'perf',
    entries: [
      ...Array.from({ length: 80 }, (_, i) => ({ pos: i + 1, at_ms: NOW - 90 * MIN + i * 1000, kind: 'agent', text: `line ${String(i + 1)} of perf's long thread, enough words to fill a row` })),
      { pos: 81, at_ms: NOW - 5 * MIN, kind: 'artifact', text: 'product page, before / after', made: { id: 'product-page', agent: 'perf', title: 'product page, before / after', kind: 'page', kind_word: 'page', v: 1 } },
    ],
    before: null,
    more: false,
  },
  { ev: 'artifacts', project: P, items: [{ id: 'product-page', kind: 'page', title: 'product page, before / after', agent: 'perf', version: 1, at_ms: NOW - 5 * MIN, url: `data:text/html,${encodeURIComponent(PAGE)}`, new: false }] },
  { ev: 'scheduled', project: P, items: Array.from({ length: 40 }, (_, i) => task(i + 1)) },
];

const SCROLLER = '[data-testid="thread.list"] [data-virtuoso-scroller="true"]';

/** Where the window is: 'agent:<a>' for storefront's threads, 'scheduled', or 'bise'. */
async function where(page: Page): Promise<string> {
  if (await page.getByTestId('scheduled.screen').isVisible()) return 'scheduled';
  const th = page.getByTestId('thread.screen').first();
  if ((await th.isVisible()) && (await th.getAttribute('data-project')) === P) return `agent:${(await th.getAttribute('data-agent')) ?? ''}`;
  return 'bise';
}

/** The row he reads: the first thread row whose top is in view, and its y. */
const reading = (page: Page) =>
  page.evaluate((sel) => {
    const el = document.querySelector<HTMLElement>(sel);
    if (el === null) return null;
    const top = el.getBoundingClientRect().top;
    const rows: HTMLElement[] = Array.from(el.querySelectorAll<HTMLElement>('[data-testid^="thread.entry."]'));
    const row = rows.find((r) => r.getBoundingClientRect().top >= top);
    return row === undefined ? null : { id: row.dataset.testid ?? '', y: Math.round(row.getBoundingClientRect().top) };
  }, SCROLLER);

/** 'same' when the row he reads is `was`, within 2 px of its y; else where it is now. */
const sameAs = async (page: Page, was: { id: string; y: number } | null): Promise<string> => {
  const now = await reading(page);
  if (now === null || was === null) return `not on screen (${JSON.stringify(now)})`;
  return now.id === was.id && Math.abs(now.y - was.y) <= 2 ? 'same' : `${JSON.stringify(now)}, he read ${JSON.stringify(was)}`;
};

/** A two-finger swipe as the trackpad sends it: a stream of small sideways wheel events. */
async function swipe(page: Page, dx: number): Promise<void> {
  for (let i = 0; i < 12; i += 1) {
    await page.mouse.wheel(dx, 0);
    await page.waitForTimeout(16);
  }
  // the gesture ends: a pause longer than swipe.ts's GAP_MS
  await page.waitForTimeout(400);
}

test("app/history-place: back on a place its scroll comes back (thread through an artifact, a list); the two-finger swipe walks", async () => {
  test.setTimeout(120_000);
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}`, size: '1400x900' });
  const { page } = s;
  const at = (want: string, why: string) => expect.poll(() => where(page), { message: why, timeout: 5000 }).toBe(want);
  const shot = (name: string) => page.screenshot({ path: test.info().outputPath(`${name}.png`) });
  try {
    await page.setViewportSize({ width: 1400, height: 900 });
    await at('agent:main', "storefront's main");

    let read: { id: string; y: number } | null = null;
    await test.step("the walk: perf scrolled up → its artifact → esc → ‹ → ›, perf's thread where he read", async () => {
      // on a project's page the right bar shows that project only: its rows are named by agent
      await page.getByTestId('app.right.agent.perf').click();
      await at('agent:perf', 'the right bar opens perf large');
      await expect(page.getByTestId('thread.entry.81')).toBeVisible({ timeout: 10_000 });
      const box = await page.locator(SCROLLER).boundingBox();
      if (box === null) throw new Error("perf's thread is not on screen");
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      for (let i = 0; i < 12; i += 1) {
        await page.mouse.wheel(0, -150);
        await page.waitForTimeout(60);
      }
      await page.waitForTimeout(700);
      await expect(page.getByTestId('thread.entry.81'), 'scrolled up: the newest is out of view').not.toBeInViewport();
      read = await reading(page);
      expect(read, 'a row he reads').not.toBeNull();
      await shot('walk-1-perf-scrolled');

      await page.getByTestId(`app.right.artifact.${P}.product-page`).click();
      await expect(page.getByTestId('app.art')).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(500);
      await shot('walk-2-artifact');
      await page.mouse.click(700, 120);
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('app.art'), 'esc closes the artifact').toHaveCount(0, { timeout: 5000 });
      await at('agent:perf', "esc: back to perf's thread");
      await expect.poll(() => sameAs(page, read), { message: "perf's thread back at the row he read", timeout: 5000 }).toBe('same');
      await shot('walk-3-esc');

      await page.keyboard.press('Meta+BracketLeft');
      await at('agent:main', "‹: storefront's main");
      await shot('walk-4-back');
      await page.keyboard.press('Meta+BracketRight');
      await at('agent:perf', '›: perf again');
      await expect.poll(() => sameAs(page, read), { message: '› brings perf back at the row he read', timeout: 5000 }).toBe('same');
      await shot('walk-5-forward');
    });

    await test.step('a list: the scheduled list comes back scrolled where he left it', async () => {
      await page.getByTestId('app.sidebar.scheduled').click();
      await at('scheduled', 'the sidebar opens the scheduled list');
      const list = page.getByTestId('scheduled.list');
      await expect(list).toBeVisible({ timeout: 5000 });
      await list.evaluate((el) => {
        el.scrollTop = 400;
      });
      await page.waitForTimeout(400);
      const top = await list.evaluate((el) => el.scrollTop);
      expect(top, 'the list scrolls').toBeGreaterThan(300);
      await page.keyboard.press('Meta+BracketLeft');
      await at('agent:perf', '‹ from the list');
      await page.keyboard.press('Meta+BracketRight');
      await at('scheduled', '› to the list');
      await expect.poll(() => page.getByTestId('scheduled.list').evaluate((el) => el.scrollTop), { message: 'the list where he left it', timeout: 5000 }).toBe(top);
    });

    await test.step('the two-finger swipe: right goes back, left forward; none under ⌘K', async () => {
      await page.mouse.move(700, 450);
      await swipe(page, -30);
      await at('agent:perf', 'fingers to the right: back');
      await swipe(page, 30);
      await at('scheduled', 'fingers to the left: forward');
      await swipe(page, -30);
      await at('agent:perf', 'one swipe, one step');
      await page.keyboard.press('Meta+k');
      await expect(page.getByTestId('app.palette')).toBeVisible({ timeout: 3000 });
      await swipe(page, -30);
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('app.palette')).toHaveCount(0);
      await at('agent:perf', 'under ⌘K the swipe does nothing');
      // a vertical scroll that drifts sideways is a scroll
      for (let i = 0; i < 12; i += 1) {
        await page.mouse.wheel(-12, 60);
        await page.waitForTimeout(16);
      }
      await page.waitForTimeout(400);
      await at('agent:perf', 'a scroll is never a swipe');
    });
  } finally {
    await s.close();
  }
});

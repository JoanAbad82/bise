// scheduled/screens · designer's desktop-screens v6 (m_11837): the scheduled screen (every project's
// live tasks, soonest first) and one task in its 400 px pane, light and dark, at 1400 and 800 wide
// (under 1000 the task replaces the list, with '‹ scheduled'), for designer's sign-off. Passes when
// the rows show ('deploy-watch · storefront', 'every 5m'), nothing leaves the window, and the pane
// says the task's words. The scripted core (FakeCore) sends amb-feed's typed HubEv scheduled; fake
// data. Owner: amb-kit.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const SHOP = 'shop-1a2b3c4d';
const ACME = 'acme-5e6f7a8b';
const M = 60_000;

/** A daily 07:30 task's next run: today's 07:30 if still ahead, else tomorrow's (designer m_12105). */
function next0730(now: number): number {
  const d = new Date(now);
  d.setHours(7, 30, 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
}

function world(now: number, theme: 'light' | 'dark') {
  return [
    { ev: 'prefs', prefs: { onboarded: true, theme } },
    {
      ev: 'projects',
      projects: [
        { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
        { project: SHOP, name: 'storefront', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 3, working: 1, waits: 0, running: true },
        { project: ACME, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 2, agents: 2, working: 0, waits: 0, running: true },
      ],
    },
    {
      ev: 'scheduled', project: SHOP, items: [
        { id: 4, agent: 'deploy-watch', by: 'main', words: 'check the deploy of the storefront: if the error rate is over 1% or a check is red, tell me with the failing step', every: '5m', times: 24, done: 6, next_ms: now + 3 * M },
        { id: 7, agent: 'perf', by: 'perf', words: 'rerun the product page bench and update the page', every: '1h', done: 3, next_ms: now + 41 * M, page: 'product-page' },
      ],
    },
    {
      ev: 'scheduled', project: ACME, items: [
        { id: 2, agent: 'main', by: 'you', words: 'the morning page: what changed overnight and what waits on me', every: 'day 07:30', done: 12, next_ms: next0730(now) },
        { id: 9, agent: 'api', by: 'main', words: 'watch the checkout PR until its checks are green', every: '10m', times: 6, done: 2, next_ms: now + 8 * M, until_ms: now + 2 * 60 * M },
      ],
    },
  ];
}

test('scheduled/screens: the list and one task, light and dark, 1400 and 800', async () => {
  test.setTimeout(180_000);
  const now = Date.now();
  const core = new FakeCore(world(now, 'light') as never);
  const s = await launchDesktop({ core, route: 'scheduled' });
  try {
    const { page } = s;
    await expect(page.getByTestId('scheduled.screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('scheduled.row.4')).toBeVisible({ timeout: 5000 });
    expect(await page.getByTestId('scheduled.row.4').textContent()).toContain('deploy-watch · storefront');
    expect(await page.getByTestId('scheduled.count').textContent()).toBe('active · 4');
    const win = await s.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0]?.id ?? -1);
    const size = async (w: number) => {
      await s.app.evaluate(({ BrowserWindow }, [id, w2]) => BrowserWindow.fromId(id ?? -1)?.setContentSize(w2 ?? 0, 820), [win, w]);
      await expect.poll(() => page.evaluate(() => window.innerWidth), { timeout: 5000 }).toBe(w);
      await page.waitForTimeout(150);
    };
    const theme = async (t: 'light' | 'dark') => {
      await core.send({ ev: 'prefs', prefs: { onboarded: true, theme: t } } as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      await page.waitForTimeout(200);
    };
    const inside = () => page.evaluate(() => {
      const out: string[] = [];
      for (const e of Array.from(document.querySelectorAll<HTMLElement>('[data-testid^="scheduled."]'))) {
        const r = e.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > window.innerWidth + 1 || r.left < -1) out.push(`${e.dataset['testid'] ?? ''} leaves the window`);
      }
      return out;
    });
    for (const t of ['light', 'dark'] as const) {
      await theme(t);
      for (const w of [1400, 800]) {
        await size(w);
        expect.soft(await inside(), `list ${t} ${String(w)}: nothing leaves the window`).toEqual([]);
        // the next-run column has room for 'tomorrow 07:30', and 'how often' is the rhythm alone
        // ('wakes' may end in '…' at 800, as signed; 'how often' and 'next run' never)
        const cut = await page.locator('.sch-row:not(.sch-cols) > :nth-child(3), .sch-row:not(.sch-cols) > .sch-next').evaluateAll((els) =>
          els.filter((e) => e.getClientRects().length > 0 && e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
        expect.soft(cut, `list ${t} ${String(w)}: no cut words in the columns`).toEqual([]);
        await page.screenshot({ path: test.info().outputPath(`list-${t}-${String(w)}.png`) });
      }
    }
    // one task: ⏎ on the first (soonest) row opens its pane
    await page.getByTestId('scheduled.screen').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('scheduled.pane')).toBeVisible({ timeout: 5000 });
    expect(await page.getByTestId('scheduled.pane.words').textContent()).toContain('check the deploy of the storefront');
    for (const t of ['light', 'dark'] as const) {
      await theme(t);
      for (const w of [1400, 800]) {
        await size(w);
        expect.soft(await inside(), `task ${t} ${String(w)}: nothing leaves the window`).toEqual([]);
        // under 1000 the pane replaces the list
        expect.soft(await page.getByTestId('scheduled.list').isVisible(), `task ${t} ${String(w)}: the list ${w >= 1000 ? 'stays' : 'gives way'}`).toBe(w >= 1000);
        await page.screenshot({ path: test.info().outputPath(`task-${t}-${String(w)}.png`) });
      }
    }
    // stop asks in place
    await page.getByTestId('scheduled.stop').click();
    await expect(page.getByTestId('scheduled.ask')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: test.info().outputPath('task-stop-dark-800.png') });
  } finally {
    await s.close();
  }
});

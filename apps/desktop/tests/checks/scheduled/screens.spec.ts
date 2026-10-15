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
        // names as sched-names gives them (amb-win's same 3 fixture names; id 9 stays nameless: the fallback)
        { id: 4, name: 'deploy watch', agent: 'deploy-watch', by: 'main', words: 'check the deploy of the storefront: if the error rate is over 1% or a check is red, tell me with the failing step', every: '5m', times: 24, done: 6, next_ms: now + 3 * M },
        { id: 7, name: 'bench rerun', agent: 'perf', by: 'perf', words: 'rerun the product page bench and update the page', every: '1h', done: 3, next_ms: now + 41 * M, page: 'product-page' },
      ],
    },
    {
      ev: 'scheduled', project: ACME, items: [
        { id: 2, name: 'morning page', agent: 'main', by: 'you', words: 'the morning page: what changed overnight and what waits on me', every: 'day 07:30', done: 12, next_ms: next0730(now) },
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
      for (const w of [1400, 1100, 800]) {
        await size(w);
        expect.soft(await inside(), `task ${t} ${String(w)}: nothing leaves the window`).toEqual([]);
        // under 1000 the pane replaces the list
        expect.soft(await page.getByTestId('scheduled.list').isVisible(), `task ${t} ${String(w)}: the list ${w >= 1000 ? 'stays' : 'gives way'}`).toBe(w >= 1000);
        if (w >= 1000) {
          // qa-native m_16020 (f5ff0e72, 1100 with a task open): the names stay on screen, the other
          // columns give way first: 'how often', then 'next run', then 'wakes' (designer m_16028)
          const rows = await page.locator('.sch-row:not(.sch-cols)').evaluateAll((els) => {
            const list = document.querySelector('[data-testid="scheduled.list"]')?.getBoundingClientRect();
            return els.map((row) => {
              const kids = Array.from(row.children) as HTMLElement[];
              const on = kids.map((k) => k.getClientRects().length > 0);
              const r = kids[0]?.getBoundingClientRect();
              const name = !!r && !!list && on[0] === true && r.width >= 120 && r.left >= list.left - 1 && r.right <= list.right + 1;
              return { name, wakes: on[1] === true, often: on[2] === true, next: on[3] === true };
            });
          });
          expect.soft(rows.length, `task ${t} ${String(w)}: the list has its rows`).toBe(4);
          expect.soft(rows.filter((r) => !r.name).length, `task ${t} ${String(w)}: every name is on screen, 120 px at least`).toBe(0);
          expect.soft(rows.filter((r) => (r.often && !r.next) || (r.next && !r.wakes)).length, `task ${t} ${String(w)}: drop order how often > next run > wakes`).toBe(0);
          if (w === 1100) expect.soft(rows.some((r) => r.often), `task ${t} 1100: 'how often' is the first to go`).toBe(false);
        }
        await page.screenshot({ path: test.info().outputPath(`task-${t}-${String(w)}.png`) });
      }
    }
    // stop asks in place
    await page.getByTestId('scheduled.stop').click();
    await expect(page.getByTestId('scheduled.ask')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: test.info().outputPath('task-stop-dark-800.png') });
    await page.getByTestId('scheduled.ask.keep').click();
    await expect(page.getByTestId('scheduled.ask'), "'keep' puts the act back").toHaveCount(0);

    // designer m_15929: the opened head is its name with who it wakes dim, never '#4'; 'stop' with a dim 'x'
    await size(1400);
    await expect(page.getByTestId('scheduled.pane.title')).toHaveText('deploy watchdeploy-watch · storefront');
    await expect(page.getByTestId('scheduled.stop')).toHaveText('stop x');

    // the right bar's SCHEDULED section on storefront's thread (it replaced panel A's 'scheduled
    // here', amb-win f35dfb09), and a ⌘K hit on a task's name, each light and dark
    await page.getByTestId(`app.sidebar.project.${SHOP}`).click();
    const here = page.getByTestId('app.panel');
    await expect(here, "storefront's right bar lists its tasks").toBeVisible({ timeout: 5000 });
    await expect(here).toContainText('deploy watch');
    for (const t of ['light', 'dark'] as const) {
      await theme(t);
      await page.screenshot({ path: test.info().outputPath(`here-${t}-1400.png`) });
    }
    await page.keyboard.press('Meta+K');
    await expect(page.getByTestId('app.palette')).toBeVisible({ timeout: 3000 });
    await page.keyboard.type('deploy watch');
    await expect(page.getByTestId('app.palette'), 'the task is found by its name').toContainText('deploy watch', { timeout: 3000 });
    for (const t of ['light', 'dark'] as const) {
      await theme(t);
      await page.screenshot({ path: test.info().outputPath(`palette-${t}-1400.png`) });
    }
  } finally {
    await s.close();
  }
});

// sb-words (Benjamin's feedback, Gabriel's « Ouais grave »): the empty list says what to do in plain
// words, never the sb command agents run; light and dark at 1400 for designer's sign-off.
test('scheduled/screens: the empty list asks him in plain words, no sb command', async () => {
  const core = new FakeCore(world(Date.now(), 'light').filter((e) => e.ev !== 'scheduled').concat([{ ev: 'scheduled', project: SHOP, items: [] }, { ev: 'scheduled', project: ACME, items: [] }] as never) as never);
  const s = await launchDesktop({ core, route: 'scheduled', size: '1400x820' });
  try {
    const { page } = s;
    const empty = page.getByTestId('scheduled.empty');
    await expect(empty).toBeVisible({ timeout: 10_000 });
    await expect(empty).toHaveText('nothing scheduled. ask an agent to “check the build every 5m” and it shows here.');
    for (const t of ['light', 'dark'] as const) {
      await core.send({ ev: 'prefs', prefs: { onboarded: true, theme: t } } as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      await page.waitForTimeout(200);
      await page.screenshot({ path: test.info().outputPath(`empty-${t}-1400.png`) });
    }
  } finally {
    await s.close();
  }
});

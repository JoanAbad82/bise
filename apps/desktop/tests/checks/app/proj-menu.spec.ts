// app/proj-menu · a project row's ⋯ menu lists its agents by priority (his m_26450: « les agents
// actifs, les agents non archivés, et les agents archivés en dessous, par ordre de priorité »).
// On the real shell with the scripted core (FakeCore, a fake world). Passes when the menu reads,
// top to bottom: 'all agents', then the 'active' head with what asks him first ('?', 'waits' in the accent)
// then what works, newest first; the 'quiet' head with the other live ones (idle, blocked,
// done, waiting on another agent; main left out); each row the right bar's mark, its end sans; the 'archived' head with the newest 5 and
// '+ 3 more'; a row opens its thread, '+ 3 more' opens /archived, 'all agents' /agents.
// Shots: proj-menu-{light,dark}-{1400,800}.png, the menu open, -end.png scrolled to its end, for designer's sign. Owner: proj-menu.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string, status: string, ago: number, over: Record<string, unknown> = {}) => ({
  name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - ago * MIN, waits: 0, ...over,
});
const AGENTS = [
  ag('main', 'idle', 30),
  ag('perf', 'working', 12),
  ag('search', 'working', 3),
  ag('checkout', 'blocked', 40),
  ag('copy', 'working', 20, { waits: 1 }),
  ag('docs', 'done', 90),
  ag('seo', 'idle', 5),
  ag('lint', 'idle', 50, { waiting_on: { who: 'agent', name: 'perf' } }),
  ...Array.from({ length: 8 }, (_, i) => ag(`old-${String(i)}`, i % 2 === 0 ? 'done' : 'idle', 600 * (i + 1), { archived: true })),
];
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 8, working: 3, waits: 1, running: true },
    ],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: HOME, agents: [ag('main', 'idle', 1)] },
  { ev: 'agents', project: P, agents: AGENTS },
  { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
];

const MENU = `app.sidebar.project.${P}.menu`;

/** The menu's rows, top to bottom (DOM order), by test id. */
const read = (page: Page) =>
  page
    .getByTestId(`${MENU}.list`)
    .locator(`[data-testid^="${MENU}."]`)
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-testid') ?? '').filter((s) => !s.endsWith('.mark')));

async function open(page: Page): Promise<void> {
  await page.getByTestId(`app.sidebar.project.${P}`).hover();
  await page.getByTestId(MENU).click();
  await expect(page.getByTestId(`${MENU}.list`)).toBeVisible();
}

for (const size of ['1400x860', '800x640']) {
  test(`app/proj-menu: active, quiet, archived, by priority (${size})`, async () => {
    const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `agent/${P}/perf`, size });
    try {
      const { page } = s;
      await expect(page.getByTestId(`app.sidebar.project.${P}`)).toBeVisible({ timeout: 10_000 });
      await open(page);

      const rows = await read(page);
      expect(rows, 'the rows in priority order').toEqual([
        `${MENU}.agents`,
        `${MENU}.active.copy`, `${MENU}.active.search`, `${MENU}.active.perf`,
        `${MENU}.quiet.seo`, `${MENU}.quiet.checkout`, `${MENU}.quiet.lint`, `${MENU}.quiet.docs`,
        `${MENU}.archived.old-0`, `${MENU}.archived.old-1`, `${MENU}.archived.old-2`, `${MENU}.archived.old-3`, `${MENU}.archived.old-4`,
        `${MENU}.archived.more`,
      ]);
      const list = page.getByTestId(`${MENU}.list`);
      for (const head of ['active', 'quiet', 'archived']) await expect(list.getByText(head, { exact: true })).toBeVisible();
      // the heads sit above their rows: active < first active row, quiet < first quiet row…
      const top = async (loc: ReturnType<Page['getByTestId']>) => (await loc.boundingBox())?.y ?? -1;
      expect(await top(list.getByText('active', { exact: true }))).toBeLessThan(await top(page.getByTestId(`${MENU}.active.copy`)));
      expect(await top(list.getByText('quiet', { exact: true }))).toBeGreaterThan(await top(page.getByTestId(`${MENU}.active.perf`)));
      expect(await top(list.getByText('quiet', { exact: true }))).toBeLessThan(await top(page.getByTestId(`${MENU}.quiet.seo`)));
      expect(await top(list.getByText('archived', { exact: true }))).toBeGreaterThan(await top(page.getByTestId(`${MENU}.quiet.docs`)));
      // every row wears the right bar's mark (one source): the menu's mark is the bar's for each live agent
      for (const [head, name] of [['active', 'copy'], ['active', 'search'], ['active', 'perf'], ['quiet', 'seo'], ['quiet', 'checkout'], ['quiet', 'lint'], ['quiet', 'docs']]) {
        // the bar draws '∿' as the ds Dot (no text): it is checked by its own row below
        const bar = (await page.getByTestId(`app.right.agent.${name}.sign`).innerText()).trim();
        const mark = (await page.getByTestId(`${MENU}.${head}.${name}.mark`).innerText()).trim();
        if (bar !== '') expect(mark, `${name}: the bar's mark`).toBe(bar);
      }
      await expect(page.getByTestId(`${MENU}.active.copy.mark`)).toHaveText('?');
      await expect(page.getByTestId(`${MENU}.active.search.mark`)).toHaveText('∿');
      await expect(page.getByTestId(`${MENU}.quiet.checkout.mark`)).toHaveText('…');
      await expect(page.getByTestId(`${MENU}.quiet.seo.mark`)).toHaveText('○');
      await expect(page.getByTestId(`${MENU}.quiet.docs.mark`)).toHaveText('✓');
      await expect(page.getByTestId(`${MENU}.archived.old-0.mark`)).toHaveText('✓');
      await expect(page.getByTestId(`${MENU}.archived.old-1.mark`)).toHaveText('–');
      // the ends: words, sans; 'waits' in the accent beside its '?'
      await expect(page.getByTestId(`${MENU}.active.copy`)).toContainText('waits');
      await expect(page.getByTestId(`${MENU}.quiet.checkout`)).toContainText('blocked');
      await expect(page.getByTestId(`${MENU}.quiet.lint`)).toContainText('waiting on perf');
      await expect(page.getByTestId(`${MENU}.archived.old-0`)).toContainText('10 h');
      const end = (sel: string) => page.getByTestId(sel).locator('.app-pm-end').evaluate((el) => ({ font: getComputedStyle(el).fontFamily, color: getComputedStyle(el).color }));
      const waits = await end(`${MENU}.active.copy`);
      const quiet = await end(`${MENU}.active.search`);
      expect(waits.font, 'the ends are sans').not.toMatch(/mono/iu);
      expect(waits.color, "'waits' in the accent").not.toBe(quiet.color);
      // main is left out: the project row opens it
      await expect(page.locator(`[data-testid$=".main"][data-testid^="${MENU}."]`)).toHaveCount(0);
      await expect(page.getByTestId(`${MENU}.archived.more`)).toHaveText(/\+ 3 more/u);

      const w = size.split('x')[0];
      await page.waitForTimeout(200);
      await page.screenshot({ path: test.info().outputPath(`proj-menu-light-${w}.png`) });
      await core.send(prefs('dark') as never);
      await page.waitForTimeout(350);
      await page.screenshot({ path: test.info().outputPath(`proj-menu-dark-${w}.png`) });
      // scrolled to its end: the archived head, its 5 and '+ 3 more'
      await page.getByTestId(`${MENU}.archived.more`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await page.screenshot({ path: test.info().outputPath(`proj-menu-dark-${w}-end.png`) });
      await core.send(prefs('light') as never);

      // picks: a row opens its thread, '+ 3 more' /archived, 'all agents' /agents
      await page.getByTestId(`${MENU}.quiet.checkout`).click();
      await expect(page.getByTestId(`${MENU}.list`)).toHaveCount(0);
      await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'checkout');
      await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-project', P);
      await open(page);
      await page.getByTestId(`${MENU}.archived.more`).scrollIntoViewIfNeeded();
      await page.getByTestId(`${MENU}.archived.more`).click();
      await expect(page.getByTestId('agents.screen')).toHaveAttribute('data-archived', 'true');
      await open(page);
      await page.getByTestId(`${MENU}.agents`).click();
      await expect(page.getByTestId('agents.screen')).not.toHaveAttribute('data-archived', 'true');
    } finally {
      await s.close();
      core.dispose();
    }
  });
}

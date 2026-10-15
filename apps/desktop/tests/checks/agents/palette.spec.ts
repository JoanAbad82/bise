// agents/palette · ⌘K, one search (designer's signed block s-k, desktop-screens v7; lead m_11844,
// m_11864): over the window, every agent of every project, archived ones too, the artifacts and the
// scheduled tasks, grouped, keyboard first; the composer keeps its draft. No query: 'recent'. A
// query: agents (archived last), artifacts, scheduled; tab cycles the scope; ⏎ opens; ⌘⏎ restores
// an archived agent then opens it; a sentence (main m_12973): 'ask bise' first, ⏎ asks, ↓⏎ opens
// the agent it names; two words naming nothing: '⏎ ask bise' sends the words to bise. Shots light
// and dark, 1400 and 800 wide, for designer's sign-off. Owner: amb-web; the palette is
// src/app/Palette.tsx in amb-win's shell. The new app on the scripted core's fixture world: bise's
// home (main) and acme (main, perf working, old-fix archived, the artifact 'Perf notes').
import type { Page } from '@playwright/test';
import type { BrowserWindow } from 'electron';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const ACME = 'acme-1a2b3c4d';
const HOME = 'bise-home-00000000';
const T = {
  palette: '[data-testid="app.palette"]',
  field: '[data-testid="app.palette.field"]',
  item: (k: number) => `[data-testid="app.palette.item.${String(k)}"]`,
  items: '[data-testid^="app.palette.item."]',
  group: (g: string) => `[data-testid="app.palette.group.${g}"]`,
  scope: (s: string) => `[data-testid="app.palette.scope.${s}"]`,
  keys: '[data-testid="app.palette.keys"]',
  none: '[data-testid="app.palette.none"]',
  thread: '[data-testid="thread.screen"]',
  composer: '[data-testid="composer.field"]',
};

const prefs = (theme: string) => ({
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
});

async function openK(page: Page): Promise<void> {
  await page.keyboard.press('Meta+K');
  await expect(page.locator(T.palette), '⌘K opens the search').toBeVisible({ timeout: 3000 });
  await expect(page.locator(T.field), 'its field has the focus').toBeFocused();
}

test('agents/palette: ⌘K searches agents (archived too), artifacts, scheduled; scopes, ⏎, ⌘⏎ restore, ask bise', async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${HOME}/main` });
  try {
    const { page } = s;
    const win = await s.app.browserWindow(page);
    await win.evaluate((w: BrowserWindow) => {
      w.setSize(1400, 900);
    });
    await expect.poll(() => page.evaluate(() => window.innerWidth), { timeout: 3000 }).toBe(1400);
    const thread = page.locator(T.thread);
    await expect(thread).toHaveAttribute('data-project', HOME, { timeout: 10_000 });
    // a draft in the composer: the search has its own field and leaves it alone
    await page.locator(T.composer).click();
    await page.keyboard.type('half a thought');
    await openK(page);
    // no query: recent, acme's perf from bise's thread
    await expect(page.locator(T.group('recent'))).toBeVisible();
    expect((await page.locator(T.items).allTextContents()).some((t) => t.includes('perf')), 'acme’s perf is in recent').toBe(true);
    await expect(page.locator(T.keys)).toHaveText('↑↓ choose   ⏎ open   tab all · agents · artifacts · scheduled   esc close');
    await page.keyboard.press('Escape');
    await expect(page.locator(T.palette)).toBeHidden({ timeout: 2000 });
    await expect(page.locator(T.composer), 'the composer kept its draft').toContainText('half a thought');

    // 'perf': the agent, and the artifact 'Perf notes'; tab keeps the agents only
    await openK(page);
    await page.keyboard.type('perf');
    await expect(page.locator(T.item(0)), "'perf' finds perf first").toContainText('perf');
    await expect(page.locator(`${T.item(0)} .mt`), 'the match is marked').toHaveText('perf');
    await expect(page.locator(`${T.item(0)} .hint`), 'perf waits on him (the fixture’s card): ⏎ answers').toHaveText('⏎ answer');
    await expect(page.locator(T.group('artifacts')), 'artifacts are searched').toContainText('Perf notes');
    await page.screenshot({ path: test.info().outputPath('light-1400-query.png') });
    // a reload (or a relaunch) gives back ⌘K open with his query (lead m_11997, keep.ts)
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.locator(T.palette), '⌘K is still open after a reload').toBeVisible({ timeout: 10_000 });
    await expect(page.locator(T.field), 'with his query').toHaveValue('perf');
    await expect(page.locator(T.item(0)), "'perf' finds perf again").toContainText('perf', { timeout: 10_000 });
    await page.keyboard.press('Tab');
    await expect(page.locator(T.scope('agents'))).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator(T.group('artifacts')), 'tab: agents only').toHaveCount(0);
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator(T.group('artifacts')), 'shift+tab: all again').toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator(T.palette)).toBeHidden({ timeout: 2000 });
    await expect(thread, '⏎ opened perf').toHaveAttribute('data-agent', 'perf', { timeout: 5000 });
    await expect(thread).toHaveAttribute('data-project', ACME);

    // 'old': the archived old-fix, its hint and key line; ⌘⏎ restores it, then opens it
    await openK(page);
    await page.keyboard.type('old');
    await expect(page.locator(T.item(0))).toContainText('old-fix');
    await expect(page.locator(T.item(0))).toHaveAttribute('data-archived', 'true');
    await expect(page.locator(T.item(0)), 'archived · its title').toContainText('archived');
    await expect(page.locator(`${T.item(0)} .hint`)).toHaveText('⏎ open   ⌘⏎ restore');
    await expect(page.locator(T.keys)).toHaveText('↑↓ choose   ⏎ open   ⌘⏎ restore   tab agents only   esc close');
    await page.screenshot({ path: test.info().outputPath('light-1400-archived.png') });
    await page.keyboard.press('Meta+Enter');
    await core.waitCmd((c) => c.cmd === 'unarchive' && 'project' in c && c.project === ACME && 'agent' in c && c.agent === 'old-fix');
    await expect(thread, '⌘⏎ opened old-fix').toHaveAttribute('data-agent', 'old-fix', { timeout: 5000 });

    // a sentence (main m_12973, the spotlight's rule): 'ask bise' is the first row and ⏎ asks;
    // the agent it names sits one row down, ↓⏎ opens it
    await openK(page);
    await page.keyboard.type('why is perf so slow today');
    await expect(page.locator(T.item(0)), 'a sentence: ask bise first').toHaveAttribute('data-kind', 'ask');
    await expect(page.locator(T.item(0))).toContainText('ask bise “why is perf so slow today”');
    await expect(page.locator(`${T.item(0)} .hint`)).toHaveText('⏎ ask');
    await expect(page.locator(T.item(1)), 'the agent it names, one row down').toContainText('perf');
    await expect(page.locator(T.keys)).toHaveText('↑↓ choose   ⏎ ask bise   esc close');
    await page.screenshot({ path: test.info().outputPath('light-1400-sentence.png') });
    await page.keyboard.press('ArrowDown');
    await expect(page.locator(T.item(1))).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');
    await expect(page.locator(T.palette)).toBeHidden({ timeout: 2000 });
    await expect(thread, '↓⏎ opened perf').toHaveAttribute('data-agent', 'perf', { timeout: 5000 });
    await openK(page);
    await page.keyboard.type('why is perf so slow today');
    await expect(page.locator(T.item(0))).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');
    await core.waitCmd((c) => c.cmd === 'send' && 'project' in c && c.project === HOME && 'text' in c && c.text === 'why is perf so slow today');
    await expect(page.locator(T.palette)).toBeHidden({ timeout: 2000 });
    await expect(thread, '⏎ asked bise: its thread').toHaveAttribute('data-project', HOME, { timeout: 5000 });

    // two words that name nothing: the words, and ⏎ asks bise
    await openK(page);
    await page.keyboard.type('stripe webhook');
    await expect(page.locator(T.none)).toContainText('nothing matches “stripe webhook”. archived agents, artifacts and scheduled tasks were searched too.');
    await expect(page.locator(T.none)).toContainText('ask bise “stripe webhook”');
    await expect(page.locator(T.keys)).toHaveText('⏎ ask bise   esc close');
    await page.screenshot({ path: test.info().outputPath('light-1400-none.png') });
    await page.keyboard.press('Enter');
    await core.waitCmd((c) => c.cmd === 'send' && 'project' in c && c.project === HOME && 'text' in c && c.text === 'stripe webhook');
    await expect(page.locator(T.palette)).toBeHidden({ timeout: 2000 });
    await expect(thread).toHaveAttribute('data-project', HOME, { timeout: 5000 });

    // dark: the same panel
    await core.send(prefs('dark') as never);
    await openK(page);
    await page.screenshot({ path: test.info().outputPath('dark-1400-start.png') });
    await page.keyboard.type('perf');
    await page.screenshot({ path: test.info().outputPath('dark-1400-query.png') });
    await page.keyboard.press('Escape');
  } finally {
    await s.close();
    core.dispose();
  }
});

test('agents/palette at 800 px: the same panel, the project column drops', async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${HOME}/main` });
  try {
    const { page } = s;
    const win = await s.app.browserWindow(page);
    await win.evaluate((w: BrowserWindow) => {
      w.setMinimumSize(400, 300);
      w.setSize(800, 700);
    });
    await expect.poll(() => page.evaluate(() => window.innerWidth), { timeout: 3000 }).toBe(800);
    await expect(page.locator(T.thread)).toHaveAttribute('data-project', HOME, { timeout: 10_000 });
    await openK(page);
    await page.keyboard.type('perf');
    await expect(page.locator(T.item(0))).toContainText('perf');
    const box = await page.locator('.app-k').boundingBox();
    expect(box?.width ?? 0, 'the panel is the window less 40 px').toBeLessThanOrEqual(760 + 1);
    await expect(page.locator(`${T.item(0)} .pj`), 'no project column').toBeHidden();
    await page.screenshot({ path: test.info().outputPath('light-800-query.png') });
    await core.send(prefs('dark') as never);
    await page.screenshot({ path: test.info().outputPath('dark-800-query.png') });
  } finally {
    await s.close();
    core.dispose();
  }
});

// ⌘K finds the app's pages by name (ambient-lead m_21499, designer m_21505): a 'pages' group after the
// agents, only with a query; 'settings › keys' with its parent dim, 'changes · acme' with its project
// dim, the page's key at the right; ⏎ opens it as its key does. Shot for designer: 1100 light, 'set'.
test('agents/palette: pages by name, after the agents; ⏎ opens one like its key', async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `project/${ACME}` });
  try {
    const { page } = s;
    const win = await s.app.browserWindow(page);
    await win.evaluate((w: BrowserWindow) => {
      w.setSize(1100, 720);
    });
    await expect.poll(() => page.evaluate(() => window.innerWidth), { timeout: 3000 }).toBe(1100);
    await expect(page.locator(T.thread)).toHaveAttribute('data-project', ACME, { timeout: 10_000 });
    await openK(page);
    await expect(page.locator(T.group('pages')), 'no pages with no query').toHaveCount(0);
    await page.keyboard.type('set');
    const pages = page.locator(T.group('pages'));
    await expect(pages, "'set' finds pages").toBeVisible();
    await expect(pages.locator('[data-kind="page"]').first(), 'settings first, its key at the right').toContainText('settings');
    await expect(pages.locator('[data-kind="page"]').first().locator('kbd')).toHaveText('⌘,');
    await expect(pages.locator('[data-kind="page"]').filter({ hasText: 'settings › setup' }), 'a settings page, its parent first').toHaveCount(1);
    const order = await page.locator('[data-testid^="app.palette.group."]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));
    const at = (g: string) => order.indexOf(`app.palette.group.${g}`);
    if (at('agents') >= 0) expect(at('agents'), 'pages after the agents').toBeLessThan(at('pages'));
    if (at('artifacts') >= 0) expect(at('pages'), 'pages before the artifacts').toBeLessThan(at('artifacts'));
    await page.screenshot({ path: test.info().outputPath('light-1100-pages-set.png') });

    // a project's page reads 'changes · acme', the project in view first, ⌘D from its main
    await page.locator(T.field).fill('changes');
    const changes = pages.locator('[data-kind="page"]').first();
    await expect(changes).toContainText('changes · acme');
    await expect(changes.locator('kbd')).toHaveText('⌘D');
    await page.screenshot({ path: test.info().outputPath('light-1100-pages-changes.png') });

    // ⏎ on a settings page opens it
    await page.locator(T.field).fill('quiet');
    await expect(page.locator(T.item(0)), 'quiet moments first').toContainText('settings › quiet moments');
    await page.keyboard.press('Enter');
    await expect(page.locator(T.palette)).toBeHidden({ timeout: 2000 });
    await expect(page.getByTestId('settings.root'), 'the settings page opened').toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('settings.root')).toContainText('when notifications wait');

    // ⏎ on help opens the key list over the screen, as ⌘/ does
    await openK(page);
    await page.keyboard.type('help');
    await expect(page.locator(T.item(0))).toContainText('help');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('help.overlay'), 'the key list').toBeVisible({ timeout: 3000 });
  } finally {
    await s.close();
    core.dispose();
  }
});

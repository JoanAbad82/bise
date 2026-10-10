// artifacts/archived · archived artifacts leave the list (art-archive's archived_at, the TUI's
// artifacts screen; ambient-lead m_16884). Passes when, on the scripted core (FakeCore, fake data):
//   - the artifacts screen lists the live ones only, then a faint '2 archived' row; the keys line
//     says 'a archived';
//   - a shows the archived ones alone ('artifacts · archived', 'esc back to the list'); esc goes
//     back; a click on the row does the same as a;
//   - panel A on storefront's thread: its live one, the faint '2 archived' row; a click shows them
//     under the others.
// Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const SHOP = 'shop-1a2b3c4d';
const H = 3600_000;

const world = (now: number) => {
  const art = (id: string, title: string, ago: number, extra: object = {}) => ({ id, kind: 'page', title, agent: 'perf', version: 1, at_ms: now - ago, url: `http://127.0.0.1:9/p/${id}`, new: false, ...extra });
  return [
    { ev: 'prefs', prefs: { onboarded: true, theme: 'light' } },
    {
      ev: 'projects',
      projects: [
        { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
        { project: SHOP, name: 'storefront', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true },
      ],
    },
    { ev: 'welcome', project: SHOP, proto: 1, workspace: '/nowhere/shop', name: 'storefront' },
    { ev: 'agents', project: SHOP, agents: [{ name: 'main', dir: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: now - H, waits: 0 }] },
    {
      ev: 'artifacts',
      project: SHOP,
      items: [
        art('before-after', 'product page, before / after', H),
        art('old-deck', 'launch deck, first cut', 30 * H, { archived_at: now - 2 * H }),
        art('old-notes', 'bench notes', 50 * H, { archived_at: now - 3 * H }),
      ],
    },
    { ev: 'thread', project: SHOP, agent: 'main', entries: [{ pos: 1, at_ms: now - H, kind: 'agent', text: 'perf made the before / after page.' }], before: null, more: false },
  ];
};

test("artifacts/archived: archived ones behind a faint 'N archived' row, a shows them, esc goes back; panel A too", async () => {
  test.setTimeout(90_000);
  const now = Date.now();
  const core = new FakeCore(world(now) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'artifacts', size: '1400x900' });
  try {
    const { page } = s;
    const rows = () => page.getByTestId('artifacts.list').locator('[role=option]');
    await expect(rows()).toHaveCount(1, { timeout: 10_000 });
    await expect(page.getByTestId('artifacts.list.row.before-after')).toBeVisible();
    await expect(page.getByTestId('artifacts.archived')).toHaveText('2 archived');
    await expect(page.getByTestId('artifacts.keys')).toContainText('a archived');
    await page.screenshot({ path: test.info().outputPath('archived-row-light.png') });
    await core.send({ ev: 'prefs', prefs: { onboarded: true, theme: 'dark' } } as never);
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe('dark');
    await page.screenshot({ path: test.info().outputPath('archived-row-dark.png') });
    await core.send({ ev: 'prefs', prefs: { onboarded: true, theme: 'light' } } as never);
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe('light');

    await page.getByTestId('artifacts.list').focus();
    await page.keyboard.press('a');
    await expect(page.getByTestId('artifacts.screen').locator('.art-h1')).toHaveText('artifacts · archived');
    await expect(rows()).toHaveCount(2);
    await expect(page.getByTestId('artifacts.list.row.old-deck')).toBeVisible();
    await expect(page.getByTestId('artifacts.keys')).toContainText('esc back to the list');
    await page.screenshot({ path: test.info().outputPath('archived-view.png') });
    await page.keyboard.press('Escape');
    await expect(rows()).toHaveCount(1);
    await page.getByTestId('artifacts.archived').click();
    await expect(rows()).toHaveCount(2);
    await page.keyboard.press('Escape');

    // panel A on storefront's thread
    await page.getByTestId(`app.sidebar.project.${SHOP}`).click();
    const panel = page.getByTestId('artifacts.panel');
    await expect(panel.locator('[role=option]')).toHaveCount(1, { timeout: 5000 });
    await expect(page.getByTestId('artifacts.panel.archived')).toHaveText('2 archived');
    await page.getByTestId('artifacts.panel.archived').click();
    await expect(panel.locator('[role=option]')).toHaveCount(3);
    await expect(page.getByTestId('artifacts.panel.archived')).toHaveText('hide the archived ones');
  } finally {
    await s.close();
    core.dispose();
  }
});

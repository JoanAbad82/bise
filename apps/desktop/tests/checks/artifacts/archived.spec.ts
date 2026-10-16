// artifacts/archived · archived artifacts leave the list (art-archive's archived_at, the TUI's
// artifacts screen; ambient-lead m_16884). Passes when, on the scripted core (FakeCore, fake data):
//   - the artifacts screen lists the live ones only, then a faint '2 archived' row; the keys line
//     says 'a archived';
//   - a shows the archived ones alone ('artifacts · archived', 'esc back to the list'); esc goes
//     back; a click on the row does the same as a;
//   - the right bar on storefront's thread (it took panel A's place): its ARTIFACTS section lists the
//     live one only.
// Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { panel } from '../../../src/proto/words_panel.gen';

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
    await expect(page.getByTestId('artifacts.archived')).toHaveText(panel.archived_count({ n: 2 }));
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

    // the right bar on storefront's thread (it took panel A's place, designer's desktop-right-bar
    // v5): its ARTIFACTS section lists the live ones only; the archived wait on the artifacts screen
    await page.getByTestId(`app.sidebar.project.${SHOP}`).click();
    const section = page.getByTestId('app.right.artifacts');
    // its rows only (app.right.artifact.<project>.<id>), not their parts ('.sign', '.leaves': land-reds)
    const rowIds = () => section.locator('[data-testid^="app.right.artifact."]').evaluateAll((es) => es.map((e) => e.getAttribute('data-testid') ?? '').filter((t) => t.split('.').length === 5));
    await expect.poll(rowIds, { timeout: 5000 }).toEqual([`app.right.artifact.${SHOP}.before-after`]);
    await expect(section.getByTestId('app.right.artifacts.head')).toHaveText('ARTIFACTS · 1');
  } finally {
    await s.close();
    core.dispose();
  }
});

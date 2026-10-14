// artifacts/browser-only · his desktop feedback (main m_21706, ambient-lead m_21711, designer
// m_21714): a browser-only artifact (a PR, a link: no view in the window) opens his browser at
// once from any list; no empty 'opens in your browser' panel, no history entry. Passes when, on
// the scripted core (FakeCore, fake data; test mode: main prints 'bise-desktop: external <url>'):
//   - the artifacts screen: the PR row says '↗' in place of its kind, the page row 'page · v2';
//     ⏎ and space on the PR row print its url, the window stays on the list with the row selected;
//     ⏎ on the page row still opens it in the window;
//   - the right bar's PR row, the thread's PR chip (meta '↗') and its ⌘K row (detail '↗') do the same.
// Shot for designer's sign: 1100 light, the list with the PR row hovered. Owner: amb-web.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { Lines } from '../native/world';

const HOME = 'bise-home-00000000';
const SHOP = 'shop-1a2b3c4d';
const H = 3600_000;
const EXTERNAL = 'bise-desktop: external';
const PR = 'https://github.com/acme/shop/pull/381';

const world = (now: number) => [
  { ev: 'prefs', prefs: { onboarded: true, theme: 'light' } },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: SHOP, name: 'storefront', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: SHOP, proto: 1, workspace: '/nowhere/shop', name: 'storefront' },
  {
    ev: 'agents',
    project: SHOP,
    agents: [
      { name: 'main', dir: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: now - H, waits: 0 },
      { name: 'release', dir: 'release', main: false, status: 'done', archived: false, title: '', purpose: 'release ts-pattern on npm', since_ms: now - H, waits: 0 },
    ],
  },
  {
    ev: 'artifacts',
    project: SHOP,
    items: [
      { id: 'pr-381', kind: 'pr', title: 'PR #381 · release 5.6', agent: 'release', version: 1, at_ms: now - H, url: PR, new: false },
      { id: 'notes', kind: 'page', title: 'release notes', agent: 'release', version: 2, at_ms: now - 2 * H, url: 'http://127.0.0.1:9/p/notes', new: false },
    ],
  },
  {
    ev: 'thread',
    project: SHOP,
    agent: 'release',
    entries: [
      { pos: 1, at_ms: now - 2 * H, kind: 'agent', text: 'the PR is up.' },
      { pos: 2, at_ms: now - H, kind: 'artifact', text: 'PR #381 · release 5.6', made: { id: 'pr-381', agent: 'release', title: 'PR #381 · release 5.6', kind: 'pr', kind_word: 'PR', v: 1, url: PR } },
    ],
    before: null,
    more: false,
  },
  { ev: 'thread', project: SHOP, agent: 'main', entries: [{ pos: 1, at_ms: now - H, kind: 'agent', text: 'release opened the PR.' }], before: null, more: false },
];

test('artifacts/browser-only: a PR opens his browser from the list, space, the right bar, its chip and ⌘K; no panel', async () => {
  test.setTimeout(90_000);
  const now = Date.now();
  const core = new FakeCore(world(now) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'artifacts', size: '1100x800' });
  const out = new Lines();
  s.app.process().stdout?.setEncoding('utf8');
  s.app.process().stdout?.on('data', (d: string) => {
    out.push(d);
  });
  // the n-th external open printed: its url
  const opened = async (n: number) => {
    await expect.poll(() => out.of(EXTERNAL).length, { timeout: 5000, message: `external open #${String(n)}` }).toBe(n);
    return out.of(EXTERNAL)[n - 1] ?? '';
  };
  try {
    const { page } = s;
    const pr = page.getByTestId('artifacts.list.row.pr-381');
    const notes = page.getByTestId('artifacts.list.row.notes');
    await expect(pr, 'the PR row').toBeVisible({ timeout: 10_000 });
    await expect(pr.locator('.art-k'), "'↗' in place of its kind").toHaveText('↗');
    await expect(notes.locator('.art-k'), 'a page keeps its kind').toHaveText('page · v2');
    await pr.hover();
    await page.screenshot({ path: test.info().outputPath('light-1100-pr-hovered.png') });

    // ⏎ on the PR row: his browser, the list stays with the row selected
    await pr.click();
    await page.getByTestId('artifacts.list').focus();
    await page.keyboard.press('Enter');
    expect(await opened(1)).toContain(PR);
    await expect(page.getByTestId('artifact.open'), 'no panel').toHaveCount(0);
    await expect(page.getByTestId('artifacts.screen')).toBeVisible();
    await expect(pr).toHaveAttribute('aria-selected', 'true');
    // space (quick look) does the same
    await page.keyboard.press(' ');
    expect(await opened(2)).toContain(PR);
    await expect(page.getByTestId('artifact.open')).toHaveCount(0);
    // a double click too
    await pr.dblclick();
    expect(await opened(3)).toContain(PR);
    await expect(page.getByTestId('artifact.open')).toHaveCount(0);

    // a page still opens in the window
    await notes.dblclick();
    await expect(page.getByTestId('artifact.open'), 'the page opens in the window').toBeVisible();
    expect(out.of(EXTERNAL)).toHaveLength(3);

    // the release thread: its PR chip says '↗', a click opens his browser, the thread stays
    await page.getByTestId(`app.sidebar.project.${SHOP}`).click();
    const right = page.getByTestId(`app.right.artifact.${SHOP}.pr-381`);
    await expect(right, "the right bar's PR row").toBeVisible({ timeout: 5000 });
    // designer m_21742 (b): its time stays, '↗' after its title
    await expect(page.getByTestId(`app.right.artifact.${SHOP}.pr-381.leaves`), "'↗' after the PR's title").toHaveText('↗');
    await expect(page.getByTestId(`app.right.artifact.${SHOP}.release-notes.leaves`), 'a page has none').toHaveCount(0);
    await right.click();
    expect(await opened(4)).toContain(PR);
    await expect(page.getByTestId('artifact.open')).toHaveCount(0);

    // ⌘K: the PR's row says '↗', ⏎ opens his browser
    await page.keyboard.press('Meta+k');
    await page.keyboard.type('381');
    const hit = page.locator('[data-testid="app.palette.group.artifacts"] [data-kind="artifact"]').first();
    await expect(hit, "⌘K's PR row").toContainText('↗');
    await page.keyboard.press('Enter');
    expect(await opened(5)).toContain(PR);
    await expect(page.getByTestId('artifact.open')).toHaveCount(0);
  } finally {
    await s.close();
    core.dispose();
  }
});

test("artifacts/browser-only: the thread's PR chip says '↗' and opens his browser", async () => {
  const now = Date.now();
  const core = new FakeCore(world(now) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${SHOP}/release`, size: '1100x800' });
  const out = new Lines();
  s.app.process().stdout?.setEncoding('utf8');
  s.app.process().stdout?.on('data', (d: string) => {
    out.push(d);
  });
  try {
    const { page } = s;
    const chip = page.getByTestId('thread.artifact.2');
    await expect(chip, 'the PR chip').toBeVisible({ timeout: 10_000 });
    // designer m_21742 (a): its kind's glyph in front, one '↗' only, at the end
    await expect(chip.locator('.b-artchip-title'), "the PR's glyph in front").toHaveText(/^⇡ PR #381/);
    expect((await chip.innerText()).split('↗').length - 1, "one '↗'").toBe(1);
    await expect(chip.locator('.b-artchip-meta')).toHaveText('↗');
    await expect(chip).not.toContainText('PR · ');
    await page.screenshot({ path: test.info().outputPath('light-1100-chip.png') });
    await chip.click();
    const line = await out.wait(EXTERNAL, () => true, 5000);
    expect(line).toContain(PR);
    await expect(page.getByTestId('artifact.open'), 'no panel').toHaveCount(0);
  } finally {
    await s.close();
    core.dispose();
  }
});

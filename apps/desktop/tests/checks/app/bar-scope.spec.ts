// app/bar-scope · his ask (main m_25024), designer m_25031: the right bar's ARTIFACTS and
// SCHEDULED & WATCHING follow the thread in view. FakeCore: storefront (perf made a page, search a
// spec; perf's nightly task and its alarm, bench's alarm) and docs (a guide, its weekly task).
// Passes when:
//   - bise's thread: every project's rows, no scope words;
//   - storefront's main: storefront's rows only, no scope words;
//   - perf's thread (a click on its row, the bar follows): only perf's artifact, task and alarm,
//     'by perf' / 'for perf' on a line under the heads, with their tips, 'all ›' opens storefront's full list;
//   - bench's thread: 'ARTIFACTS · 0 by bench', 'bench made nothing yet', 'all ›' still there; its alarm;
//   - AGENTS keeps every agent at each level.
// Shots: bar-scope-<theme>-<bise|main|perf|bench>.png. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const D = 'docs-5e6f7a8b';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const agent = (name: string, status: string, over: Record<string, unknown> = {}) => ({
  name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [], ...over,
});
const gate = { id: 7, kind: 'file', what: 'the nightly gate goes red', noted: true, since_ms: NOW - 60 * MIN, until_ms: NOW + 10 * 60 * MIN };
const world = (theme: string) => [
  prefs(theme),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 4, working: 1, waits: 0, running: true },
      { project: D, name: 'docs', path: '/nowhere/docs', git: true, home: false, order: 2, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  {
    ev: 'agents',
    project: P,
    agents: [
      agent('main', 'idle'),
      agent('perf', 'working', { watching: [gate] }),
      agent('search', 'idle'),
      agent('bench', 'idle', { watching: [{ id: 9, kind: 'bg', what: 'cargo bench', since_ms: NOW - 2 * MIN }] }),
    ],
  },
  { ev: 'agents', project: D, agents: [agent('main', 'idle'), agent('guide', 'idle')] },
  { ev: 'agents', project: HOME, agents: [agent('main', 'idle')] },
  ...[
    [P, 'main', 'perf cut the hero image to 180 KB.'],
    [P, 'perf', 'the hero image is 180 KB now.'],
    [P, 'bench', 'cargo bench runs; i wake when it ends.'],
    [HOME, 'main', 'storefront and docs are quiet.'],
  ].map(([project, a, text]) => ({ ev: 'thread', project, agent: a, entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text }], before: null, more: false })),
  { ev: 'scheduled', project: P, items: [{ id: 4, name: 'nightly replay', agent: 'perf', by: 'main', words: 'replay the night traffic', every: 'day 02:00', done: 3, next_ms: NOW + 6 * 60 * MIN }] },
  { ev: 'scheduled', project: D, items: [{ id: 2, name: 'weekly links check', agent: 'guide', by: 'main', words: 'check every link of the guide', every: 'mon 09:00', done: 1, next_ms: NOW + 50 * 60 * MIN }] },
  {
    ev: 'artifacts',
    project: P,
    items: [
      { id: 'product-page', kind: 'page', title: 'product page, before / after', agent: 'perf', version: 2, at_ms: NOW - 5 * MIN, url: 'http://127.0.0.1:1/p/x', new: true },
      { id: 'size-spec', kind: 'file', title: 'size filter spec', agent: 'search', version: 1, at_ms: NOW - 40 * MIN, url: 'http://127.0.0.1:1/p/y', new: false },
    ],
  },
  { ev: 'artifacts', project: D, items: [{ id: 'guide', kind: 'page', title: 'install guide', agent: 'guide', version: 1, at_ms: NOW - 90 * MIN, url: 'http://127.0.0.1:1/p/z', new: false }] },
];

for (const theme of ['light', 'dark']) {
  test(`app/bar-scope: ARTIFACTS and SCHEDULED & WATCHING follow the thread, bise > project > sub-agent (${theme})`, async () => {
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: 'bise', size: '1400x900' });
    try {
      const { page } = s;
      const ids = (sec: string) =>
        page.locator(`[data-testid="app.right.${sec}"] .app-rb-row[data-testid]`).evaluateAll((es) => es.map((e) => e.getAttribute('data-testid') ?? ''));
      // a head's 'NAME · count' (its scope words sit on their own line under it)
      const head = (sec: string) => () => page.getByTestId(`app.right.${sec}.head`).locator('.app-rb-label').evaluate((el) => el.firstChild?.textContent ?? '');
      const shot = async (name: string) => {
        await page.mouse.move(1, 400);
        await page.screenshot({ path: test.info().outputPath(`bar-scope-${theme}-${name}.png`) });
      };
      // 1. bise's thread: every project's, no words
      await expect(page.getByTestId(`app.right.artifact.${D}.guide`)).toBeVisible({ timeout: 10_000 });
      await expect.poll(head('artifacts')).toBe('ARTIFACTS · 3');
      await expect.poll(head('scheduled')).toBe('SCHEDULED & WATCHING · 4');
      expect(await ids('scheduled')).toEqual(expect.arrayContaining([`app.right.scheduled.${P}.4`, `app.right.scheduled.${D}.2`, `app.right.watching.${P}.perf.7`, `app.right.watching.${P}.bench.9`]));
      await expect(page.getByTestId('app.right.artifacts.scope')).toHaveCount(0);
      await expect(page.getByTestId('app.right.scheduled.scope')).toHaveCount(0);
      await shot('bise');
      // 2. storefront's main: storefront's only, no words
      await page.getByTestId(`app.sidebar.project.${P}`).click();
      await expect(page.getByTestId('app.right.top')).toContainText('storefront', { timeout: 10_000 });
      await expect.poll(head('artifacts')).toBe('ARTIFACTS · 2');
      expect(await ids('artifacts')).toEqual([`app.right.artifact.${P}.product-page`, `app.right.artifact.${P}.size-spec`]);
      await expect.poll(head('scheduled')).toBe('SCHEDULED & WATCHING · 3');
      expect(await ids('scheduled')).toEqual([`app.right.scheduled.${P}.4`, 'app.right.watching.perf.7', 'app.right.watching.bench.9']);
      await expect(page.getByTestId('app.right.artifacts.scope')).toHaveCount(0);
      await expect(page.getByTestId('app.right.agent.bench')).toBeVisible();
      await shot('main');
      // 3. perf's thread: the bar follows, only perf's, 'by perf' / 'for perf' and their tips
      await page.getByTestId('app.right.agent.perf').click();
      await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'perf');
      await expect.poll(head('artifacts')).toBe('ARTIFACTS · 1');
      await expect(page.getByTestId('app.right.artifacts.scope')).toHaveText('by perf');
      await expect(page.getByTestId('app.right.artifacts.scope')).toHaveAttribute('data-tip', "only what perf made · all › shows storefront's");
      expect(await ids('artifacts')).toEqual([`app.right.artifact.${P}.product-page`]);
      await expect.poll(head('scheduled')).toBe('SCHEDULED & WATCHING · 2');
      await expect(page.getByTestId('app.right.scheduled.scope')).toHaveText('for perf');
      await expect(page.getByTestId('app.right.scheduled.scope')).toHaveAttribute('data-tip', "only perf's scheduled tasks and alarms · all › shows storefront's");
      expect(await ids('scheduled')).toEqual([`app.right.scheduled.${P}.4`, 'app.right.watching.perf.7']);
      // AGENTS keeps every agent
      await expect(page.getByTestId('app.right.agent.bench')).toBeVisible();
      await expect(page.getByTestId('app.right.agent.search')).toBeVisible();
      // the scope words: a line under the head, on the label's left edge, sans 12, text-3, lowercase
      // (bar-heads, main m_26417: after the count they ran under 'all ›'; app/bar-heads checks the boxes)
      const gap = await page.getByTestId('app.right.artifacts').evaluate((sec) => {
        const l = sec.querySelector('.app-rb-label')?.getBoundingClientRect();
        const h = sec.querySelector('.app-rb-head')?.getBoundingClientRect();
        const w = sec.querySelector('.app-rb-scope');
        const r = w?.getBoundingClientRect();
        return { left: Math.round((r?.left ?? 0) + 8 - (l?.left ?? 0)), under: (r?.top ?? 0) >= (h?.bottom ?? 0) - 0.5, size: w === null ? '' : getComputedStyle(w).fontSize, caps: w === null ? '' : getComputedStyle(w).textTransform };
      });
      expect(gap.left, "the scope words on the label's left edge").toBe(0);
      expect(gap.under, 'the scope words under the head').toBe(true);
      expect(gap.size).toBe('12px');
      expect(gap.caps).not.toBe('uppercase');
      await shot('perf');
      // 4. bench's thread: no artifact, its line, 'all ›' still opens storefront's full list
      await page.getByTestId('app.right.agent.bench').click();
      await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'bench');
      await expect.poll(head('artifacts')).toBe('ARTIFACTS · 0');
      await expect(page.getByTestId('app.right.artifacts.scope')).toHaveText('by bench');
      await expect(page.getByTestId('app.right.artifacts.none')).toHaveText('bench made nothing yet');
      await expect.poll(head('scheduled')).toBe('SCHEDULED & WATCHING · 1');
      expect(await ids('scheduled')).toEqual(['app.right.watching.bench.9']);
      await expect(page.getByTestId('app.right.artifacts.all')).toBeVisible();
      await shot('bench');
      await page.getByTestId('app.right.artifacts.all').click();
      await expect(page.getByTestId(`artifacts.row.${P}.size-spec`).or(page.getByText('size filter spec').first())).toBeVisible({ timeout: 10_000 });
    } finally {
      await s.close();
    }
  });
}

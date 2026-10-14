// app/right-bar · designer's desktop-right-bar v5 (ambient-lead m_20085/m_20087/m_20091): the right
// bar takes panel A's place. Storefront on FakeCore: 12 live agents (the 10th waits on him) and bench, idle with an alarm set, 2
// archived, 2 artifacts, a scheduled task and bench's alarm (agent-waiting-states A). Passes when:
//   - the column is 320 px with its head 'storefront · N working ⌥⌘0' and four sections in his
//     order, each head 'NAME · count' with 'all ›';
//   - AGENTS keeps start order, shows 8 rows plus the waiting 10th in its place, '+ 4 more' unfolds
//     the rest; it never folds while one waits; the waiting row's sign is '?' (desktop-agents-bar: no state words);
//   - ARCHIVED folds to its head and a summary on the same line, kept after a reload;
//   - ⌥ held shows ⌥1-⌥9 on the agents; a click opens the agent full in the centre;
//   - on bise's thread the same sections cover every project, the project's name in place of the role;
//   - under 1000 px it slides over the thread (⌥⌘0), esc closes it.
// Shots: right-bar-<theme>-<width>.png, -bise, -800-over. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const agent = (name: string, status: string, over: Record<string, unknown> = {}) => ({
  name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [], ...over,
});
const NAMES = ['perf', 'checkout', 'reviews', 'images', 'cart', 'search-ui', 'pricing', 'emails', 'seo', 'search', 'a11y', 'fonts'];
const live = NAMES.map((n, i) => agent(n, i < 2 ? 'working' : 'idle', n === 'search' ? { waits: 1, purpose: 'size filter' } : {}));
const world = (theme: string) => [
  prefs(theme),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 16, working: 2, waits: 1, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  {
    ev: 'agents',
    project: P,
    agents: [
      agent('main', 'idle'),
      ...live,
      agent('bench', 'idle', { watching: [{ id: 9, kind: 'bg', what: 'cargo bench', since_ms: NOW - 2 * MIN }] }),
      agent('hero-img', 'done', { archived: true, since_ms: NOW - 2 * 60 * MIN }),
      agent('old-search', 'idle', { archived: true, since_ms: NOW - 2 * 24 * 60 * MIN }),
    ],
  },
  { ev: 'agents', project: HOME, agents: [agent('main', 'idle')] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'perf cut the hero image to 180 KB. search waits for your answer on sizes.' }], before: null, more: false },
  { ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'One question waits for you in storefront.' }], before: null, more: false },
  { ev: 'scheduled', project: P, items: [{ id: 4, name: 'nightly replay', agent: 'perf', by: 'main', words: 'replay the night traffic', every: 'day 02:00', done: 3, next_ms: NOW + 6 * 60 * MIN }] },
  {
    ev: 'artifacts',
    project: P,
    items: [
      { id: 'product-page', kind: 'page', title: 'product page, before / after', agent: 'perf', version: 2, at_ms: NOW - 5 * MIN, url: 'http://127.0.0.1:1/p/x', new: true },
      { id: 'size-spec', kind: 'file', title: 'size filter spec', agent: 'search', version: 1, at_ms: NOW - 40 * MIN, url: 'http://127.0.0.1:1/p/y', new: false },
    ],
  },
];

for (const theme of ['light', 'dark']) {
  test(`app/right-bar: four sections, start order, the waiting agent never capped, folds kept, bise's every project (${theme})`, async () => {
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `project/${P}`, size: '1400x900' });
    try {
      const { page } = s;
      const bar = page.getByTestId('app.panel');
      await expect(page.getByTestId('app.right.agent.perf')).toBeVisible({ timeout: 10_000 });
      expect(Math.round((await bar.boundingBox())?.width ?? 0), 'the column is 320 px').toBe(320);
      await expect(page.getByTestId('app.right.top')).toHaveText(/^storefront\s*2 working\s*⌥⌘0$/u);
      // four sections in his order
      // (the labels: ARCHIVED starts folded, its summary beside its label)
      const heads = await page.locator('[data-testid^="app.right."][data-testid$=".head"] .app-rb-label').allTextContents();
      expect(heads).toEqual(['AGENTS · 13', 'ARCHIVED · 2', 'ARTIFACTS · 2', 'SCHEDULED & WATCHING · 2']);
      // AGENTS: start order, 8 rows + the waiting 10th in its place, '+ 4 more'
      const names = async () => page.locator('[data-testid="app.right.agents"] [data-testid^="app.right.agent."]').evaluateAll((es) => es.map((e) => e.getAttribute('data-testid')?.replace('app.right.agent.', '')));
      expect(await names()).toEqual([...NAMES.slice(0, 8), 'search']);
      await expect(page.getByTestId('app.right.agent.search').locator('.app-rb-g')).toHaveText('?');
      await expect(page.getByTestId('app.right.agents.more')).toHaveText('+ 4 more');
      // it never folds while one waits
      await page.getByTestId('app.right.agents.head').click();
      await expect(page.getByTestId('app.right.agent.perf')).toBeVisible();
      await page.mouse.move(1, 400);
      await page.screenshot({ path: test.info().outputPath(`right-bar-${theme}-1400.png`) });
      await page.getByTestId('app.right.agents.more').click();
      expect(await names()).toEqual([...NAMES, 'bench']);
      // ARCHIVED starts folded (his ask, main m_23467): its head and a summary, no rows, no '+ N more'
      await expect(page.getByTestId('app.right.archived.summary')).toHaveText('✓ hero-img');
      await expect(page.getByTestId('app.right.archived.hero-img')).toHaveCount(0);
      await expect(page.getByTestId('app.right.archived.more')).toHaveCount(0);
      // a click opens it, kept after a reload; folded again, kept too
      await page.getByTestId('app.right.archived.head').click();
      await expect(page.getByTestId('app.right.archived.hero-img')).toContainText('2 h');
      await page.reload();
      await expect(page.getByTestId('app.right.archived.hero-img')).toContainText('done · 2 h', { timeout: 10_000 });
      await page.getByTestId('app.right.archived.head').click();
      await expect(page.getByTestId('app.right.archived.hero-img')).toHaveCount(0);
      await page.reload();
      await expect(page.getByTestId('app.right.archived.summary')).toHaveText('✓ hero-img', { timeout: 10_000 });
      await expect(page.getByTestId('app.right.archived.hero-img')).toHaveCount(0);
      await page.getByTestId('app.right.archived.head').click();
      await expect(page.getByTestId('app.right.archived.hero-img')).toContainText('2 h');
      // the rest of the sections
      await expect(page.getByTestId(`app.right.artifact.${P}.product-page`)).toContainText('new');
      await expect(page.getByTestId(`app.right.scheduled.${P}.4`)).toContainText('nightly replay');
      // bench's alarm (agent-waiting-states A): '◌', 'if …', its agent idle
      await expect(page.getByTestId('app.right.watching.bench.9')).toContainText('if cargo bench ends');
      // ⌥ held: ⌥1-⌥9 on the agents
      await page.keyboard.down('Alt');
      await expect(page.getByTestId('app.right.agent.perf').locator('.app-rb-g')).toHaveText('⌥1');
      await page.keyboard.up('Alt');
      // perf works: the DS's breeze '∿' (a Dot) back in its place
      await expect(page.getByTestId('app.right.agent.perf').locator('.app-rb-g .b-dot.wk')).toBeVisible();
      // a click opens the agent full in the centre
      await page.getByTestId('app.right.agent.checkout').click();
      await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'checkout');
      // at 1100 and 800
      for (const w of [1100, 800]) {
        await page.setViewportSize({ width: w, height: 900 });
        await page.evaluate(() => new Promise<void>((done) => { requestAnimationFrame(() => { requestAnimationFrame(() => { done(); }); }); }));
        if (w === 800) {
          await expect(bar).toHaveCount(0);
          await page.keyboard.press('Meta+Alt+Digit0');
          await expect(page.getByTestId('app.over.right').getByTestId('app.panel'), 'it slides over the thread').toBeVisible();
          await page.mouse.move(1, 400);
          await page.screenshot({ path: test.info().outputPath(`right-bar-${theme}-800-over.png`) });
          await page.keyboard.press('Escape');
          await expect(bar).toHaveCount(0);
        } else {
          await page.mouse.move(1, 400);
          await page.screenshot({ path: test.info().outputPath(`right-bar-${theme}-${String(w)}.png`) });
        }
      }
      // bise's thread: every project, the project's name in place of the role
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.getByTestId('app.sidebar.bise').click();
      await expect(page.getByTestId(`app.right.agent.${P}.perf`)).toContainText('storefront', { timeout: 10_000 });
      await page.mouse.move(1, 400);
      await page.screenshot({ path: test.info().outputPath(`right-bar-${theme}-bise.png`) });
    } finally {
      await s.close();
    }
  });

  // his right-bar feedback (main m_21628), designer m_21633: a head that folds looks clickable, and
  // what '+ N more' opened, 'show less' folds back, in the same row
  test(`app/right-bar: a head that folds is a row (pointer, tint, chevron), 'show less' folds back to the cap (${theme})`, async () => {
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x900' });
    try {
      const { page } = s;
      const bar = page.getByTestId('app.panel');
      await expect(page.getByTestId('app.right.agent.perf')).toBeVisible({ timeout: 10_000 });
      const look = (id: string) =>
        page.getByTestId(`app.right.${id}.head`).evaluate((el) => {
          const label = el.querySelector('.app-rb-label');
          const row = el.parentElement;
          return {
            cursor: getComputedStyle(el).cursor,
            tint: row === null ? '' : getComputedStyle(row).backgroundColor,
            chevron: label === null ? '' : getComputedStyle(label, '::after').content,
            shown: label === null ? '' : getComputedStyle(label, '::after').visibility,
            h: Math.round(row?.getBoundingClientRect().height ?? 0),
          };
        });
      const clear = 'rgba(0, 0, 0, 0)';
      // ARCHIVED starts folded ('▸' at rest, main m_23467): opened first, to look at it open
      await page.mouse.move(1, 400);
      expect(await look('archived'), 'archived starts folded').toMatchObject({ cursor: 'pointer', tint: clear, chevron: '"▸"', shown: 'visible', h: 28 });
      await page.getByTestId('app.right.archived.head').click();
      await expect(page.getByTestId('app.right.archived.hero-img')).toBeVisible();
      // every head that folds: pointer, 28 px; at rest no tint and no chevron, hovered both
      for (const id of ['archived', 'artifacts', 'scheduled']) {
        await page.mouse.move(1, 400);
        const rest = await look(id);
        expect(rest, `${id} at rest`).toMatchObject({ cursor: 'pointer', tint: clear, chevron: '"▾"', shown: 'hidden', h: 28 });
        await page.getByTestId(`app.right.${id}.head`).hover();
        const on = await look(id);
        expect(on.tint, `${id} hovered: the rows' tint`).not.toBe(clear);
        expect(on.shown, `${id} hovered: '▾'`).toBe('visible');
      }
      // 'all ›' is its own target: no row tint under it
      await page.getByTestId('app.right.artifacts.all').hover();
      expect((await look('artifacts')).tint, "'all ›' hovered").toBe(clear);
      // AGENTS can't fold while one waits: a plain title, no pointer, no tint, no chevron
      await page.getByTestId('app.right.agents.head').hover();
      expect(await look('agents'), 'agents (one waits)').toMatchObject({ cursor: 'default', tint: clear, chevron: 'none' });
      // the head at rest, hovered, folded ('▸' at rest)
      await page.mouse.move(1, 400);
      await page.screenshot({ path: test.info().outputPath(`heads-${theme}-rest.png`) });
      await page.getByTestId('app.right.archived.head').hover();
      await page.screenshot({ path: test.info().outputPath(`heads-${theme}-hover.png`) });
      await page.getByTestId('app.right.archived.head').click();
      await page.mouse.move(1, 400);
      expect(await look('archived'), 'folded').toMatchObject({ chevron: '"▸"', shown: 'visible' });
      await expect(page.getByTestId('app.right.archived.summary')).toHaveText('✓ hero-img');
      await page.screenshot({ path: test.info().outputPath(`heads-${theme}-folded.png`) });
      // space folds it open again from the keyboard
      await page.getByTestId('app.right.archived.head').focus();
      await page.keyboard.press('Space');
      await expect(page.getByTestId('app.right.archived.hero-img')).toBeVisible();
      // '+ 4 more' -> every agent, 'show less' in the same row -> back at the cap
      const names = async () => page.locator('[data-testid="app.right.agents"] [data-testid^="app.right.agent."]').count();
      const more = page.getByTestId('app.right.agents.more');
      await expect(more).toHaveText('+ 4 more');
      const at = await more.boundingBox();
      await more.click();
      expect(await names()).toBe(13);
      await expect(more).toHaveCount(0);
      const less = page.getByTestId('app.right.agents.less');
      await expect(less).toHaveText('show less');
      expect(Math.round((await less.boundingBox())?.height ?? 0), "'show less' is 28 px, as '+ N more'").toBe(Math.round(at?.height ?? 0));
      await less.hover();
      await page.screenshot({ path: test.info().outputPath(`heads-${theme}-less.png`) });
      // scrolled down to it, 'show less' brings the list back to its cap with the head in view
      await bar.locator('.app-rb-body').evaluate((el) => { el.scrollTop = el.scrollHeight; });
      await less.click();
      expect(await names()).toBe(9);
      await expect(more).toHaveText('+ 4 more');
      await expect(less).toHaveCount(0);
      await expect(page.getByTestId('app.right.agents.head')).toBeInViewport();
      // a section under its cap has neither
      await expect(page.getByTestId('app.right.artifacts.more')).toHaveCount(0);
      await expect(page.getByTestId('app.right.artifacts.less')).toHaveCount(0);
    } finally {
      await s.close();
    }
  });
}

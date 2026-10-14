// app/agents-bar · designer's desktop-agents-bar (§2-§4, ARCHIVED rows), signed by Gabriel. Storefront
// on FakeCore with places (hub/agents): solo worktrees with each PR state, a shared checkout, a land
// in the queue, a worktree two agents share (the waiting one past the cap), an open PR with no agent.
// Passes when, light and dark, at 1400, 1100 and 800 (slid over):
//   - signs: the breeze, '?' pink, '✓' pink, '▲' red, '○' text-3, '…' on an event; no state word;
//   - columns: time 40 and % 32 right-aligned at the same x on every row, the mark 16 last, empty
//     columns keep their place; a long name: the role cut first, then the % goes, the mark stays;
//   - marks: '↑' pink (merge card), red (checks fail), text-2 open, text-3 draft, '…' to land, 'ψ' no
//     PR, none in the shared checkout; the tip: 280 px, the TUI's words, 'open the PR ↗'; a click
//     on the mark opens the review screen;
//   - the group: a 28 px 'ψ sb/flash-sale' head with '↑ #418', its rows with no mark, the 1 px rule
//     in the margin, the TUI's order; the orphan PR: no sign, its '↑', opens its branch;
//   - the 8-row cap never hides the agent that waits (its head shows with it); 'AGENTS · N' counts agents;
//   - ARCHIVED: '✓ release-32 2 h', '▲ import 1 d'.
// Shots: agents-bar-<theme>-<width>.png, agents-bar-<theme>-tip.png. Owner: amb-win.
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
  name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [], dir: name, ...over,
});
const use = (pct: number) => ({ usage: { model: 'm', context: pct * 1000, window: 100_000, words: '', short: `${String(pct)}%` } });
const LONG = 'proofreading-every-product-page';
const pr = (number: number, over: Record<string, unknown> = {}) => ({ number, url: `https://github.com/acme/shop/pull/${String(number)}`, branch: '', agents: [], state: 'open', checks: 'pass', review: 'none', words: 'checks pass', text: '', ...over });
const world = (theme: string) => [
  prefs(theme),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 11, working: 3, waits: 1, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  {
    ev: 'agents',
    project: P,
    agents: [
      agent('main', 'idle'),
      agent('perf', 'working', { purpose: 'product page speed', turn_ms: 4 * MIN, ...use(31) }),
      agent('search', 'idle', { waits: 1, purpose: 'size filter', ...use(18) }),
      agent('pay', 'working', { purpose: 'mobile safari', turn_ms: 2 * MIN, ...use(12) }),
      agent('docs', 'done', { purpose: 'api examples', ...use(5) }),
      agent('launch', 'idle', { purpose: 'launch videos', ...use(29) }),
      agent(LONG, 'idle', { purpose: 'the copy of every page, one by one', ...use(40) }),
      agent('broken', 'failed', { purpose: 'import the catalog' }),
      agent('bench', 'idle', { purpose: 'the nightly bench', watching: [{ id: 3, kind: 'bg', what: 'cargo bench', since_ms: NOW - 3 * MIN, resumes: true }] }),
      agent('stock', 'working', { purpose: 'replay the sale', turn_ms: MIN, ...use(9) }),
      agent('pricing', 'idle', { waits: 1, purpose: 'price rules', ...use(22) }),
      agent('release-32', 'done', { archived: true, since_ms: NOW - 2 * 60 * MIN }),
      agent('import', 'failed', { archived: true, since_ms: NOW - 24 * 60 * MIN - MIN }),
    ],
    places: [
      { id: 'wt:sb/perf', branch: 'sb/perf', agents: ['perf'] },
      { id: 'wt:sb/search', branch: 'sb/search', agents: ['search'], pr: pr(416, { branch: 'sb/search', words: 'approved · checks pass', review: 'approved' }) },
      { id: 'wt:sb/checkout', branch: 'sb/checkout', agents: ['pay'], pr: pr(415, { branch: 'sb/checkout', checks: 'fail', failing: ['e2e/login'], words: 'checks fail: e2e/login' }) },
      { id: 'wt:sb/launch', branch: 'sb/launch', agents: ['launch'], lid: 'waits to land · 2nd' },
      { id: `wt:sb/${LONG}`, branch: `sb/${LONG}`, agents: [LONG], pr: pr(417, { state: 'draft', words: 'draft · checks running', checks: 'running' }) },
      { id: 'wt:sb/flash-sale', branch: 'sb/flash-sale', agents: ['stock', 'pricing'], pr: pr(418, { branch: 'sb/flash-sale', words: 'changes asked · checks pass', review: 'changes' }) },
      { id: 'wt:sb/palette', branch: 'sb/palette', agents: [], pr: pr(420, { branch: 'sb/palette' }) },
    ],
  },
  { ev: 'agents', project: HOME, agents: [agent('main', 'idle')] },
  {
    ev: 'cards',
    project: P,
    cards: [{ id: 9, project: P, kind: 'merge', agent: 'search', question: 'merge #416?', options: [{ n: 1, label: 'merge' }], urgent: false, since_ms: NOW - MIN, place: 'wt:sb/search', pr: 416 }],
  },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'search waits for your merge.' }], before: null, more: false },
];

for (const theme of ['light', 'dark']) {
  test(`app/agents-bar: signs, columns, marks and tip, the group, the orphan PR, the cap, ARCHIVED (${theme})`, async () => {
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `project/${P}`, size: '1400x900' });
    try {
      const { page } = s;
      const row = (id: string) => page.getByTestId(`app.right.agent.${id}`);
      await expect(row('perf')).toBeVisible({ timeout: 10_000 });
      // the TUI's order, the cap: 8 rows, then the group's head and pricing (waits) past it; stock under '+ 1 more'
      const order = await page.locator('[data-testid="app.right.agents"] .app-rb-arow').evaluateAll((es) => es.map((e) => e.getAttribute('data-testid')));
      expect(order).toEqual([
        'app.right.agent.perf', 'app.right.agent.search', 'app.right.agent.pay', 'app.right.agent.docs', 'app.right.agent.launch',
        `app.right.agent.${LONG}`, 'app.right.agent.broken', 'app.right.agent.bench', 'app.right.group.sb/flash-sale', 'app.right.agent.pricing',
      ]);
      await expect(page.getByTestId('app.right.agents.more')).toHaveText('+ 2 more');
      await expect(page.getByTestId('app.right.agents.head').locator('.app-rb-label')).toHaveText('AGENTS · 10');
      await page.getByTestId('app.right.agents.more').click();
      await expect(page.getByTestId('app.right.pr.420')).toBeVisible();
      await expect(row('stock')).toBeVisible();
      // signs, no state words
      const sign = (id: string) => row(id).locator('.app-rb-g');
      await expect(sign('perf').locator('.b-dot.wk')).toBeVisible();
      const looks = async (id: string) => sign(id).evaluate((el) => ({ g: el.textContent, c: getComputedStyle(el).color }));
      const color = (v: string) => page.evaluate((x) => { const d = document.createElement('i'); d.style.color = `var(${x})`; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; }, v);
      const [acc, err, t2, t3] = [await color('--c-accent'), await color('--c-err'), await color('--c-text-2'), await color('--c-text-3')];
      expect(await looks('search')).toEqual({ g: '?', c: acc });
      expect(await looks('docs')).toEqual({ g: '✓', c: acc });
      expect(await looks('broken')).toEqual({ g: '▲', c: err });
      expect(await looks('launch')).toEqual({ g: '○', c: t3 });
      expect((await looks('bench')).g).toBe('…');
      const words = await page.getByTestId('app.right.agents').innerText();
      expect(words).not.toMatch(/\b(done|idle|now|waits|failed)\b/u);
      // columns: time and % right edges line up on every row, the mark last at the same x
      const cols = await page.locator('[data-testid="app.right.agents"] .app-rb-arow:not(.app-rb-ghead):not(.app-rb-orphan)').evaluateAll((es) =>
        es.map((e) => {
          const r = (q: string) => e.querySelector(q)?.getBoundingClientRect();
          return { id: e.getAttribute('data-testid'), time: Math.round(r('.app-rb-time')?.right ?? 0), pct: Math.round(r('.app-rb-pct')?.right ?? 0), pctTop: Math.round(r('.app-rb-pct')?.top ?? 0), top: Math.round(e.getBoundingClientRect().top), mark: Math.round(r('.app-rb-mark')?.right ?? 0), tw: Math.round(r('.app-rb-time')?.width ?? 0), pw: Math.round(r('.app-rb-pct')?.width ?? 0) };
        }),
      );
      const normal = cols.filter((c) => c.id !== `app.right.agent.${LONG}`);
      expect(new Set(normal.map((c) => c.time)).size, 'time column aligned').toBe(1);
      expect(new Set(normal.map((c) => c.pct)).size, '% column aligned').toBe(1);
      expect(new Set(cols.map((c) => c.mark)).size, 'mark column aligned').toBe(1);
      expect([normal[0]?.tw, normal[0]?.pw], 'time 40, % 32').toEqual([40, 32]);
      await expect(row('perf').getByTestId('app.right.agent.perf.time')).toHaveText('4 min');
      await expect(row('perf').getByTestId('app.right.agent.perf.pct')).toHaveText('31%');
      await expect(row('launch').getByTestId('app.right.agent.launch.time')).toHaveText('');
      // the long name: whole, its role cut away, its % gone (wrapped off the line), its mark there
      const long = await row(LONG).evaluate((e) => {
        const r = (q: string) => e.querySelector(q) as HTMLElement;
        const cols = r('.app-rb-cols').getBoundingClientRect();
        return { name: r('.app-rb-name').scrollWidth <= r('.app-rb-name').clientWidth, role: r('.app-rb-role').clientWidth, pctOff: r('.app-rb-pct').getBoundingClientRect().top >= cols.bottom, mark: r('.app-rb-mark').textContent };
      });
      expect(long, 'room short: role first, then %, the mark stays').toEqual({ name: true, role: 0, pctOff: true, mark: '↑' });
      // marks and their tints
      const mark = (id: string) => page.getByTestId(`${id}.mark`);
      const markLook = async (id: string) => mark(id).evaluate((el) => ({ g: el.textContent, c: getComputedStyle(el).color }));
      expect(await markLook('app.right.agent.search')).toEqual({ g: '↑', c: acc });
      expect(await markLook('app.right.agent.pay')).toEqual({ g: '↑', c: err });
      expect(await markLook(`app.right.agent.${LONG}`)).toEqual({ g: '↑', c: t3 });
      expect(await markLook('app.right.agent.launch')).toEqual({ g: '…', c: t2 });
      expect(await markLook('app.right.agent.perf')).toEqual({ g: 'ψ', c: t2 });
      expect(await markLook('app.right.pr.420')).toEqual({ g: '↑', c: t2 });
      await expect(mark('app.right.agent.docs')).toHaveCount(0);
      // the group: 28 px head 'ψ sb/flash-sale' + '↑ #418', its rows no mark, the rule in the margin
      const head = page.getByTestId('app.right.group.sb/flash-sale');
      expect(Math.round((await head.boundingBox())?.height ?? 0)).toBe(28);
      await expect(head.locator('.app-rb-g')).toHaveText('ψ');
      await expect(head.locator('.app-rb-name')).toHaveText('sb/flash-sale');
      expect(await markLook('app.right.group.sb/flash-sale')).toEqual({ g: '↑ #418', c: t2 });
      await expect(mark('app.right.agent.stock')).toHaveCount(0);
      const rule = await row('stock').evaluate((e) => { const b = getComputedStyle(e, '::before'); return { w: b.width, x: Math.round(e.getBoundingClientRect().left + parseFloat(b.left)) - Math.round(e.getBoundingClientRect().left) }; });
      expect(rule.w).toBe('1px');
      expect(rule.x, 'in the 8 px margin').toBeLessThan(0);
      expect(Math.round((await sign('stock').boundingBox())?.x ?? 0), 'same sign column').toBe(Math.round((await sign('perf').boundingBox())?.x ?? 0));
      // the orphan PR: no sign, its branch text-3
      await expect(page.getByTestId('app.right.pr.420').locator('.app-rb-g')).toHaveText('');
      expect(await page.getByTestId('app.right.pr.420').locator('.app-rb-name').evaluate((e) => getComputedStyle(e).color)).toBe(t3);
      // the tip: 280 px, the TUI's words with the branch last, 'open the PR ↗'
      await mark('app.right.agent.pay').hover();
      const tip = page.getByTestId('app.right.tip');
      await expect(page.getByTestId('app.right.tip.words')).toHaveText('#415 · checks fail: e2e/login · ψ sb/checkout');
      await expect(page.getByTestId('app.right.tip.open')).toHaveText('open the PR ↗');
      expect(Math.round((await tip.boundingBox())?.width ?? 0)).toBe(280);
      await page.screenshot({ path: test.info().outputPath(`agents-bar-${theme}-tip.png`) });
      await mark('app.right.agent.search').hover();
      await expect(page.getByTestId('app.right.tip.words')).toHaveText('#416 · approved · checks pass');
      // ARCHIVED: sign + name + age
      await page.getByTestId('app.right.archived.head').click();
      await expect(page.getByTestId('app.right.archived.release-32')).toHaveText(/^✓\s*release-32\s*2 h$/u);
      await expect(page.getByTestId('app.right.archived.import')).toHaveText(/^▲\s*import\s*1 d$/u);
      // shots at 1400, 1100, 800 (slid over)
      for (const w of [1400, 1100, 800]) {
        await page.setViewportSize({ width: w, height: 900 });
        if (w === 800) await page.keyboard.press('Meta+Alt+Digit0');
        await expect(page.getByTestId('app.right.group.sb/flash-sale')).toBeVisible();
        await page.mouse.move(1, 400);
        await page.screenshot({ path: test.info().outputPath(`agents-bar-${theme}-${String(w)}.png`) });
        if (w === 800) await page.keyboard.press('Escape');
      }
      // a click on a mark opens the PR in the review screen; on the orphan, its branch
      await page.setViewportSize({ width: 1400, height: 900 });
      await mark('app.right.agent.pay').click();
      await expect(page.getByTestId('review.screen')).toHaveAttribute('data-agent', 'pay');
      await page.getByTestId('app.right.pr.420').click();
      await expect(page.getByTestId('branch.screen')).toHaveAttribute('data-branch', 'sb/palette');
    } finally {
      await s.close();
    }
  });
}

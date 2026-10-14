// thread/agent-head · the agent view's head, rows and composer words (designer's desktop-screens
// v6 (1), (2), (3), (4)). Passes when, in storefront with the scripted core (FakeCore, fake data):
//   - perf's head is one row: 'perf' in 600, its role 'product page speed', the chip '<breath> working ·
//     14 min' (the TUI's 1-cell breath, designer's desktop-working page), at the right 'changes ⌘D' (opens the review), '⋯'; its branch is the composer tab's;
//   - search, which waits on him, has the chip '? waiting for you' in the accent;
//   - the project's bise reads 'bise · storefront' with its 14 px pearl and the chip '1 waiting
//     for you', which opens the agents list;
//   - perf's rows: its commands as mono lines with their length ('$ lighthouse …  38 s'), its edits
//     ('± web/product/Hero.tsx  4 s'), the reads counted and folded, the artifact made as a chip
//     that opens in the window, and the working row '<gust> perf is working · running the bench three
//     more times · 14 min';
//   - the project's bise shows its handoffs '→ perf · product page speed' (they open the agent);
//   - checkout's empty thread: his first message, '· checkout is starting · its own folder,
//     sb/checkout' (the '·' pulsing), the chip 'starting';
//   - the composer says 'to perf' and 'write to perf, then ⏎';
//   - under 1000 px the head keeps the chip and the buttons, the name and role go (the titlebar's
//     crumb says them).
// Writes each view's shot as its own png at 2x (light + dark, 1400 and 800: perf, search, bise ·
// storefront, checkout's empty thread) and one sheet of them, for designer.
// Owner: amb-home.
import { writeFileSync } from 'node:fs';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'storefront-1a2b3c4d';
const MIN = 60_000;
const prefs = (theme: 'light' | 'dark') => ({
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
const spawn = (pos: number, at: number, agent: string, brief: string) => {
  const text = `✚ main → new agent @${agent} : ${brief}`;
  return { pos, at_ms: at, kind: 'notice', text, notice: { level: 'info', text } };
};
const QUESTION = 'which sizes should the filter offer: letters, or numbers too?';
const searchCard = (now: number) => ({ id: 7, project: P, kind: 'question', rank: 1, agent: 'search', question: QUESTION, options: [{ n: 1, label: 'letters only' }, { n: 2, label: 'letters and numbers' }], urgent: false, since_ms: now - 5 * MIN });
const world = (now: number) => {
  const ag = (name: string, over: Record<string, unknown>) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: now - 60 * MIN, waits: 0, ...over });
  return [
    prefs('light'),
    {
      ev: 'projects',
      projects: [
        { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
        { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 4, working: 2, waits: 1, running: true, cards: [searchCard(now)] },
      ],
    },
    { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
    {
      ev: 'agents',
      project: P,
      agents: [
        ag('main', {}),
        ag('perf', { status: 'working', since_ms: now - 14 * MIN, purpose: 'product page speed', title: 'running the bench three more times', branch: 'sb/perf', worktree: '/nowhere/wt/perf' }),
        ag('search', { status: 'idle', purpose: 'size filter on search', waits: 1, branch: 'sb/search' }),
        ag('checkout', { status: 'working', since_ms: now - 5000, purpose: 'checkout on mobile safari', branch: 'sb/checkout' }),
      ],
    },
    {
      ev: 'thread',
      project: P,
      agent: 'perf',
      entries: [
        { pos: 1, at_ms: now - 14 * MIN, kind: 'you', text: 'the product page takes 4 s on mobile. find why and fix it, numbers before and after please' },
        {
          pos: 2,
          at_ms: now - 13 * MIN,
          kind: 'tools',
          text: 'read 1 file, ran 2 commands',
          tools: {
            count: 3,
            summary: 'read 1 file, ran 2 commands',
            items: [
              { pos: 3, at_ms: now - 13 * MIN, text: 'lighthouse --preset=mobile /p/tee-classic', kind: 'run' },
              { pos: 4, at_ms: now - 13 * MIN + 38_000, text: 'pnpm trace web/product --cpu=4x', kind: 'run' },
              { pos: 5, at_ms: now - 13 * MIN + 110_000, text: 'web/product/Hero.tsx', kind: 'read' },
            ],
          },
        },
        { pos: 6, at_ms: now - 11 * MIN, kind: 'agent', text: 'found it: the hero image ships at 2.4 MB, and the reviews widget blocks the first paint while it loads 900 reviews.' },
        {
          pos: 7,
          at_ms: now - 10 * MIN,
          kind: 'tools',
          text: 'edited 2 files',
          tools: {
            count: 2,
            summary: 'edited 2 files',
            items: [
              { pos: 8, at_ms: now - 10 * MIN, text: 'web/product/Hero.tsx', kind: 'edit' },
              { pos: 9, at_ms: now - 10 * MIN + 4000, text: 'web/product/Reviews.tsx', kind: 'edit' },
            ],
          },
        },
        { pos: 10, at_ms: now - 2 * MIN, kind: 'artifact', text: 'made product page, before / after', made: { id: 'a1', agent: 'perf', title: 'product page, before / after', kind: 'page', kind_word: 'page', v: 2 } },
      ],
      before: null,
      more: false,
    },
    { ev: 'thread', project: P, agent: 'search', entries: [{ pos: 1, at_ms: now - 30 * MIN, kind: 'you', text: 'add a size filter to search' }], before: null, more: false },
    {
      ev: 'thread',
      project: P,
      agent: 'main',
      entries: [
        { pos: 1, at_ms: now - 16 * MIN, kind: 'you', text: "the product page is slow on mobile, and add a size filter to search while you're at it" },
        { pos: 2, at_ms: now - 15 * MIN, kind: 'agent', text: "two jobs, two agents: perf takes the product page, search takes the size filter. i'll tell you when either needs you." },
        spawn(3, now - 15 * MIN + 1000, 'perf', 'make the product page fast on mobile'),
        spawn(4, now - 15 * MIN + 2000, 'search', 'add a size filter to search'),
      ],
      before: null,
      more: false,
    },
    { ev: 'thread', project: P, agent: 'checkout', entries: [{ pos: 1, at_ms: now - 5000, kind: 'you', text: 'checkout fails on mobile safari when the card form autofills: find why' }], before: null, more: false },
  ];
};

test('thread/agent-head: one row with the role, the state chip, the branch, changes and ⋯; bise · storefront; the composer words', async () => {
  test.setTimeout(150_000);
  const now = Date.now();
  const core = new FakeCore(world(now) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  const shots: { label: string; png: Buffer }[] = [];
  try {
    const { page } = s;
    const cdp = await page.context().newCDPSession(page);
    const size = async (w: number, h: number) => {
      await s.app.evaluate(({ BrowserWindow }, [w, h]) => {
        const win = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
        win?.setContentSize(w, h);
      }, [w, h] as const);
      await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(w);
    };
    const theme = async (t: 'light' | 'dark') => {
      await core.send(prefs(t) as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
    };
    // a screen opens from its sidebar row (the window's own way: its router follows no URL)
    const go = async (testId: string) => {
      await page.getByTestId(testId).click();
    };
    await size(1400, 900);
    const head = page.getByTestId('thread.head');
    await expect(head).toBeVisible({ timeout: 10_000 });
    // (1) perf's head
    await expect(page.getByTestId('thread.head.name')).toHaveText('perf');
    await expect(page.getByTestId('thread.head.role')).toHaveText('product page speed');
    await expect(page.getByTestId('thread.head.state')).toHaveText(/^[·~∿≈] working · 14 min$/);
    await expect(page.getByTestId('thread.head.state')).toHaveAttribute('data-needs', 'false');
    // its branch and context are the composer tab's, never the head's too (designer m_24325)
    await expect(page.getByTestId('thread.head.branch')).toHaveCount(0);
    await expect(page.getByTestId('thread.usage')).toHaveCount(0);
    await expect(page.getByTestId('composer.tab.place')).toHaveText('ψsb/perf');
    await expect(page.getByTestId('thread.head.changes')).toHaveText('changes ⌘D');
    await expect(page.getByTestId('thread.more')).toHaveText('⋯');
    const oneRow = await head.evaluate((el) => el.getBoundingClientRect().height);
    expect(oneRow, 'one row').toBeLessThan(60);
    // (2) the rows: commands as mono lines with their length, the rest counted, edits, the artifact chip, the live line
    await expect(page.getByTestId('thread.tool.3')).toHaveText('$ lighthouse --preset=mobile /p/tee-classic38 s');
    await expect(page.getByTestId('thread.tool.4')).toHaveText('$ pnpm trace web/product --cpu=4x1 m 12 s');
    await expect(page.getByTestId('thread.tools.2')).toHaveText(/read 1 file/);
    await expect(page.getByTestId('thread.tool.8')).toHaveText('± web/product/Hero.tsx4 s');
    await expect(page.getByTestId('thread.artifact.10')).toContainText('product page, before / after');
    await expect(page.getByTestId('thread.artifact.10')).toContainText('page · v2');
    // (2) one line, fit-content, no empty thumbnail
    const art = await page.getByTestId('thread.artifact.10').evaluate((el) => ({ h: el.getBoundingClientRect().height, w: el.getBoundingClientRect().width, thumb: el.querySelector('.th') !== null }));
    expect(art.thumb, 'no empty thumbnail box').toBe(false);
    expect(art.h, 'one line').toBeLessThan(36);
    expect(art.w, 'fit-content').toBeLessThan(400);
    // working: no row at the thread's end, the gust beside 'to perf' (designer's desktop-working v2)
    await expect(page.getByTestId('thread.live')).toHaveCount(0);
    await expect(page.locator('.th-screen [data-testid="composer.tab.to"] [data-testid="thread.mark"]')).toHaveCount(1);
    // (4) the composer's words: the label's left, then the gust's cells
    await expect(page.getByTestId('composer.tab.to')).toHaveText(/^to perf[ ·~∿≈]{5}$/);
    await expect(page.locator('[data-testid="composer.field"][aria-placeholder]')).toHaveAttribute('aria-placeholder', 'write to perf, then ⏎');
    // the artifact opens in the window
    await page.getByTestId('thread.artifact.10').click();
    // designer's artifact-open page: the artifact takes the right column, the maker's thread stays
    await expect(page.getByTestId('app.art')).toBeVisible();
    // the artifact's screen has no right bar: back to perf's thread, ⌘[
    await page.keyboard.press('Meta+BracketLeft');
    // 'changes ⌘D' opens the review
    await page.getByTestId('thread.head.changes').click();
    expect(await core.waitCmd((c) => c.cmd === 'diff', 3000)).toMatchObject({ project: P, agent: 'perf' });

    const views: readonly [string, string][] = [
      ['perf', 'app.right.agent.perf'],
      ['search', 'app.right.agent.search'],
      ['bise · storefront', `app.sidebar.project.${P}`],
      ['checkout (empty)', 'app.right.agent.checkout'],
    ];
    for (const t of ['light', 'dark'] as const) {
      await theme(t);
      for (const [label, row] of views) {
        await size(1400, 900);
        await go(row);
        await expect(head).toBeVisible();
        for (const w of [1400, 800]) {
          await size(w, 900);
          if (label === 'search') {
            await expect(page.getByTestId('thread.head.state')).toHaveText('? waiting for you');
            await expect(page.getByTestId('thread.head.state')).toHaveAttribute('data-needs', 'true');
            // designer m_12065 (4): its question docked above the composer, the label in the accent
            if (!(await page.getByTestId('inbox.block.open.1').isVisible())) await page.getByTestId('inbox.block.row.1').click();
            await expect(page.getByTestId('inbox.block.open.1')).toBeVisible();
            await expect(page.getByTestId('thread.starting'), 'a waiting agent is not starting').toHaveCount(0);
            await expect(page.getByTestId('composer.tab.to')).toHaveText(/^answering search · which sizes/);
            await expect(page.getByTestId('composer.tab.end')).toHaveText('esc write to search instead');
            await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-answering', 'true');
          }
          if (label === 'bise · storefront') {
            await expect(page.getByTestId('thread.head.name')).toHaveText('bise · storefront');
            await expect(page.locator('[data-testid="thread.head"] .b-pearl.s14')).toHaveCount(1);
            await expect(page.getByTestId('thread.head.state')).toHaveText('1 waiting for you');
            // (3) its handoffs
            await expect(page.getByTestId('thread.handoff.3')).toHaveText('✚new agent perf · product page speed');
            await expect(page.getByTestId('thread.handoff.4')).toHaveText('✚new agent search · size filter on search');
            // (1) bise's name line carries its 14 px ':*' (bise-presence v10)
            await expect(page.locator('[data-testid="thread.entry.2"] .b-who .b-bise')).toHaveCount(1);
          }
          if (label === 'checkout (empty)') {
            // (5) the empty thread: his first message, then the starting line; the chip says starting
            await expect(page.getByTestId('thread.starting')).toHaveText(/^· ?checkout is starting · its own folder, sb\/checkout$/);
            await expect(page.getByTestId('thread.head.state')).toHaveText('starting');
            // starting: the '·' pulse beside the label, no gust (designer's desktop-working v2 (2))
            await expect(page.getByTestId('thread.mark')).toHaveAttribute('data-state', 'starting');
            // (3) the starting row on the column's edge, like every row
            const dx = await page.evaluate(() => {
              const a = document.querySelector('[data-testid="thread.starting"]')?.getBoundingClientRect();
              const b = document.querySelector('[data-testid="thread.entry.1"]')?.getBoundingClientRect();
              return a && b ? Math.abs(a.left - b.left) : -1;
            });
            expect(dx, 'the starting row starts on the column edge').toBeLessThan(1);
          }
          if (label === 'perf') {
            if (w === 800) await expect(page.getByTestId('thread.head.name'), 'under 1000 px the name goes to the crumb').toBeHidden();
            else await expect(page.getByTestId('thread.head.name')).toBeVisible();
            await expect(page.getByTestId('thread.head.state')).toBeVisible();
            await expect(page.getByTestId('thread.head.changes')).toBeVisible();
          }
          // designer m_12013: each shot its own png at 2x
          await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 2, mobile: false });
          const png = await page.screenshot();
          await cdp.send('Emulation.clearDeviceMetricsOverride');
          writeFileSync(test.info().outputPath(`agent-view-${t}-${String(w)}-${label.replace(/[^a-z]+/g, '-').replace(/-+$/, '')}@2x.png`), png);
          shots.push({ label: `${t} · ${String(w)} · ${label}`, png });
        }
      }
    }
    // a handoff opens its agent's thread
    await size(1400, 900);
    await go(`app.sidebar.project.${P}`);
    await page.getByTestId('thread.handoff.3.name').click();
    await expect(page.getByTestId('thread.head.name')).toHaveText('perf');
    // bise's chip opens the agents list
    await size(1400, 900);
    await go(`app.sidebar.project.${P}`);
    await page.getByTestId('thread.agents').click();
    await expect(page.getByTestId('agents.screen')).toBeVisible();

    await s.app.evaluate(({ BrowserWindow }) => {
      const w = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
      w?.setContentSize(2400, 1500);
    });
    const cells = shots.map((x) => `<figure><figcaption>${x.label}</figcaption><img src="data:image/png;base64,${x.png.toString('base64')}"></figure>`).join('');
    await page.setContent(
      `<style>body{margin:0;background:#777;font:12px ui-monospace,monospace;color:#eee}main{display:flex;flex-wrap:wrap;gap:10px;padding:10px;align-items:flex-start}figure{margin:0}figcaption{margin:0 0 3px}img{display:block;zoom:.4;border-radius:6px}</style><main>${cells}</main>`,
    );
    writeFileSync(test.info().outputPath('agent-head-sheet.png'), await page.screenshot({ fullPage: true }));
  } finally {
    await s.close();
    core.dispose();
  }
});

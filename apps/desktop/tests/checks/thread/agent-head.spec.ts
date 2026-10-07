// thread/agent-head · the agent view's head and composer words (designer's desktop-screens v6 (1),
// (3), (4)). Passes when, in storefront with the scripted core (FakeCore, fake data):
//   - perf's head is one row: 'perf' in 600, its role 'product page speed', the chip '∿ working ·
//     14 min', at the right 'sb/perf' (opens the review), 'changes ⌘D', '⋯';
//   - search, which waits on him, has the chip '? waiting for you' in the accent;
//   - the project's bise reads 'bise · storefront' with its 14 px pearl and the chip '1 waiting
//     for you', which opens the agents list;
//   - the composer says 'to perf' and 'write to perf, then ⏎';
//   - under 1000 px the head keeps the chip and the buttons, the name and role go (the titlebar's
//     crumb says them).
// Writes one sheet (light + dark, 1400 and 800, perf, search, bise · storefront) for designer.
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
const world = (now: number) => {
  const ag = (name: string, over: Record<string, unknown>) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: now - 60 * MIN, waits: 0, ...over });
  return [
    prefs('light'),
    {
      ev: 'projects',
      projects: [
        { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
        { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 3, working: 1, waits: 1, running: true },
      ],
    },
    { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
    {
      ev: 'agents',
      project: P,
      agents: [
        ag('main', {}),
        ag('perf', { status: 'working', since_ms: now - 14 * MIN, purpose: 'product page speed', branch: 'sb/perf', worktree: '/nowhere/wt/perf' }),
        ag('search', { status: 'idle', purpose: 'size filter on search', waits: 1, branch: 'sb/search' }),
      ],
    },
    {
      ev: 'thread',
      project: P,
      agent: 'perf',
      entries: [
        { pos: 1, at_ms: now - 14 * MIN, kind: 'you', text: 'the product page takes 4 s on mobile. find why and fix it, numbers before and after please' },
        { pos: 2, at_ms: now - 13 * MIN, kind: 'agent', text: 'found it: the hero image ships at 2.4 MB, and the reviews widget blocks the first paint while it loads 900 reviews.' },
      ],
      before: null,
      more: false,
    },
    { ev: 'thread', project: P, agent: 'search', entries: [{ pos: 1, at_ms: now - 30 * MIN, kind: 'you', text: 'add a size filter to search' }], before: null, more: false },
    { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: now - 15 * MIN, kind: 'agent', text: 'two jobs, two agents: perf takes the product page, search takes the size filter.' }], before: null, more: false },
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
    await expect(page.getByTestId('thread.head.state')).toHaveText('∿ working · 14 min');
    await expect(page.getByTestId('thread.head.state')).toHaveAttribute('data-needs', 'false');
    await expect(page.getByTestId('thread.head.branch')).toHaveText('sb/perf');
    await expect(page.getByTestId('thread.head.changes')).toHaveText('changes ⌘D');
    await expect(page.getByTestId('thread.more')).toHaveText('⋯');
    const oneRow = await head.evaluate((el) => el.getBoundingClientRect().height);
    expect(oneRow, 'one row').toBeLessThan(60);
    // (4) the composer's words
    await expect(page.locator('.th-screen .b-composer .div')).toHaveText('to perf');
    await expect(page.locator('[data-testid="composer.field"][aria-placeholder]')).toHaveAttribute('aria-placeholder', 'write to perf, then ⏎');
    // the branch opens the review
    await page.getByTestId('thread.head.branch').click();
    expect(await core.waitCmd((c) => c.cmd === 'diff', 3000)).toMatchObject({ project: P, agent: 'perf' });

    const views: readonly [string, string][] = [
      ['perf', 'app.sidebar.agent.perf'],
      ['search', 'app.sidebar.agent.search'],
      ['bise · storefront', `app.sidebar.project.${P}`],
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
          }
          if (label === 'bise · storefront') {
            await expect(page.getByTestId('thread.head.name')).toHaveText('bise · storefront');
            await expect(page.locator('[data-testid="thread.head"] .b-pearl.s14')).toHaveCount(1);
            await expect(page.getByTestId('thread.head.state')).toHaveText('1 waiting for you');
          }
          if (label === 'perf') {
            if (w === 800) await expect(page.getByTestId('thread.head.name'), 'under 1000 px the name goes to the crumb').toBeHidden();
            else await expect(page.getByTestId('thread.head.name')).toBeVisible();
            await expect(page.getByTestId('thread.head.state')).toBeVisible();
            await expect(page.getByTestId('thread.head.changes')).toBeVisible();
          }
          shots.push({ label: `${t} · ${String(w)} · ${label}`, png: await page.screenshot() });
        }
      }
    }
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

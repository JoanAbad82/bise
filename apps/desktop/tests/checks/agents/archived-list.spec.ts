// agents/archived-list · his try on a43609b2 (ambient-lead m_19393): as the TUI, the window's
// /agents lists only the live agents (working, idle, done, blocked) and /archived only the
// archived ones, each with restore. Passes when, on acme (main, perf working, docs done, old
// archived), /agents typed in main's composer shows main, perf and docs, never old, and no
// archived row; /archived shows old alone with its restore, and neither the live ones nor
// '+ new agent'. The scripted core (FakeCore). Owner: amb-home (amb-win's src/agents).
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { panel } from '../../../src/proto/words_panel.gen';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const agent = (name: string, status: string, archived = false) => ({ name, main: name === 'main', status, archived, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
const world = () => [
  {
    ev: 'prefs',
    prefs: {
      onboarded: true,
      theme: 'system',
      context: { shot: true, url: true, file: true, window_text: false },
      excluded_apps: [],
      quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
      voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
      shots_keep_days: 7,
    },
  },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 3, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main', 'idle'), agent('perf', 'working'), agent('docs', 'done'), agent('old', 'done', true)] },
];

const T = {
  screen: '[data-testid="agents.screen"]',
  thread: '[data-testid="thread.screen"]',
  field: '[data-testid="composer.field"]',
  row: (n: string) => `[data-testid="agents.row.${n}"]`,
  restore: (n: string) => `[data-testid="agents.restore.${n}"]`,
};

test('agents/archived-list: /agents lists only the live agents, /archived only the archived ones', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}` });
  try {
    const { page } = s;
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(`pageerror ${e.message}\n${e.stack ?? ''}`));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(`console ${m.text()}`); });
    const dump = async () => { const fs = await import('node:fs'); fs.writeFileSync(test.info().outputPath('errs.txt'), errs.join('\n\n')); };
    page.on('close', () => { void dump(); });
    const run = async (line: string) => {
      await page.locator(`${T.thread} ${T.field}`).click({ timeout: 10_000 });
      await page.keyboard.type(line);
      await page.keyboard.press('Enter');
    };
    await expect(page.locator(T.thread)).toHaveAttribute('data-project', P, { timeout: 10_000 });

    await run('/agents');
    const live = page.locator(`${T.screen}:not([data-archived])`);
    await expect(live, '/agents opens the live list').toBeVisible({ timeout: 5000 });
    for (const n of ['main', 'perf', 'docs']) await expect(live.locator(T.row(n)), `${n} is live`).toBeVisible();
    await expect(live.locator(T.row('old')), 'the archived agent is not in /agents').toHaveCount(0);
    await expect(page.locator('[data-testid="agents.archived"]'), 'no archived row on the live list').toHaveCount(0);
    await expect(live).toContainText('3 live');
    await expect(page.getByTestId('app.title.crumb'), "the crumb: 'acme › agents'").toHaveText(/acme\s*›\s*agents/);

    // the rows (designer m_19489): one line each, the acts on the row at its right before the
    // end; bise's row has none; a finished one is a dim ✓, no dot
    const box = async (sel: string) => {
      const b = await page.locator(sel).boundingBox();
      if (b === null) throw new Error(`${sel} has no box`);
      return b;
    };
    const top = (n: string) => `${T.row(n)} .ag-top`;
    await page.locator(top('perf')).hover();
    for (const act of ['agents.stop.perf', 'agents.archive.perf', 'agents.more.perf']) {
      const r = await box(top('perf'));
      const a = await box(`[data-testid="${act}"]`);
      const mid = a.y + a.height / 2;
      expect(mid > r.y && mid < r.y + r.height, `${act} sits on perf's row, not on a line of its own`).toBe(true);
      const end = await box('[data-testid="agents.end.perf"]');
      expect(a.x + a.width <= end.x, `${act} is before the end`).toBe(true);
    }
    const rowH = (await box(top('perf'))).height;
    expect(rowH, 'a row is one line high').toBeLessThan(40);
    await expect(page.getByTestId('agents.more.main'), "bise's row has no acts").toHaveCount(0);
    await expect(page.locator(`${T.row('main')} .ag-ra`), "bise's row has no acts").toHaveCount(0);
    await expect(page.locator(`${T.row('docs')} .b-dot`), 'docs (done) has no dot').toHaveCount(0);
    await expect(page.locator(`${T.row('docs')} [aria-label="done"]`), 'docs is a dim ✓').toHaveText('✓');

    // frames for designer: light and dark at 1100, perf hovered so its acts show
    const size = async (w: number, h: number) => {
      await s.app.evaluate(({ BrowserWindow }, [w, h]) => {
        const win = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
        win?.setContentSize(w, h);
      }, [w, h] as const);
      await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(w);
    };
    const theme = async (t: 'light' | 'dark') => {
      const p = world()[0] as { ev: string; prefs: Record<string, unknown> };
      await core.send({ ev: 'prefs', prefs: { ...p.prefs, theme: t } } as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
    };
    const frames = async (name: string, hover: string) => {
      await size(1100, 720);
      for (const t of ['light', 'dark'] as const) {
        await theme(t);
        await page.locator(hover).hover();
        await page.screenshot({ path: test.info().outputPath(`${name}-${t}-1100.png`) });
      }
    };
    await frames('agents', top('perf'));

    // back to main's thread, then /archived, as he would type it
    await page.locator(`[data-testid="app.sidebar.project.${P}"]`).click();
    await expect(page.locator(T.thread), "the project's row opens main's thread").toBeVisible({ timeout: 5000 });
    await run('/archived');
    const arch = page.locator(`${T.screen}[data-archived="true"]`);
    await expect(arch, '/archived opens the archived list').toBeVisible({ timeout: 5000 });
    await expect(arch.locator(T.row('old')), 'old is under /archived').toBeVisible();
    await expect(arch.locator(T.restore('old')), 'with its restore').toBeVisible();
    for (const n of ['main', 'perf', 'docs']) await expect(arch.locator(T.row(n)), `${n} is not archived`).toHaveCount(0);
    await expect(page.getByTestId('agents.new'), "no '+ new agent' on the archived list").toHaveCount(0);
    await expect(arch).toContainText(panel.archived_count({ n: 1 }));
    await expect(page.getByTestId('app.title.crumb'), "the crumb: 'acme › archived'").toHaveText(/acme\s*›\s*archived/);
    // an archived row: its name, restore on the same row, then its end dim: '✓ done · <age>'
    await expect(page.getByTestId('agents.end.old')).toHaveText(/^✓ done · /);
    {
      const r = await box(top('old'));
      const a = await box(T.restore('old'));
      expect(a.y + a.height / 2 > r.y && a.y + a.height / 2 < r.y + r.height, 'restore sits on its row').toBe(true);
    }
    await frames('archived', top('old'));
  } finally {
    await s.close();
    core.dispose();
  }
});

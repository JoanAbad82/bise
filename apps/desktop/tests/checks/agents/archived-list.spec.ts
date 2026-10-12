// agents/archived-list · his try on a43609b2 (ambient-lead m_19393): as the TUI, the window's
// /agents lists only the live agents (working, idle, done, blocked) and /archived only the
// archived ones, each with restore. Passes when, on acme (main, perf working, docs done, old
// archived), /agents typed in main's composer shows main, perf and docs, never old, and no
// archived row; /archived shows old alone with its restore, and neither the live ones nor
// '+ new agent'. The scripted core (FakeCore). Owner: amb-home (amb-win's src/agents).
import { FakeCore, launchDesktop, test, expect } from '../../harness';

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
    await page.screenshot({ path: test.info().outputPath('agents.png') });

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
    await expect(arch).toContainText('1 archived');
    await page.screenshot({ path: test.info().outputPath('archived.png') });
  } finally {
    await s.close();
    core.dispose();
  }
});

// terminal/early · ambient-lead m_21602 (his b51422c0 try): ts-pattern's panel said 'the terminal
// could not start: no folder for this project' under a head that named its folder. At launch the
// window names its project (its kept route, the panel kept open) before the core, which waits
// for his login env, said its first projects: main answered 'no folder' from rows not there yet,
// and the panel never asks twice. Here the window starts on a project's thread with no projects
// row anywhere, ⌃` opens the panel, the row comes after: the shell must come up in that folder,
// the one the head names. Needs a built bise with `pty` (BISE_CHECK_BISE, as terminal/panel).
// Owner: amb-mac (main's term/host.ts).
import { existsSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import { FakeCore, FakeHelper, launchDesktop, test, expect } from '../../harness';
import { Lines } from '../native/world';

const P = 'ts-pattern-4b4afb4c';
const OPEN = 'bise-desktop: term';

function bise(): string | undefined {
  const set = process.env['BISE_CHECK_BISE'];
  if (set !== undefined && set.startsWith('/')) return set;
  const repo = path.resolve(__dirname, '..', '..', '..', '..');
  return ['release', 'debug'].map((k) => path.join(repo, 'rust', 'target', k, 'bise')).find((p) => existsSync(p));
}

const prefs = {
  onboarded: true,
  theme: 'system',
  context: { shot: true, url: true, file: true, window_text: false },
  excluded_apps: [],
  quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
  voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
  shots_keep_days: 7,
};

// the core's start with no projects event: its rows come late, as after a slow ~/.zshrc
const world = () => [
  { ev: 'prefs', prefs },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere', name: 'ts-pattern' },
  { ev: 'agents', project: P, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 }] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'hello' }], before: null, more: false },
];

const projects = (dir: string) => ({
  ev: 'projects',
  projects: [{ project: P, name: 'ts-pattern', path: dir, git: false, home: false, order: 0, agents: 1, working: 0, waits: 0, running: true }],
});

test("terminal/early: a panel opened before the core's projects rows waits for them, then runs in the folder its head names", async () => {
  const bin = bise();
  test.skip(bin === undefined, 'no built bise with `pty` (set BISE_CHECK_BISE)');
  test.setTimeout(60_000);
  const helper = new FakeHelper();
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ helper, core, route: `project/${P}`, env: { BISE_DESKTOP_PTY: bin ?? '' } });
  const out = new Lines();
  s.app.process().stdout?.setEncoding('utf8');
  s.app.process().stdout?.on('data', (d: string) => {
    out.push(d);
  });
  try {
    const page = s.page;
    const home = await s.app.evaluate(() => process.env['HOME'] ?? '');
    expect(home, "the run's home").toMatch(/^\//);
    // in the run's jail (BISE_TEST_HOME), where `bise pty` may run
    const dir = mkdtempSync(path.join(home, 'ts-pattern-'));
    // no row yet: the route's thread is a skeleton (App.tsx ProjectThread), the panel still names it
    await expect(page.locator('.b-skel').first(), "the project's screen waits for its row").toBeAttached({ timeout: 10_000 });
    await expect(page.getByTestId('composer.field')).toHaveCount(0);

    await page.keyboard.press('Control+Backquote');
    const screen = page.getByTestId('terminal.screen');
    await expect(screen, '⌃` opens the panel, its shell asked for').toBeVisible({ timeout: 3000 });
    // no row yet: main waits, never 'no folder'
    await page.waitForTimeout(1500);
    await expect(page.getByTestId('terminal.failed'), 'no failure before the rows came').toHaveCount(0);
    await expect(screen).toHaveAttribute('data-state', 'opening');
    expect(out.of(OPEN).length, 'no shell before its folder is known').toBe(0);

    // the project's row comes (as a project added after launch does)
    await core.send(projects(dir) as unknown as Parameters<FakeCore['send']>[0]);
    await expect(screen, 'the shell comes up').toHaveAttribute('data-state', 'live', { timeout: 10_000 });
    await out.wait(OPEN, (l) => l.includes(`"${P}" open`), 5000);
    await expect(page.getByTestId('terminal.head'), 'the head names its folder').toContainText(path.basename(dir));
    const rows = page.locator('[data-testid="terminal.screen"] .xterm-rows');
    await page.keyboard.type('pwd');
    await page.keyboard.press('Enter');
    await expect(rows, 'the shell runs in the folder the head names').toContainText(path.basename(dir), { timeout: 5000 });
    await expect(page.getByTestId('terminal.failed')).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('terminal-early.png') });
  } finally {
    await s.close();
    helper.dispose();
    core.dispose();
  }
});

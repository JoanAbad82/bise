// terminal/panel · bar T W25/V13/K26/M16: ⌃` shows a terminal panel under the thread, a real
// shell in the project's folder; what he types runs there; hidden then shown again it is the
// same shell (its variables kept). Owner: amb-win (lead m_10214). The new app on the scripted
// core (one project whose folder is a throwaway dir), main's real `bise pty` (amb-mac 339d3e5e)
// with /bin/sh in test mode; main's stdout line 'bise-desktop: term "<id>" open' read outside
// the page. Needs a built bise with `pty`: BISE_CHECK_BISE=<abs path>, else this repo's
// rust/target/{debug,release}/bise; none: skipped (said why).
import { existsSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import { FakeCore, FakeHelper, launchDesktop, test, expect } from '../../harness';
import { Lines } from '../native/world';

const HOME = 'bise-home-00000000';
const OPEN = 'bise-desktop: term';

function bise(): string | undefined {
  const set = process.env['BISE_CHECK_BISE'];
  if (set !== undefined && set.startsWith('/')) return set;
  const repo = path.resolve(__dirname, '..', '..', '..', '..');
  return ['release', 'debug'].map((k) => path.join(repo, 'rust', 'target', k, 'bise')).find((p) => existsSync(p));
}

const projects = (dir: string) => ({
  ev: 'projects',
  projects: [{ project: HOME, name: 'bise', path: dir, git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }],
});

const world = () => [
  // an onboarded home: the window opens on bise's thread, not the onboarding
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
  projects('/nowhere'),
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 }] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'hello' }], before: null, more: false },
];

test('terminal/panel: ⌃` opens a shell under the thread, hide and show keep the same shell', async () => {
  const bin = bise();
  test.skip(bin === undefined, 'no built bise with `pty` (set BISE_CHECK_BISE)');
  test.setTimeout(60_000);
  const helper = new FakeHelper();
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  // the scripted core runs from BISE_DESKTOP_BISE, the shells from a real bise (BISE_DESKTOP_PTY, amb-mac 93e1b19f)
  const s = await launchDesktop({ helper, core, env: { BISE_DESKTOP_PTY: bin ?? '' } });
  const out = new Lines();
  s.app.process().stdout?.setEncoding('utf8');
  s.app.process().stdout?.on('data', (d: string) => {
    out.push(d);
  });
  try {
    {
      const page = s.page;
      // `bise pty` runs only inside the run's jail (BISE_TEST_HOME = the app's HOME): the
      // project's folder goes there, said to the window as the core would
      const home = await s.app.evaluate(() => process.env['HOME'] ?? '');
      expect(home, "the run's home").toMatch(/^\//);
      const dir = mkdtempSync(path.join(home, 'term-panel-'));
      await core.send(projects(dir) as unknown as Parameters<FakeCore['send']>[0]);
      await expect(page.getByTestId('composer.field'), 'the thread is up').toBeVisible({ timeout: 10_000 });
      const panel = page.getByTestId('terminal.panel');
      await expect(panel, 'no panel before ⌃`').toHaveCount(0);

      await page.keyboard.press('Control+Backquote');
      await expect(panel, '⌃` shows the panel').toBeVisible({ timeout: 3000 });
      await expect(page.getByTestId('terminal.screen'), 'its shell runs').toHaveAttribute('data-state', 'live', { timeout: 10_000 });
      await out.wait(OPEN, (l) => l.includes(`"${HOME}" open`), 5000);
      const rows = page.locator('[data-testid="terminal.screen"] .xterm-rows');

      // every key goes to the shell: it computes, so what shows is its answer, not his echo
      await page.keyboard.type('X=bise7; echo hi; echo $((6*7)); pwd\n');
      await expect(rows, 'echo hi printed hi').toContainText(/^hi$|\bhi\b/m, { timeout: 5000 });
      await expect(rows, 'the shell computed 42').toContainText('42');
      await expect(rows, "it runs in the project's folder").toContainText(path.basename(dir));

      await page.keyboard.press('Control+Backquote');
      await expect(panel, '⌃` hides it').toBeHidden({ timeout: 3000 });
      await page.keyboard.press('Control+Backquote');
      await expect(panel, '⌃` shows it again').toBeVisible({ timeout: 3000 });
      await page.keyboard.type('echo got-$X\n');
      await expect(rows, 'the same shell: its variable is still set').toContainText('got-bise7', { timeout: 5000 });
      expect(out.of(OPEN).filter((l) => l.includes(' open')).length, 'one shell opened, never a second').toBe(1);
      await page.screenshot({ path: test.info().outputPath('terminal.png') });
    }
  } finally {
    await s.close();
    helper.dispose();
    core.dispose();
  }
});

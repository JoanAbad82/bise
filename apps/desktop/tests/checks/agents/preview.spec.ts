// agents/preview · W6/K18 (bar: space on a selected agent shows its feed in place; the TUI's panel
// selection + space, sb/keys.rs:144). Passes when, on acme's agents list, ↓↓ selects perf, space
// shows perf's feed under its row without leaving the list (the window follows perf's thread
// while it shows), space again closes it and stops following, and ⏎ opens perf's thread. The
// scripted core (FakeCore). Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: name === 'perf' ? 'find why p99 rises' : '', since_ms: 1791100000000, waits: 0 });
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
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf')] },
];
type Cmd = { cmd?: string; agent?: string };

test("agents/preview: space on a selected agent shows its feed in place, space again closes it, ⏎ opens it", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agents/${P}` });
  try {
    const { page } = s;
    await expect(page.getByTestId('agents.row.perf')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('agents.screen').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByTestId('agents.row.perf'), 'perf selected').toHaveAttribute('data-sel', 'true');
    await page.keyboard.press('Space');
    await core.waitCmd((c) => (c as Cmd).cmd === 'subscribe' && (c as Cmd).agent === 'perf');
    await core.send({ ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'p99 rises with the cold cache' }], before: null, more: false } as never);
    const peek = page.getByTestId('agents.peek.perf');
    await expect(peek, "perf's feed in place").toContainText('p99 rises with the cold cache', { timeout: 5000 });
    await expect(page.getByTestId('agents.screen'), 'still on the list').toBeVisible();
    // under its row
    const row = (await page.getByTestId('agents.open.perf').boundingBox()) ?? { y: 0, height: 0 };
    const box = (await peek.boundingBox()) ?? { y: -1 };
    expect(box.y).toBeGreaterThanOrEqual(row.y + row.height - 1);
    await page.screenshot({ path: test.info().outputPath('peek.png') });

    await page.keyboard.press('Space');
    await expect(peek, 'space again closes it').toHaveCount(0);
    await core.waitCmd((c) => (c as Cmd).cmd === 'unsubscribe' && (c as Cmd).agent === 'perf');

    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="thread.screen"][data-agent="perf"]'), '⏎ opens its thread').toBeVisible({ timeout: 5000 });
  } finally {
    await s.close();
    core.dispose();
  }
});

// thread/hover-time · M14 (the TUI's BISE-271, input.rs:304: a move shows the time of the turn
// under the mouse). Passes when, in acme's main thread, an old turn (a tools row with no time of
// its own) shows nothing until the mouse is on it, then its day and time ('12 Oct 07:00'), and a
// turn of today shows its clock only; the time goes when the mouse leaves. The scripted core
// (FakeCore). Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const OLD = Date.UTC(2025, 9, 12, 7, 0);
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
const world = (today: number) => [
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
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main')] },
  {
    ev: 'thread',
    project: P,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: OLD, kind: 'tools', text: 'read 3 files', tools: [{ name: 'read', text: 'src/a.rs' }] },
      { pos: 2, at_ms: today, kind: 'agent', text: 'all good today' },
    ],
    before: null,
    more: false,
  },
];

test('thread/hover-time: an old turn shows its day and time under the mouse, a turn of today its clock', async () => {
  const today = Date.now();
  const core = new FakeCore(world(today) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}` });
  try {
    const { page } = s;
    const old = page.getByTestId('thread.entry.1');
    await expect(old).toBeVisible({ timeout: 10_000 });
    // ambient m_11777 (amb-home): the time sits on the name line, the day on its separator
    const clockOf = (ms: number) => page.evaluate((ms) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(ms), ms);
    await expect(page.getByTestId('thread.who.1')).toContainText(await clockOf(OLD));
    const day = await page.evaluate((ms) => new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(ms).replace(',', '').toLowerCase(), OLD);
    await expect(page.getByTestId('thread.day.1')).toHaveText(day);
    await page.screenshot({ path: test.info().outputPath('hover-old.png') });
    await expect(page.getByTestId('thread.day.2')).toHaveText('today');
    await expect(page.locator('[data-testid="thread.entry.2"] .b-who').first()).toContainText(await clockOf(today));
  } finally {
    await s.close();
    core.dispose();
  }
});

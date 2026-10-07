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
    const when = page.getByTestId('thread.when.1');
    await expect(when, 'hidden until hovered').toHaveCSS('opacity', '0');
    await old.hover();
    await expect(when, 'shown under the mouse').toHaveCSS('opacity', '1');
    const want = await page.evaluate((ms) => `${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(ms)} ${new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(ms)}`, OLD);
    await expect(when).toHaveText(want);
    await page.screenshot({ path: test.info().outputPath('hover-old.png') });
    await page.getByTestId('thread.entry.2').hover();
    await expect(when, 'gone when the mouse leaves').toHaveCSS('opacity', '0');
    const clockNow = await page.evaluate((ms) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(ms), today);
    await expect(page.getByTestId('thread.when.2')).toHaveText(clockNow);
  } finally {
    await s.close();
    core.dispose();
  }
});

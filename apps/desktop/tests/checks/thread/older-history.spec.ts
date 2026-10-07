// thread/older-history · ambient's re-look (lead m_10729 (a), m_10836: keep the hub's pos order).
// Passes when a page of older history that arrives after the newer rows goes on top, in pos order,
// never after the newest row, and the row he was reading stays where it was. perf's thread on the
// scripted core (FakeCore): its newest page (pos 20-39, more before it), he scrolls to the top, the
// window asks the core for the page before pos 20, the check answers with pos 1-19. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
const entry = (pos: number) => ({ pos, at_ms: 1791100000000 + pos * 1000, kind: pos % 2 === 0 ? 'agent' : 'you', text: `row ${String(pos)}: ${'words '.repeat(12)}` });
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => entry(a + i));
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

test('thread/older-history: an older page arriving later goes on top in pos order; what he reads stays put', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  try {
    const { page } = s;
    // its newest page once the window follows perf: `before` is its oldest pos, as there is more
    // (hub.rs); the stub would hold a page with a `before` for a page ask, so the check sends it
    await core.waitCmd((c) => c.cmd === 'subscribe' && c.agent === 'perf', 10_000);
    await core.send({ ev: 'thread', project: P, agent: 'perf', entries: range(20, 39), before: 20, more: true } as never);
    await expect(page.getByTestId('thread.entry.39')).toBeVisible({ timeout: 10_000 });
    // he scrolls up to the oldest row he has
    const list = page.getByTestId('thread.screen').locator('[data-testid="thread.entry.39"]');
    await list.hover();
    for (let i = 0; i < 30; i++) await page.mouse.wheel(0, -800);
    const ask = (await core.waitCmd((c) => c.cmd === 'page' && c.agent === 'perf', 5000)) as unknown as { before: number };
    expect(ask.before, 'the page before the oldest row').toBe(20);
    const anchor = page.getByTestId('thread.entry.20');
    await expect(anchor).toBeVisible();
    const y0 = (await anchor.boundingBox())?.y ?? -1;

    await core.send({ ev: 'thread', project: P, agent: 'perf', entries: range(1, 19), before: 20, more: false } as never);
    await expect(page.getByTestId('thread.entry.19'), 'the older page is drawn').toBeAttached({ timeout: 3000 });
    const y1 = (await anchor.boundingBox())?.y ?? -1;
    // react-virtuoso's prepend keeps it within a few px (7 px measured on 41 px rows, not a jump):
    // less than half a row, so the line he reads stays where his eyes are
    expect(Math.abs(y1 - y0), `the row he was reading stays put (moved ${String(y1 - y0)} px)`).toBeLessThan(20);
    const order = await page.locator('[data-testid^="thread.entry."]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-testid')?.split('.')[2])));
    expect(order, 'rows in pos order').toEqual([...order].sort((a, b) => a - b));
    expect(Math.max(...order.filter((p) => p < 20)), 'the older rows come before the newer ones').toBeLessThan(Math.min(...order.filter((p) => p >= 20)));
    await page.screenshot({ path: test.info().outputPath('older-on-top.png') });
  } finally {
    await s.close();
    core.dispose();
  }
});

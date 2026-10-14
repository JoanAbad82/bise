// thread/pause-seconds · a pause under a minute counts its seconds (reply-clock, try-gate-e812's
// red). search's sb ask to perf has held past 25 s: the hub leaves a `reply` watch counted from
// the ask (ask-wait). The agents event comes after the window's clock started, so its instant is
// newer than the minute clock's `now`: before, the line over the composer, the head chip and the
// AGENTS row read '0 s' and stayed there up to a minute. Passes when, within 8 s, the line reads
// 'continues when perf answers · N s', the head '… waiting · N s' and the row's end 'N s', N >= 3.
// Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'acme-1a2b3c4d';
const MIN = 60_000;
const prefs = { ev: 'prefs', prefs: { onboarded: true, theme: 'light', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 } };
const ag = (name: string, over: Record<string, unknown> = {}) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: Date.now() - 30 * MIN, waits: 0, watching: [], model: 'anthropic/claude-opus-5-5', effort: 'high', ...over });
const agents = (asked: number | null) => ({
  ev: 'agents',
  project: P,
  agents: [ag('main'), ag('perf'), ag('search', { purpose: 'search ranking', watching: asked === null ? [] : [{ id: 7, kind: 'reply', what: 'perf', since_ms: asked, resumes: true, until_ms: asked + 24 * 60 * MIN }] })],
});
const world = () => [
  prefs,
  {
    ev: 'projects',
    projects: [
      { project: 'bise-home-00000000', name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 3, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'models', project: P, items: [{ id: 'anthropic/claude-opus-5-5', label: 'opus 5.5', provider: 'Anthropic', short: '1M', context: 1000000, vision: true, efforts: ['low', 'medium', 'high'], default_effort: 'high', default_for: ['main', 'agents'] }] },
  { ev: 'approvals', project: P, mode: 'yolo', env: false, checker: '', checker_who: '', repo: '/nowhere/acme', rules: [] },
  agents(null),
  { ev: 'thread', project: P, agent: 'search', entries: [{ pos: 1, at_ms: Date.now() - 4 * MIN, kind: 'agent', text: 'i asked perf for the page weights.' }], before: null, more: false },
];

const secs = (t: string | null, re: RegExp): number => Number(re.exec(t ?? '')?.[1] ?? -1);

test('thread/pause-seconds: a reply pause under a minute counts from the ask, to the second', async () => {
  test.setTimeout(60_000);
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/search`, size: '1400x760' });
  try {
    const { page } = s;
    await expect(page.getByTestId('thread.head.state')).toBeVisible({ timeout: 10_000 });
    // the window's clock runs; a second later the hold ends and the hub sets the reply watch, from the ask
    await page.waitForTimeout(1500);
    await core.send(agents(Date.now() - 500) as never);
    const line = page.getByTestId('thread.waiting');
    await expect(line).toHaveText(/^continues when perf answers · \d+ s$/u, { timeout: 5000 });
    const row = page.getByTestId('app.panel').getByTestId('app.right.agent.search');
    await expect.poll(async () => secs(await line.textContent(), /· (\d+) s$/u), { timeout: 8000, message: 'the line counts' }).toBeGreaterThanOrEqual(3);
    await expect.poll(async () => secs(await page.getByTestId('thread.head.state').textContent(), /^… waiting · (\d+) s$/u), { timeout: 3000, message: 'the head counts' }).toBeGreaterThanOrEqual(3);
    await expect.poll(async () => secs(await row.locator('.app-rb-end').textContent(), /^(\d+) s$/u), { timeout: 3000, message: 'the AGENTS row counts' }).toBeGreaterThanOrEqual(3);
  } finally {
    await s.close();
    core.dispose();
  }
});

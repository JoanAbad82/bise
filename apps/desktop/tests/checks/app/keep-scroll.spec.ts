// app/keep-scroll · lead m_12068 / m_12126, keep's known gap: a list's scroll comes back after a
// reload (keep.ts useKeptScroll: the sidebar, the agents list, changes, PRs, a feature, a review,
// environments). Passes when, with a long sidebar (22 projects of 6 agents), he scrolls it down,
// the page reloads, and the sidebar is back at the same place (within 2 px); scrolled back to the
// top, a reload keeps the top. The scripted core (FakeCore). Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const ids = 'abcdefghijklmnopqrstuv'.split('').map((x) => `${x}proj-1a2b3c4${x}`);
const agent = (name: string) => ({ name, main: name === 'main', status: 'working', archived: false, title: '', purpose: '', since_ms: Date.now() - 60_000, waits: 0 });
const world = () => [
  {
    ev: 'prefs',
    prefs: { onboarded: true, theme: 'system', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
  },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      ...ids.map((p, i) => ({ project: p, name: p.slice(0, 5), path: `/nowhere/${p}`, git: true, home: false, order: i + 1, agents: 6, working: 5, waits: 0, running: true })),
    ],
  },
  ...ids.map((p) => ({ ev: 'agents', project: p, agents: ['main', 'one', 'two', 'three', 'four', 'five'].map(agent) })),
];

test('app/keep-scroll: the sidebar comes back where he scrolled it after a reload; the top stays the top', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'bise' });
  try {
    const { page } = s;
    const side = page.getByTestId('app.sidebar');
    await expect(page.getByTestId(`app.sidebar.project.${ids[21] ?? ''}`)).toBeAttached({ timeout: 10_000 });
    const top = () => side.evaluate((el) => el.scrollTop);
    await side.evaluate((el) => {
      el.scrollTop = 600;
      el.dispatchEvent(new Event('scroll'));
    });
    const was = await top();
    expect(was, 'scrolled down').toBeGreaterThan(300);
    // past the keep's 300 ms write
    await page.waitForTimeout(600);
    await page.reload();
    await expect(page.getByTestId(`app.sidebar.project.${ids[21] ?? ''}`)).toBeAttached({ timeout: 10_000 });
    await expect.poll(top, { timeout: 3000, message: 'back where he was' }).toBeGreaterThan(was - 3);
    expect(await top()).toBeLessThan(was + 3);

    await side.evaluate((el) => {
      el.scrollTop = 0;
      el.dispatchEvent(new Event('scroll'));
    });
    await page.waitForTimeout(600);
    await page.reload();
    await expect(page.getByTestId(`app.sidebar.project.${ids[21] ?? ''}`)).toBeAttached({ timeout: 10_000 });
    await page.waitForTimeout(500);
    expect(await top(), 'the top stays the top').toBe(0);
  } finally {
    await s.close();
    core.dispose();
  }
});

// thread/demo-tour · L25 / S37 (amb-kit's tour.ts bc079acf, amb-win's useTour holder): while bise's
// demo runs, a tip says what to press. Passes when, on acme's main thread, demo agents that appear
// after the window opened bring the 'start' tip under the first one's sidebar row (its ⌥ number
// as a key), a click into that agent's thread swaps it for the 'inside' tip at the thread's top,
// and his send there ends that tip (it counts as done). The scripted core (FakeCore). Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const agent = (name: string, purpose = '') => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose, since_ms: 1791100000000, waits: 0 });
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
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main')] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'hello' }], before: null, more: false },
];

test('thread/demo-tour: the demo team brings the start tip, its thread the inside tip, his send ends it', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}` });
  try {
    const { page } = s;
    await expect(page.getByTestId('thread.screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('setup.tip.start'), 'no tip before the demo').toHaveCount(0);
    // the demo's team appears (bise-demo's spawns: objectives start with 'bise demo')
    await core.send({ ev: 'agents', project: P, agents: [agent('main'), agent('designer', 'bise demo: the designer'), agent('pm', 'bise demo: the pm')] } as never);
    const start = page.getByTestId('setup.tip.start');
    await expect(start, 'the start tip').toBeVisible({ timeout: 5000 });
    await expect(start).toContainText('looks inside designer');
    await expect(start).toContainText('⌥1');
    // it sits right under designer's row in the sidebar
    const row = (await page.getByTestId('app.right.agent.designer').boundingBox()) ?? { y: 0, height: 0 };
    const tip = (await start.boundingBox()) ?? { y: -1 };
    expect(tip.y, 'under its row').toBeGreaterThanOrEqual(row.y + row.height - 1);
    await page.screenshot({ path: test.info().outputPath('start.png') });

    await page.getByTestId('app.right.agent.designer').click();
    const inside = page.getByTestId('setup.tip.inside');
    await expect(inside, "the inside tip in designer's thread").toBeVisible({ timeout: 5000 });
    await expect(inside).toContainText("this is designer's own thread");
    await expect(page.getByTestId('setup.tip.start')).toHaveCount(0);
    // designer's thread has no page yet (the scripted core sends none): the tip still sits at its top, under the head
    const screen = (await page.getByTestId('thread.screen').boundingBox()) ?? { y: 0 };
    const top = (await inside.boundingBox()) ?? { y: 1e9 };
    expect(top.y - screen.y, 'at the top of the thread, under its head').toBeLessThan(120);
    await page.screenshot({ path: test.info().outputPath('inside.png') });

    await page.locator('[data-testid="composer.field"]').first().click();
    await page.keyboard.type('hi designer');
    await page.keyboard.press('Enter');
    await core.waitCmd((c) => (c as { cmd?: string }).cmd === 'send');
    await expect(inside, 'his send ends the tip').toHaveCount(0, { timeout: 3000 });
  } finally {
    await s.close();
    core.dispose();
  }
});

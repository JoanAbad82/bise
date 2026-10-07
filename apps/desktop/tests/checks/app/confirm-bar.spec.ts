// app/confirm-bar · bar I9/C46/S30 (amb-home's ConfirmBar bee17626, m_10825/m_10919): the hub's
// yes/no question shows under the screen he is on, for the project in view. Passes when acme's
// agents screen shows '@perf is working: archive it anyway? (y/n)' as the confirm bar, y reaches
// the core as {cmd confirm, id 3, yes true} and the bar goes; bise's own screen (another project)
// shows no bar. The scripted core (FakeCore) with the question in its world. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const agent = (name: string) => ({ name, main: name === 'main', status: name === 'perf' ? 'working' : 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
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
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf')] },
];

test("app/confirm-bar: the hub's yes/no question shows under acme's screen; y answers it", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agents/${P}` });
  try {
    const { page } = s;
    // the question comes to this window once it is up (a hello clears older ones, as the store says)
    await expect(page.getByTestId('agents.screen')).toBeVisible({ timeout: 10_000 });
    await core.send({ ev: 'confirm', project: P, id: 3, text: '@perf is working: archive it anyway? (y/n)' } as never);
    const bar = page.getByTestId('confirm.bar');
    await expect(bar, 'the question under the agents screen').toBeVisible({ timeout: 10_000 });
    await expect(bar).toContainText('archive it anyway?');
    await page.screenshot({ path: test.info().outputPath('confirm.png') });
    await page.keyboard.press('y');
    const cmd = await core.waitCmd((c) => c.cmd === 'confirm', 3000);
    expect(cmd).toMatchObject({ project: P, id: 3, yes: true });
    await expect(bar, 'answered: it goes').toBeHidden({ timeout: 2000 });
  } finally {
    await s.close();
    core.dispose();
  }
});

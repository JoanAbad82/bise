// agents/model-setup · bar L5 (amb-kit 6078b20c, lead m_10891): a model whose provider has no
// key or sign-in yet is never set blindly. Passes when, in p99's tune, a pick of Mistral's devstral
// (key_ready false) opens settings · models and the core gets no model command, and a pick of a
// ready model (opus) is sent at once. The scripted core (FakeCore); the models event as the hub
// sends it, with key_ready and provider_id. Owner: amb-win.
import { FakeCore, FakeHelper, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const agent = (name: string, over: Record<string, unknown> = {}) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0, ...over });

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
  { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: '/nowhere', git: true, home: true, order: 0, agents: 2, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [agent('main'), agent('p99', { model: 'openai/gpt-5', effort: 'medium' })] },
];

type Ev = Parameters<FakeCore['send']>[0];

const MODELS = {
  ev: 'models',
  project: HOME,
  items: [
    { id: 'anthropic/claude-opus-5-5', label: 'opus 5.5', provider: 'Anthropic', short: '1M', context: 1000000, provider_id: 'anthropic', key_ready: true },
    { id: 'mistral/devstral-medium-latest', label: 'devstral medium', provider: 'Mistral', short: '128k', context: 128000, provider_id: 'mistral', key_ready: false },
  ],
};

test("agents/model-setup: a model with no key opens its setup and sends nothing; a ready one is sent", async () => {
  const helper = new FakeHelper();
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ helper, core, route: `agents/${HOME}` });
  try {
    const { page } = s;
    await expect(page.getByTestId('agents.row.p99')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('agents.more.p99').click();
    await core.send(MODELS as unknown as Ev);
    await page.getByTestId('agents.model.p99.pick.anthropic/claude-opus-5-5').click();
    expect(await core.waitCmd((c) => c.cmd === 'model', 3000), 'a ready model goes at once').toMatchObject({ project: HOME, agent: 'p99', model: 'anthropic/claude-opus-5-5' });
    const before = core.cmds().filter((c) => c.cmd === 'model').length;
    await page.getByTestId('agents.model.p99.pick.mistral/devstral-medium-latest').click();
    await expect(page.getByTestId('settings.root'), "its provider's setup opens").toBeVisible({ timeout: 3000 });
    await page.screenshot({ path: test.info().outputPath('setup.png') });
    expect(core.cmds().filter((c) => c.cmd === 'model').length, 'nothing set before the key').toBe(before);
  } finally {
    await s.close();
    helper.dispose();
    core.dispose();
  }
});

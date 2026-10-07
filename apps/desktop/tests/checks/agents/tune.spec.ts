// agents/tune · bar A.1 and A.5 (amb-feed 6cb6c0ef's typed new / rename / model / effort): from
// the agents list, '+ new agent' sends `new` with his brief, name and worktree, and the new row
// comes from the agents event; an agent's '…' renames it inline, sets its reasoning and model
// from its row's values, and a refusal shows its words in place. Owner: amb-win (lead m_10413).
// The new app on the scripted core; the commands read outside the page, in the core's log.
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

// the hub's models event as the proto fixture has it (rust/proto/fixtures/hub_ev.jsonl)
const MODELS = {
  ev: 'models',
  project: HOME,
  items: [
    { id: 'anthropic/claude-opus-5-5', label: 'opus 5.5', provider: 'Anthropic', short: '1M', context: 1000000, vision: true, efforts: ['low', 'medium', 'high', 'max'], default_effort: 'high', default_for: ['main', 'agents'] },
    { id: 'mistral/devstral-medium-latest', label: 'devstral medium', provider: 'Mistral', short: '128k · config.toml', context: 128000, config: true, vision: false },
    { id: 'opus', label: 'opus', provider: '', short: '= anthropic/claude-opus-5-5', alias_of: 'anthropic/claude-opus-5-5' },
  ],
};

test('agents/tune: + new agent starts one; … renames it, sets its reasoning and model; a refusal shows in place', async () => {
  const helper = new FakeHelper();
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ helper, core, route: `agents/${HOME}` });
  try {
    const { page } = s;
    await expect(page.getByTestId('agents.row.p99')).toBeVisible({ timeout: 10_000 });

    // A.1: the sheet, ⏎ sends new, the row comes from the hub's agents event
    await page.getByTestId('agents.new').click();
    await page.getByTestId('agents.new.name').fill('cart');
    await page.getByTestId('agents.new.worktree').check();
    await page.getByTestId('agents.new.brief').fill('fix the cart totals');
    await page.getByTestId('agents.new.brief').press('Enter');
    expect(await core.waitCmd((c) => c.cmd === 'new', 5000)).toMatchObject({ cmd: 'new', project: HOME, brief: 'fix the cart totals', name: 'cart', worktree: true });
    await core.send({ ev: 'agents', project: HOME, agents: [agent('main'), agent('p99', { model: 'openai/gpt-5', effort: 'medium' }), agent('cart', { status: 'working' })] } as unknown as Ev);
    await expect(page.getByTestId('agents.row.cart'), 'the new agent shows').toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('agents.newsheet'), 'the sheet closes').toHaveCount(0);

    // A.5: reasoning and model from its row's values, then set
    await page.getByTestId('agents.more.p99').click();
    await expect(page.getByTestId('agents.model.p99')).toHaveValue('openai/gpt-5');
    await expect(page.getByTestId('agents.effort.p99.medium')).toHaveAttribute('aria-checked', 'true');
    await page.getByTestId('agents.effort.p99.high').click();
    expect(await core.waitCmd((c) => c.cmd === 'effort', 5000)).toMatchObject({ cmd: 'effort', project: HOME, agent: 'p99', effort: 'high' });
    // the hub's catalog (amb-feed 7dfd1c74): the TUI's /model rows, its words as they come
    await core.send(MODELS as unknown as Ev);
    await expect(page.getByTestId('agents.model.p99.pick.anthropic/claude-opus-5-5'), "the catalog's row, its words as they come").toContainText('opus 5.5');
    await expect(page.getByTestId('agents.model.p99.pick.anthropic/claude-opus-5-5')).toContainText('default for main and agents');
    await expect(page.getByTestId('agents.model.p99.pick.mistral/devstral-medium-latest')).toContainText('128k · config.toml');
    await page.getByTestId('agents.model.p99.pick.mistral/devstral-medium-latest').click();
    expect(await core.waitCmd((c) => c.cmd === 'model' && (c as { model?: string }).model === 'mistral/devstral-medium-latest', 5000)).toMatchObject({ agent: 'p99' });
    await expect(page.getByTestId('agents.effort.p99.none'), 'a model with no reasoning setting says so').toHaveText('devstral medium has no reasoning setting');
    await page.getByTestId('agents.model.p99.pick.anthropic/claude-opus-5-5').click();
    await expect(page.getByTestId('agents.effort.p99.max'), "opus 5.5's own efforts").toBeVisible();
    await page.screenshot({ path: test.info().outputPath('models.png') });
    // a model set elsewhere (the TUI's /model): only the hub's agents event, no pick here; the mark follows it
    await core.send({ ev: 'agents', project: HOME, agents: [agent('main'), agent('p99', { model: 'opus', effort: 'high' }), agent('cart', { status: 'working' })] } as unknown as Ev);
    await expect(page.getByTestId('agents.model.p99.pick.opus'), 'a model changed elsewhere moves the mark').toHaveAttribute('aria-selected', 'true', { timeout: 5000 });
    await expect(page.getByTestId('agents.model.p99.pick.anthropic/claude-opus-5-5')).toHaveAttribute('aria-selected', 'false');
    // a typed id still goes
    await page.getByTestId('agents.model.p99').fill('anthropic/claude-opus-4');
    await page.getByTestId('agents.model.p99.set').click();
    expect(await core.waitCmd((c) => c.cmd === 'model' && (c as { model?: string }).model === 'anthropic/claude-opus-4', 5000)).toMatchObject({ cmd: 'model', project: HOME, agent: 'p99' });
    await core.send({ ev: 'error', project: HOME, cmd: 'model', text: 'no key for anthropic yet: /provider' } as unknown as Ev);
    await expect(page.getByTestId('agents.tune.p99.error'), 'the refusal in place').toHaveText('no key for anthropic yet: /provider');
    await page.screenshot({ path: test.info().outputPath('tune.png') });

    // rename inline: it waits for the hub; refused, the hub's words in place and the field still
    // editable (qa-flows 5362cd43); accepted, the tune closes when the agents event has the name
    await page.getByTestId('agents.rename.p99').fill('perf');
    await page.getByTestId('agents.rename.p99').press('Enter');
    expect(await core.waitCmd((c) => c.cmd === 'rename', 5000)).toMatchObject({ cmd: 'rename', project: HOME, agent: 'p99', to: 'perf' });
    await expect(page.getByTestId('agents.rename.p99.wait'), 'it says it waits for the hub').toHaveText('renaming…');
    await core.send({ ev: 'error', project: HOME, cmd: 'rename', text: 'invalid or taken name: perf' } as unknown as Ev);
    await expect(page.getByTestId('agents.tune.p99.error'), 'the refused rename shows its words in place').toHaveText('invalid or taken name: perf');
    await expect(page.getByTestId('agents.rename.p99.wait')).toHaveCount(0);
    await expect(page.getByTestId('agents.rename.p99'), 'the field stays, editable').toBeEditable();
    await page.screenshot({ path: test.info().outputPath('rename-refused.png') });
    await page.getByTestId('agents.rename.p99').fill('speed');
    await page.getByTestId('agents.rename.p99').press('Enter');
    await expect.poll(() => core.cmds().filter((c) => c.cmd === 'rename').length, { message: 'a second rename goes out' }).toBe(2);
    expect(core.cmds().filter((c) => c.cmd === 'rename').at(-1)).toMatchObject({ agent: 'p99', to: 'speed' });
    await core.send({ ev: 'agents', project: HOME, agents: [agent('main'), agent('speed', { model: 'openai/gpt-5', effort: 'high' }), agent('cart', { status: 'working' })] } as unknown as Ev);
    await expect(page.getByTestId('agents.row.speed'), 'the renamed row').toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('agents.tune.p99'), 'the tune is gone with the old name').toHaveCount(0);
  } finally {
    await s.close();
    helper.dispose();
    core.dispose();
  }
});

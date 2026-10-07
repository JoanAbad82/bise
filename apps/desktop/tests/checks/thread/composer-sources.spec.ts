// thread/composer-sources · his bug 1 (tui-parity, bar 2.1/2.2/2.3; amb-core's C/A/B 40f14a12, lead
// m_10766): /, @ and $ in the REAL thread's composer list nothing outside the lab. Passes when the
// thread's composer asks the core for its lists and shows them: '/' the core's commands in the TUI's
// order (a hub command with no typed form greyed 'not yet'), a ready window command runs here
// (/inbox opens the inbox, /help the key list), a runnable hub command goes out typed (/rename ->
// HubCmd rename), '$' the project's skills, '@' the files the core ranks for that query (its rid).
// bise main's thread on the scripted core (FakeCore); the core's answers are sent by the check,
// as the stub doesn't answer these asks. Real keys. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
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
  { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 2, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [agent('main'), agent('perf')] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'hello' }], before: null, more: false },
];

/** a slice of the TUI's COMMANDS as the core sends them (picks.rs) */
const COMMANDS = [
  { name: '/new', desc: 'start an agent: /new [-w] [name:] objective', args: [{ kind: 'words', words: [{ value: '-w', desc: 'in its own git worktree' }] }, { kind: 'text' }], runs: 'hub', runnable: true },
  { name: '/rename', desc: 'rename an agent: /rename <agent> <new-name>', args: [{ kind: 'agent' }, { kind: 'text' }], runs: 'hub', runnable: true },
  { name: '/inbox', desc: 'open what waits for you', args: [], runs: 'window', runnable: false },
  { name: '/compact', desc: "compact the agent's context", args: [], runs: 'hub', runnable: false },
  { name: '/help', desc: 'the commands and the essential keys', args: [], runs: 'window', runnable: false },
];

const F = '[data-testid="composer.field"]';
const PICK = '[data-testid="composer.pick"]';
const ROWS = '[data-testid^="composer.pick."]';

test("thread/composer-sources: the real thread's /, @ and $ list the core's commands, files and skills; a line runs", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core });
  try {
    const { page } = s;
    await expect(page.getByTestId('thread.screen')).toBeVisible({ timeout: 10_000 });
    // the thread asks the core for its lists
    await core.waitCmd((c) => c.cmd === 'commands', 5000);
    await core.waitCmd((c) => c.cmd === 'skills' && c.project === HOME, 5000);
    await core.send({ ev: 'commands', items: COMMANDS } as never);
    await core.send({ ev: 'skills', project: HOME, items: [{ name: 'release-bise', desc: 'tag, CI and publish' }, { name: 'review', desc: 'review a PR' }] } as never);

    const field = page.locator(F);
    await field.click();
    await page.keyboard.type('/');
    const pick = page.locator(PICK);
    await expect(pick, '"/" opens the command list').toBeVisible({ timeout: 2000 });
    const labels = await pick.locator(ROWS).allInnerTexts();
    const order = COMMANDS.map((c) => labels.findIndex((l) => l.includes(c.name)));
    expect(order.every((i) => i >= 0), `every core command is listed: ${labels.join(' | ')}`).toBe(true);
    expect([...order].sort((a, b) => a - b), "in the TUI's order").toEqual(order);
    await expect(page.getByTestId('composer.pick.cmd.compact'), 'a hub command with no typed form: greyed').toContainText('not yet');
    await expect(page.getByTestId('composer.pick.cmd.inbox')).not.toContainText('not yet');
    await page.screenshot({ path: test.info().outputPath('slash.png') });

    // an agent argument never offers main (qa-type b37dc4c1 red 2)
    await page.keyboard.type('rename ');
    await expect(page.getByTestId('composer.pick.arg.perf'), "'/rename ' offers perf").toBeVisible({ timeout: 2000 });
    await expect(page.getByTestId('composer.pick.arg.main'), 'never main').toHaveCount(0);

    // a runnable hub command goes out typed
    await page.keyboard.type('perf p2');
    await page.keyboard.press('Enter');
    const rename = await core.waitCmd((c) => c.cmd === 'rename', 3000);
    expect(rename).toMatchObject({ project: HOME, agent: 'perf', to: 'p2' });

    // $ lists the project's skills
    await field.click();
    await page.keyboard.type('$re');
    await expect(page.getByTestId('composer.pick.skill.release-bise'), '"$" lists the skills').toBeVisible({ timeout: 2000 });
    await expect(page.getByTestId('composer.pick.skill.review')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');

    // '@' alone: the other agents, never the one he writes to (qa-type b37dc4c1 red 1)
    await page.keyboard.type('@');
    await expect(page.getByTestId('composer.pick.agent.perf'), "'@' lists perf").toBeVisible({ timeout: 2000 });
    await expect(page.getByTestId('composer.pick.agent.main'), 'not main, the agent in view').toHaveCount(0);
    // (no esc: an '@' list put off at this place stays off for the next '@' there)
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');

    // @ asks the core with a rid; its answer's rows show
    await page.keyboard.type('@src');
    const ask = (await core.waitCmd((c) => c.cmd === 'files' && c.q === 'src', 3000)) as unknown as { rid: number };
    await core.send({ ev: 'files', project: HOME, rid: ask.rid, q: 'src', items: [{ path: 'src/main.rs', dir: false }, { path: 'src/', dir: true }] } as never);
    await expect(page.getByTestId('composer.pick.file.src/main.rs'), '"@" lists the files the core ranked').toBeVisible({ timeout: 2000 });
    await page.screenshot({ path: test.info().outputPath('at-files.png') });
    await page.keyboard.press('Escape');
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');

    // window commands run here
    await page.keyboard.type('/help');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('help.overlay'), '/help opens the key list').toBeVisible({ timeout: 2000 });
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('help.overlay')).toBeHidden();
    await field.click();
    await page.keyboard.type('/inbox');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('inbox.root'), '/inbox opens the inbox').toBeVisible({ timeout: 2000 });
  } finally {
    await s.close();
    core.dispose();
  }
});

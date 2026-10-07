// thread/empty-enter · K2, ⏎ on an empty composer (the TUI's sb/keys.rs:120-142, input.rs:787).
// Passes when, on storefront's perf thread with the scripted core (FakeCore, fake data):
//   - an expired sign-in stopped perf (a 'signin' item waiting on it): ⏎ in the empty field asks
//     the core to sign in again (AppCmd sign_in chatgpt; the core opens his browser: his ⏎ is his
//     click), and sends nothing;
//   - with no such item, ⏎ in the empty field does nothing: no send, no command.
//   - R15: with his browser on the sign-in (the core's 'signing'), the thread says 'waiting for you
//     to sign in to ChatGPT in your browser…' with 'c copy the link   esc cancel'; c on the empty
//     field copies (it types nothing, 'c copied'), esc sends sign_in_cancel, the core's end clears it.
// The other K2 acts: entering a selected agent has no window form (the sidebar enters on click);
// giving a computer-use agent back the wheel waits on S29. Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'storefront-1a2b3c4d';
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
const SIGNIN = {
  id: 12,
  project: P,
  kind: 'signin',
  rank: 1,
  agent: 'main',
  question: 'the ChatGPT sign-in expired: sign in again so perf and main go on',
  options: [{ n: 1, label: 'sign in' }],
  urgent: false,
  since_ms: 1791100100000,
  waiting: ['perf', 'main'],
};
const world = (cards: unknown[]) => [
  {
    ev: 'prefs',
    prefs: {
      onboarded: true,
      theme: 'light',
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
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 2, working: 0, waits: cards.length, running: true, cards },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf')] },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'the bench runs again once you sign in.' }], before: null, more: false },
];
type Cmd = { cmd?: string; id?: string };

test('thread/empty-enter: ⏎ on an empty composer signs in again when an expired sign-in stopped the agent, else does nothing', async () => {
  const core = new FakeCore(world([SIGNIN]) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  try {
    const { page } = s;
    const field = page.locator('[data-testid="composer.field"]').first();
    await expect(field).toBeVisible({ timeout: 10_000 });
    await field.click();
    await page.keyboard.press('Enter');
    const c = (await core.waitCmd((x) => x.cmd === 'sign_in', 3000)) as Cmd;
    expect(c).toMatchObject({ cmd: 'sign_in', id: 'chatgpt' });

    // R15: his browser is on the sign-in: the thread says so; c copies the link, esc cancels
    await core.send({ ev: 'signing', id: 'chatgpt', url: 'https://auth.example.test/authorize?x=1' } as never);
    const line = page.getByTestId('thread.signin');
    await expect(line).toContainText('waiting for you to sign in to ChatGPT in your browser…');
    await expect(page.getByTestId('thread.signin.keys')).toHaveText('c copy the link   esc cancel');
    await page.screenshot({ path: test.info().outputPath('signin-line.png') });
    await field.click();
    await page.keyboard.press('c');
    await expect(page.getByTestId('thread.signin.keys')).toHaveText('c copied   esc cancel');
    await expect(field, 'c copies, it types nothing').toHaveText('');
    await page.keyboard.press('Escape');
    expect(await core.waitCmd((x) => x.cmd === 'sign_in_cancel', 3000)).toMatchObject({ cmd: 'sign_in_cancel', id: 'chatgpt' });
    // the core ends it (an error for sign_in): the line goes
    await core.send({ ev: 'error', cmd: 'sign_in', text: 'chatgpt: cancelled' } as never);
    await expect(line).toHaveCount(0);

    // the item is gone (signed in): ⏎ on the empty field does nothing at all
    await core.send({ ev: 'cards', project: P, cards: [] } as never);
    await core.send(world([])[1] as never);
    await expect(page.getByTestId('strip')).toHaveCount(0);
    const before = core.cmds().length;
    await field.click();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    const after = core.cmds().slice(before) as Cmd[];
    expect(after.filter((x) => x.cmd === 'send' || x.cmd === 'sign_in'), 'no send, no sign-in').toEqual([]);
  } finally {
    await s.close();
    core.dispose();
  }
});

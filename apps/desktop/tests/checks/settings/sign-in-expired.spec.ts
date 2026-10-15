// settings/sign-in-expired · bar V14 / S28 / L2 (docs/desktop-bar.md): his ChatGPT sign-in expired and
// stopped two agents. Passes when, with the scripted core (FakeCore, fake data, a fake sign-in URL;
// never his browser: test mode, and the core here is a script):
//   - settings › models says it: 'your sign-in expired: perf, main wait', the button reads
//     'sign in again', and the inbox block holds the hub's signin item;
//   - 'sign in again' asks the core (AppCmd sign_in chatgpt); while the core's sign-in is under way
//     ('signing'), the page says 'waiting for you to sign in to ChatGPT in your browser…' with
//     'copy the link';
//   - the sign-in ends (the core's accounts: signed in; the hub drops the signin item; its agents
//     work again): '✓ signed in', the waiting line goes, the signin item leaves the inbox, and perf
//     reads working in the sidebar.
// The thread's side (⏎ on an empty composer, c copies, esc cancels) is thread/empty-enter. That the
// stopped agents' turns really go on after a real sign-in is the core's and the hub's. Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { common, settings } from '../../../src/proto/words.gen';

type Cmd = { cmd?: string; id?: string };

const HOME = 'bise-home-00000000';
const P = 'storefront-1a2b3c4d';
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
const agent = (name: string, status: string) => ({ name, main: name === 'main', status, archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: status === 'waiting' ? 1 : 0 });
const projects = (cards: unknown[]) => ({
  ev: 'projects',
  projects: [
    { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
    { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 2, working: cards.length === 0 ? 2 : 0, waits: cards.length, running: true, cards },
  ],
});
const accounts = (state: 'expired' | 'signed_in') => ({
  ev: 'accounts',
  items: [{ id: 'chatgpt', kind: 'subscription', label: 'ChatGPT', state, provider: 'chatgpt', ...(state === 'signed_in' ? { who: 'camille@example.com' } : {}) }],
});
const world = () => [
  { ev: 'prefs', prefs: { onboarded: true, theme: 'light' } },
  projects([SIGNIN]),
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main', 'waiting'), agent('perf', 'waiting')] },
  accounts('expired'),
];

test('settings/sign-in-expired: the expired sign-in says who waits, signs in again from the app, and its agents go on', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'settings/models' });
  const { page } = s;
  try {
    const row = page.getByTestId('settings.models');
    const button = page.getByTestId('settings.account.chatgpt');

    await test.step("settings › models: 'your sign-in expired: perf, main wait', 'sign in again'; the inbox holds the item", async () => {
      await expect(row).toContainText(settings.expired_wait({ names: 'perf, main' }), { timeout: 10_000 });
      await expect(button).toHaveText(settings.sign_in_again);
      await expect(page.getByTestId('inbox.block')).toContainText('sign', { timeout: 5000 });
      await page.screenshot({ path: test.info().outputPath('expired.png') });
    });

    await test.step("'sign in again' asks the core; under way, the page says so with 'copy the link'", async () => {
      await button.click();
      expect(await core.waitCmd((c) => (c as Cmd).cmd === 'sign_in', 3000)).toMatchObject({ cmd: 'sign_in', id: 'chatgpt' });
      await core.send({ ev: 'signing', id: 'chatgpt', url: 'https://auth.example.test/fake-sign-in' } as never);
      await expect(page.getByTestId('settings.signing')).toContainText(common.signing_wait({ label: 'ChatGPT' }), { timeout: 3000 });
      await expect(page.getByTestId('settings.signing.copy')).toBeVisible();
      await page.screenshot({ path: test.info().outputPath('signing.png') });
    });

    await test.step("the sign-in ends: '✓ signed in', the line goes, the item leaves the inbox, perf works again", async () => {
      await core.send(accounts('signed_in') as never);
      await core.send(projects([]) as never);
      await core.send({ ev: 'agents', project: P, agents: [agent('main', 'working'), agent('perf', 'working')] } as never);
      await expect(page.getByTestId('settings.account.chatgpt.ok')).toHaveText(settings.signed_in, { timeout: 3000 });
      await expect(page.getByTestId('settings.signing')).toHaveCount(0);
      await expect(row).not.toContainText('expired');
      await expect(page.getByTestId('inbox.block')).toHaveCount(0);
      await page.getByTestId(`app.sidebar.project.${P}`).click();
      await expect(page.getByTestId('app.right.agent.perf')).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('app.right.agent.perf')).not.toContainText('?');
      await page.screenshot({ path: test.info().outputPath('signed-in.png') });
    });
  } finally {
    await s.close();
    core.dispose();
  }
});

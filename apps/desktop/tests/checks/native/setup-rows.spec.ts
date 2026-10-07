// native/setup-rows · bar S.2 (setup/sign-in), S.8 (setup/check-again), P.2 (setup/computer-use),
// S.9 + L1 (setup/welcome, the first-run text), amb-home's screens in the new app, on the scripted
// core and helper in the test home. Real clicks and keys in the window; the effects read outside
// the app: the commands the core and the helper got; nothing ever opens outside the app (no
// EXTERNAL_LINE: never his browser, never Terminal). The core's answers are scripted here as the
// real core sends them (bise_proto: accounts, computer_use, error, prefs).
import { FakeCore, test, expect, type Session } from '../../harness';
import type { Account, CoreEv, HubEv } from '../../../src/proto';
import { core_ev, hub_ev } from '../../../src/proto/fixtures.gen';
import { onWorld, sleep, type Lines } from './world';

const EXTERNAL = 'bise-desktop: external';
type Ev = CoreEv | HubEv;

/** the fixture world with some events replaced (by tag) */
const worldWith = (over: Partial<Record<string, Ev>>): Ev[] =>
  [...core_ev, ...hub_ev].map((e) => over[e.ev] ?? e);

const accountsEv = (items: Account[]): Ev => ({ ev: 'accounts', items });
const SIGNED_OUT: Account[] = [
  { id: 'chatgpt', label: 'ChatGPT', kind: 'subscription', state: 'signed_out' },
  { id: 'anthropic-key', label: 'Anthropic key', kind: 'key', state: 'signed_out' },
];
const nothingLeft = (out: Lines): void => {
  expect(out.lines.filter((l) => l.startsWith(EXTERNAL)), 'nothing opened outside the app').toEqual([]);
};
const text = (s: Session): Promise<string> => s.page.locator('body').innerText();

test('setup/sign-in (S.2): a subscription signs in on his click; a key is sent once; a wrong key says so in one line', async () => {
  await onWorld(async ({ s, core, out }) => {
    const { page } = s;
    const sub = page.getByTestId('settings.account.chatgpt');
    await expect(sub, 'ChatGPT: sign in').toBeVisible();
    await sub.click();
    await core.waitCmd((c) => c.cmd === 'sign_in' && c.id === 'chatgpt', 1000);
    await core.send(accountsEv([{ ...SIGNED_OUT[0], state: 'signed_in', who: 'camille@example.com' } as Account, SIGNED_OUT[1] as Account]));
    await expect(page.getByTestId('settings.account.chatgpt.ok'), 'signed in shows at once').toBeVisible();

    await page.getByTestId('settings.key.add').click();
    const field = page.getByTestId('settings.key.field');
    await expect(field, 'a password field').toHaveAttribute('type', 'password');
    await field.pressSequentially('sk-ant-wrong-0000');
    await field.press('Enter');
    const sent = await core.waitCmd((c) => c.cmd === 'key_set', 1000);
    expect(sent, 'the key goes to the core once, for that account').toMatchObject({ cmd: 'key_set', id: 'anthropic-key', key: 'sk-ant-wrong-0000' });
    expect(core.cmds().filter((c) => c.cmd === 'key_set').length).toBe(1);
    // the core refuses it, as it does for a 401 from the provider
    await core.send({ ev: 'error', cmd: 'key_set', text: 'anthropic-key: the provider refused this key (401)' });
    await sleep(800);
    await page.screenshot({ path: test.info().outputPath('wrong-key.png') }); // the frame for the report
    const body = await text(s);
    expect.soft(/refused|wrong|invalid|didn.t work/i.test(body), `a wrong key says so in one line (the page says: ${body.slice(0, 300).replace(/\n/g, ' | ')})`).toBe(true);
    expect.soft(body.includes('sk-ant-wrong-0000'), 'the key is never shown back').toBe(false);
    nothingLeft(out);
  }, { route: 'settings/models', core: new FakeCore(worldWith({ accounts: accountsEv(SIGNED_OUT) })) });
});

test('setup/check-again (S.8): each missing thing offers its fix, check again reads them fresh, all set after', async () => {
  await onWorld(async ({ s, core, helper, out }) => {
    const { page } = s;
    await helper.send({ ev: 'perms', accessibility: 'ask', mic: 'denied', screen: 'allowed', calendar: 'ask' });
    const check = page.getByTestId('settings.check');
    await expect(check, 'the setup page').toBeVisible();
    await expect(check, 'a refused mic says what it costs').toContainText(/denied/);
    await page.getByTestId('settings.check.mic.fix').click();
    await helper.waitCmd((c) => c.cmd === 'perm' && c.perm === 'mic' && c.action === 'open', 1000);
    await page.getByTestId('settings.check.accessibility.fix').click();
    await helper.waitCmd((c) => c.cmd === 'perm' && c.perm === 'accessibility' && c.action === 'ask', 1000);
    await expect(check, 'no model signed in: it says agents can’t answer').toContainText(/no subscription or key/);
    await page.getByTestId('settings.check.again').click();
    await core.waitCmd((c) => c.cmd === 'setup_check', 1000);
    await helper.send({ ev: 'perms', accessibility: 'allowed', mic: 'allowed', screen: 'allowed', calendar: 'ask' });
    await core.send(accountsEv([{ ...SIGNED_OUT[0], state: 'signed_in', who: 'camille@example.com' } as Account, SIGNED_OUT[1] as Account]));
    await expect(page.getByText('all set.'), 'everything granted: all set').toBeVisible();
    await page.getByTestId('settings.check.model.fix').waitFor({ state: 'detached', timeout: 1000 }).catch(() => undefined);
    await expect(page.getByTestId('settings.check.model.fix'), 'the model fix is gone once signed in').toHaveCount(0);
    nothingLeft(out);
  }, { route: 'settings/setup', core: new FakeCore(worldWith({ accounts: accountsEv(SIGNED_OUT) })) });
});

test('setup/computer-use (P.2): on asks the core, its steps show with their fix, off stops it, leaving stops the checks', async () => {
  const cu = [...core_ev, ...hub_ev].filter((e): e is Extract<Ev, { ev: 'computer_use' }> => e.ev === 'computer_use');
  const onEv = cu.find((e) => e.on);
  const offEv = cu.find((e) => !e.on);
  if (!onEv || !offEv) throw new Error('no computer_use fixtures');
  await onWorld(async ({ s, core, out }) => {
    const { page } = s;
    await core.waitCmd((c) => c.cmd === 'computer_use' && c.act === 'check', 1500);
    const sw = page.getByTestId('settings.cu.switch');
    await expect(sw, 'the switch').toBeVisible();
    await sw.click();
    await core.waitCmd((c) => c.cmd === 'computer_use' && c.act === 'on', 1000);
    await core.send(onEv);
    await expect(page.getByTestId('settings.cu.web'), 'the Chrome steps').toBeVisible();
    await expect(page.getByTestId('settings.cu.apps'), 'the apps steps: the permissions it needs, asked in the app').toBeVisible();
    await page.getByTestId('settings.cu.extension').click();
    await core.waitCmd((c) => c.cmd === 'computer_use' && c.act === 'fix' && c.fix === 'add_extension', 1000);
    await sw.click();
    await core.waitCmd((c) => c.cmd === 'computer_use' && c.act === 'off', 1000);
    await core.send(offEv);
    await expect(page.getByTestId('settings.cu.web'), 'off: no steps').toHaveCount(0);
    await page.getByTestId('settings.nav.general').click();
    await core.waitCmd((c) => c.cmd === 'computer_use' && c.act === 'leave', 1000);
    nothingLeft(out);
  }, { route: 'settings/computer', core: new FakeCore(worldWith({ computer_use: offEv })) });
});

test('setup/welcome (S.9 + L1): a fresh home gets hello, then start-here in his browser, and the first-run text fills the composer unsent', async () => {
  const prefs = core_ev.find((e): e is Extract<CoreEv, { ev: 'prefs' }> => e.ev === 'prefs');
  if (!prefs) throw new Error('no prefs fixture');
  const fresh = { ...prefs, prefs: { ...(prefs.prefs as Record<string, unknown>), onboarded: false } } as Ev;
  // the hub's start-here page, an artifact of the home project (the lead's pick (a), amb-kit 6d6cd160:
  // it opens in his browser, not in the app)
  const START = 'http://127.0.0.1:47123/p/start-here';
  const startHere: Ev = {
    ev: 'artifacts',
    project: 'bise-home-00000000',
    items: [{ id: 'start-here', kind: 'page', title: 'start here', agent: 'main', version: 1, at_ms: 1791100000000, url: START, new: true }],
  };
  await onWorld(async ({ s, core, out }) => {
    const { page } = s;
    await expect(page.getByTestId('setup.step.hello'), 'a fresh home opens hello by itself').toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('setup.step.hello')).toContainText(/i.m bise/);
    await page.getByTestId('setup.skip').click();
    await sleep(1500);
    await page.screenshot({ path: test.info().outputPath('after-hello.png') }); // the frame for the report
    const opened = out.of(EXTERNAL);
    expect(opened, 'after hello, start-here opens in his browser, once (test mode: the external line)').toEqual([START]);
    const first = page.getByText(/show me what you can do/i).first();
    const has = await first.isVisible().catch(() => false);
    expect.soft(has, "the first-run text 'show me what you can do' is offered in main's empty thread").toBe(true);
    if (has) {
      const sends = core.cmds().filter((c) => c.cmd === 'send').length;
      await first.click();
      await sleep(500);
      const sel = await page.evaluate(() => window.getSelection()?.toString() ?? '');
      expect.soft(sel, 'it fills the composer, selected').toMatch(/show me what you can do/i);
      expect(core.cmds().filter((c) => c.cmd === 'send').length, 'and nothing is sent').toBe(sends);
    }
  }, { core: new FakeCore([...worldWith({ prefs: fresh }), startHere]) });
});

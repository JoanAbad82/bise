// settings/setup-first · R8 (docs/terminal-parity.md, the TUI's sb.rs /model with model_needs_key):
// his '/model openrouter/…' typed in perf's thread while OpenRouter has no key. The core holds the
// line (it never reaches the hub) and says setup_first (amb-core 4519a877). Passes when, with the
// scripted core (FakeCore, fake data, a fake key):
//   - setup_first opens settings · models on OpenRouter's setup: 'needs OpenRouter' and its key field;
//   - his key goes as key_set; the accounts showing OpenRouter signed in take him back to perf's
//     thread, the window sends nothing else (the core sends the held line itself) and no cancel;
//   - a second one, left without a key (he clicks perf in the sidebar): setup_first_cancel.
// That the held line really runs once the key works is the core's (ambient tests/hubs.rs
// a_model_whose_provider_has_no_key_waits_for_its_setup). Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

type Cmd = { cmd?: string; id?: string; key?: string };

const ACME = 'acme-1a2b3c4d';
const MODEL = 'openrouter/qwen/qwen3-coder';
const first = { ev: 'setup_first', project: ACME, agent: 'perf', provider: 'openrouter', name: 'OpenRouter', model: MODEL, cid: 12 };
const accounts = (state: 'signed_in' | 'signed_out') => ({
  ev: 'accounts',
  items: [
    { id: 'chatgpt', kind: 'subscription', label: 'ChatGPT', state: 'signed_in', who: 'camille@example.com', provider: 'chatgpt' },
    { id: 'openrouter', kind: 'key', label: 'OpenRouter key', state, provider: 'openrouter' },
  ],
});
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

test('settings/setup-first: a /model the core holds opens its provider setup; the key works -> back to the thread; left without it -> cancelled', async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${ACME}/perf` });
  const { page } = s;
  const thread = page.getByTestId('thread.screen');
  const cancels = () => core.cmds().filter((c) => (c as Cmd).cmd === 'setup_first_cancel');
  try {
    await expect(thread).toHaveAttribute('data-project', ACME, { timeout: 10_000 });
    await core.send(accounts('signed_out') as never);

    await test.step("setup_first opens settings · models on OpenRouter's setup, its key field open", async () => {
      await core.send(first as never);
      await expect(page.getByTestId('settings.models.want')).toContainText(`${MODEL} needs OpenRouter`, { timeout: 3000 });
      await expect(page.getByTestId('settings.key.field')).toBeVisible();
      await page.screenshot({ path: test.info().outputPath('setup-first.png') });
    });

    await test.step('his key goes; OpenRouter signed in -> back to perf, nothing else sent, no cancel', async () => {
      const before = core.cmds().length;
      await page.getByTestId('settings.key.field').fill('sk-or-fake-1');
      await page.getByTestId('settings.key.field').press('Enter');
      expect(await core.waitCmd((c) => (c as Cmd).cmd === 'key_set', 3000)).toMatchObject({ cmd: 'key_set', id: 'openrouter', key: 'sk-or-fake-1' });
      await core.send(accounts('signed_in') as never);
      await expect(thread).toHaveAttribute('data-project', ACME, { timeout: 3000 });
      await expect(thread).toHaveAttribute('data-agent', 'perf');
      await sleep(300);
      const after = core.cmds().slice(before).map((c) => (c as Cmd).cmd);
      expect(after.filter((c) => c === 'slash' || c === 'model' || c === 'setup_first_cancel'), 'the core sends the held line, not the window').toEqual([]);
    });

    await test.step('a second one, left without a key: setup_first_cancel', async () => {
      await core.send(accounts('signed_out') as never);
      await core.send(first as never);
      await expect(page.getByTestId('settings.models.want')).toBeVisible({ timeout: 3000 });
      expect(cancels()).toEqual([]);
      await page.getByTestId('app.sidebar.agent.perf').click();
      await expect(thread).toHaveAttribute('data-agent', 'perf', { timeout: 3000 });
      await core.waitCmd((c) => (c as Cmd).cmd === 'setup_first_cancel', 3000);
      await sleep(300);
      expect(cancels().length, 'once').toBe(1);
    });
  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});

// settings/keychain · parity item N1 (docs/terminal-parity.md, ambient-lead m_17246): the TUI's
// /keychain [on|off] in the window. Passes when, with the scripted core (FakeCore, fake data; no test
// reaches /usr/bin/security, the core here is a script):
//   - his keys and sign-ins are in files (CoreEv keychain store:file): settings › models' switch
//     'keep them in the macOS keychain' reads off and says where they are now;
//   - '/keychain on' typed in a thread's composer, then ⏎, sends AppCmd keychain {to:'on'} (never
//     the hub's typed slash) and stays on the thread;
//   - the core's move: moving:true makes the switch wait and say 'moving them…'; its end
//     (store:keychain with the move's lines) turns the switch on with the lines under it;
//   - the switch clicked sends keychain {to:'off'}; a failed move shows its lines in the error tone.
// That the move really moves the items is the core's (8acd83b9's laws in rust/tui/tests/setup.rs).
// Owner: amb-home.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

type Cmd = { cmd?: string; to?: string };
const HOME = 'bise-home-00000000';
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function sayIn(page: Page, line: string): Promise<void> {
  const field = page.getByTestId('composer.field');
  await field.click();
  await page.keyboard.press('Meta+a');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(line);
  await sleep(250);
  await page.keyboard.press('Enter');
  // a picker that took the first ⏎ (it applied its row): ⏎ again sends the line
  await sleep(250);
  const left = (await field.textContent({ timeout: 500 }).catch(() => null)) ?? '';
  if (left.trim() !== '') await page.keyboard.press('Enter');
}

async function shoot(page: Page, name: string): Promise<void> {
  for (const theme of ['light', 'dark'] as const) {
    // dark as the app sets it (src/theme applyTheme): the attribute and the root's color-scheme
    await page.evaluate((t) => {
      document.documentElement.setAttribute('data-theme', t);
      document.documentElement.style.setProperty('color-scheme', t);
    }, theme);
    await sleep(250); // the switch's background transition (--d-fast)
    await page.screenshot({ path: test.info().outputPath(`${name}-${theme}.png`) });
  }
}

test('settings/keychain: /keychain on moves the keys (scripted core), the models switch shows where they are', async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${HOME}/main` });
  const { page } = s;
  try {
    await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-project', HOME, { timeout: 10_000 });
    await core.send({ ev: 'keychain', store: 'file', moving: false } as never);

    await test.step("'/keychain on' in the composer sends AppCmd keychain on, not the hub's slash", async () => {
      await sayIn(page, '/keychain on');
      expect(await core.waitCmd((c) => (c as Cmd).cmd === 'keychain', 3000)).toMatchObject({ cmd: 'keychain', to: 'on' });
      expect(core.cmds().filter((c) => (c as Cmd).cmd === 'slash')).toEqual([]);
      await expect(page.getByTestId('thread.screen'), 'still on the thread').toBeVisible();
    });

    await test.step("the bare '/keychain' opens settings › models: the switch is off, the keys in files", async () => {
      await sayIn(page, '/keychain');
      const toggle = page.getByTestId('settings.keychain.toggle');
      await expect(toggle).toBeVisible({ timeout: 5000 });
      await expect(toggle).toHaveAttribute('aria-checked', 'false');
      await expect(page.getByTestId('settings.keychain.sub')).toHaveText('now in files in ~/.bise. /keychain in the terminal.');
      await page.getByTestId('settings.keychain').scrollIntoViewIfNeeded();
      await shoot(page, 'keychain-off');
    });

    await test.step("the move: 'moving them…' with the switch waiting, then on with its lines", async () => {
      await core.send({ ev: 'keychain', store: 'file', moving: true } as never);
      await expect(page.getByTestId('settings.keychain.sub')).toHaveText('moving them…', { timeout: 3000 });
      await expect(page.getByTestId('settings.keychain.toggle')).toHaveAttribute('aria-disabled', 'true');
      await core.send({ ev: 'keychain', store: 'keychain', moving: false, lines: ['moved 3 items to the macOS keychain: openrouter, anthropic, chatgpt.'] } as never);
      const toggle = page.getByTestId('settings.keychain.toggle');
      await expect(toggle).toHaveAttribute('aria-checked', 'true', { timeout: 3000 });
      await expect(toggle).not.toHaveAttribute('aria-disabled', 'true');
      await expect(page.getByTestId('settings.keychain.sub')).toHaveText('moved 3 items to the macOS keychain: openrouter, anthropic, chatgpt.');
      await shoot(page, 'keychain-on');
    });

    await test.step('the switch clicked sends keychain off; a failed move reads in the error tone', async () => {
      const before = core.cmds().length;
      await page.getByTestId('settings.keychain.toggle').click();
      await expect.poll(() => core.cmds().slice(before).find((c) => (c as Cmd).cmd === 'keychain'), { timeout: 3000 }).toMatchObject({ cmd: 'keychain', to: 'off' });
      await core.send({ ev: 'keychain', store: 'keychain', moving: false, failed: true, lines: ["couldn't move chatgpt: the keychain is locked."] } as never);
      const sub = page.getByTestId('settings.keychain.sub');
      await expect(sub).toHaveText("couldn't move chatgpt: the keychain is locked.", { timeout: 3000 });
      await expect(sub).toHaveClass(/settings-err/);
      // the class alone isn't the proof (the ds's '.b-gi .l span' once kept it grey): its ink is --c-err's
      const [ink, err] = await sub.evaluate((e) => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--c-err)';
        e.parentElement?.appendChild(probe);
        const out = [getComputedStyle(e).color, getComputedStyle(probe).color];
        probe.remove();
        return out;
      });
      expect(ink, 'the failed line is in the error tone').toBe(err);
      await shoot(page, 'keychain-failed');
    });
  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});

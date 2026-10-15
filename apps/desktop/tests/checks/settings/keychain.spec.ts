// settings/keychain · parity item N1 (docs/terminal-parity.md, ambient-lead m_17246): the TUI's
// /keychain [on|off] in the window. Passes when, with the scripted core (FakeCore, fake data; no test
// reaches /usr/bin/security, the core here is a script):
//   - his keys and sign-ins are in files (CoreEv keychain store:file): the switch heading settings ›
//     keys (designer m_17435), 'keep them in the macOS keychain', reads off and says where they are;
//   - '/keychain on' typed in a thread's composer, then ⏎, sends AppCmd keychain {to:'on'} (never
//     the hub's typed slash) and stays on the thread;
//   - the core's move: moving:true makes the switch wait and say 'moving them…'; its end
//     (store:keychain with the move's lines) turns the switch on with the lines under it;
//   - the switch clicked sends keychain {to:'off'}; a failed move shows its lines in the error tone.
// That the move really moves the items is the core's (8acd83b9's laws in rust/tui/tests/setup.rs).
// Owner: amb-home.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { settings } from '../../../src/proto/words.gen';

type Cmd = { cmd?: string; to?: string };
const HOME = 'bise-home-00000000';
// the core's own lines (bise_catalog::secrets_cli, the terminal's words): the window shows them as they come
const MOVED = "moved 3 secrets to bise's own macOS keychain, which agents can't read: 2 API keys and 1 MCP login.";
const LOCKED = 'moved 1 of 3 secrets, then the keychain locked: unlock your Mac and run it again to move the rest.';
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

test('settings/keychain: /keychain on moves the keys (scripted core), the keys page switch shows where they are', async () => {
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

    await test.step("the bare '/keychain' opens settings › keys: the switch heads it, off, the keys in files", async () => {
      await sayIn(page, '/keychain');
      const toggle = page.getByTestId('settings.keychain.toggle');
      await expect(toggle).toBeVisible({ timeout: 5000 });
      await expect(toggle).toHaveAttribute('aria-checked', 'false');
      await expect(page.getByTestId('settings.keychain.sub')).toHaveText(settings.keychain_off);
      await page.getByTestId('settings.keychain').scrollIntoViewIfNeeded();
      await shoot(page, 'keychain-off');
    });

    await test.step("the move: 'moving them…' with the switch waiting, then on with its lines", async () => {
      await core.send({ ev: 'keychain', store: 'file', moving: true } as never);
      await expect(page.getByTestId('settings.keychain.sub')).toHaveText(settings.keychain_moving, { timeout: 3000 });
      await expect(page.getByTestId('settings.keychain.toggle')).toHaveAttribute('aria-disabled', 'true');
      await core.send({ ev: 'keychain', store: 'keychain', moving: false, lines: [MOVED] } as never);
      const toggle = page.getByTestId('settings.keychain.toggle');
      await expect(toggle).toHaveAttribute('aria-checked', 'true', { timeout: 3000 });
      await expect(toggle).not.toHaveAttribute('aria-disabled', 'true');
      await expect(page.getByTestId('settings.keychain.sub')).toHaveText(MOVED);
      await shoot(page, 'keychain-on');
    });

    await test.step('the switch clicked sends keychain off; a failed move reads in the error tone', async () => {
      const before = core.cmds().length;
      await page.getByTestId('settings.keychain.toggle').click();
      await expect.poll(() => core.cmds().slice(before).find((c) => (c as Cmd).cmd === 'keychain'), { timeout: 3000 }).toMatchObject({ cmd: 'keychain', to: 'off' });
      await core.send({ ev: 'keychain', store: 'keychain', moving: false, failed: true, lines: [LOCKED] } as never);
      const sub = page.getByTestId('settings.keychain.sub');
      await expect(sub).toHaveText(LOCKED, { timeout: 3000 });
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

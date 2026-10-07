// thread/window-commands · the TUI re-audit's R2 R3 R4 R5 (docs/terminal-parity.md cd629c93, lead
// m_12186): a window command's words act as the TUI's do, never 'unknown command' from the hub and
// never only the settings page. In the thread's composer, typed then ⏎:
//   - R2 '/plugins disable notes', '/plugins enable computer', '/plugins login linear' send the
//     AppCmd settings · plugins sends for its switch and its log in (plugin_set, plugin_login);
//   - R3 '/theme light' sends prefs_set theme light (settings · general's switch) and the window
//     stays on the thread; '/computer-use off' sends computer_use off (the settings page's toggle);
//   - R4 '/scheduled' opens route:scheduled;
//   - R5 '/quit' quits the app (the agents keep running: the hub is its own process);
//   - R7 '/diff sb/x' (a branch, no agent) opens route branch/<p>/sb/x (amb-win's BranchScreen).
// None of these lines goes to the hub as typed slash. Owner: amb-web (thread/commands.ts this round).
// The new app on the scripted core's fixture world, bise's home main thread.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const T = {
  thread: '[data-testid="thread.screen"]',
  field: '[data-testid="composer.field"]',
  scheduled: '[data-testid="scheduled.screen"]',
  branch: '[data-testid="branch.screen"]',
};
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** His line in the thread's composer, then ⏎. */
async function sayIn(page: Page, line: string): Promise<void> {
  const field = page.locator(T.field);
  await field.click();
  await page.keyboard.press('Meta+a');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(line);
  await sleep(250);
  await page.keyboard.press('Enter');
  // a picker that took the first ⏎ (it applied its row): the line is complete, ⏎ again sends it
  await sleep(250);
  // (a command that left the thread has no field any more: nothing to send)
  const left = (await page.locator(T.field).textContent({ timeout: 500 }).catch(() => null)) ?? '';
  if (left.trim() !== '') await page.keyboard.press('Enter');
}

test('thread/window-commands: /plugins <sub> <name>, /theme light, /computer-use off act; /scheduled opens', async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${HOME}/main` });
  const { page } = s;
  try {
    await expect(page.locator(T.thread)).toHaveAttribute('data-project', HOME, { timeout: 10_000 });
    const say = (line: string) => sayIn(page, line);
    const slashes = () => core.cmds().filter((c) => c.cmd === 'slash');

    await test.step('R2 /plugins acts as settings · plugins', async () => {
      await say('/plugins disable notes');
      await core.waitCmd((c) => c.cmd === 'plugin_set' && c.name === 'notes' && !c.on);
      await say('/plugins enable computer');
      await core.waitCmd((c) => c.cmd === 'plugin_set' && c.name === 'computer' && c.on);
      await say('/plugins login linear');
      await core.waitCmd((c) => c.cmd === 'plugin_login' && c.name === 'linear');
      await expect(page.locator(T.thread), 'still on the thread').toBeVisible();
    });

    await test.step('R3 /theme light, /computer-use off', async () => {
      await say('/theme light');
      await core.waitCmd((c) => c.cmd === 'prefs_set' && c.key === 'theme' && c.value === 'light');
      await say('/computer-use off');
      await core.waitCmd((c) => c.cmd === 'computer_use' && c.act === 'off');
      await expect(page.locator(T.thread), 'still on the thread, no settings page').toBeVisible();
    });

    expect(slashes(), 'none of these lines went to the hub as typed').toEqual([]);

    await test.step('R4 /scheduled opens its screen', async () => {
      await say('/scheduled');
      await expect(page.locator(T.scheduled)).toBeVisible({ timeout: 5000 });
    });

  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});

test('thread/window-commands: /quit quits the app (R5)', async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${HOME}/main` });
  try {
    await expect(s.page.locator(T.thread)).toHaveAttribute('data-project', HOME, { timeout: 10_000 });
    const closed = s.app.waitForEvent('close', { timeout: 10_000 });
    await sayIn(s.page, '/quit').catch(() => undefined);
    await closed;
  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});

test('thread/window-commands: /diff sb/x opens the branch, no agent needed (R7)', async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${HOME}/main` });
  try {
    await expect(s.page.locator(T.thread)).toHaveAttribute('data-project', HOME, { timeout: 10_000 });
    await sayIn(s.page, '/diff sb/x');
    const b = s.page.locator(T.branch);
    await expect(b).toHaveAttribute('data-branch', 'sb/x', { timeout: 5000 });
    await expect(b).toHaveAttribute('data-project', HOME);
    expect(core.cmds().filter((c) => c.cmd === 'slash'), 'not a hub line').toEqual([]);
  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});

// native/setup · bar S.7 (the permissions on a first run) and S.5 (the core can't be reached), on
// the scripted helper and core. Real clicks in the window; the effects read outside the app: what
// the helper was asked (perm ask / open), the core process restarted (a new stub, its first
// command again), no Terminal ever (no external link). macOS's own prompts and System Settings'
// panes are the VM pass's (README.md).
//   S.7  first run with none granted: each permission has its allow; continue works with none
//        ('continue for now'); a click asks the helper (perm ask); a refused one says how to grant
//        it later and offers System Settings (perm open); a grant shows at once
//   S.5  the core dies while the app runs: the window says so in one line, the app starts the core
//        again by itself, and the line goes once it's back; Terminal never opens
import { execFileSync } from 'node:child_process';
import { test, expect } from '../../harness';
import { onWorld, sleep } from './world';

const PERMS = ['mic', 'accessibility', 'screen'] as const;

test('setup/perms: none granted: allow asks the helper, a refusal says how, a grant shows, continue for now', async () => {
  await onWorld(async ({ s, helper }) => {
    const { page } = s;
    await helper.send({ ev: 'perms', accessibility: 'ask', mic: 'ask', screen: 'ask', calendar: 'ask' });
    await page.getByTestId('setup.next').click(); // hello -> permissions
    await expect(page.getByTestId('setup.perms'), 'the permissions step').toBeVisible();
    for (const p of PERMS) await expect.soft(page.getByTestId(`setup.perm.${p}`), `${p}: allow`).toBeVisible();
    await expect(page.getByTestId('setup.next'), "he can go on with none: 'continue for now'").toHaveText(/continue for now/);

    await page.getByTestId('setup.perm.mic').click();
    await helper.waitCmd((c) => c.cmd === 'perm' && c.perm === 'mic' && c.action === 'ask', 1000);
    await helper.send({ ev: 'perms', accessibility: 'ask', mic: 'denied', screen: 'ask', calendar: 'ask' });
    const open = page.getByTestId('setup.perm.mic.open');
    await expect(open, 'a refused mic offers System Settings').toBeVisible();
    await expect.soft(page.getByTestId('setup.perms'), 'and says what is lost or how to grant it').toContainText(/settings|later|without/i);
    await open.click();
    await helper.waitCmd((c) => c.cmd === 'perm' && c.perm === 'mic' && c.action === 'open', 1000);

    await page.getByTestId('setup.perm.accessibility').click();
    await helper.waitCmd((c) => c.cmd === 'perm' && c.perm === 'accessibility' && c.action === 'ask', 1000);
    await helper.send({ ev: 'perms', accessibility: 'allowed', mic: 'allowed', screen: 'allowed', calendar: 'ask' });
    for (const p of PERMS) await expect.soft(page.getByTestId(`setup.perm.${p}`), `${p}: no allow once granted`).toBeHidden();
    await expect(page.getByTestId('setup.next'), 'all granted: continue').toHaveText(/^continue$/);
    await page.getByTestId('setup.next').click();
    await expect(page.getByTestId('setup.perms'), 'continue leaves the step').toBeHidden();
  }, { route: 'onboarding' });
});

/** the pids of the core stub, a child of the app's main */
const corePids = (appPid: number): number[] => {
  try {
    return execFileSync('/usr/bin/pgrep', ['-P', String(appPid), '-f', 'core-stub']).toString().split('\n').filter(Boolean).map(Number);
  } catch {
    return [];
  }
};

test('setup/offline: the core dies: one line says so, the app starts it again, Terminal never opens', async () => {
  await onWorld(async ({ s, core, out }) => {
    const pid = s.app.process().pid ?? -1;
    await expect.poll(() => corePids(pid).length, { message: 'the core runs', timeout: 3000 }).toBe(1);
    const first = corePids(pid)[0] ?? -1;
    await expect.poll(() => core.cmds().length, { message: 'the app talks to the core', timeout: 3000 }).toBeGreaterThan(0);
    const before = core.cmds().length;
    process.kill(first, 'SIGKILL');
    // the window says it, in one line (amb-win / amb-home: a line with test id app.core)
    const line = s.page.getByTestId('app.core');
    const said = await line.waitFor({ state: 'visible', timeout: 1500 }).then(() => true, () => false);
    expect.soft(said, 'the window says the core is down, in one line (app.core)').toBe(true);
    // the app starts it again by itself (backoff 0.5 s first)
    await expect.poll(() => corePids(pid).filter((p) => p !== first).length, { message: 'a new core runs', timeout: 3000 }).toBe(1);
    await expect.poll(() => core.cmds().length, { message: 'the app talks to the new core', timeout: 3000 }).toBeGreaterThan(before);
    if (said) await expect.soft(line, 'the line goes once the core is back').toBeHidden({ timeout: 3000 });
    await sleep(200);
    expect(out.lines.filter((l) => l.startsWith('bise-desktop: external')), 'nothing opened outside the app (no Terminal)').toEqual([]);
  });
});

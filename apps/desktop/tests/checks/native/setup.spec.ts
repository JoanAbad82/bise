// native/setup · bar S.7 (the permissions on a first run) and S.5 (the core can't be reached), on
// the scripted helper and core. Real clicks in the window; the effects read outside the app: what
// the helper was asked (perm ask / open), the core process restarted (a new stub, its first
// command again), no Terminal ever (no external link). macOS's own prompts and System Settings'
// panes are the VM pass's (README.md).
//   S.7  first run with none granted: each permission has its allow; continue works with none
//        ('continue for now'); a click asks the helper (perm ask); a refused one says how to grant
//        it later and offers System Settings (perm open); a grant shows at once
//   S.5  the core dies while the app runs: the app starts the core again by itself; a spell under
//        2 s says nothing (designer, CoreLine QUIET_DOWN_MS), a longer one is one line with the
//        core's last log line; Terminal never opens
import { execFileSync } from 'node:child_process';
import { test, expect } from '../../harness';
import path from 'node:path';
import { onWorld, sleep } from './world';

/** the scripted core that logs a line on stderr first (what the window should show as its last log line) */
const NOISY = path.join(__dirname, 'fakes', 'core-noisy.mjs');

const PERMS = ['mic', 'accessibility', 'screen'] as const;

/** src/app/CoreLine.tsx QUIET_DOWN_MS: how long the core may be down before the window says so. */
const QUIET_DOWN_MS = 2000;

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
    return execFileSync('/usr/bin/pgrep', ['-P', String(appPid), '-f', 'core-(stub|noisy)']).toString().split('\n').filter(Boolean).map(Number);
  } catch {
    return [];
  }
};

test('setup/offline: the core dies: the app starts it again, a short spell says nothing, Terminal never opens', async () => {
  await onWorld(async ({ s, core, out }) => {
    const pid = s.app.process().pid ?? -1;
    await expect.poll(() => corePids(pid).length, { message: 'the core runs', timeout: 3000 }).toBe(1);
    const first = corePids(pid)[0] ?? -1;
    await expect.poll(() => core.cmds().length, { message: 'the app talks to the core', timeout: 3000 }).toBeGreaterThan(0);
    const before = core.cmds().length;
    const t0 = Date.now();
    process.kill(first, 'SIGKILL');
    // designer's rule (src/app/CoreLine.tsx QUIET_DOWN_MS, 2 s): a spell under 2 s says nothing at
    // all; the app restarts the core after its 0.5 s backoff, so this kill must stay silent
    const line = s.page.getByTestId('app.core');
    let shown = false;
    // the app starts it again by itself (backoff 0.5 s first)
    await expect
      .poll(async () => {
        if (await line.isVisible()) shown = true;
        return corePids(pid).filter((p) => p !== first).length;
      }, { message: 'a new core runs', timeout: 3000 })
      .toBe(1);
    await expect.poll(() => core.cmds().length, { message: 'the app talks to the new core', timeout: 3000 }).toBeGreaterThan(before);
    const backMs = Date.now() - t0;
    test.info().annotations.push({ type: 'back', description: `the core answered again ${String(backMs)} ms after the kill` });
    if (backMs < QUIET_DOWN_MS) expect.soft(shown, `back in ${String(backMs)} ms (< ${String(QUIET_DOWN_MS)} ms): no line at all`).toBe(false);
    await sleep(200);
    expect(out.lines.filter((l) => l.startsWith('bise-desktop: external')), 'nothing opened outside the app (no Terminal)').toEqual([]);
  });
});

test("setup/offline: while the core is down the line shows the core's last log line", async () => {
  await onWorld(async ({ s }) => {
    const pid = s.app.process().pid ?? -1;
    await expect.poll(() => corePids(pid).length, { message: 'the core runs', timeout: 3000 }).toBe(1);
    await sleep(500);
    // the line says it only after QUIET_DOWN_MS (2 s) down, so the restart is held off by killing
    // every new core too for that long plus 1.5 s to read it
    const end = Date.now() + QUIET_DOWN_MS + 1500;
    const seen: string[] = [];
    const line = s.page.getByTestId('app.core');
    while (Date.now() < end) {
      for (const p of corePids(pid)) { try { process.kill(p, 'SIGKILL'); } catch { /* gone */ } }
      if (await line.isVisible()) {
        if (seen.length === 0) await s.page.screenshot({ path: test.info().outputPath('offline-line.png') }); // the frame for the report
        // the last log line is in the pill's popover (designer's desktop-notices v2): open it once
        if ((await s.page.getByTestId('app.core.pop').count()) === 0) await s.page.getByTestId('app.core.open').click({ timeout: 500 }).catch(() => undefined);
        seen.push(await line.innerText());
      }
      await sleep(100);
    }
    expect(seen.length, 'the line is up while the core is down').toBeGreaterThan(0);
    expect.soft(seen.some((t) => t.includes('listening on the fixture world')), `the line shows the core's last log line (saw ${JSON.stringify([...new Set(seen)])})`).toBe(true);
  }, { env: { BISE_DESKTOP_BISE: NOISY } });
});

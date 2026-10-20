// native/setup · fn's permissions, just in time (desktop-onboarding v4 §3) and S.5 (the core can't
// be reached), on the scripted helper and core. Real clicks in the window and the capsule; the
// effects read outside the app: what the helper was asked (perm ask / open), what the core got
// (prefs_set hints.fn_perms, no talk_start), the core process restarted (a new stub, its first
// command again), no Terminal ever (no external link). macOS's own prompts and System Settings'
// panes are the VM pass's (README.md).
//   perms  the first launch has four steps, no permissions; his first fn hold with one missing
//          opens the capsule's sheet instead of the talk, marked shown; [allow] asks them in turn
//          (a refused one: its pane); a grant shows at once; 'not now' opens the spotlight; the
//          next hold talks, never the sheet again
//   S.5  the core dies while the app runs: the app starts the core again by itself; a spell under
//        2 s says nothing (designer, CoreLine QUIET_DOWN_MS), a longer one is one line with the
//        core's last log line; Terminal never opens
import { execFileSync } from 'node:child_process';
import { test, expect } from '../../harness';
import path from 'node:path';
import { capsulePage, onWorld, sleep } from './world';
import { settings } from '../../../src/proto/words.gen';

/** the scripted core that logs a line on stderr first (what the window should show as its last log line) */
const NOISY = path.join(__dirname, 'fakes', 'core-noisy.mjs');

/** src/app/CoreLine.tsx QUIET_DOWN_MS: how long the core may be down before the window says so. */
const QUIET_DOWN_MS = 2000;

test("setup/perms: his first fn hold with one missing: the capsule's sheet (marked shown), allow asks in turn, not now opens the spotlight; never twice", async () => {
  await onWorld(async ({ s, helper, core }) => {
    await helper.send({ ev: 'perms', accessibility: 'ask', mic: 'ask', screen: 'ask' });
    const cap = await capsulePage(s);
    await helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' });
    const sheet = cap.getByTestId('capsule.perms');
    await expect(sheet, 'the sheet, instead of the talk').toBeVisible({ timeout: 3000 });
    await expect(cap.getByTestId('capsule.talk'), 'no talk while it asks').toHaveCount(0);
    await expect.soft(sheet).toContainText(settings.onb_perms_title);
    await expect.soft(sheet).toContainText(settings.onb_perms_sub);
    // macOS's own names, as System Settings shows them (designer m_34345)
    for (const name of [settings.onb_perm_mic, settings.onb_perm_accessibility, settings.onb_perm_screen]) await expect.soft(sheet).toContainText(name);
    await expect.poll(() => core.cmds().some((c) => c['cmd'] === 'prefs_set' && c['key'] === 'hints.fn_perms' && c['value'] === true), { message: 'marked shown (hints.fn_perms)', timeout: 2000 }).toBe(true);
    expect(core.cmds().some((c) => c['cmd'] === 'talk_start'), 'the core never listened').toBe(false);
    await helper.send({ ev: 'fn', act: 'talk_end', by: 'fn' });
    await expect(sheet, 'his release leaves it up').toBeVisible();

    await cap.getByTestId('capsule.perms.allow').click();
    await helper.waitCmd((c) => c.cmd === 'perm' && c.perm === 'mic' && c.action === 'ask', 1000);
    await helper.send({ ev: 'perms', accessibility: 'denied', mic: 'allowed', screen: 'ask' });
    await expect.soft(sheet, 'a grant shows at once').toContainText('allowed');
    await cap.getByTestId('capsule.perms.allow').click();
    await helper.waitCmd((c) => c.cmd === 'perm' && c.perm === 'accessibility' && c.action === 'open', 1000);

    await cap.getByTestId('capsule.perms.later').click();
    await expect(cap.getByTestId('spot'), "'not now': his words go typed, in the spotlight").toBeVisible({ timeout: 2000 });
    await helper.send({ ev: 'fn', act: 'esc' });
    await expect(cap.getByTestId('spot')).toBeHidden({ timeout: 2000 });

    // the next hold talks: the sheet never comes back
    await helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' });
    await expect(cap.getByTestId('capsule.talk'), 'the next hold talks').toBeVisible({ timeout: 3000 });
    await expect(cap.getByTestId('capsule.perms')).toHaveCount(0);
    await helper.send({ ev: 'fn', act: 'cancel' });
  });
});

test('setup/perms: the first launch no longer asks them: four steps, no permissions step', async () => {
  await onWorld(async ({ s }) => {
    const { page } = s;
    await expect(page.getByTestId('setup.step.hello')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('setup.step.hello').locator('.steps i')).toHaveCount(4);
    await page.getByTestId('setup.next').click();
    await expect(page.getByTestId('setup.step.model'), 'hello -> the model, no permissions step').toBeVisible();
    await expect(page.getByTestId('setup.perms')).toHaveCount(0);
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

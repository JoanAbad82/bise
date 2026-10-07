// native/crash · bar O.4: the core crashes (it dies on a signal, as a Rust panic's abort or a segfault
// does, not a clean stop). Passes when the window says the core crashed, in one line (app.core), and
// how to send the report (an action in that line: a button or link whose words say report), and the
// app starts the core again by itself. Nothing is sent anywhere here: the report's sending is a click
// he makes. The core is the scripted stub (FakeCore), crashed with SIGSEGV.
import { execFileSync } from 'node:child_process';
import { test, expect } from '../../harness';
import { onWorld } from './world';

const corePids = (appPid: number): number[] => {
  try {
    return execFileSync('/usr/bin/pgrep', ['-P', String(appPid), '-f', 'core-stub']).toString().split('\n').filter(Boolean).map(Number);
  } catch {
    return [];
  }
};

test('native/crash: the core crashes: the window says so and how to send the report, the core comes back', async () => {
  await onWorld(async ({ s, core }) => {
    const pid = s.app.process().pid ?? -1;
    await expect.poll(() => corePids(pid).length, { message: 'the core runs', timeout: 3000 }).toBe(1);
    await expect.poll(() => core.cmds().length, { message: 'the app talks to the core', timeout: 3000 }).toBeGreaterThan(0);
    const first = corePids(pid)[0] ?? -1;
    process.kill(first, 'SIGSEGV');
    const line = s.page.getByTestId('app.core');
    await expect(line, 'one line about the core').toBeVisible({ timeout: 1500 });
    await s.page.screenshot({ path: test.info().outputPath('crash-line.png') }); // the frame for the report
    await expect.soft(line, 'it says the core crashed (not just "isn\'t running")').toContainText(/crash/i);
    await expect.soft(line.getByRole('button', { name: /report/i }).or(line.getByRole('link', { name: /report/i })), 'and offers to send the report').toBeVisible();
    await expect.poll(() => corePids(pid).filter((p) => p !== first).length, { message: 'a new core runs', timeout: 3000 }).toBe(1);
  });
});

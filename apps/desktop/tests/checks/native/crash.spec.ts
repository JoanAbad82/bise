// native/crash · bar O.4 in designer's words (voice-window part 2, lead m_16794). The core crashes (it
// dies on a signal, as a Rust panic's abort or a segfault does). Passes when:
//   - a crash that comes back by itself asks nothing of him: no ▲ line, the core runs again;
//     main writes its report (window.bise.core.report(): the reason, never sent anywhere), and
//     with no bise window shown it says so once (CORE_CRASH_NOTE_LINE: 'bise crashed · open bise');
//   - the third crash in 10 min stops the restarts: '▲ bise keeps crashing: 3 times in 10 min, the
//     last one: core exited with signal 11.', 'start bise', 'show the report', 'it stopped trying',
//     and no core runs;
//   - 'start bise' starts it again, and the line goes once it is up.
// The core is the scripted stub (FakeCore), crashed with SIGSEGV. Shots for designer.
import { execFileSync } from 'node:child_process';
import { CORE_CRASH_NOTE_LINE } from '../../../src/shared/api';
import { test, expect } from '../../harness';
import { onWorld, sleep } from './world';

const corePids = (appPid: number): number[] => {
  try {
    return execFileSync('/usr/bin/pgrep', ['-P', String(appPid), '-f', 'core-stub']).toString().split('\n').filter(Boolean).map(Number);
  } catch {
    return [];
  }
};

type Report = { path: string; text: string } | null;

test('native/crash: a crash that comes back asks nothing; 3 in 10 min stop the restarts, start bise starts it again', async () => {
  await onWorld(async ({ s, core, out }) => {
    const pid = s.app.process().pid ?? -1;
    const { page } = s;
    const line = page.getByTestId('app.core');
    await expect.poll(() => corePids(pid).length, { message: 'the core runs', timeout: 3000 }).toBe(1);
    await expect.poll(() => core.cmds().length, { message: 'the app talks to the core', timeout: 3000 }).toBeGreaterThan(0);
    const crash = (): number => {
      const p = corePids(pid)[0] ?? -1;
      process.kill(p, 'SIGSEGV');
      return p;
    };

    // 1: it comes back by itself, nothing asks him
    const first = crash();
    await expect.poll(() => corePids(pid).filter((p) => p !== first).length, { message: 'a new core runs', timeout: 3000 }).toBe(1);
    await expect(page.getByTestId('app.core.start'), 'no start bise: it came back by itself').toHaveCount(0);
    const report = (await page.evaluate(() => (window as unknown as { bise: { core: { report: () => Promise<unknown> } } }).bise.core.report())) as Report;
    expect(report?.path ?? '', 'a report in bise home').toMatch(/\/reports\/crash-\d\d-\d\d\.md$/);
    expect(report?.text ?? '').toContain('# bise crashed: core exited with signal 11');
    expect(out.of(CORE_CRASH_NOTE_LINE), 'no window shown: one notification').toEqual(['bise crashed · open bise']);

    // 2 and 3: the third crash in 10 min stops the restarts
    await sleep(700);
    const second = crash();
    await expect.poll(() => corePids(pid).filter((p) => p !== second).length, { message: 'it comes back once more', timeout: 4000 }).toBe(1);
    await sleep(700);
    crash();
    const text = page.getByTestId('app.core.text');
    await expect(text).toHaveText('▲ bise keeps crashing: 3 times in 10 min, the last one: core exited with signal 11.', { timeout: 3000 });
    await expect(page.getByTestId('app.core.note')).toHaveText('it stopped trying');
    await expect(page.getByTestId('app.core.start')).toHaveText('start bise');
    await expect(page.getByTestId('app.core.report')).toHaveText('show the report');
    const tone = await line.evaluate((el) => ({ color: getComputedStyle(el).color, err: getComputedStyle(document.documentElement).getPropertyValue('--c-err').trim() }));
    expect(tone.color, 'in the error tone').not.toBe('');
    await sleep(2000);
    expect(corePids(pid), 'it stopped trying: no core').toEqual([]);
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.screenshot({ path: test.info().outputPath(`keeps-crashing-${scheme}.png`) });
    }

    // start bise: it runs again, the line goes ('bise is back.' then nothing)
    await page.getByTestId('app.core.start').click();
    await expect.poll(() => corePids(pid).length, { message: 'start bise starts it', timeout: 3000 }).toBe(1);
    await expect(text, 'back').toHaveText('bise is back.', { timeout: 3000 });
    await page.screenshot({ path: test.info().outputPath('back.png') });
    await expect(line, 'gone after 3 s').toBeHidden({ timeout: 5000 });
  });
});

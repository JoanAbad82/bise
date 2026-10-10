// app/core-line · bar S.5 + O.4 in designer's words (voice-window part 2, lead m_16794): the core
// panics once (a Rust panic on stderr, exit 101) and main starts it again. Passes when the window
// never asks him anything for it (no ▲ line, no 'start bise': it came back by itself), says only
// the dim 'bise stopped. starting it again… nothing is lost.' if the spell lasts 2 s or more, then
// 'bise is back.' for 3 s, and main wrote the crash report: the panic's message as the reason and
// the log's last lines (window.bise.core.report()). The scripted core wrapped in
// fakes/core-panic.mjs, which panics on its first run only. Owner: amb-win (updated by amb-mac with
// its ok, m_16800).
import path from 'node:path';
import { test, expect } from '../../harness';
import { onWorld, sleep } from '../native/world';

const PANIC = path.join(__dirname, 'fakes', 'core-panic.mjs');
type Report = { path: string; text: string } | null;

test('app/core-line: a panicked core that comes back asks nothing; its report says why', async () => {
  await onWorld(
    async ({ s }) => {
      const { page } = s;
      const report = (): Promise<Report> => page.evaluate(() => (window as unknown as { bise: { core: { report: () => Promise<unknown> } } }).bise.core.report()) as Promise<Report>;
      await expect.poll(async () => (await report())?.path ?? '', { message: 'the panic wrote a report', timeout: 8000 }).toMatch(/crash-\d\d-\d\d\.md$/);
      const r = await report();
      expect(r?.text).toContain('# bise crashed: core panicked: no hub for acme: the workspace moved');
      expect(r?.text).toContain("thread 'main' panicked at rust/core/src/hub.rs:212:9:");
      // while it comes back: nothing under 2 s, else the dim words only
      const seen: string[] = [];
      for (let i = 0; i < 30; i += 1) {
        const t = await page.getByTestId('app.core.text').textContent({ timeout: 100 }).catch(() => null);
        if (t !== null) seen.push(t);
        await sleep(100);
      }
      for (const t of seen) expect(['bise stopped. starting it again… nothing is lost.', 'bise is back.']).toContain(t);
      await expect(page.getByTestId('app.core.start'), 'it came back by itself: nothing to click').toHaveCount(0);
      if (seen.length > 0) await page.screenshot({ path: test.info().outputPath('core-line.png') });
      await expect(page.getByTestId('app.core'), 'gone once it is back').toBeHidden({ timeout: 6000 });
    },
    { env: { BISE_DESKTOP_BISE: PANIC } },
  );
});

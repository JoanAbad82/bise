// app/report · the last crash report opened in the window (designer's voice-window part 2, amb-mac
// 92b01565: window.bise.core.report()). Passes when, after the scripted core panicked once (it
// wrote ~/.bise/reports/crash-HH-MM.md in the test home, fakes/core-panic.mjs):
//   - the route 'report' shows 'crash report' with the file ('~/.bise/reports/crash-…md') and the
//     report as markdown (its title, the panic line);
//   - 'copy' copies the whole text (test mode: COPY_LINE on stdout, never his clipboard) and reads
//     'copied'; 'show in Finder' reveals the file (REVEAL_LINE <path>, never Finder);
// Owner: amb-win.
import path from 'node:path';
import { test, expect } from '../../harness';
import { onWorld } from '../native/world';
import { COPY_LINE, REVEAL_LINE } from '../../../src/shared/api';

const PANIC = path.join(__dirname, 'fakes', 'core-panic.mjs');
type Report = { path: string; text: string } | null;

test('app/report: the crash report in the window, with copy and show in Finder', async () => {
  await onWorld(
    async ({ s, out }) => {
      const { page } = s;
      const report = (): Promise<Report> => page.evaluate(() => (window as unknown as { bise: { core: { report: () => Promise<unknown> } } }).bise.core.report()) as Promise<Report>;
      await expect.poll(async () => (await report())?.path ?? '', { message: 'the panic wrote a report', timeout: 8000 }).toMatch(/crash-\d\d-\d\d\.md$/);
      const r = await report();
      // the screen asks once it opens: opened again now that the report exists (a reload keeps the route)
      await page.reload();
      const screen = page.getByTestId('app.report');
      await expect(screen).toBeVisible({ timeout: 10_000 });
      await expect(screen.locator('.b-head .t1')).toHaveText('crash report');
      await expect(screen.locator('.b-head .t2')).toHaveText(/^~\/\.bise\/reports\/crash-\d\d-\d\d\.md$/);
      await expect(page.getByTestId('app.report.text')).toContainText('bise crashed: core panicked: no hub for acme: the workspace moved');
      await expect(page.getByTestId('app.report.text')).toContainText("thread 'main' panicked at rust/core/src/hub.rs:212:9:");
      await page.screenshot({ path: test.info().outputPath('report-light.png') });
      // the dark one for designer's sheet (the fixture world's theme follows the system)
      await page.emulateMedia({ colorScheme: 'dark' });
      await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe('rgb(255, 255, 255)');
      await page.screenshot({ path: test.info().outputPath('report-dark.png') });
      await page.emulateMedia({ colorScheme: 'light' });

      await page.getByTestId('app.report.copy').click();
      await expect(page.getByTestId('app.report.copy')).toHaveText('copied');
      await expect.poll(() => out.of(COPY_LINE).length, { message: 'copied, in test mode a line on stdout' }).toBeGreaterThan(0);
      expect(JSON.parse(out.of(COPY_LINE).at(-1) ?? '""')).toBe(r?.text);

      await page.getByTestId('app.report.finder').click();
      await expect.poll(() => out.of(REVEAL_LINE).at(-1) ?? '', { message: 'shown in Finder (test mode: a line)' }).toBe(r?.path);
    },
    { route: 'report', env: { BISE_DESKTOP_BISE: PANIC } },
  );
});

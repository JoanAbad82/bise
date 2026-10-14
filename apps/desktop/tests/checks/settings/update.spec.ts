// settings/update · settings › general's update group (designer's app-swap v2, his pick). amb-mac's
// window.bise.app.update() is faked by BISE_DESKTOP_TEST_APP_UPDATE, the last update's log by
// BISE_DESKTOP_TEST_RESTART_LOG (test mode never runs the swap script, never quits). Passes when:
//   - ready: 'a new build is ready', '3f9a2c1 · you run 20b1044'; 'restart to update' swaps at once
//     (no confirm: test mode prints 'bise-desktop: app swap settings/general', the route the new
//     build reopens) and the row says 'restarting on 3f9a2c1…';
//   - up to date: '✓ up to date', no button; failed (the reopened app): '▲ couldn't update to
//     3f9a2c1', 'try again' and 'show the log', which opens the log in the window (report/restart);
//   - test app: 'updates come from the try'; his app off a try bundle: no update group at all.
// Frames: update-<state>-<w>-<theme>.png at 1400, 1100 and 800 wide (BISE_UPDATE_SHOTS=1; else 1100).
// Owner: amb-home.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const A = '20b1044e7d1c55aa0aaaaaaaaaaaaaaaaaaaaaaa';
const B = '3f9a2c1d0be63ab90bbbbbbbbbbbbbbbbbbbbbbb';
const LOG = [
  'desktop-try: --- 2026-10-15 10:42:07',
  'desktop-try: the app asked for the swap to 3f9a2c1d (it was 20b1044e)',
  'desktop-try: the promoted bundle needs its runtime inside (Contents/Resources/bin lacks repl-live)',
  'desktop-try: reopened bise try.app (20b1044e)',
].join('\n');
type Update = { state: string; live: string | null; staged: string | null; why: string | null; none: string | null; failed: string | null };
const STATES: Record<string, Update> = {
  ready: { state: 'staged', live: A, staged: B, why: null, none: null, failed: null },
  current: { state: 'current', live: B, staged: null, why: null, none: null, failed: null },
  failed: { state: 'staged', live: A, staged: B, why: null, none: null, failed: B },
  test: { state: 'none', live: A, staged: null, why: "this app runs on a test home, not yours: it can't update itself.", none: 'test_home', failed: null },
  his: { state: 'none', live: null, staged: null, why: "this app isn't your try's build: it can't update itself.", none: 'not_try', failed: null },
};
const SIZES = process.env['BISE_UPDATE_SHOTS'] === '1' ? ['1400x900', '1100x800', '800x700'] : ['1100x800'];
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const flat = (s: string | null): string => (s ?? '').replace(/\s+/g, ' ').trim();

async function shoot(page: Page, name: string): Promise<void> {
  await page.mouse.move(1, 1);
  for (const theme of ['light', 'dark'] as const) {
    await page.evaluate((t) => {
      document.documentElement.setAttribute('data-theme', t);
      document.documentElement.style.setProperty('color-scheme', t);
    }, theme);
    await sleep(250);
    await page.screenshot({ path: test.info().outputPath(`${name}-${theme}.png`) });
  }
}

for (const size of SIZES) {
  const w = size.split('x')[0] ?? '';
  for (const [name, update] of Object.entries(STATES)) {
    test(`settings/update: ${name}, ${size}`, async () => {
      const core = new FakeCore();
      const env: Record<string, string> = { BISE_DESKTOP_TEST_APP_UPDATE: JSON.stringify(update), BISE_DESKTOP_TEST_RESTART_LOG: LOG };
      const s = await launchDesktop({ core, route: 'settings/general', size, env });
      const { page } = s;
      try {
        await expect(page.getByTestId('settings.page.general')).toBeVisible({ timeout: 10_000 });
        const label = page.getByTestId('settings.update.label');
        const row = page.getByTestId('settings.update.row');
        if (name === 'his') {
          await sleep(500);
          await expect(page.getByTestId('settings.update'), 'his app off a try bundle: no update group').toHaveCount(0);
          await shoot(page, `update-${name}-${w}`);
          return;
        }
        const words: Record<string, [string, string]> = {
          ready: ['a new build is ready', '3f9a2c1 · you run 20b1044'],
          current: ['✓ up to date', 'you run 3f9a2c1, the newest build'],
          failed: ["▲ couldn't update to 3f9a2c1", "you're still on 20b1044. nothing is lost."],
          test: ['updates come from the try', 'this app runs on a test home, not yours'],
        };
        const [t, sub] = words[name] ?? ['', ''];
        await expect.poll(async () => flat(await label.textContent()), { timeout: 5000, message: 'the row' }).toBe(t);
        expect(flat(await row.textContent())).toContain(sub);
        await shoot(page, `update-${name}-${w}`);
        if (name === 'ready') {
          const said: string[] = [];
          s.app.process().stdout?.on('data', (d: Buffer) => said.push(String(d)));
          await page.getByTestId('settings.update.restart').click();
          await expect.poll(() => said.join(''), { timeout: 5000, message: 'swapped at once, back on settings › general' }).toContain('bise-desktop: app swap settings/general');
          await expect.poll(async () => flat(await label.textContent()), { timeout: 2000 }).toBe('restarting on 3f9a2c1…');
          expect(flat(await row.textContent())).toContain('the window comes back in a moment. your agents keep running.');
          await shoot(page, `update-restarting-${w}`);
        }
        if (name === 'failed') {
          await expect(page.getByTestId('settings.update.again')).toBeVisible();
          await page.getByTestId('settings.update.log').click();
          await expect(page.getByTestId('app.report.text'), 'the log in the window').toContainText('reopened bise try.app');
          await shoot(page, `update-log-${w}`);
        }
      } finally {
        await s.close();
      }
    });
  }
}

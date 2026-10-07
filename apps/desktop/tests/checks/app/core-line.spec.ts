// app/core-line · bar S.5 + O.4 (lead m_10715, amb-mac e9b26d21): the core panics (a Rust panic on
// stderr, exit 101). Passes when the window's core line says 'bise crashed · starting it again…',
// shows the panic's message dim and mono under it, offers 'show the report' (main's test mode prints
// its reveal line, never Finder) and 'copy its path' (the test clipboard gets the log's path), and
// goes once the core is back. The scripted core (FakeCore's stub) wrapped in fakes/core-panic.mjs,
// which panics on its first run only. Owner: amb-win.
import path from 'node:path';
import { CORE_REVEAL_LINE, COPY_LINE } from '../../../src/shared/api';
import { test, expect } from '../../harness';
import { onWorld } from '../native/world';

const PANIC = path.join(__dirname, 'fakes', 'core-panic.mjs');

test('app/core-line: a panicked core: the line says it crashed, its last line, the report; gone once back', async () => {
  await onWorld(
    async ({ s, out }) => {
      const { page } = s;
      const line = page.getByTestId('app.core');
      await expect(line, 'one line about the core once it panicked').toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('app.core.text')).toHaveText('bise crashed · starting it again…');
      const last = page.getByTestId('app.core.last');
      await expect(last, "the panic's message, under the words").toHaveText('no hub for acme: the workspace moved');
      const look = await last.evaluate((el) => {
        const cs = getComputedStyle(el);
        const mono = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim();
        return { font: cs.fontFamily, mono, size: cs.fontSize };
      });
      expect(look.font.split(',')[0], 'mono').toBe(look.mono.split(',')[0]);
      expect(look.size).toBe('12px');
      await page.screenshot({ path: test.info().outputPath('core-crashed.png') });

      await page.getByTestId('app.core.report').click();
      const log = await out.wait(CORE_REVEAL_LINE, (rest) => rest.endsWith('core.log'), 2000);
      await page.getByTestId('app.core.copy').click();
      await out.wait(COPY_LINE, (rest) => rest === JSON.stringify(log), 2000);
      await expect(page.getByTestId('app.core.copy'), 'says it copied').toHaveText('copied');

      await expect(line, 'gone once the core is back').toBeHidden({ timeout: 8000 });
    },
    { env: { BISE_DESKTOP_BISE: PANIC } },
  );
});

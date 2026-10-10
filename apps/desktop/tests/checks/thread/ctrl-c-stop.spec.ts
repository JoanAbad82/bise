// thread/ctrl-c-stop · K6 (docs/terminal-parity.md; ambient-pm m_17250, lead m_17252): ctrl+c stops
// the turn in the window like the TUI's (rust/tui/src/input.rs: a running turn is interrupted
// first). Esc keeps doing it too (esc-order.spec). Copy is ⌘C on the Mac, so ctrl+c is free; but
// with text selected in the thread, ctrl+c does nothing else (he may be copying by habit).
//   - text selected in the thread: ctrl+c sends no stop;
//   - no selection, the caret in the composer with a draft: ctrl+c sends HubCmd stop for the agent
//     in view, and the draft stays;
//   - ⌘C on the same selection never stops.
// Owner: amb-web. The new app on the scripted core's fixture world: acme's perf is working.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const ACME = 'acme-1a2b3c4d';
const T = {
  thread: '[data-testid="thread.screen"]',
  list: '[data-testid="thread.list"]',
  field: '[data-testid="composer.field"]',
};
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

test('thread/ctrl-c-stop: ctrl+c stops the working turn, but not while text is selected', async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${ACME}/perf` });
  const { page } = s;
  const stops = () => core.cmds().filter((c) => c.cmd === 'stop');
  try {
    await expect(page.locator(T.thread)).toHaveAttribute('data-project', ACME, { timeout: 10_000 });
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.type('garde ça');

    await test.step('a selection in the thread: ctrl+c and ⌘C send no stop', async () => {
      const picked = await page.locator(T.list).evaluate((el) => {
        const row = el.querySelector('[data-testid^="thread.entry."]');
        if (row === null) return '';
        const r = document.createRange();
        r.selectNodeContents(row);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(r);
        return sel?.toString() ?? '';
      });
      expect(picked.trim(), 'some thread text is selected').not.toBe('');
      await page.keyboard.press('Control+c');
      await page.keyboard.press('Meta+c');
      await sleep(400);
      expect(stops(), 'his selection: ctrl+c is not a stop').toEqual([]);
      await page.screenshot({ path: test.info().outputPath('1-selected-no-stop.png') });
    });

    await test.step('no selection, caret in the composer: ctrl+c stops the turn, the draft stays', async () => {
      await field.click();
      await page.keyboard.press('End');
      expect(await page.evaluate(() => window.getSelection()?.isCollapsed ?? true)).toBe(true);
      await page.keyboard.press('Control+c');
      await core.waitCmd((c) => c.cmd === 'stop' && c.project === ACME && c.agent === 'perf');
      expect(stops(), 'one stop').toHaveLength(1);
      await expect(field, 'the composer keeps his draft').toHaveText('garde ça');
      await page.screenshot({ path: test.info().outputPath('2-ctrl-c-stopping.png') });
    });
  } finally {
    await s.close();
  }
});

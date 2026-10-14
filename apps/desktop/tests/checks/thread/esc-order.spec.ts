// thread/esc-order · the TUI re-audit's R18 and R20 (docs/terminal-parity.md cd629c93, lead m_12186):
// in a working agent's thread, esc closes an open list first; it never stops the turn, ctrl+c does
// (his ask main m_22205, the TUI's sb/keys.rs:104).
//   - R18: '/switch ' (an argument list: the agents) open while the agent works: esc closes the list, keeps
//     the text, and sends no stop; the next esc (no list open) still sends none; ctrl+c stops it.
//   - R20: esc on the / NAME list ('/ar') closes it and clears the /query, as the TUI's
//     (rust/tui/src/input.rs: a command-name list isn't 'closable', its argument lists are) and
//     bar T B21; an argument list keeps the text, as the TUI's. No stop either way.
// The bug it found: ProseMirror preventDefaults every Escape (captureKeyDown), so since the
// TipTap flip the thread's bubbling esc→stop never fired; the composer now calls the screen's esc
// (Composer onEscape) once no list took it.
// Owner: amb-web. The new app on the scripted core's fixture world: acme's perf is working.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const ACME = 'acme-1a2b3c4d';
const T = {
  thread: '[data-testid="thread.screen"]',
  field: '[data-testid="composer.field"]',
  pick: '[data-testid="composer.pick"]',
};
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

test('thread/esc-order: esc closes an open list first and never stops the turn, ctrl+c does; esc on the / name list clears it', async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${ACME}/perf` });
  const { page } = s;
  const stops = () => core.cmds().filter((c) => c.cmd === 'stop');
  const text = async () => ((await page.locator(T.field).textContent()) ?? '').trim();
  try {
    await expect(page.locator(T.thread)).toHaveAttribute('data-project', ACME, { timeout: 10_000 });
    await page.locator(T.field).click();

    await test.step('R20: esc on the / name list clears the /query, no stop', async () => {
      await page.keyboard.type('/ar');
      await expect(page.locator(T.pick)).toBeVisible({ timeout: 2000 });
      await page.keyboard.press('Escape');
      await expect(page.locator(T.pick)).toBeHidden();
      expect(await text(), "the TUI's: the query goes").toBe('');
      await sleep(300);
      expect(stops(), 'the turn goes on').toEqual([]);
    });

    await test.step("R18: esc on an argument list closes it, keeps '/switch ', no stop", async () => {
      await page.keyboard.type('/switch ');
      await expect(page.locator(T.pick)).toBeVisible({ timeout: 2000 });
      await page.keyboard.press('Escape');
      await expect(page.locator(T.pick)).toBeHidden();
      expect(await text()).toBe('/switch');
      await sleep(300);
      expect(stops(), "a list open: esc is the list's").toEqual([]);
    });

    await test.step('the next esc, no list open, stops nothing (main m_22205); ctrl+c stops the turn', async () => {
      expect(stops()).toEqual([]);
      await page.keyboard.press('Escape');
      await sleep(300);
      expect(stops(), 'esc: the turn goes on').toEqual([]);
      await expect(page.locator(T.thread), 'perf still works').toHaveAttribute('data-agent', 'perf');
      await page.locator(T.field).click();
      await page.keyboard.type('garde');
      await expect(page.getByTestId('composer.keys'), "the key line says it: 'ctrl+c stop'").toContainText('ctrl+c stop');
      await page.screenshot({ path: test.info().outputPath('keyline-working-light.png') });
      await page.keyboard.press('Control+c');
      await core.waitCmd((c) => c.cmd === 'stop' && 'project' in c && c.project === ACME && c.agent === 'perf', 1000);
      expect(await text(), 'his draft stays').toBe('garde');
    });
  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});

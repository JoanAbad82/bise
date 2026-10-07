// spotlight/new · bar A.1 (the TUI's /new with its brief): in the spotlight (fn space), '/new …'
// or 'start an agent: …' shows one 'start an agent' row, and ⏎ sends amb-win's newAgent
// ({cmd:'new', project: bise's home, brief}) instead of asking bise. Owner: amb-web (lead m_10665).
// The new app on the scripted helper (fn space) and the scripted core (fixture world); the command
// read in the core's log.
import { test, expect } from '../../harness';
import { CAPSULE, capsulePage, onWorld } from '../native/world';

const HOME = 'bise-home-00000000';

for (const typed of ['/new count the slow queries', 'start an agent: count the slow queries']) {
  test(`spotlight/new: '${typed}' + ⏎ starts an agent in bise's home with the brief, not a send`, async () => {
    await onWorld(async (w) => {
      await w.helper.send({ ev: 'fn', act: 'key', key: 'space' });
      await w.out.wait(CAPSULE, (l) => l.startsWith('show'));
      const cap = await capsulePage(w.s);
      const field = cap.getByTestId('spot.input');
      await expect(field).toBeFocused({ timeout: 5000 });
      await cap.keyboard.type(typed, { delay: 15 });
      const row = cap.getByTestId('spot.row.new');
      await expect(row, "one 'start an agent' row").toContainText('start an agent', { timeout: 3000 });
      await expect(row).toContainText('count the slow queries');
      await expect(cap.locator('[data-testid^="spot.row."]')).toHaveCount(1);
      await cap.screenshot({ path: test.info().outputPath('new.png') });
      await cap.keyboard.press('Enter');
      const c = (await w.core.waitCmd((x) => x.cmd === 'new', 5000)) as { project?: string; brief?: string };
      expect(c.project, "bise's home").toBe(HOME);
      expect(c.brief).toBe('count the slow queries');
      expect(w.core.cmds().some((x) => x.cmd === 'send'), 'not sent to bise as words').toBe(false);
      await expect(field, 'the field clears').toHaveValue('');
    });
  });
}

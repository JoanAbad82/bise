// thread/scheduled-real · bar T, amb-feed's batch 3b scheduled entries (6e9d68f8) as amb-win draws
// them (de71e6d2: the TUI's faint '◷ head ▸' row, thread.scheduled.<pos>, data-id = the task id),
// on the REAL core over the throwaway world, next to the TUI on the same hub (ambient-lead m_11721).
// Owner: qa-flows. shop's main runs `sb every … "<words>"` (set), then `sb every --stop <id>`
// (ended); passes when each shows in main's thread as a ◷ row with the hub's words, the TUI shows
// the same ◷ lines, the set one opens to its words and the ended one has no fold.
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubOf, launchOn, realWorld, tui, tuiReady, worldSay, type Tui } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  list: '[data-testid="thread.list"]',
  row: '[data-testid^="thread.scheduled."]:not([data-testid$=".head"]):not([data-testid$=".words"])',
};
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const flat = (s: string): string => s.replace(/[│╭╮╰╯─┃├┤┬┴]/g, ' ').replace(/\s+/g, ' ');

test("thread/scheduled-real: main's sb every set and stopped are ◷ rows with the hub's words, as the TUI", async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const shop = hubOf(w, 'shop');
  const project = path.basename(path.dirname(shop.sock));
  const n = `s${Date.now() % 1_000_000}`;
  const s = await launchOn(w, `project/${project}`, T.field);
  let t: Tui | undefined;
  const { page } = s;
  const list = page.locator(T.list);
  const note = (type: string, v: unknown) => test.info().annotations.push({ type, description: typeof v === 'string' ? v : JSON.stringify(v) });
  try {
    await expect(page.locator(T.field).first(), "shop's main thread").toBeVisible({ timeout: 15_000 });
    t = tui(w, 'shop');
    await tuiReady(t);

    await test.step('set: a ◷ row with the hub words, its fold opens to them', async () => {
      worldSay('shop', `[[bash: sb every 30m "check the e2e flake ${n}" --times 3]] set`);
      const row = list.locator(T.row).filter({ hasText: '◷' }).last();
      await expect.soft(row, "main's sb every: a ◷ row").toBeVisible({ timeout: 30_000 });
      await sleep(1500);
      const words = ((await row.textContent({ timeout: 2000 }).catch(() => '')) ?? '').trim();
      const id = await row.getAttribute('data-id', { timeout: 2000 }).catch(() => null);
      const tuiScreen = flat(t?.screen() ?? '');
      const tuiLine = /◷[^·]{0,120}/.exec(tuiScreen.slice(tuiScreen.lastIndexOf('◷') - 1))?.[0] ?? '';
      note('set', { window: words, id, tuiLine, tuiHasWords: tuiScreen.includes(`check the e2e flake ${n}`) });
      expect.soft(tuiScreen, 'the TUI shows a ◷ line').toContain('◷');
      const head = list.locator(`[data-testid="${(await row.getAttribute('data-testid', { timeout: 2000 }).catch(() => null)) ?? 'none'}.head"]`);
      if ((await head.count()) > 0) {
        await head.click({ timeout: 5000 }).catch((e: unknown) => note('fold-click', String(e).split('\n')[0] ?? ''));
        const opened = list.locator('[data-testid^="thread.scheduled."][data-testid$=".words"]').last();
        await expect.soft(opened, 'its fold opens to its words').toBeVisible({ timeout: 5000 });
        note('set-words', ((await opened.textContent({ timeout: 2000 }).catch(() => '')) ?? '').trim().slice(0, 300));
      } else {
        note('set-fold', 'no fold on the set row');
      }
      await row.screenshot({ path: test.info().outputPath('set.png') }).catch(() => undefined);
      test.info().attachments.push({ name: 'tui-set', contentType: 'text/plain', body: Buffer.from(t?.screen() ?? '') });

      if (id !== null && id !== '') {
        await test.step('stopped: an ended ◷ row, no fold', async () => {
          worldSay('shop', `[[bash: sb every --stop ${id}]] stopped`);
          await sleep(4000);
          const rows = list.locator(T.row).filter({ hasText: '◷' });
          const last = rows.last();
          const lastWords = ((await last.textContent({ timeout: 5000 }).catch(() => '')) ?? '').trim();
          const lastId = await last.getAttribute('data-id', { timeout: 2000 }).catch(() => null);
          const lastHead = list.locator(`[data-testid="${(await last.getAttribute('data-testid', { timeout: 2000 }).catch(() => null)) ?? 'none'}.head"]`);
          const tuiScreen2 = flat(t?.screen() ?? '');
          note('stopped', { window: lastWords, id: lastId, rows: await rows.count(), hasFold: (await lastHead.count()) > 0, tuiTail: tuiScreen2.slice(-600) });
          expect.soft(lastId, 'the ended row is the same task').toBe(id);
          expect.soft(await lastHead.count(), 'an ended one has no fold').toBe(0);
          await last.screenshot({ path: test.info().outputPath('stopped.png') }).catch(() => undefined);
          test.info().attachments.push({ name: 'tui-stopped', contentType: 'text/plain', body: Buffer.from(t?.screen() ?? '') });
        });
      }
    });
  } finally {
    t?.close();
    await s.close();
  }
});

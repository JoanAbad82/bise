// thread/compact-fold · compact-expand (Gabriel: « on puisse deplier le summary de compaction, et
// qu'on puisse le lire en entier (format markdown) »). On FakeCore, at 1100, light and dark: perf's
// thread has a compaction's summary (markdown, longer than a row). Passes when it shows folded, a
// click on its head opens it whole as markdown (a heading, a list, nothing cut), and a second click
// folds it again.
// Shots: compact-fold-<theme>.png, the open row's crop, for designer (m_41685). Owner: compact-expand.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const ACME = 'acme-1a2b3c4d';
const POS = 120;
const TAIL = 'the cold run is slow because the index is rebuilt at every start of the hub, so keep it warm between two runs of the gate';
const SUMMARY = [
  '## What was done',
  '- profiled the **hub**: the cold run is the slow one',
  `- ${TAIL}`,
  '',
  '## Next',
  '1. land the warm index (`hub/index.rs`)',
  '2. check the p99 again',
].join(String.fromCharCode(10));

for (const theme of ['light', 'dark'] as const) {
  test(`thread/compact-fold: the compaction's summary opens whole, as markdown (${theme})`, async () => {
    test.setTimeout(90_000);
    const core = new FakeCore();
    const s = await launchDesktop({ core, route: `agent/${ACME}/perf` });
    try {
      const { page } = s;
      await s.app.evaluate(({ BrowserWindow }, w) => {
        BrowserWindow.getAllWindows().find((b) => b.webContents.getURL().includes('surface=window'))?.setContentSize(w, 900);
      }, 1100);
      await expect.poll(() => page.evaluate(() => window.innerWidth), { timeout: 5000 }).toBe(1100);
      await core.send({ ev: 'prefs', prefs: { onboarded: true, theme } } as never);
      await expect(page.getByTestId('thread.list')).toBeVisible({ timeout: 15_000 });
      await core.send({ ev: 'entry', project: ACME, agent: 'perf', entry: { pos: POS, at_ms: 1791100100000, kind: 'compacted', text: SUMMARY } } as never);
      const row = page.getByTestId(`thread.compacted.${String(POS)}`);
      const body = page.getByTestId(`thread.compacted.${String(POS)}.body`);
      await expect(row).toBeVisible();
      await expect(body).toHaveCount(0);
      await row.screenshot({ path: test.info().outputPath(`compact-fold-${theme}-folded.png`) });

      await page.getByTestId(`thread.compacted.${String(POS)}.head`).click();
      await expect(body.locator('h2').first()).toHaveText('What was done');
      await expect(body.locator('li')).toHaveCount(4);
      await expect(body).toContainText(TAIL);
      // the thread at its end, the open row whole above the composer (no 'back to the bottom' over it)
      // he scrolls down to read it, as with the wheel
      const head = await page.getByTestId(`thread.compacted.${String(POS)}.head`).boundingBox();
      if (head !== null) await page.mouse.move(head.x + 40, head.y);
      for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 400);
      await expect(page.getByText('back to the bottom')).toBeHidden();
      await row.screenshot({ path: test.info().outputPath(`compact-fold-${theme}.png`) });

      await page.getByTestId(`thread.compacted.${String(POS)}.head`).click();
      await expect(body).toHaveCount(0);
    } finally {
      await s.close();
    }
  });
}

// thread/tool-counts · designer's '± file +18 −6' on tool lines (m_12065; ambient-lead m_17161). The data is
// the hub's ToolItem.files {path, add, del} (hub-rows), here bise-proto's own fixture (hub_ev.jsonl: perf's
// tools entry 17, an edit of src/query.rs +1 −1). Passes when, on the built app with the scripted core
// (FakeCore's default world, fake data), perf's thread draws that edit as '± query.rs' with '+1 −1' after
// it, dim (the tool time's colour), light and dark. Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'acme-1a2b3c4d';

test("thread/tool-counts: an edit's line reads '± <file>' with its line counts, dim", async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  const { page } = s;
  try {
    const line = page.getByTestId('thread.tool.17');
    await expect(line).toBeVisible({ timeout: 10_000 });
    await expect(line).toContainText('± query.rs');
    const count = page.getByTestId('thread.tool.17.count');
    await expect(count).toHaveText('+1 −1');
    // dim like the tool line's time, never the line's own ink
    const [countInk, textInk] = await Promise.all([
      count.evaluate((e) => getComputedStyle(e).color),
      line.locator('.th-tool-text').evaluate((e) => getComputedStyle(e).color),
    ]);
    expect(countInk, 'the counts are dimmer than the file name').not.toBe(textInk);
    await line.scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath('tool-counts-light.png') });
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.setProperty('color-scheme', 'dark');
    });
    // the colour transitions end (the pearl's own animation never does: no waiting on getAnimations)
    await page.waitForTimeout(300);
    await page.screenshot({ path: test.info().outputPath('tool-counts-dark.png') });
  } finally {
    await s.close();
    core.dispose();
  }
});

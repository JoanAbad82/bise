// pages/open · bar O.2 (docs/desktop-bar.md): pages, their open and their versions, in the window.
// Owner: qa-flows. The NEW app on the REAL core over the throwaway world (../world.ts): telemetry's
// fake main publishes a page (sb page publish, a kit prose block), then a second version of it
// (--id). Passes when:
//   - telemetry's main thread shows the page as a row '↗ <title>' with 'v1';
//   - a click on it opens the page's URL (test-mode stdout 'bise-desktop: external <url>', never
//     his browser), the URL the hub gave;
//   - the second version shows as 'v2'.
// Notes, send and 'stop watching' have no control in the window yet: noted, not checked (the
// capsule's fn o is the ambient app's, qa-native's).
import path from 'node:path';
import { test, expect } from '../../harness';
import { Lines } from '../native/world';
import { hubOf, launchOn, realWorld, worldSay } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  pages: '[data-testid^="thread.page."]',
};

test('pages/open: a page row with its version, opened on click; a new version shows', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const project = path.basename(path.dirname(hubOf(w, 'telemetry').sock));
  const n = `g${Date.now() % 1_000_000}`;
  const title = `p99 plan ${n}`;
  const file = (v: number) => `page-${n}-v${String(v)}.html`;
  const block = (v: number) => `<section data-kit="prose" data-id="p1"><p>the p99 plan, version ${String(v)}.</p></section>`;
  worldSay('telemetry', `[[bash: printf '%s\\n' '${block(1)}' > ${file(1)} && sb page publish ${file(1)} --id plan-${n} --title '${title}']]`);
  const s = await launchOn(w, `project/${project}`, T.field);
  const out = new Lines();
  s.app.process().stdout?.setEncoding('utf8');
  s.app.process().stdout?.on('data', (d: string) => {
    out.push(d);
  });
  try {
    const { page } = s;
    const row = page.locator(T.pages, { hasText: title }).last();
    await expect(row, "the page's row: ↗ title").toContainText(`↗ ${title}`, { timeout: 30_000 });
    await expect(row, 'its version: v1').toContainText('v1');
    await page.screenshot({ path: test.info().outputPath('page-v1.png') });
    await row.click({ timeout: 10_000 });
    const url = await out.wait('bise-desktop: external', () => true, 5000);
    test.info().annotations.push({ type: 'opened', description: url });
    expect(url, "a click opens the page's URL").toMatch(new RegExp(`^https?://[^ ]+plan-${n}`));
    worldSay('telemetry', `[[bash: printf '%s\\n' '${block(2)}' > ${file(2)} && sb page publish ${file(2)} --id plan-${n} --title '${title}']]`);
    await expect(page.locator(T.pages, { hasText: title }).filter({ hasText: 'v2' }).first(), 'the second version: v2').toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: test.info().outputPath('page-v2.png') });
  } finally {
    await s.close();
  }
});

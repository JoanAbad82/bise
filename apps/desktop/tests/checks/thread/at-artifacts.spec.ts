// thread/at-artifacts · bar W11 (docs/desktop-bar.md): the @ list has the project's artifacts by
// their words too. Owner: qa-flows. The NEW app on the REAL core over the throwaway world
// (../world.ts): telemetry's fake main registers an artifact titled 'pricing' (sb artifact add, a
// line to it from outside), then in telemetry's main thread he types '@pricing'. Passes when:
//   - the @ list shows '↗ pricing' (an artifact row) while he types;
//   - picking it puts the artifact's chip in the composer, the '@pricing' word goes;
//   - the sent message reaches main with the artifact as a link '[pricing](<url>)'.
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubOf, launchOn, realWorld, transcriptHas, worldSay } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  artifactRows: '[data-testid^="composer.pick.artifact."]',
};

test('thread/at-artifacts: @pricing lists the pricing artifact and sends it as its link', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const project = path.basename(path.dirname(hubOf(w, 'telemetry').sock));
  const n = `p${Date.now() % 1_000_000}`;
  worldSay('telemetry', `[[bash: printf '# pricing\\n\\nthree tiers.\\n' > pricing-${n}.md && sb artifact add pricing-${n}.md --title pricing]]`);
  const s = await launchOn(w, `project/${project}`, T.field);
  try {
    const { page } = s;
    const field = page.locator(T.field).first();
    await expect(field, "telemetry's main thread opens").toBeVisible({ timeout: 15_000 });
    // the artifact can land a moment after the line: type until the list shows it
    const row = page.locator(T.artifactRows, { hasText: 'pricing' }).first();
    await expect(async () => {
      await field.click();
      await page.keyboard.press('Meta+A');
      await page.keyboard.press('Backspace');
      await page.keyboard.type('@pricing', { delay: 20 });
      await expect(row).toBeVisible({ timeout: 2000 });
    }, "the @ list shows the 'pricing' artifact").toPass({ timeout: 30_000 });
    await page.screenshot({ path: test.info().outputPath('at-list.png') });
    await expect(row, 'an artifact row: ↗ pricing').toContainText('↗ pricing');
    await row.click({ timeout: 10_000 });
    await page.waitForTimeout(300);
    const text = await field.evaluate((el) => (el as HTMLElement).innerText);
    test.info().annotations.push({ type: 'field', description: text });
    expect(text, "the '@pricing' word goes").not.toContain('@pricing');
    await expect(field.locator('[class*="chip"], [data-chip]').first(), "the artifact's chip is in the composer").toBeVisible({ timeout: 3000 });
    await page.screenshot({ path: test.info().outputPath('chip.png') });
    await page.keyboard.type(` look at it ${n}`);
    await page.keyboard.press('Enter');
    await expect.poll(() => transcriptHas(w, 'telemetry', 'main', `look at it ${n}`), { timeout: 15_000, message: 'main got the message' }).toBe(true);
    expect(transcriptHas(w, 'telemetry', 'main', '[pricing]('), 'the artifact went as its link [pricing](url)').toBe(true);
  } finally {
    await s.close();
  }
});

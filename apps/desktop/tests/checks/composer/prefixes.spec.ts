// composer/prefixes · bar T C45 (docs/desktop-bar.md; the terminal's sb.rs strips 'steer ' and
// 'say ' before the line runs): "say hello" sends "hello"; "steer go on" sends "go on".
// Real keys on the composer lab; what left is its log.
import { test, expect } from '../../harness';
import { T, onTarget, press, sentTexts } from './target';

test('composer/prefixes: "say …" and "steer …" go out without their prefix', async () => {
  await onTarget(async ({ page }) => {
    await page.locator(T.field).click();
    await page.keyboard.type('say hello');
    await press(page, 'Enter');
    await page.keyboard.type('steer go on');
    await press(page, 'Enter');
    await expect.poll(() => sentTexts(page), { message: 'the prefixes are stripped' }).toEqual(['hello', 'go on']);
  });
});

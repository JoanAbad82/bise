// composer/paste-image · a real ⌘V of an image (lead m_12801, qa-native's try gate R24). In test
// mode the clipboard is the window's private one (amb-mac 2aa0294d), never his pasteboard; main's
// test-only hook (TEST_CLIP_HOOK, src/shared/api.ts) stages a PNG on it while the app runs, then a
// real ⌘V pastes it into the composer as an image chip with its thumbnail. Owner: amb-mac.
import path from 'node:path';
import { test, expect } from '../../harness';
import { T, onTarget } from './target';

const PNG_FILE = path.join(__dirname, '../fixtures/checker.png');

test('composer/paste-image: a PNG staged on the test clipboard while the app runs, ⌘V makes an image chip', async () => {
  await onTarget(async (s) => {
    const field = s.page.locator(T.field);
    await field.click();
    const staged = await s.app.evaluate(
      (_e, file) => (globalThis as unknown as { __biseTestClip?: (o: unknown) => Promise<boolean> }).__biseTestClip?.({ file }) ?? false,
      PNG_FILE,
    );
    expect(staged, "main's test hook read the PNG and every window took it").toBe(true);
    await s.page.keyboard.press('Meta+V');
    const chip = s.page.locator(T.chipImage);
    await expect(chip, 'the pasted PNG shows as an image chip').toBeVisible({ timeout: 3000 });
    const drawn = await chip.locator('img').first().evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0);
    expect(drawn, 'its thumbnail is drawn').toBe(true);
    const hook = await s.app.evaluate(() => typeof (globalThis as unknown as Record<string, unknown>)['__biseTestClip']);
    expect(hook, 'the hook exists in test mode (never outside it: ipc.ts installIpc)').toBe('function');
  });
});

// app/keep · his ask (ambient-lead m_11756, m_11763): nothing he typed or opened is lost across
// (a) a renderer reload, (b) a relaunch on the same userData (as the update swap does), (c) a core
// restart. Passes when, on the scripted core (FakeCore), in perf's thread with words half typed in
// the composer, ⌘F open with 'cold' in it and a tools row opened, each of (a), (b) and (c) gives
// back: the same thread (after (b) with no start route: the kept one), the composer's words with
// the caret at their end, the find bar open with its words, and the tools row still open; then a
// send drops the composer's words for good. Owner: amb-win.
import { rmSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, testUserData, test, expect } from '../../harness';

const ACME = 'acme-1a2b3c4d';
const DRAFT = 'half typed, not sent yet';
const NEEDLE = 'cold';
const T = {
  screen: '[data-testid="thread.screen"]',
  field: '[data-testid="composer.field"]',
  find: '[data-testid="thread.find.field"]',
  tools: '[data-testid="thread.tools.17"]',
};

/** Everything he left, back as he left it. */
async function allBack(page: Page, what: string): Promise<void> {
  await expect(page.locator(T.screen), `${what}: perf's thread`).toHaveAttribute('data-agent', 'perf', { timeout: 10_000 });
  const field = page.locator(T.field).first();
  await expect(field, `${what}: the composer's words`).toContainText(DRAFT, { timeout: 5000 });
  await expect(page.locator(T.find), `${what}: ⌘F's words`).toHaveValue(NEEDLE);
  await expect(page.locator(T.tools), `${what}: the tools row he opened`).toHaveAttribute('aria-expanded', 'true');
  // the caret at the end of his words: what he types next goes after them
  await field.click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await expect(field).toContainText(`${DRAFT}!`);
  await page.keyboard.press('Backspace');
  await expect(field).toContainText(DRAFT);
  await page.screenshot({ path: test.info().outputPath(`${what.replace(/\W+/gu, '-')}.png`) });
}

test('app/keep: his words, ⌘F and an open row come back after a reload, a relaunch and a core restart', async () => {
  test.setTimeout(150_000);
  // one userData for both launches, as the update swap relaunches on the same one
  const userData = testUserData();
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${ACME}/perf`, userData });
  try {
    const { page } = s;
    const field = page.locator(T.field).first();
    await expect(field, "perf's composer").toBeVisible({ timeout: 10_000 });
    await field.click();
    await page.keyboard.type(DRAFT);
    await page.locator(T.tools).locator('[aria-expanded]').first().click().catch(async () => page.locator(T.tools).click());
    await expect(page.locator(T.tools)).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Meta+f');
    await expect(page.locator(T.find), '⌘F opens').toBeFocused({ timeout: 3000 });
    await page.keyboard.type(NEEDLE);
    // past the keep's 300 ms write (a reload also writes on pagehide)
    await page.waitForTimeout(600);

    // (a) the renderer reloads
    await page.reload();
    await allBack(page, 'after a reload');

    // (c) the core stops and comes back: the store refills, no field is reset
    await core.exit(1);
    await expect(page.getByTestId('app.core'), 'the window sees the core stop').toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('app.core'), 'and come back').toHaveCount(0, { timeout: 20_000 });
    await allBack(page, 'after a core restart');
    // the update swap quits the app the normal way (app.quit, then the new one starts)
    const gone = new Promise<void>((r) => s.app.process().once('exit', () => { r(); }));
    await s.app.evaluate(({ app }) => { app.quit(); }).catch(() => undefined);
    await Promise.race([gone, new Promise<void>((r) => setTimeout(r, 10_000))]);
  } finally {
    await s.close();
    core.dispose();
  }

  // (b) a relaunch on the same userData, as the update swap does, with no start route
  const core2 = new FakeCore();
  const s2 = await launchDesktop({ core: core2, userData });
  try {
    const { page } = s2;
    await allBack(page, 'after a relaunch');
    // a send drops the composer's words for good
    const field = page.locator(T.field).first();
    await field.click();
    await page.keyboard.press('Enter');
    await expect(field).not.toContainText(DRAFT, { timeout: 5000 });
  } finally {
    await s2.close();
    core2.dispose();
    rmSync(path.dirname(userData), { recursive: true, force: true });
  }
});

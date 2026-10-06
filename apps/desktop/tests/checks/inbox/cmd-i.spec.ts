// inbox/cmd-i · bar ⛔5 (docs/desktop-bar.md) · his bug 4: "⌘I does nothing". First cut by
// qa-type, handed to qa-flows (which adds the full row: ↑↓, ⏎, 1-n, a typed answer, close one,
// each act clearing the item in the terminal's inbox too).
// Real keys: ⌘I from the composer. Passes when the inbox opens in the window with the world's
// waiting items, the most blocking first, in the order the window's 'waiting for you' lists them,
// and esc closes it with the composer's text kept.
// Red on today's window: ⌘I changes nothing (no inbox screen, the route stays on bise's main).
import { test, expect, launchOld, type Session } from '../../harness';

const T = {
  launch: (): Promise<Session> => launchOld('window'),
  field: '[data-qa=composer], [data-testid="composer.field"]',
  inbox: '[data-testid="inbox"]',
  item: '[data-testid^="inbox.item."]',
  /** the world's waiting items, most blocking first (today's window: the board's 'waiting for you') */
  waiting: '.w-board .b-card, [data-testid^="home.waiting."]',
};

test('inbox/cmd-i: ⌘I opens the inbox with the waiting items, esc closes it', async () => {
  const s = await T.launch();
  try {
    const { page } = s;
    const expected = (await page.locator(T.waiting).allInnerTexts()).map((t) => t.split('\n').pop()?.trim() ?? '');
    await page.locator(T.field).first().click();
    await page.keyboard.type('brouillon');
    await page.keyboard.press('Meta+i');
    const inbox = page.locator(T.inbox);
    await expect(inbox, '⌘I opens the inbox').toBeVisible({ timeout: 1000 });
    const items = await inbox.locator(T.item).allInnerTexts();
    expect(items.length, 'one row per waiting item').toBe(expected.length);
    expected.forEach((e, i) => { expect.soft(items[i] ?? '', `row ${i + 1}`).toContain(e); });
    await page.keyboard.press('Escape');
    await expect(inbox).toBeHidden();
    const kept = await page.locator(T.field).first().evaluate((e) => (e instanceof HTMLTextAreaElement ? e.value : e.textContent));
    expect(kept, "the composer's text is kept").toBe('brouillon');
  } finally {
    await s.close();
  }
});

// composer/drafts · bar 3.2 (docs/desktop-bar.md; the terminal's sb/drafts.rs): esc puts the
// draft away and ↑ brings it back with the caret at its end; ↑ also brings back what was sent.
// Real keys on the composer lab. Passes when esc empties the field and ↑ in the empty field
// brings the put-away draft back whole (accents, two lines), and after a send ↑ brings the sent
// message back. The bar's other half (one draft per agent, kept across a restart of the app)
// needs a screen with agents and the app's own storage: it comes with amb-win's thread.
import { test, expect } from '../../harness';
import { T, fieldText, onTarget } from './target';

const DRAFT = ['la moitié d’un message, à finir', 'ligne deux'];

test('composer/drafts: esc puts it away, ↑ brings it back; ↑ brings back what was sent', async () => {
  await onTarget(async ({ page }) => {
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.type(DRAFT[0] ?? '');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type(DRAFT[1] ?? '');
    await page.keyboard.press('Escape');
    expect((await field.evaluate(fieldText)).trim(), 'esc puts the draft away').toBe('');
    await page.keyboard.press('ArrowUp');
    expect((await field.evaluate(fieldText)).trim(), '↑ brings it back whole').toBe(DRAFT.join('\n'));
    await page.keyboard.type(' !');
    expect((await field.evaluate(fieldText)).trim(), 'the caret is at its end, as in the terminal (input.rs)').toBe(`${DRAFT.join('\n')} !`);

    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('envoyé');
    await page.keyboard.press('Enter');
    await expect(page.locator(T.sent).first()).toContainText('envoyé');
    expect((await field.evaluate(fieldText)).trim(), 'the field is empty after the send').toBe('');
    await page.keyboard.press('ArrowUp');
    expect((await field.evaluate(fieldText)).trim(), '↑ brings back the sent message').toBe('envoyé');
  });
});

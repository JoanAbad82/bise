// composer/slash · bar 2.1 (docs/desktop-bar.md) · his bug 1: "@files, $skills, /commands dead".
// Real keys only. The terminal is the reference: its commands are read from
// rust/tui/src/commands.rs, less what bar 2.1 leaves out (/version). Passes when "/" opens a picker, typing filters it, tab completes the
// command, and each of the terminal's commands is in the picker when its name is typed.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '../../harness';
import { T, fieldText, onTarget } from './target';

const REPO = path.resolve(__dirname, '../../../../..');
/** bar 2.1's rule: every TUI command that acts on bise; /version (a dev tool) stays out */
const LEFT_OUT = new Set(['/version']);
// the list moved to bise-proto (rust/proto/src/commands.rs, one table for the TUI and the window);
// tui/src/commands.rs no longer names them: read both, proto first, and keep what is there
const terminal = ['rust/proto/src/commands.rs', 'rust/tui/src/commands.rs']
  .flatMap((f) => {
    try {
      return [...readFileSync(path.join(REPO, f), 'utf8').matchAll(/name: "(\/[a-z-]+)"/g)].map((m) => m[1] ?? '');
    } catch {
      return [];
    }
  })
  .filter((n, i, all) => n !== '' && all.indexOf(n) === i && !LEFT_OUT.has(n));

test("composer/slash: / lists the terminal's commands, filters, tab completes", async () => {
  expect(terminal.length, "the terminal's command list was read").toBeGreaterThan(20);
  await onTarget(async ({ page }) => {
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.type('/');
    const picker = page.locator(T.picker);
    await expect(picker, '"/" opens the command picker').toBeVisible({ timeout: 1500 });
    await page.keyboard.type('mo');
    await expect(picker.locator(T.pickerRow).first()).toContainText('/model');
    const rows = await picker.locator(T.pickerRow).allInnerTexts();
    expect(rows.every((r) => r.includes('/mo')), `"/mo" keeps only matching rows: ${rows.join(' | ')}`).toBe(true);
    await page.keyboard.press('Tab');
    await expect.poll(() => field.evaluate(fieldText)).toMatch(/^\/model\s/);
    const missing: string[] = [];
    for (const name of terminal) {
      await page.keyboard.press('Meta+A');
      await page.keyboard.press('Backspace');
      await page.keyboard.type(name);
      const all = await picker.locator(T.pickerRow).allInnerTexts().catch(() => [] as string[]);
      if (!all.some((r) => r.trim().startsWith(name))) missing.push(name);
    }
    expect(missing, "the terminal's commands missing from the picker").toEqual([]);
  });
});

// bar T B21 (on purpose, the same as the terminal): esc clears the /query; the @ and $ popups keep
// the text
test('composer/slash: esc clears the / query; esc in the @ popup keeps "@ap"', async () => {
  await onTarget(async ({ page }) => {
    const field = page.locator(T.field);
    await field.click();
    await page.keyboard.type('/arch');
    await expect(page.locator(T.picker)).toBeVisible({ timeout: 1500 });
    await page.keyboard.press('Escape');
    expect((await field.evaluate(fieldText)).trim(), 'esc in the / popup clears the query').toBe('');
    await page.keyboard.type('@ap');
    await expect(page.locator(T.picker)).toBeVisible({ timeout: 1500 });
    await page.keyboard.press('Escape');
    await expect(page.locator(T.picker), 'esc closes the @ popup').toBeHidden();
    expect((await field.evaluate(fieldText)).trim(), 'and keeps "@ap"').toBe('@ap');
  });
});

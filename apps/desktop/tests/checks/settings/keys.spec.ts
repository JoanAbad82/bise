// settings/keys · bar 3.5 (every key of the app in one list, each with its act) and V3 (the help
// overlay: filtered as he types, tab between help and shortcuts), da90eaec / ambient-lead m_12176.
// Owner: qa-flows. The NEW app on the REAL core over the throwaway world; bise's thread. Passes when:
//   - ⌘/ opens the key list on 'help'; tab goes to 'shortcuts' (more rows) and back;
//   - typing 'inbox' leaves only rows that say inbox (their section, keys or act), none else, and a
//     word that matches nothing says so;
//   - the listed keys that open a screen do it, each from the thread: ⌘I the inbox, ⌘K the agent
//     palette, ⌘, settings, ⌘F the thread's find, ⌘/ the key list (the rest: annotated, as listed).
import { test, expect } from '../../harness';
import { launchReal, menuKey, realWorld } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  help: '[data-testid="help.overlay"]',
  tabs: '[data-testid="help.tabs"]',
  filter: '[data-testid="help.field"]',
  row: '[data-testid="help.row"]',
};
// a listed key, what it opens (a test id that shows), how to come back
const ACTS: readonly { keys: string; press: string; shows: string }[] = [
  // ⌘I opens the inbox in place on a thread (the inbox block, R42-R47), its screen elsewhere
  { keys: '⌘I', press: 'Meta+i', shows: '[data-testid="inbox.root"], [data-testid="inbox.block"][data-open]' },
  { keys: '⌘K', press: 'Meta+k', shows: '[data-testid="app.palette"]' },
  { keys: '⌘,', press: 'Meta+,', shows: '[data-testid="settings.root"]' },
  { keys: '⌘F', press: 'Meta+f', shows: '[data-testid="thread.find"]' },
  { keys: '⌘/', press: 'Meta+/', shows: '[data-testid="help.overlay"]' },
];

test('settings/keys: the key list, its two pages and its filter; the listed screen keys act', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const s = await launchReal(w);
  const note = (type: string, v: unknown) => test.info().annotations.push({ type, description: typeof v === 'string' ? v : JSON.stringify(v) });
  try {
    const { page } = s;
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    const field = page.locator(T.field).first();
    await expect(field, "bise's thread").toBeVisible({ timeout: 10_000 });
    const keysNow = async () => page.locator(T.row).evaluateAll((els) => els.map((e) => e.getAttribute('data-keys') ?? ''));

    await test.step('⌘/ opens it on help; tab to shortcuts and back', async () => {
      await field.click();
      await page.keyboard.press('Meta+/');
      await expect(page.locator(T.help), '⌘/ opens the key list').toBeVisible({ timeout: 3000 });
      const help = await keysNow();
      await page.keyboard.press('Tab');
      await expect.soft.poll(async () => (await keysNow()).length, { timeout: 3000, message: 'tab: shortcuts, every key (more rows)' }).toBeGreaterThan(help.length);
      const all = await keysNow();
      note('pages', { help: help.length, shortcuts: all.length, keys: all });
      await page.screenshot({ path: test.info().outputPath('shortcuts.png') });
      await page.keyboard.press('Tab');
      await expect.soft.poll(async () => (await keysNow()).length, { timeout: 3000, message: 'tab again: back to help' }).toBe(help.length);
    });

    await test.step("V3: typing 'inbox' filters", async () => {
      await page.locator(T.filter).click();
      await page.keyboard.type('inbox');
      await page.waitForTimeout(300);
      const rows = await page.locator(`${T.help} section`).evaluateAll((els) => els.map((s) => ({ title: s.querySelector('h3, h4, .help-title, header')?.textContent ?? '', rows: Array.from(s.querySelectorAll('[data-testid="help.row"]')).map((r) => r.textContent) })));
      note('filtered', rows);
      const flatRows = rows.flatMap((s) => s.rows.map((r) => `${s.title} ${r}`.toLowerCase()));
      expect.soft(flatRows.length, 'some rows match inbox').toBeGreaterThan(0);
      expect.soft(flatRows.filter((r) => !r.includes('inbox')), 'only rows that say inbox (section, keys or act)').toEqual([]);
      await page.screenshot({ path: test.info().outputPath('filtered.png') });
      await page.keyboard.press('Meta+a');
      await page.keyboard.type('zzqq-nothing');
      await expect.soft(page.locator(T.help), 'a word that matches nothing says so').toContainText('no key matches', { timeout: 3000 });
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await expect.soft(page.locator(T.help), 'esc closes it').toBeHidden({ timeout: 3000 });
    });

    await test.step('3.5: the listed screen keys act', async () => {
      await page.keyboard.press('Meta+/');
      await page.keyboard.press('Tab');
      const listed = await keysNow();
      await page.keyboard.press('Escape');
      const results: Record<string, string> = {};
      for (const a of ACTS) {
        if (!listed.includes(a.keys)) {
          results[a.keys] = 'not listed';
          continue;
        }
        await field.click().catch(() => undefined);
        // ⌘I is the app menu's item (amb-mac 9d914bbb), not a page key: the menu's own accelerator
        if (a.keys === '⌘I') await menuKey(s, 'CmdOrCtrl+I');
        else await page.keyboard.press(a.press);
        const ok = await page.locator(a.shows).first().isVisible({ timeout: 3000 }).catch(() => false) || (await page.locator(a.shows).first().waitFor({ timeout: 3000 }).then(() => true, () => false));
        results[a.keys] = ok ? 'acts' : 'no act';
        expect.soft(ok, `${a.keys} does what the list says`).toBe(true);
        await page.screenshot({ path: test.info().outputPath(`key-${a.press.replace(/\W/g, '')}.png`) });
        // back to the thread
        await page.keyboard.press('Escape');
        await page.keyboard.press('Meta+0').catch(() => undefined);
        await expect(field).toBeVisible({ timeout: 5000 }).catch(() => undefined);
      }
      note('acts', { results, others: listed.filter((k) => !ACTS.some((a) => a.keys === k)) });
    });
  } finally {
    await s.close();
  }
});

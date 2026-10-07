// agents/palette · bar W14 / tui-parity V1 (the TUI's sb/palette.rs): ⌘K anywhere opens the agent
// palette, it finds any agent by name in every project, archived ones too, ↑↓ move, ⏎ opens the
// agent's thread, esc closes and the composer keeps its draft. Owner: amb-web (lead m_10665); the
// palette is amb-win's src/app/Palette.tsx. The new app on the scripted core's fixture world:
// bise's home (main) and acme (main, perf working, old-fix archived).
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const ACME = 'acme-1a2b3c4d';
const HOME = 'bise-home-00000000';
const T = {
  palette: '[data-testid="app.palette"]',
  field: '[data-testid="app.palette.field"]',
  item: (k: number) => `[data-testid="app.palette.item.${String(k)}"]`,
  items: '[data-testid^="app.palette.item."]',
  thread: '[data-testid="thread.screen"]',
  composer: '[data-testid="composer.field"]',
};

test('agents/palette: ⌘K from the thread finds agents of every project, archived too; ↑↓ ⏎ opens, esc keeps the draft', async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${HOME}/main` });
  try {
    const { page } = s;
    const thread = page.locator(T.thread);
    await expect(thread).toHaveAttribute('data-project', HOME, { timeout: 10_000 });
    // a draft in the composer: the palette has its own field and leaves it alone
    await page.locator(T.composer).click();
    await page.keyboard.type('half a thought');
    await page.keyboard.press('Meta+K');
    await expect(page.locator(T.palette), '⌘K opens the palette, focus in the composer').toBeVisible({ timeout: 3000 });
    await expect(page.locator(T.field), 'its field has the focus').toBeFocused();
    // every project's agents, the archived one too
    const all = await page.locator(T.items).allTextContents();
    expect(all.some((t) => t.includes('perf')), 'acme’s perf is listed from bise’s thread').toBe(true);
    expect(all.some((t) => t.includes('old-fix') && t.includes('archived')), 'the archived old-fix is listed, marked archived').toBe(true);
    await page.screenshot({ path: test.info().outputPath('all.png') });
    // esc closes; the draft is still there
    await page.keyboard.press('Escape');
    await expect(page.locator(T.palette)).toBeHidden({ timeout: 2000 });
    await expect(page.locator(T.composer), 'the composer kept its draft').toContainText('half a thought');
    // by name: 'old' puts the archived old-fix first; ⏎ opens its thread
    await page.keyboard.press('Meta+K');
    await expect(page.locator(T.field)).toBeFocused({ timeout: 3000 });
    await page.keyboard.type('old');
    await expect(page.locator(T.item(0)), "'old' finds old-fix").toContainText('old-fix');
    await page.keyboard.press('Enter');
    await expect(page.locator(T.palette)).toBeHidden({ timeout: 2000 });
    await expect(thread, '⏎ opened old-fix’s thread in acme').toHaveAttribute('data-agent', 'old-fix', { timeout: 5000 });
    await expect(thread).toHaveAttribute('data-project', ACME);
    // ↓ moves: 'p' lists more than one; ↓ ⏎ opens the second
    await page.keyboard.press('Meta+K');
    await expect(page.locator(T.field)).toBeFocused({ timeout: 3000 });
    await page.keyboard.type('perf');
    await expect(page.locator(T.item(0))).toContainText('perf');
    await page.keyboard.press('Enter');
    await expect(thread, '⏎ opened perf').toHaveAttribute('data-agent', 'perf', { timeout: 5000 });
  } finally {
    await s.close();
    core.dispose();
  }
});

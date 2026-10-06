// review/prs · bar A.7 (docs/desktop-bar.md): /prs, the same list as the TUI. Owner: qa-flows.
// The NEW app on the REAL core over the throwaway world (../world.ts), the TUI on the same hub as
// the reference. The world has no GitHub: the TUI's /prs says 'no open PR' and how one comes
// (/flow). Passes when the window's changes (⌘D, where its branches are) show the same: the PR
// list, or the TUI's 'no open PR' line.
// Red while the window has no PR list (no route, no section).
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubOf, launchReal, realWorld, tui, tuiReady, tuiSay, type Tui } from '../world';

const T = {
  thread: '[data-testid="thread.screen"]',
  changes: '[data-testid="changes.screen"]',
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
};

const flat = (s: string): string => s.replace(/[│╭╮╰╯─┃]/g, ' ').replace(/\s+/g, ' ');

test("review/prs: the window's PR list says what the TUI's /prs says", async () => {
  test.setTimeout(120_000);
  const w = realWorld();
  const project = path.basename(path.dirname(hubOf(w, 'telemetry').sock));
  let t: Tui | undefined;
  const s = await launchReal(w);
  try {
    const { page } = s;
    t = tui(w, 'telemetry');
    await tuiReady(t);
    tuiSay(t, '/prs');
    await expect.poll(() => flat(t?.screen() ?? ''), { timeout: 5000, message: "the TUI's /prs answers" }).toContain('no open PR');
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    await page.locator(`[data-testid="app.sidebar.project.${project}"]`).click();
    await expect(page.locator(T.thread)).toHaveAttribute('data-project', project, { timeout: 10_000 });
    await page.keyboard.press('Meta+d');
    await expect(page.locator(T.changes), "⌘D opens telemetry's changes").toBeVisible({ timeout: 5000 });
    try {
      await expect(page.locator(T.changes), "the window says what the TUI's /prs says").toContainText(/no open PR/i, { timeout: 5000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('changes.png') });
    }
  } finally {
    if (t) {
      test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(t.screen()) });
      t.close();
    }
    await s.close();
  }
});

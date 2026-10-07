// review/prs · bar A.7 (docs/desktop-bar.md): /prs, the same list as the TUI. Owner: qa-flows.
// The NEW app on the REAL core over the throwaway world (../world.ts), the TUI on the same hub as
// the reference; amb-win's PR list b2da5238 on amb-feed's typed prs 66faffe3 (a bise built with it).
// The world has no GitHub, so this is the empty case: the TUI's /prs says 'no open PR. in PR flow,
// an agent in a worktree opens one when its work is done (/flow).' Passes when:
//   - ⌘D's changes screen has the 'pull requests' row, saying none is open, and it opens the list;
//   - the list says what the TUI's /prs says (its 'no open PR…' words, the hub's), with no row;
//   - /prs in the composer opens the same list.
// Not covered here: a real PR row (number, branch, agents, words, its click opening the url on
// main's stdout 'bise-desktop: external <url>'): the world would need a fake `gh` answering
// `gh pr list` (amb-win's prs-list.spec.ts covers the rows on the scripted core).
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubOf, launchReal, realWorld, tui, tuiReady, tuiSay, type Tui } from '../world';

const T = {
  thread: '[data-testid="thread.screen"]',
  changes: '[data-testid="changes.screen"]',
  prsRow: '[data-testid="changes.prs"]',
  prs: '[data-testid="prs.screen"]',
  none: '[data-testid="prs.none"]',
  row: '[data-testid^="prs.row."]',
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
};

const flat = (s: string): string => s.replace(/[│╭╮╰╯─┃]/g, ' ').replace(/\s+/g, ' ');
const NONE = 'no open PR';

test("review/prs: the changes' 'pull requests' and /prs open the list, which says what the TUI's /prs says", async () => {
  test.setTimeout(150_000);
  const w = realWorld();
  const project = path.basename(path.dirname(hubOf(w, 'telemetry').sock));
  let t: Tui | undefined;
  const s = await launchReal(w);
  try {
    const { page } = s;
    t = tui(w, 'telemetry');
    await tuiReady(t);
    tuiSay(t, '/prs');
    await expect.poll(() => flat(t?.screen() ?? ''), { timeout: 10_000, message: "the TUI's /prs answers" }).toContain(NONE);
    const tuiWords = /· (no open PR[^·]*?\(\/flow\)\.?)/.exec(flat(t.screen()))?.[1] ?? NONE;
    test.info().annotations.push({ type: 'tui', description: tuiWords });
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    await page.locator(`[data-testid="app.sidebar.project.${project}"]`).click();
    await expect(page.locator(T.thread)).toHaveAttribute('data-project', project, { timeout: 10_000 });
    // ⌘D: the changes, with its 'pull requests' row
    await page.keyboard.press('Meta+d');
    await expect(page.locator(T.changes), "⌘D opens telemetry's changes").toBeVisible({ timeout: 5000 });
    const prsRow = page.locator(T.prsRow);
    try {
      await expect(prsRow, "the changes have a 'pull requests' row").toBeVisible({ timeout: 10_000 });
      await expect(prsRow, 'it says none is open').toContainText('none open', { timeout: 15_000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('changes.png') });
    }
    await prsRow.click();
    await expect(page.locator(T.prs), "the row opens telemetry's PR list").toHaveAttribute('data-project', project, { timeout: 5000 });
    try {
      await expect(page.locator(T.none), "the list says what the TUI's /prs says").toHaveText(tuiWords, { timeout: 15_000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('prs.png') });
    }
    await expect(page.locator(T.row), 'no PR row in a world without GitHub').toHaveCount(0);
    // /prs in the composer opens the same list
    await page.locator(`[data-testid="app.sidebar.project.${project}"]`).click();
    await expect(page.locator(T.thread)).toHaveAttribute('data-project', project, { timeout: 5000 });
    await page.locator(T.field).first().click();
    await page.keyboard.type('/prs');
    await page.keyboard.press('Enter');
    await expect(page.locator(T.prs), '/prs opens the list').toHaveAttribute('data-project', project, { timeout: 5000 });
    await expect(page.locator(T.none)).toHaveText(tuiWords, { timeout: 10_000 });
  } finally {
    if (t) {
      test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(t.screen()) });
      t.close();
    }
    await s.close();
  }
});

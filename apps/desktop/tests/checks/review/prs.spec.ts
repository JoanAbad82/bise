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
import { Lines } from '../native/world';
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

// shop's open PRs through the world's fake gh (amb-tools 2e38e0be: <world>/bin/gh first on every
// hub's PATH, no network): #412 sb/checkout 'changes asked · checks fail: e2e', #415 sb/receipts
// 'draft · checks running'. Passes when the window's list has the TUI's /prs rows (numbers,
// branches), the hub's head ('2 PRs open') and words, and a row's click opens its url (main's
// test-mode stdout 'bise-desktop: external <url>', never his browser).
test("review/prs: shop's PRs from the world's gh, the same rows as the TUI's /prs, a click opens the url", async () => {
  test.setTimeout(150_000);
  const w = realWorld();
  const project = path.basename(path.dirname(hubOf(w, 'shop').sock));
  let t: Tui | undefined;
  const s = await launchReal(w);
  const out = new Lines();
  s.app.process().stdout?.setEncoding('utf8');
  s.app.process().stdout?.on('data', (d: string) => {
    out.push(d);
  });
  try {
    const { page } = s;
    t = tui(w, 'shop');
    await tuiReady(t);
    tuiSay(t, '/prs');
    await expect.poll(() => flat(t?.screen() ?? ''), { timeout: 15_000, message: "the TUI's /prs lists #412" }).toContain('#412');
    const tuiScreen = flat(t.screen());
    test.info().annotations.push({ type: 'tui', description: tuiScreen.slice(Math.max(0, tuiScreen.indexOf('#412') - 80), tuiScreen.indexOf('#412') + 300) });
    expect(tuiScreen, "the TUI's /prs lists #415").toContain('#415');
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    await page.locator(`[data-testid="app.sidebar.project.${project}"]`).click();
    await expect(page.locator(T.thread)).toHaveAttribute('data-project', project, { timeout: 10_000 });
    await page.keyboard.press('Meta+d');
    await expect(page.locator(T.prsRow), "the changes' 'pull requests' says how many are open").toContainText('2 PRs open', { timeout: 20_000 });
    await page.locator(T.prsRow).click();
    await expect(page.locator(T.prs)).toHaveAttribute('data-project', project, { timeout: 5000 });
    const r412 = page.locator('[data-testid="prs.row.412"]');
    try {
      await expect(page.locator(T.row), 'as many rows as the TUI').toHaveCount(2, { timeout: 15_000 });
      await expect(r412).toContainText('sb/checkout');
      await expect(page.locator('[data-testid="prs.words.412"]'), "#412's words, the failing check named").toHaveText('changes asked · checks fail: e2e');
      await expect(page.locator('[data-testid="prs.row.415"]')).toContainText('sb/receipts');
      await expect(page.locator('[data-testid="prs.words.415"]')).toHaveText('draft · checks running');
    } finally {
      await page.screenshot({ path: test.info().outputPath('prs-shop.png') });
    }
    expect(tuiScreen, "the TUI's /prs says #412's state in the same words").toMatch(/changes asked[^#]*checks fail[^#]*e2e/);
    await r412.click();
    const url = await out.wait('bise-desktop: external', () => true, 3000);
    expect(url, "#412's click opens its url").toMatch(/github\.com\/acme-qa\/shop\/pull\/412$/);
  } finally {
    if (t) {
      test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(t.screen()) });
      t.close();
    }
    await s.close();
  }
});

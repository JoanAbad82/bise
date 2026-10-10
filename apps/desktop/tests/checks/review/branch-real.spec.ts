// review/branch-real · bar C15/W20/V6 (a branch's diff by its name, the TUI's '/diff sb/x'),
// amb-win ee6d11de, ambient-lead m_16107. Owner: qa-flows.
// The NEW app on the REAL core over the throwaway world. shop's checkout agent works in its own
// worktree, on a branch with a commit of its own (the world's seed). Passes when:
//   - '/diff <checkout's branch>' typed in shop's thread opens that branch's screen: the crumb names
//     the branch, the screen is checkout's review (review.screen data-agent=checkout), and its files
//     include the files of checkout's last commit (git in the world's worktree);
//   - '/diff sb/<a branch no agent is on>' says so in place ('no agent works on this branch'), and its
//     'see the changes' opens the project's changes screen.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubOf, launchOn, realWorld } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  crumb: '[data-testid="app.title.crumb"]',
  review: '[data-testid="review.screen"]',
  files: '[data-testid="review.files"]',
  loading: '[data-testid="review.loading"]',
  branch: '[data-testid="branch.screen"]',
  none: '[data-testid="branch.none"]',
  changes: '[data-testid="branch.changes"]',
};

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const git = (cwd: string, ...a: string[]): string => execFileSync('git', ['-C', cwd, ...a], { encoding: 'utf8', timeout: 20_000, env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null' } });

test("review/branch-real: '/diff <branch>' opens that branch's diff by its name; a branch with no agent says so", async () => {
  test.setTimeout(180_000);
  const w = realWorld();
  const shop = hubOf(w, 'shop');
  const project = path.basename(path.dirname(shop.sock));
  const n = `b${String(Date.now() % 1_000_000)}`;
  const note = (type: string, v: unknown) => test.info().annotations.push({ type, description: typeof v === 'string' ? v : JSON.stringify(v) });
  // checkout's worktree and branch, as git has them in the world
  const wts = git(shop.ws, 'worktree', 'list', '--porcelain')
    .split('\n\n')
    .map((b) => ({ path: /^worktree (.+)$/m.exec(b)?.[1] ?? '', branch: /^branch refs\/heads\/(.+)$/m.exec(b)?.[1] ?? '' }));
  note('worktrees', wts);
  const co = wts.find((x) => x.branch !== '' && (path.basename(x.path).includes('checkout') || x.branch.endsWith('checkout')));
  expect(co, "the world's checkout worktree").toBeDefined();
  const branch = co?.branch ?? '';
  const files = git(co?.path ?? shop.ws, 'log', '-1', '--name-only', '--format=').split('\n').map((f) => f.trim()).filter((f) => f !== '');
  note('checkout', { branch, lastCommitFiles: files });

  const s = await launchOn(w, `project/${project}`, T.field);
  try {
    const { page } = s;
    const say = async (line: string) => {
      const field = page.locator(T.field).first();
      await field.click();
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press('Backspace');
      await page.keyboard.type(line);
      await sleep(300);
      await page.keyboard.press('Enter');
    };
    await expect(page.locator(T.field).first(), "shop's main thread").toBeVisible({ timeout: 15_000 });

    await test.step(`/diff ${branch}: checkout's review, the branch in the crumb`, async () => {
      await say(`/diff ${branch}`);
      const review = page.locator(T.review);
      await expect.soft(review, "the branch's screen is its agent's review").toBeVisible({ timeout: 10_000 });
      await expect.soft(review, 'the agent on that branch: checkout').toHaveAttribute('data-agent', 'checkout', { timeout: 5000 });
      await expect.soft(page.locator(T.crumb), 'the crumb names the branch').toContainText(branch, { timeout: 5000 });
      await expect.soft(page.locator(T.loading), 'its diff came').toHaveCount(0, { timeout: 15_000 });
      const shown = ((await page.locator(T.files).textContent({ timeout: 5000 }).catch(() => '')) ?? '').trim();
      note('files-shown', shown.slice(0, 400));
      for (const f of files.slice(0, 3)) expect.soft(shown, `its files: ${f}`).toContain(path.basename(f));
      note('crumb', ((await page.locator(T.crumb).textContent().catch(() => '')) ?? '').trim());
      await page.screenshot({ path: test.info().outputPath('branch-checkout.png') });
    });

    await test.step('/diff on a branch no agent is on: said in place, then the changes', async () => {
      await page.locator(`[data-testid="app.sidebar.project.${project}"]`).click({ timeout: 10_000 });
      await expect(page.locator(T.field).first(), "back in shop's thread").toBeVisible({ timeout: 10_000 });
      const nobody = `sb/nobody-${n}`;
      await say(`/diff ${nobody}`);
      const screen = page.locator(T.branch);
      await expect.soft(screen, "the branch's screen").toBeVisible({ timeout: 10_000 });
      await expect.soft(screen, 'for that branch').toHaveAttribute('data-branch', nobody, { timeout: 5000 });
      await expect.soft(screen, 'says no agent works on it').toContainText('no agent works on this branch', { timeout: 5000 });
      await expect.soft(page.locator(T.crumb), 'the crumb names it').toContainText(nobody, { timeout: 5000 });
      await page.screenshot({ path: test.info().outputPath('branch-nobody.png') });
      await page.locator(T.changes).click({ timeout: 5000 }).catch((e: unknown) => { note('changes-click', String(e).split('\n')[0] ?? ''); });
      await expect.soft(screen, "'see the changes' leaves it").toBeHidden({ timeout: 5000 });
      note('after-changes', ((await page.locator(T.crumb).textContent().catch(() => '')) ?? '').trim());
      await page.screenshot({ path: test.info().outputPath('changes.png') });
    });
  } finally {
    await s.close();
  }
});

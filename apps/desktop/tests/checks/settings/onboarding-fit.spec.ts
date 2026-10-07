// settings/onboarding-fit · his try round 3, point 2 (ambient-lead m_11771): the first launch's
// projects step fits its window at every size. With 24 found repos, at 680 and 1100 wide and at
// short heights (520, 600) as well as a tall one (820): the step's title, the filter, the list's
// top, the 'add N projects' button, the step dots and the foot (back, skip) are all inside the
// window; the list scrolls inside itself (its scrollHeight > its clientHeight) and the page does
// not (nothing cut above or below). The filter narrows the list as he types. 'choose a folder…'
// goes through window.bise.pickFolder, answered in test mode by BISE_DESKTOP_TEST_PICK_FOLDER
// (amb-mac's hook): the chosen folder joins the list ticked. Writes one PNG per size for ambient's
// sign-off. The scripted core (FakeCore), fake repos. Owner: amb-kit.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const NOW = 1791100400000;
const NAMES = ['shop', 'billing', 'storefront', 'telemetry', 'acme-web', 'acme-api', 'notes', 'infra', 'docs-site', 'mobile', 'design-system', 'search',
  'payments', 'auth', 'mailer', 'analytics', 'admin', 'cli', 'sdk-js', 'sdk-py', 'website', 'blog', 'scripts', 'dotfiles'];
// the repos live in the app's (test) home, so the list shows them as ~/code/<name>
const found = (home: string) => ({
  ev: 'found',
  dir: `${home}/code`,
  items: NAMES.map((name, i) => ({ name, path: `${home}/code/${name}`, git: true, known: false, last_ms: NOW - i * 5 * 86_400_000 })),
});
// amb-mac m_11804: the window opens 1100x720, min width 680, no min height (plan for ~480)
const SIZES: [number, number][] = [[1100, 720], [1100, 520], [680, 600], [680, 480]];
const PICKED = '/Users/camille/elsewhere/side-project';

/** what of the step lies outside the window, or is cut by its own box */
function misfits(): string[] {
  const out: string[] = [];
  const W = window.innerWidth, H = window.innerHeight;
  const ids = ['setup.step.projects', 'setup.filter', 'setup.list', 'setup.next', 'setup.skip', 'setup.back'];
  for (const id of ids) {
    const e = document.querySelector(`[data-testid="${id}"]`);
    if (!e) { if (id !== 'setup.choose') out.push(`missing ${id}`); continue; }
    const r = e.getBoundingClientRect();
    if (r.top < -0.5 || r.left < -0.5 || r.bottom > H + 0.5 || r.right > W + 0.5) out.push(`${id} outside the window (${Math.round(r.top)}..${Math.round(r.bottom)} of ${H})`);
  }
  const root = document.querySelector('[data-testid="setup.root"]');
  if (root && root.scrollHeight > root.clientHeight + 1) out.push(`the page scrolls (${root.scrollHeight} > ${root.clientHeight}): the list should`);
  const list = document.querySelector('[data-testid="setup.list"]');
  if (list && list.scrollHeight <= list.clientHeight) out.push('the list does not scroll inside (24 repos should overflow it)');
  // only the list gives up height (ambient m_11825: the button was squashed to a bar)
  const btn = document.querySelector('[data-testid="setup.next"]');
  if (btn && btn.getBoundingClientRect().height < 34) out.push(`the button is squashed (${Math.round(btn.getBoundingClientRect().height)} px high)`);
  if (btn && btn.scrollHeight > btn.clientHeight + 1) out.push('the button\'s words spill out of it');
  const dots = document.querySelector('.b-onb .steps');
  if (dots && dots.getBoundingClientRect().bottom > H + 0.5) out.push('the step dots are below the window');
  return out;
}

test('settings/onboarding-fit: the projects step fits 680/1100 wide and short heights; the list scrolls inside; filter; choose a folder…', async () => {
  test.setTimeout(120_000);
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: 'onboarding', env: { BISE_DESKTOP_TEST_PICK_FOLDER: PICKED } });
  try {
    const { page } = s;
    await expect(page.getByTestId('setup.step.hello')).toBeVisible({ timeout: 10_000 });
    for (const step of ['permissions', 'model', 'projects']) {
      await page.getByTestId('setup.next').click();
      await expect(page.getByTestId(`setup.step.${step}`)).toBeVisible({ timeout: 5000 });
    }
    const home = await page.evaluate(() => (window as unknown as { bise: { home: string } }).bise.home);
    await core.send(found(home) as never);
    await expect(page.getByTestId('setup.found.dotfiles')).toBeAttached({ timeout: 5000 });
    // the signed path rule: his home as ~ (ambient m_11825)
    await expect(page.getByTestId('setup.found')).toContainText('~/code/shop');
    const win = await s.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0]?.id ?? -1);
    for (const [w, h] of SIZES) {
      await s.app.evaluate(({ BrowserWindow }, [id, w2, h2]) => BrowserWindow.fromId(id ?? -1)?.setContentSize(w2 ?? 0, h2 ?? 0), [win, w, h]);
      await expect.poll(() => page.evaluate(() => [window.innerWidth, window.innerHeight].join('x')), { timeout: 5000 }).toBe(`${String(w)}x${String(h)}`);
      await page.waitForTimeout(150);
      const bad = await page.evaluate(misfits);
      await page.screenshot({ path: test.info().outputPath(`projects-${String(w)}x${String(h)}.png`) });
      expect.soft(bad, `${String(w)}x${String(h)}: ${bad.join(' | ')}`).toEqual([]);
    }
    // the filter: type to narrow
    await page.getByTestId('setup.filter').fill('sdk');
    await expect(page.locator('[data-testid^="setup.found."][role="checkbox"], [data-testid^="setup.found."]:not([data-testid*="/"])')).toHaveCount(2);
    await page.screenshot({ path: test.info().outputPath('projects-filter-sdk.png') });
    await page.getByTestId('setup.filter').fill('');
    // choose a folder…: the test hook answers the picker; the folder joins the list, ticked
    const hasPicker = await page.evaluate(() => typeof (window as unknown as { bise?: { pickFolder?: unknown } }).bise?.pickFolder === 'function');
    // until amb-mac's bridge lands (asked m_11776) the picker half is marked fixme, never silently green
    test.fixme(!hasPicker, "window.bise.pickFolder (amb-mac's bridge) is not in this build yet");
    if (hasPicker) {
      await page.getByTestId('setup.choose').click();
      await expect(page.getByTestId('setup.chosen.side-project')).toBeVisible({ timeout: 5000 });
      await page.getByTestId('setup.next').click();
      await expect.poll(() => core.cmds().some((c) => c.cmd === 'project_add' && (c as { path?: string }).path === PICKED), { timeout: 5000 }).toBe(true);
    }
  } finally {
    await s.close();
  }
});

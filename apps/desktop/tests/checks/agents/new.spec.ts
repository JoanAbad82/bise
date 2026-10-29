// agents/new · bar A.1 (docs/desktop-bar.md): /new starts an agent, from the window and from the
// TUI, each seen by the other. Owner: qa-flows. The NEW app on the REAL core over the throwaway
// world (../world.ts), the TUI on the same hub as the reference; amb-win's '+ new agent' sheet
// (92d90720) on amb-feed's typed new (6cb6c0ef). Passes when:
//   - the window's '+ new agent' sheet (brief, name, its own worktree) starts the agent: the hub
//     has it, in its own worktree on a branch that exists in git, the window's list and the TUI's
//     panel show it;
//   - the TUI's '/new <name>: <brief>' starts one that the window's list shows.
// Not covered: the spotlight's /new; 'with my changes' (the world's checkouts are clean).
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubAgents, hubOf, launchOn, realWorld, tui, tuiAgents, tuiReady, tuiSay, type Tui } from '../world';

const T = {
  screen: '[data-testid="agents.screen"]',
  add: '[data-testid="agents.new"]',
  sheet: '[data-testid="agents.newsheet"]',
  brief: '[data-testid="agents.new.brief"]',
  name: '[data-testid="agents.new.name"]',
  worktree: '[data-testid="agents.new.worktree"]',
  send: '[data-testid="agents.new.send"]',
  error: '[data-testid="agents.new.error"]',
  row: (n: string) => `[data-testid="agents.row.${n}"]`,
};

const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null' } }).trim();

test('agents/new: the window starts an agent in its own worktree, seen by the hub, git and the TUI; the TUI\'s /new shows in the window', async () => {
  test.setTimeout(180_000);
  const w = realWorld();
  const hub = hubOf(w, 'telemetry');
  const project = path.basename(path.dirname(hub.sock));
  const n = String(Date.now() % 100_000);
  const mine = `qa${n}`;
  const theirs = `tui${n}`;
  let t: Tui | undefined;
  const s = await launchOn(w, `agents/${project}`, T.screen);
  try {
    const { page } = s;
    t = tui(w, 'telemetry');
    await tuiReady(t);
    await expect(page.locator(T.screen)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(T.add), "'+ new agent' can be used").toBeEnabled({ timeout: 5000 });
    // the window's sheet: brief, name, its own worktree
    await page.locator(T.add).click();
    await expect(page.locator(T.sheet), "'+ new agent' opens its sheet").toBeVisible({ timeout: 3000 });
    await page.locator(T.brief).click();
    await page.keyboard.type('count the slow queries');
    await page.locator(T.name).click();
    await page.keyboard.type(mine);
    const wt = page.locator(T.worktree);
    if (!(await wt.isChecked())) await wt.click();
    await page.screenshot({ path: test.info().outputPath('sheet.png') });
    await page.locator(T.send).click();
    try {
      await expect.poll(async () => (await hubAgents(w, 'telemetry')).some((a) => a.name === mine), { timeout: 20_000, message: 'the hub has the new agent' }).toBe(true);
    } finally {
      await page.screenshot({ path: test.info().outputPath('sent.png') });
    }
    // the hub lists a worktree agent at once, placing (bend/hub/place.bend): no path nor branch until
    // the shell's `placed` comes from its thread (git worktree add + setup, seconds under load); its
    // time from the first row goes in an annotation for the nightly's trend, over 15 s it is red
    const listed = Date.now();
    await expect.poll(async () => (await hubAgents(w, 'telemetry')).find((x) => x.name === mine)?.branch ?? '', { timeout: 15_000, message: 'the hub places it on a branch within 15 s of its row' }).not.toBe('');
    test.info().annotations.push({ type: 'placed', description: `placed in ${Date.now() - listed} ms` });
    const a = (await hubAgents(w, 'telemetry')).find((x) => x.name === mine);
    test.info().annotations.push({ type: 'hub', description: JSON.stringify({ name: a?.name, mode: a?.mode, branch: a?.branch, path: a?.path }) });
    expect(a?.mode, 'in its own worktree').toBe('worktree');
    expect(a?.branch ?? '', 'on a branch').not.toBe('');
    expect(git(hub.ws, 'branch', '--list', a?.branch ?? '-'), 'its branch exists in git').not.toBe('');
    await expect(page.locator(T.row(mine)), "the window's list shows it").toBeVisible({ timeout: 5000 });
    await expect(page.locator(T.sheet), 'the sheet closes once its row comes').toHaveCount(0, { timeout: 5000 });
    await expect.poll(() => (t ? tuiAgents(t.screen()) : []).some((x) => x.name === mine), { timeout: 10_000, message: "the TUI's panel shows it" }).toBe(true);
    // the TUI's /new, seen by the window
    tuiSay(t, `/new ${theirs}: list the slowest endpoints`);
    await expect.poll(async () => (await hubAgents(w, 'telemetry')).some((x) => x.name === theirs), { timeout: 20_000, message: "the hub has the TUI's new agent" }).toBe(true);
    await expect(page.locator(T.row(theirs)), "the window's list shows the TUI's new agent").toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: test.info().outputPath('both.png') });
  } finally {
    if (t) {
      test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(t.screen()) });
      t.close();
    }
    await s.close();
  }
});

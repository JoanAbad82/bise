// thread/folds-open · his bug on cb1f2b44 (main m_14129, ambient-lead m_14131, his shot
// ~/.bise/gate/inbox/cb1f2b44-folds.png): 'I can't click to expand or ctrl+o to see the detail of
// a model's thinking or tools'. On the REAL thread screen (FakeCore, not a lab), in an agent's
// thread. Passes when: a click on a folded steps pill ('▸ read 2 files') shows its rows and a
// second click hides them; a click on a thinking row shows what it thought; a click on a '$' line
// shows its command and output; ctrl+o (the TUI's: open everything closed, else close what is
// open) opens every fold, thinking and tool line, with the composer focused and with it not, and a
// second ctrl+o closes them; his draft in the composer is untouched by ctrl+o. Shots light and dark.
// Owner: amb-win.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 9 * MIN, waits: 0 });
const world = () => [
  prefs('dark'),
  { ev: 'projects', projects: [{ project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 0, agents: 2, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [ag('main'), ag('perf')] },
  {
    ev: 'thread',
    project: P,
    agent: 'perf',
    entries: [
      { pos: 1, at_ms: NOW - 8 * MIN, kind: 'you', text: 'map the submission loop' },
      { pos: 2, at_ms: NOW - 7 * MIN, kind: 'thinking', text: 'thought for 3.2s', thinking: { ms: 3200, text: 'the loop reads core state first, then the channels' } },
      {
        pos: 3,
        at_ms: NOW - 7 * MIN,
        kind: 'tools',
        text: 'ran 1 command, read 2 files',
        tools: {
          count: 3,
          summary: 'ran 1 command, read 2 files',
          items: [
            { pos: 4, at_ms: NOW - 7 * MIN, text: 'rg submission core/', kind: 'run', state: 'ok', ms: 900, code: 'rg submission core/', out: 'core/loop.rs:12: fn submission_loop' },
            { pos: 5, at_ms: NOW - 7 * MIN + 2000, text: 'read_file: {"path":"core/loop.rs"}', kind: 'read', state: 'ok', ms: 20 },
            { pos: 6, at_ms: NOW - 7 * MIN + 3000, text: 'read_file: {"path":"core/state.rs"}', kind: 'read', state: 'ok', ms: 20 },
          ],
        },
      },
      { pos: 7, at_ms: NOW - 6 * MIN, kind: 'agent', text: 'Skeleton first.' },
    ],
    before: null,
    more: false,
  },
];

/** What shows open: the fold's steps, the thinking's words, the '$' line's output. */
const opened = (page: Page) => ({
  steps: page.locator('[data-testid="thread.toolrow.3"] .th-steps .th-tool-line'),
  think: page.locator('[data-testid="thread.think.2"] .th-think-body'),
  out: page.getByTestId('thread.tool.4.open'),
});

test("thread/folds-open: a click opens a steps pill, a thinking and a '$' line; ctrl+o opens and closes them all, composer focused or not", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1100x760' });
  try {
    const { page } = s;
    const o = opened(page);
    const pill = page.getByTestId('thread.tools.3');
    await expect(pill, "the folded steps' pill").toContainText('read 2 files', { timeout: 10_000 });
    await expect(o.steps).toHaveCount(0);
    await page.mouse.move(1, 300);
    await page.screenshot({ path: test.info().outputPath('closed-dark.png') });

    // clicks, one at a time
    await pill.click();
    await expect(o.steps, 'a click on the pill shows its rows').toHaveCount(2);
    // the same rows as the tool lines: the TUI's verb and its time, no bullet, no filled box (designer m_14269)
    await expect(o.steps.first()).toContainText('read core/loop.rs');
    await expect(o.steps.first()).toContainText('✓');
    const fill = await page.locator('[data-testid="thread.toolrow.3"] .b-out').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(fill, 'no fill under the open rows').toBe('rgba(0, 0, 0, 0)');
    await pill.click();
    await expect(o.steps, 'a second click hides them').toHaveCount(0);
    await page.getByTestId('thread.think.2.head').click();
    await expect(o.think, 'a click on the thinking shows what it thought').toHaveText('the loop reads core state first, then the channels');
    await page.getByTestId('thread.think.2.head').click();
    await expect(o.think).toHaveCount(0);
    await page.getByTestId('thread.tool.4').click();
    await expect(o.out, "a click on the '$' line shows its output").toContainText('core/loop.rs:12: fn submission_loop');
    await page.getByTestId('thread.tool.4').click();
    await expect(o.out).toHaveCount(0);

    // ctrl+o with the composer focused (his draft untouched), then with it not
    const field = page.getByTestId('composer.field');
    await field.click();
    await page.keyboard.type('half a thought');
    await page.keyboard.press('Control+o');
    await expect(o.steps, 'ctrl+o from the composer opens the steps').toHaveCount(2);
    await expect(o.think).toBeVisible();
    await expect(o.out).toBeVisible();
    await expect(field, "his draft is untouched (no 'open line')").toHaveText('half a thought');
    await page.mouse.move(1, 300);
    await page.screenshot({ path: test.info().outputPath('open-dark.png') });
    await core.send(prefs('light') as never);
    await page.waitForTimeout(300);
    await page.screenshot({ path: test.info().outputPath('open-light.png') });
    await page.keyboard.press('Control+o');
    await expect(o.steps, 'ctrl+o again closes them').toHaveCount(0);
    await expect(o.think).toHaveCount(0);
    await expect(o.out).toHaveCount(0);
    await page.getByTestId('thread.screen').click({ position: { x: 5, y: 200 } });
    await page.keyboard.press('Control+o');
    await expect(o.steps, 'ctrl+o with the composer not focused').toHaveCount(2);
    await expect(o.think).toBeVisible();
  } finally {
    await s.close();
    core.dispose();
  }
});

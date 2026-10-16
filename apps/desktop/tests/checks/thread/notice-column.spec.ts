// thread/notice-column · his shot (main m_22826, ambient-lead m_22827): '· restarting the hub on the
// current version … — the agents keep running' sat left of the thread's text column. Every hub
// notice and system row sits on the column like the other tier-3/4 rows (designer's thread-tiers):
// the hub's typed-command line under the list (HubNoteRow), and in the list a '·' notice, a stop
// ('▲ turn interrupted'), a wake and a compaction. Main's thread on FakeCore. Passes when, at 1400 /
// 1100 / 800, light and dark, each row's left edge is the prose's (± 0.5 px). Frames:
// notice-column-<theme>-<width>.png. Owner: amb-home.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { thread as tw } from '../../../src/proto/words.gen';

const HOME = 'bise-home-00000000';
const P = 'shop-ab9f3c3b';
const NOW = Date.now();
const MIN = 60_000;
const at = (m: number) => NOW - m * MIN;
const RESTART = 'restarting the hub on 041168b2 · the agents keep running'; // versions.rs's words (amb-feed 58798722)
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 9 * MIN, waits: 0, watching: [] });
const thread = [
  { pos: 1, at_ms: at(30), kind: 'you', text: 'is the build in test yet?' },
  { pos: 2, at_ms: at(29), kind: 'agent', text: 'Not yet: it will be in the build after the one in test (37fa183d).' },
  { pos: 3, at_ms: at(25), kind: 'notice', text: 'the nightly gate starts at 02:00', notice: { level: 'info', text: 'the nightly gate starts at 02:00' } },
  { pos: 4, at_ms: at(20), kind: 'notice', text: tw.turn_interrupted, notice: { level: 'warn', text: tw.turn_interrupted } },
  { pos: 5, at_ms: at(15), kind: 'wake', text: tw.wake_stopped({ what: 'the reindex' }), wake: { id: 7, ev: 'stopped', kind: 'pid', what: 'the reindex', noted: true, after_ms: 60_000 } },
  { pos: 6, at_ms: at(10), kind: 'compacted', text: 'we checked which build is in test' },
];
const world = (theme: string) => [
  prefs(theme),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'shop' },
  { ev: 'agents', project: P, agents: [ag('main')] },
  { ev: 'thread', project: P, agent: 'main', entries: thread, before: null, more: false },
];

const ROWS: readonly (readonly [string, string])[] = [
  ['the hub line (restart)', '[data-testid="confirm.notice"]'],
  ["a '·' notice", '[data-testid="thread.notice.3"]'],
  ['a stop', '[data-testid="thread.notice.4"]'],
  ['a wake', '[data-testid="thread.wake.5"]'],
  ['a compaction', '[data-testid="thread.compacted.6"]'],
];
const leftOf = async (page: Page, sel: string): Promise<number> => (await page.locator(sel).first().boundingBox())?.x ?? -1;

for (const theme of ['light', 'dark']) {
  test(`thread/notice-column: the hub's notice and system rows sit on the text column (${theme})`, async () => {
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `project/${P}`, size: '1400x900' });
    try {
      const { page } = s;
      await expect(page.getByTestId('thread.entry.2'), 'the thread').toBeVisible({ timeout: 10_000 });
      await core.send({ ev: 'notice', project: P, text: RESTART } as never);
      await expect(page.locator('[data-testid="confirm.notice"]'), 'the restart line').toContainText(RESTART, { timeout: 5000 });
      for (const w of [1400, 1100, 800]) {
        await page.setViewportSize({ width: w, height: 900 });
        await page.waitForTimeout(250);
        const col = await leftOf(page, '[data-testid="thread.entry.2"] .th-md p');
        expect(col, `${String(w)}: the prose`).toBeGreaterThan(0);
        for (const [what, sel] of ROWS) {
          const x = await leftOf(page, sel);
          expect.soft(Math.abs(x - col), `${String(w)}: ${what} at ${x.toFixed(2)}, the column at ${col.toFixed(2)}`).toBeLessThanOrEqual(0.5);
        }
        await page.mouse.move(1, 400);
        await page.screenshot({ path: test.info().outputPath(`notice-column-${theme}-${String(w)}.png`) });
      }
      // his m_22835: the hub came back (its hello) and the restart row never left: it goes within 1 s
      await core.send({ ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'shop' } as never);
      await expect(page.locator('[data-testid="confirm.notice"]'), 'the hub is back: the restart row goes').toHaveCount(0, { timeout: 1000 });
      await page.reload();
      await expect(page.getByTestId('thread.entry.2'), 'after a reload').toBeVisible({ timeout: 10_000 });
      await expect(page.locator('[data-testid="confirm.notice"]'), 'after a reload: no restart row').toHaveCount(0);
    } finally {
      await s.close();
    }
  });
}

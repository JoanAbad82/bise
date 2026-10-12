// thread/hierarchy · tui-parity's side-by-side (http://127.0.0.1:47438/p/thread-hierarchy, ambient-lead
// m_19824) with designer's values (m_19832): the app's thread reads like the TUI's. Shop's main on
// FakeCore: his question, a turn that opens on a tool row then answers under a '## heading', a new
// agent, a land, a wake and a scheduled run in a row, 12 min of silence, another answer. Passes when,
// at 1400 / 1100 / 800, light and dark:
//   H1  the quiet rows touch (4 px), their run sits 12 px under the prose;
//   H2  no name line over the tool row: the turn's head is on its first text row, one per run;
//   H3  the scheduled row is one line, '▸' at its end when it has words;
//   H6  the reply's h2 is 15 px 600 (body size), never bigger than the head;
//   H11 the new agent is its own quiet row '✚ new agent docs-line · add a notes line';
//   H12 no time on the head at rest (on hover only), a faint '· 14:31 ·' after 5 min of silence;
//   FONT every quiet row's words sans, 13 px.
// Frames: hierarchy-<theme>-<width>.png and hierarchy-<theme>-hover.png. Owner: amb-win.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'shop-ab9f3c3b';
const NOW = Date.now();
const MIN = 60_000;
const at = (m: number) => NOW - m * MIN;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string, purpose = `${name}'s job`) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose, since_ms: NOW - 50 * MIN, waits: 0, watching: [] });
const ANSWER = '## What changed\n\nThe notes line now says who wrote it and when; docs-line adds it to the README.';
const thread = [
  { pos: 1, at_ms: at(40), kind: 'you', text: 'can the notes say who wrote them?' },
  { pos: 2, at_ms: at(39), kind: 'tools', text: 'ran 1 command', tools: { count: 1, summary: 'ran 1 command', items: [{ pos: 2, at_ms: at(39), text: 'rg -n notes src', kind: 'run', state: 'ok', ms: 300 }] } },
  { pos: 3, at_ms: at(39), kind: 'agent', text: ANSWER },
  { pos: 4, at_ms: at(38), kind: 'notice', text: '✚ main → new agent @docs-line : add a notes line', notice: { level: 'info', text: '✚ main → new agent @docs-line : add a notes line' } },
  { pos: 5, at_ms: at(37), kind: 'landed', text: '1 file +2', landed: { agent: 'docs-line', target: 'main', from: 'sb/docs-line', sha: '689c392aa1b2c3d4', files: 1, add: 2, del: 0 } },
  { pos: 6, at_ms: at(37), kind: 'wake', text: 'cargo test ended · rc 0 · after 1m02s', wake: { after_ms: 62000, ev: 'ended', id: 2, kind: 'bg', rc: 0, tail: ['test result: ok. 212 passed'], what: 'cargo test' } },
  { pos: 7, at_ms: at(36), kind: 'scheduled', text: 'main scheduled the p99 check · every 30 min · next 20:11', scheduled: { id: 5, head: 'main scheduled the p99 check · every 30 min · next 20:11', words: 'check the p99 of the checkout' } },
  { pos: 8, at_ms: at(24), kind: 'agent', text: 'The p99 is back under 300 ms.' },
];
const world = (theme: string) => [
  prefs(theme),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'shop' },
  { ev: 'agents', project: P, agents: [ag('main'), ag('docs-line', 'add a notes line')] },
  { ev: 'thread', project: P, agent: 'main', entries: thread, before: null, more: false },
];

/** The room between two rows' boxes, in px. */
const between = async (page: Page, a: string, b: string): Promise<number> => {
  const [x, y] = await Promise.all([page.getByTestId(a).boundingBox(), page.getByTestId(b).boundingBox()]);
  return Math.round((y?.y ?? 0) - ((x?.y ?? 0) + (x?.height ?? 0)));
};

for (const theme of ['light', 'dark']) {
  test(`thread/hierarchy: quiet rows touch, one head per run, no times at rest, one-line news (${theme})`, async () => {
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `project/${P}`, size: '1400x900' });
    try {
      const { page } = s;
      await expect(page.getByTestId('thread.entry.8')).toBeVisible({ timeout: 10_000 });
      for (const w of [1400, 1100, 800]) {
        await page.setViewportSize({ width: w, height: 900 });
        await page.waitForTimeout(250);
        await page.mouse.move(1, 400);
        // H2: no name line over the tool row; the turn's head is on its first text row
        await expect(page.locator('[data-testid="thread.entry.2"] .b-who')).toHaveCount(0);
        await expect(page.locator('[data-testid="thread.entry.3"] .b-who:not(.b-hover)')).toHaveCount(1);
        // a project's main is named bise (the user's decision)
        await expect(page.locator('[data-testid="thread.entry.3"] .b-who b')).toHaveText('bise');
        // H12: its time hidden at rest
        await expect(page.locator('[data-testid="thread.entry.3"] .b-who .b-time')).toHaveCSS('opacity', '0');
        // H6: the h2 at body size, 600
        const h2 = await page.locator('[data-testid="thread.entry.3"] h2').evaluate((el) => ({ size: getComputedStyle(el).fontSize, weight: getComputedStyle(el).fontWeight }));
        expect(h2, 'H6: the heading at body size').toEqual({ size: '15px', weight: '600' });
        // H11: the new agent, its own quiet row
        await expect(page.getByTestId('thread.handoff.4')).toHaveText('✚new agent docs-line · add a notes line');
        // FONT: every quiet row sans 13
        for (const id of ['thread.handoff.4', 'thread.landed.5', 'thread.wake.6', 'thread.scheduled.7']) {
          const f = await page.getByTestId(id).evaluate((el) => ({ font: getComputedStyle(el).fontFamily, size: getComputedStyle(el).fontSize }));
          expect(f.font, `${id}: sans`).not.toMatch(/mono/i);
          expect(f.size, `${id}: 13 px`).toBe('13px');
        }
        // H1: the quiet rows touch, 12 px under the prose
        const prose = await between(page, 'thread.entry.3', 'thread.handoff.4');
        expect(prose, `12 px from the prose to the run of quiet rows (${String(prose)})`).toBeGreaterThanOrEqual(10);
        expect(prose, `12 px from the prose to the run of quiet rows (${String(prose)})`).toBeLessThanOrEqual(14);
        for (const [a, b] of [
          ['thread.handoff.4', 'thread.landed.5'],
          ['thread.landed.5', 'thread.wake.6'],
          ['thread.wake.6', 'thread.scheduled.7'],
        ] as const) {
          const d = await between(page, a, b);
          expect(d, `${a} → ${b}: 4 px (${String(d)})`).toBeGreaterThanOrEqual(2);
          expect(d, `${a} → ${b}: 4 px (${String(d)})`).toBeLessThanOrEqual(6);
        }
        // H3: the scheduled row on one line, '▸' at its end
        const sched = page.getByTestId('thread.scheduled.7');
        await expect(sched).toHaveText('◷main scheduled the p99 check · every 30 min · next 20:11 ▸');
        const one = await sched.evaluate((el) => el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
        expect(one, 'H3: one line').toBeLessThan(1.6);
        // H12: after 12 min of silence, a faint '· 14:31 ·' and a new head
        await expect(page.getByTestId('thread.pause.8')).toHaveText(/^· \d{1,2}:\d{2}( [AP]M)? ·$/u);
        await expect(page.locator('[data-testid="thread.entry.8"] .b-who:not(.b-hover)')).toHaveCount(1);
        await page.screenshot({ path: test.info().outputPath(`hierarchy-${theme}-${String(w)}.png`) });
      }
      // H12: the time shows on hover, right-aligned, taking no room
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.waitForTimeout(250);
      const msg = page.locator('[data-testid="thread.entry.3"] .b-msg');
      await msg.hover();
      const time = page.locator('[data-testid="thread.entry.3"] .b-who .b-time');
      await expect(time).toHaveCSS('opacity', '1');
      const [tb, mb] = await Promise.all([time.boundingBox(), msg.boundingBox()]);
      expect(Math.abs((tb?.x ?? 0) + (tb?.width ?? 0) - ((mb?.x ?? 0) + (mb?.width ?? 0))), 'right-aligned').toBeLessThanOrEqual(1);
      await page.screenshot({ path: test.info().outputPath(`hierarchy-${theme}-hover.png`) });
    } finally {
      await s.close();
    }
  });
}

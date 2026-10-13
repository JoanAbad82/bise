// thread/hierarchy · tui-parity's side-by-side (http://127.0.0.1:47438/p/thread-hierarchy, ambient-lead
// m_19824) with designer's values (m_19832): the app's thread reads like the TUI's. Shop's main on
// FakeCore: his question, a turn that opens on a tool row then answers under a '## heading', a new
// agent, a land, a wake and a scheduled run in a row, 12 min of silence, another answer. Passes when,
// at 1400 / 1100 / 800, light and dark:
//   H1  the quiet rows touch (4 px), their run sits 12 px under the prose;
//   H2  one head per run, on its first row, a tool row too (designer m_21404 (3): a run never
//       shows rows before its author), 4 px over that row;
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
  // main's copy of docs-line's wake (amb-feed 11e5fbbc wake.agent): tier 4, dim, never red
  { pos: 9, at_ms: at(23), kind: 'wake', text: 'cargo test ended · rc 101 · after 3m10s', wake: { after_ms: 190000, agent: 'docs-line', ev: 'ended', id: 3, kind: 'bg', rc: 101, tail: ['test result: FAILED. 210 passed; 2 failed'], what: 'cargo test' } },
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
        // H2 (designer m_21404 (3)): the run's head sits over its first row, the tool row; none on
        // the answer under it (same run)
        await expect(page.locator('[data-testid="thread.entry.2"] .b-who:not(.b-hover)')).toHaveCount(1);
        await expect(page.locator('[data-testid="thread.entry.3"] .b-who:not(.b-hover)')).toHaveCount(0);
        // a project's main is named bise (the user's decision)
        await expect(page.locator('[data-testid="thread.entry.2"] .b-who b')).toHaveText('bise');
        // H12: its time hidden at rest
        await expect(page.locator('[data-testid="thread.entry.2"] .b-who .b-time')).toHaveCSS('opacity', '0');
        // the head to its run's first row (the tool row here) is 4 px
        const headGap = await page.evaluate(() => {
          const who = document.querySelector('[data-testid="thread.entry.2"] .b-who:not(.b-hover)')?.getBoundingClientRect();
          const t = document.querySelector('[data-testid="thread.entry.2"] .th-tools')?.getBoundingClientRect();
          return who && t ? Math.round(t.top - who.bottom) : -1;
        });
        expect(headGap, `the head to the row under it: 4 px (${String(headGap)})`).toBeGreaterThanOrEqual(2);
        expect(headGap, `the head to the row under it: 4 px (${String(headGap)})`).toBeLessThanOrEqual(6);
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
        // another agent's wake in main's thread: dim (text-3), named for whom, its rc never red
        const wf = page.getByTestId('thread.wake.9');
        await expect(wf).toHaveAttribute('data-for', 'docs-line');
        await expect(wf).toContainText("docs-line's cargo test ended");
        await expect(page.locator('[data-testid="thread.wake.9"] [data-err]')).toHaveCount(0);
        await page.screenshot({ path: test.info().outputPath(`hierarchy-${theme}-${String(w)}.png`) });
        // H3's record for designer: the quiet rows with the scheduled one, close
        if (w === 1100) {
          const [a, b] = await Promise.all([page.getByTestId('thread.handoff.4').boundingBox(), page.getByTestId('thread.scheduled.7').boundingBox()]);
          if (a !== null && b !== null) await page.screenshot({ path: test.info().outputPath(`hierarchy-${theme}-h3-scheduled.png`), clip: { x: a.x - 16, y: a.y - 12, width: 720, height: b.y + b.height - a.y + 24 } });
        }
      }
      // H12: the time shows on hover, right-aligned, taking no room
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.waitForTimeout(250);
      // (the run's head is over its first row, the tool row: m_21404 (3))
      const msg = page.locator('[data-testid="thread.entry.2"] .b-msg');
      await msg.hover();
      const time = page.locator('[data-testid="thread.entry.2"] .b-who .b-time');
      await expect(time).toHaveCSS('opacity', '1');
      const [tb, mb] = await Promise.all([time.boundingBox(), msg.boundingBox()]);
      expect(Math.abs((tb?.x ?? 0) + (tb?.width ?? 0) - ((mb?.x ?? 0) + (mb?.width ?? 0))), 'right-aligned').toBeLessThanOrEqual(1);
      await page.screenshot({ path: test.info().outputPath(`hierarchy-${theme}-hover.png`) });
    } finally {
      await s.close();
    }
  });
}

// H7 H8 H9 (commit B): perf's own thread. His message quoting main; a report the message under it
// repeats, another that stands alone; a model call's 3 tries then an answer.
const RPT = 'p99 rose because it averaged the slowest 10%; it is the real percentile now';
const tries = (n: number, next?: number) => `model call failed (attempt ${String(n)}/10): no answer from 127.0.0.1:51072 in 90 s (timeout)${next === undefined ? '' : ` · retry ${String(next)}/10 in 4s`}`;
const perf = [
  {
    pos: 1,
    at_ms: at(20),
    kind: 'you',
    text: 'is that still true now that the batch size is back to 500?',
    parts: [
      { kind: 'quote', from: 'main', text: "Agreed on the api: it's the shared batch size, not one noisy host. Here is the whole picture, with the numbers per host." },
      { kind: 'text', text: 'is that still true now that the batch size is back to 500?' },
    ],
  },
  { pos: 2, at_ms: at(19), kind: 'to_agent', to: 'main', text: `[report: done] ${RPT}` },
  { pos: 3, at_ms: at(19), kind: 'agent', text: `P99 rose because it averaged the slowest 10%; it is the real percentile now (src/latency.py). ready to merge.` },
  { pos: 4, at_ms: at(18), kind: 'to_agent', to: 'main', text: '[report: done] the batch test passes on 500 too.\n- 3 runs, p99 280-300 ms' },
  { pos: 5, at_ms: at(17), kind: 'notice', text: tries(1, 2), notice: { level: 'warn', text: tries(1, 2) } },
  { pos: 6, at_ms: at(17), kind: 'notice', text: tries(2, 3), notice: { level: 'warn', text: tries(2, 3) } },
  { pos: 7, at_ms: at(17), kind: 'notice', text: tries(3, 4), notice: { level: 'warn', text: tries(3, 4) } },
  { pos: 8, at_ms: at(16), kind: 'agent', text: 'Still true at 500: the p99 holds at 290 ms.' },
  { pos: 9, at_ms: at(15), kind: 'notice', text: tries(10), notice: { level: 'warn', text: tries(10) } },
  // H13: a long command is cut with …, its ✓ and time stay at its end
  { pos: 10, at_ms: at(14), kind: 'tools', text: 'ran 1 command', tools: { count: 1, summary: 'ran 1 command', items: [{ pos: 10, at_ms: at(14), text: `bash /Users/someone/.bise/gate/w-tuiparity/rich/${'p99-ask-'.repeat(20)}.sh`, kind: 'run', state: 'ok', ms: 700 }] } },
  { pos: 11, at_ms: at(14), kind: 'agent', text: 'Trying again.' },
  // the hub's typed retry (amb-feed dd17152f): one entry per run, ended 'recovered': one dim line
  { pos: 12, at_ms: at(13), kind: 'notice', text: tries(2, 3), notice: { level: 'warn', text: tries(2, 3), retry: { attempt: 2, max: 10, why: 'no answer in 90 s (timeout)', wait_ms: 4000, end: 'recovered' } } },
];
const world2 = (theme: string) => [...world(theme).filter((e) => e.ev !== 'agents'), { ev: 'agents', project: P, agents: [ag('main'), ag('perf', 'p99 latency')] }, { ev: 'thread', project: P, agent: 'perf', entries: perf, before: null, more: false }];

for (const theme of ['light', 'dark']) {
  test(`thread/hierarchy: a quote on one line, a repeated report folded, retries on one updating row (${theme})`, async () => {
    const core = new FakeCore(world2(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1100x900' });
    try {
      const { page } = s;
      await expect(page.getByTestId('thread.entry.12')).toBeVisible({ timeout: 10_000 });
      await page.mouse.move(1, 400);
      // H7: the quote, one dim line at the bubble's top, its words cut with …
      const q = page.getByTestId('thread.you.1.quote.1');
      await expect(q).toContainText('❝ Agreed on the api');
      await expect(q).toContainText('· bise · 1 line');
      const ql = await q.evaluate((el) => ({ h: el.getBoundingClientRect().height, lh: parseFloat(getComputedStyle(el).lineHeight), size: getComputedStyle(el).fontSize }));
      expect(ql.h / ql.lh, 'H7: one line').toBeLessThan(1.6);
      expect(ql.size).toBe('13px');
      // H8: the report the message under it repeats: one quiet row that keeps its words
      // ('✓ <summary>… ▸ report', sans 13 text-2, designer via ambient-lead m_20040); the message stays
      await expect(page.getByTestId('thread.report.2.fold')).toHaveText(/^✓p99 rose because it averaged the slowest 10%.*▸ report$/u);
      const fold = await page.getByTestId('thread.report.2.fold').evaluate((el) => ({ size: getComputedStyle(el).fontSize, font: getComputedStyle(el).fontFamily, h: el.getBoundingClientRect().height }));
      expect(fold.size).toBe('13px');
      expect(fold.font).not.toMatch(/mono/i);
      expect(fold.h, 'one row').toBeLessThan(24);
      await expect(page.getByTestId('thread.entry.3')).toContainText('ready to merge');
      // a report alone: its one line, '▸ report' opens the rest in place
      await expect(page.locator('[data-testid="thread.report.4"] .b-marker')).toHaveText(/^✓ done · the batch test passes on 500 too\.?$/u);
      const one = await page.getByTestId('thread.report.4').evaluate((el) => el.getBoundingClientRect().height);
      expect(one, 'H8: one line').toBeLessThan(30);
      // H9: three tries, one row with the last words; the ▲ dim until the last try fails
      await expect(page.getByTestId('thread.notice.5')).toHaveCount(0);
      await expect(page.getByTestId('thread.notice.6')).toHaveCount(0);
      await expect(page.getByTestId('thread.notice.7.retry')).toHaveText('▲model call failed · retry 4 of 10 in 4 s ▸');
      const err = await page.evaluate(() => {
        const p = document.createElement('span');
        p.style.color = 'var(--c-err)';
        document.body.appendChild(p);
        const c = getComputedStyle(p).color;
        p.remove();
        return c;
      });
      expect(await page.getByTestId('thread.notice.7.retry').evaluate((el) => getComputedStyle(el).color), 'not red while it retries').not.toBe(err);
      await expect(page.getByTestId('thread.notice.9.retry')).toHaveText('▲model call failed · try 10 of 10 failed ▸');
      expect(await page.getByTestId('thread.notice.9.retry').evaluate((el) => getComputedStyle(el).color), 'red once the last try failed').toBe(err);
      // H13: the long command cut, its ✓ and '0.7 s' inside the row, at its end
      const t13 = await page.evaluate(() => {
        const line = document.querySelector('[data-testid="thread.tool.10"]')?.getBoundingClientRect();
        const end = document.querySelector('[data-testid="thread.tool.10.end"]')?.getBoundingClientRect();
        const text = document.querySelector('[data-testid="thread.tool.10"] .th-tool-text');
        return { inside: line && end ? end.right <= line.right + 1 && end.width > 0 : false, cut: text instanceof HTMLElement ? text.scrollWidth > text.clientWidth : false };
      });
      expect(t13, 'H13: the command cut, its status kept').toEqual({ inside: true, cut: true });
      await expect(page.getByTestId('thread.tool.10.end')).toContainText('0.7');
      // the typed run that went through: one dim line
      await expect(page.getByTestId('thread.notice.12.retry')).toHaveText('▲model call failed 2 times · went through ▸');
      await expect(page.getByTestId('thread.notice.12')).toHaveAttribute('data-done', 'true');
      await page.screenshot({ path: test.info().outputPath(`hierarchy-b-${theme}-folded.png`) });
      // open: the quote whole, the report's words, each try
      await q.click();
      await expect(q).toContainText('with the numbers per host.');
      await page.getByTestId('thread.report.2.fold').click();
      await expect(page.getByTestId('thread.report.2.body')).toContainText('real percentile now');
      await page.getByTestId('thread.notice.7.retry').click();
      await expect(page.locator('[data-testid="thread.notice.7.tries"] li')).toHaveCount(3);
      await page.mouse.move(1, 400);
      await page.screenshot({ path: test.info().outputPath(`hierarchy-b-${theme}-open.png`) });
    } finally {
      await s.close();
    }
  });
}

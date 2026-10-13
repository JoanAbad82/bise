// thread/tiers · his try a43609b2 (main m_19377, ambient-lead m_19378/m_19385): the thread follows the
// brand book's hierarchy; designer's rules m_19387 (http://127.0.0.1:47438/p/thread-tiers). Main's
// thread on FakeCore holds every tier: his question, bise's answer (tier 2), a tool row, a run of
// three messages between bise and mcp-errors whose first carries 20 lines of test output (tier 4), a
// land the hub said twice (a '·' notice line, then the typed row), a PR, a scheduled run (tier 3),
// a card (tier 1). Passes when, at 1400 / 1100 / 800, light and dark:
//   - the run folds to '▸ 3 messages between 2 agents' whose left edge is the prose's (±1 px);
//   - nothing addressed to another agent is ink: open, the notes are sans 13 in --c-text-3 (H4,
//     designer m_19832), the sender in ink 600, one row of words before '▸';
//   - one land per sha: no '· ✓ flake-roots landed …' line, the typed row once;
//   - the news rows are sans 13, 4 px apart (H1), never wrap; the landed row in text-2 with its sha
//     mono, not underlined (H5); the card's line is sans 14 in ink;
// and perf's own thread draws its wake as one news row. Frames: tiers-<theme>-<width>-{folded,open}.png
// and tiers-<theme>-wake.png. Owner: amb-win.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'shop-ab9f3c3b';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 9 * MIN, waits: 0, watching: [] });
const OUTPUT = Array.from({ length: 20 }, (_, i) => `test mcp::call_${String(i)} ... ${i % 7 === 3 ? 'FAILED' : 'ok'}`).join('\n');
const SHA = '2c24ce15aa9f0b3c';
const at = (m: number) => NOW - m * MIN;
const mainThread = [
  { pos: 1, at_ms: at(30), kind: 'you', text: 'why are the MCP errors so hard to read?' },
  { pos: 2, at_ms: at(29), kind: 'agent', text: 'Because a failed call only gives the model its exit code.\n\nI asked mcp-errors to pass the tool\'s own words through; flake-roots fixed the flaky test on the way.' },
  { pos: 3, at_ms: at(28), kind: 'tools', text: 'ran 1 command', tools: { count: 1, summary: 'ran 1 command', items: [{ pos: 3, at_ms: at(28), text: 'cargo test -p mcp', kind: 'run', state: 'ok', ms: 4100 }] } },
  { pos: 4, at_ms: at(27), kind: 'to_agent', to: 'mcp-errors', text: `here is what the model sees today:\n${OUTPUT}` },
  { pos: 5, at_ms: at(26), kind: 'from_agent', from: 'mcp-errors', text: 'on it: the error words go into the tool result.' },
  { pos: 6, at_ms: at(25), kind: 'to_agent', to: 'mcp-errors', text: 'good, keep the exit code too.' },
  { pos: 7, at_ms: at(20), kind: 'notice', text: '✓ flake-roots landed 1 commit on main (2c24ce15) · pushed', notice: { level: 'info', text: '✓ flake-roots landed 1 commit on main (2c24ce15) · pushed' } },
  { pos: 8, at_ms: at(20), kind: 'landed', text: '1 file +12 −2', landed: { agent: 'flake-roots', target: 'main', from: 'sb/flake-roots', sha: SHA, files: 1, add: 12, del: 2 } },
  { pos: 9, at_ms: at(15), kind: 'pr', text: 'checks pass', pr: { number: 412, state: 'open', text: 'checks pass', url: 'https://github.com/acme/app/pull/412' } },
  { pos: 10, at_ms: at(10), kind: 'scheduled', text: 'scheduled #4 · 2 of 6 · check the build', scheduled: { id: 4, head: 'scheduled #4 · 2 of 6 · check the build' } },
  { pos: 11, at_ms: at(5), kind: 'card', text: 'merge mcp-errors into main?', card: { id: 1, agent: 'main', kind: 'question', question: 'merge mcp-errors into main?', options: ['merge', 'not yet'], answered: false } },
];
const perfThread = [
  { pos: 1, at_ms: at(12), kind: 'agent', text: 'I started the bench in the background; I wake when it ends.' },
  { pos: 2, at_ms: at(3), kind: 'wake', text: 'cargo test ended · rc 101 · after 3m10s', wake: { after_ms: 190000, ev: 'ended', id: 3, kind: 'bg', rc: 101, tail: ['test cart::total ... FAILED', 'test result: FAILED. 210 passed; 2 failed'], what: 'cargo test' } },
];
const CARD = { id: 1, project: P, kind: 'question', agent: 'main', question: 'merge mcp-errors into main?', options: ['merge', 'not yet'], urgent: false, since_ms: at(5) };
const world = (theme: string) => [
  prefs(theme),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 2, working: 0, waits: 1, running: true, cards: [CARD] },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'shop' },
  { ev: 'agents', project: P, agents: [ag('main'), ag('perf')] },
  { ev: 'thread', project: P, agent: 'main', entries: mainThread, before: null, more: false },
  { ev: 'thread', project: P, agent: 'perf', entries: perfThread, before: null, more: false },
];

const leftOf = async (page: Page, sel: string): Promise<number> => Math.round((await page.locator(sel).first().boundingBox())?.x ?? -1);

for (const theme of ['light', 'dark']) {
  test(`thread/tiers: the four tiers in main's thread, folded and open, and an agent's own wake (${theme})`, async () => {
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `project/${P}`, size: '1400x900' });
    try {
      const { page } = s;
      const run = page.getByTestId('thread.run.4');
      await expect(run, 'the run of 3 folds').toHaveText('▸ 3 messages between 2 agents', { timeout: 10_000 });
      for (const w of [1400, 1100, 800]) {
        await page.setViewportSize({ width: w, height: 900 });
        await page.waitForTimeout(250);
        const prose = await leftOf(page, '[data-testid="thread.entry.2"] .th-md p');
        expect(Math.abs((await leftOf(page, '[data-testid="thread.run.4"]')) - prose), `${String(w)}: the fold on the text column`).toBeLessThanOrEqual(1);
        await expect(page.getByTestId('thread.to.4'), 'folded: its messages are hidden').toHaveCount(0);
        // the fold row is a quiet row: sans, never mono (designer m_20621 (1))
        expect(await run.evaluate((el) => getComputedStyle(el).fontFamily), 'the fold row: sans').not.toMatch(/mono/i);
        // one land per sha, no stray '·' line
        await expect(page.getByTestId('thread.notice.7')).toHaveCount(0);
        await expect(page.getByTestId('thread.landed.8')).toHaveCount(1);
        // news: quiet rows, sans 13 (designer m_19832: mono only for the sha), one row
        for (const id of ['thread.landed.8', 'thread.pr.9']) {
          const n = await page.getByTestId(id).evaluate((el) => ({ font: getComputedStyle(el).fontFamily, size: getComputedStyle(el).fontSize, ws: getComputedStyle(el).whiteSpace, h: el.getBoundingClientRect().height, lh: parseFloat(getComputedStyle(el).lineHeight) }));
          expect(n.font, `${id}: sans`).not.toMatch(/mono/i);
          expect(n.size, `${id}: 13 px`).toBe('13px');
          expect(n.ws, `${id}: never wraps`).toBe('nowrap');
          expect(n.h, `${id}: one row`).toBeLessThan(n.lh * 1.6);
        }
        // H1: two quiet rows touch, 4 px apart (--gap-tight)
        const [landedBox, prBox] = await Promise.all(['thread.landed.8', 'thread.pr.9'].map((id) => page.getByTestId(id).boundingBox()));
        const between = Math.round((prBox?.y ?? 0) - ((landedBox?.y ?? 0) + (landedBox?.height ?? 0)));
        expect(between, `4 px between the landed and the PR rows (${String(between)})`).toBeGreaterThanOrEqual(2);
        expect(between, `4 px between the landed and the PR rows (${String(between)})`).toBeLessThanOrEqual(6);
        // H5: the landed row as quiet as a wake: no green mark, the sha mono and not underlined at rest
        const sha = await page.getByTestId('thread.landed.8.sha').evaluate((el) => ({ font: getComputedStyle(el.querySelector('.th-mono') ?? el).fontFamily, line: getComputedStyle(el).textDecorationLine }));
        expect(sha.font, 'the sha: mono').toMatch(/mono/i);
        expect(sha.line, 'the sha: no underline at rest').toBe('none');
        const marks = await page.evaluate(() => ['thread.landed.8', 'thread.pr.9'].map((id) => (() => { const el = document.querySelector(`[data-testid="${id}"]`); return el === null ? '' : getComputedStyle(el).color; })()));
        expect(marks[0], 'landed: text-2 like the PR row').toBe(marks[1]);
        // tier 1: the card's one line, sans 14 in ink
        const card = await page.getByTestId('thread.card.1').evaluate((el) => ({ size: getComputedStyle(el).fontSize, font: getComputedStyle(el).fontFamily }));
        expect(card.size).toBe('14px');
        expect(card.font).not.toMatch(/mono/i);
        await page.mouse.move(1, 400);
        await page.screenshot({ path: test.info().outputPath(`tiers-${theme}-${String(w)}-folded.png`) });

        // open: the notes are dim sans 13 (H4), the sender in ink, one row of words then '▸'
        await run.click();
        const note = page.getByTestId('thread.to.4');
        await expect(note).toBeVisible();
        // designer m_19912 (2): the first message 8 px under its fold row
        const under = await page.evaluate(() => {
          const f = document.querySelector('[data-testid="thread.run.4"]')?.getBoundingClientRect();
          const n = document.querySelector('[data-testid="thread.to.4"]')?.getBoundingClientRect();
          return f && n ? Math.round(n.top - f.bottom) : -1;
        });
        expect(under, `the first message 8 px under the open fold (${String(under)})`).toBeGreaterThanOrEqual(6);
        expect(under, `the first message 8 px under the open fold (${String(under)})`).toBeLessThanOrEqual(10);
        const look = await note.evaluate((el) => ({ font: getComputedStyle(el).fontFamily, color: getComputedStyle(el).color }));
        expect(look.font, 'a note between agents: its words sans').not.toMatch(/mono/i);
        const dim = await page.evaluate(() => {
          const p = document.createElement('span');
          p.style.color = 'var(--c-text-3)';
          document.body.appendChild(p);
          const c = getComputedStyle(p).color;
          p.remove();
          return c;
        });
        expect(look.color, 'in --c-text-3').toBe(dim);
        const text = page.getByTestId('thread.to.4.text');
        const rows = await text.evaluate((el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)));
        // designer's desktop-notices (a): two rows of its words, then '… ▸'
        expect(rows, 'two rows of its words').toBeLessThanOrEqual(2);
        await expect(page.getByTestId('thread.to.4.more')).toHaveText('… ▸');
        // '… ▸' ends the 2nd line, never a 3rd (designer m_20621 (2))
        const [tb, mb] = await Promise.all([text.boundingBox(), page.getByTestId('thread.to.4.more').boundingBox()]);
        expect((mb?.y ?? 0) + (mb?.height ?? 0), "'… ▸' inside the two lines").toBeLessThanOrEqual((tb?.y ?? 0) + (tb?.height ?? 0) + 0.5);
        expect(mb?.y ?? 0, "'… ▸' on the 2nd line").toBeGreaterThan((tb?.y ?? 0) + (tb?.height ?? 0) / 2 - 2);
        // (b) the chip: a 6% ink tint, r 6, 20 high, 8 px in
        const chipLook = await page.getByTestId('thread.to.4.chip').evaluate((el) => {
          const c = getComputedStyle(el);
          return { bg: c.backgroundColor, h: Math.round(el.getBoundingClientRect().height), r: c.borderTopLeftRadius, pad: c.paddingLeft };
        });
        expect(chipLook.bg, 'the chip is tinted').not.toBe('rgba(0, 0, 0, 0)');
        expect(chipLook.h, '20 high').toBe(20);
        expect(chipLook.r).toBe('6px');
        expect(chipLook.pad).toBe('8px');
        expect(Math.abs((await leftOf(page, '[data-testid="thread.to.4"]')) - prose), `${String(w)}: the notes on the text column`).toBeLessThanOrEqual(1);
        await page.mouse.move(1, 400);
        await page.screenshot({ path: test.info().outputPath(`tiers-${theme}-${String(w)}-open.png`) });
        await run.click();
        await expect(page.getByTestId('thread.to.4')).toHaveCount(0);
        // (c) ctrl+o opens every fold, the run of messages too, and closes them again
        await page.keyboard.press('Control+o');
        await expect(page.getByTestId('thread.to.4'), 'ctrl+o opens the run').toBeVisible();
        await page.keyboard.press('Control+o');
        await expect(page.getByTestId('thread.to.4'), 'ctrl+o again folds it').toHaveCount(0);
      }

      // perf's own thread: its wake is one news row
      await page.setViewportSize({ width: 1100, height: 900 });
      await page.getByTestId('app.right.agent.perf').click();
      await expect(page.getByTestId('thread.entry.2')).toBeVisible({ timeout: 10_000 });
      // its own wake is a quiet row: its words sans, mono only for the machine's text (designer m_19832)
      const wake = await page.getByTestId('thread.wake.2').evaluate((el) => getComputedStyle(el).fontFamily);
      expect(wake, 'its wake: sans').not.toMatch(/mono/i);
      // one state: the sidebar says the head chip's word (designer m_19784 (5))
      await expect(page.getByTestId('thread.head.state')).toHaveText('idle');
      await expect(page.getByTestId('app.right.agent.perf')).toContainText('idle');
      await page.mouse.move(1, 400);
      await page.screenshot({ path: test.info().outputPath(`tiers-${theme}-wake.png`) });
    } finally {
      await s.close();
    }
  });
}

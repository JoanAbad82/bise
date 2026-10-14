// thread/air · his try a43609b2 (main m_19354, ambient-lead m_19357): « more padding above the inbox
// box, the history text is too close to it; a slightly taller line-height for the history ».
// Designer's values (m_19359): 20 px from the thread's last row to what sits under it, carried by the
// list (the inbox box keeps margin-top 0, so it holds with no box too); prose at line-height 1.65 with
// 0.8em between paragraphs; the dim rows (tool lines, the live line, folds) at 1.5; 8 px between two
// dim rows, 12 px from prose to a dim row. Passes when, on FakeCore, at 1400 / 1100 / 800, light and
// dark, shop's main ends on a dim tool row:
//   - with a card waiting, the inbox box starts 20 px (±1) under the tool row's bottom;
//   - with no card, the composer's to-line starts 20 px (±1) under it;
//   - the answer's prose is at 1.65 × its font size, the tool line at 1.5 ×;
// Frames: air-<theme>-<width>-{box,nobox}.png. Owner: amb-win.
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
const CARD = { id: 1, project: P, kind: 'question', agent: 'main', question: 'try the new cart page on the real data now?', options: ['yes', 'not yet'], urgent: false, since_ms: NOW - 3 * MIN };
const ANSWER = [
  'The cart totals drift at night because the batch size is shared between the two workers, so a slow host holds the others back.',
  'I moved the batch size into each worker and reran the nightly replay: the totals now match to the cent on the last three nights.',
].join('\n\n');
const world = (theme: string, card: boolean) => [
  prefs(theme),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 1, working: 0, waits: card ? 1 : 0, running: true, ...(card ? { cards: [CARD] } : {}) },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'shop' },
  { ev: 'agents', project: P, agents: [ag('main')] },
  {
    ev: 'thread',
    project: P,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: NOW - 8 * MIN, kind: 'you', text: 'why do the cart totals drift at night?' },
      { pos: 2, at_ms: NOW - 6 * MIN, kind: 'agent', text: ANSWER },
      { pos: 3, at_ms: NOW - 5 * MIN, kind: 'tools', text: 'ran 1 command', tools: { count: 1, summary: 'ran 1 command', items: [{ pos: 3, at_ms: NOW - 5 * MIN, text: 'pnpm replay --nights 3', kind: 'run', state: 'ok', ms: 6000 }] } },
    ],
    before: null,
    more: false,
  },
];

for (const theme of ['light', 'dark']) {
  for (const card of [true, false]) {
    test(`thread/air: 20 px under the last row, prose at 1.65, dim rows at 1.5 (${theme}, ${card ? 'inbox box' : 'no box'})`, async () => {
      const core = new FakeCore(world(theme, card) as unknown as ConstructorParameters<typeof FakeCore>[0]);
      const s = await launchDesktop({ core, route: `project/${P}`, size: '1400x800' });
      try {
        const { page } = s;
        const tool = page.getByTestId('thread.entry.3');
        await expect(tool).toBeVisible({ timeout: 10_000 });
        for (const w of [1400, 1100, 800]) {
          await page.setViewportSize({ width: w, height: 800 });
          await page.waitForTimeout(250);
          // what sits under the last row: the inbox box, else the composer's to-line ('to main')
          const under = card ? page.getByTestId('inbox.block') : page.locator('.th-screen [data-testid="composer.tab"]').first();
          await expect(under).toBeVisible();
          const line = tool.locator('.th-tool-line').last();
          const lb = await line.boundingBox();
          const label = await under.boundingBox();
          const gap = (label?.y ?? 0) - ((lb?.y ?? 0) + (lb?.height ?? 0));
          expect(gap, `${String(w)}: room under the last row`).toBeGreaterThanOrEqual(19);
          expect(gap, `${String(w)}: room under the last row`).toBeLessThanOrEqual(21);
          const lh = await page.getByTestId('thread.entry.2').locator('.th-md p').first().evaluate((p) => {
            const c = getComputedStyle(p);
            return parseFloat(c.lineHeight) / parseFloat(c.fontSize);
          });
          expect(lh, 'prose at 1.65').toBeCloseTo(1.65, 2);
          const tl = await line.evaluate((el) => {
            const c = getComputedStyle(el);
            return parseFloat(c.lineHeight) / parseFloat(c.fontSize);
          });
          expect(tl, 'the dim row at 1.5').toBeCloseTo(1.5, 2);
          await page.mouse.move(1, 300);
          await page.screenshot({ path: test.info().outputPath(`air-${theme}-${String(w)}-${card ? 'box' : 'nobox'}.png`) });
        }
      } finally {
        await s.close();
      }
    });
  }
}

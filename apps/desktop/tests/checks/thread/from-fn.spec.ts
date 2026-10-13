// thread/from-fn · his words typed with fn space (ambient-lead m_22706, designer m_22709/m_22714):
// the hub's capsule line for the model ('[from the capsule: answer in one short line]') rides as a
// hidden hint part and never shows in his bubble; 'from fn' is first on its meta row (text-3, no
// accent, tooltip 'sent with fn, from another app'), the time after it on hover. A plain message
// has no mark; the word 'capsule' is never on screen. Light and dark at 1100. Owner: amb-feed.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'shop-ab9f3c3b';
const NOW = Date.now();
const MIN = 60_000;
const CAPSULE = '\n\n[from the capsule: answer in one short line]';
const START = '\n\n[from the capsule: start an agent; answer in one short line]';
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 9 * MIN, waits: 0 });
const fn = (words: string, hint: string, of: string) => ({ text: words + hint, parts: [{ kind: 'text', text: words }, { kind: 'hint', of, text: hint }] });
const world = (theme: string) => [
  prefs(theme),
  {
    ev: 'projects',
    projects: [
      { project: 'bise-home-00000000', name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'shop' },
  { ev: 'agents', project: P, agents: [ag('main')] },
  {
    ev: 'thread',
    project: P,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: NOW - 20 * MIN, kind: 'you', msg_id: 11, delivery: 'read', text: 'why is the checkout slow on fridays?' },
      { pos: 2, at_ms: NOW - 18 * MIN, kind: 'agent', text: 'the image pipeline ships 2 MB thumbnails to phones.' },
      { pos: 3, at_ms: NOW - 10 * MIN, kind: 'you', msg_id: 12, delivery: 'read', ...fn("what's running right now?", CAPSULE, 'capsule') },
      { pos: 4, at_ms: NOW - 9 * MIN, kind: 'agent', text: 'perf is on the thumbnails. nothing else.' },
      { pos: 5, at_ms: NOW - 3 * MIN, kind: 'you', msg_id: 13, delivery: 'read', ...fn('fix the login loop', START, 'capsule_start') },
      { pos: 6, at_ms: NOW - 2 * MIN, kind: 'agent', text: 'login-loop is on it.' },
    ],
    before: null,
    more: false,
  },
];

test("thread/from-fn: his fn message hides the capsule's line, 'from fn' first on its row", async () => {
  test.setTimeout(120_000);
  for (const theme of ['light', 'dark']) {
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x760' });
    try {
      const { page } = s;
      await expect(page.getByTestId('thread.you.5')).toBeVisible({ timeout: 10_000 });
      for (const pos of [3, 5]) {
        const you = page.getByTestId(`thread.you.${String(pos)}`);
        await expect(you, `${theme}: no capsule line in his bubble`).not.toContainText('[from the capsule');
        const via = page.getByTestId(`thread.you.${String(pos)}.via`);
        await expect(via).toHaveText('from fn');
        await expect(via).toHaveAttribute('title', 'sent with fn, from another app');
      }
      await expect(page.getByTestId('thread.you.1.via'), 'a plain message has no mark').toHaveCount(0);
      expect(await page.locator('.th-screen').innerText(), 'never the word capsule').not.toMatch(/capsule/iu);
      await page.screenshot({ path: test.info().outputPath(`from-fn-${theme}-1100.png`) });
      await page.getByTestId('thread.you.5').hover();
      await expect(page.getByTestId('thread.you.5.under')).toHaveText(/^from fn · \d\d:\d\d ✓✓$/u);
      await page.screenshot({ path: test.info().outputPath(`from-fn-${theme}-1100-hover.png`) });
    } finally {
      await s.close();
    }
  }
});

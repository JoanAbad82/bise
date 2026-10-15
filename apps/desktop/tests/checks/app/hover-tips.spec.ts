// app/hover-tips · designer's tip rule (m_24359, his 'every compact mark explains itself'): one ds tip
// for the window, never interactive. Storefront on FakeCore at 1400 px, light and dark. Passes when:
//   - hovering a mark shows its words after the delay: '1 new', 'scheduled 1', the inbox's pink
//     count; the right bar's sign, time, %, '↑'. A project row's working count '2' and pink count
//     carry their words ('2 agents working') but give way under the row's ⋯ on hover (a quiet
//     project has no end words);
//   - the tip never takes the pointer: pointer-events none, and elementFromPoint under it is the
//     page under it (a row, the screen), never the tip; it sits 8 px above or below its mark, never
//     over it, inside the window;
//   - from one mark to the next the tip moves at once (warm); it hides when the pointer leaves;
//   - keyboard focus on an icon button shows its words and key at once.
// Shots: hover-tips-<theme>-<mark>.png (designer's sign). Owner: amb-win.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: {
    onboarded: true,
    theme,
    context: { shot: true, url: true, file: true, window_text: false },
    excluded_apps: [],
    quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
    voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
    shots_keep_days: 7,
  },
});
const agent = (name: string, status: string, over: Record<string, unknown> = {}) => ({
  name,
  main: name === 'main',
  status,
  archived: false,
  title: '',
  purpose: `${name}'s job`,
  since_ms: NOW - 14 * MIN,
  waits: 0,
  watching: [],
  dir: name,
  ...over,
});
const use = (pct: number) => ({ usage: { model: 'm', context: pct * 2560, window: 256_000, words: '', short: `${String(pct)}%` } });
const pr = (number: number, over: Record<string, unknown> = {}) => ({
  number,
  url: `https://github.com/acme/shop/pull/${String(number)}`,
  branch: '',
  agents: [],
  state: 'open',
  checks: 'pass',
  review: 'none',
  words: 'checks pass',
  text: '',
  ...over,
});
const world = (theme: string) => [
  prefs(theme),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 1, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 4, working: 2, waits: 1, running: true },
      { project: 'docs-cff418c0', name: 'docs', path: '/nowhere/docs', git: true, home: false, order: 2, agents: 1, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  {
    ev: 'agents',
    project: P,
    agents: [
      agent('main', 'idle'),
      agent('perf', 'working', { purpose: 'product page speed', turn_ms: 6 * MIN, ...use(17) }),
      agent('search', 'idle', { waits: 1, purpose: 'size filter', ...use(40) }),
      agent('pay', 'working', { purpose: 'mobile safari', turn_ms: 2 * MIN, ...use(12) }),
    ],
    places: [
      { id: 'wt:sb/perf', branch: 'sb/perf', agents: ['perf'] },
      { id: 'wt:sb/checkout', branch: 'sb/checkout', agents: ['pay'], pr: pr(415, { branch: 'sb/checkout', checks: 'fail', failing: ['e2e/login'], words: 'checks fail: e2e/login' }) },
    ],
  },
  { ev: 'scheduled', project: P, items: [{ id: 4, agent: 'perf', by: 'main', words: 'check the deploy', every: '10m', times: 24, done: 6, next_ms: NOW + 20 * MIN }] },
  {
    ev: 'artifacts',
    project: P,
    items: [{ id: 'product-page', kind: 'page', title: 'product page, before / after', agent: 'perf', version: 2, at_ms: NOW - 5 * MIN, url: 'http://127.0.0.1:1/p/x', new: true }],
  },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'found it: the hero image ships at 2.4 MB.' }], before: null, more: false },
];

/** The tip's box, its mark's, and what the page has under the tip's centre (elementFromPoint). */
async function under(page: Page, markId: string) {
  return page.evaluate((id) => {
    const tip = document.querySelector<HTMLElement>('[data-testid="tip"]');
    const mark = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    if (tip === null || mark === null) return null;
    const t = tip.getBoundingClientRect();
    const m = mark.getBoundingClientRect();
    const hit = document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2);
    return {
      pe: getComputedStyle(tip).pointerEvents,
      inTip: hit !== null && tip.contains(hit),
      hit: hit === null ? '' : (hit.closest('[data-testid]')?.getAttribute('data-testid') ?? hit.tagName),
      gap: t.bottom <= m.top ? Math.round(m.top - t.bottom) : Math.round(t.top - m.bottom),
      inside: t.left >= 0 && t.top >= 0 && t.right <= window.innerWidth && t.bottom <= window.innerHeight,
    };
  }, markId);
}

for (const theme of ['light', 'dark']) {
  test(`app/hover-tips: every compact mark explains itself, the tip never takes the pointer (${theme})`, async () => {
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1400x860' });
    try {
      const { page } = s;
      const tip = page.getByTestId('tip');
      await expect(page.getByTestId('app.right.agent.perf')).toBeVisible({ timeout: 10_000 });
      const shot = (name: string) => page.screenshot({ path: test.info().outputPath(`hover-tips-${theme}-${name}.png`) });
      const hover = async (id: string, words: string, name: string) => {
        await page.getByTestId(id).hover();
        await expect(tip, `${id}: its words`).toHaveText(words);
        const u = await under(page, id);
        expect(u?.pe, `${id}: the tip never takes the pointer`).toBe('none');
        expect(u?.inTip, `${id}: elementFromPoint under the tip is the page, not the tip`).toBe(false);
        expect(u?.gap, `${id}: 8 px from its mark, never over it`).toBe(8);
        expect(u?.inside, `${id}: inside the window`).toBe(true);
        await shot(name);
      };

      // cold: the delay, then the tip; leave: gone
      await page.mouse.move(700, 500);
      await page.getByTestId('app.sidebar.scheduled.end').hover();
      await page.waitForTimeout(150);
      await expect(tip, 'not before the delay').toHaveCount(0);
      await expect(tip).toHaveText('1 scheduled task, in all your projects');
      await page.mouse.move(700, 500);
      await expect(tip, 'gone when the pointer leaves').toHaveCount(0);

      // the sidebar's marks. A project row's end words give way under its ⋯ on hover (Benjamin's
      // ⋯ flush right, designer m_26343: the mark's tip says who works and who waits): their tips
      // stay on them, read as attributes
      await expect(page.getByTestId(`app.sidebar.project.${P}.end`)).toHaveAttribute('data-tip', '2 agents working');
      await expect(page.getByTestId(`app.sidebar.project.${P}.count`)).toHaveAttribute('data-tip', '1 waiting for you');
      await expect(page.getByTestId('app.sidebar.project.docs-cff418c0.end'), 'quiet: no end words (its mark says it)').toHaveCount(0);
      // the pink count is the inbox row's (inbox-history pick A)
      await hover('app.sidebar.inbox.count', '2 waiting for you, in all your projects', 'sidebar-inbox');
      await hover('app.sidebar.artifacts.end', "1 artifact you haven't opened yet, from perf", 'sidebar-new');
      await hover('app.sidebar.scheduled.end', '1 scheduled task, in all your projects', 'sidebar-scheduled');

      // the right bar's marks
      // under 70 % the % is in the sign's tip, its column empty (desktop-delight v2)
      await hover('app.right.agent.perf.sign', "∿ perf is working · 17% of perf's context used: 44k of 256k", 'right-sign');
      await hover('app.right.agent.perf.time', 'working for 6 min on this turn', 'right-time');
      await hover('app.right.agent.search.sign', "? search waits for you · 40% of search's context used: 102k of 256k", 'right-asks');
      await hover('app.right.agent.pay.mark', '#415 · checks fail: e2e/login · ψ worktree on sb/checkout · click opens the PR', 'right-pr');

      // warm: the next mark at once, no blink
      await page.getByTestId('app.right.agent.perf.time').hover();
      await expect(tip).toHaveText('working for 6 min on this turn');
      await page.getByTestId('app.right.agent.perf.sign').hover();
      await expect(tip).toHaveText(/^∿ perf is working/u, { timeout: 100 });

      // the pointer over the tip: the row under it still gets it (hover tint, the click)
      const box = await tip.boundingBox();
      if (box !== null) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await expect(tip, 'crossing the tip hides it (the page under it is hovered)').toHaveCount(0);

      // keyboard focus on an icon button: its words and key at once
      await page.mouse.move(700, 500);
      await page.keyboard.press('Shift');
      await page.getByTestId('app.title.panel').focus();
      await expect(tip).toContainText('right bar');
      await shot('focus');
      await page.keyboard.press('Escape');
    } finally {
      await s.close();
    }
  });
}

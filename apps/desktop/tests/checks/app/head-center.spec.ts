// app/head-center · a section head's text sits in the middle of its hover box (his m_22731 via
// ambient-lead m_22732: 'ARCHIVED · 533 ▾' sat at the top of its box, more room below than above).
// The REAL right bar on the scripted core, at 1100, light and dark. Owner: amb-win. Passes when,
// on each head (agents, archived, artifacts, scheduled & waiting), hovered: the gap from the box's
// top to the label's text equals the gap from the text to the box's bottom (± 0.5 px), the box is
// 28 px, and 'all ›' and a folded head's summary share the label's line. Shots for designer: the
// archived head hovered, light and dark.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const agent = (name: string, status: string, over: Record<string, unknown> = {}) => ({
  name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [], ...over,
});
const world = (theme: string) => [
  prefs(theme),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 5, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  {
    ev: 'agents',
    project: P,
    agents: [
      agent('main', 'idle'),
      agent('perf', 'working'),
      agent('search', 'idle'),
      agent('hero-img', 'done', { archived: true, since_ms: NOW - 2 * 60 * MIN }),
      agent('old-search', 'idle', { archived: true, since_ms: NOW - 2 * 24 * 60 * MIN }),
    ],
  },
  { ev: 'agents', project: HOME, agents: [agent('main', 'idle')] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'perf cut the hero image to 180 KB.' }], before: null, more: false },
  { ev: 'scheduled', project: P, items: [{ id: 4, name: 'nightly replay', agent: 'perf', by: 'main', words: 'replay the night traffic', every: 'day 02:00', done: 3, next_ms: NOW + 6 * 60 * MIN }] },
  { ev: 'artifacts', project: P, items: [{ id: 'product-page', kind: 'page', title: 'product page, before / after', agent: 'perf', version: 2, at_ms: NOW - 5 * MIN, url: 'http://127.0.0.1:1/p/x', new: true }] },
];

for (const theme of ['light', 'dark']) {
  test(`app/head-center: each right bar head's text in the middle of its hover box (${theme})`, async () => {
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x720' });
    try {
      const { page } = s;
      await expect(page.getByTestId('app.right.agent.perf')).toBeVisible({ timeout: 10_000 });
      for (const id of ['agents', 'archived', 'artifacts', 'scheduled']) {
        const head = page.getByTestId(`app.right.${id}.head`);
        await expect(head, `the ${id} head`).toBeVisible();
        await head.hover();
        await page.waitForTimeout(80);
        const m = await head.evaluate((el) => {
          const box = el.closest('.app-rb-head')?.getBoundingClientRect();
          const label = el.querySelector('.app-rb-label');
          // the eye reads the caps' ink ('ARCHIVED · 533'): from the cap height down to the baseline,
          // not the font's content box (its descent makes an odd 13 px in 28, a 7/8 split by itself)
          const mark = document.createElement('span');
          mark.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
          label?.appendChild(mark);
          const base = mark.getBoundingClientRect().bottom;
          mark.remove();
          const ctx = document.createElement('canvas').getContext('2d');
          if (ctx && label) ctx.font = getComputedStyle(label).font;
          const cap = ctx?.measureText('H').actualBoundingBoxAscent ?? 0;
          const t = { top: base - cap, bottom: base };
          const all = el.closest('.app-rb-head')?.querySelector('.b-act');
          const a = all ? document.createRange() : null;
          if (a && all?.firstChild) a.selectNodeContents(all.firstChild);
          const at = a?.getBoundingClientRect();
          return { h: box?.height ?? 0, top: t.top - (box?.top ?? 0), bottom: (box?.bottom ?? 0) - t.bottom, allMid: at ? (at.top + at.bottom) / 2 - (t.top + t.bottom) / 2 : 0 };
        });
        expect(Math.round(m.h), `${id}: the hover box is 28 px`).toBe(28);
        expect(Math.abs(m.top - m.bottom), `${id}: text centred (top ${m.top.toFixed(1)}, bottom ${m.bottom.toFixed(1)})`).toBeLessThanOrEqual(0.5);
        expect(Math.abs(m.allMid), `${id}: 'all ›' on the label's line`).toBeLessThanOrEqual(1.5);
        if (id === 'archived') await page.screenshot({ path: test.info().outputPath(`head-archived-${theme}.png`) });
      }
    } finally {
      await s.close();
      core.dispose();
    }
  });
}

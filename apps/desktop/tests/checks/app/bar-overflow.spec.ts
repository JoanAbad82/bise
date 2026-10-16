// app/bar-overflow · his bug (main m_26731/m_26733): a scrollbar on the right bar, on designer's
// thread; 'nothing wakes designer' (SCHEDULED & WATCHING's line at 0 rows) ran 16 px past the bar,
// so the body scrolled sideways and the focused row's ring ran off its left edge. FakeCore:
// storefront with 17 live agents (long names, long now lines, rings, worktree marks, a shared
// worktree), 69 artifacts with long titles, a timer; the bar on the project, on an agent with
// artifacts and nothing that wakes it, on one that made nothing and nothing wakes. Passes when, at
// 1400, 1100 and 800 (slid over), light and dark, at rest, a row focused from the keyboard, a long
// row hovered (its now line slides), ⌥ held (every ring shows):
//   - the bar's body never scrolls sideways (scrollWidth <= clientWidth), and scrolls down no
//     further than its last section (no vertical scrollbar while they all fit: the project's case);
//   - every box in it stays inside the body's width, the focused row's ring too (never clipped),
//     and no box's own words run past it.
// Shots: bar-overflow-<theme>-<size>-<where>.png. Owner: bar-overflow.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import type { Page } from '@playwright/test';
import { panel } from '../../../src/proto/words_panel.gen';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const LONG = 'gab-office-docs-pitch-deck-and-the-board-memo';
const QUIET = 'designer-of-the-whole-launch-film';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const use = (pct: number) => ({ usage: { model: 'm', context: pct * 1000, window: 100_000, words: '', short: `${String(pct)}%` } });
const agent = (name: string, status: string, over: Record<string, unknown> = {}) => ({
  name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [], ...over,
});
const pr = (n: number, branch: string) => ({ number: n, url: `https://github.com/acme/shop/pull/${String(n)}`, title: `pr ${String(n)}`, state: 'open', branch, base: 'main', checks: 'pass', failing: [], review: 'none', words: panel.pr_checks_pass });
const NAMES = [LONG, QUIET, 'architect', 'debt-t5', 'debt-t9', 'dmg-benjamin', 'try-gate-c2ba', 'dist-plan', 'landing-shots', 'plan-ok', 'notif-artifact', 'electron-fuses', 'inbox-open', 'thread-perf', 'projmenu-flake', 'desk-cut-4', 'bar-overflow'];
const NOW_LINE = 'holding the notif-artifact pick until the architect answers on the seam between the hub and the app';
const live = NAMES.map((n, i) => agent(n, i % 3 === 0 ? 'working' : i % 3 === 1 ? 'idle' : 'done', { purpose: NOW_LINE, title: NOW_LINE, ...(i % 3 === 0 ? { turn_ms: (i + 1) * MIN } : {}), ...use(i % 2 === 0 ? 85 : 30) }));
const ARTS = Array.from({ length: 69 }, (_, i) => ({
  id: `a${String(i)}`,
  kind: i % 4 === 0 ? 'page' : 'file',
  title: `${i % 2 === 0 ? 'a notification and its page, with every state he asked for' : 'whereDoesMyAnswerGo-the-long-file-name-with-no-spaces'} ${String(i)}`,
  // QUIET made nothing: its scoped heads show their 0-row lines
  agent: i < 40 ? LONG : NAMES[2 + (i % (NAMES.length - 2))],
  version: 1,
  at_ms: NOW - i * MIN,
  url: `http://127.0.0.1:1/p/${String(i)}`,
  new: i < 10,
}));
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'harness-of-the-storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 18, working: 6, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'harness-of-the-storefront' },
  {
    ev: 'agents',
    project: P,
    agents: [main(), ...live, ...['hero-img', 'old-cart', 'nav-fix'].map((n, i) => agent(n, 'done', { archived: true, since_ms: NOW - (i + 2) * 60 * MIN }))],
    places: [
      { id: 'wt:sb/debt-t5', branch: 'sb/debt-t5', agents: ['debt-t5'], path: '/tmp/wt/debt-t5/shop' },
      { id: 'wt:sb/debt-t9', branch: 'sb/debt-t9', agents: ['debt-t9'], pr: pr(416, 'sb/debt-t9') },
      { id: `wt:sb/${LONG}`, branch: `sb/${LONG}`, agents: [LONG], pr: pr(417, `sb/${LONG}`) },
      { id: 'wt:sb/a-very-long-shared-branch-name-for-the-flash-sale', branch: 'sb/a-very-long-shared-branch-name-for-the-flash-sale', agents: ['plan-ok', 'notif-artifact'], pr: pr(418, 'sb/flash-sale') },
    ],
  },
  { ev: 'agents', project: HOME, agents: [main()] },
  ...['main', LONG, QUIET].map((a) => ({ ev: 'thread', project: P, agent: a, entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'on it.' }], before: null, more: false })),
  { ev: 'scheduled', project: P, items: [{ id: 4, name: 'nightly replay of the whole sale', agent: 'architect', by: 'main', words: 'replay', every: 'day 02:00', done: 3, next_ms: NOW + 6 * 60 * MIN }] },
  { ev: 'artifacts', project: P, items: ARTS },
];
function main() {
  return agent('main', 'idle');
}

type Over = { what: string; l: number; r: number };
/** the body's sideways and downward overflow, and every box (the focused one's ring included) past its width */
const measure = (page: Page) =>
  page.getByTestId('app.panel').evaluate((panel) => {
    const body = panel.querySelector('.app-rb-body') as HTMLElement;
    const b = body.getBoundingClientRect();
    const out: Over[] = [];
    for (const el of Array.from(body.querySelectorAll<HTMLElement>('*'))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      // a hidden box (a quiet ring) still makes the body scroll: it counts
      const st = getComputedStyle(el);
      // a box inside one that clips (the now line's slide, a cut chip) is its parent's room, not the bar's
      let clip = el.parentElement;
      let clipped = false;
      while (clip !== null && clip !== body) {
        if (getComputedStyle(clip).overflowX !== 'visible') {
          clipped = true;
          break;
        }
        clip = clip.parentElement;
      }
      if (clipped) continue;
      // its own words running past it (nowrap text, no '…') make the body scroll too
      if (st.overflowX === 'visible' && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) out.push({ what: `${el.getAttribute('data-testid') ?? el.className} (its words)`, l: 0, r: el.scrollWidth - el.clientWidth });
      // a line of words cut at its edge ends in '…' (designer m_26764: 'made nothing yet' lost 'yet'
      // with none): text-overflow only draws on a block, never on a flex row's bare text
      const words = Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '');
      if (words && st.overflowX !== 'visible' && el.scrollWidth > el.clientWidth + 1 && (st.textOverflow !== 'ellipsis' || /flex|grid/u.test(st.display))) out.push({ what: `${el.getAttribute('data-testid') ?? el.className} (cut with no '…')`, l: 0, r: el.scrollWidth - el.clientWidth });
      const ring = el === document.activeElement && st.outlineStyle !== 'none' ? Number.parseFloat(st.outlineWidth) + Number.parseFloat(st.outlineOffset) : 0;
      const l = r.left - ring;
      const rr = r.right + ring;
      if (l < b.left - 0.5 || rr > b.right + 0.5) out.push({ what: `${el.getAttribute('data-testid') ?? el.className}${ring > 0 ? ' (its ring)' : ''}`, l: l - b.left, r: rr - b.right });
    }
    // how tall its sections are, with the body's padding: what it scrolls down to, never more
    const last = Math.max(...Array.from(body.children).map((c) => c.getBoundingClientRect().bottom));
    const tall = last - b.top + body.scrollTop + Number.parseFloat(getComputedStyle(body).paddingBottom);
    return { sw: body.scrollWidth, cw: body.clientWidth, sh: body.scrollHeight, ch: body.clientHeight, tall: Math.ceil(tall), sl: body.scrollLeft, out: out.slice(0, 8) };
  });

async function noOverflow(page: Page, at: string, where: string) {
  const m = await measure(page);
  expect(m.out, `${at}: every box inside the bar's width`).toEqual([]);
  expect(m.sw, `${at}: no sideways scroll (scrollWidth ${String(m.sw)} > clientWidth ${String(m.cw)})`).toBeLessThanOrEqual(m.cw);
  expect(m.sl, `${at}: never scrolled sideways`).toBe(0);
  // (a body taller than its sections has scrollHeight = clientHeight: no scrollbar)
  expect(m.sh, `${at}: it scrolls down to its last section, nothing hidden below`).toBeLessThanOrEqual(Math.max(m.ch, m.tall));
  if (where === 'project') expect(m.sh, `${at}: its sections fit, no vertical scrollbar`).toBeLessThanOrEqual(m.ch);
}

const WHERE = [
  ['project', `project/${P}`, 'app.right.agents'],
  ['agent', `agent/${P}/${LONG}`, 'app.right.scheduled.none'],
  ['quiet', `agent/${P}/${QUIET}`, 'app.right.artifacts.none'],
] as const;

for (const size of ['1400x1000', '1100x1000', '800x1000']) {
  for (const [where, route, ready] of WHERE) {
    test(`app/bar-overflow: the right bar never overflows (${size}, ${where})`, async () => {
      const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
      const s = await launchDesktop({ core, route, size });
      try {
        const { page } = s;
        if (size.startsWith('800')) {
          await page.waitForTimeout(500);
          if (!(await page.getByTestId('app.panel').isVisible())) await page.keyboard.press('Alt+Meta+0');
        }
        await expect(page.getByTestId(ready)).toBeVisible({ timeout: 10_000 });
        const bar = await page.getByTestId('app.panel').boundingBox();
        for (const theme of ['light', 'dark']) {
          const at = `${theme} ${size} ${where}`;
          await core.send(prefs(theme) as never);
          await page.mouse.move(bar === null ? 1 : bar.x - 40, 300);
          await page.waitForTimeout(200);
          await noOverflow(page, `${at} at rest`, where);
          await page.screenshot({ path: test.info().outputPath(`bar-overflow-${theme}-${size}-${where}.png`), clip: bar ?? undefined });
          // the 0-row line, cut with its '…' (designer's crop)
          if (where !== 'project') await page.getByTestId(ready).locator('xpath=ancestor::section[1]').screenshot({ path: test.info().outputPath(`bar-overflow-${theme}-${size}-${where}-none.png`) });
          // a row focused from the keyboard: its ring inside the bar
          const first = page.getByTestId(`app.right.agent.${LONG}`);
          await first.focus();
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('ArrowUp');
          await noOverflow(page, `${at} a row focused`, where);
          await page.screenshot({ path: test.info().outputPath(`bar-overflow-${theme}-${size}-${where}-focus.png`), clip: bar ?? undefined });
          await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
          // a long row hovered: its now line slides inside its own room
          await page.getByTestId(`app.right.agent.${QUIET}`).hover();
          await page.waitForTimeout(900);
          await noOverflow(page, `${at} a row hovered`, where);
          // ⌥ held: every row's ring shows, in the room it keeps
          await page.mouse.move(bar === null ? 1 : bar.x - 40, 300);
          await page.keyboard.down('Alt');
          await page.waitForTimeout(700);
          await noOverflow(page, `${at} ⌥ held`, where);
          await page.keyboard.up('Alt');
        }
      } finally {
        await s.close();
        core.dispose();
      }
    });
  }
}

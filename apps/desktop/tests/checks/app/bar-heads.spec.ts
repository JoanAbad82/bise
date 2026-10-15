// app/bar-heads · his bug (main m_26417): on a sub-agent's thread 'SCHEDULED & WATCHING · 0  for
// gab-office-docs' ran under 'all ›'. The scope words now sit on a line of their own under the head.
// FakeCore: storefront, its sub-agent with a long name (an artifact, a timer, an alarm), 3 archived
// agents; the bar on that agent's thread. Passes when, at 1400, 1100 and 800, light and dark, for
// every head of the right bar (AGENTS, ARCHIVED, ARTIFACTS, SCHEDULED & WATCHING):
//   - its parts (the label, a folded summary, '+ add', 'all ›') never intersect and stay inside the head;
//   - the label's words that don't fit end in '…' (no text runs past its box);
//   - ARTIFACTS and SCHEDULED & WATCHING: the scope line ('by …' / 'for …') sits under the head, on
//     the rows' left edge (the label's), above the first row, inside the section, one 20 px line;
//     a name too long for it ends in '…'; its tip stays;
//   - then folded ARCHIVED and SCHEDULED (their summaries in the head): the same, and the folded
//     SCHEDULED has no scope line, its count's tip says 'N scheduled for …' (designer m_26425).
// Shots: bar-heads-<theme>-<size>.png, bar-heads-dark-<size>-folded.png (the right bar) for designer's sign. Owner: bar-heads.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import type { Page } from '@playwright/test';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const LONG = 'gab-office-docs-pitch-deck-and-the-board-memo';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const agent = (name: string, status: string, over: Record<string, unknown> = {}) => ({
  name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [], ...over,
});
const gate = { id: 7, kind: 'file', what: 'the deck export ends', noted: true, since_ms: NOW - 60 * MIN, until_ms: NOW + 10 * 60 * MIN };
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 3, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  {
    ev: 'agents',
    project: P,
    agents: [
      agent('main', 'idle'),
      agent(LONG, 'working', { watching: [gate] }),
      agent('search', 'idle'),
      ...['hero-img', 'old-cart', 'nav-fix'].map((n, i) => agent(n, 'done', { archived: true, since_ms: NOW - (i + 2) * 60 * MIN })),
    ],
  },
  { ev: 'agents', project: HOME, agents: [agent('main', 'idle')] },
  ...[
    [P, 'main', 'the deck is on its way.'],
    [P, LONG, 'pitch deck v1 is out, waiting for your notes.'],
  ].map(([project, a, text]) => ({ ev: 'thread', project, agent: a, entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text }], before: null, more: false })),
  { ev: 'scheduled', project: P, items: [{ id: 4, name: 'weekly deck refresh', agent: LONG, by: 'main', words: 'refresh the numbers', every: 'mon 09:00', done: 1, next_ms: NOW + 6 * 60 * MIN }] },
  {
    ev: 'artifacts',
    project: P,
    items: [
      { id: 'deck', kind: 'file', title: 'pitch deck v1', agent: LONG, version: 1, at_ms: NOW - 5 * MIN, url: 'http://127.0.0.1:1/p/x', new: true },
      { id: 'size-spec', kind: 'file', title: 'size filter spec', agent: 'search', version: 1, at_ms: NOW - 40 * MIN, url: 'http://127.0.0.1:1/p/y', new: false },
    ],
  },
];

type Box = { l: number; r: number; t: number; b: number };
/** a section's head parts and its scope line, in window px; whether a text runs past its box */
const read = (page: Page, sec: string) =>
  page.getByTestId(`app.right.${sec}`).evaluate((s) => {
    const box = (el: Element): Box => {
      const b = el.getBoundingClientRect();
      return { l: b.left, r: b.right, t: b.top, b: b.bottom };
    };
    const head = s.querySelector('.app-rb-head') as HTMLElement;
    const parts = [...Array.from(head.querySelectorAll('.app-rb-label, .app-rb-sum')), ...Array.from(head.children).filter((c) => !c.classList.contains('app-rb-title'))]
      .filter((el) => (el as HTMLElement).offsetWidth > 0)
      .map((el) => {
        const e = el as HTMLElement;
        const st = getComputedStyle(e);
        return { name: e.getAttribute('data-testid') ?? e.className, box: box(e), over: e.scrollWidth > e.clientWidth + 1, cut: st.textOverflow === 'ellipsis' && st.overflow === 'hidden' };
      });
    const sc = s.querySelector<HTMLElement>('.app-rb-scope');
    const label = head.querySelector('.app-rb-label') as HTMLElement;
    const row = s.querySelector('.app-rb-rows > *');
    return {
      sec: box(s),
      head: box(head),
      labelLeft: label.getBoundingClientRect().left,
      labelTip: label.getAttribute('data-tip') ?? '',
      parts,
      scope:
        sc === null
          ? null
          : { box: box(sc), text: sc.textContent, tip: sc.getAttribute('data-tip') ?? '', over: sc.scrollWidth > sc.clientWidth + 1, cut: getComputedStyle(sc).textOverflow === 'ellipsis', line: getComputedStyle(sc).lineHeight },
      row: row === null ? null : box(row),
    };
  });

const meets = (a: Box, b: Box) => a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5;

async function checkHeads(page: Page, at: string, folded: readonly string[] = []) {
  for (const sec of ['agents', 'archived', 'artifacts', 'scheduled']) {
    const w = `${at} ${sec}`;
    const h = await read(page, sec);
    for (const p of h.parts) {
      expect(p.box.l >= h.head.l - 0.5 && p.box.r <= h.head.r + 0.5, `${w}: ${p.name} inside the head`).toBe(true);
      if (p.over) expect(p.cut, `${w}: ${p.name} runs past its box: it ends in '…'`).toBe(true);
    }
    h.parts.forEach((a, i) => {
      for (const b of h.parts.slice(i + 1)) expect(meets(a.box, b.box), `${w}: ${a.name} and ${b.name} never meet`).toBe(false);
    });
    if (folded.includes(sec)) {
      // folded: one line, the scope line goes with the rows; the count's tip says the scope
      expect(h.scope, `${w}: folded, no scope line`).toBeNull();
      expect(h.labelTip, `${w}: folded, the count's tip says the scope`).toContain(`${sec === 'artifacts' ? 'by' : 'for'} ${LONG}`);
    } else if (sec === 'artifacts' || sec === 'scheduled') {
      const sc = h.scope;
      expect(sc, `${w}: the scope line`).not.toBeNull();
      if (sc === null) continue;
      expect(sc.text).toBe(`${sec === 'artifacts' ? 'by' : 'for'} ${LONG}`);
      expect(sc.tip).toContain(`only `);
      expect(sc.box.t, `${w}: the scope line under the head`).toBeGreaterThanOrEqual(h.head.b - 0.5);
      expect(Math.abs(sc.box.l + 8 - h.labelLeft), `${w}: on the label's left edge`).toBeLessThanOrEqual(1);
      expect(sc.box.r, `${w}: inside the section`).toBeLessThanOrEqual(h.sec.r + 0.5);
      expect(sc.box.b - sc.box.t, `${w}: one 20 px line`).toBe(20);
      if (sc.over) expect(sc.cut, `${w}: a long name ends in '…'`).toBe(true);
      for (const p of h.parts) expect(meets(sc.box, p.box), `${w}: the scope line and ${p.name} never meet`).toBe(false);
      if (h.row !== null) expect(h.row.t, `${w}: the first row under the scope line`).toBeGreaterThanOrEqual(sc.box.b - 0.5);
    }
  }
}

for (const size of ['1400x900', '1100x760', '800x640']) {
  test(`app/bar-heads: no head's part meets another, the scope words on their own line (${size})`, async () => {
    const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `agent/${P}/${LONG}`, size });
    try {
      const { page } = s;
      await expect(page.getByTestId('app.right.scheduled.scope')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('app.right.archived.head')).toHaveAttribute('aria-expanded', 'false');
      const bar = await page.getByTestId('app.panel').boundingBox();
      for (const theme of ['light', 'dark']) {
        await core.send(prefs(theme) as never);
        await page.mouse.move(1, 400);
        await page.waitForTimeout(200);
        await checkHeads(page, `${theme} ${size}`);
        await page.screenshot({ path: test.info().outputPath(`bar-heads-${theme}-${size}.png`), clip: bar ?? undefined });
      }
      // folded: the summaries join the heads (ARCHIVED is folded already; fold SCHEDULED & WATCHING)
      await page.getByTestId('app.right.scheduled.head').click();
      await expect(page.getByTestId('app.right.scheduled.summary')).toBeVisible();
      await checkHeads(page, `folded ${size}`, ['scheduled']);
      await page.mouse.move(1, 400);
      await page.screenshot({ path: test.info().outputPath(`bar-heads-dark-${size}-folded.png`), clip: bar ?? undefined });
      await page.getByTestId('app.right.scheduled.head').click();
    } finally {
      await s.close();
      core.dispose();
    }
  });
}

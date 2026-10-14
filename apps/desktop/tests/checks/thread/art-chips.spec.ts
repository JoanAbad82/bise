// thread/art-chips · designer's desktop-agents-bar §5 (art-chips): an artifact's name is pink for
// him and opens its view. Storefront on FakeCore, perf made 'product page, before / after'. Passes when:
//   - the thread's artifact row is the ds chip: '↗ <title>' in --c-accent on a 10 % accent tint,
//     24 px high, r 6, 8 px sides, kind and version the same pink at 70 %; hover raises the tint
//     (16 %), the pointer is a hand;
//   - an `artifact:` link in perf's answer, the note's page ('✓ you sent perf a note on <title>')
//     and an inbox line's artifact link are the same highlight inline, 4 px sides, a hand;
//   - a click on the answer's name opens the artifact view.
// Shots: art-chips-<theme>-1400/1100/800, for designer. Owner: art-chips.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import type { Locator, Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const TITLE = 'product page, before / after';
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const agent = (name: string, status: string) => ({ name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [] });
async function pagesServer(): Promise<{ url: string; server: Server }> {
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html><html><body><h1>${TITLE}</h1></body></html>`);
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`, server };
}
const world = (theme: string, pages: string) => [
  prefs(theme),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      {
        project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 2, working: 0, waits: 1, running: true,
        cards: [{ id: 1, project: P, kind: 'question', agent: 'perf', question: `keep the webp next to the avif in [${TITLE}](artifact:product-page)?`, options: [{ n: 1, label: 'yes' }, { n: 2, label: 'no' }], urgent: false, since_ms: NOW - 2 * MIN }],
      },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main', 'idle'), agent('perf', 'idle')] },
  { ev: 'agents', project: HOME, agents: [agent('main', 'idle')] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'perf made the product page for you.' }], before: null, more: false },
  {
    ev: 'thread',
    project: P,
    agent: 'perf',
    entries: [
      { pos: 1, at_ms: NOW - 6 * MIN, kind: 'you', text: 'make me a before / after page of the product page' },
      { pos: 2, at_ms: NOW - 5 * MIN, kind: 'agent', text: `found it: the hero image ships at 2.4 MB. the numbers are in [${TITLE}](artifact:product-page).` },
      { pos: 3, at_ms: NOW - 5 * MIN, kind: 'artifact', text: TITLE, made: { id: 'product-page', agent: 'perf', title: TITLE, kind: 'page', kind_word: 'page', v: 2 } },
      {
        pos: 4,
        at_ms: NOW - 4 * MIN,
        kind: 'you',
        text: 'you sent 1 note on your page',
        parts: [{ kind: 'page', text: 'you sent 1 note on your page', to: 'perf', page: 'product-page', title: TITLE, version: 2, notes: [{ block: 'p1', kind: 'note', text: 'say the paint time too', quote: 'before: 2.4 MB hero' }] }],
      },
    ],
    before: null,
    more: false,
  },
  {
    ev: 'artifacts',
    project: P,
    items: [{ id: 'product-page', kind: 'page', title: TITLE, agent: 'perf', version: 2, at_ms: NOW - 5 * MIN, url: `${pages}/p/product-page`, new: true }],
  },
];

const settle = (page: Page) => page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))).then(() => undefined));
/** The look the page asks for, as the browser computes it. */
const look = (l: Locator) =>
  l.evaluate((e) => {
    const c = getComputedStyle(e);
    const probe = document.createElement('i');
    probe.style.color = 'var(--c-accent)';
    document.body.append(probe);
    const accent = getComputedStyle(probe).color;
    probe.remove();
    return { color: c.color, accent, bg: c.backgroundColor, h: e.getBoundingClientRect().height, r: c.borderTopLeftRadius, pl: c.paddingLeft, pr: c.paddingRight, cursor: c.cursor };
  });
/** The alpha of a computed color (color-mix gives 'color(srgb r g b / a)'). */
const alpha = (c: string) => Number(/\/\s*([\d.]+)\)/u.exec(c)?.[1] ?? /rgba\([^)]*,\s*([\d.]+)\)/u.exec(c)?.[1] ?? '1');

for (const theme of ['light', 'dark']) {
  test(`thread/art-chips: an artifact's name is pink and opens its view, chip and inline (${theme})`, async () => {
    const pages = await pagesServer();
    const core = new FakeCore(world(theme, pages.url) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1400x900' });
    try {
      const { page } = s;
      await page.setViewportSize({ width: 1400, height: 900 });
      // the chip: '↗ title', 'page · v2', 24 px, r 6, 8 px sides, pink on its tint
      const chip = page.getByTestId('thread.artifact.3');
      await expect(chip).toBeVisible({ timeout: 10_000 });
      await expect(chip).toHaveClass(/b-artchip/u);
      await expect(chip.locator('.b-artchip-title')).toHaveText(`↗ ${TITLE}`);
      await expect(chip.locator('.b-artchip-meta')).toHaveText('page · v2');
      await page.mouse.move(1, 400);
      const c = await look(chip);
      expect(c.color, 'the title in --c-accent').toBe(c.accent);
      expect(c.h, '24 px high').toBe(24);
      expect(c.r, 'r 6').toBe('6px');
      expect([c.pl, c.pr], '8 px sides').toEqual(['8px', '8px']);
      expect(c.cursor, 'a hand').toBe('pointer');
      expect(alpha(c.bg), 'a 10 % tint').toBeCloseTo(0.1, 2);
      const meta = await look(chip.locator('.b-artchip-meta'));
      expect(alpha(meta.color), 'kind and version at 70 %').toBeCloseTo(0.7, 2);
      await chip.hover();
      expect(alpha((await look(chip)).bg), 'hover: 16 %').toBeCloseTo(0.16, 2);
      // inline: the answer's link, the note's page, the inbox line's link; 4 px sides, a hand
      const inline = {
        answer: page.getByTestId('thread.artname'),
        note: page.getByTestId('thread.pageanswer.4.page'),
        inbox: page.locator('[data-testid="inbox.block"] .b-artname').first(),
      };
      await expect(page.getByTestId('thread.pageanswer.4')).toContainText(`you sent perf a note on ${TITLE}`);
      for (const [where, l] of Object.entries(inline)) {
        await expect(l, `${where}: the name`).toHaveText(TITLE);
        await page.mouse.move(1, 400);
        const n = await look(l);
        expect(n.color, `${where}: pink`).toBe(n.accent);
        expect([n.pl, n.pr], `${where}: 4 px sides`).toEqual(['4px', '4px']);
        expect(n.cursor, `${where}: a hand`).toBe('pointer');
        expect(alpha(n.bg), `${where}: a 10 % tint`).toBeCloseTo(0.1, 2);
        await l.hover();
        expect(alpha((await look(l)).bg), `${where}: hover 16 %`).toBeCloseTo(0.16, 2);
      }
      for (const w of [1400, 1100, 800]) {
        await page.setViewportSize({ width: w, height: 900 });
        await page.mouse.move(1, 400);
        await settle(page);
        await page.screenshot({ path: test.info().outputPath(`art-chips-${theme}-${String(w)}.png`) });
      }
      // a click on the answer's name: the artifact's view
      await page.setViewportSize({ width: 1400, height: 900 });
      await inline.answer.click();
      await expect(page.getByTestId('app.art')).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('artifact.title')).toHaveText(TITLE);
    } finally {
      await s.close();
      core.dispose();
      pages.server.close();
    }
  });
}

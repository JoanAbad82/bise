// app/sidebar-more · a project row's ⋯ sits flush at the row's right end on hover and on focus
// (Benjamin's feedback, Gabriel's 👍: it floated left of the end box, "horizontally centered").
// Passes when, at 1400, 1100 and 800, light and dark: at rest the ⋯ is hidden and the row ends with
// its working count and pink count 8 px from its right edge; on hover, and on focus with the keys,
// the ⋯ shows with its right edge on the row's right padding (8 px), the end words and count give
// way under it, and the mark, the name and the end box keep their place to the pixel; a quiet row
// (no end words) is the same. Shots: more-<theme>-<size>{,-focus,-quiet}.png (a busy row hovered,
// focused, a quiet row hovered) for designer's sign (his go: m_26343). The scripted core
// (FakeCore). Owner: sidebar-more-right.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import type { Page } from '@playwright/test';

const P = 'acme-1a2b3c4d';
const TS = 'tspat-0a0b0c0d';
const DOCS = 'docs-cff418c0';
const NOW = Date.now();
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const agent = (name: string, status: string, waits = 0) => ({ name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 120_000, waits });
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: 'bise-home-00000000', name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 4, working: 3, waits: 0, running: true },
      { project: TS, name: 'ts-pattern', path: '/nowhere/ts-pattern', git: true, home: false, order: 2, agents: 3, working: 2, waits: 1, running: true },
      { project: DOCS, name: 'docs-site', path: '/nowhere/docs-site', git: true, home: false, order: 3, agents: 0, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main', 'idle'), agent('perf', 'working'), agent('search', 'working'), agent('docs', 'working')] },
  { ev: 'agents', project: TS, agents: [agent('main', 'idle'), agent('types', 'working'), agent('dx', 'working'), agent('ask', 'blocked', 1)] },
];

/** the row's parts, in px from the row's right edge, and whether the ⋯ and the end box show */
const look = (page: Page, project: string) =>
  page.getByTestId(`app.sidebar.project.${project}`).evaluate((row) => {
    const r = row.getBoundingClientRect();
    const box = (sel: string) => {
      const el = row.querySelector(sel);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { left: Math.round(b.left - r.left), right: Math.round(r.right - b.right), top: Math.round(b.top - r.top), bottom: Math.round(r.bottom - b.bottom) };
    };
    const more = row.querySelector('.app-more') as HTMLElement;
    const tail = row.querySelector('.app-tail') as HTMLElement;
    return {
      more: box('.app-more button'),
      shown: getComputedStyle(more).opacity === '1',
      tailShown: getComputedStyle(tail).visibility === 'visible',
      mark: box('.app-g'),
      name: box('.nm'),
      tail: box('.app-tail'),
      end: box('[data-testid$=".end"]'),
      count: box('.app-cnt'),
    };
  });

for (const size of ['1400x860', '1100x760', '800x640']) {
  test(`app/sidebar-more: the ⋯ is flush right on hover and focus, nothing moves (${size})`, async () => {
    const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `agent/${P}/perf`, size });
    try {
      const { page } = s;
      await expect(page.getByTestId(`app.sidebar.project.${TS}`)).toBeVisible({ timeout: 10_000 });
      const side = await page.getByTestId('app.sidebar').boundingBox();
      const clip = side ? { x: side.x, y: side.y, width: side.width, height: Math.min(side.height, 320) } : undefined;

      for (const theme of ['light', 'dark']) {
        await core.send(prefs(theme) as never);
        await page.mouse.move(side ? side.x + side.width + 300 : 900, 500);
        await page.waitForTimeout(200);

        for (const p of [P, TS, DOCS]) {
          const at = `${theme} ${size} ${p}`;
          const rest = await look(page, p);
          expect(rest.shown, `${at}: hidden at rest`).toBe(false);
          if (p !== DOCS) {
            expect(rest.tailShown, `${at}: its end words at rest`).toBe(true);
            expect(p === TS ? rest.count?.right : rest.end?.right, `${at}: the row ends with its count, 8 px in`).toBe(8);
          }

          // hover: flush right, the end words give way, nothing moves
          await page.getByTestId(`app.sidebar.project.${p}`).hover({ position: { x: 40, y: 10 } });
          await expect.poll(async () => (await look(page, p)).shown, `${at}: shows on hover`).toBe(true);
          const hover = await look(page, p);
          expect(hover.more?.right, `${at}: hover, the ⋯'s right on the row's 8 px side`).toBe(8);
          expect(Math.abs((hover.more?.top ?? 0) - (hover.more?.bottom ?? 99)), `${at}: centred in the row's height`).toBeLessThanOrEqual(1);
          expect(hover.tailShown, `${at}: the end words give way under it`).toBe(false);
          expect([hover.mark, hover.name, hover.tail], `${at}: mark, name, end box in place`).toEqual([rest.mark, rest.name, rest.tail]);
          if (p === TS) await page.screenshot({ path: test.info().outputPath(`more-${theme}-${size}.png`), clip });
          if (p === DOCS) await page.screenshot({ path: test.info().outputPath(`more-${theme}-${size}-quiet.png`), clip });

          // focus with the keys (pointer away): the same place
          await page.mouse.move(side ? side.x + side.width + 300 : 900, 500);
          await page.getByTestId(`app.sidebar.project.${p}.menu`).focus();
          await expect.poll(async () => (await look(page, p)).shown, `${at}: shows on focus`).toBe(true);
          const focus = await look(page, p);
          expect(focus.more, `${at}: focus, same place as hover`).toEqual(hover.more);
          expect([focus.mark, focus.name, focus.tail], `${at}: focus, nothing moves`).toEqual([rest.mark, rest.name, rest.tail]);
          if (p === TS) await page.screenshot({ path: test.info().outputPath(`more-${theme}-${size}-focus.png`), clip });
          await page.getByTestId(`app.sidebar.project.${p}.menu`).blur();
        }
      }
    } finally {
      await s.close();
      core.dispose();
    }
  });
}

// app/ring-look · the context dial after Codex's (his ask on ring-look, designer m_26952): the ds Ring
// in the composer's tab and on the right bar's agent rows (⌥ held: every ring shows), light and dark,
// at 50, 75 and 95 % (at 0 neither draws one). FakeCore: acme with 3 agents at those percents.
// Passes when, everywhere it is drawn:
//   - the track and the arc are 2 px wide, the arc's caps round;
//   - the arc is ink from 70 % (data-warn) and never a hue: its stroke is the theme's text-2 or text
//     in the composer, text-3 or text in the bar;
//   - nothing of the arc is drawn left of 12 o'clock (the caps stay inside 0..pct);
//   - the bar's percent is whole: its column never cuts its first glyph ('ɔ5%', designer m_26968).
// Shots: ring-look-<theme>-tab-<pct>.png, ring-look-<theme>-bar.png. Owner: ring-look.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import type { Page } from '@playwright/test';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const PCTS = [50, 75, 95] as const;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const use = (pct: number) => ({ usage: { model: 'm', context: pct * 1000, window: 100_000, words: `${String(pct)}k · ${String(pct)}%`, short: `${String(pct)}%` } });
const agent = (name: string, status: string, over: Record<string, unknown> = {}) => ({
  name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [], ...over,
});
const name = (pct: number) => `ctx-${String(pct)}`;
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 4, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main', 'idle'), ...PCTS.map((p) => agent(name(p), 'idle', use(p)))] },
  { ev: 'agents', project: HOME, agents: [agent('main', 'idle')] },
  ...['main', ...PCTS.map(name)].map((a) => ({ ev: 'thread', project: P, agent: a, entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'on it.' }], before: null, more: false })),
];

type Look = { warn: boolean; track: number; arc: number; cap: string; stroke: string; text2: string; text3: string; text: string; leftOfNoon: boolean };
/** the ring's strokes and the theme's inks, and whether the arc's drawn ink reaches left of 12 o'clock */
const look = (page: Page, id: string) =>
  page.getByTestId(id).locator('svg.b-ring').evaluate((svg): Look => {
    const used = svg.querySelector('.used') as SVGCircleElement;
    const track = svg.querySelector('.track') as SVGCircleElement;
    const ink = (v: string) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${v})`;
      svg.parentElement?.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    };
    // the arc's start: its dash begins at least a round cap's reach (half the stroke) after 12 o'clock
    const dash = Number.parseFloat((used.getAttribute('stroke-dasharray') ?? '0').split(' ')[0] ?? '0');
    const off = -Number.parseFloat(used.getAttribute('stroke-dashoffset') ?? '0');
    const cap = Number.parseFloat(getComputedStyle(used).strokeWidth) / 2;
    return {
      warn: svg.hasAttribute('data-warn'),
      track: Number.parseFloat(getComputedStyle(track).strokeWidth),
      arc: Number.parseFloat(getComputedStyle(used).strokeWidth),
      cap: getComputedStyle(used).strokeLinecap,
      stroke: getComputedStyle(used).stroke,
      text2: ink('--c-text-2'),
      text3: ink('--c-text-3'),
      text: ink('--c-text'),
      leftOfNoon: off - cap < -0.01 || dash < 0 || used.hasAttribute('pathLength'),
    };
  });

test('app/ring-look: the context dial is Codex-like, ink from 70 %, never a hue', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/${name(50)}`, size: '1400x900' });
  try {
    const { page } = s;
    await expect(page.getByTestId(`app.right.agent.${name(50)}`)).toBeVisible({ timeout: 10_000 });
    for (const theme of ['light', 'dark']) {
      await core.send(prefs(theme) as never);
      await page.waitForTimeout(200);
      // the composer's tab, one agent at a time
      for (const p of PCTS) {
        await page.getByTestId(`app.right.agent.${name(p)}`).click();
        const ctx = page.getByTestId('composer.tab.context');
        await expect(ctx).toHaveAttribute('data-pct', String(p), { timeout: 10_000 });
        const l = await look(page, 'composer.tab.context');
        const at = `${theme} tab ${String(p)}%`;
        expect([l.track, l.arc, l.cap], `${at}: 2 px track and arc, round caps`).toEqual([2, 2, 'round']);
        expect(l.warn, `${at}: ink from 70 %`).toBe(p >= 70);
        expect(l.stroke, `${at}: text-2 at rest, text from 70 %`).toBe(p >= 70 ? l.text : l.text2);
        expect(l.leftOfNoon, `${at}: nothing left of 12 o'clock`).toBe(false);
        const box = await ctx.boundingBox();
        if (box !== null) await page.screenshot({ path: test.info().outputPath(`ring-look-${theme}-tab-${String(p)}.png`), clip: { x: box.x - 160, y: box.y - 10, width: box.width + 180, height: box.height + 20 } });
      }
      // the bar's rows, ⌥ held: every ring shows
      await page.mouse.move(400, 400);
      await page.keyboard.down('Alt');
      await page.waitForTimeout(500);
      for (const p of PCTS) {
        const id = `app.right.agent.${name(p)}.ring`;
        const l = await page.getByTestId(id).evaluate((svg) => ({ warn: svg.hasAttribute('data-warn'), stroke: getComputedStyle(svg.querySelector('.used') as Element).stroke }));
        const inks = await look(page, `app.right.agent.${name(p)}.pct`);
        expect(l.warn, `${theme} bar ${String(p)}%: ink from 70 %`).toBe(p >= 70);
        expect(l.stroke, `${theme} bar ${String(p)}%: text-3 at rest, text from 70 %`).toBe(p >= 70 ? inks.text : inks.text3);
        expect(inks.leftOfNoon, `${theme} bar ${String(p)}%: nothing left of 12 o'clock`).toBe(false);
        // its percent whole: the clipping cols never cut its first glyph ('ɔ5%', designer m_26968)
        const cut = await page.getByTestId(`app.right.agent.${name(p)}.pct`).evaluate((el) => {
          const words = Array.from(el.childNodes).find((n) => n.nodeType === Node.TEXT_NODE);
          if (words === undefined) return 0;
          const r = document.createRange();
          r.selectNodeContents(words);
          const cols = el.closest('.app-rb-cols') ?? el;
          return cols.getBoundingClientRect().left - r.getBoundingClientRect().left;
        });
        if (p >= 70) expect(cut, `${theme} bar ${String(p)}%: its percent inside its column, not cut on the left`).toBeLessThanOrEqual(0);
      }
      const rows = page.getByTestId('app.right.agents');
      await rows.screenshot({ path: test.info().outputPath(`ring-look-${theme}-bar.png`) });
      await page.keyboard.up('Alt');
    }
  } finally {
    await s.close();
    core.dispose();
  }
});

// thread/find-bar · ⌘F's bar is a compact panel at the list's top right, as a macOS find bar (his
// m_25471: it spanned the width, with odd padding and gaps). Passes when, at 1400, 1100 and 800, light
// and dark: the bar sits 8 px under the list's top and 16 px from its right edge, is far narrower
// than the list, has a 4 px frame, 8 px between the field, the count and the buttons, the ↑ ↓ ×
// touching, every box on the 4 px grid; only the matched words are marked (CSS highlights, the
// current stronger, no box around its row: designer m_25774); each button explains itself in the ds tip with its key; the
// count says '1/2'; esc closes it. Shots for designer's sign. The scripted core (FakeCore). Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import type { Page } from '@playwright/test';

const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const agent = (name: string, status: string) => ({ name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 2 * MIN, waits: 0 });
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: 'bise-home-00000000', name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 2, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main', 'idle'), agent('perf', 'working')] },
  {
    ev: 'thread',
    project: P,
    agent: 'perf',
    entries: [
      { pos: 1, at_ms: NOW - 5 * MIN, kind: 'agent', text: 'found it: the hero image ships at 2.4 MB.' },
      { pos: 2, at_ms: NOW - 4 * MIN, kind: 'agent', text: 'the page waits on three fonts before its first paint.' },
      { pos: 3, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'resized the hero to 1600 px wide: 310 kB now.' },
    ],
    before: null,
    more: false,
  },
];

type Box = { x: number; y: number; width: number; height: number };
interface Geo {
  bar: Box;
  main: Box;
  field: Box;
  count: Box;
  btns: Box[];
  pad: number;
  bg: string;
  shadow: string;
}

async function geo(page: Page): Promise<Geo> {
  return page.evaluate(() => {
    const r = (el: Element | null): Box => {
      const b = (el as HTMLElement).getBoundingClientRect();
      return { x: b.x, y: b.y, width: b.width, height: b.height };
    };
    const bar = document.querySelector('[data-testid="thread.find"]') as HTMLElement;
    const cs = getComputedStyle(bar);
    return {
      bar: r(bar),
      main: r(bar.closest('.th-main')),
      field: r(bar.querySelector('.b-field')),
      count: r(bar.querySelector('[data-testid="thread.find.count"]')),
      btns: ['older', 'newer', 'close'].map((n) => r(bar.querySelector(`[data-testid="thread.find.${n}"]`))),
      pad: parseFloat(cs.paddingTop),
      bg: cs.backgroundColor,
      shadow: cs.boxShadow,
    };
  });
}

test('thread/find-bar: a compact bar at the top right, on the spacing tokens, its buttons with their tips, light and dark at 1400/1100/800', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1400x860' });
  try {
    const { page } = s;
    const composer = page.getByTestId('composer.field').first();
    await expect(composer).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('thread.list')).toContainText('hero image');
    await composer.click();
    await page.keyboard.press('Meta+f');
    const field = page.getByTestId('thread.find.field');
    await expect(field, '⌘F opens the find field, focused').toBeFocused();
    await page.keyboard.type('hero');
    await expect(page.getByTestId('thread.find.count'), 'two matches').toHaveText('1/2');
    // only the matched words are marked (CSS highlights, as /log's find): both in the selection's
    // tint, the current one stronger, and no box around its row (designer m_25774)
    const marks = () =>
      page.evaluate(() => {
        const reg = (CSS as unknown as { highlights: Map<string, Set<Range>> }).highlights;
        const words = (name: string) => [...(reg.get(name) ?? [])].map((r) => r.toString());
        const row = document.querySelector('[data-hit]');
        const cs = row === null ? null : getComputedStyle(row);
        return { all: words('th-find'), at: words('th-find-at'), outline: cs?.outlineStyle ?? null, row: row?.getAttribute('data-testid') ?? null };
      });
    await expect.poll(async () => (await marks()).at, { message: 'the current match: its word' }).toEqual(['hero']);
    const m = await marks();
    expect(m.all, 'the other match: its word').toEqual(['hero']);
    expect(m.row, 'the newest match is current').toBe('thread.entry.3');
    expect(m.outline, 'no box around the row').toBe('none');

    for (const w of [1400, 1100, 800]) {
      await page.setViewportSize({ width: w, height: 760 });
      await page.waitForTimeout(200);
      const g = await geo(page);
      const at = `at ${String(w)}`;
      expect(g.bar.y - g.main.y, `${at}: 8 px under the list's top`).toBe(8);
      expect(g.main.x + g.main.width - (g.bar.x + g.bar.width), `${at}: 16 px from the list's right edge`).toBe(16);
      expect(g.bar.width, `${at}: compact, never the list's width`).toBeLessThanOrEqual(360);
      expect(g.bar.width, `${at}: compact`).toBeLessThan(g.main.width / 2 + 100);
      expect(g.pad, `${at}: a 4 px frame`).toBe(4);
      expect(g.bar.height, `${at}: the 28 px controls in a 4 px frame`).toBe(36);
      expect(g.field.x - g.bar.x, `${at}: the field 4 px from the frame`).toBe(4);
      expect(g.count.x - (g.field.x + g.field.width), `${at}: 8 px field to count`).toBe(8);
      const [up, down, close] = g.btns as [Box, Box, Box];
      expect(up.x - (g.count.x + g.count.width), `${at}: 8 px count to ↑`).toBe(8);
      expect(down.x - (up.x + up.width), `${at}: ↑ ↓ touch`).toBe(0);
      expect(close.x - (down.x + down.width), `${at}: ↓ × touch`).toBe(0);
      expect(g.bar.x + g.bar.width - (close.x + close.width), `${at}: × 4 px from the frame`).toBe(4);
      for (const b of [g.field, ...g.btns]) {
        expect(b.height % 4, `${at}: heights on the 4 px grid`).toBe(0);
        expect(b.width % 4, `${at}: widths on the 4 px grid`).toBe(0);
      }
      expect(g.bg, `${at}: its own surface over the list`).not.toBe('rgba(0, 0, 0, 0)');
      expect(g.shadow, `${at}: lifted`).not.toBe('none');
      await page.mouse.move(Math.max(0, g.bar.x - 200), g.bar.y + 300);
      await page.screenshot({ path: test.info().outputPath(`find-w${String(w)}-light.png`) });
      await core.send(prefs('dark') as never);
      await page.waitForTimeout(300);
      await page.screenshot({ path: test.info().outputPath(`find-w${String(w)}-dark.png`) });
      await core.send(prefs('light') as never);
      await page.waitForTimeout(200);
    }

    // each compact button explains itself (the ds tip, with its key)
    await page.setViewportSize({ width: 1400, height: 860 });
    const tip = page.getByTestId('tip');
    for (const [id, words] of [
      ['older', 'older match'],
      ['newer', 'newer match'],
      ['close', 'close find'],
    ] as const) {
      await page.getByTestId(`thread.find.${id}`).hover();
      await expect(tip, `${id}: its words`).toContainText(words);
    }
    await page.getByTestId('thread.find.older').hover();
    await expect(tip).toContainText('older match');
    await page.screenshot({ path: test.info().outputPath('find-tip.png') });

    // ↑ and ↓ move the count, esc closes
    await page.getByTestId('thread.find.older').click();
    await expect(page.getByTestId('thread.find.count')).toHaveText('2/2');
    await page.getByTestId('thread.find.newer').click();
    await expect(page.getByTestId('thread.find.count')).toHaveText('1/2');
    await field.focus();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('thread.find'), 'esc closes it').toHaveCount(0);
  } finally {
    await s.close();
    core.dispose();
  }
});

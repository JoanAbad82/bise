// thread/shot-caption · the talk's still in his bubble (architect m_22000, designer m_22052). His fn
// talk sends main his words with the still of his screen as an image part whose caption names the
// app and window ('Safari · cold bench'). On the REAL thread screen (FakeCore): the chip keeps the
// signed image look ('image 1', 16 px thumbnail, 1 px line, r 9), the caption sits 4 px under the
// chip row (--gap-tight) on the chips' left edge, t-12 in text-3 (the ' · ' too), one line cut
// with …; a long title never wraps. Never the marker on screen. One crop at 1100 light. Owner:
// amb-core.
import { copyFileSync, mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'shop-ab9f3c3b';
const PNG = path.join(mkdtempSync(path.join(os.tmpdir(), 'shot-caption-')), 'still.png');
copyFileSync(path.join(__dirname, '../fixtures/checker.png'), PNG);
const NOW = Date.now();
const MIN = 60_000;
const LONG = `Safari · ${'the cold bench numbers for the night batch, '.repeat(6)}`;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 30 * MIN, waits: 0, watching: [] });
const marker = (caption: string) => `<image name="[Image #1]" path="${PNG}" mime="image/png" b64="" caption="${caption}">`;
const world = () => [
  prefs('light'),
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
      { pos: 1, at_ms: NOW - 12 * MIN, kind: 'agent', text: 'the bench ran overnight: the numbers are on the dashboard.' },
      // his fn talk: the still (captioned) then his words, as the core sends them
      {
        pos: 2,
        at_ms: NOW - 10 * MIN,
        kind: 'you',
        text: `${marker('Safari · cold bench')} why is this one so slow?`,
        parts: [
          { kind: 'image', name: '[Image #1]', source: PNG, mime: 'image/png', caption: 'Safari · cold bench' },
          { kind: 'text', text: 'why is this one so slow?' },
        ],
      },
      { pos: 3, at_ms: NOW - 9 * MIN, kind: 'agent', text: 'the cold start reads the whole cache first.' },
      // a still of a window with a long title: one line, cut with …
      {
        pos: 4,
        at_ms: NOW - 6 * MIN,
        kind: 'you',
        text: `${marker(LONG)} and this?`,
        parts: [
          { kind: 'image', name: '[Image #1]', source: PNG, mime: 'image/png', caption: LONG },
          { kind: 'text', text: 'and this?' },
        ],
      },
    ],
    before: null,
    more: false,
  },
];

test("thread/shot-caption: the talk's still reads 'image 1' with its caption 4 px under the chip, t-12 text-3, one line", async () => {
  test.setTimeout(60_000);
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x760' });
  try {
    const { page } = s;
    await expect(page.getByTestId('thread.you.4')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('thread.you.2.image.1')).toHaveText('image 1');
    await expect(page.getByTestId('thread.you.2.image.1.caption')).toHaveText('Safari · cold bench');
    await expect(page.getByTestId('thread.you.2')).toContainText('why is this one so slow?');
    const geo = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--c-text-3)';
      document.body.appendChild(probe);
      const text3 = getComputedStyle(probe).color;
      probe.remove();
      const one = (id: string) => {
        const row = document.querySelector(`[data-testid="${id}.parts"]`);
        const chip = document.querySelector(`[data-testid="${id}.image.1"]`);
        const cap = document.querySelector(`[data-testid="${id}.image.1.caption"]`);
        if (row === null || chip === null || cap === null) return null;
        const r = row.getBoundingClientRect();
        const c = cap.getBoundingClientRect();
        const ch = getComputedStyle(chip);
        const cs = getComputedStyle(cap);
        return {
          gap: Math.round(c.top - r.bottom),
          left: Math.round(c.left - chip.getBoundingClientRect().left),
          size: cs.fontSize,
          color: cs.color,
          wrap: cs.whiteSpace,
          cut: cs.textOverflow,
          height: Math.round(c.height),
          lineHeight: cs.lineHeight,
          overflows: cap.scrollWidth > cap.clientWidth,
          chipBorder: ch.borderTopWidth,
          chipRadius: ch.borderTopLeftRadius,
        };
      };
      return { text3, a: one('thread.you.2'), b: one('thread.you.4') };
    });
    expect(geo.a, 'the still has its caption').not.toBeNull();
    expect(geo.b, 'the long still has its caption').not.toBeNull();
    for (const [k, g] of [['short', geo.a], ['long', geo.b]] as const) {
      if (g === null) continue;
      expect(g.gap, `${k}: 4 px under the chip row (--gap-tight)`).toBe(4);
      expect(g.left, `${k}: on the chips' left edge`).toBe(0);
      expect(g.size, `${k}: t-12`).toBe('12px');
      expect(g.color, `${k}: text-3`).toBe(geo.text3);
      expect(g.wrap, `${k}: one line`).toBe('nowrap');
      expect(g.cut, `${k}: cut with …`).toBe('ellipsis');
      expect(g.chipBorder, `${k}: the chip's 1 px line`).toBe('1px');
      expect(g.chipRadius, `${k}: the chip's r 9`).toBe('9px');
    }
    expect(geo.b?.overflows, 'the long title is cut, not wrapped').toBe(true);
    expect(geo.b?.height, 'the long title stays one line').toBe(geo.a?.height);
    expect(await page.getByTestId('thread.screen').innerText(), 'no marker drawn').not.toMatch(/<image|caption=/u);
    await page.mouse.move(1, 300);
    await page.waitForTimeout(200);
    const box = await page.getByTestId('thread.you.2').boundingBox();
    const box4 = await page.getByTestId('thread.you.4').boundingBox();
    if (box !== null && box4 !== null) {
      const top = Math.max(0, box.y - 24);
      await page.screenshot({
        path: test.info().outputPath('shot-caption-light-1100.png'),
        clip: { x: 0, y: top, width: 1100, height: Math.min(760 - top, box4.y + box4.height + 24 - top) },
      });
    }
  } finally {
    await s.close();
  }
});

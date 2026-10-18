// bims/toggle · his bug (main m_30939): « quand la sidebar est trop petite, le texte "the bims"
// disparaît ». The AGENTS head at the 320 bar with the office open had 0 px to spare; the cube's
// button shrank a hair, its label wrapped under the clip, and the pill stayed wide and empty. On
// FakeCore rows from src/bims/fixtures.ts, off screen. Passes when, light and dark, at every bar
// width (320 → 520, its widest in a 1600 window, by the bar's border, then wide 640), the office closed and open:
//   - the toggle is never empty or wrapped: its label on the cube's line, wholly inside the pill,
//     the pill hugging cube + label; or, short of room, no label and the pill hugging the cube
//     alone (24 px), still named 'the bims';
//   - the label goes only for want of room (designer m_31047: measured, never a width threshold):
//     shown, every part is whole; out, the head truly lacks the label's width; closed at every
//     width and open wide, it shows;
//   - a longer title (a 3-digit count, another language: 'AGENTS · N' widened by its letter
//     spacing) at the 320 bar, open: the cube alone, and back with the label once the bar is wider;
//   - the head's parts ('AGENTS · N', '320 · wide', the cube, 'all ›') never meet, stay inside the
//     head, and 'AGENTS · N' is whole (no '…').
// Shots: toggle-<theme>-<state>.png in .harness-cache/bims-shots, for designer's sign. Owner: bims-toggle.
import { test, expect } from '../../harness';
import type { Session } from '../../harness';
import type { Page } from '@playwright/test';
import { office } from '../../../src/bims/fixtures';
import { bims } from '../../../src/proto/words_bims.gen';
import { open, shotOf, sleep, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 180_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

/** the bar widths walked: the narrowest, the edge either side of the label's rule, a few more */
const WIDTHS = [320, 340, 360, 400, 440, 480, 520] as const;

type Rect = { l: number; r: number; t: number; b: number; w: number };
type Head = { bar: number; head: Rect; parts: { name: string; at: Rect }[]; btn: Rect; glyph: Rect; label: Rect | null; labelW: number; slack: number; name: string | null; titleCut: boolean };

/** the AGENTS head as laid out now */
const headNow = (page: Page): Promise<Head> =>
  page.evaluate(() => {
    const at = (e: Element): Rect => {
      const b = e.getBoundingClientRect();
      return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width };
    };
    const q = (sel: string): Element => {
      const e = document.querySelector(sel);
      if (e === null) throw new Error(`no ${sel}`);
      return e;
    };
    const btn = q('[data-testid="app.right.agents.bims"]');
    const lab = btn.querySelector('.bims-cube-label');
    if (lab === null) throw new Error('no label');
    const label = getComputedStyle(lab).visibility === 'visible' && getComputedStyle(lab).position !== 'absolute' ? at(lab) : null;
    const t = q('[data-testid="app.right.agents"] .app-rb-label');
    const title = q('[data-testid="app.right.agents.head"]');
    const ts = getComputedStyle(title);
    // the title's room past 'AGENTS · N' whole: what the label could take
    const slack = title.getBoundingClientRect().width - parseFloat(ts.paddingLeft) - parseFloat(ts.paddingRight) - t.scrollWidth;
    const parts = [
      ['title', '[data-testid="app.right.agents.head"]'],
      ['switch', '[data-testid="app.right.agents.width"]'],
      ['cube', '[data-testid="app.right.agents.bims"]'],
      ['all', '[data-testid="app.right.agents.all"]'],
    ].flatMap(([name, sel]) => {
      const e = document.querySelector(sel ?? '');
      return e === null ? [] : [{ name: name ?? '', at: at(e) }];
    });
    return {
      bar: Math.round(q('.app-panel').getBoundingClientRect().width),
      head: at(q('[data-testid="app.right.agents"] .app-rb-head')),
      parts,
      btn: at(btn),
      glyph: at(q('[data-testid="app.right.agents.bims"] .bims-glyph')),
      label,
      labelW: lab.getBoundingClientRect().width + parseFloat(getComputedStyle(btn).columnGap),
      slack,
      name: btn.getAttribute('aria-label'),
      titleCut: t.scrollWidth > t.clientWidth,
    };
  });

/** the toggle is whole: the label on the cube's line inside a pill that hugs both, or the cube alone */
function checkToggle(h: Head, want: 'label' | 'cube' | 'room', where: string): void {
  const eps = 0.6;
  // padding: 2 px top and bottom, 4 px either side (office.css .bims-cube)
  expect(h.name, `${where}: the toggle is named`).toBe(bims.cube_label);
  if (h.label === null) {
    expect(want, `${where}: the label shows`).not.toBe('label');
    expect(h.slack, `${where}: the label out only for want of room`).toBeLessThan(h.labelW);
    expect(h.btn.w, `${where}: no label, the pill hugs the cube (no empty pill)`).toBeLessThanOrEqual(h.glyph.w + 8 + eps);
    return;
  }
  expect(want, `${where}: no room, the cube alone`).not.toBe('cube');
  const l = h.label;
  expect(l.b - l.t, `${where}: the label is one line`).toBeLessThanOrEqual(16 + eps);
  expect(Math.abs((l.t + l.b) / 2 - (h.glyph.t + h.glyph.b) / 2), `${where}: the label on the cube's line`).toBeLessThanOrEqual(2);
  expect(l.l >= h.glyph.r - eps && l.r <= h.btn.r + eps && l.t >= h.btn.t - eps && l.b <= h.btn.b + eps, `${where}: the label inside its pill`).toBe(true);
  expect(h.btn.w, `${where}: the pill hugs cube and label`).toBeLessThanOrEqual(h.glyph.w + 4 + l.w + 8 + eps);
}

/** the head's parts never meet and stay inside it; 'AGENTS · N' is whole */
function checkHead(h: Head, where: string): void {
  const eps = 0.6;
  for (const p of h.parts) expect(p.at.l >= h.head.l - eps && p.at.r <= h.head.r + eps, `${where}: ${p.name} inside the head`).toBe(true);
  for (let i = 1; i < h.parts.length; i++) {
    const a = h.parts[i - 1], b = h.parts[i];
    if (a === undefined || b === undefined) continue;
    expect(a.at.r, `${where}: ${a.name} ends before ${b.name}`).toBeLessThanOrEqual(b.at.l + eps);
  }
  expect(h.titleCut, `${where}: 'AGENTS · N' whole`).toBe(false);
}

/** the bar to `w` px by a drag of its border (the bar's own resize, kept like his) */
async function barTo(page: Page, w: number): Promise<void> {
  const now = Math.round((await page.locator('.app-panel').boundingBox())?.width ?? 0);
  if (now === w) return;
  const b = await page.getByTestId('app.split.panel').boundingBox();
  if (b === null) throw new Error('no bar border');
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + (now - w) / 2, y, { steps: 4 });
  await page.mouse.move(x + (now - w), y, { steps: 4 });
  await page.mouse.up();
  await expect.poll(async () => Math.round((await page.locator('.app-panel').boundingBox())?.width ?? 0), `the bar at ${String(w)}`).toBe(w);
}

/** the office open or closed, narrow (the bar's own width) */
async function office_(s: Session, on: boolean): Promise<void> {
  const icon = s.page.getByTestId('app.right.agents.bims');
  if ((await icon.getAttribute('aria-pressed')) !== String(on)) await icon.click();
  await expect(icon).toHaveAttribute('aria-pressed', String(on));
  if (on) {
    await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-shown', 'true', { timeout: 20_000 });
    const narrow = s.page.getByTestId('app.right.agents.width.narrow');
    if ((await narrow.getAttribute('aria-pressed')) !== 'true') await narrow.click();
  }
  await s.page.mouse.move(5, 400);
  await sleep(300);
}

async function headShot(s: Session, file: string, title: string, says: string): Promise<void> {
  const box = await s.page.getByTestId('app.right.agents').boundingBox();
  if (box === null) throw new Error(`no AGENTS for ${file}`);
  await shotOf(s.cdp, s.page, { ...box, height: 44 }, file);
  shots.push({ file, title, says });
}

for (const theme of ['light', 'dark'] as const) {
  test(`(bims-toggle) the cube and 'the bims' never empty or wrapped, 320 to wide, ${theme}`, async () => {
    const { s } = await open(office, { theme, width: 1600 });
    try {
      for (const w of WIDTHS) {
        await office_(s, false);
        await barTo(s.page, w);
        for (const on of [false, true]) {
          await office_(s, on);
          const h = await headNow(s.page);
          const where = `${theme}, bar ${String(h.bar)}, office ${on ? 'open' : 'closed'}`;
          checkHead(h, where);
          // closed, no switch: room at every width; open, the measure decides
          checkToggle(h, on ? 'room' : 'label', where);
          const tag = `${String(w)}-${on ? 'open' : 'closed'}`;
          if (w === 320 && !on) await headShot(s, `toggle-${theme}-${tag}.png`, `the 320 bar, closed, ${theme}`, "'AGENTS · N', the pink cube and 'the bims', 'all ›'");
          if (w === 320 && on) await headShot(s, `toggle-${theme}-${tag}.png`, `the 320 bar, open, ${theme}`, `'AGENTS · N', '320 · wide', then ${h.label === null ? "the cube alone in its pressed pill (no room)" : "cube and 'the bims' pressed"}, 'all ›'`);
        }
      }
      // a longer title at the 320 bar, open: the cube alone; a wider bar gives the label back
      const longer = await s.page.addStyleTag({ content: '[data-testid="app.right.agents"] .app-rb-label { letter-spacing: 0.4em }' });
      await barTo(s.page, 320);
      await office_(s, true);
      await expect.poll(async () => (await headNow(s.page)).label === null, `${theme}: a longer title at 320, the cube alone`).toBe(true);
      const long = await headNow(s.page);
      checkHead(long, `${theme}, a longer title at 320, open`);
      checkToggle(long, 'cube', `${theme}, a longer title at 320, open`);
      await headShot(s, `toggle-${theme}-320-open-long.png`, `the 320 bar, open, a longer title, ${theme}`, "'AGENTS · N' widened (a 3-digit count, another language): '320 · wide', the cube alone in its pressed pill (24 px), 'all ›'; its tip 'hide the office'");
      await office_(s, false);
      await barTo(s.page, 480);
      await office_(s, true);
      await expect.poll(async () => (await headNow(s.page)).label !== null, `${theme}: the same title at 480, the label back`).toBe(true);
      checkToggle(await headNow(s.page), 'label', `${theme}, a longer title at 480, open`);
      await longer.evaluate((e) => { e.parentNode?.removeChild(e); });
      // wide: the office's 640 column
      await office_(s, true);
      await s.page.getByTestId('app.right.agents.width.wide').click();
      await expect(s.page.locator('.app-panel')).toHaveAttribute('data-wide', /docked|over/);
      await s.page.mouse.move(5, 400);
      await sleep(400);
      const h = await headNow(s.page);
      const where = `${theme}, wide (${String(h.bar)}), office open`;
      checkHead(h, where);
      checkToggle(h, 'label', where);
      await headShot(s, `toggle-${theme}-wide-open.png`, `wide, open, ${theme}`, "'320 · wide', cube and 'the bims' pressed, 'all ›'");
    } finally {
      await s.close();
    }
  });
}

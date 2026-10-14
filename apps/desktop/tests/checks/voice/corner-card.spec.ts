// voice/corner-card · the fn talk in the corner like a notification (his pick C, designer m_22118;
// amb-mac's place d6622e50). Passes when, on the fake world, in light and dark:
//   - fn held shows the card 'show corner', without the keys; it is 320 px wide; all his live
//     words show (never cropped: the window grows upward, bottom-right pinned), the still's chip
//     under them; a talk past half the screen stops there and scrolls, following his newest words,
//     the top faded; the next talk starts at the one-line size again;
//   - one rounded edge only (his shot 2026-10-14: the ds .b-capsule's r 26 card inside the native
//     glass): the page paints nothing at the glass's 4 corners and its root no radius, fill or shadow;
//   - frames: the window's bounds from Electron's main (test mode's OFF_DISPLAY; capsule-frames.jsonl
//     is written only under BISE_DESKTOP_OFFSCREEN outside test mode, never in the harness);
//   - his release then bise main's reply: the answer in the same card, the keys line
//     '⏎ open in bise · esc close';
//   - a long answer grows to half the screen's height at most, then scrolls: scrolled, the top
//     fades (data-scrolled) and 'the rest in bise ↗' shows.
// Writes one sheet for designer: each state on a busy page (the app's own window), bottom-right
// 16 px in, and one with the Dock on the right (16 px left of it). The sheet places the card as
// place.ts does; the window's real place per screen and Dock is place.test.ts's (amb-mac).
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { PNG } from 'pngjs';
import { test, expect, type FakeCore } from '../../harness';
import { CAPSULE, capsulePage, capsuleWindow, onWorld, sleep, type World } from '../native/world';

const HOME = 'bise-home-00000000';
const STILL = path.join(__dirname, '../fixtures/checker.png');
const SHOT = { ev: 'shot', file: STILL, app: 'Safari', title: 'stripe.com' };
const WORDS =
  'so the checkout page on stripe, the one with the coupon field, why does the total jump by two cents when i apply the code and then remove it again, is that rounding on our side or theirs';
const SHORT = 'It is rounding on our side: `applyCoupon` rounds the discount, `removeCoupon` rounds the total again. One fix: round once, in `total()`.';
const LONG = Array.from({ length: 40 }, (_, i) => `${i + 1}. step ${i + 1} of the checkout trace: the total after this step, and which function changed it.`).join('\n');
const prefs = (theme: 'light' | 'dark') => ({
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
type Ev = Parameters<FakeCore['send']>[0];
let call = 0;
/** bise main's reply as the hub streams it: a new call, the whole text at off 0 */
const reply = (text: string): Ev => ({ ev: 'partial', project: HOME, agent: 'main', call: `${++call}.1`, off: 0, text }) as unknown as Ev;

/** waits for one more capsule line matching `pred` than there was before `act` */
async function next(w: World, pred: (l: string) => boolean, act: () => Promise<void>, ms = 3000): Promise<void> {
  const had = w.out.of(CAPSULE).filter(pred).length;
  await act();
  await expect.poll(() => w.out.of(CAPSULE).filter(pred).length, { timeout: ms }).toBeGreaterThan(had);
}
const esc = (w: World): Promise<void> => next(w, (l) => l === 'hide', () => w.helper.send({ ev: 'fn', act: 'esc' }));

type Shot = { label: string; png: Buffer; dock?: 'right' };
const glassShot = async (cap: Page, id: string): Promise<Buffer> => {
  const box = await cap.getByTestId(id).boundingBox();
  if (!box) throw new Error(`no ${id}`);
  // the glass and its shadow, on nothing: the sheet puts it on the busy page
  const pad = 24;
  return cap.screenshot({ omitBackground: true, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + 2 * pad, height: box.height + 2 * pad } });
};

type Frame = { x: number; y: number; width: number; height: number };
const fr = (f: Frame): string => `${f.width}x${f.height}@${f.x},${f.y}`;
/** the window's frames (Electron's main, test mode's OFF_DISPLAY) kept their bottom-right and grew */
const grewUpPinned = (fs: readonly Frame[]): boolean => {
  const [a] = fs;
  const z = fs.at(-1);
  if (a === undefined || z === undefined) return false;
  const pinned = fs.every((f) => Math.abs(f.x + f.width - (a.x + a.width)) <= 1 && Math.abs(f.y + f.height - (a.y + a.height)) <= 1);
  return pinned && z.height > a.height;
};
/** the cap: half the screen with a 240 px floor (the harness screen is tiny; Capsule.tsx halfScreen) */
const halfOf = (cap: Page): Promise<number> => cap.evaluate(() => Math.max(240, Math.round((window.screen.availHeight || 800) / 2)));
/** px of the box's content out of view (0: nothing cropped) */
const cropped = (l: Locator): Promise<number> => l.evaluate((e) => Math.max(0, e.scrollHeight - e.clientHeight - 1));
/**
 * One rounded edge only, the window's (the native glass, not drawn off-screen): the page paints
 * nothing at the glass's 4 corners (a 12 px square each, alpha 0 on a transparent ground), and its
 * root has no radius, fill or shadow of its own (the ds .b-capsule's r 26 card was the second edge).
 */
async function noSecondCorner(cap: Page, id: string, t: string): Promise<void> {
  const root = await cap.getByTestId('capsule').evaluate((e) => {
    const s = getComputedStyle(e);
    return { radius: s.borderTopLeftRadius, fill: s.backgroundColor, shadow: s.boxShadow };
  });
  expect.soft(root, `${t}: the page's root draws no card of its own`).toEqual({ radius: '0px', fill: 'rgba(0, 0, 0, 0)', shadow: 'none' });
  const box = await cap.getByTestId(id).boundingBox();
  if (!box) throw new Error(`no ${id}`);
  const png = PNG.sync.read(await cap.screenshot({ omitBackground: true, clip: box }));
  const k = png.width / box.width;
  const side = Math.round(12 * k);
  const corners = { tl: [0, 0], tr: [png.width - side, 0], bl: [0, png.height - side], br: [png.width - side, png.height - side] } as const;
  const painted: Record<string, number> = {};
  for (const [name, [x0, y0]] of Object.entries(corners)) {
    let n = 0;
    for (let y = y0; y < y0 + side; y++) for (let x = x0; x < x0 + side; x++) if ((png.data[(y * png.width + x) * 4 + 3] ?? 0) > 0) n++;
    painted[name] = n;
  }
  expect.soft(painted, `${t} ${id}: nothing painted at the 4 corners`).toEqual({ tl: 0, tr: 0, bl: 0, br: 0 });
}

test('voice/corner-card: the talk and its answer in the corner card, 320 wide, never cropped: it grows upward to half the screen then scrolls, one rounded edge', async () => {
  test.setTimeout(120_000);
  const shots: Shot[] = [];
  const grounds: Record<string, Buffer> = {};
  await onWorld(async (w) => {
    await w.s.page.waitForTimeout(1500);
    for (const t of ['light', 'dark'] as const) {
      await w.core.send(prefs(t) as never);
      await expect.poll(() => w.s.page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      grounds[t] = await w.s.page.screenshot();
      // talking: all his words, the still's chip
      await next(w, (l) => l === 'show corner', () => w.helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' }));
      const cap = await capsulePage(w.s);
      await expect.poll(() => cap.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      await sleep(300);
      // the one-line card ('listening…'): today's size, where every talk starts
      const START_H = (await capsuleWindow(w.s)).height;
      await w.core.send({ ev: 'heard', final: false, text: WORDS } as never);
      await w.core.send(SHOT as never);
      const card = cap.getByTestId('capsule.talk');
      await expect(cap.getByTestId('capsule.talk.words')).toContainText('rounding on our side');
      const g = await card.boundingBox();
      expect.soft(Math.round(g?.width ?? 0), `${t}: the card is 320 px wide`).toBe(320);
      const words = cap.getByTestId('capsule.talk.words');
      await sleep(300);
      expect.soft(await cropped(words), `${t}: his words are all shown, none cropped`).toBe(0);
      expect.soft((await capsuleWindow(w.s)).height, `${t}: the window grew to his words (past the one-line card)`).toBeGreaterThan(START_H + 20);
      await noSecondCorner(cap, 'capsule.talk', t);
      shots.push({ label: `${t} · talking`, png: await glassShot(cap, 'capsule.talk') });
      // a talk longer than half the screen: grows up to it (bottom-right pinned), then scrolls,
      // following his newest words, the top faded
      const frames: Frame[] = [await capsuleWindow(w.s)];
      for (let n = 1; n <= 6; n++) {
        await w.core.send({ ev: 'heard', final: false, text: Array.from({ length: n * 3 }, () => WORDS).join(' ') } as never);
        await sleep(200);
        frames.push(await capsuleWindow(w.s));
      }
      const half = await halfOf(cap);
      const th = (await card.boundingBox())?.height ?? 0;
      expect.soft(th, `${t}: the long talk is at most half the screen (${half})`).toBeLessThanOrEqual(half + 1);
      expect.soft(th, `${t}: the long talk fills half the screen before it scrolls`).toBeGreaterThan(half - 40);
      expect.soft(grewUpPinned(frames), `${t}: the window grew upward, its bottom-right pinned: ${frames.map(fr).join(' ')}`).toBe(true);
      expect.soft(await words.evaluate((e) => e.scrollHeight - e.scrollTop - e.clientHeight), `${t}: the newest words in view`).toBeLessThan(4);
      await expect.soft(words, `${t}: scrolled, the top fades`).toHaveAttribute('data-scrolled', '');
      shots.push({ label: `${t} · a long talk, at half the screen`, png: await glassShot(cap, 'capsule.talk') });
      await w.core.send({ ev: 'heard', final: false, text: WORDS } as never);
      await sleep(300);
      // answering: his release, then main's reply
      await w.helper.send({ ev: 'fn', act: 'talk_end' });
      await w.core.send({ ev: 'heard', final: true, text: WORDS } as never);
      await sleep(200);
      await w.core.send(reply(SHORT));
      const answer = cap.getByTestId('capsule.answer');
      await expect(answer, `${t}: the answer in the corner card`).toBeVisible({ timeout: 5000 });
      await expect(cap.getByTestId('capsule.answer.keys')).toHaveText('⏎ open in bise · esc close');
      // its inline code in the thread's markdown colors (ds md.css: green), no chip fill (designer m_22394)
      const code = await answer.locator('code').first().evaluate((e) => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--md-code)';
        e.parentElement?.appendChild(probe);
        const want = getComputedStyle(probe).color;
        probe.remove();
        const s = getComputedStyle(e);
        return { color: s.color, want, fill: s.backgroundColor };
      });
      expect.soft(code.color, `${t}: inline code is the thread's code color`).toBe(code.want);
      expect.soft(code.fill, `${t}: inline code has no fill`).toBe('rgba(0, 0, 0, 0)');
      await sleep(400);
      await noSecondCorner(cap, 'capsule.answer', t);
      shots.push({ label: `${t} · answering`, png: await glassShot(cap, 'capsule.answer') });
      if (t === 'light') shots.push({ label: `${t} · answering, Dock on the right`, png: await glassShot(cap, 'capsule.answer'), dock: 'right' });
      await esc(w);
      // a long answer: half the screen at most, then it scrolls with the top fade
      await next(w, (l) => l === 'show corner', () => w.helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' }));
      // the next talk starts at the one-line size again
      await sleep(300);
      expect.soft((await capsuleWindow(w.s)).height, `${t}: the next talk shrank back to the one-line card`).toBe(START_H);
      await w.helper.send({ ev: 'fn', act: 'talk_end' });
      await sleep(200);
      const before = await capsuleWindow(w.s);
      await w.core.send(reply(LONG));
      await expect(answer).toBeVisible({ timeout: 5000 });
      await sleep(400);
      expect.soft(grewUpPinned([before, await capsuleWindow(w.s)]), `${t}: the answer grew the window upward, bottom-right pinned`).toBe(true);
      const scroll = cap.getByTestId('capsule.answer.scroll');
      const capMax = await answer.evaluate((e) => parseFloat(getComputedStyle(e).maxHeight));
      expect.soft(capMax, `${t}: the answer's cap is half the screen (${half})`).toBe(half);
      const h = (await answer.boundingBox())?.height ?? 0;
      expect.soft(h, `${t}: the long answer is at most its cap (${half})`).toBeLessThanOrEqual(half + 1);
      expect.soft(h, `${t}: the long answer fills its cap before it scrolls`).toBeGreaterThan(half - 40);
      await expect(cap.getByTestId('capsule.answer.more'), `${t}: 'the rest in bise ↗' when it scrolls`).toHaveText('the rest in bise ↗');
      await scroll.evaluate((e) => {
        e.scrollTop = Math.round(e.scrollHeight / 3);
        e.dispatchEvent(new Event('scroll'));
      });
      await expect(scroll).toHaveAttribute('data-scrolled', '');
      await sleep(300);
      shots.push({ label: `${t} · a long answer, scrolled`, png: await glassShot(cap, 'capsule.answer') });
      await esc(w);
    }
    // the sheet: each card on the busy page, bottom-right 16 px in (or 16 px left of a right Dock)
    const page = w.s.page;
    const cells = shots
      .map((x) => {
        const t = x.label.startsWith('dark') ? 'dark' : 'light';
        const bg = grounds[t]?.toString('base64') ?? '';
        const dock = x.dock === 'right' ? '<div class="dock"></div>' : '';
        return `<figure><figcaption>${x.label}</figcaption><div class="scr${x.dock === 'right' ? ' dr' : ''}"><img class="bg" src="data:image/png;base64,${bg}">${dock}<img class="card" src="data:image/png;base64,${x.png.toString('base64')}"></div></figure>`;
      })
      .join('');
    await page.setContent(
      `<style>body{margin:0;padding:16px;font:13px -apple-system;display:grid;grid-template-columns:repeat(2,1fr);gap:16px;background:#888}figure{margin:0}figcaption{color:#111;margin-bottom:4px}.scr{position:relative;overflow:hidden;width:100%;aspect-ratio:16/10;border-radius:6px}.bg{width:100%;height:100%;object-fit:cover;object-position:left top}.card{position:absolute;right:-8px;bottom:-8px;zoom:.5}.dr .card{right:calc(36px - 8px)}.dock{position:absolute;top:20%;bottom:20%;right:0;width:36px;background:rgba(255,255,255,.35);backdrop-filter:blur(12px);border-radius:10px 0 0 10px}</style>${cells}`,
    );
    writeFileSync(test.info().outputPath('corner-card-sheet.png'), await page.screenshot({ fullPage: true }));
    for (const [n, x] of shots.entries()) writeFileSync(test.info().outputPath(`${String(n).padStart(2, '0')}-${x.label.replace(/[^a-z0-9]+/giu, '-')}.png`), x.png);
  });
});

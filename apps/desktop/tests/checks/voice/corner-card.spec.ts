// voice/corner-card · the fn talk in the corner like a notification (his pick C, designer m_22118;
// amb-mac's place d6622e50). Passes when, on the fake world, in light and dark:
//   - fn held shows the card 'show corner', without the keys; it is 320 px wide; his live words
//     show in at most 3 lines (the last ones), the still's chip under them;
//   - his release then bise main's reply: the answer in the same card, the keys line
//     '⏎ open in bise · esc close';
//   - a long answer grows to half the screen's height at most, then scrolls: scrolled, the top
//     fades (data-scrolled) and 'the rest in bise ↗' shows.
// Writes one sheet for designer: each state on a busy page (the app's own window), bottom-right
// 16 px in, and one with the Dock on the right (16 px left of it). The sheet places the card as
// place.ts does; the window's real place per screen and Dock is place.test.ts's (amb-mac).
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect, type FakeCore } from '../../harness';
import { CAPSULE, capsulePage, onWorld, sleep, type World } from '../native/world';

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

test('voice/corner-card: the talk and its answer in the corner card, 320 wide, 3 lines of words, the answer capped at half the screen then scrolled', async () => {
  test.setTimeout(120_000);
  const shots: Shot[] = [];
  const grounds: Record<string, Buffer> = {};
  await onWorld(async (w) => {
    await w.s.page.waitForTimeout(1500);
    for (const t of ['light', 'dark'] as const) {
      await w.core.send(prefs(t) as never);
      await expect.poll(() => w.s.page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      grounds[t] = await w.s.page.screenshot();
      // talking: his words (the last 3 lines), the still's chip
      await next(w, (l) => l === 'show corner', () => w.helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' }));
      const cap = await capsulePage(w.s);
      await expect.poll(() => cap.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      await w.core.send({ ev: 'heard', final: false, text: WORDS } as never);
      await w.core.send(SHOT as never);
      const card = cap.getByTestId('capsule.talk');
      await expect(cap.getByTestId('capsule.talk.words')).toContainText('rounding on our side');
      const g = await card.boundingBox();
      expect.soft(Math.round(g?.width ?? 0), `${t}: the card is 320 px wide`).toBe(320);
      const lines = await cap.getByTestId('capsule.talk.words').evaluate((e) => {
        const lh = parseFloat(getComputedStyle(e).lineHeight);
        return Math.round(e.getBoundingClientRect().height / lh);
      });
      expect.soft(lines, `${t}: his words show in 3 lines at most`).toBeLessThanOrEqual(3);
      await sleep(300);
      shots.push({ label: `${t} · talking`, png: await glassShot(cap, 'capsule.talk') });
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
      shots.push({ label: `${t} · answering`, png: await glassShot(cap, 'capsule.answer') });
      if (t === 'light') shots.push({ label: `${t} · answering, Dock on the right`, png: await glassShot(cap, 'capsule.answer'), dock: 'right' });
      await esc(w);
      // a long answer: half the screen at most, then it scrolls with the top fade
      await next(w, (l) => l === 'show corner', () => w.helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' }));
      await w.helper.send({ ev: 'fn', act: 'talk_end' });
      await sleep(200);
      await w.core.send(reply(LONG));
      await expect(answer).toBeVisible({ timeout: 5000 });
      await sleep(400);
      const scroll = cap.getByTestId('capsule.answer.scroll');
      // the cap is half the screen with a 240 px floor (the harness screen is tiny)
      const half = await cap.evaluate(() => Math.max(240, Math.round((window.screen.availHeight || 800) / 2)));
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

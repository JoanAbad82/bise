// pearl/frames · bar ⛔1p (docs/desktop-bar.md) · his bug 2: "the pearl animation flickers".
// Red first on today's window (set 1, d38f2df9: its 4 pearl canvases were rebuilt on every thread
// switch, winui.js pearlsIn). Now on the new app's labs (test mode): the pearl lab, real clicks
// through the moods (rest -> listen -> work -> speak -> done -> rest), and the spotlight lab's
// pearl while he types. Passes when the pearl's canvas is never replaced (a new canvas restarts
// the animation: a jump), no pearl frame flashes, and no frame-to-frame jump is larger than the
// animation's own steps.
import type { Page } from '@playwright/test';
import { test, expect, launchDesktop, Recorder, flashes, maxJump, type Session } from '../../harness';

const L = { launch: (): Promise<Session> => launchDesktop({ route: 'lab/pearl' }), pearl: '[data-testid="lab.pearl.canvas"]', mood: (m: string) => `[data-testid="lab.mood.${m}"]`, moods: ['listen', 'work', 'speak', 'done', 'rest'], dwellMs: 900 };
const SP = { launch: (): Promise<Session> => launchDesktop({ route: 'lab/spotlight' }), pearl: '[data-testid="spot.pearl"]', field: '[data-testid="spot.input"]' };
/** a frame-to-frame jump (mean change per pixel, 0..765) the breathing never reaches */
const JUMP = 60;

/** counts pearl canvases (present at the start) that leave the page during `act` */
async function canvasesReplaced(page: Page, sel: string, act: () => Promise<void>): Promise<{ before: number; replaced: number }> {
  await page.evaluate((sel) => {
    const before = new Set(Array.from(document.querySelectorAll(sel)));
    const w = window as unknown as { __qaPearl: { before: number; replaced: number } };
    w.__qaPearl = { before: before.size, replaced: 0 };
    new MutationObserver((records) => {
      for (const m of records) for (const n of Array.from(m.removedNodes)) {
        if (!(n instanceof Element)) continue;
        for (const c of [n, ...Array.from(n.querySelectorAll(sel))]) if (before.has(c)) w.__qaPearl.replaced++;
      }
    }).observe(document.body, { childList: true, subtree: true });
  }, sel);
  await act();
  return page.evaluate(() => (window as unknown as { __qaPearl: { before: number; replaced: number } }).__qaPearl);
}

async function onIt(launch: () => Promise<Session>, body: (s: Session) => Promise<void>): Promise<void> {
  const s = await launch();
  try { await body(s); } finally { await s.close(); }
}

test('pearl/frames: the pearl keeps its canvas and never jumps through every mood', async () => {
  await onIt(L.launch, async ({ page, cdp }) => {
    const pearl = page.locator(L.pearl);
    await expect(pearl).toBeVisible();
    const box = await pearl.boundingBox();
    if (!box) throw new Error('no pearl box');
    const rec = new Recorder(cdp, page);
    await rec.start();
    const r = await canvasesReplaced(page, L.pearl, async () => {
      for (const m of L.moods) {
        await page.waitForTimeout(L.dwellMs);
        await page.locator(L.mood(m)).click();
      }
      await page.waitForTimeout(L.dwellMs);
    });
    const frames = await rec.stop();
    test.info().annotations.push({ type: 'frames', description: `${frames.length} frames, max jump ${maxJump(frames, box).toFixed(1)}` });
    expect.soft(frames.length, 'the pearl was drawn while it moved').toBeGreaterThan(20);
    expect.soft(r.replaced, "the pearl's canvas is never replaced").toBe(0);
    expect.soft(flashes(frames, box), 'frames where the pearl flashed').toEqual([]);
    expect.soft(maxJump(frames, box), 'the largest frame-to-frame jump in the pearl').toBeLessThan(JUMP);
  });
});

test("pearl/frames: the spotlight's pearl keeps its canvas while he types", async () => {
  await onIt(SP.launch, async ({ page, cdp }) => {
    const pearl = page.locator(SP.pearl);
    await expect(pearl).toBeVisible();
    const box = await pearl.boundingBox();
    if (!box) throw new Error('no pearl box');
    await page.locator(SP.field).click();
    const rec = new Recorder(cdp, page);
    await rec.start();
    const r = await canvasesReplaced(page, SP.pearl, async () => {
      await page.keyboard.type('perf alerts', { delay: 60 });
      await page.waitForTimeout(400);
    });
    const frames = await rec.stop();
    expect.soft(r.replaced, "the spotlight's pearl canvas is never replaced while typing").toBe(0);
    expect.soft(flashes(frames, box), 'frames where the pearl flashed').toEqual([]);
    expect.soft(maxJump(frames, box), 'the largest frame-to-frame jump in the pearl').toBeLessThan(JUMP);
  });
});

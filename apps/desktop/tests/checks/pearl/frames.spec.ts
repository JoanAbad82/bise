// pearl/frames · bar ⛔1p (docs/desktop-bar.md) · his bug 2: "the pearl animation flickers".
// Two places draw a pearl. The window: real clicks move between threads while its pearls breathe.
// The capsule: the fake core plays listen -> think -> answer -> rest. Passes when no pearl canvas
// is ever replaced (a new canvas restarts the animation: a jump), no pearl frame goes blank or
// flashes, and no frame-to-frame jump is larger than the animation's own steps.
// Red on today's window: every redraw of the sidebar or the head gives each pearl a new canvas
// (winui.js pearlsIn); today's capsule keeps its one canvas (green there: a guard for the new app).
import path from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect, launchOld, launchPage, Recorder, flashes, maxJump, type Session } from '../../harness';

const W = { launch: (): Promise<Session> => launchOld('window'), pearl: '.w-side canvas.w-pearl', pearls: 'canvas.w-pearl', row: '.w-side .b-row', visits: ['checkout', 'telemetry', 'bise'] };
const C = { launch: (): Promise<Session> => launchPage(path.join(__dirname, 'old-talk.html'), { size: '1200x800' }), pearl: '#amb canvas.pearl', watchMs: 6000 };
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

test("pearl/frames: the window's pearls keep their canvas and never blank while he moves between threads", async () => {
  await onIt(W.launch, async ({ page, cdp }) => {
    const pearl = page.locator(W.pearl).first();
    await expect(pearl).toBeVisible();
    const box = await pearl.boundingBox();
    if (!box) throw new Error('no pearl box');
    const rec = new Recorder(cdp, page);
    await rec.start();
    const r = await canvasesReplaced(page, W.pearls, async () => {
      for (const name of W.visits) {
        await page.waitForTimeout(1000);
        const b = await page.locator(W.row).filter({ hasText: name }).first().boundingBox({ timeout: 2000 });
        if (b) await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
      }
      await page.waitForTimeout(1000);
    });
    const frames = await rec.stop();
    expect.soft(r.replaced, `pearl canvases replaced (of ${r.before}) while he moved between threads`).toBe(0);
    expect.soft(flashes(frames, box), 'frames where the pearl flashed').toEqual([]);
    expect.soft(maxJump(frames, box), 'the largest frame-to-frame jump in the pearl').toBeLessThan(JUMP);
  });
});

test("pearl/frames: the capsule's pearl through listen, think, answer, rest", async () => {
  await onIt(C.launch, async ({ page, cdp }) => {
    await page.waitForURL(/dev\.html/);
    const pearl = page.locator(C.pearl);
    await expect(pearl).toBeVisible();
    const box = await pearl.boundingBox();
    if (!box) throw new Error('no pearl box');
    const rec = new Recorder(cdp, page);
    await rec.start();
    const r = await canvasesReplaced(page, C.pearl, () => page.waitForTimeout(C.watchMs));
    const frames = await rec.stop();
    expect.soft(r.replaced, "the pearl's canvas is never replaced").toBe(0);
    expect.soft(flashes(frames, box), 'frames where the pearl flashed').toEqual([]);
    expect.soft(maxJump(frames, box), 'the largest frame-to-frame jump in the pearl').toBeLessThan(JUMP);
  });
});

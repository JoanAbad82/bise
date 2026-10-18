// artifacts/image-zoom · an image artifact zooms with a trackpad pinch (his m_22822 via ambient-lead
// m_22823), in bise's viewer, as the real hub frames it (image-pinch: the old check served a .png
// src on a scripted core and stayed green while the real app had no zoom; night-reds m_30621).
// The NEW app on the REAL core over the throwaway world (../world.ts): shop's main adds a 1600×1000
// PNG with sb artifact add; it is opened from the right bar at 1400. Passes when, light and dark:
//   - the frame's src is the hub's viewer, /a/<id>/view (never the file itself);
//   - a pinch (ctrl + wheel, as Chromium sends a trackpad pinch) zooms the image around the pointer
//     (the image point under it stays within 1 px once it fills the box), the window's own zoom
//     never moves (devicePixelRatio, visualViewport.scale), a '…%' chip shows;
//   - ⌘0 and esc with the focus in the window (a pinch never moves it): back to fit, still on the
//     project, the artifact open (the viewer's {bise: zoom} / the window's {bise: fit});
//   - two-finger scroll and space+drag pan it while zoomed;
//   - a double-click goes to 100% and back; esc in the frame goes back to fit, the artifact open;
//   - a box drawn while zoomed is a region in % of the image (the same image points it covers),
//     and its note button puts it in his message (notes on images kept: designer m_30627);
//   - a page artifact's frame (no zoom) leaves ⌘0 to the window: it goes to bise (architect m_30628).
// Shots for designer: fit, zoomed, box, pan × light, dark. Owner: image-pinch.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import type { FrameLocator, Page } from '@playwright/test';
import { PNG } from 'pngjs';
import { frameInput, test, expect } from '../../harness';
import { hubOf, launchReal, realWorld, worldSay, type World } from '../world';

const NW = 1600;
const NH = 1000;
const T = {
  field: '[data-testid="composer.field"]',
  frame: 'iframe[data-testid="artifact.page"]',
  open: '[data-testid="artifact.open"]',
};

/** A hero mock: warm bands, a grid every 100 px, a dark block in the middle (its detail to zoom on). */
function heroPng(): Buffer {
  const png = new PNG({ width: NW, height: NH });
  for (let y = 0; y < NH; y++) {
    for (let x = 0; x < NW; x++) {
      const i = (y * NW + x) * 4;
      const grid = x % 100 === 0 || y % 100 === 0;
      const block = x > 700 && x < 900 && y > 400 && y < 600;
      const band = Math.floor(y / 250) % 2 === 0;
      const c = grid ? [60, 60, 60] : block ? [184, 65, 107] : band ? [236, 222, 200] : [214, 196, 170];
      png.data[i] = c[0] ?? 0;
      png.data[i + 1] = c[1] ?? 0;
      png.data[i + 2] = c[2] ?? 0;
      png.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

/** The app on shop's thread at 1400 × 900 (the right bar shows), past the first-run setup. */
async function open(w: World, project: string) {
  const go = () => launchReal(w, { route: `project/${project}`, size: '1400x900' });
  let s = await go();
  const skip = s.page.locator('[data-testid="setup.skip"]');
  await s.page.locator(`${T.field}, [data-testid="setup.skip"]`).first().waitFor({ timeout: 15_000 }).catch(() => undefined);
  if (await skip.isVisible()) {
    await skip.click();
    await s.page.waitForTimeout(500);
    await s.close();
    s = await go();
  }
  await s.page.setViewportSize({ width: 1400, height: 900 });
  return s;
}

/** The right bar's row of the artifact titled `title`, clicked once it shows (it lands a moment after the line). */
async function openRow(page: Page, project: string, title: string): Promise<void> {
  const row = page.locator(`[data-testid^="app.right.artifact.${project}."]`, { hasText: title }).first();
  await expect(row, `the right bar lists '${title}'`).toBeVisible({ timeout: 45_000 });
  await row.click();
  await expect(page.locator(T.open)).toBeVisible({ timeout: 10_000 });
}

/** The image px under the screen point (x, y), from the img's drawn box (page coordinates). */
const imagePoint = async (f: FrameLocator, x: number, y: number) => {
  const r = await f.locator('.office-image img').boundingBox();
  if (r === null) throw new Error('no image');
  return { x: ((x - r.x) * NW) / r.width, y: ((y - r.y) * NH) / r.height, top: r.y };
};
const windowZoom = (page: Page) => page.evaluate(() => [window.devicePixelRatio, window.visualViewport?.scale ?? 1]);

for (const theme of ['light', 'dark'] as const) {
  test(`artifacts/image-zoom (real core): a pinch zooms the image in bise's viewer, never the window; ⌘0, esc, a double-click go back; a box drawn while zoomed is a note (${theme})`, async () => {
    test.setTimeout(240_000);
    const w = realWorld();
    const shop = hubOf(w, 'shop');
    const project = path.basename(path.dirname(shop.sock));
    const n = `z${String(Date.now() % 1_000_000)}`;
    const title = `hero ${n}`;
    writeFileSync(path.join(shop.ws, `hero-${n}.png`), heroPng());
    worldSay('shop', `[[bash: sb artifact add hero-${n}.png --title "${title}"]] added`);
    const s = await open(w, project);
    const shot = (name: string) => s.page.screenshot({ path: test.info().outputPath(`${name}-${theme}.png`) });
    try {
      const { page } = s;
      await page.emulateMedia({ colorScheme: theme });
      await openRow(page, project, title);
      const iframe = page.locator(T.frame);
      await expect(iframe, 'the hub frames an image in its viewer, /a/<id>/view').toHaveAttribute('src', /\/a\/[^/?#]+\/view(\?|$)/u);
      const f = page.frameLocator(T.frame);
      const box = f.locator('.office-image');
      await expect(box).toHaveAttribute('data-fit', 'true', { timeout: 15_000 });
      await expect(f.locator('.office-zoom.on'), 'no chip at fit').toHaveCount(0);
      await shot('fit');
      const before = await windowZoom(page);
      const b = await box.boundingBox();
      if (b === null) throw new Error('no box');
      // the pointer over the image, left of its middle
      const px = Math.round(b.x + b.width * 0.4);
      const py = Math.round(b.y + b.height * 0.45);
      // the pointer inside the viewer's frame (an OOPIF): the harness's offscreen window never
      // routes it there, so on the frame's own session, the iframe checked on top at each point
      // (harness/inputs.ts frameInput, architect m_30735); the window's keys stay page.keyboard
      const frame = page.frames().find((x) => /\/a\/[^/?#]+\/view(\?|$)/u.test(x.url()));
      if (frame === undefined) throw new Error('no viewer frame');
      const fi = await frameInput(page, frame);
      await fi.move(px, py);
      const pinch = async (ticks: number) => {
        for (let i = 0; i < ticks; i++) await fi.wheel(px, py, 0, -40, { ctrl: true });
      };

      await test.step('⌘0 with the focus in the window: back to fit, still on the project', async () => {
        await pinch(3);
        await expect(box).toHaveAttribute('data-fit', 'false');
        await page.keyboard.press('Meta+Digit0');
        await expect(box).toHaveAttribute('data-fit', 'true');
        await expect(page.locator(T.open), "⌘0 was the zoom's, never 'bise'").toBeVisible();
      });

      await test.step('a pinch zooms around the pointer, never the window; the chip says it', async () => {
        // while the image is still smaller than its box on an axis it stays centred there (as
        // Preview), so the point is held once it fills both
        await pinch(3);
        await expect(box).toHaveAttribute('data-fit', 'false');
        const at = await imagePoint(f, px, py);
        await pinch(3);
        await expect.poll(async () => (await imagePoint(f, px, py)).top, { timeout: 2000 }).not.toBe(at.top);
        const zoomed = await imagePoint(f, px, py);
        expect(Math.abs(zoomed.x - at.x), 'the image point under the pointer stays (x)').toBeLessThanOrEqual(1);
        expect(Math.abs(zoomed.y - at.y), 'the image point under the pointer stays (y)').toBeLessThanOrEqual(1);
        expect(await windowZoom(page), "the window's own zoom never moves").toEqual(before);
        await expect(f.locator('.office-zoom.on')).toHaveText(/^\d+%$/u);
        await shot('zoomed');
        // two fingers pan it while zoomed
        await fi.wheel(px, py, 0, 60);
        await expect.poll(async () => (await imagePoint(f, px, py)).top, { timeout: 2000 }).toBeLessThan(zoomed.top - 30);
      });

      await test.step('esc with the focus in the window: back to fit, the artifact open', async () => {
        await page.keyboard.press('Escape');
        await expect(box).toHaveAttribute('data-fit', 'true');
        await expect(page.locator(T.open), 'esc took the zoom, not the artifact').toBeVisible();
      });

      await test.step('a double-click: 100%, again: fit; esc in the frame: fit, the artifact open', async () => {
        const cx = Math.round(b.x + b.width / 2);
        const cy = Math.round(b.y + b.height / 2);
        await fi.dblclick(cx, cy);
        await expect(f.locator('.office-zoom')).toHaveText('100%');
        await expect(f.locator('.office-box'), 'a double-click leaves no box').toHaveCount(0);
        await fi.dblclick(cx, cy);
        await expect(box).toHaveAttribute('data-fit', 'true');
        await fi.move(px, py);
        await pinch(4);
        await expect(box).toHaveAttribute('data-fit', 'false');
        // the frame has the focus since the double-click: its own esc
        await fi.press('Escape');
        await expect(box).toHaveAttribute('data-fit', 'true');
        await expect(page.locator(T.open), "the frame's esc took the zoom, not the artifact").toBeVisible();
      });

      await test.step('a box drawn while zoomed is a region in % of the image, and goes in his message', async () => {
        await fi.move(px, py);
        await pinch(6);
        await expect(box).toHaveAttribute('data-fit', 'false');
        const a = { x: px - 60, y: py - 40 };
        const z = { x: px + 80, y: py + 50 };
        const ia = await imagePoint(f, a.x, a.y);
        const iz = await imagePoint(f, z.x, z.y);
        await fi.drag(a, z, 6);
        await expect(f.locator('.office-box')).toBeVisible();
        // read in the viewer's own frame (cross-origin: the window can't read it)
        const sel = (await frame.evaluate(() => {
          const win = window as unknown as { biseOffice?: { view?: { selection?: () => unknown } } };
          return win.biseOffice?.view?.selection?.() ?? null;
        })) as { kind: string; rect: { x: number; y: number; w: number; h: number } } | null;
        expect(sel?.kind, 'a region').toBe('region');
        const want = { x: (ia.x / NW) * 100, y: (ia.y / NH) * 100, w: ((iz.x - ia.x) / NW) * 100, h: ((iz.y - ia.y) / NH) * 100 };
        for (const k of ['x', 'y', 'w', 'h'] as const) expect(Math.abs((sel?.rect[k] ?? -1) - want[k]), `the box's ${k} in % of the image`).toBeLessThanOrEqual(0.3);
        await shot('box');
        const btn = f.locator('.office-note-btn');
        await expect(btn, 'the note button offers the box').toBeVisible();
        const bb = await btn.boundingBox();
        if (bb === null) throw new Error('no note button');
        await fi.click(Math.round(bb.x + bb.width / 2), Math.round(bb.y + bb.height / 2));
        await expect(page.locator('[data-testid^="composer.attach."][data-kind="anchor"]').first(), 'the box is an attachment in his message').toBeVisible({ timeout: 5000 });
      });

      await test.step('space+drag pans while zoomed, no box', async () => {
        // a click in the frame: the focus is its own again (the composer took it with the note)
        await fi.click(px, py);
        await fi.press('Escape');
        await fi.move(px, py);
        await pinch(6);
        await expect(box).toHaveAttribute('data-fit', 'false');
        const t0 = await imagePoint(f, px, py);
        await fi.keyDown('Space');
        await expect(box).toHaveClass(/panning/u);
        // up: a pinch around a point above the middle leaves the image near its top edge, where
        // a drag down is held (never a gap at an edge)
        await fi.down(px, py);
        for (let i = 1; i <= 5; i++) await fi.move(px, py - i * 16);
        await shot('pan');
        await fi.up(px, py - 80);
        await fi.keyUp('Space');
        await expect(f.locator('.office-box'), 'a space+drag draws no box').toHaveCount(0);
        const t1 = await imagePoint(f, px, py);
        expect(t0.top - t1.top, 'the image followed the drag up').toBeGreaterThan(60);
        expect(await windowZoom(page)).toEqual(before);
      });
    } finally {
      await s.close();
    }
  });
}

test("artifacts/image-zoom (real core): a page artifact's frame has no zoom, ⌘0 stays the window's", async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const shop = hubOf(w, 'shop');
  const project = path.basename(path.dirname(shop.sock));
  const n = `h${String(Date.now() % 1_000_000)}`;
  const title = `plan ${n}`;
  writeFileSync(path.join(shop.ws, `plan-${n}.html`), `<!doctype html><title>${title}</title><h1>plan ${n}</h1><p>three steps.</p>`);
  worldSay('shop', `[[bash: sb artifact add plan-${n}.html --title "${title}"]] added`);
  const s = await open(w, project);
  try {
    const { page } = s;
    await openRow(page, project, title);
    await expect(page.locator(T.frame)).toBeVisible();
    await page.keyboard.press('Meta+Digit0');
    await expect(page.locator(T.open), "⌘0 is the window's 'bise' with no zoom claimed").toHaveCount(0, { timeout: 5000 });
  } finally {
    await s.close();
  }
});

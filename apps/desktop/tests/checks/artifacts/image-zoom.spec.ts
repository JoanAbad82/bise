// artifacts/image-zoom · an image artifact zooms with a trackpad pinch (his m_22822 via ambient-lead
// m_22823). The REAL window on the scripted core, with a fake pages server serving a 1600×1000 PNG
// as the artifact's frame_url, opened from the right bar into the side column at 1400. Passes when,
// light and dark: a pinch (ctrl + wheel, as Chromium sends a trackpad pinch) zooms the image around
// the pointer (the image point under it stays within 1 px once it fills the box), the window's own zoom never moves
// (devicePixelRatio, visualViewport.scale); a '…%' chip shows while zoomed; two-finger scroll pans
// the image; esc goes back to fit and the artifact stays open (a second esc would close it); a
// double-click goes to 100% and back; ⌘0 while zoomed goes back to fit and stays on the project
// (never bise). Shots for designer: zoom-<theme>.png. Owner: amb-win.
import type { Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { PNG } from 'pngjs';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const NW = 1600;
const NH = 1000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const agent = (name: string, status: string) => ({ name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [] });

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

async function pagesServer(): Promise<{ url: string; server: Server }> {
  const body = heroPng();
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'image/png' });
    res.end(body);
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`, server };
}

const world = (theme: string, pages: string) => [
  prefs(theme),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main', 'idle'), agent('perf', 'idle')] },
  { ev: 'agents', project: HOME, agents: [agent('main', 'idle')] },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: NOW - 5 * MIN, kind: 'agent', text: 'the new hero image, 1600×1000.' }], before: null, more: false },
  {
    ev: 'artifacts',
    project: P,
    items: [{ id: 'hero', kind: 'image', title: 'hero image, new crop', agent: 'perf', version: 1, at_ms: NOW - 5 * MIN, url: '/nowhere/storefront/hero.png', frame_url: `${pages}/a/hero/1/hero.png`, new: true }],
  },
];

/** The image px under the screen point (x, y), from the img's drawn box. */
const imagePoint = async (page: Page, x: number, y: number) => {
  const r = await page.getByTestId('artifact.image.img').boundingBox();
  if (r === null) throw new Error('no image');
  return { x: ((x - r.x) * NW) / r.width, y: ((y - r.y) * NH) / r.height, top: r.y };
};
const windowZoom = (page: Page) => page.evaluate(() => [window.devicePixelRatio, window.visualViewport?.scale ?? 1]);

for (const theme of ['light', 'dark']) {
  test(`artifacts/image-zoom: a pinch zooms the image around the pointer, never the window; scroll pans, esc, ⌘0 and a double-click go back (${theme})`, async () => {
    test.setTimeout(90_000);
    const pages = await pagesServer();
    const core = new FakeCore(world(theme, pages.url) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `project/${P}`, size: '1400x900' });
    try {
      const { page } = s;
      await page.setViewportSize({ width: 1400, height: 900 });
      const row = page.getByTestId(`app.right.artifact.${P}.hero`);
      await expect(row).toBeVisible({ timeout: 10_000 });
      await row.click();
      const box = page.getByTestId('artifact.image');
      await expect(box).toBeVisible({ timeout: 5000 });
      await expect(box).toHaveAttribute('data-fit', 'true', { timeout: 5000 });
      await expect(page.getByTestId('artifact.page'), 'an image is drawn, never framed').toHaveCount(0);
      await expect(page.getByTestId('artifact.zoom'), 'no chip at fit').toHaveCount(0);
      const before = await windowZoom(page);
      const b = await box.boundingBox();
      if (b === null) throw new Error('no box');
      // the pointer over the image, left of its middle
      const px = Math.round(b.x + b.width * 0.4);
      const py = Math.round(b.y + b.height * 0.45);
      await page.mouse.move(px, py);
      const pinch = async (ticks: number) => {
        await page.keyboard.down('Control');
        for (let i = 0; i < ticks; i++) await page.mouse.wheel(0, -40);
        await page.keyboard.up('Control');
      };
      // a pinch out: Chromium's wheel with ctrlKey. While the image is still smaller than its box on
      // an axis it stays centred there (as Preview), so the point is held once it fills both
      await pinch(3);
      await expect(box).toHaveAttribute('data-fit', 'false');
      const at = await imagePoint(page, px, py);
      await pinch(3);
      await expect.poll(async () => (await imagePoint(page, px, py)).top, { timeout: 2000 }).not.toBe(at.top);
      const zoomed = await imagePoint(page, px, py);
      expect(Math.abs(zoomed.x - at.x), 'the image point under the pointer stays (x)').toBeLessThanOrEqual(1);
      expect(Math.abs(zoomed.y - at.y), 'the image point under the pointer stays (y)').toBeLessThanOrEqual(1);
      expect(await windowZoom(page), "the window's own zoom never moves").toEqual(before);
      await expect(page.getByTestId('artifact.zoom')).toHaveText(/^\d+%$/u);
      await page.screenshot({ path: test.info().outputPath(`zoom-${theme}.png`) });
      // two fingers pan it while zoomed
      await page.mouse.wheel(0, 60);
      await expect.poll(async () => (await imagePoint(page, px, py)).top, { timeout: 2000 }).toBeLessThan(zoomed.top - 30);
      // esc: back to fit, the artifact still open
      await page.keyboard.press('Escape');
      await expect(box).toHaveAttribute('data-fit', 'true');
      await expect(page.getByTestId('artifact.open'), 'esc took the zoom, not the artifact').toBeVisible();
      // a double-click: 100%, again: fit
      await box.dblclick({ position: { x: b.width / 2, y: b.height / 2 } });
      await expect(page.getByTestId('artifact.zoom')).toHaveText('100%');
      await box.dblclick({ position: { x: b.width / 2, y: b.height / 2 } });
      await expect(box).toHaveAttribute('data-fit', 'true');
      // ⌘0 while zoomed: back to fit, still on the project (⌘0 is 'bise' only when nothing is zoomed)
      await page.keyboard.down('Control');
      await page.mouse.wheel(0, -120);
      await page.keyboard.up('Control');
      await expect(box).toHaveAttribute('data-fit', 'false');
      await page.keyboard.press('Meta+Digit0');
      await expect(box).toHaveAttribute('data-fit', 'true');
      await expect(page.getByTestId('artifact.open')).toBeVisible();
      expect(await windowZoom(page)).toEqual(before);
    } finally {
      await s.close();
      core.dispose();
      pages.server.close();
    }
  });
}

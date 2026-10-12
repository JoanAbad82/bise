// app/resize · his try a43609b2 (main m_19371): « les deux sidebars … puissent être resized en hoverant
// l'espèce de border et en cliquant et en draguant ». Designer m_19374: no handle at rest, an 8 px
// hit area on the border; after 120 ms of hover a 2 px line and col-resize; live resize; a
// double-click goes back to the default (sidebar 240, panel 320); the sidebar 200-400, folded under
// 160 and opened again at 200 by a drag from the window's left edge; the panel 320 to 55%; the main
// column never under 520; widths kept across a reload. Passes on FakeCore at 1400 and 1100, light
// and dark. Frames: resize-<theme>-{side-hover,side-drag,panel-hover,folded}.png at 1100. Owner: amb-win.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const SHOP = 'shop-5e6f7a8b';
const prefs = (theme: string) => ({
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
const home = { project: HOME, name: 'bise', path: '/nowhere/bise', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true };
const shop = { project: SHOP, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true };
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: Date.now() - 600_000, waits: 0, watching: [] });
const world = (theme: string) => [
  prefs(theme),
  { ev: 'projects', projects: [home, shop] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere/bise', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  { ev: 'welcome', project: SHOP, proto: 1, workspace: '/nowhere/shop', name: 'shop' },
  { ev: 'agents', project: SHOP, agents: [agent('main')] },
];

const widthOf = async (page: Page, sel: string): Promise<number> => Math.round((await page.locator(sel).first().boundingBox())?.width ?? 0);
const centre = async (page: Page, id: string): Promise<{ x: number; y: number }> => {
  const b = await page.getByTestId(id).boundingBox();
  return { x: (b?.x ?? 0) + (b?.width ?? 0) / 2, y: (b?.y ?? 0) + (b?.height ?? 0) / 2 };
};
const drag = async (page: Page, id: string, dx: number, shot?: string): Promise<void> => {
  const c = await centre(page, id);
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  await page.mouse.move(c.x + dx / 2, c.y, { steps: 4 });
  await page.mouse.move(c.x + dx, c.y, { steps: 4 });
  if (shot !== undefined) await page.screenshot({ path: test.info().outputPath(shot) });
  await page.mouse.up();
};

for (const theme of ['light', 'dark']) {
  test(`app/resize: the sidebar and the panel resize by their border, fold, reset and stay (${theme})`, async () => {
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `project/${SHOP}`, size: '1400x800' });
    try {
      const { page } = s;
      // the limits read the window's width: make it 1400 whatever the launch gave
      await page.setViewportSize({ width: 1400, height: 800 });
      expect(await page.evaluate(() => window.innerWidth)).toBe(1400);
      const side = page.getByTestId('app.split.side');
      const panel = page.getByTestId('app.split.panel');
      await expect(side).toBeVisible({ timeout: 10_000 });
      await expect(panel).toBeVisible();
      expect(await widthOf(page, '.app-shell .b-side'), 'the sidebar starts at 240').toBe(240);
      expect(await widthOf(page, '.app-panel'), 'the panel starts at 320').toBe(320);

      // no handle at rest; after 120 ms of hover, a 2 px line and col-resize
      await expect(side).not.toHaveClass(/is-hot/);
      const c = await centre(page, 'app.split.side');
      await page.mouse.move(c.x, c.y);
      await expect(side).toHaveClass(/is-hot/, { timeout: 1000 });
      expect(await side.evaluate((el) => getComputedStyle(el).cursor)).toBe('col-resize');
      expect(await side.evaluate((el) => getComputedStyle(el, '::after').width)).toBe('2px');

      // live resize; at most 400; under 160 it folds; a drag from the left edge opens it at 200
      await drag(page, 'app.split.side', 80);
      expect(await widthOf(page, '.app-shell .b-side'), 'dragged 80 px wider').toBe(320);
      await drag(page, 'app.split.side', 300);
      expect(await widthOf(page, '.app-shell .b-side'), 'never over 400').toBe(400);
      await side.dblclick();
      expect(await widthOf(page, '.app-shell .b-side'), 'a double-click: back to 240').toBe(240);
      await drag(page, 'app.split.side', -120);
      await expect(page.getByTestId('app.root'), 'under 160: folded like ⌘\\').toHaveClass(/no-side/);
      await drag(page, 'app.split.side', 80);
      await expect(page.getByTestId('app.root')).not.toHaveClass(/no-side/);
      expect(await widthOf(page, '.app-shell .b-side'), 'opened again at 240 (its kept width, at least 200)').toBeGreaterThanOrEqual(200);

      // the panel: 320 at least, 55% of the window at most, a double-click back to 320
      await drag(page, 'app.split.panel', -100);
      expect(await widthOf(page, '.app-panel'), 'dragged 100 px wider').toBe(420);
      await drag(page, 'app.split.panel', -600);
      const max = await widthOf(page, '.app-panel');
      expect(max, 'never over 55%').toBeLessThanOrEqual(Math.round(1400 * 0.55));
      expect(1400 - max - (await widthOf(page, '.app-shell .b-side')), 'the main column keeps 520').toBeGreaterThanOrEqual(520);
      await panel.dblclick();
      expect(await widthOf(page, '.app-panel'), 'a double-click: back to 320').toBe(320);

      // kept: a reload comes back at the widths he left
      await drag(page, 'app.split.side', 40);
      await drag(page, 'app.split.panel', -60);
      const sw = await widthOf(page, '.app-shell .b-side');
      await page.waitForTimeout(600);
      await page.reload();
      await expect(page.getByTestId('app.split.side')).toBeVisible({ timeout: 10_000 });
      expect(await widthOf(page, '.app-shell .b-side'), 'kept across a reload').toBe(sw);
      expect(await widthOf(page, '.app-panel'), 'kept across a reload').toBe(380);

      // frames at 1100: hover and drag on each border, the folded sidebar
      await page.setViewportSize({ width: 1100, height: 720 });
      await page.getByTestId('app.split.side').dblclick();
      await page.getByTestId('app.split.panel').dblclick();
      const h = await centre(page, 'app.split.side');
      await page.mouse.move(h.x, h.y);
      await expect(page.getByTestId('app.split.side')).toHaveClass(/is-hot/, { timeout: 1000 });
      await page.screenshot({ path: test.info().outputPath(`resize-${theme}-side-hover.png`) });
      await drag(page, 'app.split.side', 40, `resize-${theme}-side-drag.png`);
      const p = await centre(page, 'app.split.panel');
      await page.mouse.move(p.x, p.y);
      await expect(page.getByTestId('app.split.panel')).toHaveClass(/is-hot/, { timeout: 1000 });
      await page.screenshot({ path: test.info().outputPath(`resize-${theme}-panel-hover.png`) });
      await drag(page, 'app.split.side', -200);
      await expect(page.getByTestId('app.root')).toHaveClass(/no-side/);
      await page.mouse.move(600, 300);
      await page.screenshot({ path: test.info().outputPath(`resize-${theme}-folded.png`) });
    } finally {
      await s.close();
    }
  });
}

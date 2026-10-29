// SCRATCH (bim-review, not landed): a newcomer's pop and glitter (bim-3d 29263330d, designer m_49890):
// the side tile's office at its fit and the home's town at its fit, light and dark, a frame every
// ~100 ms over ~1.8 s from the new row. Shots to $GLITTER_SHOTS.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { PNG } from 'pngjs';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { agent, office } from '../../../src/bims/fixtures';
import { P, rowsOf, settle, showOffice, sleep, world } from './world';

const out = (): string => {
  const d = process.env['GLITTER_SHOTS'] ?? test.info().outputPath('');
  mkdirSync(d, { recursive: true });
  return d;
};

async function crop(page: Page, box: { x: number; y: number; width: number; height: number }): Promise<Buffer> {
  const png = PNG.sync.read(await page.screenshot());
  const k = png.width / (await page.evaluate(() => window.innerWidth));
  const x0 = Math.round(box.x * k), y0 = Math.round(box.y * k), w = Math.round(box.width * k), h = Math.round(box.height * k);
  const o = new PNG({ width: w, height: h });
  PNG.bitblt(png, o, x0, y0, w, h, 0, 0);
  return PNG.sync.write(o);
}

/** the new row, then frames every ~100 ms for 1.9 s, then one at +2.5 s (nothing left behind) */
async function popStrip(page: Page, core: FakeCore, testId: string, name: string): Promise<void> {
  const box = await page.getByTestId(testId).first().boundingBox();
  if (box === null) throw new Error(`no ${testId}`);
  writeFileSync(path.join(out(), `${name}-before.png`), await crop(page, box));
  const grown = { ...office, agents: [...office.agents, agent('newcomer', { status: 'working' })] };
  const t0 = Date.now();
  await core.send(rowsOf(grown) as never);
  for (let i = 0; i < 20; i++) {
    const shot = await crop(page, box);
    writeFileSync(path.join(out(), `${name}-${String(i).padStart(2, '0')}-${String(Date.now() - t0)}ms.png`), shot);
    const wait = 100 * (i + 1) - (Date.now() - t0);
    if (wait > 0) await sleep(wait);
  }
  await sleep(Math.max(0, 2500 - (Date.now() - t0)));
  writeFileSync(path.join(out(), `${name}-after-${String(Date.now() - t0)}ms.png`), await crop(page, box));
}

for (const theme of ['light', 'dark'] as const) {
  test(`side tile office at the fit: a newcomer's pop, ${theme}`, async () => {
    test.setTimeout(120_000);
    const core = new FakeCore(world(office, theme) as never);
    const s = await launchDesktop({ core, route: `project/${P}`, size: '1400x900' });
    try {
      await expect(s.page.getByTestId('app.outer.world').or(s.page.getByTestId('app.outer.agents.cube'))).toBeVisible({ timeout: 30_000 });
      await showOffice(s);
      const fit = s.page.getByTestId('app.outer.world').getByTestId('app.right.bims.fit');
      if ((await fit.count()) > 0) await fit.first().click();
      await settle(s, 1500, 15_000);
      await popStrip(s.page, core, 'app.outer.world', `tile-${theme}`);
    } finally {
      await s.close();
    }
  });

  test(`the home's town at the fit: a newcomer's pop, ${theme}`, async () => {
    test.setTimeout(120_000);
    const core = new FakeCore(world(office, theme) as never);
    const s = await launchDesktop({ core, route: 'bise', size: '1400x900' });
    try {
      await expect(s.page.getByTestId('app.right.bims.town').first()).toBeVisible({ timeout: 30_000 });
      await sleep(5000);
      await popStrip(s.page, core, 'app.right.bims.town', `town-${theme}`);
    } finally {
      await s.close();
    }
  });
}

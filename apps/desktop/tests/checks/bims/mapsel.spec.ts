// bims/mapsel · the office's map chip (brief bims-mapsel, Gabriel: « un petit selector de map qui
// prend pas trop de place, et qui a l'air discret en bas à gauche de la carte des bims, et mettre
// le bouton "fit" en bas à droite »), on FakeCore rows from src/bims/fixtures.ts, off screen.
// Passes when, at 320 and wide, light and dark:
//   - the chip sits in the office's bottom-left corner with the map's name ('Loft' never picked);
//   - a click opens the ds menu upward from it: one row per ready map, the current one ✓;
//   - a pick sends prefs_set bims.map.<project> (as /bims), the office redraws on it;
//   - zoomed, '⤢ fit' sits in the bottom-right corner; no tag or pill under either chip.
// Shots: .harness-cache/bims-shots (index.html), for bims then designer to sign. Owner: bims-mapsel.
import { test, expect } from '../../harness';
import type { Session } from '../../harness';
import { office } from '../../../src/bims/fixtures';
import { P, open, settle, shotOf, showOffice, sleep, trackpad, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 180_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

const KEY = `bims.map.${P}`;

/** the office and what floats from it (the menu opens upward, past the office's top) */
async function shot(s: Session, file: string, title: string, says: string, withMenu = false): Promise<void> {
  const box = await s.page.getByTestId('app.right.bims').boundingBox();
  if (box === null) throw new Error(`nothing to shoot for ${file}`);
  let b = { ...box };
  if (withMenu) {
    const m = await s.page.getByTestId('app.right.bims.map.menu').boundingBox();
    if (m !== null) {
      const top = Math.min(b.y, m.y);
      const left = Math.min(b.x, m.x);
      const right = Math.max(b.x + b.width, m.x + m.width);
      b = { x: left, y: top, width: right - left, height: b.y + b.height - top };
    }
  }
  await shotOf(s.cdp, s.page, { x: b.x - 8, y: b.y - 8, width: b.width + 16, height: b.height + 16 }, file);
  shots.push({ file, title, says });
}

/** no tag (a label, a pill, a card) over either corner chip */
const underChips = (s: Session): Promise<string[]> =>
  s.page.evaluate(() => {
    const chips = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="app.right.bims.mapsel"], [data-testid="app.right.bims.fit"]')).map((e) => e.getBoundingClientRect());
    const out: string[] = [];
    for (const t of Array.from(document.querySelectorAll<HTMLElement>('.bims-tag, .bims-card'))) {
      if (t.style.visibility === 'hidden') continue;
      const r = t.getBoundingClientRect();
      if (r.width === 0) continue;
      for (const c of chips) if (r.left < c.right && c.left < r.right && r.top < c.bottom && c.top < r.bottom) out.push(t.textContent);
    }
    return out;
  });

for (const theme of ['light', 'dark'] as const) {
  for (const wide of [false, true]) {
    const w = wide ? '640' : '320';
    test(`(mapsel) the map chip bottom left, fit bottom right, ${w}, ${theme}`, async () => {
      const { s, core } = await open(office, { theme, width: 1600 });
      const { page } = s;
      try {
        await showOffice(s);
        await page.getByTestId(wide ? 'app.right.agents.width.wide' : 'app.right.agents.width.narrow').click();
        await settle(s, 800, 8000);
        const box = page.getByTestId('app.right.bims');
        const chip = page.getByTestId('app.right.bims.map');

        await test.step('at rest: the chip in the bottom-left corner, the map\'s name', async () => {
          await expect(chip).toHaveText('Loft');
          const o = await box.boundingBox();
          const c = await chip.boundingBox();
          if (o === null || c === null) throw new Error('no office or chip');
          expect(c.x - o.x, 'its left inset').toBeLessThan(12);
          expect(o.y + o.height - (c.y + c.height), 'its bottom inset').toBeLessThan(12);
          expect(await underChips(s), 'no tag under it').toEqual([]);
          await page.mouse.move(5, 300);
          await shot(s, `mapsel-rest-${w}-${theme}.png`, `at rest, ${w}, ${theme}`, "the map's name and its caret, quiet, bottom left; nothing at the bottom right");
        });

        await test.step('a click opens the menu upward, the loft checked', async () => {
          await chip.click();
          const menu = page.getByTestId('app.right.bims.map.menu');
          await expect(menu).toBeVisible();
          await expect(page.getByTestId('app.right.bims.map.loft')).toHaveAttribute('aria-checked', 'true');
          const m = await menu.boundingBox();
          const c = await chip.boundingBox();
          if (m === null || c === null) throw new Error('no menu');
          expect(m.y + m.height, 'over the chip').toBeLessThanOrEqual(c.y);
          await shot(s, `mapsel-menu-${w}-${theme}.png`, `the menu open, ${w}, ${theme}`, "/bims's rows, two lines each, the Loft ✓, upward from the chip", true);
        });

        await test.step('a pick: prefs_set as /bims, the office redraws on it', async () => {
          await page.getByTestId('app.right.bims.map.workshop').click();
          await core.waitCmd((c) => c.cmd === 'prefs_set' && c.key === KEY && c.value === 'workshop');
          await expect(page.getByTestId('app.right.bims.map.menu')).toHaveCount(0);
          // the hub echoes his prefs: every window draws the pick
          // (sent again until the window has it: one 320-dark run of 4 kept the loft after a single send)
          await expect
            .poll(async () => {
              await core.send({ ev: 'prefs', prefs: { onboarded: true, theme, excluded_apps: [], bims: { map: { [P]: 'workshop' } } } } as never);
              await sleep(500);
              return box.getAttribute('data-want');
            }, { timeout: 10_000 })
            .toBe('workshop');
          await expect(box).toHaveAttribute('data-map', 'workshop', { timeout: 10_000 });
          await expect(chip).toHaveText('Workshop');
          await sleep(500);
          await settle(s, 800, 8000);
          await page.mouse.move(5, 300);
          await shot(s, `mapsel-picked-${w}-${theme}.png`, `after a pick, ${w}, ${theme}`, 'the Workshop drawn, the chip says it');
        });

        await test.step("zoomed: '⤢ fit' bottom right, no tag under the chips", async () => {
          const o = await box.boundingBox();
          if (o === null) throw new Error('no office');
          for (let i = 0; i < 4; i++) await trackpad(s.cdp, o.x + o.width / 2, o.y + o.height * 0.7, { dy: -60, pinch: true });
          const fit = page.getByTestId('app.right.bims.fit');
          await expect(fit).toBeVisible();
          const f = await fit.boundingBox();
          if (f === null) throw new Error('no fit');
          expect(o.x + o.width - (f.x + f.width), 'its right inset').toBeLessThan(12);
          expect(o.y + o.height - (f.y + f.height), 'its bottom inset').toBeLessThan(12);
          await settle(s, 800, 8000);
          expect(await underChips(s), 'no tag under either chip').toEqual([]);
          await page.mouse.move(5, 300);
          await shot(s, `mapsel-zoomed-${w}-${theme}.png`, `zoomed, ${w}, ${theme}`, "'⤢ fit' bottom right, the map chip bottom left; the off-frame pills along the edges, clear of both");
        });

        await test.step('an agent opened: the camera follows it, the off-frame pills at the edges clear the chips', async () => {
          await page.getByTestId('app.right.agent.signup-perf').click();
          await sleep(500);
          await settle(s, 800, 8000);
          expect(await underChips(s), 'no pill under either chip').toEqual([]);
          await page.mouse.move(5, 300);
          await shot(s, `mapsel-edge-${w}-${theme}.png`, `edge pills, ${w}, ${theme}`, "signup-perf followed; the '?' pills out of the frame along the edges, slid past the chips near the bottom corners");
        });
      } finally {
        await s.close().catch(() => undefined);
        core.dispose();
      }
    });
  }
}

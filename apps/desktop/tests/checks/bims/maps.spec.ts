// bims/maps · the office's map per project (page bims-maps v7: « un menu /bims où on peut choisir
// l'ambiance de la map pour le projet »), on FakeCore rows from src/bims/fixtures.ts, off screen.
// Passes when, light and dark:
//   - a project he never picked a map for draws the loft (data-map, data-want 'loft');
//   - '/bims ' in the composer opens the ds Picker on the maps: one row per ready map, its name and
//     its mood, the project's one ✓, a tip on each; a click on a row sends prefs_set
//     bims.map.<project> = its id at once (no ⏎), never a slash line to the hub;
//   - his prefs (what every window reads) saying another map: the office wants it (data-want) and
//     draws it once its chunk made it ready, the loft until then (data-map), and after a reload too.
// The crossfade itself (~300 ms, a cut under reduced motion): Office.test.tsx. Shots: the picker,
// for bims to sign (.harness-cache/bims-shots). Owner: maps-a.
import { test, expect } from '../../harness';
import { office } from '../../../src/bims/fixtures';
import { P, open, shotOf, showOffice, sleep, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 90_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

const KEY = `bims.map.${P}`;

for (const theme of ['light', 'dark'] as const) {
  test(`(maps) /bims picks the project's map, ${theme}`, async () => {
    const { s, core } = await open(office, { theme });
    const { page } = s;
    try {
      await showOffice(s);
      const box = page.getByTestId('app.right.bims');
      await expect(box, 'never picked: the loft').toHaveAttribute('data-map', 'loft');
      await expect(box).toHaveAttribute('data-want', 'loft');

      await test.step('/bims opens the maps, the loft checked', async () => {
        await page.getByTestId('composer.field').click();
        await page.keyboard.type('/bims ');
        const row = page.getByTestId('composer.pick.arg.loft');
        await expect(row).toBeVisible({ timeout: 3000 });
        await expect(row).toContainText('Loft');
        await expect(row, 'its mood under its name').toContainText('kitchen island');
        await expect(row, 'the current map has its ✓').toContainText('✓');
        expect(await row.getAttribute('data-tip') ?? (await row.getAttribute('title')) ?? '', 'a tip says what it is').not.toBe('');
        const pick = await page.getByTestId('composer.pick').boundingBox();
        if (pick !== null) {
          await shotOf(s.cdp, page, { x: pick.x - 8, y: pick.y - 8, width: pick.width + 16, height: pick.height + 16 }, `maps-picker-${theme}.png`);
          shots.push({ file: `maps-picker-${theme}.png`, title: `/bims, ${theme}`, says: 'one row per ready map: its name, its mood, the project\'s one checked' });
        }
        await row.click();
        await core.waitCmd((c) => c.cmd === 'prefs_set' && c.key === KEY && c.value === 'loft');
        expect(core.cmds().filter((c) => c.cmd === 'slash'), 'never a slash line to the hub').toEqual([]);
        await expect(page.getByTestId('composer.field'), 'the line is gone once picked').toHaveText('');
      });

      await test.step('his prefs pick another map: the office wants it', async () => {
        await core.send({ ev: 'prefs', prefs: { onboarded: true, theme, excluded_apps: [], bims: { map: { [P]: 'kyoto' } } } } as never);
        await expect(box).toHaveAttribute('data-want', 'kyoto', { timeout: 5000 });
        // ready once maps-b lands Kyoto; the loft until then
        await expect(box).toHaveAttribute('data-map', /^(kyoto|loft)$/u);
        await sleep(400);
        await page.reload();
        await showOffice(s);
        await expect(page.getByTestId('app.right.bims'), 'kept across a reload').toHaveAttribute('data-want', 'kyoto', { timeout: 10_000 });
      });
    } finally {
      await s.close().catch(() => undefined);
      core.dispose();
    }
  });
}

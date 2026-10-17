// bims/icon · the AGENTS head's bims cube (moved from the title bar, bar-main) (Gabriel's pick D on page bims-icon, designer m_28579) and
// the loft on the typed map interface (maps-a), off screen on FakeCore rows. Passes when the icon
// is the accent box with its two eyes cut out by a mask, at rest, hovered and open (pressed), light
// and dark; and the loft draws at
// 320 and wide, light and dark. Shots for designer (the cube at rest / hover /
// open, a 4x crop) and bims (the loft): .harness-cache/bims-shots. Owner: maps-a.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { test, expect, type Session } from '../../harness';
import { office } from '../../../src/bims/fixtures';
import { SHOTS, open, settle, shotOf, showOffice, sleep, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 120_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

async function shot(s: Session, testId: string, file: string, title: string, says: string, pad = 0): Promise<void> {
  const b = await s.page.getByTestId(testId).boundingBox();
  if (b === null) throw new Error(`no ${testId} for ${file}`);
  await shotOf(s.cdp, s.page, { x: b.x - pad, y: b.y - pad, width: b.width + 2 * pad, height: b.height + 2 * pad }, file);
  shots.push({ file, title, says });
}

/** a shot scaled 4x, nearest pixel (designer's crop) */
function times4(file: string, out: string): void {
  const src = PNG.sync.read(readFileSync(path.join(SHOTS, file)));
  const dst = new PNG({ width: src.width * 4, height: src.height * 4 });
  for (let y = 0; y < dst.height; y++) {
    for (let x = 0; x < dst.width; x++) {
      const i = ((y >> 2) * src.width + (x >> 2)) * 4;
      const j = (y * dst.width + x) * 4;
      for (let c = 0; c < 4; c++) dst.data[j + c] = src.data[i + c] ?? 0;
    }
  }
  writeFileSync(path.join(SHOTS, out), PNG.sync.write(dst));
}

for (const theme of ['light', 'dark'] as const) {
  // the cube in the AGENTS head (his ask, main m_28901; it was the title bar's): rest, hover, open
  test(`(icon) the bims cube in the AGENTS head, ${theme}`, async () => {
    const { s, core } = await open(office, { theme, width: 1600 });
    try {
      const btn = s.page.getByTestId('app.right.agents.bims');
      const tag = theme;
      await expect(btn.locator('svg mask circle'), 'two eyes cut out by a mask').toHaveCount(2);
      await expect(btn.locator('svg polygon')).toHaveCount(3);
      await s.page.mouse.move(5, 300);
      await sleep(300);
      await shot(s, 'app.right.agents.bims', `icon-${tag}-rest.png`, `the cube ${tag}: rest`, "the accent box, its eyes cut out, 'the bims' in the accent", 2);
      times4(`icon-${tag}-rest.png`, `icon-${tag}-rest-4x.png`);
      shots.push({ file: `icon-${tag}-rest-4x.png`, title: `the cube ${tag}: 4x`, says: 'the glyph at 4x, nearest pixel' });
      await btn.hover();
      await sleep(600);
      await shot(s, 'app.right.agents.bims', `icon-${tag}-hover.png`, `the cube ${tag}: hover`, "the hover tint, through the eyes too; the tip");
      await showOffice(s);
      await s.page.mouse.move(5, 300);
      await sleep(400);
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
      await shot(s, 'app.right.agents.bims', `icon-${tag}-open.png`, `the cube ${tag}: open`, 'the pressed tint shows through the eyes, the glyph still the accent', 2);
    } finally {
      await s.close().catch(() => undefined);
      core.dispose();
    }
  });

  test(`(loft) the loft on the map interface, 320 and wide, ${theme}`, async () => {
    const { s, core } = await open(office, { theme, width: 1600 });
    try {
      await showOffice(s);
      await settle(s);
      await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-map', 'loft');
      await shot(s, 'app.right.bims', `loft-${theme}-320.png`, `the loft, 320, ${theme}`, 'as before the maps: the same room, desks, island, lounge');
      await s.page.getByTestId('app.right.agents.width.wide').click();
      await sleep(800);
      await settle(s);
      await shot(s, 'app.right.bims', `loft-${theme}-wide.png`, `the loft, wide, ${theme}`, 'as before the maps, with a little ground past it');
    } finally {
      await s.close().catch(() => undefined);
      core.dispose();
    }
  });
}

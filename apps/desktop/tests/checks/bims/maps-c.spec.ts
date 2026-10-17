// bims/maps-c · the patio, the haveli, the tropical house, the Cyclades and the Sahel (page
// bims-maps v5, chunk C), on FakeCore rows from src/bims/fixtures.ts, off screen. Passes when, for
// each map, light and dark: his prefs pick it and the office draws it (data-map), at stages 0, 5,
// 9 and 14, at 320 and wide, the corner tip naming the level. Shots for bims to sign:
// .harness-cache/bims-shots (mapc-<map>-<stage>-<320|wide>-<theme>.png). Owner: maps-c.
import { test, expect, type Session } from '../../harness';
import type { FakeCore } from '../../harness';
import { office } from '../../../src/bims/fixtures';
import { P, open, settle, shotOf, showOffice, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 240_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

interface G { jobs_done: number; days_used: number; artifacts_made: number }

const MAPS = ['patio', 'haveli', 'tropical', 'cyclades', 'sahel'] as const;
const STAGES: readonly { stage: number; g: G }[] = [
  { stage: 0, g: { jobs_done: 0, days_used: 0, artifacts_made: 0 } },
  { stage: 5, g: { jobs_done: 20, days_used: 8, artifacts_made: 45 } },
  { stage: 9, g: { jobs_done: 120, days_used: 40, artifacts_made: 160 } },
  { stage: 14, g: { jobs_done: 1200, days_used: 400, artifacts_made: 733 } },
];
const SAYS: Readonly<Record<number, string>> = {
  0: 'a bare room: the desks, main\'s, the eating place; no nap place yet, no terrace',
  5: 'the plant, the food and the first tree, 4 nap places, the board, the mural and the music; the terrace and 2 deck chairs; 4 frames',
  9: 'and more food and flowers, the shade outside, trees all round, 8 nap places, the game; 16 frames',
  14: 'everything: the water, the second game, the pond, the thing in the sky, the golden piece at main\'s mark; 30 golden frames',
};

async function shot(s: Session, file: string, title: string, says: string): Promise<void> {
  const box = await s.page.getByTestId('app.right.bims').boundingBox();
  if (box === null) throw new Error(`no office for the shot ${file}`);
  await shotOf(s.cdp, s.page, box, file);
  shots.push({ file, title, says });
}

async function grow(s: Session, core: FakeCore, g: G): Promise<void> {
  await s.page.evaluate((x) => { (window as unknown as { __biseGrow?: unknown }).__biseGrow = x; }, g);
  await core.send({ ev: 'growth', project: P, growth: g } as never);
}

for (const map of MAPS) {
  for (const theme of ['light', 'dark'] as const) {
    test(`(maps-c) ${map}: stages 0, 5, 9, 14 at 320 and wide, ${theme}`, async () => {
      const { s, core } = await open(office, { theme, width: 1600 });
      try {
        await showOffice(s);
        await core.send({ ev: 'prefs', prefs: { onboarded: true, theme, excluded_apps: [], bims: { map: { [P]: map } } } } as never);
        await expect(s.page.getByTestId('app.right.bims'), 'his pick draws').toHaveAttribute('data-map', map, { timeout: 8000 });
        const when = theme === 'dark' ? 'night' : 'day';
        for (const { stage, g } of STAGES) {
          await grow(s, core, g);
          await settle(s, 800, 5000);
          await expect(s.page.getByTestId('app.right.bims.level')).toHaveAttribute('data-tip', new RegExp(`^level ${String(stage)} · `, 'u'));
          await shot(s, `mapc-${map}-${String(stage)}-320-${theme}.png`, `${map}, stage ${String(stage)}, 320, ${when}`, SAYS[stage] ?? '');
          await s.page.getByTestId('app.right.agents.width.wide').click();
          await settle(s, 800, 5000);
          await shot(s, `mapc-${map}-${String(stage)}-wide-${theme}.png`, `${map}, stage ${String(stage)}, wide, ${when}`, SAYS[stage] ?? '');
          await s.page.getByTestId('app.right.agents.width.narrow').click();
          await settle(s, 800, 5000);
        }
      } finally {
        await s.close().catch(() => undefined);
        core.dispose();
      }
    });
  }
}

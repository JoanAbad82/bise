// bims/grow · the office grows with the project (page bims-office v14 "un bureau qui grandit",
// src/bims/growth.ts), on FakeCore rows from src/bims/fixtures.ts, off screen. Passes when, light
// and dark:
//   (7) stages 0, 2, 8 and 14 draw at 320 and wide (the building fits at 320, the garden past it
//       fades; wide shows the whole ground), stage 8 at 90 jobs done with its next piece's cones;
//       the ground's corner tip says the level, the jobs done and the next piece;
//   (8) an unlock moment: 59 -> 60 jobs done, two bims carry the piece in from the door, then
//       'new: trees all round' over it for 3 s.
// The growth is the check's own (window.__biseGrow, read in test mode only) and comes as the hub's
// hub/growth event, so the store and the office take the real path. Shots: .harness-cache/bims-shots.
// Owner: bims-grow.
import { test, expect, type Session } from '../../harness';
import type { FakeCore } from '../../harness';
import { office } from '../../../src/bims/fixtures';
import { P, open, settle, shotOf, showOffice, sleep, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 180_000 });

async function shot(s: Session, file: string, title: string, says: string): Promise<void> {
  const bar = await s.page.getByTestId('app.right.bims').boundingBox();
  if (bar === null) throw new Error(`no office for the shot ${file}`);
  await shotOf(s.cdp, s.page, bar, file);
  shots.push({ file, title, says });
}

test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

interface G { jobs_done: number; days_used: number; artifacts_made: number }

/** the check's growth: forced in the window, then the hub's event so the office hears of it */
async function grow(s: Session, core: FakeCore, g: G): Promise<void> {
  await s.page.evaluate((x) => { (window as unknown as { __biseGrow?: unknown }).__biseGrow = x; }, g);
  await core.send({ ev: 'growth', project: P, growth: g } as never);
}

const STAGES: readonly { stage: number; g: G; says: string }[] = [
  { stage: 0, g: { jobs_done: 0, days_used: 0, artifacts_made: 0 }, says: 'a bare room: the desks, main\'s, a coffee counter; the terrace slab, no deck chair but those the bims need' },
  { stage: 2, g: { jobs_done: 4, days_used: 2, artifacts_made: 12 }, says: 'a plant, a deck chair, the short island with its fruit, a first tree; one frame on the back wall' },
  { stage: 8, g: { jobs_done: 90, days_used: 20, artifacts_made: 160 }, says: 'the lounge (8 bean bags), the whiteboard, the mural and boombox, the terrace, trees all round, 16 frames; cones and a barrier where the skate ramp goes (90 of 100)' },
  { stage: 14, g: { jobs_done: 1200, days_used: 400, artifacts_made: 733 }, says: 'everything: the fountain on the bigger ground, the arcade, the pond, the balloon, main\'s golden statue; 30 golden frames; a full garden' },
];

for (const theme of ['light', 'dark'] as const) {
  test(`(7) the stages at 320 and wide, ${theme}`, async () => {
    const { s, core } = await open(office, { theme, width: 1600 });
    try {
      await showOffice(s);
      for (const { stage, g, says } of STAGES) {
        await grow(s, core, g);
        await settle(s, 800, 4000);
        await shot(s, `grow-${String(stage)}-320-${theme}.png`, `stage ${String(stage)}, 320, ${theme === 'dark' ? 'night' : 'day'}`, says);
        await s.page.getByTestId('app.right.agents.width.wide').click();
        await settle(s, 800, 4000);
        await shot(s, `grow-${String(stage)}-wide-${theme}.png`, `stage ${String(stage)}, wide, ${theme === 'dark' ? 'night' : 'day'}`, says);
        // the corner's tip names the level
        await expect(s.page.getByTestId('app.right.bims.level')).toHaveAttribute('data-tip', new RegExp(`^level ${String(stage)} · `, 'u'));
        await s.page.getByTestId('app.right.agents.width.narrow').click();
        await settle(s, 800, 4000);
      }
      // the fade at 320 only when a garden grew past the building
      await expect(s.page.getByTestId('app.right.bims.canvas')).toHaveClass(/bims-fade/u);
    } finally {
      await s.close();
    }
  });
}

test('(8) an unlock moment: two bims bring the trees in, then its label', async () => {
  const { s, core } = await open(office, { theme: 'light', width: 1600 });
  try {
    await showOffice(s);
    await s.page.getByTestId('app.right.agents.width.wide').click();
    await grow(s, core, { jobs_done: 59, days_used: 10, artifacts_made: 40 });
    await settle(s, 800, 4000);
    await grow(s, core, { jobs_done: 60, days_used: 10, artifacts_made: 40 });
    // mid-walk: no label yet, the crew is on its way
    await sleep(1500);
    await expect(s.page.getByTestId('app.right.bims.new')).toHaveCount(0);
    await shot(s, 'grow-unlock-walk.png', 'unlock, mid-walk (wide, day)', 'two bims carry crates in from the door towards the back left; the trees not there yet');
    await expect(s.page.getByTestId('app.right.bims.new')).toHaveText('new: trees all round', { timeout: 4000 });
    await shot(s, 'grow-unlock-label.png', 'unlock, the label (wide, day)', "the trees all round are in; 'new: trees all round' over the piece for 3 s");
    await expect(s.page.getByTestId('app.right.bims.new')).toHaveCount(0, { timeout: 5000 });
  } finally {
    await s.close();
  }
});

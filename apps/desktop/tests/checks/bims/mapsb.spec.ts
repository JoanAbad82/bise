// bims/mapsb · maps-b's six maps (page bims-maps: Greenhouse, Campus, Workshop, Kyoto, Riad, Nordic),
// on FakeCore rows from src/bims/fixtures.ts, off screen. Passes when, light and dark, his prefs
// picking each map draw it (data-map), at stages 0, 5, 9 and 14, at 320 and wide, the corner's tip
// naming the level; and a crowd of 17 agents draws on each (light, wide). Shots for bims to sign:
// .harness-cache/bims-shots (mb-*.png). Owner: maps-b.
import { test, expect, type FakeCore, type Session } from '../../harness';
import { crowd, office } from '../../../src/bims/fixtures';
import { P, open, rowsOf, settle, shotOf, showOffice, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 240_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

const MAPS = ['greenhouse', 'campus', 'workshop', 'kyoto', 'riad', 'nordic'] as const;

interface G { jobs_done: number; days_used: number; artifacts_made: number }
const STAGES: readonly { stage: number; g: G }[] = [
  { stage: 0, g: { jobs_done: 0, days_used: 0, artifacts_made: 0 } },
  { stage: 5, g: { jobs_done: 20, days_used: 8, artifacts_made: 60 } },
  { stage: 9, g: { jobs_done: 120, days_used: 30, artifacts_made: 180 } },
  { stage: 14, g: { jobs_done: 1200, days_used: 400, artifacts_made: 733 } },
];

async function shot(s: Session, file: string, title: string, says: string): Promise<void> {
  const bar = await s.page.getByTestId('app.right.bims').boundingBox();
  if (bar === null) throw new Error(`no office for the shot ${file}`);
  await shotOf(s.cdp, s.page, bar, file);
  shots.push({ file, title, says });
}

/** the check's growth: forced in the window, then the hub's event (grow.spec.ts's way) */
async function grow(s: Session, core: FakeCore, g: G): Promise<void> {
  await s.page.evaluate((x) => { (window as unknown as { __biseGrow?: unknown }).__biseGrow = x; }, g);
  await core.send({ ev: 'growth', project: P, growth: g } as never);
}

async function pick(s: Session, core: FakeCore, theme: 'light' | 'dark', map: string): Promise<void> {
  await core.send({ ev: 'prefs', prefs: { onboarded: true, theme, excluded_apps: [], bims: { map: { [P]: map } } } } as never);
  await expect(s.page.getByTestId('app.right.bims'), `his pick draws ${map}`).toHaveAttribute('data-map', map, { timeout: 10_000 });
}

for (const map of MAPS) {
  for (const theme of ['light', 'dark'] as const) {
    test(`(mapsb) ${map} at stages 0, 5, 9, 14, 320 and wide, ${theme}`, async () => {
      const { s, core } = await open(office, { theme, width: 1600 });
      const when = theme === 'dark' ? 'night' : 'day';
      try {
        await showOffice(s);
        await pick(s, core, theme, map);
        for (const { stage, g } of STAGES) {
          await grow(s, core, g);
          await settle(s, 800, 5000);
          await shot(s, `mb-${map}-${String(stage)}-320-${theme}.png`, `${map}, stage ${String(stage)}, 320, ${when}`, `${map} at stage ${String(stage)}, the bar's 320`);
          await s.page.getByTestId('app.right.agents.width.wide').click();
          await settle(s, 800, 5000);
          await shot(s, `mb-${map}-${String(stage)}-wide-${theme}.png`, `${map}, stage ${String(stage)}, wide, ${when}`, `${map} at stage ${String(stage)}, wide`);
          await expect(s.page.getByTestId('app.right.bims.level')).toHaveAttribute('data-tip', new RegExp(`^level ${String(stage)} · `, 'u'));
          await s.page.getByTestId('app.right.agents.width.narrow').click();
          await settle(s, 800, 4000);
        }
        if (theme === 'light') {
          await core.send(rowsOf(crowd(16)) as never);
          await s.page.getByTestId('app.right.agents.width.wide').click();
          await settle(s, 1500, 8000);
          await shot(s, `mb-${map}-crowd-wide-light.png`, `${map}, 17 agents, wide, day`, `${map} with 16 desks and main's: the room grown for them`);
        }
      } finally {
        await s.close().catch(() => undefined);
        core.dispose();
      }
    });
  }
}

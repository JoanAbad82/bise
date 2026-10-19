// bims/chair · a done bim reclines only on a deck chair (bims-chair): the loft at stage 2 (one deck
// chair built, growth.ts chairsAt) with 5 done bims, at 640 docked, light and dark, off screen. One
// reclines on the chair; the four past it stand at their terrace spots facing the view, a mug in
// hand, never lying in the air. Passes when the office draws and settles; the shots go to
// .harness-cache/bims-shots/chair-640-docked-<theme>.png (the shot bims signs). Owner: bims-grow.
import { test, expect } from '../../harness';
import { office } from '../../../src/bims/fixtures';
import { P, open, settle, shotOf, showOffice, withRows, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 120_000 });

test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

/** five done bims: copy-fix's and four more */
const DONE = ['copy-fix', 'signup-perf', 'dark-mode', 'nightly', 'empty-state'] as const;
/** stage 2: 3 to 5 jobs done (growth.ts STAGE_AT), one deck chair (chairsAt) */
const STAGE_2 = { jobs_done: 4, days_used: 2, artifacts_made: 12 };
const five = withRows(office, Object.fromEntries(DONE.map((n) => [n, { status: 'done' as const, turn_ms: null, title: 'landed', watching: [] }])));

for (const theme of ['light', 'dark'] as const) {
  test(`stage 2, 5 done bims, 640 docked, ${theme}`, async () => {
    const { s, core } = await open(five, { theme, growth: STAGE_2 });
    try {
      // the window plane.spec.ts docks its 640 office in
      await s.app.evaluate(({ BrowserWindow }, v) => {
        const b = BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().includes('index.html'));
        b?.setContentSize(v, b.getContentSize()[1] ?? 900);
      }, 1600);
      await showOffice(s);
      await s.page.getByTestId('app.right.agents.width.wide').click();
      await expect(s.page.getByTestId('app.panel')).toHaveAttribute('data-wide', 'docked', { timeout: 3000 });
      // stage 2 as grow.spec.ts sets it: forced in the window, then the hub's event
      await s.page.evaluate((x) => { (window as unknown as { __biseGrow?: unknown }).__biseGrow = x; }, STAGE_2);
      await core.send({ ev: 'growth', project: P, growth: STAGE_2 } as never);
      await settle(s, 1500, 30_000);
      await expect(s.page.getByTestId('app.right.bims.level')).toHaveAttribute('data-tip', /^level 2 · /u);
      const box = await s.page.getByTestId('app.right.bims').boundingBox();
      if (box === null) throw new Error('no office');
      const file = `chair-640-docked-${theme}.png`;
      await shotOf(s.cdp, s.page, box, file);
      shots.push({ file, title: `stage 2, 5 done, 640 docked, ${theme === 'dark' ? 'night' : 'day'}`, says: 'one done bim reclines on the one deck chair; the four past it stand on the terrace facing you, a mug in hand' });
    } finally {
      await s.close();
    }
  });
}

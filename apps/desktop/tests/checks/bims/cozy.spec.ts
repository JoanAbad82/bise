// bims/cozy · the cozy office (page bims-cozy v2, bims m_32090), on FakeCore rows from
// src/bims/fixtures.ts, off screen. Passes when the loft, the riad and the Sahel draw at stages 0, 7
// and 14, light and dark, at 640 docked, and a pinch in on a desk shows it close. Shots for bims,
// then the designer, to sign: .harness-cache/bims-shots (cozy-<tag>-*.png; COZY_TAG=before on
// main's build, after on this one). The law itself is render/cozy.test.ts. Owner: bims-cozy.
import { test, expect, type FakeCore, type Session } from '../../harness';
import { office } from '../../../src/bims/fixtures';
import { P, headOf, open, settle, shotOf, showOffice, trackpad, writeIndex, type Shot } from './world';

const TAG = process.env.COZY_TAG ?? 'after';
const shots: Shot[] = [];
test.describe.configure({ timeout: 240_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

const MAPS = ['loft', 'riad', 'sahel'] as const;

interface G { jobs_done: number; days_used: number; artifacts_made: number }
const STAGES: readonly { stage: number; g: G }[] = [
  { stage: 0, g: { jobs_done: 0, days_used: 0, artifacts_made: 0 } },
  { stage: 7, g: { jobs_done: 45, days_used: 10, artifacts_made: 80 } },
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
    test(`(cozy) ${map} at stages 0, 7, 14, 640 docked, ${theme}`, async () => {
      const { s, core } = await open(office, { theme, width: 1600 });
      const when = theme === 'dark' ? 'night' : 'day';
      try {
        await showOffice(s);
        await pick(s, core, theme, map);
        await s.page.getByTestId('app.right.agents.width.wide').click();
        for (const { stage, g } of STAGES) {
          await grow(s, core, g);
          await settle(s, 800, 6000);
          await shot(s, `cozy-${TAG}-${map}-${String(stage)}-${theme}.png`, `${TAG}: ${map}, stage ${String(stage)}, 640 docked, ${when}`, `${map} at stage ${String(stage)} (${TAG})`);
        }
        if (map === 'loft' && theme === 'light') {
          // a desk close: pinch in on a working bim at its desk (stage 14: two objects on it)
          const name = office.agents.find((a) => !a.main && !a.archived && a.status === 'working')?.name ?? '';
          const head = await headOf(s.page, name);
          if (head === null) throw new Error(`no head for ${name}`);
          for (let i = 0; i < 6; i++) await trackpad(s.cdp, head.x, head.y + 20, { dy: -120, pinch: true });
          await settle(s, 800, 6000);
          await shot(s, `cozy-${TAG}-loft-desk-${theme}.png`, `${TAG}: a loft desk, close, ${when}`, `${name}'s desk pinched in (${TAG})`);
        }
      } finally {
        await s.close().catch(() => undefined);
        core.dispose();
      }
    });
  }
}

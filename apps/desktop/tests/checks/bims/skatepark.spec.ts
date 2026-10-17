// bims/skatepark · the California park after Gabriel's notes (skate-fix), shots for bims to sign, on
// FakeCore rows off screen, light and dark: the park wide at stage 9 (the 4-stair's handrail on its
// posts, the bank up to its deck) and 14 (the bowl carved into the ground); then a skater followed (its
// thread open, the 2.2x zoom) caught by the probe's trace: on its board (its wheels), mid-air over the
// mini ramp's coping, deep in the bowl. Not in test:land (shots only; the collisions are a unit check,
// parkpath.test.ts). Shots: .harness-cache/bims-shots. Owner: skate-fix.
import { test, expect, type Session } from '../../harness';
import type { FakeCore } from '../../harness';
import { agent, mainAgent, snap } from '../../../src/bims/fixtures';
import { P, open, settle, shotOf, showOffice, sleep, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 420_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

/** three idle bims (two skate), one working */
const TEAM = snap([
  mainAgent({ status: 'working', turn_ms: 60_000 }),
  agent('signup-perf', { status: 'working', turn_ms: 120_000, title: 'profiling signup' }),
  agent('kick', { status: 'idle', title: 'idle' }),
  agent('ollie', { status: 'idle', title: 'idle' }),
  agent('empty-state', { status: 'idle', title: 'idle' }),
]);
const IDLE = ['kick', 'ollie', 'empty-state'];

async function shot(s: Session, file: string, title: string, says: string): Promise<void> {
  const bar = await s.page.getByTestId('app.right.bims').boundingBox();
  if (bar === null) throw new Error(`no office for the shot ${file}`);
  await shotOf(s.cdp, s.page, bar, file);
  shots.push({ file, title, says });
}

async function grow(s: Session, core: FakeCore, g: { jobs_done: number; days_used: number; artifacts_made: number }): Promise<void> {
  await s.page.evaluate((x) => { (window as unknown as { __biseGrow?: unknown }).__biseGrow = x; }, g);
  await core.send({ ev: 'growth', project: P, growth: g } as never);
}

interface Pt3 { name: string; x: number; z: number; y: number }
/** each bim's last place in the probe's trace */
async function places(s: Session): Promise<Map<string, Pt3>> {
  const tr = await s.page.evaluate(() => (window as unknown as { __biseBims?: { trace: Pt3[] } }).__biseBims?.trace.slice(-60) ?? []);
  return new Map(tr.map((p) => [p.name, p]));
}

for (const theme of ['light', 'dark'] as const) {
  test(`the park after the notes, ${theme}`, async () => {
    const { s, core } = await open(TEAM, { theme, width: 1600 });
    const { page } = s;
    try {
      await showOffice(s);
      await core.send({ ev: 'prefs', prefs: { onboarded: true, theme, excluded_apps: [], bims: { map: { [P]: 'california' } } } } as never);
      await expect(page.getByTestId('app.right.bims')).toHaveAttribute('data-map', 'california', { timeout: 10_000 });
      await page.getByTestId('app.right.agents.width.wide').click();
      await grow(s, core, { jobs_done: 100, days_used: 14, artifacts_made: 120 });
      await settle(s, 800, 6000);
      await shot(s, `park-9-${theme}.png`, `stage 9, wide, ${theme}`, 'the 4-stair: its handrail along the steps, joined to its two posts; the bank up to its deck; the ramp, the ledge and the curb in a row');
      await grow(s, core, { jobs_done: 1200, days_used: 400, artifacts_made: 733 });
      await sleep(9000);
      await shot(s, `park-14-${theme}.png`, `stage 14, wide, ${theme}`, 'the bowl carved into the ground: walls and a floor below the slab, the tile band, the coping round its rim; skaters riding round the pieces');

      // follow each idle bim in turn (its row at 320), catch the moments from the probe's trace
      const want = new Map<string, (p: Pt3) => boolean>([
        ['board', (p) => Math.abs(p.y) < 0.05],
        ['air', (p) => p.y > 1.7],
        ['bowl', (p) => p.y < -0.4],
      ]);
      const got = new Set<string>();
      // each followed bim's lowest and highest board seen, and where (the failure says them)
      const seen = new Map<string, { lo: Pt3; hi: Pt3 }>();
      await page.getByTestId('app.right.agents.width.narrow').click();
      for (let round = 0; round < 9 && got.size < want.size; round++) {
        const name = IDLE[round % IDLE.length] ?? 'kick';
        await page.getByTestId(`app.right.agent.${name}`).click({ position: { x: 24, y: 10 } });
        await page.mouse.move(5, 5);
        await sleep(1500);
        const end = Date.now() + 30_000;
        while (Date.now() < end && got.size < want.size) {
          const p = (await places(s)).get(name);
          if (p) {
            const was = seen.get(name);
            seen.set(name, { lo: !was || p.y < was.lo.y ? p : was.lo, hi: !was || p.y > was.hi.y ? p : was.hi });
          }
          for (const [k, ok] of want) {
            if (got.has(k) || !p || !ok(p)) continue;
            got.add(k);
            const says = k === 'board' ? 'the board on its four wheels and two trucks' : k === 'air' ? 'an air over the mini ramp\'s (or the vert\'s) coping, turning round' : 'deep in the carved bowl, carving its wall';
            await shot(s, `follow-${k}-${theme}.png`, `${name} followed: ${k}, ${theme}`, says);
          }
          await sleep(60);
        }
      }
      const said = [...seen].map(([n, v]) => `${n}: low ${JSON.stringify(v.lo)}, high ${JSON.stringify(v.hi)}`).join('; ');
      expect([...got].sort(), `the moments caught (${said})`).toEqual([...want.keys()].sort());
    } finally {
      await s.close();
    }
  });
}

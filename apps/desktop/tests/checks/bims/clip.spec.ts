// bims/clip · the nap places and the desk plants (Gabriel, bims-clip: on the patio the agaves stood
// inside the desks and the nappers lay across each other, posts through them), on FakeCore rows
// from src/bims/fixtures.ts, off screen. Passes when, for the patio and the tropical house, light
// and dark: the office draws the map, at stages 0, 3, 8 and 14, wide (640 docked), with idle bims
// napping in the hammocks; then close on a napper in its hammock and on a desk's agave. The law is
// src/bims/render/clip.test.ts; these are the shots bims signs: .harness-cache/bims-shots
// (clip-<map>-<stage>-<theme>.png, clip-<map>-<close>-<theme>.png); and every other ready map's
// nap place, light, at stage 14 and close on a napper (Gabriel: « checker s'il n'y a pas des
// problèmes similaires sur d'autres maps »; clip-<map>-14-light.png, clip-<map>-napper-light.png).
// Owner: bims-clip.
import { test, expect, type Session } from '../../harness';
import type { FakeCore } from '../../harness';
import { agent, snap } from '../../../src/bims/fixtures';
import { hash } from '../../../src/bims/render/palette';
import { P, open, settle, shotOf, sleep, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 300_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

interface G { jobs_done: number; days_used: number; artifacts_made: number }

const MAPS = ['patio', 'tropical'] as const;
const OTHERS = ['loft', 'greenhouse', 'campus', 'workshop', 'kyoto', 'riad', 'nordic', 'haveli', 'cyclades', 'sahel', 'california'] as const;
const STAGES: readonly { stage: number; g: G; says: string }[] = [
  { stage: 0, g: { jobs_done: 0, days_used: 0, artifacts_made: 0 }, says: 'the two base hammocks, each napper inside its own; the others nap at their desks' },
  { stage: 3, g: { jobs_done: 6, days_used: 1, artifacts_made: 0 }, says: 'four hammocks in a row, a post at each head and past each napper\'s toes, nothing through anybody' },
  { stage: 8, g: { jobs_done: 60, days_used: 25, artifacts_made: 80 }, says: 'two rows of hammocks, a lane between them: no head drawn over another\'s legs' },
  { stage: 14, g: { jobs_done: 1200, days_used: 400, artifacts_made: 733 }, says: 'eight hammocks, the lamp and the plants off the nap place' },
];

// idle bims nap (trips: some go for a snack); working ones at their desks, two with a desk plant
const PLANT = ['dev-a', 'dev-b', 'dev-c', 'dev-d', 'dev-e', 'dev-f', 'dev-g', 'dev-h', 'dev-i'].filter((n) => hash(n) % 3 === 0).slice(0, 2);
const ROWS = snap([
  agent('main', { main: true, place_id: '', status: 'idle' }),
  // first: the bar lists so many rows only
  ...PLANT.map((n) => agent(n, { status: 'working', title: 'reads the api', turn_ms: 60_000 })),
  ...['nap-a', 'nap-b', 'nap-c', 'nap-d', 'nap-e', 'nap-f', 'nap-g', 'nap-h', 'nap-i'].map((n) => agent(n, { status: 'idle', title: 'idle' })),
]);

async function shot(s: Session, file: string, title: string, says: string): Promise<void> {
  const box = await s.page.getByTestId('app.right.bims').boundingBox();
  if (box === null) throw new Error(`no office for the shot ${file}`);
  await shotOf(s.cdp, s.page, box, file);
  shots.push({ file, title, says });
}

async function grow(s: Session, core: FakeCore, g: G, stage: number): Promise<void> {
  await s.page.evaluate((x) => { (window as unknown as { __biseGrow?: unknown }).__biseGrow = x; }, g);
  await core.send({ ev: 'growth', project: P, growth: g } as never);
  await expect.poll(() => s.page.getByTestId('app.right.bims').getAttribute('data-stage'), { timeout: 5000 }).toBe(String(stage));
}

/** the follow camera on one bim (its row clicked), then still */
async function closeOn(s: Session, name: string): Promise<void> {
  await s.page.getByTestId(`app.right.agent.${name}`).click({ position: { x: 24, y: 10 } });
  await s.page.mouse.move(5, 400);
  await sleep(500);
  await settle(s, 800, 6000);
}

for (const map of MAPS) {
  for (const theme of ['light', 'dark'] as const) {
    test(`(clip) ${map}: the nap place at stages 0, 3, 8, 14, wide, ${theme}; a napper and a desk plant close`, async () => {
      const { s, core } = await open(ROWS, { theme, width: 1600, growth: STAGES[0]?.g });
      try {
        await s.page.getByTestId('app.right.agents.bims').click();
        await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-shown', 'true', { timeout: 20_000 });
        await core.send({ ev: 'prefs', prefs: { onboarded: true, theme, excluded_apps: [], bims: { map: { [P]: map } } } } as never);
        await expect(s.page.getByTestId('app.right.bims'), 'his pick draws').toHaveAttribute('data-map', map, { timeout: 8000 });
        await s.page.getByTestId('app.right.agents.width.wide').click();
        const when = theme === 'dark' ? 'night' : 'day';
        for (const { stage, g, says } of STAGES) {
          await grow(s, core, g, stage);
          // the nappers walk to their hammocks first
          await sleep(4000);
          await settle(s, 800, 8000);
          await s.page.mouse.move(5, 400);
          await shot(s, `clip-${map}-${String(stage)}-${theme}.png`, `${map}, stage ${String(stage)}, 640 docked, ${when}`, says);
        }
        await closeOn(s, 'nap-a');
        await shot(s, `clip-${map}-napper-${theme}.png`, `${map}, nap-a in its hammock, close, ${when}`, 'its head inside the hammock between the posts, hands folded on its belly, no post through it');
        const p = PLANT[0];
        if (map === 'patio' && p !== undefined) {
          await s.page.getByTestId('app.right.bims.fit').click();
          await closeOn(s, p);
          await shot(s, `clip-${map}-agave-${theme}.png`, `${map}, ${p}'s desk, close, ${when}`, 'a small agave in the desk top\'s back left corner, clear of the laptop and the lamp; nothing through the desk');
        }
      } finally {
        await s.close().catch(() => undefined);
        core.dispose();
      }
    });
  }
}

for (const map of OTHERS) {
  test(`(clip) ${map}: the nap place at stage 14, wide, light; a napper close`, async () => {
    const last = STAGES[STAGES.length - 1];
    if (last === undefined) throw new Error('no stage 14');
    const { s, core } = await open(ROWS, { theme: 'light', width: 1600, growth: last.g });
    try {
      await s.page.getByTestId('app.right.agents.bims').click();
      await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-shown', 'true', { timeout: 20_000 });
      await core.send({ ev: 'prefs', prefs: { onboarded: true, theme: 'light', excluded_apps: [], bims: { map: { [P]: map } } } } as never);
      await expect(s.page.getByTestId('app.right.bims'), 'his pick draws').toHaveAttribute('data-map', map, { timeout: 8000 });
      await s.page.getByTestId('app.right.agents.width.wide').click();
      await grow(s, core, last.g, last.stage);
      await sleep(4000);
      await settle(s, 800, 8000);
      await s.page.mouse.move(5, 400);
      await shot(s, `clip-${map}-14-light.png`, `${map}, stage 14, 640 docked, day`, 'eight beds, each napper inside its own, nothing through a bed or a napper');
      await closeOn(s, 'nap-a');
      await shot(s, `clip-${map}-napper-light.png`, `${map}, nap-a in its bed, close, day`, 'its head inside its bed, hands folded on its belly, nothing through it');
    } finally {
      await s.close().catch(() => undefined);
      core.dispose();
    }
  });
}

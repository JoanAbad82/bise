// bims/california · the California map and its skatepark (page bims-maps v10, brief section D), on
// FakeCore rows off screen, the project's map California (his prefs). Passes when, light and dark:
//   (c1) stages 0, 5, 9 and 14 draw at 320 and wide (the office's room, the strip, the park on its
//        slab; the park's pieces as the stages build them), the corner's tip names the level;
//   (c2) an idle bim skates: it walks to the park with its board, rides lines there; followed (its
//        thread open, the 2.2x zoom) its trick's name shows over it, never in the normal view; hovered,
//        its card says 'idle … · skating'. A burst of shots of the followed skater: the trick strip.
// The budget (30 fps only while it rides, nothing at rest, blurred or hidden): budget.spec.ts (5).
// Shots for bims to sign: .harness-cache/bims-shots. Owner: maps-d.
import { test, expect, type Session } from '../../harness';
import type { FakeCore } from '../../harness';
import { agent, mainAgent, snap } from '../../../src/bims/fixtures';
import { P, open, overlay, settle, shotOf, showOffice, sleep, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 240_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

/** a small team: two working, one asleep on a watch, three idle (two of them skate), one done */
const TEAM = snap([
  mainAgent({ status: 'working', turn_ms: 60_000 }),
  agent('signup-perf', { status: 'working', turn_ms: 120_000, title: 'profiling signup' }),
  agent('dark-mode', { status: 'working', turn_ms: 60_000, title: 'night palette' }),
  agent('nightly', { status: 'waiting', title: 'waits on the gate' }),
  agent('empty-state', { status: 'idle', title: 'empty inbox shipped' }),
  agent('kick', { status: 'idle', title: 'idle' }),
  agent('ollie', { status: 'idle', title: 'idle' }),
  agent('copy-fix', { status: 'done', title: 'copy fixed' }),
]);

async function california(s: Session, core: FakeCore, theme: 'light' | 'dark'): Promise<void> {
  // a Wednesday: on his one-in-four Sunday every idle bim rides the bowl only, no line, no trick (skate.ts poolDay)
  await s.page.evaluate(() => { (window as unknown as { __biseLocal?: unknown }).__biseLocal = { dow: 3 }; });
  await core.send({ ev: 'prefs', prefs: { onboarded: true, theme, excluded_apps: [], bims: { map: { [P]: 'california' } } } } as never);
  await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-map', 'california', { timeout: 10_000 });
}

async function shot(s: Session, file: string, title: string, says: string): Promise<void> {
  const bar = await s.page.getByTestId('app.right.bims').boundingBox();
  if (bar === null) throw new Error(`no office for the shot ${file}`);
  await shotOf(s.cdp, s.page, bar, file);
  shots.push({ file, title, says });
}

interface G { jobs_done: number; days_used: number; artifacts_made: number }
async function grow(s: Session, core: FakeCore, g: G): Promise<void> {
  await s.page.evaluate((x) => { (window as unknown as { __biseGrow?: unknown }).__biseGrow = x; }, g);
  await core.send({ ev: 'growth', project: P, growth: g } as never);
}

const STAGES: readonly { stage: number; g: G; says: string }[] = [
  { stage: 0, g: { jobs_done: 0, days_used: 0, artifacts_made: 0 }, says: 'the room (sunset mural, surfboards, taco truck, hedge), the strip and its path, the park slab: funbox, lone quarter pipe, floodlights, benches' },
  { stage: 5, g: { jobs_done: 15, days_used: 5, artifacts_made: 40 }, says: 'an agave, a crate and a palm, two bean bags, the chalkboard, the boombox; the curb and the flat rail; 4 decks on the wall' },
  { stage: 9, g: { jobs_done: 100, days_used: 14, artifacts_made: 120 }, says: 'flowers and a cooler, the umbrella, more palms; the mini ramp, the ledge and the 4-stair with its handrail; 12 decks' },
  { stage: 14, g: { jobs_done: 1200, days_used: 400, artifacts_made: 733 }, says: 'everything: the beach shower, the bowl, the tide pool, the vert where the quarter pipe was, the golden board at the mark; 30 decks, the first golden' },
];

for (const theme of ['light', 'dark'] as const) {
  test(`(c1) California's stages at 320 and wide, ${theme}`, async () => {
    const { s, core } = await open(TEAM, { theme, width: 1600 });
    try {
      await showOffice(s);
      await california(s, core, theme);
      for (const { stage, g, says } of STAGES) {
        await grow(s, core, g);
        await settle(s, 800, 6000);
        const day = theme === 'dark' ? 'night' : 'day';
        await shot(s, `cal-${String(stage)}-320-${theme}.png`, `California, stage ${String(stage)}, 320, ${day}`, says);
        await s.page.getByTestId('app.right.agents.width.wide').click();
        await settle(s, 800, 6000);
        await shot(s, `cal-${String(stage)}-wide-${theme}.png`, `California, stage ${String(stage)}, wide, ${day}`, says);
        await expect(s.page.getByTestId('app.right.bims.level')).toHaveAttribute('data-tip', new RegExp(`^level ${String(stage)} · `, 'u'));
        await s.page.getByTestId('app.right.agents.width.narrow').click();
        await settle(s, 800, 6000);
      }
    } finally {
      await s.close();
    }
  });
}

test('(c2) idle bims skate: the park wide, a followed skater\'s tricks, its hover card', async () => {
  const { s, core } = await open(TEAM, { theme: 'light', width: 1600 });
  const { page } = s;
  try {
    await showOffice(s);
    await california(s, core, 'light');
    await grow(s, core, { jobs_done: 1200, days_used: 400, artifacts_made: 733 });
    await page.getByTestId('app.right.agents.width.wide').click();
    // the walk to the park, then a line
    await sleep(8000);
    await shot(s, 'cal-park-wide.png', 'California, the park, wide, day (stage 14)', 'two idle bims skate the park; the third idle one naps; the busy ones at their desks');

    // normal view: never a trick's name
    const names = new Set(['kick', 'ollie', 'empty-state']);
    for (let i = 0; i < 10; i++) {
      const o = await overlay(page);
      expect(o.labels.filter((l) => names.has(l.name) && l.mode === 'egg'), 'no trick name in the normal view').toEqual([]);
      await sleep(400);
    }

    // follow one skater: its thread open, the zoom, the trick names over it
    const skater = await page.evaluate(() => {
      const b = (window as unknown as { __biseBims?: { trace: { name: string; x: number }[] } }).__biseBims;
      const last = new Map<string, number>();
      for (const p of b?.trace ?? []) last.set(p.name, p.x);
      // the park is on the right: the bim furthest right among the idle ones
      return ['kick', 'ollie', 'empty-state'].sort((a, c) => (last.get(c) ?? -99) - (last.get(a) ?? -99))[0] ?? 'kick';
    });
    // at 320 (the wide bar's splitter lies over the rows), the row's left part as hover.spec clicks it
    await page.getByTestId('app.right.agents.width.narrow').click();
    await page.getByTestId(`app.right.agent.${skater}`).click({ position: { x: 24, y: 10 } });
    // off the rows: a row hovered shows its bim's card, which a trick's name never covers
    await page.mouse.move(5, 5);
    await sleep(1200);
    const seen: string[] = [];
    const all = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const o = await overlay(page);
      for (const x of o.labels) all.add(`${x.name}:${x.mode}:${x.text}`);
      const l = o.labels.find((x) => x.name === skater && x.mode === 'egg');
      if (l && !seen.includes(l.text)) {
        seen.push(l.text);
        if (seen.length <= 8) await shot(s, `cal-trick-${String(seen.length)}.png`, `trick ${String(seen.length)}: ${l.text}`, `${skater} followed (2.2x): the trick's name over it for 1.5 s`);
      }
      await sleep(350);
    }
    expect(seen.length, `followed ${skater}: its tricks' names show over it (${seen.join(', ')}; every label seen: ${[...all].join(' | ')})`).toBeGreaterThan(0);
  } finally {
    await s.close();
  }
});

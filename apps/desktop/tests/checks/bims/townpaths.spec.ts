// bims/townpaths · the town's dirt paths reach their offices (Gabriel, town-paths: « les allées qui
// vont de la route jusqu'aux bureaux ne vont pas jusqu'au bout »; bims m_32735). A town of 13 fake
// projects, one per map, all at stage 0 (no terrace: the path meets the floor) or all at stage 10
// (the terrace built: the path meets its front edge, or the floor's beside it), light and dark, off
// screen. Passes when the town draws with no crossing; its shots for bims (.harness-cache/bims-shots):
// the whole town, then a close of each office's path end (pinched in on it: the renderer's probe
// gives where its path meets it). The laws are render/pathlaw.test.ts and town/plan.test.ts.
import { test, expect, FakeCore, launchDesktop, type Session } from '../../harness';
import { agent, mainAgent } from '../../../src/bims/fixtures';
import { STAGE_AT } from '../../../src/bims/growth';
import { MAP_IDS } from '../../../src/bims/maps/ids';
import { shotOf, sleep, trackpad, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 600_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

const HOME = 'bise-home-00000000';
const id = (map: string): string => `${map}-0000path`;

/** each office's growth, sent once the app is up (a hub event: as the other bims checks send it) */
const growthOf = (stage: number): Record<string, unknown> => ({ jobs_done: STAGE_AT[stage] ?? 0, days_used: stage === 0 ? 0 : 30, artifacts_made: stage * 12 });

function world(theme: 'light' | 'dark'): Record<string, unknown>[] {
  const now = Date.now();
  const evs: Record<string, unknown>[] = [
    {
      ev: 'prefs',
      prefs: {
        onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [],
        quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
        voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7,
        bims: { map: Object.fromEntries(MAP_IDS.map((m) => [id(m), m])) },
      },
    },
    {
      ev: 'projects',
      projects: [
        { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
        ...MAP_IDS.map((m, i) => ({ project: id(m), name: m, path: `/nowhere/${m}`, git: true, home: false, order: i + 1, agents: 3, working: 1, waits: 0, running: true })),
      ],
    },
    { ev: 'agents', project: HOME, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: now, waits: 0, watching: [], dir: 'main' }] },
    { ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 1, at_ms: now - 60_000, kind: 'agent', text: 'the town is open.' }], before: null, more: false },
  ];
  for (const m of MAP_IDS) {
    evs.push(
      { ev: 'agents', project: id(m), agents: [mainAgent({ status: 'idle' }), agent(`${m}-a`, { status: 'working', turn_ms: 1000 }), agent(`${m}-b`, { status: 'idle' })], places: [] },
      { ev: 'cards', project: id(m), cards: [] },
    );
  }
  return evs;
}

type Drawn = { id: string; inView: boolean; door: { x: number; y: number } };
const drawnNow = (s: Session): Promise<Drawn[]> => s.page.evaluate(() => (window as unknown as { __biseTownDrawn?: () => Drawn[] }).__biseTownDrawn?.() ?? []);
const probe = (s: Session): Promise<{ frames: number; check: { road: number; river: number } } | null> =>
  s.page.evaluate(() => (window as unknown as { __biseTown?: { frames: number; check: { road: number; river: number } } }).__biseTown ?? null);

async function settled(s: Session, quietMs = 1000, maxMs = 12_000): Promise<void> {
  const end = Date.now() + maxMs;
  let last = (await probe(s))?.frames ?? 0;
  let since = Date.now();
  while (Date.now() < end) {
    await sleep(200);
    const n = (await probe(s))?.frames ?? 0;
    if (n !== last) {
      last = n;
      since = Date.now();
    } else if (Date.now() - since >= quietMs) return;
  }
}

for (const stage of [0, 10]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`(town paths) every map at stage ${String(stage)}, ${theme}: each path reaches its office`, async () => {
      const core = new FakeCore(world(theme) as never);
      const s = await launchDesktop({ core, route: 'bise', size: '1400x900' });
      try {
        await expect(s.page.getByTestId('app.right.agents.bims')).toBeVisible({ timeout: 20_000 });
        const town = s.page.getByTestId('app.right.bims.town');
        if ((await town.count()) === 0) await s.page.getByTestId('app.right.agents.bims').click();
        await expect(town).toHaveAttribute('data-state', 'on', { timeout: 20_000 });
        for (const m of MAP_IDS) await core.send({ ev: 'growth', project: id(m), growth: growthOf(stage) } as never);
        await s.page.getByTestId('app.right.agents.width.wide').click();
        await sleep(600);
        await settled(s);
        expect((await probe(s))?.check, 'no road or river point inside an office').toEqual({ road: 0, river: 0 });
        const box = await town.boundingBox();
        if (box === null) throw new Error('no town box');
        await shotOf(s.cdp, s.page, box, `townpaths-s${String(stage)}-${theme}.png`);
        shots.push({ file: `townpaths-s${String(stage)}-${theme}.png`, title: `town paths, stage ${String(stage)}, ${theme}`, says: 'one office per map, each path from the road to its office' });
        for (const m of MAP_IDS) {
          const at = (await drawnNow(s)).find((d) => d.id === id(m));
          if (at === undefined) throw new Error(`no ${m} office drawn`);
          for (let i = 0; i < 10; i++) await trackpad(s.cdp, box.x + at.door.x, box.y + at.door.y, { dy: -20, pinch: true });
          await sleep(500);
          await settled(s);
          const near = (await drawnNow(s)).find((d) => d.id === id(m));
          if (near === undefined) throw new Error(`no ${m} office drawn, pinched in`);
          const w = Math.min(420, box.width);
          const h = Math.min(300, box.height);
          const x = Math.max(box.x, Math.min(box.x + box.width - w, box.x + near.door.x - w / 2));
          const y = Math.max(box.y, Math.min(box.y + box.height - h, box.y + near.door.y - h * 0.45));
          const file = `townpaths-${m}-s${String(stage)}-${theme}.png`;
          await shotOf(s.cdp, s.page, { x, y, width: w, height: h }, file);
          shots.push({ file, title: `${m}, stage ${String(stage)}, ${theme}`, says: stage === 0 ? 'the path meets the floor at the door, its apron at the edge' : 'the path meets the terrace\'s front edge (or the floor\'s beside it), its apron at the edge' });
          await town.focus();
          await s.page.keyboard.press('Escape');
          await expect(town, 'esc: the whole town again').not.toHaveAttribute('data-zoomed', 'true');
          await sleep(500);
          await settled(s);
        }
      } finally {
        await s.close();
      }
    });
  }
}

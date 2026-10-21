// bims/nap · each map's nap place (Gabriel, bims-nap: « dans la serre les bims dorment en lévitation
// dans la salle de sieste »), on FakeCore rows from src/bims/fixtures.ts, off screen. Passes when,
// light and dark, every map draws at stage 14, wide (640 docked), its idle bims napping on its beds;
// then close on a napper; and the greenhouse and kyoto at 320 too. The law is
// src/bims/render/nap.test.ts; these are the shots bims signs: .harness-cache/bims-shots
// (nap-<map>-<theme>.png, nap-<map>-close-<theme>.png, nap-<map>-320-<theme>.png). Owner: bims-nap.
import { test, expect, type Session } from '../../harness';
import type { FakeCore } from '../../harness';
import { agent, snap } from '../../../src/bims/fixtures';
import { MAP_IDS } from '../../../src/bims/maps/ids';
import { P, headOf, open, settle, shotOf, sleep, trackpad, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 900_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

const LAST = { jobs_done: 1200, days_used: 400, artifacts_made: 733 };
const AT_320 = new Set<string>(['greenhouse', 'kyoto']);
const SAYS = 'flat beds: each napper on its back, back and heels on the bed, its head on a pillow turned to the room; bean bags: sunk in; hammocks: on the cloth. Nobody in the air, nothing through anybody';

const ROWS = snap([
  agent('main', { main: true, place_id: '', status: 'idle' }),
  ...['nap-a', 'nap-b', 'nap-c', 'nap-d', 'nap-e', 'nap-f', 'nap-g', 'nap-h', 'nap-i'].map((n) => agent(n, { status: 'idle', title: 'idle' })),
]);

async function shot(s: Session, file: string, title: string, says: string): Promise<void> {
  const box = await s.page.getByTestId('app.right.bims').boundingBox();
  if (box === null) throw new Error(`no office for the shot ${file}`);
  await shotOf(s.cdp, s.page, box, file);
  shots.push({ file, title, says });
}

/** close on one bim: a pinch around its head (life.spec.ts), then still */
async function closeOn(s: Session, name: string): Promise<void> {
  const h = await headOf(s.page, name);
  if (h === null) throw new Error(`${name} is off view`);
  for (let i = 0; i < 8; i++) await trackpad(s.cdp, h.x, h.y, { dy: -60, pinch: true });
  await s.page.mouse.move(5, 400);
  await sleep(500);
  await settle(s, 800, 6000);
}

/** the project grown to `stage` (clip.spec.ts grow: the counters, then the office's data-stage) */
async function grow(s: Session, core: FakeCore, g: Record<string, number>, stage: number): Promise<void> {
  await s.page.evaluate((x) => { (window as unknown as { __biseGrow?: unknown }).__biseGrow = x; }, g);
  await core.send({ ev: 'growth', project: P, growth: g } as never);
  await expect.poll(() => s.page.getByTestId('app.right.bims').getAttribute('data-stage'), { timeout: 5000 }).toBe(String(stage));
}

async function pick(s: Session, core: FakeCore, map: string, theme: 'light' | 'dark'): Promise<void> {
  await core.send({ ev: 'prefs', prefs: { onboarded: true, theme, excluded_apps: [], bims: { map: { [P]: map } } } } as never);
  await expect(s.page.getByTestId('app.right.bims'), 'his pick draws').toHaveAttribute('data-map', map, { timeout: 8000 });
}

for (const theme of ['light', 'dark'] as const) {
  test(`(nap) every map's nap place at stage 14, wide and close, ${theme}; greenhouse and kyoto at 320`, async () => {
    const { s, core } = await open(ROWS, { theme, width: 1600, growth: LAST });
    const when = theme === 'dark' ? 'night' : 'day';
    try {
      await s.page.getByTestId('app.right.agents.bims').click();
      await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-shown', 'true', { timeout: 20_000 });
      await grow(s, core, LAST, 14);
      for (const map of MAP_IDS) {
        await s.page.getByTestId('app.right.agents.width.wide').click();
        await pick(s, core, map, theme);
        // the nappers walk to their beds and lie down first
        await sleep(6000);
        await settle(s, 800, 8000);
        await s.page.mouse.move(5, 400);
        await shot(s, `nap-${map}-${theme}.png`, `${map}, stage 14, 640 docked, ${when}`, SAYS);
        await closeOn(s, 'nap-a');
        await shot(s, `nap-${map}-close-${theme}.png`, `${map}, nap-a on its bed, close, ${when}`, SAYS);
        // back to the whole office (the fit chip shows while zoomed)
        const fit = s.page.getByTestId('app.right.bims.fit');
        if ((await fit.count()) > 0) await fit.click();
        await settle(s, 600, 4000);
        if (AT_320.has(map)) {
          await s.page.getByTestId('app.right.agents.width.narrow').click();
          await sleep(1500);
          await settle(s, 800, 6000);
          await s.page.mouse.move(5, 400);
          await shot(s, `nap-${map}-320-${theme}.png`, `${map}, stage 14, 320 docked, ${when}`, SAYS);
        }
      }
    } finally {
      await s.close().catch(() => undefined);
      core.dispose();
    }
  });
}

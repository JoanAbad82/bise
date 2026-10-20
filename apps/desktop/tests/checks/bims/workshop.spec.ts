// bims/workshop · the workshop's free floor (page bims-workshop, Gabriel's pick C, bims' brief): past
// 18 desks the next ones sit in pods of six on the floor, one workshop corner per pod plus one from
// 13 desks on. On FakeCore rows (src/bims/fixtures.ts crowd), off screen. Passes when the workshop
// draws at 12, 18, 19, 24 and 30 desks, 320 and 640 docked, light and dark, noon and night; each
// corner pinched in close; a bim walks to a pod desk and sits down (a strip); and one bigger window
// (1400, the bar slid over) at 30 desks, dark, noon, for Gabriel's page. Shots for bims to sign:
// .harness-cache/bims-shots (ws-*.png). The laws: maps/workshop.test.ts, render/maps/workshop-floor.test.ts.
// Owner: maps-b.
import { test, expect, type FakeCore, type Session } from '../../harness';
import { agent, crowd } from '../../../src/bims/fixtures';
import { WALL_MAX, cornerAt, cornersOf, CORNERS } from '../../../src/bims/maps/workshop-floor';
import type { Snapshot } from '../../../src/bims/model';
import { P, open, rowsOf, settle, shotOf, showOffice, sleep, trackpad, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 600_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

const COUNTS = [12, 18, 19, 24, 30] as const;
/** a clear June day: noon and night (sky.spec.ts's moments) */
const TIMES = { noon: { h: 13, m: 50 }, night: { h: 2, m: 0 } } as const;
const GROWN = { jobs_done: 120, days_used: 30, artifacts_made: 180 };

async function shot(s: Session, file: string, title: string, says: string): Promise<void> {
  const bar = await s.page.getByTestId('app.right.bims').boundingBox();
  if (bar === null) throw new Error(`no office for the shot ${file}`);
  await shotOf(s.cdp, s.page, bar, file);
  shots.push({ file, title, says });
}

async function pick(s: Session, core: FakeCore, theme: 'light' | 'dark'): Promise<void> {
  await core.send({ ev: 'prefs', prefs: { onboarded: true, theme, excluded_apps: [], bims: { map: { [P]: 'workshop' } } } } as never);
  await expect(s.page.getByTestId('app.right.bims'), 'his pick draws the workshop').toHaveAttribute('data-map', 'workshop', { timeout: 10_000 });
}

/** pin the hour (sky.ts: window.__biseLocal), a clear sky, and let its blend end */
async function at(s: Session, when: keyof typeof TIMES): Promise<void> {
  const t = TIMES[when];
  await s.page.evaluate((x) => {
    const w = window as unknown as { __biseLocal?: unknown; __biseSky?: unknown };
    w.__biseLocal = { y: 2026, mo: 6, d: 21, s: x.h * 3600 + x.m * 60 };
    w.__biseSky = { weather: 'clear' };
    window.dispatchEvent(new Event('focus'));
  }, t);
  await sleep(300);
  await settle(s, 1500, 40_000);
}

/** n desks and main's, every bim at work (the map never lies: they sit at their desks) */
const desks = (n: number): Snapshot => crowd(n);

async function width(s: Session, w: 'narrow' | 'wide'): Promise<void> {
  await s.page.getByTestId(`app.right.agents.width.${w}`).click();
  await settle(s, 800, 6000);
}

for (const theme of ['light', 'dark'] as const) {
  test(`(workshop) 12, 18, 19, 24 and 30 desks, 320 and 640 docked, noon and night, ${theme}`, async () => {
    // 5 rooms x 2 hours x 2 widths: each hour's sky blend (30 s) then rest, ~10 min on a loaded machine
    test.setTimeout(25 * 60_000);
    const { s, core } = await open(desks(COUNTS[0]), { theme, width: 1600, growth: GROWN });
    try {
      await showOffice(s);
      await pick(s, core, theme);
      for (const n of COUNTS) {
        await core.send(rowsOf(desks(n)) as never);
        for (const when of ['noon', 'night'] as const) {
          await at(s, when);
          for (const w of ['narrow', 'wide'] as const) {
            await width(s, w);
            const px = w === 'narrow' ? '320' : '640';
            await shot(s, `ws-${String(n)}-${px}-${when}-${theme}.png`, `the workshop, ${String(n)} desks, ${px}, ${when}, ${theme}`,
              n <= 18 ? `${String(n)} desks on the walls${n >= 13 ? ', the lounge on the front band' : ''}` : `18 on the walls, ${String(n - 18)} in pods, ${n >= 25 ? 'three corners' : 'two corners'}`);
          }
        }
      }
    } finally {
      await s.close().catch(() => undefined);
      core.dispose();
    }
  });
}

test('(workshop) each corner close, light, noon', async () => {
  // past 18 desks the room is 27.35 wide (maps/workshop.ts), its left wall at -W/2
  const x0 = -27.35 / 2;
  const { s, core } = await open(desks(31), { theme: 'light', width: 1600, growth: GROWN });
  try {
    await showOffice(s);
    await pick(s, core, 'light');
    await at(s, 'noon');
    await width(s, 'wide');
    // corners 1-4 at 31 desks, the racks at 37, the motorbike at 43
    let shown = 0;
    for (const n of [31, 37, 43]) {
      if (n > 31) await core.send(rowsOf(desks(n)) as never);
      await settle(s, 1500, 8000);
      for (let i = shown; i < cornersOf(Math.max(n, WALL_MAX)); i++) {
        const c = cornerAt(i);
        const kind = CORNERS[i] ?? 'lounge';
        const canvas = await s.page.getByTestId('app.right.bims.canvas').boundingBox();
        const p = await s.page.evaluate((q) => (window as unknown as { __biseBims?: { at(x: number, y: number, z: number): { x: number; y: number } | null } }).__biseBims?.at(q.x, 0.5, q.z) ?? null, { x: x0 + c.x, z: c.z });
        if (canvas === null || p === null) throw new Error(`no point for the ${kind}`);
        for (let k = 0; k < 7; k++) await trackpad(s.cdp, canvas.x + p.x, canvas.y + p.y, { dy: -120, pinch: true });
        await settle(s, 800, 6000);
        await shot(s, `ws-corner-${kind}.png`, `the workshop's ${kind}, close, noon`, `the ${kind} corner pinched in: its pieces, nothing through them`);
        // back to the whole office
        for (let k = 0; k < 7; k++) await trackpad(s.cdp, canvas.x + p.x, canvas.y + p.y, { dy: 120, pinch: true });
        await settle(s, 800, 6000);
      }
      shown = cornersOf(n);
    }
  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});

test('(workshop) a bim walks to a pod desk and sits down, a strip', async () => {
  const snap = desks(19);
  const { s, core } = await open(snap, { theme: 'light', width: 1600, growth: GROWN });
  try {
    await showOffice(s);
    await pick(s, core, 'light');
    await at(s, 'noon');
    await width(s, 'wide');
    // the 20th desk: slot 19, the pod's back row; its agent comes in by the door and sits down
    const name = 'pod-newcomer';
    await core.send(rowsOf({ ...snap, agents: [...snap.agents, agent(name, { status: 'working' })] }) as never);
    const canvas = await s.page.getByTestId('app.right.bims.canvas').boundingBox();
    expect(canvas).not.toBeNull();
    for (let i = 0; i < 8; i++) {
      await sleep(i === 0 ? 300 : 650);
      await shot(s, `ws-strip-${String(i)}.png`, `a bim to its pod desk, ${String(i + 1)} of 8`, i === 0 ? 'it comes in by the door' : i < 6 ? 'it walks the pod row\'s walkway to its chair' : 'the chair slides back, it hops, sits down');
    }
  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});

test('(workshop) 30 desks, dark, noon, a bigger window (Gabriel\'s page)', async () => {
  const { s, core } = await open(desks(30), { theme: 'dark', width: 1400, growth: GROWN });
  try {
    await showOffice(s);
    await pick(s, core, 'dark');
    await at(s, 'noon');
    await width(s, 'wide');
    await shot(s, 'ws-gabriel-30-dark-noon.png', 'the workshop, 30 desks, dark, noon, 1400 window', 'for Gabriel\'s page: 18 on the walls, two pods, the lounge, the band, the maker bench');
  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});

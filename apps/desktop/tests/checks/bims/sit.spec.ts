// bims/sit · Gabriel: « les agents passent a travers leur chaise pour s'assoir » (task bims-sit),
// on FakeCore rows, off screen, the office's clock pinned frame by frame. A bim at work gets up
// (the hop, its chair slides out, a step sideways, the chair back in) and later sits down again
// (beside its chair, the chair out, a step in front of it, the hop, the chair in under it), on the
// loft, the workshop and the nordic table, light and dark: a strip each, never through its chair
// (sit.test.ts is the law; these are its shots for bims to sign). Passes when every frame draws.
// Shots: .harness-cache/bims-shots (sit-*.png, one strip per map, theme and move).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { test, expect, type Session } from '../../harness';
import type { FakeCore } from '../../harness';
import { agent, mainAgent, snap } from '../../../src/bims/fixtures';
import type { MapId } from '../../../src/bims/maps/ids';
import { SHOTS, P, headOf, open, probe, rowsOf, settle, shotOf, showOffice, trackpad, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 300_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

const NAME = 'sit-a';
const working = snap([mainAgent({ status: 'idle' }), agent(NAME, { status: 'working' })]);
const idle = snap([mainAgent({ status: 'idle' }), agent(NAME, { status: 'idle' })]);
const T0 = 1_791_100_000;

/** the get-up's frames (s from its row going idle) and the sit's (s from the bim beside its chair) */
const UP = [0, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95, 1.1, 1.3, 1.6];
const DOWN = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.05, 1.2, 1.35, 1.6];

async function pick(s: Session, core: FakeCore, map: MapId, theme: 'light' | 'dark'): Promise<void> {
  await core.send({ ev: 'prefs', prefs: { onboarded: true, theme, excluded_apps: [], bims: { map: { [P]: map } } } } as never);
  await expect(s.page.getByTestId('app.right.bims'), 'his pick draws').toHaveAttribute('data-map', map, { timeout: 8000 });
}

/** the bim's place on the floor now (the probe's last frame) */
async function where(s: Session): Promise<{ x: number; z: number } | null> {
  const p = await probe(s.page);
  const last = p?.trace.filter((x) => x.name === NAME).at(-1);
  return last ? { x: last.x, z: last.z } : null;
}

/** shoots each frame at these times (s from t), in a box round the desk; writes the strip of them side by side */
async function strip(s: Session, t: number, steps: readonly number[], box: { x: number; y: number; width: number; height: number }, file: string): Promise<void> {
  const parts: string[] = [];
  for (const [i, dt] of steps.entries()) {
    await s.page.clock.setFixedTime(Math.round((t + dt) * 1000));
    await s.page.waitForTimeout(350);
    const f = `${file}-${String(i).padStart(2, '0')}.png`;
    await shotOf(s.cdp, s.page, box, f);
    parts.push(f);
  }
  const pngs = parts.map((f) => PNG.sync.read(readFileSync(path.join(SHOTS, f))));
  const w = pngs.reduce((n, p) => n + p.width, 0);
  const h = Math.max(...pngs.map((p) => p.height));
  const out = new PNG({ width: w, height: h });
  let x = 0;
  for (const p of pngs) {
    PNG.bitblt(p, out, 0, 0, p.width, p.height, x, 0);
    x += p.width;
  }
  mkdirSync(SHOTS, { recursive: true });
  writeFileSync(path.join(SHOTS, `${file}.png`), PNG.sync.write(out));
}

const ALL: readonly { map: MapId; says: string }[] = [
  { map: 'loft', says: 'a desk in rows, its way in from the walkway behind' },
  { map: 'workshop', says: 'the back desks, facing the wall, the corridor behind them' },
  { map: 'nordic', says: 'a place at the long table, the aisle behind it' },
];
/** BIMS_SIT_MAPS=nordic,loft: only those (a reshoot) */
const only = process.env.BIMS_SIT_MAPS?.split(',');
const CASES = only ? ALL.filter((c) => only.includes(c.map)) : ALL;

for (const theme of ['light', 'dark'] as const) {
  test(`a bim gets up and sits down round its chair, never through it (${theme})`, async () => {
    const { s, core } = await open(working, { width: 1600, theme });
    try {
      let t = T0;
      await s.page.clock.setFixedTime(t * 1000);
      await showOffice(s);
      await s.page.getByTestId('app.right.agents.width.wide').click();
      for (const c of CASES) {
        await pick(s, core, c.map, theme);
        await settle(s, 800, 6000);
        // its desk: where it sits now (a seated bim's place is its spot)
        const desk = await where(s);
        if (!desk) throw new Error(`no bim placed on ${c.map}`);
        // close on its desk: a pinch in on its head
        const h0 = await headOf(s.page, NAME);
        if (h0 === null) throw new Error('no bim on view');
        for (let i = 0; i < 9; i++) await trackpad(s.cdp, h0.x, h0.y, { dy: -60, pinch: true });
        await settle(s, 600, 4000);
        const h = await headOf(s.page, NAME);
        if (h === null) throw new Error('the bim went off view');
        const box = { x: h.x - 150, y: h.y - 120, width: 300, height: 230 };

        // it gets up: its row goes idle
        t += 30;
        await s.page.clock.setFixedTime(t * 1000);
        await core.send(rowsOf(idle) as never);
        await s.page.waitForTimeout(300);
        await strip(s, t, UP, box, `sit-${c.map}-${theme}-up`);
        shots.push({ file: `sit-${c.map}-${theme}-up.png`, title: `${c.map}, ${theme}: it gets up`, says: `${c.says}. Seated; the hop with the chair sliding out from under it; standing in front of the desk; a step sideways; its chair slides back in; off it goes.` });

        // later it sits down: its row works again; the frames from when it comes beside its chair
        t += 40;
        await s.page.clock.setFixedTime(t * 1000);
        await core.send(rowsOf(working) as never);
        await s.page.waitForTimeout(300);
        let at: number | null = null;
        for (let dt = 0; dt < 16; dt += 0.1) {
          await s.page.clock.setFixedTime(Math.round((t + dt) * 1000));
          await s.page.waitForTimeout(60);
          const p = await where(s);
          if (p && Math.hypot(p.x - desk.x, p.z - desk.z) < 0.62) {
            at = t + dt - 0.1;
            break;
          }
        }
        if (at === null) throw new Error(`${NAME} never came back beside its chair on ${c.map}`);
        // framed on where it sits at the end (the camera may have moved since the get-up)
        await s.page.clock.setFixedTime(Math.round((at + 4) * 1000));
        await s.page.waitForTimeout(400);
        const hs = await headOf(s.page, NAME);
        if (hs === null) throw new Error('the bim went off view');
        const seat = { x: hs.x - 150, y: hs.y - 120, width: 300, height: 230 };
        await strip(s, at, DOWN, seat, `sit-${c.map}-${theme}-down`);
        shots.push({ file: `sit-${c.map}-${theme}-down.png`, title: `${c.map}, ${theme}: it sits down`, says: `${c.says}. Beside its chair, facing the desk; the chair slides back; a step sideways in front of it; the hop, the chair in under it; seated, both slide in.` });
        t = at + 10;
        await s.page.getByTestId('app.right.bims.fit').click();
        await settle(s, 600, 4000);
      }
    } finally {
      await s.close().catch(() => undefined);
      core.dispose();
    }
  });
}

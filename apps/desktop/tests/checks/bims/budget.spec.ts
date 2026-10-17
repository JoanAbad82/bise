// bims/budget · les bims' cost and fallbacks (architect m_27495, model.ts Motion), the fast part of
// the bims check: it runs in the land set (tests/harness/land.mjs). On FakeCore rows from
// src/bims/fixtures.ts, off screen. Passes when:
//   (1) the list view never loads the three chunk (CDP scriptParsed against the built chunk that
//       holds three's REVISION); the office loads it (the control); back on list, the list shows;
//   (3) a world of still poses (asleep, failed, blocked, done, stopped, main reading) draws 0 frames
//       once arrived (the sleepers' z's, a CSS loop, at 7.5 fps at most); a typing bim loops at ~8
//       fps, never the display's rate; hidden draws 0, z's included;
//   (4) a lost WebGL context shows the list right under its one line (no office-high hole).
// The sizes, labels, night, planes and reduced motion: office.spec.ts. Owner: bims-qa.
import { test, expect } from '../../harness';
import { agent, office, snap, watch } from '../../../src/bims/fixtures';
import {
  NAMES, P, drawnIn, loseContext, open, rowsOf, setHidden, settle, shotOf, showOffice, sleep, threeChunks, watchScripts,
  withRows, writeIndex,
} from './world';

test('(1) the list view never loads the three chunk', async () => {
  const chunks = threeChunks();
  expect(chunks, 'out/renderer has exactly one chunk with three in it (pnpm build first)').toHaveLength(1);
  const { s } = await open(office);
  try {
    const parsed = await watchScripts(s.cdp);
    await sleep(3000);
    expect(parsed().filter((f) => chunks.includes(f)), 'the list loaded three').toEqual([]);
    await showOffice(s);
    expect(parsed().filter((f) => chunks.includes(f)), 'the office loads three (the control)').toHaveLength(1);
    // the toggle again: the rows alone
    await s.page.getByTestId('app.title.bims').click();
    await expect(s.page.getByTestId('app.right.bims')).toHaveCount(0, { timeout: 2000 });
    await expect(s.page.getByTestId(`app.right.agent.${NAMES[1] ?? ''}`)).toBeVisible();
  } finally {
    await s.close();
  }
});

/** Asleep, failed, blocked, done, stopped, main reading: no pose loops (model.ts Motion). */
const STILL = snap([
  agent('main', { main: true, place_id: '', status: 'idle' }),
  agent('login-test', { status: 'waiting', watching: [watch('cargo test')] }),
  agent('cookie-banner', { status: 'blocked' }),
  agent('search-index', { status: 'failed' }),
  agent('copy-fix', { status: 'done' }),
  agent('import', { status: 'done', phase: 'stopped' }),
]);

test('(3) no frame while every bim is still or the window hidden; ~8 fps for a loop', async () => {
  const { s, core } = await open(STILL);
  try {
    await showOffice(s);
    await settle(s);
    // asleep (login-test): its 'z z Z' are a CSS loop at 7.5 fps, never WebGL (architect m_28263)
    const still = await drawnIn(s, 3000);
    expect(still.frames, 'a still office draws nothing').toBe(0);
    expect(still.shown, "the sleepers' z's: 7.5 fps at most, never the display rate").toBeLessThanOrEqual(30);

    // one bim types: the loop's rate, never the display's
    await core.send(rowsOf(withRows(STILL, { 'cookie-banner': { status: 'working', turn_ms: 1000 } })) as never);
    await settle(s, 0, 4000);
    await sleep(3000);
    const loop = await drawnIn(s, 3000);
    expect(loop.frames / 3, 'a typing bim: ~8 fps').toBeGreaterThan(4);
    expect(loop.frames / 3, 'never the display rate').toBeLessThan(12);

    // hidden: nothing, whatever the world, the sleepers' z's included (blur shares the flag: loop.ts away)
    await setHidden(s.page, true);
    await sleep(300);
    expect(await drawnIn(s, 2000), 'hidden draws nothing').toEqual({ frames: 0, shown: 0 });
    await setHidden(s.page, false);
    await expect.poll(async () => (await drawnIn(s, 1000)).frames, { timeout: 4000 }).toBeGreaterThan(0);
  } finally {
    await s.close();
  }
});

/** STILL and one idle bim: on California it skates (skate.ts), the only thing that moves */
const SKATER = snap([...STILL.agents, agent('kick', { status: 'idle', title: 'idle, skating' })]);

/** frames drawn in each second of `n` seconds */
async function perSecond(s: Awaited<ReturnType<typeof open>>['s'], n: number): Promise<number[]> {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push((await drawnIn(s, 1000)).frames);
  return out;
}

test('(5) a skater: 30 fps during its line, nothing at rest, nothing blurred or hidden', async () => {
  test.setTimeout(120_000);
  const { s, core } = await open(SKATER);
  try {
    await core.send({ ev: 'prefs', prefs: { onboarded: true, theme: 'light', excluded_apps: [], bims: { map: { [P]: 'california' } } } } as never);
    await showOffice(s);
    await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-map', 'california', { timeout: 10_000 });
    // its walk to the park (the display's rate), then lines of 8-12 s and rests at least as long
    await sleep(7000);
    const secs = await perSecond(s, 30);
    expect(Math.max(...secs), `a line draws at 30 fps, never the display's rate (per second: ${secs.join(' ')})`).toBeLessThanOrEqual(33);
    expect(secs.filter((n) => n >= 20).length, `it rides: some seconds at ~30 fps (${secs.join(' ')})`).toBeGreaterThanOrEqual(4);
    expect(secs.filter((n) => n === 0).length, `at rest on its board: whole seconds with no frame (${secs.join(' ')})`).toBeGreaterThanOrEqual(4);

    // the window not in front (blur): nothing, whatever it does
    await s.page.evaluate(() => {
      (window as unknown as { __biseBlur?: boolean }).__biseBlur = true;
      window.dispatchEvent(new Event('blur'));
    });
    await sleep(300);
    const blur = await perSecond(s, 26);
    expect(blur.reduce((a, b) => a + b, 0), `blurred: 0 frames over a whole session (${blur.join(' ')})`).toBe(0);
    await s.page.evaluate(() => {
      (window as unknown as { __biseBlur?: boolean }).__biseBlur = false;
      window.dispatchEvent(new Event('focus'));
    });
    // hidden: nothing either
    await setHidden(s.page, true);
    await sleep(300);
    const hid = await perSecond(s, 26);
    expect(hid.reduce((a, b) => a + b, 0), `hidden: 0 frames over a whole session (${hid.join(' ')})`).toBe(0);
    await setHidden(s.page, false);
    await expect.poll(async () => (await drawnIn(s, 1000)).frames, { timeout: 30_000 }).toBeGreaterThan(0);
  } finally {
    await s.close();
  }
});

test('(5b) reduced motion: nobody skates, nothing draws', async () => {
  const { s, core } = await open(SKATER, { reduced: true });
  try {
    await core.send({ ev: 'prefs', prefs: { onboarded: true, theme: 'light', excluded_apps: [], bims: { map: { [P]: 'california' } } } } as never);
    await showOffice(s);
    await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-map', 'california', { timeout: 10_000 });
    await settle(s, 1500, 15_000);
    expect((await drawnIn(s, 4000)).frames, 'reduced motion: the idle bim naps, no line').toBe(0);
  } finally {
    await s.close();
  }
});

test('(4) a lost WebGL context shows the list with its line', async () => {
  const { s } = await open(office);
  try {
    await showOffice(s);
    expect(await loseContext(s.page), 'WEBGL_lose_context on the office canvas').toBe(true);
    await expect(s.page.getByTestId('app.right.bims.lost')).toBeVisible({ timeout: 5000 });
    await expect(s.page.getByTestId('app.right.bims.canvas')).toHaveCount(0);
    await expect(s.page.getByTestId('app.right.agents.width.wide'), 'no width toggle while lost (designer m_27792)').toHaveCount(0);
    await expect(s.page.getByTestId('app.right.agent.signup-perf')).toBeVisible();
    const line = await s.page.getByTestId('app.right.bims.lost').boundingBox();
    const firstRow = await s.page.getByTestId(`app.right.agent.${office.agents[1]?.name ?? ''}`).boundingBox();
    const between = await s.page.evaluate(() => {
      const l = document.querySelector('[data-testid="app.right.bims.lost"]');
      const out: string[] = [];
      for (let e = l?.nextElementSibling ?? null; e !== null && out.length < 4; e = e.nextElementSibling) out.push(`${e.tagName.toLowerCase()}.${e.className} ${String(Math.round(e.getBoundingClientRect().height))}px`);
      return out.join(' | ');
    });
    expect(line?.height ?? 0, 'the line is one line, not the office-high box (a hole above the list)').toBeLessThan(40);
    expect((firstRow?.y ?? 0) - ((line?.y ?? 0) + (line?.height ?? 0)), `the list starts right under its line, no office-high hole (after the line: ${between})`).toBeLessThan(40);
    const box = await s.page.getByTestId('app.right.agents').boundingBox();
    if (box !== null) await shotOf(s.cdp, s.page, box, 'lost.png');
    writeIndex([{ file: 'lost.png', title: 'WebGL lost', says: 'the list again, right under its one line' }]);
  } finally {
    await s.close();
  }
});

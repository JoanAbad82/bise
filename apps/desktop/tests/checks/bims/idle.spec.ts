// bims/idle · what the office costs when nothing changes (his Mac, main m_28475: two GPU helpers at
// ~29% CPU for an hour while he worked elsewhere). On FakeCore rows, off screen. Passes when, over
// 10 s each:
//   (1) the office open on a still world (asleep, failed, blocked, done, stopped, main idle) draws
//       0 WebGL frames; its only motion is the sleepers' z's (a CSS loop, 7.5 fps at most);
//   (2) the office closed: no renderer, no frame, no animation of the bims' left running;
//   (3) the window hidden: 0 frames and the z's paused, the office open with typing bims;
//   (4) the office open with typing bims (the fixture's): the loop's ~8 fps, never the display's.
// It also writes what else animates in the window (document.getAnimations()) to
// .harness-cache/bims-shots/idle-animations.json: what keeps the compositor busy when it isn't
// the bims. Owner: bims-fix.
import { test, expect } from '../../harness';
import type { Session } from '../../harness';
import { agent, office, snap, watch } from '../../../src/bims/fixtures';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { SHOTS, open, probe, setHidden, settle, showOffice, sleep } from './world';

const IDLE_MS = 10_000;

/** asleep, failed, blocked, done, stopped, main idle: no pose loops (model.ts Motion) */
const STILL = snap([
  agent('main', { main: true, place_id: '', status: 'idle' }),
  agent('login-test', { status: 'waiting', watching: [watch('cargo test')] }),
  agent('cookie-banner', { status: 'blocked' }),
  agent('search-index', { status: 'failed' }),
  agent('copy-fix', { status: 'done' }),
  agent('import', { status: 'done', phase: 'stopped' }),
]);

/** the renderer's frames in ms (0 when there is no renderer) */
async function framesIn(s: Session, ms: number): Promise<number> {
  const f0 = (await probe(s.page))?.frames ?? 0;
  await sleep(ms);
  return ((await probe(s.page))?.frames ?? 0) - f0;
}

interface Running {
  readonly name: string;
  readonly target: string;
  readonly bims: boolean;
  readonly paused: boolean;
}

/** every CSS animation or transition running in the window now, its target as tag.class, and whether it is the office's */
const running = (s: Session): Promise<Running[]> =>
  s.page.evaluate(() =>
    document.getAnimations().map((a) => {
      const t = (a.effect as KeyframeEffect | null)?.target ?? null;
      const el = t instanceof Element ? t : null;
      const name = 'animationName' in a ? (a as CSSAnimation).animationName : a.constructor.name;
      const cls = el === null ? '' : `${el.tagName.toLowerCase()}.${(el.getAttribute('class') ?? '').split(' ').join('.')}`;
      return { name, target: cls, bims: el?.closest('.bims-office, [data-testid="app.right.bims.fold"]') != null, paused: a.playState !== 'running' };
    }),
  );

const found: Record<string, Running[]> = {};
test.afterAll(() => {
  mkdirSync(SHOTS, { recursive: true });
  writeFileSync(path.join(SHOTS, 'idle-animations.json'), JSON.stringify(found, null, 2));
});

test.describe.configure({ timeout: 180_000 });

test('(1)(2) a still office draws nothing for 10 s; closed, nothing of the bims runs', async () => {
  const { s } = await open(STILL);
  try {
    found['closed, before any open'] = await running(s);
    await showOffice(s);
    await settle(s);
    expect(await framesIn(s, IDLE_MS), 'a still office: 0 WebGL frames in 10 s').toBe(0);
    found['open, still world'] = await running(s);
    const mine = found['open, still world'].filter((a) => a.bims && !a.paused);
    expect(mine.every((a) => a.name === 'bims-z'), `the office's only motion is the z's: ${JSON.stringify(mine)}`).toBe(true);

    await s.page.getByTestId('app.title.bims').click();
    await expect(s.page.getByTestId('app.right.bims.fold')).toHaveCount(0, { timeout: 3000 });
    await sleep(500);
    expect(await probe(s.page), 'closed: the renderer is gone').toBeNull();
    found['closed after open'] = await running(s);
    expect(found['closed after open'].filter((a) => a.bims), 'closed: nothing of the bims animates').toEqual([]);
  } finally {
    await s.close();
  }
});

test('(3)(4) typing bims loop at ~8 fps; hidden, 0 frames and the z\'s paused', async () => {
  const { s } = await open(office);
  try {
    await showOffice(s);
    await settle(s, 800, 6000);
    const n = await framesIn(s, IDLE_MS);
    expect(n / (IDLE_MS / 1000), 'typing bims: the loop, ~8 fps').toBeLessThan(12);
    found['open, typing bims'] = await running(s);

    await setHidden(s.page, true);
    await sleep(500);
    expect(await framesIn(s, IDLE_MS), 'hidden: 0 frames in 10 s').toBe(0);
    const z = (await running(s)).filter((a) => a.bims && a.name === 'bims-z');
    expect(z.every((a) => a.paused), "hidden: the z's paused").toBe(true);
    found['open, hidden'] = await running(s);
    await setHidden(s.page, false);
  } finally {
    await s.close();
  }
});

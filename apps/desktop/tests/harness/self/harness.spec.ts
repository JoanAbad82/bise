// The harness checks itself: every detector passes on the fixture's good half and fails on its
// bad half, and every launch stays out of his sight (the proof). If one of these fails, no check
// built on the harness can be trusted.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import {
  caretBlinks, changedOutside, dropFiles, expect, FakeCore, FakeHelper, flashes, fps, launchDesktop, launchPage, maxJump, prove, Recorder, replacedNodes, shotChanges, test, textProblems, typeAndWatch,
} from '../index';

/** a frame of a w x h page, filled with grey, `paint` pixels in red */
const frameOf = (w: number, h: number, paint: [number, number][] = [], masks?: { x: number; y: number; width: number; height: number }[]) => {
  const png = new PNG({ width: w, height: h });
  png.data.fill(128);
  for (const [x, y] of paint) png.data[(y * w + x) * 4] = 255;
  return { t: 0, png, scale: 1, masks };
};

test('frames: changedOutside never counts a pearl (an intended animation), and counts 1 px anywhere else', () => {
  const pearl = { x: 29, y: 64, width: 15, height: 15 }; // the sidebar's pearl box that tripped composer/dictation
  const field = { x: 100, y: 100, width: 80, height: 20 };
  const all15: [number, number][] = [];
  for (let y = pearl.y; y < pearl.y + 15; y++) for (let x = pearl.x; x < pearl.x + 15; x++) all15.push([x, y]);
  expect(changedOutside([frameOf(200, 200, [], [pearl]), frameOf(200, 200, all15, [pearl])], field)).toEqual([0]);
  expect(changedOutside([frameOf(200, 200, [], [pearl]), frameOf(200, 200, [...all15, [5, 5]], [pearl])], field)).toEqual([1]);
  expect(changedOutside([frameOf(200, 200), frameOf(200, 200, all15)], field), 'without masks the same change counts').toEqual([225]);
});

test('frames: the Recorder masks the pearls it finds on the page, nothing else', async () => {
  const s = await launchPage(FIXTURE);
  try {
    await s.page.evaluate(() => {
      const add = (css: string, attr?: string): HTMLElement => {
        const e = document.createElement('div');
        e.style.cssText = `position:fixed;${css}`;
        if (attr) e.setAttribute(attr, '22');
        document.body.append(e);
        return e;
      };
      const pearl = add('left:29px;top:64px;width:15px;height:15px;background:#000', 'data-bise-pearl');
      const dot = add('left:300px;top:300px;width:1px;height:1px;background:#000');
      let i = 0;
      const tick = (): void => { i++; pearl.style.background = i % 2 ? '#f0f' : '#0f0'; if (i === 20) dot.style.background = '#fff'; if (i < 40) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    const rec = new Recorder(s.cdp, s.page);
    const frames = await rec.during(() => s.page.waitForTimeout(1000), 0);
    expect(frames[0]?.masks).toEqual([{ x: 29, y: 64, width: 15, height: 15 }, { x: 29, y: 64, width: 15, height: 15 }]);
    const changed = changedOutside(frames, { x: 0, y: 0, width: 1, height: 1 }).filter((n) => n > 0);
    expect(changed, 'only the 1 px dot counts, once').toEqual([1]);
  } finally {
    await s.close();
  }
});

test('frames: shotChanges sees a WebGL canvas redraw (the screencast does not), and a stopped one as still', async () => {
  // pearl/still went blind on the screencast: the pearl moved and the check saw nothing. This keeps
  // the sampler the pearl checks use (shotChanges) seeing a WebGL redraw, and 0 once it stops.
  const s = await launchPage(FIXTURE);
  try {
    const ok = await s.page.evaluate(() => {
      const cv = document.createElement('canvas');
      cv.width = 68;
      cv.height = 68;
      cv.style.cssText = 'position:fixed;left:40px;top:300px;width:68px;height:68px';
      document.body.append(cv);
      const gl = cv.getContext('webgl');
      if (!gl) return false;
      let i = 0;
      const w = window as unknown as { glRun: boolean };
      w.glRun = true;
      const tick = (): void => {
        i++;
        gl.clearColor((i % 30) / 30, 0.2, 1 - (i % 30) / 30, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (w.glRun) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      return true;
    });
    expect(ok, 'a WebGL context in the test window').toBe(true);
    const box = { x: 40, y: 300, width: 68, height: 68 };
    const running = await shotChanges(s.page, box, 1200);
    expect(running.filter((n) => n > 3).length, `samples that saw the redraw (${running.join(',')})`).toBeGreaterThan(3);
    await s.page.evaluate(() => { (window as unknown as { glRun: boolean }).glRun = false; });
    await s.page.waitForTimeout(200);
    const stopped = await shotChanges(s.page, box, 1000);
    expect(stopped.filter((n) => n > 0), 'a stopped canvas is still').toEqual([]);
  } finally {
    await s.close();
  }
});

const FIXTURE = path.join(__dirname, '..', 'fixtures', 'typing.html');
const withQuery = (q: string): string => `file://${FIXTURE}?${q}`;

test('proof: the window is never on a display, never frontmost, no Dock icon', async () => {
  const s = await launchPage(FIXTURE);
  try {
    expect(s.proof.violations).toEqual([]);
    expect(s.proof.applicationType).not.toBe('Foreground');
    expect(s.proof.samples).toBeGreaterThan(0);
  } finally {
    const end = await s.close();
    expect(end.violations).toEqual([]);
  }
});

test('frames: an animation off-screen draws at ~60 fps; a blanked frame is a flash', async () => {
  const s = await launchPage(FIXTURE);
  try {
    const rec = new Recorder(s.cdp, s.page);
    const dot = { x: 500, y: 20, width: 200, height: 200 };
    await s.page.goto(withQuery('anim=1'));
    const smooth = await rec.during(() => s.page.waitForTimeout(2000), 0);
    test.info().annotations.push({ type: 'fps', description: fps(smooth).toFixed(1) });
    expect(fps(smooth)).toBeGreaterThan(50);
    expect(flashes(smooth, dot)).toEqual([]);
    await s.page.goto(withQuery('anim=1&flash=1'));
    const flashing = await rec.during(() => s.page.waitForTimeout(2000), 0);
    expect(flashes(flashing, dot).length).toBeGreaterThan(5);
    expect(maxJump(flashing, dot)).toBeGreaterThan(maxJump(smooth, dot));
  } finally {
    await s.close();
  }
});

test('typing: 0 replaced nodes, focus and caret kept, nothing changes outside the field (good); the rewrite is caught (bad)', async () => {
  const s = await launchPage(FIXTURE);
  try {
    const rec = new Recorder(s.cdp, s.page);
    const field = await s.page.locator('#good').boundingBox();
    if (!field) throw new Error('#good is not on screen');
    let good!: Awaited<ReturnType<typeof typeAndWatch>>;
    const frames = await rec.during(async () => { good = await typeAndWatch(s.page, '#good', 'hello world', ['#good', '#list']); });
    expect(replacedNodes(good)).toBe(0);
    expect(good.focusLost).toEqual([]);
    expect(good.caretJumps).toEqual([]);
    expect(good.value).toBe('hello world');
    expect(frames.length).toBeGreaterThan(5);
    expect(changedOutside(frames, field).every((n) => n === 0)).toBe(true);
    const bad = await typeAndWatch(s.page, '#bad', 'hello', ['#bad', '#list']);
    expect(replacedNodes(bad)).toBeGreaterThan(0);
  } finally {
    await s.close();
  }
});

test('caret: drawn and blinking in a window that is never focused', async () => {
  const s = await launchPage(FIXTURE);
  try {
    await typeAndWatch(s.page, '#good', 'abc');
    const c = await caretBlinks(s.page, '#good');
    expect(c.blinks).toBe(true);
  } finally {
    await s.close();
  }
});

test('guards: a file dropped on a page without a drop handler and a window.open open nothing (qa-type m_9582)', async () => {
  const s = await launchPage(FIXTURE);
  try {
    await dropFiles(s.page, '#echo', [FIXTURE]);
    await s.page.evaluate(() => { window.open('https://example.com', '_blank'); });
    await s.page.waitForTimeout(800);
    const end = await prove(s.app, s.watch);
    expect(end.violations).toEqual([]);
    const windows = await s.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length);
    expect(windows).toBe(1);
    expect(s.page.url()).toContain('typing.html');
    test.info().annotations.push({ type: 'blocked', description: (await s.blocked()).join(' | ') });
  } finally {
    await s.close();
  }
});

test('desktop: the new app runs on the scripted core and helper, out of sight (needs pnpm build)', async () => {
  test.skip(!existsSync(path.join(__dirname, '..', '..', '..', 'out', 'main', 'index.js')), 'no build in out/: pnpm build');
  const core = new FakeCore(), helper = new FakeHelper();
  const s = await launchDesktop({ core, helper });
  try {
    expect(s.proof.violations).toEqual([]);
    // the window reads both through window.bise (src/shared/api.ts): the stubs really ran
    type Bise = { core: { state: () => Promise<unknown> }; helperState: () => Promise<{ ev: string }[]> };
    await expect.poll(() => s.page.evaluate(async () => JSON.stringify(await (window as unknown as { bise: Bise }).bise.core.state())), { timeout: 5000 }).toContain('up');
    await expect.poll(() => s.page.evaluate(async () => (await (window as unknown as { bise: Bise }).bise.helperState()).map((e) => e.ev)), { timeout: 5000 }).toContain('hello');
    test.info().annotations.push({ type: 'core cmds', description: JSON.stringify(core.cmds()) }, { type: 'helper cmds', description: JSON.stringify(helper.cmds()) });
  } finally {
    await s.close();
    core.dispose();
    helper.dispose();
  }
});

test('text: a clipped line and tiny words are reported', async () => {
  const s = await launchPage(FIXTURE);
  try {
    const p = await textProblems(s.page, 'body', 12);
    expect(p.some((x) => x.kind === 'clipped' && x.text.startsWith('a line far too long'))).toBe(true);
    expect(p.some((x) => x.kind === 'tiny' && x.text === 'tiny words')).toBe(true);
    expect(p.some((x) => x.text === 'one')).toBe(false);
  } finally {
    await s.close();
  }
});

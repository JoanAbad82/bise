// The harness checks itself: every detector passes on the fixture's good half and fails on its
// bad half, and every launch stays out of his sight (the proof). If one of these fails, no check
// built on the harness can be trusted.
import path from 'node:path';
import {
  caretBlinks, changedOutside, expect, flashes, fps, launchPage, maxJump, Recorder, replacedNodes, test, textProblems, typeAndWatch,
} from '../index';

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

test('old UI: the window and the capsule load on their fake cores, out of sight', async ({ oldWindow, oldCapsule }) => {
  await expect(oldWindow.page.locator('#win > *').first()).toBeAttached();
  await expect(oldCapsule.page.locator('#amb > *').first()).toBeAttached();
  expect(oldWindow.proof.violations).toEqual([]);
  expect(oldCapsule.proof.violations).toEqual([]);
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

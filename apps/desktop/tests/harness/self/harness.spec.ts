// The harness checks itself: every detector passes on the fixture's good half and fails on its
// bad half, and every launch stays out of his sight (the proof). If one of these fails, no check
// built on the harness can be trusted.
import { mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PNG } from 'pngjs';
import {
  caretBlinks, changedOutside, dropFiles, expect, flashes, fps, launchPage, maxJump, prove, Recorder, replacedNodes, test, textProblems, typeAndWatch,
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

test('guards: a PNG dropped on today\'s old window opens nothing (the exact qa-type m_9582 case)', async ({ oldWindow }) => {
  const png = new PNG({ width: 8, height: 8 });
  png.data.fill(200);
  const file = path.join(mkdtempSync(path.join(os.tmpdir(), 'bh-png-')), 'shot.png');
  writeFileSync(file, PNG.sync.write(png));
  await dropFiles(oldWindow.page, '#win', [file]);
  await oldWindow.page.waitForTimeout(800);
  const end = await prove(oldWindow.app, oldWindow.watch);
  expect(end.violations).toEqual([]);
  expect(await oldWindow.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(1);
  expect(oldWindow.page.url()).toContain('window/index.html');
  test.info().annotations.push({ type: 'blocked', description: (await oldWindow.blocked()).join(' | ') });
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

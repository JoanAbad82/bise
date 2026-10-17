// pearl/idle · what the live pearl costs when nobody looks (bims-fix m_28756: two GPU helpers at
// ~29% CPU for 55 min on his Mac while bise worked and he worked elsewhere). On the pearl lab (test
// mode, off screen), the pearl in 'work' (it moves). Passes when, over 10 s each:
//   (1) seen (the window in front): it draws at the display's rate, as before;
//   (2) the window blurred (a window 'blur', document.hasFocus() false): 0 frames;
//   (3) back in front: it draws again;
//   (4) the window hidden: 0 frames.
// A frame is one drawArrays on a pearl canvas (WebGLRenderingContext's prototype, wrapped from the
// page: no probe in the app). It also writes the app's CPU (every process of its tree, from ps)
// per phase to .harness-cache/pearl-idle.json. Owner: pearl-idle.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect, launchDesktop, type Session } from '../../harness';

const IDLE_MS = 10_000;
const OUT = path.resolve(__dirname, '..', '..', '..', '.harness-cache');

/** counts every draw on a pearl canvas from now on, in window.__qaPearlFrames */
const countFrames = (page: Page): Promise<void> =>
  page.evaluate(() => {
    const w = window as unknown as { __qaPearlFrames?: number };
    if (w.__qaPearlFrames !== undefined) return;
    w.__qaPearlFrames = 0;
    const proto = WebGLRenderingContext.prototype;
    type Draw = (this: WebGLRenderingContext, mode: number, first: number, count: number) => void;
    const draw = Object.getOwnPropertyDescriptor(proto, 'drawArrays')?.value as Draw;
    proto.drawArrays = function (this: WebGLRenderingContext, mode: number, first: number, count: number) {
      if (this.canvas instanceof HTMLCanvasElement && this.canvas.classList.contains('b-live-pearl')) w.__qaPearlFrames = (w.__qaPearlFrames ?? 0) + 1;
      draw.call(this, mode, first, count);
    };
  });

const frames = (page: Page): Promise<number> => page.evaluate(() => (window as unknown as { __qaPearlFrames?: number }).__qaPearlFrames ?? 0);

/** the window blurred or back in front, as the OS does it: hasFocus() first, then the event */
const setFocused = (page: Page, focused: boolean): Promise<void> =>
  page.evaluate((f) => {
    document.hasFocus = () => f;
    window.dispatchEvent(new Event(f ? 'focus' : 'blur'));
  }, focused);

const setHidden = (page: Page, hidden: boolean): Promise<void> =>
  page.evaluate((h) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);

/** CPU seconds used so far by the app's process tree (the main process, renderers, GPU), from ps */
function cpuSeconds(root: number): number {
  const rows = execFileSync('ps', ['-A', '-o', 'pid=,ppid=,time='], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .map((l) => l.trim().split(/\s+/))
    .map(([pid, ppid, time]) => ({ pid: Number(pid), ppid: Number(ppid), s: secondsOf(time ?? '0') }));
  const tree = new Set([root]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const r of rows) if (!tree.has(r.pid) && tree.has(r.ppid)) { tree.add(r.pid); grew = true; }
  }
  return rows.filter((r) => tree.has(r.pid)).reduce((n, r) => n + r.s, 0);
}

/** ps's TIME ([[dd-]hh:]mm:ss[.cc]) in seconds */
function secondsOf(t: string): number {
  const [days, rest] = t.includes('-') ? [Number(t.split('-')[0]), t.split('-')[1] ?? ''] : [0, t];
  return days * 86400 + rest.split(':').reduce((n, p) => n * 60 + Number(p), 0);
}

interface Phase {
  readonly frames: number;
  readonly cpuPct: number;
}

async function over(s: Session, ms: number): Promise<Phase> {
  const pid = s.app.process().pid ?? 0;
  const f0 = await frames(s.page);
  const c0 = cpuSeconds(pid);
  await s.page.waitForTimeout(ms);
  const f1 = await frames(s.page);
  const c1 = cpuSeconds(pid);
  return { frames: f1 - f0, cpuPct: Math.round(((c1 - c0) / (ms / 1000)) * 1000) / 10 };
}

test.describe.configure({ timeout: 120_000 });

test('pearl/idle: a moving pearl draws while seen, and nothing blurred or hidden', async () => {
  const s = await launchDesktop({ route: 'lab/pearl' });
  const seen: Record<string, Phase> = {};
  try {
    await expect(s.page.locator('[data-testid="lab.pearl.canvas"]')).toBeVisible();
    await countFrames(s.page);
    await s.page.locator('[data-testid="lab.mood.work"]').click();
    await s.page.waitForTimeout(500);

    seen.visible = await over(s, IDLE_MS);
    expect.soft(seen.visible.frames, 'seen: the pearl draws while bise works').toBeGreaterThan(100);

    await setFocused(s.page, false);
    await s.page.waitForTimeout(300);
    seen.blurred = await over(s, IDLE_MS);
    expect.soft(seen.blurred.frames, 'blurred: 0 frames in 10 s').toBe(0);

    await setFocused(s.page, true);
    await s.page.waitForTimeout(300);
    seen.back = await over(s, 3000);
    expect.soft(seen.back.frames, 'back in front: it draws again').toBeGreaterThan(30);

    await setHidden(s.page, true);
    await s.page.waitForTimeout(300);
    seen.hidden = await over(s, IDLE_MS);
    expect.soft(seen.hidden.frames, 'hidden: 0 frames in 10 s').toBe(0);
    await setHidden(s.page, false);
  } finally {
    mkdirSync(OUT, { recursive: true });
    writeFileSync(path.join(OUT, 'pearl-idle.json'), JSON.stringify(seen, null, 2));
    test.info().annotations.push({ type: 'pearl-idle', description: JSON.stringify(seen) });
    await s.close();
  }
});

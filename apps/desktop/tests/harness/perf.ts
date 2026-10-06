/// <reference lib="dom" />
// Main-thread time while a person acts: long tasks (> 50 ms, the page can't draw a frame) and
// layout shifts, counted by PerformanceObservers attached after load (they only read), plus the
// frames drawn while scrolling a list with the wheel (Recorder + fps in frames.ts).
import type { Page } from '@playwright/test';

export type Perf = { longTasks: number; longestMs: number; layoutShift: number };

export async function watchPerf(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __biseHarnessPerf?: { longTasks: number; longestMs: number; layoutShift: number } };
    const p = { longTasks: 0, longestMs: 0, layoutShift: 0 };
    w.__biseHarnessPerf = p;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) { p.longTasks++; p.longestMs = Math.max(p.longestMs, e.duration); }
    }).observe({ type: 'longtask' });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) p.layoutShift += (e as unknown as { value: number }).value;
    }).observe({ type: 'layout-shift' });
  });
}

export async function readPerf(page: Page): Promise<Perf> {
  return page.evaluate(() => {
    const w = window as unknown as { __biseHarnessPerf?: Perf };
    return { ...(w.__biseHarnessPerf ?? { longTasks: -1, longestMs: -1, layoutShift: -1 }) };
  });
}

/** Scrolls `target` with the mouse wheel, `steps` notches of `dy` px, `gapMs` apart. */
export async function wheel(page: Page, target: string, steps = 20, dy = 120, gapMs = 16): Promise<void> {
  const box = await page.locator(target).boundingBox();
  if (!box) throw new Error(`wheel: ${target} is not on screen`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy);
    await page.waitForTimeout(gapMs);
  }
}

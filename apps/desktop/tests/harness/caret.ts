/// <reference lib="dom" />
// The caret is drawn and blinks: two pictures of the caret's box taken ~600 ms apart differ (the
// blink), with Playwright's caret kept (its screenshots hide the caret unless caret:'initial').
// Focus emulation (launch.ts) makes Chromium draw it in a window that is never focused.
import type { Page } from '@playwright/test';
import type { Box } from './frames';

/** The caret's box: the collapsed selection's rect widened a little, else the field's box. */
export async function caretBox(page: Page, field: string): Promise<Box | null> {
  const fromRange = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el || el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) return null;
    const s = window.getSelection();
    if (!s || s.rangeCount === 0) return null;
    const r = s.getRangeAt(0).getClientRects()[0] ?? s.getRangeAt(0).getBoundingClientRect();
    if (r.height === 0) return null;
    return { x: r.x - 4, y: r.y - 2, width: 8, height: r.height + 4 };
  }, field);
  return fromRange ?? (await page.locator(field).boundingBox());
}

export type CaretReport = { box: Box | null; shots: number; differingPairs: number; blinks: boolean };

/** Takes `shots` pictures of the caret's box `gapMs` apart; it blinks if any two in a row differ. */
export async function caretBlinks(page: Page, field: string, shots = 4, gapMs = 300): Promise<CaretReport> {
  const box = await caretBox(page, field);
  if (!box) return { box, shots: 0, differingPairs: 0, blinks: false };
  const pics: Buffer[] = [];
  for (let i = 0; i < shots; i++) {
    pics.push(await page.screenshot({ caret: 'initial', clip: box, animations: 'allow' }));
    if (i + 1 < shots) await page.waitForTimeout(gapMs);
  }
  const differingPairs = pics.filter((p, i) => i > 0 && !p.equals(pics[i - 1] ?? p)).length;
  return { box, shots, differingPairs, blinks: differingPairs > 0 };
}

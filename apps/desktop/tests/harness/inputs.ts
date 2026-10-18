/// <reference lib="dom" />
// Inputs a person makes that page.keyboard/mouse don't cover:
//   dropFiles(page, target, files)  a drag of files from Finder onto an element, through CDP
//                                   Input.dispatchDragEvent (Chromium's real drag-and-drop path);
//   pasteImage(page, target, png)   a paste of an image. NOT the system pasteboard: writing it
//                                   would clobber his clipboard (harness rule: nothing of his).
//                                   So a paste event with the image in its clipboardData is fired
//                                   at the focused element; the app's paste handler sees what a
//                                   ⌘V of a screenshot gives it. The one documented exception to
//                                   'real input only'; the key itself (⌘V) is a real key.
//   frameInput(page, frame)         the pointer, the wheel and a few keys inside a cross-origin
//                                   frame (an artifact's viewer, an OOPIF), on that frame's own CDP
//                                   session (frameinput.mjs). The second documented exception
//                                   (architect m_30735): the harness's offscreen windows never route
//                                   input into an OOPIF, his windows do; so the same Input events
//                                   skip the browser's hit test, which the helper does itself (the
//                                   iframe must be on top at each point, else it throws). Refused
//                                   for a same-origin frame; keys that are the window's stay
//                                   page.keyboard.
//   the fake microphone: launch with { micWav } (launch.ts), Chromium's fake capture device plays
//   the wav; the real mic is never opened.
export { frameInput, type FrameInput } from './frameinput.mjs';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';

const MIME: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.txt': 'text/plain', '.md': 'text/markdown' };

/** Drags the files onto the center of `target` and drops them. */
export async function dropFiles(page: Page, target: string, files: string[]): Promise<void> {
  const box = await page.locator(target).boundingBox();
  if (!box) throw new Error(`dropFiles: ${target} is not on screen`);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const cdp = await page.context().newCDPSession(page);
  const data = {
    items: [] as { mimeType: string; data: string }[],
    files: files.map((f) => path.resolve(f)),
    dragOperationsMask: 1,
  };
  for (const type of ['dragEnter', 'dragOver', 'drop'] as const) {
    await cdp.send('Input.dispatchDragEvent', { type, x, y, data });
  }
  await cdp.detach();
}

/** Focuses `target`, presses ⌘V, and delivers the image as the paste's clipboardData. */
export async function pasteImage(page: Page, target: string, imagePath: string): Promise<void> {
  const ext = path.extname(imagePath).toLowerCase();
  const b64 = readFileSync(imagePath).toString('base64');
  await page.focus(target);
  await page.evaluate(({ sel, b64, mime, name }) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`pasteImage: no ${sel}`);
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], name, { type: mime }));
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, { sel: target, b64, mime: MIME[ext] ?? 'application/octet-stream', name: path.basename(imagePath) });
}

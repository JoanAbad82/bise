/// <reference lib="dom" />
// The typing invariants (guarantee 2: on every surface, while typing):
//   - 0 replaced nodes in the field and in the lists: an observer counts every node removed from
//     the DOM under the watched selectors (a re-render that rewrites a region removes its nodes);
//   - focus kept: the element focused when typing starts is still focused after every key;
//   - selection kept: the caret moves forward by one character per typed character.
// The observer only reads (it is attached through CDP after load and never drives the page), so it
// is not a hook in guarantee 6's sense. Keys go through page.keyboard: CDP Input, Chromium's real
// input path (keydown, beforeinput, input, the caret).
import type { Page } from '@playwright/test';

export type Mutations = { selector: string; removed: number; added: number; text: number };
export type TypingReport = {
  typed: string;
  mutations: Mutations[];
  focusLost: number[];
  /** indices of keys after which the caret did not move forward by exactly one character */
  caretJumps: number[];
  value: string;
};

/** Starts counting removed/added nodes and text changes under each selector. */
export async function watchMutations(page: Page, selectors: string[]): Promise<void> {
  await page.evaluate((sels) => {
    type W = { selector: string; removed: number; added: number; text: number };
    const w = window as unknown as { __biseHarnessMut?: { obs: MutationObserver[]; counts: W[] } };
    w.__biseHarnessMut?.obs.forEach((o) => { o.disconnect(); });
    const counts: W[] = sels.map((s) => ({ selector: s, removed: 0, added: 0, text: 0 }));
    const obs = sels.flatMap((s, i) => Array.from(document.querySelectorAll(s)).map((el) => {
      const o = new MutationObserver((records) => {
        const c = counts[i];
        if (!c) return;
        for (const r of records) {
          if (r.type === 'characterData') c.text++;
          c.removed += r.removedNodes.length;
          c.added += r.addedNodes.length;
        }
      });
      o.observe(el, { childList: true, subtree: true, characterData: true });
      return o;
    }));
    w.__biseHarnessMut = { obs, counts };
  }, selectors);
}

export async function readMutations(page: Page): Promise<Mutations[]> {
  return page.evaluate(() => {
    const w = window as unknown as { __biseHarnessMut?: { counts: Mutations[] } };
    return w.__biseHarnessMut?.counts.map((c) => ({ ...c })) ?? [];
  });
}

type Snap = { focused: boolean; offset: number; value: string };

/** Where focus and the caret are, relative to the field. */
const snap = (page: Page, field: string): Promise<Snap> =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const active = document.activeElement;
    const focused = !!el && !!active && (el === active || el.contains(active));
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      return { focused, offset: el.selectionEnd ?? -1, value: el.value };
    }
    const s = window.getSelection();
    let offset = -1;
    if (el && s && s.rangeCount > 0) {
      const r = s.getRangeAt(0).cloneRange();
      r.selectNodeContents(el);
      r.setEnd(s.getRangeAt(0).endContainer, s.getRangeAt(0).endOffset);
      offset = r.toString().length;
    }
    return { focused, offset, value: el?.textContent ?? '' };
  }, field);

/**
 * Clicks the field, then types `text` one key at a time and checks focus and caret after each key;
 * mutations are counted under `watch` (the field and the lists) from the first key to the last.
 */
export async function typeAndWatch(page: Page, field: string, text: string, watch: string[] = [field], delayMs = 40): Promise<TypingReport> {
  await page.click(field);
  await watchMutations(page, watch);
  const focusLost: number[] = [];
  const caretJumps: number[] = [];
  let prev = await snap(page, field);
  let i = 0;
  for (const ch of text) {
    await page.keyboard.type(ch);
    if (delayMs) await page.waitForTimeout(delayMs);
    const now = await snap(page, field);
    if (!now.focused) focusLost.push(i);
    if (now.offset !== prev.offset + 1) caretJumps.push(i);
    prev = now;
    i++;
  }
  return { typed: text, mutations: await readMutations(page), focusLost, caretJumps, value: prev.value };
}

/** The field's own text nodes may change while typing; replaced elements may not. */
export const replacedNodes = (r: TypingReport): number => r.mutations.reduce((n, m) => n + m.removed, 0);

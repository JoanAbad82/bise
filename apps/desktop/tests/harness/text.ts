/// <reference lib="dom" />
// 'Text fully drawn, nothing clipped' (bar row ⛔4, his bug 6: an answer in a panel too small to
// read). For every element under `root` that holds text directly:
//   - clipped: its content overflows its box and the overflow is hidden (no scroll to reach it),
//     or an ellipsis is cut in (text-overflow: ellipsis on an overflowing box);
//   - offscreen: its box reaches outside the viewport;
//   - tiny: its rendered font size is under `minPx` (after transforms: the box's scale counts).
// Read from layout (getBoundingClientRect, scroll sizes, computed style): what the compositor draws.
import type { Page } from '@playwright/test';

export type TextProblem = { kind: 'clipped' | 'offscreen' | 'tiny'; text: string; detail: string };

export async function textProblems(page: Page, root: string, minPx = 12): Promise<TextProblem[]> {
  return page.evaluate(({ root, minPx }) => {
    const out: { kind: 'clipped' | 'offscreen' | 'tiny'; text: string; detail: string }[] = [];
    const top = document.querySelector(root);
    if (!top) return [{ kind: 'offscreen' as const, text: '', detail: `no ${root}` }];
    const vw = window.innerWidth, vh = window.innerHeight;
    const hidden = (v: string): boolean => v === 'hidden' || v === 'clip';
    for (const el of [top, ...Array.from(top.querySelectorAll('*'))]) {
      if (!(el instanceof HTMLElement)) continue;
      const own = Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '');
      if (!own) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const text = el.textContent.trim().slice(0, 60);
      const r = el.getBoundingClientRect();
      const scale = el.offsetWidth > 0 ? r.width / el.offsetWidth : 1;
      const px = parseFloat(cs.fontSize) * scale;
      if (px < minPx) out.push({ kind: 'tiny', text, detail: `${px.toFixed(1)}px < ${minPx}px` });
      const overX = el.scrollWidth > el.clientWidth + 1, overY = el.scrollHeight > el.clientHeight + 1;
      if ((overX && hidden(cs.overflowX)) || (overY && hidden(cs.overflowY))) {
        out.push({ kind: 'clipped', text, detail: `content ${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight}, overflow ${cs.overflowX}/${cs.overflowY}${cs.textOverflow === 'ellipsis' ? ', ellipsis' : ''}` });
      }
      if (r.right > vw + 1 || r.bottom > vh + 1 || r.left < -1 || r.top < -1) {
        out.push({ kind: 'offscreen', text, detail: `box ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} in ${vw}x${vh}` });
      }
    }
    return out;
  }, { root, minPx });
}

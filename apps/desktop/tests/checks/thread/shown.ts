// A thread row counts as shown only when a person could see and point at it, not when its text
// is in the DOM: amb-win's 35d08ae5 found short threads whose rows react-virtuoso kept
// visibility:hidden until a scroll, while every textContent check passed (lead m_10682).
// Shown = a non-zero box that meets the window, computed visibility 'visible', no ancestor at
// opacity 0 or display:none, and elementFromPoint at the center of its box within the window
// (or, when a floating control sits on the center, at one of four points around it) returns the
// row or something inside it.
import { expect, type Locator } from '@playwright/test';

export type Shown = { ok: true } | { ok: false; why: string };

/** Reads, in the page, whether the element is visible and hit-testable (see the file's top). */
export async function shownOf(row: Locator): Promise<Shown> {
  return row.evaluate((el): Shown => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return { ok: false, why: `its box is empty (${String(r.width)}×${String(r.height)})` };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.max(r.left, 0);
    const right = Math.min(r.right, vw);
    const top = Math.max(r.top, 0);
    const bottom = Math.min(r.bottom, vh);
    if (right - left < 1 || bottom - top < 1) return { ok: false, why: `outside the window (top ${String(Math.round(r.top))}, window ${String(vh)} high)` };
    const own = getComputedStyle(el);
    if (own.visibility !== 'visible') return { ok: false, why: `visibility: ${own.visibility}` };
    for (let a: Element | null = el; a; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.display === 'none') return { ok: false, why: `an ancestor is display:none (${a.tagName.toLowerCase()}${a.getAttribute('data-testid') ? `[${a.getAttribute('data-testid') ?? ''}]` : ''})` };
      if (Number(cs.opacity) === 0) return { ok: false, why: `an ancestor has opacity 0 (${a.tagName.toLowerCase()}${a.getAttribute('data-testid') ? `[${a.getAttribute('data-testid') ?? ''}]` : ''})` };
    }
    // its center first, then four points around it: a floating control (the thread's to-end pill)
    // over the center of a short row leaves the row seen and clickable; nothing hit at all is not
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;
    const w = right - left;
    const h = bottom - top;
    const points: [number, number][] = [[cx, cy], [left + w / 4, cy], [left + (3 * w) / 4, cy], [cx, top + h / 4], [cx, top + (3 * h) / 4]];
    const covers: string[] = [];
    for (const [x, y] of points) {
      const hit = document.elementFromPoint(x, y);
      if (hit && (hit === el || el.contains(hit))) return { ok: true };
      covers.push(hit ? `${hit.tagName.toLowerCase()} '${hit.getAttribute('data-testid') ?? (hit.getAttribute('class') ?? '').slice(0, 40)}'` : 'nothing');
    }
    const toEnd = document.querySelector('[data-testid="thread.to-end"]') ? ' (the to-end pill is up: the list is not at its end)' : '';
    return { ok: false, why: `not hit at its center or around it: ${[...new Set(covers)].join(', ')}${toEnd}` };
  });
}

/** Fails (after polling up to `timeout`) unless the row is shown: visible and hit-testable. */
export async function expectShown(row: Locator, message: string, timeout = 3000): Promise<void> {
  await expect.poll(() => why(row), { message: `${message}: shown (visible and hit-testable)`, timeout }).toBe('shown');
}

/** expectShown as a soft check: the run goes on and the reason lands in the report. */
export async function expectShownSoft(row: Locator, message: string, timeout = 3000): Promise<void> {
  const end = Date.now() + timeout;
  let last = await why(row);
  while (last !== 'shown' && Date.now() < end) {
    await row.page().waitForTimeout(100);
    last = await why(row);
  }
  expect.soft(last, `${message}: shown (visible and hit-testable)`).toBe('shown');
}

async function why(row: Locator): Promise<string> {
  const s = await shownOf(row.first()).catch((e: unknown): Shown => ({ ok: false, why: String(e).split('\n')[0] ?? 'no row' }));
  return s.ok ? 'shown' : s.why;
}

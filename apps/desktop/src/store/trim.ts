// The thread's view stays small however far he scrolls (thread-perf): the entries far from the one
// he reads leave the view, the hub pages them back when he scrolls to them. A thread is endless
// (compaction never shortens a transcript), so without it a long scroll up held every entry and
// each new line re-read them all.
//
// Older side: more than MAX_ABOVE entries above the one he reads, the oldest go down to
// KEEP_ABOVE; the view's `before` is then its new oldest (the list's 'older messages…' pages them
// back). Newer side: more than MAX_BELOW entries under him before the window's gap (or before the
// tail's last TAIL_KEEP), the ones past KEEP_BELOW go into the gap (store/window.ts: the gap row
// pages them back as he scrolls down). The tail's newest TAIL_KEEP stay: live lines land there.
// Never while a window page is asked (its answer is placed against the view it was asked for).
// Pure. Owner: thread-perf.
import type { ThreadOrder } from "./types";

export const MAX_ABOVE = 600;
export const KEEP_ABOVE = 300;
export const MAX_BELOW = 600;
export const KEEP_BELOW = 300;
export const TAIL_KEEP = 60;

/** The view with the far entries out, and the positions that left it (none: the same view). */
export function trim(v: ThreadOrder, reading: number): { view: ThreadOrder; dropped: readonly number[] } {
  const same = { view: v, dropped: [] as number[] };
  const o = v.order;
  const i = o.indexOf(reading);
  if (i < 0 || o.length <= KEEP_ABOVE + KEEP_BELOW + TAIL_KEEP) return same;
  let lo = 0;
  let hi = o.length; // kept: [lo, hi) and the tail's newest from `tail`
  let gap = v.gap;
  let before = v.before;
  let more = v.more;
  // the older side
  if (i > MAX_ABOVE) {
    lo = i - KEEP_ABOVE;
    before = o[lo] ?? before;
    more = true;
    // the cut passed the window: what is left is the tail's run
    if (gap !== undefined && (o[lo] ?? 0) >= gap.hi) gap = undefined;
  }
  // the newer side: under him up to the gap (he reads in the window), else to the tail's newest
  const gi = gap === undefined ? -1 : o.indexOf(gap.lo);
  const inWindow = gap !== undefined && reading <= gap.lo;
  const end = inWindow ? gi + 1 : gap === undefined ? o.length - TAIL_KEEP : -1;
  if (end > 0 && end - i - 1 > MAX_BELOW) {
    const last = i + KEEP_BELOW;
    const first = o[last + 1];
    const keepLo = o[last];
    const tailHi = inWindow && gap !== undefined ? gap.hi : o[end];
    if (first !== undefined && keepLo !== undefined && tailHi !== undefined) {
      gap = { lo: keepLo, hi: tailHi, from: first };
      hi = last + 1;
    }
  }
  if (lo === 0 && hi === o.length) return same;
  const tailFrom = gap === undefined ? o.length : o.findIndex((p) => p >= gap.hi);
  const keep = [...o.slice(lo, hi), ...o.slice(Math.max(hi, tailFrom < 0 ? o.length : tailFrom))];
  const kept = new Set(keep);
  const view: ThreadOrder = { order: keep, before, more, loaded: true, ...(gap === undefined ? {} : { gap }) };
  return { view, dropped: o.filter((p) => !kept.has(p)) };
}

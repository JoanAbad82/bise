// The thread's list: virtualized, keyed, newest at the bottom. Owner: amb-win.
//
// What it guarantees (the reset's typing and flicker rules):
// - rows are keyed by their own key ('e:<pos>' an entry, 'p:<cid>' a send
//   not confirmed yet), so a new entry mounts one row and an entry replaced
//   at its pos re-renders that row only (the row reads its entry with the
//   store's per-key hook, not from this list's props);
// - rows that come or go before the one he reads don't move it: an older
//   page in front (firstItemIndex goes down), far rows the store trimmed
//   (it goes up; trim.ts, told the row he reads by onRead), a window's gap
//   filled above him; the row is held at its y by its key (thread-perf);
// - a jump of his (⌘F's match, his answer far back) wins over that hold; a reveal of a row not
//   listed yet (⌘F's match in a fold that opens for it) waits for it, HOLD_MS at most;
// - at the bottom it follows new rows; scrolled up, it stays where he is;
// - the list never holds the composer: it sits beside it in the screen.
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { keep } from '@/app/keep';
import './thread.css';
import { Press } from '@/ds';

// the list's own end, inside the scroller (designer's composer-strip A): the 12 px the bottom fade
// lies on at the end, so it never fades the last row (thread.css .th-list-end)
// the tail (his sends on their way) is the scrollable list's own end, in Virtuoso's footer, never a
// band pinned under the list (his « directement dans l'historique en bas, dans la partie
// scrollable », queue-drawer-fix); given as Virtuoso's own `context` (a React context set
// around it never reached its footer), so the footer component stays the same one
function ListEnd({ context: tail }: { context?: ReactNode }) {
  return (
    <>
      {tail}
      <div className="th-list-end" aria-hidden="true" />
    </>
  );
}
// Virtuoso reads its `components` object (never undefined): the end always, the head when it has one
const END = { Footer: ListEnd };
// Virtuoso measures its own box: it must fill the list's flex area
const FILL = { flex: '1 1 auto', minHeight: 0 };
// it opens on the newest row's end (a long answer's last line, not its
// first): at the bottom, so new rows follow
const LAST = { index: 'LAST', align: 'end' } as const;

/** Far from 0: room for every older row that may come in front. */
const START = 1_000_000_000;

export interface ThreadListHandle {
  /** bring a row into view (⌘F's current match, a card's entry) */
  scrollTo(key: string): void;
  /** bring a row into view only when it isn't whole in it already (answered-link: his answer);
   * `shown` runs once the row is drawn and whole in it (his answer's flash) */
  reveal(key: string, shown?: () => void): void;
  /** to the newest row */
  scrollToEnd(): void;
  /**
   * Keep the view still while rows open or close (⌘E opens everything): the row at the top of
   * the view keeps its y, the thread grows below it (designer m_17092).
   */
  holdView(): void;
}

export interface ThreadListProps {
  /** the rows' keys, oldest first */
  keys: readonly string[];
  /** one row (its own hooks read its data) */
  row: (key: string) => ReactNode;
  /** older rows exist before the first one */
  more: boolean;
  /** ask the page before the first row (called again only after keys change) */
  onOlder: () => void;
  /** above the oldest row while `more` (a loading line) */
  head?: ReactNode;
  /** under the newest row, the scrollable list's end (its footer): drawn in
   * the same frame as the change that adds it (his sends before they land) */
  tail?: ReactNode;
  testId?: string;
  ref?: Ref<ThreadListHandle>;
  /** where his scroll is kept across a reload (keep.ts 'scroll:<it>', 10 minutes); none: not kept */
  keepKey?: string;
  /** the part of a row held still when an older page comes in front (a
   * selector inside the row: its words, not a divider above them that goes
   * once the row before it arrives); none: the whole row */
  holdPart?: string;
  /** a row's React key when not its own (the live row and the entry that takes its place share one) */
  reactKey?: (key: string) => string;
  /**
   * He scrolled up to read (H10, amb-home: the inbox block folds to one line, the composer's keys
   * line hides), or he is back at the end. Told on each change.
   */
  onReading?: (reading: boolean) => void;
  /** the key of the row he reads, scrolled up, when it changes (the store keeps the rows near it: trim.ts) */
  onRead?: (key: string) => void;
}

/**
 * The first item's index for Virtuoso: down by the number of rows that came
 * in front of the previous first one (an older page), up by the number of
 * rows that left the front (the store's trim: far entries leave the view,
 * `before` the keys the list had), unchanged otherwise. Pure, exported for the tests.
 */
export function nextFirstIndex(prev: { first: string | undefined; index: number }, keys: readonly string[], before: readonly string[] = []): { first: string | undefined; index: number } {
  const first = keys[0];
  if (first === prev.first) return prev;
  const k = prev.first === undefined ? -1 : keys.indexOf(prev.first);
  if (k > 0) return { first, index: prev.index - k };
  const j = first === undefined ? -1 : before.indexOf(first);
  return { first, index: k < 0 && j > 0 ? prev.index + j : prev.index };
}

/**
 * The row to hold still while an older page comes in front: the first one
 * whose bottom is under the list's top edge (the line he reads), as
 * Virtuoso's data-item-index (with firstItemIndex: stable across a
 * prepend, unlike data-index, the position in `keys`). None when no row shows. Pure.
 */
export function anchorRow(rows: readonly { index: number; top: number; bottom: number }[], edge: number): { index: number; top: number } | undefined {
  const r = rows.find((x) => x.bottom > edge);
  return r === undefined ? undefined : { index: r.index, top: r.top };
}

/** A row whole inside the list's box (reveal: no scroll then). Pure. */
export function rowWhole(row: { top: number; bottom: number }, view: { top: number; bottom: number }): boolean {
  return row.top >= view.top && row.bottom <= view.bottom;
}

/**
 * His place in a thread as keep.ts holds it: the key of the row he reads (the first one under the
 * top edge) and its top's px from that edge, so it comes back at the same y, back on the thread
 * after an artifact, ‹ › or a reload. An older build kept the key alone (no px). Pure.
 */
export function placeOf(v: unknown): { key: string; off: number } | undefined {
  if (typeof v === 'string') return { key: v, off: 0 };
  if (typeof v !== 'object' || v === null) return undefined;
  const { key, off } = v as { key?: unknown; off?: unknown };
  return typeof key === 'string' ? { key, off: typeof off === 'number' && Number.isFinite(off) ? off : 0 } : undefined;
}

/** How long after a prepend the anchor row is held (Virtuoso measures the new rows over a few frames). */
const HOLD_MS = 1500;
/** How many frames a reveal nudges its row toward the view's centre at most (~1.5 s at 60 fps). */
const HOLD_FRAMES = 90;

/** The part of a row held still: `sel` inside it when given and there, else the row. */
function partOf(row: HTMLElement, sel: string | undefined): HTMLElement {
  return (sel === undefined ? null : row.querySelector<HTMLElement>(sel)) ?? row;
}

/** How many keys came after `last` (an older page in front doesn't count). Pure. */
export function newAtEnd(last: string | undefined, keys: readonly string[]): number {
  if (last === undefined) return 0;
  const i = keys.lastIndexOf(last);
  return i < 0 ? 0 : keys.length - 1 - i;
}

export function ThreadList({ keys, row, more, onOlder, head, tail, testId, ref, keepKey, holdPart, reactKey, onReading, onRead }: ThreadListProps) {
  const virtuoso = useRef<VirtuosoHandle>(null);
  // the anchor of firstItemIndex, moved during render (React's
  // "state from the previous render" pattern): no effect, no extra frame
  const [anchor, setAnchor] = useState<{ first: string | undefined; index: number }>({ first: keys[0], index: START });
  // the keys of the last commit: rows that left the front (the store's trim) move firstItemIndex up
  const lastKeys = useRef(keys);
  const next = nextFirstIndex(anchor, keys, lastKeys.current);
  if (next !== anchor) setAnchor(next);

  // the row he reads, measured at each scroll of his (not while held): when
  // rows come or go before it (an older page in front, a gap filled above, far rows trimmed), that
  // row is held at that y (hold below). `key`: its key, which a change of the keys doesn't move
  const scroller = useRef<HTMLElement | null>(null);
  const reading = useRef<{ index: number; top: number; key?: string } | undefined>(undefined);
  const keysNow = useRef(keys);
  keysNow.current = keys;
  const tellRead = useRef(onRead);
  tellRead.current = onRead;
  const told = useRef<string | undefined>(undefined);
  // click: held because he opened or closed a row (it keeps its y even at the end: never re-stuck)
  const held = useRef<{ index: number; top: number; until: number; click?: boolean } | undefined>(undefined);
  const holdRef = useRef<() => void>(() => undefined);
  // his place written to keep.ts (keepPlace below, once `stick` exists)
  const placeRef = useRef<() => void>(() => undefined);
  const measure = useCallback(() => {
    const el = scroller.current;
    if (el === null) return;
    if (held.current !== undefined) {
      holdRef.current();
      return;
    }
    const rows = [...el.querySelectorAll<HTMLElement>('[data-item-index]')].map((r) => {
      const b = partOf(r, holdPart).getBoundingClientRect();
      return { index: Number(r.dataset.itemIndex), top: b.top, bottom: b.bottom };
    });
    const a = anchorRow(rows, el.getBoundingClientRect().top);
    const key = a === undefined ? undefined : keysNow.current[a.index - firstIndex.current];
    reading.current = a === undefined ? undefined : { ...a, ...(key === undefined ? {} : { key }) };
    // the store keeps the rows near it (trim.ts); told when it changes, while he reads up there
    if (key !== undefined && key !== told.current && !stick.current) {
      told.current = key;
      tellRead.current?.(key);
    }
    placeRef.current();
  }, [holdPart]);
  const scrollerRef = useCallback(
    (el: HTMLElement | Window | null) => {
      scroller.current?.removeEventListener('scroll', measure);
      scroller.current = el instanceof HTMLElement ? el : null;
      scroller.current?.addEventListener('scroll', measure, { passive: true });
    },
    [measure],
  );

  // one older page at a time: asked again only once the keys changed
  const asked = useRef<string | undefined>(undefined);
  const startReached = useCallback(() => {
    if (!more || asked.current === keys[0]) return;
    asked.current = keys[0];
    onOlder();
  }, [more, keys, onOlder]);

  // M2 / N11: scrolled up, a bar takes him back to the newest, with how
  // many rows came meanwhile (the TUI's 'back to the bottom · N new')
  const [atBottom, setAtBottom] = useState(true);
  const [seen, setSeen] = useState({ last: keys.at(-1), count: keys.length, unseen: 0 });
  const last = keys.at(-1);
  if (last !== seen.last) {
    const added = atBottom ? 0 : newAtEnd(seen.last, keys);
    setSeen({ last, count: keys.length, unseen: atBottom ? 0 : seen.unseen + added });
  }
  // it opens on the newest row's end. Not through Virtuoso's
  // initialTopMostItemIndex: that keeps the whole list visibility:hidden
  // until a scroll event says the item was reached, and a thread shorter
  // than the screen never scrolls, so its rows stayed invisible and could
  // not be selected (his bug 3, qa-type 7a27cbab). Once, when the first rows come.
  // After a reload (keep.ts) it opens where he had scrolled up to, if that row is loaded
  // (below, once `stick` exists).
  const opened = useRef(false);
  // he moved this list (wheel, key, press): only then is a place written. The list a mount put
  // back keeps the place it was given: the narrow thread beside an artifact wraps its rows
  // taller, so its own px would bring the wide one back lower than he left it.
  const moved = useRef(false);
  // a kept place being put back (the frames after the restore): Virtuoso's first atBottom, from
  // its mount at the end, may come after it and must not stick the list back to the end
  const restoring = useRef(false);
  const scrollKey = keepKey === undefined ? undefined : `scroll:${keepKey}`;

  // it stays at its end until HE scrolls up (qa-type b37dc4c1, his bug 5):
  // rows measured after the first scroll (long answers, markdown, the real
  // core's pages and entries) grow the list under the end, so Virtuoso's
  // own atBottom goes false with nobody scrolling; while it sticks, every
  // growth goes back to the end and new rows follow. A wheel up or a key
  // that scrolls up unsticks it; at the end, or after his send, it sticks.
  const stick = useRef(true);
  const [stuck, setStuck] = useState(true);
  // a reveal's settle runs (settling), and HOLD_MS after it began (revealUntil): Virtuoso's
  // isAtBottom stays the end's until its scroll events catch up with the reveal's scroll, so a line
  // that came meanwhile followed the output back to the end and the ⌘F hit was gone (history-perf's
  // 'the current match stays put', land-reds). Ends early when he moves the list. revealGen: the
  // newest reveal's, an older settle stops
  const revealUntil = useRef(0);
  const settling = useRef(false);
  const revealGen = useRef(0);
  // a reveal asked before its row was listed (find-scroll: ⌘F's match in a fold that opens for it)
  const waiting = useRef<{ key: string; until: number; shown?: () => void } | undefined>(undefined);
  const self = useRef<ThreadListHandle | null>(null);
  const setStick = useCallback((on: boolean) => {
    stick.current = on;
    setStuck(on);
  }, []);
  // to the end by scrollTop, not Virtuoso's scrollToIndex: a scrollToIndex re-runs itself whenever
  // the list's sizes change within 150 ms of its scroll (for up to 1.2 s), and his wheel up brings
  // in unmeasured rows that change those sizes, so a pending one took him back to the end ~300 ms
  // after he scrolled up (qa-flows' type-anywhere red, 3 of 5). While it sticks, each growth comes
  // back here (onGrow, the box observer), which is all the retry it needs.
  const toEndNow = useCallback(() => {
    const el = scroller.current;
    if (el === null) virtuoso.current?.scrollToIndex(LAST);
    else el.scrollTop = el.scrollHeight;
  }, []);
  // the hold: the row he reads (its holdPart) back at the y it had before
  // the prepend, by nudging scrollTop (Virtuoso's own prepend left ~7 px,
  // up to 50 while it measures the new rows). Ends after HOLD_MS, at his
  // wheel, key or click, or when it sticks to the end.
  const hold = useCallback(() => {
    const h = held.current;
    const el = scroller.current;
    if (h === undefined || el === null) return;
    if ((stick.current && h.click !== true) || Date.now() > h.until) {
      held.current = undefined;
      return;
    }
    const row = el.querySelector<HTMLElement>(`[data-item-index="${String(h.index)}"]`);
    if (row === null) return;
    const d = partOf(row, holdPart).getBoundingClientRect().top - h.top;
    if (Math.abs(d) < 0.5) return;
    el.scrollTop += d;
    // he opened a row at the end: he reads it there now, the list no longer follows the end
    if (h.click === true && stick.current) {
      stick.current = false;
      setStuck(false);
    }
  }, [holdPart]);
  useLayoutEffect(() => {
    holdRef.current = hold;
  }, [hold]);
  // Virtuoso draws new or grown rows over its next commits and frames: each
  // scroll it makes comes back through measure (-> hold), each DOM change
  // or resize in the list through the observers (a mutation is a
  // microtask: it runs in a window in the background too, where frames and
  // timers are throttled), and a timer covers the rest; until the hold ends
  const stopHold = useRef<() => void>(() => undefined);
  const keepHeld = useCallback((): (() => void) => {
    stopHold.current();
    hold();
    const el = scroller.current;
    let timer = 0;
    const stop = () => {
      window.clearTimeout(timer);
      mo.disconnect();
      ro.disconnect();
    };
    const again = () => {
      hold();
      if (held.current === undefined) stop();
    };
    const mo = new MutationObserver(again);
    const ro = new ResizeObserver(again);
    if (el !== null) {
      mo.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
      for (const c of el.children) ro.observe(c);
    }
    const tick = () => {
      again();
      if (held.current !== undefined) timer = window.setTimeout(tick, 16);
    };
    timer = window.setTimeout(tick, 0);
    stopHold.current = stop;
    return stop;
  }, [hold]);
  useEffect(
    () => () => {
      stopHold.current();
    },
    [],
  );
  /**
   * He opens or closes a row (a click on its toggle, ⌘E): that row, else the one at the top of
   * the view, keeps its y while the list measures what changed (designer m_17092: an opened row
   * never moves, the thread grows below it; never back to the end on his click).
   */
  const holdRow = useCallback(
    (rowEl: HTMLElement | null) => {
      const el = scroller.current;
      if (el === null) return;
      const top = el.getBoundingClientRect().top;
      const r =
        rowEl ??
        [...el.querySelectorAll<HTMLElement>('[data-item-index]')].find((x) => x.getBoundingClientRect().bottom > top) ??
        null;
      if (r === null) return;
      held.current = { index: Number(r.dataset.itemIndex), top: partOf(r, holdPart).getBoundingClientRect().top, until: Date.now() + HOLD_MS, click: true };
      keepHeld();
    },
    [holdPart, keepHeld],
  );
  const firstIndex = useRef(next.index);
  useLayoutEffect(() => {
    const before = firstIndex.current;
    firstIndex.current = next.index;
    lastKeys.current = keys;
    // rows came or went before the row he read at the last scroll (an older page in front, a gap
    // filled above, far rows trimmed): hold it. Rows added at the end move nothing
    const r = reading.current;
    if (stick.current || r === undefined) return;
    const at = r.key === undefined ? -1 : keys.indexOf(r.key);
    const index = at < 0 ? r.index : next.index + at;
    if (index === r.index && next.index === before) return;
    reading.current = { ...r, index };
    held.current = { index, top: r.top, until: Date.now() + HOLD_MS };
    return keepHeld();
  }, [keys, next.index, keepHeld]);
  const onGrow = useCallback(() => {
    // a row he opened stays where he opened it, even at the end
    if (held.current?.click === true) hold();
    else if (stick.current) toEndNow();
    else hold();
  }, [toEndNow, hold]);

  // H10: reading = he scrolled up himself (the same as the 'back to the bottom' bar). What is under
  // the list (the inbox block) shrinks then: scrollTop stays, so the rows he reads don't move; back at
  // the end it grows again, and the list's box gets shorter: while it sticks, it goes back to the end.
  const readingUp = !atBottom && !stuck;
  const tellReading = useRef(onReading);
  useEffect(() => {
    tellReading.current = onReading;
  });
  useEffect(() => {
    tellReading.current?.(readingUp);
  }, [readingUp]);
  useEffect(
    () => () => {
      tellReading.current?.(false);
    },
    [],
  );
  // the scroller is Virtuoso's: it exists once the first rows are drawn
  const drawn = keys.length > 0;
  useEffect(() => {
    const el = scroller.current;
    if (!drawn || el === null) return;
    let h = el.clientHeight;
    const ro = new ResizeObserver(() => {
      const now = el.clientHeight;
      if (now < h && stick.current && held.current?.click !== true) toEndNow();
      h = now;
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [toEndNow, drawn]);

  useLayoutEffect(() => {
    if (opened.current || keys.length === 0) return;
    opened.current = true;
    const at = scrollKey === undefined ? undefined : placeOf(keep.view(scrollKey));
    const i = at === undefined ? -1 : keys.indexOf(at.key);
    if (at !== undefined && i >= 0 && i < keys.length - 1) {
      // unstuck now (no growth may take it back to the end), drawn so in the next tick
      stick.current = false;
      queueMicrotask(() => {
        setStuck(false);
      });
      // that row's top back at its px from the top edge
      virtuoso.current?.scrollToIndex({ index: i, align: 'start', offset: -at.off });
      // Virtuoso lands on its estimated sizes (a few px off): that row's top, measured in the
      // DOM, is nudged back to its px over the next frames, until he moves the list
      const index = firstIndex.current + i;
      const until = Date.now() + HOLD_MS;
      restoring.current = true;
      const settle = () => {
        if (moved.current || Date.now() >= until) {
          restoring.current = false;
          return;
        }
        if (stick.current) {
          stick.current = false;
          setStuck(false);
        }
        const el = scroller.current;
        const r = el?.querySelector<HTMLElement>(`[data-item-index="${String(index)}"]`) ?? null;
        if (el !== null && r !== null) {
          const d = r.getBoundingClientRect().top - el.getBoundingClientRect().top - at.off;
          if (Math.abs(d) >= 0.5) el.scrollTop += d;
        }
        requestAnimationFrame(settle);
      };
      requestAnimationFrame(settle);
    } else toEndNow();
  }, [keys, scrollKey, toEndNow]);
  // his place while scrolled up: the row he reads, measured in the DOM (Virtuoso's range starts
  // in the 600 px drawn above the view, so its first row is one he doesn't see); at the end,
  // nothing kept. At each scroll (measure) and each new range, once he moved it.
  const keepPlace = useCallback(() => {
    // a mount that only put his place back writes nothing, not even "at the end": Virtuoso's
    // first atBottom (before the restore lands) sticks it for a frame
    if (scrollKey === undefined || !opened.current || !moved.current) return;
    if (stick.current) {
      keep.setView(scrollKey, undefined, true);
      return;
    }
    const el = scroller.current;
    if (el === null) return;
    const edge = el.getBoundingClientRect().top;
    const rows = Array.from(el.querySelectorAll<HTMLElement>('[data-item-index]'), (r) => {
      const b = r.getBoundingClientRect();
      return { index: Number(r.dataset.itemIndex), top: b.top, bottom: b.bottom };
    });
    const a = anchorRow(rows, edge);
    const key = a === undefined ? undefined : keys[a.index - next.index];
    if (a === undefined || key === undefined) return;
    keep.setView(scrollKey, { key, off: Math.round(a.top - edge) }, true);
  }, [scrollKey, keys, next.index]);
  useLayoutEffect(() => {
    placeRef.current = keepPlace;
  }, [keepPlace]);
  const onRange = useCallback(() => {
    keepPlace();
  }, [keepPlace]);

  const toEnd = useCallback(() => {
    setStick(true);
    if (keys.length > 0) toEndNow();
  }, [keys, setStick, toEndNow]);

  useImperativeHandle(
    ref,
    () => (self.current = {
      scrollTo(key) {
        const i = keys.indexOf(key);
        waiting.current = undefined;
        if (i < 0) return;
        // a jump of his (⌘F, a quote's source) wins over the row held still
        held.current = undefined;
        stopHold.current();
        virtuoso.current?.scrollToIndex({ index: i, align: 'center' });
      },
      reveal(key, shown) {
        const i = keys.indexOf(key);
        // not a row yet (⌘F's match in a fold that opens for it, find-scroll): revealed when it comes
        waiting.current = i < 0 ? { key, until: Date.now() + HOLD_MS, ...(shown === undefined ? {} : { shown }) } : undefined;
        if (i < 0) return;
        // a jump of his (⌘F's match, his answer far back) wins over the row held still: the window
        // that came in front for it would hold the row he read before (the keys' hold)
        held.current = undefined;
        stopHold.current();
        // a row drawn and whole in the view stays where it is (his ask: only when it is outside)
        const el = scroller.current;
        const row = el?.querySelector<HTMLElement>(`[data-item-index="${String(next.index + i)}"]`) ?? null;
        if (el !== null && row !== null && rowWhole(row.getBoundingClientRect(), el.getBoundingClientRect())) {
          shown?.();
          return;
        }
        // he reads up there now: no growth takes the list back to its end
        setStick(false);
        virtuoso.current?.scrollToIndex({ index: i, align: 'center' });
        // Virtuoso lands on its estimated sizes (far off in a long thread of unmeasured rows): once
        // the row is drawn, its centre is nudged to the view's over the next frames, until it shows
        // whole, he moves the list, a newer reveal takes over, or HOLD_FRAMES. Frames, not ms: under
        // load (or off-screen) frames come late, and a 1.5 s deadline gave up before the row was
        // drawn, the list left at Virtuoso's estimate (history-perf's '⏎ to the oldest hit', land-reds);
        // and an older reveal's settle went on beside the newer one, centring a row by its stale
        // index. `shown` waits for the row drawn and whole: a fixed delay missed it under load
        // (inbox-open's flash), the row not drawn yet
        revealGen.current += 1;
        const gen = revealGen.current;
        let frames = 0;
        let lastTop: number | undefined;
        moved.current = false;
        revealUntil.current = Date.now() + HOLD_MS;
        settling.current = true;
        let told = false;
        const tell = (): void => {
          if (told) return;
          told = true;
          shown?.();
        };
        const settle = () => {
          if (revealGen.current !== gen) return;
          const box = scroller.current;
          const r = box?.querySelector<HTMLElement>(`[data-item-index="${String(firstIndex.current + i)}"]`) ?? null;
          frames += 1;
          if (moved.current || frames > HOLD_FRAMES) {
            settling.current = false;
            if (r !== null) tell();
            return;
          }
          if (box === null || r === null) {
            // Virtuoso's scrollToIndex can stall (find-walk-red: a window replaced, then a new one
            // in front, its sizes by index still the old ones: the list stayed at the latest rows,
            // scrollTop unmoved for all HOLD_FRAMES): then a viewport at a time toward the row
            const top = box?.scrollTop;
            if (box !== null && r === null && top === lastTop) {
              const at = [...box.querySelectorAll<HTMLElement>('[data-item-index]')].map((x) => Number(x.dataset.itemIndex));
              const step = box.clientHeight * 0.8;
              if (at.length > 0) box.scrollTop += firstIndex.current + i < Math.min(...at) ? -step : step;
            } else virtuoso.current?.scrollToIndex({ index: i, align: 'center' });
            lastTop = top;
          } else {
            const b = r.getBoundingClientRect();
            const v = box.getBoundingClientRect();
            const d = b.top + b.height / 2 - (v.top + v.height / 2);
            if (rowWhole(b, v) && Math.abs(d) < 2) {
              settling.current = false;
              tell();
              return;
            }
            box.scrollTop += b.height > v.height ? b.top - v.top : d;
          }
          requestAnimationFrame(settle);
        };
        requestAnimationFrame(settle);
      },
      scrollToEnd: toEnd,
      holdView() {
        holdRow(null);
      },
    }),
    [keys, next.index, toEnd, holdRow, setStick],
  );
  // a reveal that waits for its row: done once the row is listed (within HOLD_MS)
  useLayoutEffect(() => {
    const w = waiting.current;
    if (w === undefined || !keys.includes(w.key)) return;
    waiting.current = undefined;
    if (Date.now() <= w.until) self.current?.reveal(w.key, w.shown);
  }, [keys]);

  return (
    <div
      className="th-list"
      data-testid={testId}
      data-stuck={stuck}
      onPointerDown={(e) => {
        moved.current = true;
        held.current = undefined;
        // a press on a row's toggle (a fold, a thinking row, a tool line): that row keeps its y
        // while it opens or closes
        const t = e.target as HTMLElement;
        const toggle = t.closest('button, [role="button"], summary, [aria-expanded]');
        const rowEl = toggle?.closest<HTMLElement>('[data-item-index]') ?? null;
        if (rowEl !== null) holdRow(rowEl);
      }}
      onWheel={(e) => {
        moved.current = true;
        held.current = undefined;
        if (e.deltaY < 0 && stick.current) setStick(false);
      }}
      onKeyDown={(e) => {
        moved.current = true;
        if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'].includes(e.key)) held.current = undefined;
        if (['PageUp', 'Home', 'ArrowUp'].includes(e.key) && stick.current) setStick(false);
      }}
    >
      <Virtuoso
        ref={virtuoso}
        context={tail}
        scrollerRef={scrollerRef}
        style={FILL}
        data={keys}
        firstItemIndex={next.index}
        computeItemKey={(_, key) => (reactKey === undefined ? key : reactKey(key))}
        itemContent={(_, key) => row(key)}
        // never back to the end while a row he opened is held
        // nor while a reveal lands (revealUntil)
        followOutput={(b) => (held.current?.click === true || (!moved.current && (settling.current || Date.now() < revealUntil.current)) ? false : b || stick.current ? 'auto' : false)}
        totalListHeightChanged={onGrow}
        rangeChanged={onRange}
        alignToBottom
        startReached={startReached}
        atBottomStateChange={(b) => {
          if (b && restoring.current) return;
          setAtBottom(b);
          if (b) {
            setSeen((x) => ({ ...x, unseen: 0 }));
            setStick(true);
          }
        }}
        components={head !== undefined && more ? { Header: () => head, Footer: ListEnd } : END}
        increaseViewportBy={{ top: 600, bottom: 300 }}
      />
      {!atBottom && !stuck && (
        <Press look="th-to-end" onClick={toEnd} data-testid="thread.to-end">
          ↓ back to the bottom{seen.unseen > 0 ? ` · ${String(seen.unseen)} new` : ''}
        </Press>
      )}
    </div>
  );
}

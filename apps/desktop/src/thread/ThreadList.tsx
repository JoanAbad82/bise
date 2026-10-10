// The thread's list: virtualized, keyed, newest at the bottom. Owner: amb-win.
//
// What it guarantees (the reset's typing and flicker rules):
// - rows are keyed by their own key ('e:<pos>' an entry, 'p:<cid>' a send
//   not confirmed yet), so a new entry mounts one row and an entry replaced
//   at its pos re-renders that row only (the row reads its entry with the
//   store's per-key hook, not from this list's props);
// - an older page that comes in front doesn't move what he reads
//   (firstItemIndex goes down by the rows added in front);
// - at the bottom it follows new rows; scrolled up, it stays where he is;
// - the list never holds the composer: it sits beside it in the screen.
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { keep } from '@/app/keep';
import './thread.css';

// no extra parts (Virtuoso reads its `components` object: never undefined)
const NONE = {};
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
  /** under the newest row, outside the virtual list: drawn in the same
   * frame as the change that adds it (his sends before they land) */
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
}

/**
 * The first item's index for Virtuoso: down by the number of rows that came
 * in front of the previous first one (an older page), unchanged otherwise.
 * Pure, exported for the tests.
 */
export function nextFirstIndex(prev: { first: string | undefined; index: number }, keys: readonly string[]): { first: string | undefined; index: number } {
  const first = keys[0];
  if (first === prev.first) return prev;
  const k = prev.first === undefined ? -1 : keys.indexOf(prev.first);
  return { first, index: k > 0 ? prev.index - k : prev.index };
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

/** How long after a prepend the anchor row is held (Virtuoso measures the new rows over a few frames). */
const HOLD_MS = 1500;

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

export function ThreadList({ keys, row, more, onOlder, head, tail, testId, ref, keepKey, holdPart, reactKey }: ThreadListProps) {
  const virtuoso = useRef<VirtuosoHandle>(null);
  // the anchor of firstItemIndex, moved during render (React's
  // "state from the previous render" pattern): no effect, no extra frame
  const [anchor, setAnchor] = useState<{ first: string | undefined; index: number }>({ first: keys[0], index: START });
  const next = nextFirstIndex(anchor, keys);
  if (next !== anchor) setAnchor(next);

  // the row he reads, measured at each scroll of his (not while held): when
  // an older page comes in front, that row is held at that y (hold below)
  const scroller = useRef<HTMLElement | null>(null);
  const reading = useRef<{ index: number; top: number } | undefined>(undefined);
  // click: held because he opened or closed a row (it keeps its y even at the end: never re-stuck)
  const held = useRef<{ index: number; top: number; until: number; click?: boolean } | undefined>(undefined);
  const holdRef = useRef<() => void>(() => undefined);
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
    reading.current = anchorRow(rows, el.getBoundingClientRect().top);
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
  const scrollKey = keepKey === undefined ? undefined : `scroll:${keepKey}`;

  // it stays at its end until HE scrolls up (qa-type b37dc4c1, his bug 5):
  // rows measured after the first scroll (long answers, markdown, the real
  // core's pages and entries) grow the list under the end, so Virtuoso's
  // own atBottom goes false with nobody scrolling; while it sticks, every
  // growth goes back to the end and new rows follow. A wheel up or a key
  // that scrolls up unsticks it; at the end, or after his send, it sticks.
  const stick = useRef(true);
  const [stuck, setStuck] = useState(true);
  const setStick = useCallback((on: boolean) => {
    stick.current = on;
    setStuck(on);
  }, []);
  const toEndNow = useCallback(() => {
    virtuoso.current?.scrollToIndex(LAST);
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
    // an older page came in front: hold the row he read at the last scroll
    if (next.index >= before || stick.current || reading.current === undefined) return;
    held.current = { ...reading.current, until: Date.now() + HOLD_MS };
    return keepHeld();
  }, [next.index, keepHeld]);
  const onGrow = useCallback(() => {
    // a row he opened stays where he opened it, even at the end
    if (held.current?.click === true) hold();
    else if (stick.current) toEndNow();
    else hold();
  }, [toEndNow, hold]);

  useLayoutEffect(() => {
    if (opened.current || keys.length === 0) return;
    opened.current = true;
    const at = scrollKey === undefined ? undefined : keep.view(scrollKey);
    const i = typeof at === 'string' ? keys.indexOf(at) : -1;
    if (i >= 0 && i < keys.length - 1) {
      // unstuck now (no growth may take it back to the end), drawn so in the next tick
      stick.current = false;
      queueMicrotask(() => {
        setStuck(false);
      });
      virtuoso.current?.scrollToIndex({ index: i, align: 'start' });
    } else virtuoso.current?.scrollToIndex(LAST);
  }, [keys, scrollKey]);
  // his place while scrolled up (the first row in view); at the end, nothing kept
  const onRange = useCallback(
    (r: { startIndex: number }) => {
      if (scrollKey === undefined || !opened.current) return;
      keep.setView(scrollKey, stick.current ? undefined : keys[r.startIndex - next.index], true);
    },
    [scrollKey, keys, next.index],
  );

  const toEnd = useCallback(() => {
    setStick(true);
    if (keys.length > 0) virtuoso.current?.scrollToIndex({ index: keys.length - 1, align: 'end' });
  }, [keys, setStick]);

  useImperativeHandle(
    ref,
    () => ({
      scrollTo(key) {
        const i = keys.indexOf(key);
        if (i >= 0) virtuoso.current?.scrollToIndex({ index: i, align: 'center' });
      },
      scrollToEnd: toEnd,
      holdView() {
        holdRow(null);
      },
    }),
    [keys, toEnd, holdRow],
  );

  return (
    <div
      className="th-list"
      data-testid={testId}
      data-stuck={stuck}
      onPointerDown={(e) => {
        held.current = undefined;
        // a press on a row's toggle (a fold, a thinking row, a tool line): that row keeps its y
        // while it opens or closes
        const t = e.target as HTMLElement;
        const toggle = t.closest('button, [role="button"], summary, [aria-expanded]');
        const rowEl = toggle?.closest<HTMLElement>('[data-item-index]') ?? null;
        if (rowEl !== null) holdRow(rowEl);
      }}
      onWheel={(e) => {
        held.current = undefined;
        if (e.deltaY < 0 && stick.current) setStick(false);
      }}
      onKeyDown={(e) => {
        if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'].includes(e.key)) held.current = undefined;
        if (['PageUp', 'Home', 'ArrowUp'].includes(e.key) && stick.current) setStick(false);
      }}
    >
      <Virtuoso
        ref={virtuoso}
        scrollerRef={scrollerRef}
        style={FILL}
        data={keys}
        firstItemIndex={next.index}
        computeItemKey={(_, key) => (reactKey === undefined ? key : reactKey(key))}
        itemContent={(_, key) => row(key)}
        // never back to the end while a row he opened is held
        followOutput={(b) => (held.current?.click === true ? false : b || stick.current ? 'auto' : false)}
        totalListHeightChanged={onGrow}
        rangeChanged={onRange}
        alignToBottom
        startReached={startReached}
        atBottomStateChange={(b) => {
          setAtBottom(b);
          if (b) {
            setSeen((x) => ({ ...x, unseen: 0 }));
            setStick(true);
          }
        }}
        components={head !== undefined && more ? { Header: () => head } : NONE}
        increaseViewportBy={{ top: 600, bottom: 300 }}
      />
      {tail}
      {!atBottom && !stuck && (
        <button type="button" className="th-to-end" onClick={toEnd} data-testid="thread.to-end">
          ↓ back to the bottom{seen.unseen > 0 ? ` · ${String(seen.unseen)} new` : ''}
        </button>
      )}
    </div>
  );
}

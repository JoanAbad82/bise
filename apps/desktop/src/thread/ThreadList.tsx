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
import { useCallback, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
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

/** How many keys came after `last` (an older page in front doesn't count). Pure. */
export function newAtEnd(last: string | undefined, keys: readonly string[]): number {
  if (last === undefined) return 0;
  const i = keys.lastIndexOf(last);
  return i < 0 ? 0 : keys.length - 1 - i;
}

export function ThreadList({ keys, row, more, onOlder, head, tail, testId, ref }: ThreadListProps) {
  const virtuoso = useRef<VirtuosoHandle>(null);
  // the anchor of firstItemIndex, moved during render (React's
  // "state from the previous render" pattern): no effect, no extra frame
  const [anchor, setAnchor] = useState<{ first: string | undefined; index: number }>({ first: keys[0], index: START });
  const next = nextFirstIndex(anchor, keys);
  if (next !== anchor) setAnchor(next);

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
  const toEnd = useCallback(() => {
    if (keys.length > 0) virtuoso.current?.scrollToIndex({ index: keys.length - 1, align: 'end' });
  }, [keys]);

  useImperativeHandle(
    ref,
    () => ({
      scrollTo(key) {
        const i = keys.indexOf(key);
        if (i >= 0) virtuoso.current?.scrollToIndex({ index: i, align: 'center' });
      },
      scrollToEnd: toEnd,
    }),
    [keys, toEnd],
  );

  return (
    <div className="th-list" data-testid={testId}>
      <Virtuoso
        ref={virtuoso}
        style={FILL}
        data={keys}
        firstItemIndex={next.index}
        initialTopMostItemIndex={LAST}
        computeItemKey={(_, key) => key}
        itemContent={(_, key) => row(key)}
        followOutput={(atBottom) => (atBottom ? 'auto' : false)}
        alignToBottom
        startReached={startReached}
        atBottomStateChange={(b) => {
          setAtBottom(b);
          if (b) setSeen((x) => ({ ...x, unseen: 0 }));
        }}
        components={head !== undefined && more ? { Header: () => head } : NONE}
        increaseViewportBy={{ top: 600, bottom: 300 }}
      />
      {tail}
      {!atBottom && (
        <button type="button" className="th-to-end" onClick={toEnd} data-testid="thread.to-end">
          ↓ back to the bottom{seen.unseen > 0 ? ` · ${String(seen.unseen)} new` : ''}
        </button>
      )}
    </div>
  );
}

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
const FILL = { height: '100%' };

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

export function ThreadList({ keys, row, more, onOlder, head, testId, ref }: ThreadListProps) {
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

  useImperativeHandle(
    ref,
    () => ({
      scrollTo(key) {
        const i = keys.indexOf(key);
        if (i >= 0) virtuoso.current?.scrollToIndex({ index: i, align: 'center' });
      },
      scrollToEnd() {
        if (keys.length > 0) virtuoso.current?.scrollToIndex({ index: keys.length - 1, align: 'end' });
      },
    }),
    [keys],
  );

  return (
    <div className="th-list" data-testid={testId}>
      <Virtuoso
        ref={virtuoso}
        style={FILL}
        data={keys}
        firstItemIndex={next.index}
        initialTopMostItemIndex={Math.max(0, keys.length - 1)}
        computeItemKey={(_, key) => key}
        itemContent={(_, key) => row(key)}
        followOutput={(atBottom) => (atBottom ? 'auto' : false)}
        alignToBottom
        startReached={startReached}
        components={head !== undefined && more ? { Header: () => head } : NONE}
        increaseViewportBy={{ top: 600, bottom: 300 }}
      />
    </div>
  );
}

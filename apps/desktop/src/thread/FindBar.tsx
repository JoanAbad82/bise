// ⌘F's bar (bar 3.4; the TUI's find_bar.rs): its own field, so the
// composer keeps its draft. ⏎ / ↑ older, shift+⏎ / ↓ newer, esc closes.
// The whole thread is searched: while a needle is set and the thread has
// more before, the older pages are asked one at a time. Owner: amb-win.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Field } from '@/ds';
import { useStore, useThreadOrder } from '@/store';
import { findText } from './entry';
import { counter, currentMatch, EMPTY, newer, older, refresh, search, wantsOlder, type FindState } from './find';
import type { FindMark } from './findmark';

export interface FindBarProps {
  tkey: string;
  project: string;
  agent: string;
  mark: FindMark;
  /** bring the current match's entry into view */
  onGo: (pos: number) => void;
  onClose: () => void;
}

export function FindBar({ tkey, project, agent, mark, onGo, onClose }: FindBarProps) {
  const store = useStore();
  const view = useThreadOrder(tkey);
  const [s, setS] = useState<FindState>(EMPTY);
  const field = useRef<HTMLInputElement>(null);

  // the loaded entries as find reads them, again when the list changes
  const entries = useMemo(
    () =>
      view.order.flatMap((pos) => {
        const e = store.entry(tkey, pos);
        return e === undefined ? [] : [{ pos, text: findText(e) }];
      }),
    [store, tkey, view],
  );

  // a new page or entry: search again, the current match stays put
  const [seen, setSeen] = useState(entries);
  if (seen !== entries) {
    setSeen(entries);
    setS((x) => refresh(x, entries));
  }

  // the whole thread: one older page per change of the list
  useEffect(() => {
    if (wantsOlder(s, view.more)) store.olderPage(project, agent);
  }, [s, view, store, project, agent]);

  const cur = currentMatch(s);
  useEffect(() => {
    mark.set(cur?.pos);
    if (cur) onGo(cur.pos);
  }, [cur, mark, onGo]);
  useEffect(
    () => () => {
      mark.set(undefined);
    },
    [mark],
  );

  useEffect(() => {
    field.current?.focus();
  }, []);

  return (
    <div className="th-find" data-testid="thread.find" role="search">
      <Field
        ref={field}
        testId="thread.find.field"
        placeholder="find in this thread"
        aria-label="find in this thread"
        onChange={(e) => {
          setS(search(entries, e.currentTarget.value));
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            setS((x) => (e.key === 'ArrowDown' || (e.key === 'Enter' && e.shiftKey) ? newer(x) : older(x)));
          } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }
        }}
      />
      <span className="th-find-count" data-testid="thread.find.count">
        {counter(s, view.more)}
      </span>
      <Button
        kind="ghost"
        title="older (⏎)"
        onClick={() => {
          setS(older);
        }}
        testId="thread.find.older"
      >
        ↑
      </Button>
      <Button
        kind="ghost"
        title="newer (⇧⏎)"
        onClick={() => {
          setS(newer);
        }}
        testId="thread.find.newer"
      >
        ↓
      </Button>
      <Button kind="ghost" title="close (esc)" onClick={onClose} testId="thread.find.close">
        ×
      </Button>
    </div>
  );
}

// ⌘F's bar (bar 3.4; the TUI's find_bar.rs): its own field, so the
// composer keeps its draft. A compact panel over the list's top right, as a
// macOS find bar (his m_25471: it spanned the width): field, count, ↑ ↓ ×,
// each button with its ds tip and key. ⏎ / ↑ older, shift+⏎ / ↓ newer, esc closes.
// The whole thread is searched: while a needle is set and the thread has
// more before, the older pages are asked one at a time. Owner: amb-win.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Field, IconButton } from '@/ds';
import { useStore, useThreadOrder } from '@/store';
import { findText } from './entry';
import { counter, currentMatch, EMPTY, newer, offsetsIn, older, refresh, search, wantsOlder, type FindState } from './find';
import type { FindMark } from './findmark';
import { rangesIn } from './findranges';
import { caretAtEnd, useKeptText } from '@/app/keep';

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
  // his needle survives a reload until he closes the bar (keep.ts)
  const [kept, keepNeedle, dropNeedle] = useKeptText(`find:${project}/${agent}`);
  const [first] = useState(kept);
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

  // the matched words only, in the selection's tint, the current one stronger (designer m_25774,
  // as /log's find): CSS highlights over the drawn rows, again when the list draws other rows
  const bar = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const reg = typeof CSS === 'undefined' ? undefined : CSS.highlights;
    const list = bar.current?.closest('.th-main');
    if (reg === undefined || list == null) return;
    const needle = s.needle;
    // the current match is the k-th of its entry
    const k = cur === undefined ? -1 : s.matches.filter((m) => m.pos === cur.pos && m.at < cur.at).length;
    const paint = (): void => {
      const all = new Highlight();
      const at = new Highlight();
      if (needle.trim() !== '') {
        for (const row of list.querySelectorAll<HTMLElement>('[data-testid^="thread.entry."]')) {
          const rs = rangesIn(row, (t) => offsetsIn(t, needle), needle.length);
          const mine = cur !== undefined && row.dataset.testid === `thread.entry.${String(cur.pos)}`;
          rs.forEach((r, i) => {
            // the entry's drawn words may differ from its find text: then all of its matches are current
            (mine && (i === k || rs.length <= k) ? at : all).add(r);
          });
        }
      }
      reg.set('th-find', all);
      reg.set('th-find-at', at);
    };
    paint();
    let frame = 0;
    const again = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    });
    again.observe(list, { childList: true, subtree: true, characterData: true });
    return () => {
      again.disconnect();
      cancelAnimationFrame(frame);
      reg.delete('th-find');
      reg.delete('th-find-at');
    };
  }, [s, cur]);

  // a kept needle searches again once, at mount, with the caret at its end
  const [searched, setSearched] = useState(first === '');
  if (!searched) {
    setSearched(true);
    setS(search(entries, first));
  }
  useEffect(() => {
    field.current?.focus();
    caretAtEnd(field.current);
  }, []);
  const close = (): void => {
    dropNeedle();
    onClose();
  };

  return (
    <div ref={bar} className="th-find" data-testid="thread.find" role="search">
      <Field
        ref={field}
        testId="thread.find.field"
        placeholder="find in this thread"
        aria-label="find in this thread"
        defaultValue={first}
        onChange={(e) => {
          keepNeedle(e.currentTarget.value);
          setS(search(entries, e.currentTarget.value));
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            setS((x) => (e.key === 'ArrowDown' || (e.key === 'Enter' && e.shiftKey) ? newer(x) : older(x)));
          } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            close();
          }
        }}
      />
      <span className="th-find-count" data-testid="thread.find.count">
        {counter(s, view.more)}
      </span>
      <span className="th-find-acts">
        <IconButton
          label="older match"
          keys="⏎"
          onClick={() => {
            setS(older);
          }}
          testId="thread.find.older"
        >
          ↑
        </IconButton>
        <IconButton
          label="newer match"
          keys="⇧⏎"
          onClick={() => {
            setS(newer);
          }}
          testId="thread.find.newer"
        >
          ↓
        </IconButton>
        <IconButton label="close find" keys="esc" onClick={close} testId="thread.find.close">
          ×
        </IconButton>
      </span>
    </div>
  );
}

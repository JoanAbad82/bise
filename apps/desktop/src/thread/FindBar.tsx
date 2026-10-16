// ⌘F's bar (bar 3.4; the TUI's find_bar.rs): its own field, so the
// composer keeps its draft. A compact panel over the list's top right, as a
// macOS find bar (his m_25471: it spanned the width): field, count, ↑ ↓ ×,
// each button with its ds tip and key. ⏎ / ↑ older, shift+⏎ / ↓ newer, esc closes.
// The whole thread is searched by the hub (thread/find, store.findInThread: thread-perf); the
// lines that come while it is open are matched here (find.ts). The list goes to the current
// match only when it moves by his doing (find.ts `moved`), never because a line came. Owner: thread-perf.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Field, IconButton } from '@/ds';
import { thread } from '@/proto/words.gen';
import { useStore, useThreadHits, useThreadOrder } from '@/store';
import { findText } from './entry';
import { counter, currentMatch, EMPTY, found, newer, offsetsIn, older, refresh, search, type FindState, type Findable } from './find';
import type { FindMark } from './findmark';
import { rangesIn } from './findranges';
import { caretAtEnd, useKeptText } from '@/app/keep';

export interface FindBarProps {
  tkey: string;
  project: string;
  agent: string;
  mark: FindMark;
  /** bring the current match's entry into view (loading around it when it isn't held) */
  onGo: (pos: number) => void;
  onClose: () => void;
}

export function FindBar({ tkey, project, agent, mark, onGo, onClose }: FindBarProps) {
  const store = useStore();
  const view = useThreadOrder(tkey);
  const answer = useThreadHits(tkey);
  // his needle survives a reload until he closes the bar (keep.ts)
  const [kept, keepNeedle, dropNeedle] = useKeptText(`find:${project}/${agent}`);
  const [first] = useState(kept);
  const [s, setS] = useState<FindState>(EMPTY);
  const field = useRef<HTMLInputElement>(null);

  // the held entries after line `after` as find reads them (after the hub's answer: only the new
  // ones, so a line that comes reads one entry, not the whole list)
  const upto = s.upto;
  const entries = useMemo((): Findable[] => {
    const out: Findable[] = [];
    for (const pos of view.order) {
      if (pos <= upto) continue;
      const e = store.entry(tkey, pos);
      if (e !== undefined) out.push({ pos, text: findText(e) });
    }
    return out;
  }, [store, tkey, view, upto]);

  // a new line or page: the matches after the hub's answer are counted again, the current match stays
  const [seen, setSeen] = useState(entries);
  if (seen !== entries) {
    setSeen(entries);
    setS((x) => refresh(x, entries));
  }
  // the hub's answer for this needle (a stale one changes nothing; an older hub: the count stays partial)
  const [heard, setHeard] = useState(answer);
  if (heard !== answer) {
    setHeard(answer);
    if (answer?.hits != null) {
      const hits = answer.hits;
      setS((x) => found(x, { rid: answer.rid, hits, upto: answer.upto }, entries));
    }
  }

  const ask = (needle: string): void => {
    const rid = needle.trim() === '' ? 0 : store.findInThread(project, agent, needle);
    setS((x) => search(entries, needle, rid, x.moved));
  };

  const cur = currentMatch(s);
  const curPos = cur?.pos;
  const curK = cur?.k ?? -1;
  useEffect(() => {
    mark.set(curPos);
  }, [curPos, mark]);
  // to the current match: when he moved it (a needle, ⏎), never because a line came
  const goRef = useRef(onGo);
  useEffect(() => {
    goRef.current = onGo;
  });
  useEffect(() => {
    if (curPos !== undefined) goRef.current(curPos);
  }, [s.moved]); // eslint-disable-line react-hooks/exhaustive-deps -- `moved` is the trigger, curPos read then
  useEffect(
    () => () => {
      mark.set(undefined);
    },
    [mark],
  );

  // the matched words only, in the selection's tint, the current one stronger (designer m_25774,
  // as /log's find): CSS highlights over the drawn rows, again when the list draws other rows
  const bar = useRef<HTMLDivElement>(null);
  const needle = s.needle;
  useLayoutEffect(() => {
    const reg = typeof CSS === 'undefined' ? undefined : CSS.highlights;
    const list = bar.current?.closest('.th-main');
    if (reg === undefined || list == null) return;
    const paint = (): void => {
      const all = new Highlight();
      const at = new Highlight();
      if (needle.trim() !== '') {
        for (const row of list.querySelectorAll<HTMLElement>('[data-testid^="thread.entry."]')) {
          const rs = rangesIn(row, (t) => offsetsIn(t, needle), needle.length);
          const mine = curPos !== undefined && row.dataset.testid === `thread.entry.${String(curPos)}`;
          rs.forEach((r, i) => {
            // the entry's drawn words may differ from its find text: then all of its matches are current
            (mine && (i === curK || rs.length <= curK) ? at : all).add(r);
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
  }, [needle, curPos, curK]);

  // a kept needle searches again once, at mount, with the caret at its end
  const [searched, setSearched] = useState(first === '');
  if (!searched) {
    setSearched(true);
    ask(first);
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
        placeholder={thread.find_placeholder}
        aria-label={thread.find_placeholder}
        defaultValue={first}
        onChange={(e) => {
          keepNeedle(e.currentTarget.value);
          ask(e.currentTarget.value);
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
        {counter(s)}
      </span>
      <span className="th-find-acts">
        <IconButton
          label={thread.find_older}
          keys="⏎"
          onClick={() => {
            setS(older);
          }}
          testId="thread.find.older"
        >
          ↑
        </IconButton>
        <IconButton
          label={thread.find_newer}
          keys="⇧⏎"
          onClick={() => {
            setS(newer);
          }}
          testId="thread.find.newer"
        >
          ↓
        </IconButton>
        <IconButton label={thread.find_close} keys="esc" onClick={close} testId="thread.find.close">
          ×
        </IconButton>
      </span>
    </div>
  );
}

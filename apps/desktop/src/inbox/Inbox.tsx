// The ⌘I inbox screen (bar ⛔5, O.1): every project's open items (his
// questions, approvals, merges, failures...), most blocking first, the
// current one open with its options and, for a question, a field for his
// own words. Draws model.ts and runs its acts through `ports`; reads
// nothing itself (InboxScreen in index.tsx feeds it the store). Owner:
// amb-home.
//
// Typing stays smooth (the reset's bug 1): the answer field is an
// uncontrolled <textarea>, so a key in it changes no state and re-renders
// nothing; each item keeps its typed words while the screen lives (saved
// when he leaves the item, never per key). The list's rows are memo'd: moving the keyboard re-renders
// the two rows that change.
import { memo, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Card as CardRow } from '@/proto';
import { Card, Empty, Head, Kbd, Opts, Row, type DotState } from '@/ds';
import { cardKey } from './order';
import { current, prune, START, step, takesWords, visible, type Act, type Key } from './model';
import './inbox.css';

export interface InboxPorts {
  answer: (project: string, card: number, reply: string) => void;
  close: (project: string, card: number) => void;
  /** esc: back where he was */
  back: () => void;
  /** a card that points at a page block: open it */
  openPage?: (url: string) => void;
}

export interface InboxProps {
  /** every project's open cards, any order */
  cards: readonly CardRow[];
  /** a project id's name for the rows ("acme"); unknown: the id */
  names: Readonly<Record<string, string>>;
  ports: InboxPorts;
  /** now, for the ages (a test pins it) */
  now?: number;
}

export function Inbox({ cards, names, ports, now: pinned }: InboxProps) {
  const [opened] = useState(() => Date.now());
  const now = pinned ?? opened;
  const [s, setS] = useState(START);
  // each item's typed words, saved when he leaves it (never per key)
  const [drafts, setDrafts] = useState<ReadonlyMap<string, string>>(new Map());
  const list = visible(cards, s);
  const cur = current(list, s);
  const curKey = cur ? cardKey(cur) : null;
  const field = useRef<HTMLTextAreaElement>(null);
  const root = useRef<HTMLElement>(null);

  // the current item takes the keys: its field, or the screen for an approval
  useEffect(() => {
    (field.current ?? root.current)?.focus();
  }, [curKey]);

  const run = (a: Act) => {
    if (a.t === 'answer') ports.answer(a.project, a.card, a.reply);
    else if (a.t === 'close') ports.close(a.project, a.card);
    else ports.back();
  };

  const key = (k: Key) => {
    const text = field.current?.value ?? '';
    const r = step(s, list, k, text);
    if (curKey !== null) {
      const next = new Map(drafts);
      // an act takes its words; leaving keeps them for the way back
      if (r.act) next.delete(curKey);
      else if (text !== '') next.set(curKey, text);
      setDrafts(next);
    }
    setS(prune(r.s, cards));
    if (r.act) run(r.act);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const k = keyOf(e, field.current?.value ?? '');
    if (k === null) return;
    e.preventDefault();
    key(k);
  };

  return (
    <section className="inbox" ref={root} tabIndex={-1} onKeyDown={onKeyDown} data-testid="inbox.root">
      <Head title="inbox" sub={list.length === 0 ? 'nothing waits for you' : `${String(list.length)} waiting for you`} />
      {list.length === 0 || !cur ? (
        <Empty title="nothing waits for you">questions and approvals from your agents land here</Empty>
      ) : (
        <div className="inbox-body">
          <div className="inbox-list" role="listbox" aria-label="inbox" data-testid="inbox.list">
            {list.map((c, i) => (
              <Item key={cardKey(c)} c={c} n={i + 1} on={c === cur} name={names[c.project] ?? c.project} onSelect={key} />
            ))}
          </div>
          <div className="inbox-open">
            <Card
              lead="nd"
              who={kindTitle(c0(cur).kind, cur.agent)}
              rest={` · ${names[cur.project] ?? cur.project}`}
              k={age(now - cur.since_ms)}
              q={cur.question}
              keys={hints(cur)}
              testId={`inbox.card.${cardKey(cur)}`}
            >
              {cur.options.length > 0 && (
                <Opts
                  items={cur.options.map((o) => ({ n: o.n, text: o.label, on: o.n === s.hl }))}
                  onPick={(n) => {
                    key({ k: 'pick', n });
                  }}
                  testId="inbox.opt"
                />
              )}
              {cur.page != null && ports.openPage && (
                <button type="button" className="inbox-page" data-testid="inbox.page" onClick={() => ports.openPage?.(c0(cur).page?.url ?? '')}>
                  open its page
                </button>
              )}
              {takesWords(cur) && (
                <textarea
                  key={cardKey(cur)}
                  ref={field}
                  className="inbox-field"
                  rows={2}
                  placeholder={cur.options.length > 0 ? 'or type your answer' : 'type your answer'}
                  defaultValue={drafts.get(cardKey(cur)) ?? ''}
                  aria-label="your answer"
                  data-testid="inbox.answer"
                />
              )}
              <div className="inbox-acts">
                <button type="button" data-testid="inbox.close" onClick={() => { key({ k: 'close' }); }}>
                  close without answering
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}

/** the card itself (the narrowing helper for closures) */
function c0(c: CardRow): CardRow {
  return c;
}

const Item = memo(function Item({ c, n, on, name, onSelect }: { c: CardRow; n: number; on: boolean; name: string; onSelect: (k: Key) => void }) {
  return (
    <Row
      kind="ag"
      dot={c.approval === true || c.urgent ? 'nd' : dotOf(c.kind)}
      name={`${String(n)}  ${kindTitle(c.kind, c.agent)}: ${firstLine(c.question)}`}
      end={name}
      needs={c.approval === true}
      on={on}
      onClick={() => {
        onSelect({ k: 'select', key: cardKey(c) });
      }}
      testId={`inbox.item.${cardKey(c)}`}
    />
  );
});

/** A key event as an inbox key (null: it belongs to the text, or to nobody). */
export function keyOf(e: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>, text: string): Key | null {
  const empty = text.trim() === '';
  if (e.key === 'Escape') return { k: 'esc' };
  if (e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'x') return { k: 'close' };
  if (e.metaKey && e.key === 'Backspace' && empty) return { k: 'close' };
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  if (e.key === 'Enter' && !e.shiftKey) return { k: 'enter' };
  if (!empty) return null;
  switch (e.key) {
    case 'ArrowUp':
      return { k: 'up' };
    case 'ArrowDown':
      return { k: 'down' };
    case 'ArrowLeft':
      return { k: 'left' };
    case 'ArrowRight':
      return { k: 'right' };
  }
  if (/^[1-9]$/.test(e.key)) return { k: 'digit', n: Number(e.key) };
  return null;
}

/** An item's title (the TUI's kind_title, copy deck §17). */
export function kindTitle(kind: string, agent: string): string {
  switch (kind) {
    case 'question':
      return `${agent} asks`;
    case 'blocked':
      return `${agent} is blocked`;
    case 'failed':
      return `${agent} failed`;
    case 'restart':
      return 'restart failed';
    case 'drop':
      return `drop ${agent}?`;
    case 'overlap':
      return 'overlap';
    case 'done':
      return `${agent} is done`;
    default:
      return `${agent}: ${kind}`;
  }
}

function dotOf(kind: string): DotState {
  if (kind === 'failed' || kind === 'restart') return 'er';
  if (kind === 'done') return 'ok';
  return 'nd';
}

function firstLine(q: string): string {
  const l = q.split('\n')[0] ?? '';
  return l.length > 80 ? `${l.slice(0, 79)}…` : l;
}

function hints(c: CardRow) {
  const n = c.options.length;
  return (
    <>
      {n > 0 && (
        <>
          <Kbd>1</Kbd>–<Kbd>{String(n)}</Kbd> pick <Kbd>←</Kbd>
          <Kbd>→</Kbd> <Kbd>⏎</Kbd>{' '}
        </>
      )}
      {takesWords(c) && <>type, then <Kbd>⏎</Kbd> answer </>}
      <Kbd>↑</Kbd>
      <Kbd>↓</Kbd> next <Kbd>⌘⌫</Kbd> close <Kbd>esc</Kbd> back
    </>
  );
}

/** "now", "4 min", "2 h", "3 d" */
export function age(ms: number): string {
  const m = Math.floor(Math.max(0, ms) / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${String(m)} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${String(h)} h` : `${String(Math.floor(h / 24))} d`;
}

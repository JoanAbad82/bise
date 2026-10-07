// The ⌘I inbox screen (bar ⛔5, O.1): every project's open items (his
// questions, approvals, merges, failures...), most blocking first, the
// current one open with its options and, for a question, a field for his
// own words. Draws model.ts and runs its acts through `ports`; reads
// nothing itself (InboxScreen in index.tsx feeds it the store). Owner:
// amb-home.
//
// Typing stays smooth (the reset's bug 1): the answer field is an
// uncontrolled <textarea>, so a key in it changes no state and re-renders
// nothing; each item keeps its typed words (drafts.ts: saved on input into
// a plain map, so they outlive the screen; dropped by an answer or a
// close). The list's rows are memo'd: moving the keyboard re-renders the
// two rows that change.
import { memo, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Card as CardRow } from '@/proto';
import { Empty, Head, Row } from '@/ds';
import { dotOf, InboxCard, kindTitle, takesWords } from './InboxCard';
import { cardKey } from './order';
import { inboxDrafts, type Drafts } from './drafts';
import { current, prune, START, step, visible, type Act, type Key } from './model';
import './inbox.css';

export interface InboxPorts {
  answer: (project: string, card: number, reply: string) => void;
  /** close without answering (none: no close key, no button) */
  close?: (project: string, card: number) => void;
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
  /** each item's typed words (default: the window's, drafts.ts) */
  drafts?: Drafts;
}

export function Inbox({ cards, names, ports, now: pinned, drafts = inboxDrafts }: InboxProps) {
  const [opened] = useState(() => Date.now());
  const now = pinned ?? opened;
  const [s, setS] = useState(START);
  const list = visible(cards, s);
  const cur = current(list, s);
  const curKey = cur ? cardKey(cur) : null;
  const field = useRef<HTMLTextAreaElement>(null);
  const root = useRef<HTMLElement>(null);

  // an item that is gone takes its words with it
  useEffect(() => {
    drafts.prune(new Set(cards.map(cardKey)));
  }, [cards, drafts]);

  // the current item takes the keys: its field, or the screen for an approval
  useEffect(() => {
    (field.current ?? root.current)?.focus();
  }, [curKey]);

  const run = (a: Act) => {
    if (a.t === 'answer') ports.answer(a.project, a.card, a.reply);
    else if (a.t === 'close') ports.close?.(a.project, a.card);
    else ports.back();
  };

  const key = (k: Key) => {
    const text = field.current?.value ?? '';
    const r = step(s, list, k, text);
    // an answer or a close takes the item's words; esc and moving keep them
    if (curKey !== null && (r.act?.t === 'answer' || r.act?.t === 'close')) drafts.drop(curKey);
    setS(prune(r.s, cards));
    if (r.act) run(r.act);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const k = keyOf(e, field.current?.value ?? '');
    if (k === null || (k.k === 'close' && !ports.close)) return;
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
            <InboxCard
              card={cur}
              project={names[cur.project]}
              on={s.hl}
              now={now}
              acts={{
                pick: (n) => {
                  key({ k: 'pick', n });
                },
                ...(ports.close
                  ? {
                      close: () => {
                        key({ k: 'close' });
                      },
                    }
                  : {}),
                ...(ports.openPage ? { openPage: ports.openPage } : {}),
              }}
            >
              {takesWords(cur) && (
                <textarea
                  key={cardKey(cur)}
                  ref={field}
                  className="inbox-field"
                  rows={2}
                  placeholder={cur.options.length > 0 ? 'or type your answer' : 'type your answer'}
                  defaultValue={drafts.get(cardKey(cur))}
                  onInput={(e) => {
                    drafts.keep(cardKey(cur), e.currentTarget.value);
                  }}
                  aria-label="your answer"
                  data-testid="inbox.answer"
                />
              )}
            </InboxCard>
          </div>
        </div>
      )}
    </section>
  );
}

const Item = memo(function Item({ c, n, on, name, onSelect }: { c: CardRow; n: number; on: boolean; name: string; onSelect: (k: Key) => void }) {
  return (
    <Row
      kind="ag"
      dot={c.approval === true || c.urgent ? 'nd' : dotOf(c)}
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

function firstLine(q: string): string {
  const l = q.split('\n')[0] ?? '';
  return l.length > 80 ? `${l.slice(0, 79)}…` : l;
}

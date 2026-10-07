// The thread's inbox strip (bar W7/K24): the project's items in their own
// box above the thread's divider, numbered for ctrl+1-9 as the TUI's
// (stripRows.ts has the rules). ctrl+N or a click opens item N in place, where
// its row was: its options pick with a click, close drops it without an
// answer, esc folds it back; words answer in the ⌘I inbox. InboxStrip
// draws it from props; ThreadInbox (screen.tsx) is the one line the thread
// mounts, fed by the store. Owner: amb-home.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Card } from '@/proto';
import { Dot, Kbd } from '@/ds';
import { age, dotOf, InboxCard, kindTitle } from './InboxCard';
import { cardKey } from './order';
import { STRIP_KEYS, stripKey, stripList, stripOpen, stripView, stripWords } from './stripRows';
import './inbox.css';

export interface StripPorts {
  answer: (project: string, card: number, reply: string) => void;
  close: (project: string, card: number) => void;
  /** the whole inbox (⌘I), where words answer */
  openInbox: () => void;
  openPage?: (url: string) => void;
  /** bar N14: the item open here while the window has focus, null when none */
  inView?: (card: { project: string; card: number } | null) => void;
}

export interface InboxStripProps {
  project: string;
  /** open cards, any project, any order (the strip keeps this project's) */
  cards: readonly Card[];
  ports: StripPorts;
  /** now, for the ages (a test pins it) */
  now?: number;
  /** bar L25: the demo tour's tip, above the box (none: no tip) */
  tip?: ReactNode;
}

/** A field he is typing in: esc there is his, not the strip's. */
function typing(t: EventTarget | null): boolean {
  return (t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement) && t.value !== '';
}

export function InboxStrip({ project, cards, ports, now: pinned, tip }: InboxStripProps) {
  const [open, setOpen] = useState<string | null>(null);
  const [gone, setGone] = useState<ReadonlySet<string>>(() => new Set());
  const [opened] = useState(() => Date.now());
  const now = pinned ?? opened;
  const list = useMemo(() => stripList(cards, project, gone), [cards, project, gone]);
  const openCard = list.find((c) => cardKey(c) === open);

  // ctrl+1-9 open row N, wherever the focus is in the window; esc folds
  // the open item (not while he types words somewhere)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = stripKey(e);
      if (n !== undefined) {
        const k = stripOpen(list, n);
        if (k === undefined) return;
        e.preventDefault();
        e.stopPropagation();
        setOpen(k);
        return;
      }
      if (e.key === 'Escape' && openCard && !typing(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(null);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
    };
  }, [list, openCard]);

  // bar N14: the open item is the card in front of him (fn's talk answers it)
  const inView = ports.inView;
  const openProject = openCard?.project ?? null;
  const openId = openCard?.id ?? null;
  useEffect(() => {
    if (!inView) return;
    inView(openProject !== null && openId !== null && document.hasFocus() ? { project: openProject, card: openId } : null);
    return () => {
      inView(null);
    };
  }, [inView, openProject, openId]);

  // an item acted on here stays out until the core's rows drop it (the
  // keys the rows no longer have are forgotten on the next one)
  const leave = (c: Card) => {
    const live = new Set(cards.map(cardKey));
    setGone((g) => new Set([...[...g].filter((k) => live.has(k)), cardKey(c)]));
    setOpen(null);
  };

  if (list.length === 0) return null;
  const view = stripView(list, open);
  return (
    <>
      {tip}
      <section className="inbox-strip" aria-label="inbox" data-testid="strip">
        <div className="strip-title">
          inbox <span className="strip-count">{`${String(list.length)} waiting`}</span>
          <span className="strip-keys">
            <Kbd>{list.length > 1 ? `ctrl 1–${String(Math.min(list.length, STRIP_KEYS))}` : 'ctrl 1'}</Kbd> open
          </span>
        </div>
        {view.rows.map(({ card: c, n, open: isOpen }) =>
          isOpen ? (
            <div className="strip-open" key={cardKey(c)}>
              <InboxCard
                card={c}
                now={now}
                acts={{
                  pick: (o) => {
                    leave(c);
                    ports.answer(c.project, c.id, String(o));
                  },
                  close: () => {
                    leave(c);
                    ports.close(c.project, c.id);
                  },
                  ...(ports.openPage ? { openPage: ports.openPage } : {}),
                }}
                keys={
                  <>
                    {c.options.length > 0 ? 'click an option' : 'nothing to pick'} · <Kbd>esc</Kbd> fold ·{' '}
                    <button type="button" className="strip-link" onClick={ports.openInbox} data-testid={`strip.inbox.${cardKey(c)}`}>
                      answer in words in the inbox
                    </button>
                  </>
                }
                testId={`strip.card.${cardKey(c)}`}
              />
            </div>
          ) : (
            <StripRow key={cardKey(c)} c={c} n={n} now={now} onOpen={() => {
              setOpen(cardKey(c));
            }} />
          ),
        )}
        {view.more > 0 && view.next && (
          <button type="button" className="strip-row strip-more" data-testid="strip.more" onClick={() => {
            setOpen(view.next ? cardKey(view.next) : null);
          }}>
            {`+ ${String(view.more)} more · ${kindTitle(view.next.kind, view.next.agent)}`}
          </button>
        )}
      </section>
    </>
  );
}

function StripRow({ c, n, now, onOpen }: { c: Card; n: number; now: number; onOpen: () => void }) {
  const { who, what } = stripWords(c);
  return (
    <button type="button" className="strip-row" data-testid={`strip.row.${String(n)}`} onClick={onOpen}>
      <span className="strip-n">{n}</span>
      <Dot state={c.approval === true || c.urgent ? 'nd' : dotOf(c)} />
      <span className="strip-who">{who}</span>
      {what !== '' && <span className="strip-what">{` · ${what}`}</span>}
      <span className="strip-age">{age(now - c.since_ms)}</span>
    </button>
  );
}

// The thread's inbox strip (bar W7/K24): the project's items in their own
// box above the thread's divider, numbered for ctrl+1-9 as the TUI's
// (stripRows.ts has the rules). ctrl+N or a click opens item N in place, where
// its row was: its options pick with a click, close drops it without an
// answer, esc folds it back; words answer in the ⌘I inbox. InboxStrip
// draws it from props; ThreadInbox (screen.tsx) is the one line the thread
// mounts, fed by the store. Owner: amb-home.
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Card } from '@/proto';
import type { OptAct } from '@/proto/rows';
import { inbox } from '@/proto/words_inbox.gen';
import { common } from '@/proto/words_common.gen';
import { Dot, Kbd, Row } from '@/ds';
import { age, dotOf, InboxCard, RefusedMark, titleOf } from './InboxCard';
import { cardKey } from './order';
import { ArtWords } from './artWords';
import { STRIP_KEYS, stripKey, stripList, stripOpen, stripView, stripWords } from './stripRows';
import { actedKeys, useActed, useRefusedList } from '@/store';
import { withRefused, type InboxItem } from './listed';
import './inbox.css';
import { aboutOf, openAct } from './about';

export interface StripPorts {
  /** his option `n` of a card (the store's pick): whether it answered (else an act opened, the item stays) */
  pick: (project: string, card: number, n: number) => { readonly answered: boolean };
  close: (project: string, card: number) => void;
  /** the whole inbox (⌘I) */
  openInbox: () => void;
  /** 'type your answer below': the composer under the card takes the focus */
  typeAt?: () => void;
  /** an option the window does itself (optAct.ts): the asker's artifact at its block, a link, the
   * app's own ChatGPT sign-in; nothing is sent, the item stays */
  act?: (project: string, act: OptAct) => void;
  /** bar N14: the item open here while the window has focus, null when none */
  inView?: (card: { project: string; card: number } | null) => void;
}

export interface InboxStripProps {
  project: string;
  /** its name for the card's header ("acme"); none: the id */
  name?: string;
  /** bise's own home: the card's header names no project */
  home?: boolean;
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
  if ((t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement) && t.value !== '') return true;
  // the composer (a contenteditable) with his words in it: '2' in 'on the m2' is his, not option 2
  return t instanceof HTMLElement && t.isContentEditable && t.textContent.trim() !== '';
}

export function InboxStrip({ project, name, home, cards, ports, now: pinned, tip }: InboxStripProps) {
  const [open, setOpen] = useState<string | null>(null);
  // the cards he answered or closed, from any view: the store's one set (acted.ts), never the strip's
  const acted = useActed();
  const gone = useMemo(() => actedKeys(acted), [acted]);
  const [opened] = useState(() => Date.now());
  const now = pinned ?? opened;
  // each item with the refusal of his act on it here (listed.ts), the strip's own filter as before
  const refused = useRefusedList();
  const list = useMemo(() => withRefused(stripList(cards, project, gone), refused), [cards, project, gone, refused]);
  const openCard = list.find((c) => cardKey(c) === open);

  const [on, setOn] = useState<number | null>(null);
  const openTo = (k: string | null) => {
    setOpen(k);
    setOn(null);
  };

  // the open item is the docked card: the composer under it reads it
  // (useStripCard) for its label and where his words go
  useEffect(() => {
    setStripCard(project, openCard ?? null);
  }, [project, openCard]);
  useEffect(
    () => () => {
      setStripCard(project, null);
    },
    [project],
  );

  // an item answered or closed leaves every view at once: the store's answer / close keep it out
  // until the hub's rows drop it (acted.ts); here it only folds. The store's machine decides a
  // pick (machine/cards.ts): an option the window does itself as the hub's row says (the asker's
  // artifact, a merge's '2 open it on GitHub'...) opens it or the app's sign-in, sends nothing, and
  // the item stays; the strip folds only when it answered.
  const answer = (c: Card, n: number) => {
    if (ports.pick(c.project, c.id, n).answered) openTo(null);
  };
  // a card linked to a page (notif-artifact): the chip or 'o' opens it beside the thread at its
  // block, the act an option's --open takes (optAct.ts); nothing is sent, the item stays
  const openPage = (c: Card) => {
    const a = aboutOf(c);
    if (a == null) return;
    ports.act?.(c.project, openAct(a));
  };
  const close = (c: Card) => {
    openTo(null);
    ports.close(c.project, c.id);
  };

  // ctrl+1-9 open row N, wherever the focus is in the window. The open
  // card has the keys while no words are typed (the TUI's card view): 1-9
  // pick, ←→ walk the options, ⌘⌫ closes, esc puts it off.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = stripKey(e);
      if (n !== undefined) {
        const k = stripOpen(list, n);
        if (k === undefined) return;
        e.preventDefault();
        e.stopPropagation();
        openTo(k);
        return;
      }
      if (!openCard || typing(e.target)) return;
      const k = cardKeyOf(e, openCard, on);
      if (k === null) return;
      e.preventDefault();
      e.stopPropagation();
      if (k.t === 'later') openTo(null);
      else if (k.t === 'on') setOn(k.n);
      else if (k.t === 'pick') answer(openCard, k.n);
      else if (k.t === 'page') openPage(openCard);
      else close(openCard);
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
    };
  });

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

  if (list.length === 0) return null;
  if (openCard) {
    const c = openCard;
    return (
      <>
        {tip}
        <div className="inbox-dock" data-testid="strip.dock">
          <InboxCard
            card={c}
            {...(name !== undefined ? { project: name } : {})}
            {...(home === true ? { home: true } : {})}
            now={now}
            on={on}
            full={false}
            acts={{
              pick: (o) => {
                answer(c, o);
              },
              close: () => {
                close(c);
              },
              later: () => {
                openTo(null);
              },
              ...(ports.typeAt ? { type: ports.typeAt } : {}),
              ...(aboutOf(c) != null && ports.act ? { openPage: () => { openPage(c); } } : {}),
            }}
            testId={`strip.card.${cardKey(c)}`}
          />
        </div>
      </>
    );
  }
  const view = stripView(list, open);
  return (
    <>
      {tip}
      <section className="inbox-strip" aria-label={inbox.head} data-testid="strip">
        <div className="strip-title">
          {inbox.head} <span className="strip-count">{common.count_waiting({ n: list.length })}</span>
          <span className="strip-keys">
            <Kbd>{list.length > 1 ? `ctrl 1–${String(Math.min(list.length, STRIP_KEYS))}` : 'ctrl 1'}</Kbd> {inbox.key_open}
          </span>
        </div>
        {view.rows.map(({ card: c, n }) => (
          <StripRow
            key={cardKey(c)}
            c={c}
            n={n}
            now={now}
            onOpen={() => {
              openTo(cardKey(c));
            }}
          />
        ))}
        {view.more > 0 && view.next && (
          <Row
            name={<span className="strip-more">{`+ ${String(view.more)} more · ${titleOf(view.next)}`}</span>}
            onClick={() => {
              openTo(view.next ? cardKey(view.next) : null);
            }}
            testId="strip.more"
          />
        )}
      </section>
    </>
  );
}

type CardKey = { t: 'pick' | 'on'; n: number } | { t: 'close' } | { t: 'later' } | { t: 'page' };

/** A key on the open card (no words typed): its act, or none. Pure. */
export function cardKeyOf(e: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>, c: Card, on: number | null): CardKey | null {
  if (e.key === 'Escape') return { t: 'later' };
  if (e.metaKey && !e.ctrlKey && !e.altKey && e.key === 'Backspace') return { t: 'close' };
  // ⌘O: a page's item opens its page beside (notif-artifact); no bare letter takes an empty composer
  if (e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'o' && aboutOf(c) != null) return { t: 'page' };
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  const ns = c.options.map((o) => o.n);
  if (/^[1-9]$/.test(e.key) && ns.includes(Number(e.key))) return { t: 'pick', n: Number(e.key) };
  if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && ns.length > 0) {
    const at = on === null ? -1 : ns.indexOf(on);
    const i = on === null ? (e.key === 'ArrowRight' ? 0 : ns.length - 1) : at + (e.key === 'ArrowRight' ? 1 : -1);
    return { t: 'on', n: ns[Math.max(0, Math.min(ns.length - 1, i))] ?? ns[0] ?? 1 };
  }
  return null;
}

// the strip's open card per project, for the composer under it
const openCards = new Map<string, Card | null>();
const subs = new Set<() => void>();
function setStripCard(project: string, c: Card | null): void {
  if ((openCards.get(project) ?? null) === c) return;
  openCards.set(project, c);
  for (const f of subs) f();
}

/** The card docked over this project's composer (the strip's open item), or none. */
export function useStripCard(project: string): Card | null {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => {
        subs.delete(f);
      };
    },
    () => openCards.get(project) ?? null,
  );
}

function StripRow({ c, n, now, onOpen }: { c: InboxItem; n: number; now: number; onOpen: () => void }) {
  const { who, what } = stripWords(c);
  return (
    // raw-controls (designer m_18343): the ds's Row as a button
    <Row
      lead={
        <>
          <span className="strip-n">{n}</span>
          <Dot state={c.approval === true || c.urgent ? 'nd' : dotOf(c)} />
        </>
      }
      name={
        <>
          <span className="strip-who">{who}</span>
          {what !== '' && (
            <span className="strip-what">
              {' · '}
              <ArtWords text={what} project={c.project} testId={`strip.row.${String(n)}`} />
            </span>
          )}
          <RefusedMark card={c} />
        </>
      }
      end={age(now - c.since_ms)}
      onClick={onOpen}
      testId={`strip.row.${String(n)}`}
    />
  );
}

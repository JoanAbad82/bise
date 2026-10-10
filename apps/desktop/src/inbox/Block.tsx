// The inbox block (b2, the user's card #476 'b + the native notification'; designer's mocks on page
// inbox-native v2): ONE inbox, every project's open items, as the TUI's, mounted once by the shell
// right above the composer under every screen (amb-win's b1: ThreadScreen, BottomBlock). Folded it is
// 'inbox · 3 waiting  ⌃1–3 open' and a line per item; ⌃n, a click, ⌘I (openInbox) or a notification
// click (openInbox({project, card})) opens that item IN PLACE (the block grows, nothing floats over
// what he reads): its options, 1-9 pick, ←→ walk them, ⌘⏎ the one the keys are on, ⌘⌫ close, ↑↓ the
// next item, esc folds. It tells the composer under it what his words do (onAnswer): a question takes
// them as its answer ('answering search · …', 'esc write to perf instead'); an approval or a choice item
// never (ambient m_8773: 'to perf · the merge waits for 1 or 2', his words go as a plain message).
// Owner: amb-home.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Card, ProjectRow } from '@/proto';
import type { NotifyAuth } from '@/shared/api';
import { Dot, Kbd } from '@/ds';
import { useProjects, useStore } from '@/store';
import { shownName } from '@/agents/model';
import { age, dotOf, InboxCard } from './InboxCard';
import { cardKey, sortCards } from './order';
import { pickWaits, takesWords, withConfirmOptions } from './model';
import { STRIP_KEYS, STRIP_ROWS, stripKey, stripWords } from './stripRows';
import { cardKeyOf } from './Strip';
import './inbox.css';

/** What the composer under the block does with his words while an item is open. */
export interface Answering {
  readonly project: string;
  readonly card: number;
  /** the label line's left: 'answering search · reindex tonight…', 'to perf · the merge waits for 1 or 2' */
  readonly label: string;
  /** the label line's right ('esc write to perf instead'); none: the composer's own words */
  readonly end?: string;
  /** his words answer this card (store.answer); null: they go as a plain message (never an approval) */
  readonly answer: number | null;
}

/** Where the block is: the screen's project and agent (none: bise's view, settings, review…). */
export interface Here {
  readonly project: string | null;
  readonly agent: string | null;
}

export interface InboxBlockProps {
  readonly here: Here;
  readonly onAnswer: (a: Answering | null) => void;
  /** now, for the ages (a test pins it) */
  readonly now?: number;
}

// ---- openInbox: ⌘I and a notification click (amb-win's keys and router call it; no route change)

type OpenAt = { readonly project: string; readonly card: number } | undefined;
const openers = new Set<(at: OpenAt) => void>();

/** Open the block in place: on that card (a notification's), else on its first item. */
export function openInbox(at?: { project: string; card: number }): void {
  for (const f of [...openers]) f(at);
}

/** Hear openInbox (the block itself, a test): returns the unsubscribe. */
export function onOpenInbox(f: (at: OpenAt) => void): () => void {
  openers.add(f);
  return () => {
    openers.delete(f);
  };
}

// ---- the notifications' permission row (amb-mac's window.bise.notify, 97a5939a; designer m_14211)

type Notify = { state: () => Promise<NotifyAuth>; onState: (f: (s: NotifyAuth) => void) => () => void; ask: () => Promise<NotifyAuth> };
const notifyApi = (): Notify | null => (globalThis as { bise?: { notify?: Notify } }).bise?.notify ?? null;

/** 'not now' twice and the row never comes back; once, it waits for the next launch (designer). */
const NOT_NOW_KEY = 'bise.notify.notnow';
const NOT_NOW_LAUNCH = 'bise.notify.notnow.launch';
const notNowCount = (): number => Number(localStorage.getItem(NOT_NOW_KEY) ?? '0') || 0;

/** Whether the permission row shows: macOS never asked, an item waits, 'not now' not said this launch nor twice. Pure. */
export function asksNotify(auth: NotifyAuth | null, items: number, notNow: number, thisLaunch: boolean): boolean {
  return auth === 'never' && items > 0 && notNow < 2 && !thisLaunch;
}

/**
 * macOS's notifications permission as amb-mac's window.bise.notify tells it, live (null: not known yet,
 * or no notify api: a component test, an older shell), and a setter for ask()'s answer. Settings reads it too.
 */
export function useNotifyAuth(): [NotifyAuth | null, (s: NotifyAuth) => void] {
  const [auth, setAuth] = useState<NotifyAuth | null>(null);
  useEffect(() => {
    const api = notifyApi();
    if (api === null) return;
    let live = true;
    void api.state().then((s) => {
      if (live) setAuth(s);
    });
    const off = api.onState((s) => {
      setAuth(s);
    });
    return () => {
      live = false;
      off();
    };
  }, []);
  return [auth, setAuth];
}

function useNotifyRow(items: number): { show: boolean; on: () => void; later: () => void } {
  const [auth, setAuth] = useNotifyAuth();
  const [said, setSaid] = useState(() => sessionStorage.getItem(NOT_NOW_LAUNCH) === '1');
  return {
    show: asksNotify(auth, items, notNowCount(), said),
    on: () => {
      void notifyApi()?.ask().then(setAuth);
    },
    later: () => {
      localStorage.setItem(NOT_NOW_KEY, String(notNowCount() + 1));
      sessionStorage.setItem(NOT_NOW_LAUNCH, '1');
      setSaid(true);
    },
  };
}

// ---- the pure parts

/** Every project's open items, in the inbox's order (the hub's rank), the ones acted on here left out. Pure. */
export function blockList(rows: readonly ProjectRow[], gone: ReadonlySet<string>): Card[] {
  return sortCards(rows.flatMap((r) => (r.cards ?? []).map(withConfirmOptions))).filter((c) => !gone.has(cardKey(c)));
}

const cut = (s: string, max: number): string => {
  const one = s.replace(/\s+/gu, ' ').trim();
  return Array.from(one).length > max ? `${Array.from(one).slice(0, max - 1).join('').trimEnd()}…` : one;
};

/** What his words do while `c` is open, seen from `here`. Pure. */
export function answeringOf(c: Card, here: Here): Answering {
  const to = here.agent === null ? 'bise' : shownName(here.agent);
  if (takesWords(c)) {
    return { project: c.project, card: c.id, label: `answering ${shownName(c.agent)} · ${cut(c.question, 40)}`, end: here.agent === null ? 'esc write a plain message' : `esc write to ${to} instead`, answer: c.id };
  }
  return { project: c.project, card: c.id, label: `to ${to} · ${pickWaits(c) ?? 'it waits for its options'}`, answer: null };
}

/** An item's sign on its line: '?' a question, '!' what only its options decide, else its dot. */
function signOf(c: Card): string | null {
  if (c.kind === 'question' && c.approval !== true) return '?';
  return takesWords(c) ? null : '!';
}

/** A field he is typing in: its keys are his, not the block's. */
function typing(t: EventTarget | null): boolean {
  if ((t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement) && t.value !== '') return true;
  return t instanceof HTMLElement && t.isContentEditable && t.textContent.trim() !== '';
}

export function InboxBlock({ here, onAnswer, now: pinned }: InboxBlockProps) {
  const rows = useProjects();
  const store = useStore();
  const [gone, setGone] = useState<ReadonlySet<string>>(() => new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [on, setOn] = useState<number | null>(null);
  const [opened] = useState(() => Date.now());
  const now = pinned ?? opened;
  const list = useMemo(() => blockList(rows, gone), [rows, gone]);
  const names = useMemo(() => new Map(rows.map((r) => [r.project, r])), [rows]);
  const openCard = list.find((c) => cardKey(c) === open);

  const openTo = (k: string | null) => {
    setOpen(k);
    setOn(null);
  };

  // ⌘I and a notification click: that card, else the first item
  const latest = useRef(list);
  useEffect(() => {
    latest.current = list;
  });
  useEffect(() => {
    const f = (at: OpenAt) => {
      const l = latest.current;
      const want = at !== undefined ? l.find((c) => c.project === at.project && c.id === at.card) : l[0];
      if (want === undefined) return;
      setOpen(cardKey(want));
      setOn(null);
    };
    openers.add(f);
    return () => {
      openers.delete(f);
    };
  }, []);

  // what his words do: told on each change, and none once the block goes
  const { project: hp, agent: ha } = here;
  const told = openCard === undefined ? null : answeringOf(openCard, { project: hp, agent: ha });
  const tellKey = told === null ? '' : `${told.project}/${String(told.card)}/${told.label}/${told.end ?? ''}/${String(told.answer)}`;
  const tell = useRef(onAnswer);
  useEffect(() => {
    tell.current = onAnswer;
  });
  useEffect(() => {
    tell.current(told);
    // told is derived from tellKey: it changes exactly when tellKey does
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tellKey]);
  useEffect(
    () => () => {
      tell.current(null);
    },
    [],
  );

  // bar N14: the open item is the card in front of him (fn's talk answers it)
  const openProject = openCard?.project ?? null;
  const openId = openCard?.id ?? null;
  useEffect(() => {
    store.cardInView(openProject !== null && openId !== null && document.hasFocus() ? openProject : null, openProject !== null && openId !== null && document.hasFocus() ? openId : null);
    return () => {
      store.cardInView(null, null);
    };
  }, [store, openProject, openId]);

  // an item acted on here stays out until the core's rows drop it
  const leave = (c: Card) => {
    const live = new Set(rows.flatMap((r) => (r.cards ?? []).map(cardKey)));
    setGone((g) => new Set([...[...g].filter((k) => live.has(k)), cardKey(c)]));
    openTo(null);
  };
  const pick = (c: Card, n: number) => {
    leave(c);
    store.answer(c.project, c.id, String(n));
  };
  const close = (c: Card) => {
    leave(c);
    store.close(c.project, c.id);
  };

  // ⌃1-9 open item n wherever the focus is; the open item has the keys while no words are typed
  // (1-9, ←→, ⌘⌫, esc, ↑↓); ⌘⏎ picks the option the keys are on even with words typed
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = stripKey(e);
      if (n !== undefined) {
        const c = n <= STRIP_KEYS ? list[n - 1] : undefined;
        if (c === undefined) return;
        e.preventDefault();
        e.stopPropagation();
        openTo(cardKey(c));
        return;
      }
      if (openCard === undefined) return;
      if (e.key === 'Enter' && e.metaKey && !e.ctrlKey && !e.altKey && on !== null) {
        e.preventDefault();
        e.stopPropagation();
        pick(openCard, on);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        openTo(null);
        return;
      }
      if (typing(e.target)) return;
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const i = list.findIndex((c) => cardKey(c) === open);
        const next = list[Math.max(0, Math.min(list.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))];
        if (next === undefined) return;
        e.preventDefault();
        e.stopPropagation();
        openTo(cardKey(next));
        return;
      }
      const k = cardKeyOf(e, openCard, on);
      if (k === null) return;
      e.preventDefault();
      e.stopPropagation();
      if (k.t === 'later') openTo(null);
      else if (k.t === 'on') setOn(k.n);
      else if (k.t === 'pick') pick(openCard, k.n);
      else close(openCard);
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
    };
  });

  const notify = useNotifyRow(list.length);
  if (list.length === 0) return null;
  const openAt = openCard === undefined ? -1 : list.indexOf(openCard);
  const shown = list.filter((_, i) => i < STRIP_ROWS || i === openAt);
  const more = list.length - shown.length;
  const next = list.find((_, i) => i >= STRIP_ROWS && i !== openAt);
  const keys = list.length > 1 ? `⌃1–${String(Math.min(list.length, STRIP_KEYS))}` : '⌃1';
  return (
    <section className="inbox-strip inbox-block" aria-label="inbox" data-testid="inbox.block" data-open={openCard !== undefined || undefined}>
      <div className="strip-title">
        inbox <span className="strip-count">{`${String(list.length)} waiting`}</span>
        <span className="strip-keys" data-testid="inbox.block.keys">
          {openCard !== undefined ? (
            <>
              <Kbd>↑↓</Kbd> next <Kbd>esc</Kbd> fold
            </>
          ) : (
            <>
              <Kbd>{keys}</Kbd> open
            </>
          )}
        </span>
      </div>
      {notify.show && (
        <div className="ib-notify" data-testid="inbox.block.notify">
          <span className="ib-notify-words">questions can reach you when bise isn't in front, as macOS notifications.</span>
          <button type="button" className="ib-notify-on" onClick={notify.on} data-testid="inbox.block.notify.on">
            turn on
          </button>
          <button type="button" className="ib-notify-later" onClick={notify.later} data-testid="inbox.block.notify.later">
            not now
          </button>
        </div>
      )}
      {shown.map((c) => {
        const n = list.indexOf(c) + 1;
        const row = names.get(c.project);
        if (c === openCard) {
          return (
            <div key={cardKey(c)} className="inbox-block-open" data-testid={`inbox.block.open.${String(n)}`}>
              <InboxCard
                card={c}
                {...(row !== undefined ? { project: row.name } : {})}
                {...(row?.home === true ? { home: true } : {})}
                now={now}
                on={on}
                full={false}
                acts={{
                  pick: (o) => {
                    pick(c, o);
                  },
                  close: () => {
                    close(c);
                  },
                  later: () => {
                    openTo(null);
                  },
                }}
                testId={`inbox.block.card.${cardKey(c)}`}
              />
            </div>
          );
        }
        const { who, what } = stripWords(c);
        const sign = signOf(c);
        return (
          <button
            key={cardKey(c)}
            type="button"
            className="strip-row"
            data-testid={`inbox.block.row.${String(n)}`}
            onClick={() => {
              openTo(cardKey(c));
            }}
          >
            <span className="strip-n">{n}</span>
            {sign !== null ? <span className={sign === '!' ? 'ib-sign acc' : 'ib-sign'}>{sign}</span> : <Dot state={dotOf(c)} />}
            <span className="strip-who">{shownName(who)}</span>
            {what !== '' && <span className="strip-what">{` · ${what}`}</span>}
            <span className="strip-age">{`${row?.home === true ? '' : `${row?.name ?? c.project} · `}${age(now - c.since_ms)}`}</span>
          </button>
        );
      })}
      {more > 0 && next !== undefined && (
        <button
          type="button"
          className="strip-row strip-more"
          data-testid="inbox.block.more"
          onClick={() => {
            openTo(cardKey(next));
          }}
        >
          {`+ ${String(more)} more`}
        </button>
      )}
    </section>
  );
}

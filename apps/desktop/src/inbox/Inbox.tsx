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
import { memo, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { Card as CardRow, Part } from '@/proto';
import { Empty, Head, Row } from '@/ds';
import { dotOf, folds, InboxCard, titleOf } from './InboxCard';
import { cardKey } from './order';
import { inboxDrafts, type Drafts } from './drafts';
import { caretAtEnd } from '@/app/keep';
import { useMenuAction } from '@/app/menu';
import { saveImageFile, thumbnail } from '@/composer/attach';
import type { SavedImage } from '@/composer/sources';
import { current, prune, START, step, takesWords, visible, type Act, type Key } from './model';
import './inbox.css';

/** An image on his answer: saved in bise's image store, with its chip's thumbnail (none: unreadable). */
type AnswerImage = SavedImage & { readonly thumb?: string };

export interface InboxPorts {
  /** his answer; with images, typed parts (the images, then his words) and the reply text with their labels */
  answer: (project: string, card: number, reply: string, parts?: readonly Part[]) => void;
  /** close without answering (none: no close key, no button) */
  close?: (project: string, card: number) => void;
  /** esc: back where he was */
  back: () => void;
  /** a card that points at a page block: open it */
  openPage?: (url: string) => void;
  /** bar N14: the card in front of him while this window has focus, null when none (fn's talk can answer it) */
  inView?: (card: { project: string; card: number } | null) => void;
}

/** bar N14: the core heard his talk answer a card (the core's voice_answer). */
export interface VoiceAnswer {
  project: string;
  card: number;
  n: number;
  line: string;
  ms: number;
}

export interface InboxProps {
  /** every project's open cards, any order */
  cards: readonly CardRow[];
  /** a project id's name for the rows ("acme"); unknown: the id */
  names: Readonly<Record<string, string>>;
  /** bise's own home projects: their card's header names no project */
  homes?: ReadonlySet<string>;
  ports: InboxPorts;
  /** now, for the ages (a test pins it) */
  now?: number;
  /** each item's typed words (default: the window's, drafts.ts) */
  drafts?: Drafts;
  /** the last answer by voice the core heard (bar N14) */
  voice?: VoiceAnswer | null;
  /** bar L25: the demo tour's tip above the open item (none: no tip) */
  tipOf?: (c: CardRow) => ReactNode;
}

export function Inbox({ cards, names, homes, ports, now: pinned, drafts = inboxDrafts, voice = null, tipOf }: InboxProps) {
  const [opened] = useState(() => Date.now());
  const now = pinned ?? opened;
  const [s, setS] = useState(START);
  // ctrl+o: the current item's folded lines open (bar I8); a new item folds again
  const [whole, setWhole] = useState<string | null>(null);
  const list = visible(cards, s);
  const cur = current(list, s);
  const curKey = cur ? cardKey(cur) : null;
  const field = useRef<HTMLTextAreaElement>(null);
  const root = useRef<HTMLElement>(null);
  // R41: the images he pasted or dropped on an item's answer (saved by the window: absolute paths,
  // with the thumbnail its chip shows), per item
  const [images, setImages] = useState<ReadonlyMap<string, readonly AnswerImage[]>>(new Map());
  const imagesOf = (k: string | null): readonly AnswerImage[] => (k === null ? [] : (images.get(k) ?? []));
  const addImages = (k: string, list: readonly File[]) => {
    for (const f of list) {
      if (!f.type.startsWith('image/')) continue;
      void Promise.all([saveImageFile(f), thumbnail(f)]).then(([img, thumb]) => {
        if (img !== null) setImages((m) => new Map(m).set(k, [...(m.get(k) ?? []), thumb === null ? img : { ...img, thumb }]));
      });
    }
  };
  const dropImages = (k: string, i?: number) => {
    setImages((m) => {
      const n = new Map(m);
      if (i === undefined) n.delete(k);
      else n.set(k, (m.get(k) ?? []).filter((_, j) => j !== i));
      return n;
    });
  };

  // bar N14: the core knows the card in front of him while this window
  // has focus; none when it blurs, leaves the inbox or the list empties
  const inView = ports.inView;
  const curProject = cur?.project ?? null;
  const curId = cur?.id ?? null;
  useEffect(() => {
    if (!inView) return;
    const say = () => {
      inView(curProject !== null && curId !== null && document.hasFocus() ? { project: curProject, card: curId } : null);
    };
    const none = () => {
      inView(null);
    };
    say();
    window.addEventListener('focus', say);
    window.addEventListener('blur', none);
    return () => {
      window.removeEventListener('focus', say);
      window.removeEventListener('blur', none);
      none();
    };
  }, [inView, curProject, curId]);

  // bar N14: his talk answered the current card: its heard line shows for
  // the event's ms (esc undoes, nothing sent), then the answer goes as the
  // digit key's would
  // the event that was answered or undone (none shows again)
  const [done, setDone] = useState<VoiceAnswer | null>(null);
  const heard = voice !== null && voice !== done && cards.some((c) => c.project === voice.project && c.id === voice.card) ? voice : null;
  useEffect(() => {
    if (heard === null) return;
    const t = setTimeout(() => {
      setDone(heard);
      drafts.drop(`${heard.project}-${String(heard.card)}`);
      ports.answer(heard.project, heard.card, String(heard.n));
    }, heard.ms);
    return () => {
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one answer per heard event
  }, [heard]);

  // an item that is gone takes its words with it
  useEffect(() => {
    drafts.prune(new Set(cards.map(cardKey)));
  }, [cards, drafts]);

  // the current item takes the keys: its field, or the screen for an approval
  // (a kept answer comes back with the caret at its end, like the composer: his next key follows his words)
  useEffect(() => {
    (field.current ?? root.current)?.focus();
    caretAtEnd(field.current);
  }, [curKey]);

  // ctrl+o (and ⌘E): the window's capture listener takes the key (app/keys.ts 'fold-all', the
  // TUI's ctrl+o) before any field; the open item's folded lines open, again folds them (bar I8)
  useMenuAction('fold-all', () => {
    if (cur && curKey !== null && folds(cur.question)) setWhole(whole === curKey ? null : curKey);
  });

  const run = (a: Act) => {
    if (a.t === 'answer') {
      const k = `${a.project}-${String(a.card)}`;
      // msg-parts (ambient-lead m_18030, as the composer's d68b4867): each image goes as a typed part
      // with its source in the image store (the hub keeps it since main 18a32ce3), never as files; the
      // reply text keeps the '[Image #n]' labels for older readers, the parts hold his words apart
      const imgs = imagesOf(k);
      if (imgs.length === 0) ports.answer(a.project, a.card, a.reply);
      else {
        const labels = imgs.map((_, i) => `[Image #${String(i + 1)}]`);
        const parts: Part[] = [...imgs.map((im, i) => ({ kind: 'image' as const, name: labels[i] ?? '', source: im.path })), ...(a.reply.trim() === '' ? [] : [{ kind: 'text' as const, text: a.reply }])];
        ports.answer(a.project, a.card, [...labels, a.reply].join(' ').trim(), parts);
      }
      dropImages(k);
    }
    else if (a.t === 'close') ports.close?.(a.project, a.card);
    else ports.back();
  };

  const key = (k: Key) => {
    const text = field.current?.value ?? '';
    // R41: ⏎ with images and no words answers with the images alone (the hub takes a files-only answer)
    if (k.k === 'enter' && cur && curKey !== null && takesWords(cur) && text.trim() === '' && imagesOf(curKey).length > 0) {
      drafts.drop(curKey);
      setS(prune({ ...s }, cards));
      run({ t: 'answer', project: cur.project, card: cur.id, reply: '' });
      return;
    }
    const r = step(s, list, k, text);
    // an answer or a close takes the item's words; esc and moving keep them
    if (curKey !== null && (r.act?.t === 'answer' || r.act?.t === 'close')) drafts.drop(curKey);
    setS(prune(r.s, cards));
    if (r.act) run(r.act);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (heard !== null && e.key === 'Escape') {
      // the heard answer is undone: nothing goes
      e.preventDefault();
      setDone(heard);
      return;
    }
    // ⌫ at the start of his words takes the last image chip away, as the composer's ⌫ before a chip
    const f = field.current;
    if (e.key === 'Backspace' && !e.metaKey && !e.altKey && f !== null && e.target === f && f.selectionStart === 0 && f.selectionEnd === 0 && curKey !== null && imagesOf(curKey).length > 0) {
      e.preventDefault();
      dropImages(curKey, imagesOf(curKey).length - 1);
      return;
    }
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
            {tipOf?.(cur)}
            <InboxCard
              card={cur}
              project={names[cur.project]}
              home={homes?.has(cur.project) === true}
              on={s.hl}
              now={now}
              full={whole === curKey}
              {...(heard !== null && heard.project === cur.project && heard.card === cur.id
                ? {
                    note: (
                      <span className="inbox-heard" data-testid="inbox.heard">
                        {heard.line} · esc undoes
                      </span>
                    ),
                  }
                : {})}
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
                later: () => {
                  key({ k: 'esc' });
                },
                type: () => {
                  field.current?.focus();
                },
              }}
            >
              {takesWords(cur) && (
                // the field's box holds the image chips (the composer's: thumbnail + '[Image #n]', accent
                // on accent-soft, ⌫ at the start of his words removes the last) and then his words
                <div className="inbox-answer" data-testid="inbox.answer.box">
                {imagesOf(curKey).map((img, i) => (
                  <span key={img.path} className="b-chip image" data-kind="image" title={img.path} data-testid={`inbox.answer.image.${String(i + 1)}`}>
                    {img.thumb !== undefined && <img className="thumb" src={img.thumb} alt="" />}
                    {`[Image #${String(i + 1)}]`}
                  </span>
                ))}
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
                  onPaste={(e) => {
                    const fs = [...e.clipboardData.files].filter((f) => f.type.startsWith('image/'));
                    if (fs.length === 0 || curKey === null) return;
                    e.preventDefault();
                    addImages(curKey, fs);
                  }}
                  onDragOver={(e) => {
                    if ([...e.dataTransfer.items].some((i) => i.kind === 'file')) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    const fs = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/'));
                    if (fs.length === 0 || curKey === null) return;
                    e.preventDefault();
                    addImages(curKey, fs);
                  }}
                />
                </div>
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
      name={`${String(n)}  ${titleOf(c)}: ${firstLine(c.question)}`}
      // the project dim on every item: everything here waits on him, the pink is the dot's (designer D9)
      end={name}
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
  // ctrl+n / ctrl+p walk the items as the TUI's card view (bar I3), words or not
  if (e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'n') return { k: 'next' };
  if (e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'p') return { k: 'prev' };
  // R19: the arrows as the TUI's card view (sb/cards.rs:1223): plain or with ctrl, ↑↓ the items, ←→ the options
  const arrow = e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight';
  if (e.metaKey || e.altKey || (e.ctrlKey && !arrow)) return null;
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

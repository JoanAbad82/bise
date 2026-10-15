// One inbox item drawn as a card (inbox card v2, ambient m_11273, its mock
// site/content/ambient/inbox-card.html): a one-line header (the glyph, the
// title, '· project' cut, the age), the question (pre-wrap, folded past 8
// lines), the options as full-width numbered rows that wrap freely (never
// pills: a 3-line French label grows its row), and one footer line of keys,
// each pair a button ('1–3 pick', '⌘⌫ close', '⏎ open in bise', 'esc
// later'). A card linked to a page (notif-artifact, designer m_26560) carries
// the page as a chip under the question ('↗ <title> · page · v4', '⌘O open
// beside' at its right), each option's one-line why and the asker's 'my
// pick', and its foot says who reads typed words. Opaque and docked in the window (the strip's open item,
// ⌘I's open item); the capsule's card keeps its glass (surface 'glass') with
// the same rows. No list, no keys: the mounting screen owns them. A clicked
// row shows picked for PICKED_MS, then picks. Owner: amb-home.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Card as CardRow } from '@/proto';
import type { CardPage } from '@/proto/rows';
import { Act, ArtChip, Kbd, tipAttrs } from '@/ds';
import { refusedLine, useRefused, useStore } from '@/store';
import { cardKey } from './order';
import { ArtWords } from './artWords';
import { takesWords } from './model';
import { optTip } from './optAct';

/** A clicked row stays picked (ink) this long before it leaves. */
export const PICKED_MS = 300;

export interface InboxCardActs {
  /** an option picked (a click; the keys are the mounting screen's) */
  pick: (n: number) => void;
  /** close it without answering ('⌘⌫ close') */
  close?: () => void;
  /** open it in bise's window (a card outside the window: '⏎ open in bise') */
  open?: () => void;
  /** it is linked to a page: open it beside the thread at its block (the chip, 'o') */
  openPage?: () => void;
  /** put it off ('esc later') */
  later?: () => void;
  /** go to where words answer it ('type your answer below') */
  type?: () => void;
}

export interface InboxCardProps {
  card: CardRow;
  /** its project's name ("acme"); none: the id */
  project?: string;
  /** bise's own home: no '· project' in the header */
  home?: boolean;
  acts: InboxCardActs;
  /** the option the keyboard is on (none: no option on) */
  on?: number | null;
  /** now, for its age */
  now: number;
  /** replaces the footer's keys */
  keys?: ReactNode;
  /** a line over the footer (what the core heard, bar N14) */
  note?: ReactNode;
  /** under the options: the inbox's answer field */
  children?: ReactNode;
  /** more cards behind it */
  stacked?: boolean;
  /** a long question folded (false) or whole (true; ctrl+o, bar I8);
   * none: always whole (the capsule's card) */
  full?: boolean;
  /** 'dock' (default): opaque, in the window's flow; 'glass': the capsule's */
  surface?: 'dock' | 'glass';
  /** default `inbox.card.<project>-<id>`; its options are `<testId>.opt.<n>` */
  testId?: string;
  /** the hub closed it while his words were typed (card-draft-keep): '· closed', its options dim, no pick */
  closed?: boolean;
}

export function InboxCard({ card, project, home, acts, on = null, now, keys, note, children, stacked, full, surface = 'dock', testId, closed = false }: InboxCardProps) {
  const id = testId ?? `inbox.card.${cardKey(card)}`;
  const [picked, setPicked] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );
  const pick = (n: number) => {
    if (picked !== null || closed) return;
    setPicked(n);
    timer.current = setTimeout(() => {
      timer.current = null;
      setPicked(null);
      acts.pick(n);
    }, PICKED_MS);
  };
  // while the keys drive (an option on), a resting mouse paints no hover;
  // the next mouse move gives it back (ambient m_11426)
  const [driving, setDriving] = useState(false);
  const [lastOn, setLastOn] = useState(on);
  if (on !== lastOn) {
    setLastOn(on);
    if (on !== null) setDriving(true);
  }
  const where = project ?? card.project;
  // an option that opens an artifact says where it goes (designer m_24724, law 6)
  const store = useStore();
  const artTitle = (aid: string) => store.artifacts(card.project).find((a) => a.id === aid)?.title;
  const el = (
    <div
      className={`ic ${surface}${driving ? ' driving' : ''}${full === true ? ' whole' : ''}${closed ? ' closed' : ''}`}
      role="group"
      data-testid={id}
      data-closed={closed || undefined}
      onMouseMove={
        driving
          ? () => {
              setDriving(false);
            }
          : undefined
      }
    >
      <div className="ic-h">
        <span className="ic-g" aria-hidden="true">
          {glyphOf(card)}
        </span>
        <b>{titleOf(card)}</b>
        {home !== true && <span className="ic-p" data-testid={`${id}.project`}>{`· ${where}`}</span>}
        <span className="ic-k">{closed ? `${age(now - card.since_ms)} · closed` : age(now - card.since_ms)}</span>
      </div>
      <div className="ic-q" data-testid={`${id}.q`}>
        {full === false ? <Folded text={card.question} project={card.project} testId={`${id}.more`} q={`${id}.q`} /> : <ArtWords text={card.question} project={card.project} testId={`${id}.q`} />}
      </div>
      {card.page != null && <PageChip page={card.page} open={acts.openPage} id={id} />}
      {card.options.length > 0 && (
        <div className="ic-opts" role="listbox" data-testid={`${id}.opt`}>
          {card.options.map((o) => (
            <div
              key={o.n}
              role="option"
              aria-selected={o.n === on || o.n === picked}
              className={`ic-opt${o.n === on ? ' on' : ''}${o.n === picked ? ' picked' : ''}`}
              onClick={() => {
                pick(o.n);
              }}
              data-testid={`${id}.opt.${String(o.n)}`}
              {...tipAttrs(optTip(o.act, artTitle) ?? undefined)}
            >
              <span className="ic-n">{o.n}</span>
              <span className="ic-l">
                {o.label}
                {o.why != null && o.why !== '' && <span className="ic-why">{o.why}</span>}
              </span>
              {o.mine === true && <span className="ic-mine">my pick</span>}
            </div>
          ))}
        </div>
      )}
      {children}
      <RefusedNote card={card} id={id} />
      {note != null && <div className="ic-note">{note}</div>}
      <div className="ic-foot" data-testid={`${id}.keys`}>
        {keys ?? <Footer card={card} acts={acts} on={on} id={id} pick={pick} />}
      </div>
    </div>
  );
  return stacked ? (
    <div>
      {el}
      <div className="b-stackback" />
    </div>
  ) : (
    el
  );
}

/**
 * His answer or close of this card refused in this window (store refused.ts, try-gate-f2a7): the
 * hub's words on the card that came back, wherever it is drawn (the block, the strip, the capsule),
 * and 'try again' sends what he sent once more. Gone when he acts on it or the hub takes it.
 */
function RefusedNote({ card, id }: { card: CardRow; id: string }) {
  const store = useStore();
  const refused = useRefused(card.project, card.id);
  if (refused === null) return null;
  return (
    <div className="ic-note ic-refused" role="alert" data-testid={`${id}.refused`}>
      {refusedLine(refused.text)}
      {refused.attempt !== undefined && (
        <>
          {' · '}
          <Act
            onClick={() => {
              store.retryCard(card.project, card.id);
            }}
            testId={`${id}.retry`}
          >
            try again
          </Act>
        </>
      )}
    </div>
  );
}

/** A folded row's mark for a card whose answer or close was refused here: 'not sent', or nothing. */
export function RefusedMark({ card }: { card: CardRow }) {
  const refused = useRefused(card.project, card.id);
  return refused === null ? null : <span className="ic-refused-mark">not sent</span>;
}

/** The footer's keys (ambient's six forms), each pair a button. */
function Footer({ card, acts, on, id, pick }: { card: CardRow; acts: InboxCardActs; on: number | null; id: string; pick: (n: number) => void }) {
  const n = card.options.length;
  const outside = acts.open !== undefined;
  const pair = (k: string | null, words: string, test: string, run: (() => void) | undefined, end = false) => {
    const act = (
      <Act onClick={run} testId={`${id}.${test}`}>
        {k !== null && <Kbd>{k}</Kbd>}
        {words}
      </Act>
    );
    return end ? <span className="ic-foot-end">{act}</span> : act;
  };
  return (
    <>
      {n > 0 && pair(pickKeys(n), 'pick', 'pick', on !== null ? () => { pick(on); } : undefined)}
      {!outside && takesWords(card) && pair(null, typeWords(card, n), 'type', acts.type)}
      {outside && pair('⏎', 'open in bise', 'open', acts.open)}
      {!outside && acts.close && pair('⌘⌫', 'close', 'close', acts.close)}
      {pair('esc', 'later', 'later', acts.later, true)}
    </>
  );
}

/** What typed words do: a page's card says who reads them ('or type: designer reads it'). */
export function typeWords(card: CardRow, n: number): string {
  if (card.page?.title != null) return `${n > 0 ? 'or type' : 'type'}: ${shownAgent(card.agent)} reads it`;
  return n > 0 ? 'or type your answer below' : 'type your answer below';
}

/** main's card is bise's (ambient m_11273). */
function shownAgent(agent: string): string {
  return agent === 'main' ? 'bise' : agent;
}

/** The chip's words: '<title> · page · v4' (an older hub sends no title: the page's id). */
export function pageChipWords(page: CardPage): { title: string; meta: string } {
  return { title: page.title ?? page.id, meta: ['page', page.v == null ? '' : `v${String(page.v)}`].filter(Boolean).join(' · ') };
}

/** The page under the question (designer m_26560, m_26776): the artifact chip, '⌘O open beside' at its right. */
function PageChip({ page, open, id }: { page: CardPage; open: (() => void) | undefined; id: string }) {
  const w = pageChipWords(page);
  return (
    <div className="ic-page" data-testid={`${id}.page`}>
      <ArtChip title={w.title} meta={w.meta} {...(open ? { onClick: open } : {})} testId={`${id}.page.chip`} />
      {open && (
        <Act onClick={open} testId={`${id}.page.open`}>
          <Kbd>⌘O</Kbd>
          open beside
        </Act>
      )}
    </div>
  );
}

/** '1', '1 2', '1–3' */
export function pickKeys(n: number): string {
  return n === 1 ? '1' : n === 2 ? '1 2' : `1–${String(n)}`;
}

/** '!' an approval or an item only its options decide (a merge, a try…); '?' the rest, an urgent
 * question too: a question is '?' in its row and its card head alike (designer m_15412, m_20053). */
export function glyphOf(c: CardRow): string {
  return c.approval === true || !takesWords(c) ? '!' : '?';
}

/** A long question's first lines (bar I8): more than FOLD_AT lines show
 * FOLD_SHOW of them and how many more, ctrl+o opens the rest. */
export const FOLD_AT = 8;
export const FOLD_SHOW = 6;

export function folds(text: string): boolean {
  return text.split('\n').length > FOLD_AT;
}

function Folded({ text, project, testId, q }: { text: string; project: string; testId: string; q: string }) {
  const lines = text.split('\n');
  if (lines.length <= FOLD_AT) return <ArtWords text={text} project={project} testId={q} />;
  const more = lines.length - FOLD_SHOW;
  return (
    <>
      <ArtWords text={lines.slice(0, FOLD_SHOW).join('\n')} project={project} testId={q} />
      <span data-testid={testId}>
        {`\n… ${String(more)} more lines `}
        <Kbd>ctrl o</Kbd>
      </span>
    </>
  );
}

/** Words answer it (a question), not only its options. */

/** A card's title: an approval asks like a question ('bise asks', 'search asks'; ambient m_11426:
 * its '!' and its options say it is one, the noun stays in the question), else kindTitle. */
export function titleOf(c: CardRow): string {
  return c.approval === true ? kindTitle('question', c.agent) : kindTitle(c.kind, c.agent);
}

/** An item's title (the TUI's kind_title, copy deck §17). */
export function kindTitle(kind: string, agent0: string): string {
  // main's card is bise's (ambient m_11273): 'bise asks', never 'main asks'
  const agent = agent0 === 'main' ? 'bise' : agent0;
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
      // never a card's kind id (designer m_15412): any other kind asks like a question; its text
      // says what it asks ('merge sb/perf into main?')
      return `${agent} asks`;
  }
}

/** Its dot: what needs him in the accent, a failure in error, done in ok. */
export function dotOf(c: CardRow): 'nd' | 'er' | 'ok' {
  if (c.kind === 'failed' || c.kind === 'restart') return 'er';
  if (c.kind === 'done') return 'ok';
  return 'nd';
}

/** "now", "4 min", "2 h", "3 d" */
export function age(ms: number): string {
  const m = Math.floor(Math.max(0, ms) / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${String(m)} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${String(h)} h` : `${String(Math.floor(h / 24))} d`;
}

// One inbox item drawn as a card (inbox card v2, ambient m_11273, its mock
// site/content/ambient/inbox-card.html): a one-line header (the glyph, the
// title, '· project' cut, the age), the question (pre-wrap, folded past 8
// lines), the options as full-width numbered rows that wrap freely (never
// pills: a 3-line French label grows its row), and one footer line of keys,
// each pair a button ('1–3 pick', '⌘⌫ close', '⌘O open its page', '⏎ open in
// bise', 'esc later'). Opaque and docked in the window (the strip's open item,
// ⌘I's open item); the capsule's card keeps its glass (surface 'glass') with
// the same rows. No list, no keys: the mounting screen owns them. A clicked
// row shows picked for PICKED_MS, then picks. Owner: amb-home.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Card as CardRow } from '@/proto';
import { Kbd } from '@/ds';
import { cardKey } from './order';

/** A clicked row stays picked (ink) this long before it leaves. */
export const PICKED_MS = 300;

export interface InboxCardActs {
  /** an option picked (a click; the keys are the mounting screen's) */
  pick: (n: number) => void;
  /** close it without answering ('⌘⌫ close') */
  close?: () => void;
  /** open it in bise's window (a card outside the window: '⏎ open in bise') */
  open?: () => void;
  /** it points at a page block: open that page ('⌘O open its page') */
  openPage?: (url: string) => void;
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
}

export function InboxCard({ card, project, home, acts, on = null, now, keys, note, children, stacked, full, surface = 'dock', testId }: InboxCardProps) {
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
    if (picked !== null) return;
    setPicked(n);
    timer.current = setTimeout(() => {
      timer.current = null;
      setPicked(null);
      acts.pick(n);
    }, PICKED_MS);
  };
  const where = project ?? card.project;
  const el = (
    <div className={`ic ${surface}`} role="group" data-testid={id}>
      <div className="ic-h">
        <span className="ic-g" aria-hidden="true">
          {glyphOf(card)}
        </span>
        <b>{kindTitle(card.kind, card.agent)}</b>
        {home !== true && <span className="ic-p" data-testid={`${id}.project`}>{`· ${where}`}</span>}
        <span className="ic-k">{age(now - card.since_ms)}</span>
      </div>
      <div className="ic-q" data-testid={`${id}.q`}>
        {full === false ? <Folded text={card.question} testId={`${id}.more`} /> : card.question}
      </div>
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
            >
              <span className="ic-n">{o.n}</span>
              <span className="ic-l">{o.label}</span>
            </div>
          ))}
        </div>
      )}
      {children}
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

/** The footer's keys (ambient's six forms), each pair a button. */
function Footer({ card, acts, on, id, pick }: { card: CardRow; acts: InboxCardActs; on: number | null; id: string; pick: (n: number) => void }) {
  const n = card.options.length;
  const page = card.page;
  const outside = acts.open !== undefined;
  const pair = (k: string | null, words: string, test: string, run: (() => void) | undefined, end = false) => (
    <button type="button" className={end ? 'end' : undefined} onClick={run} data-testid={`${id}.${test}`}>
      {k !== null && <Kbd>{k}</Kbd>}
      {words}
    </button>
  );
  return (
    <>
      {n > 0 && pair(pickKeys(n), 'pick', 'pick', on !== null ? () => { pick(on); } : undefined)}
      {!outside && takesWords(card) && pair(null, n > 0 ? 'or type your answer below' : 'type your answer below', 'type', acts.type)}
      {outside && pair('⏎', 'open in bise', 'open', acts.open)}
      {page != null && acts.openPage && pair('⌘O', 'open its page', 'page', () => acts.openPage?.(page.url))}
      {!outside && acts.close && pair('⌘⌫', 'close', 'close', acts.close)}
      {pair('esc', 'later', 'later', acts.later, true)}
    </>
  );
}

/** '1', '1 2', '1–3' */
export function pickKeys(n: number): string {
  return n === 1 ? '1' : n === 2 ? '1 2' : `1–${String(n)}`;
}

/** '!' an approval (or an urgent item), '?' the rest. */
export function glyphOf(c: CardRow): string {
  return c.approval === true || c.urgent ? '!' : '?';
}

/** A long question's first lines (bar I8): more than FOLD_AT lines show
 * FOLD_SHOW of them and how many more, ctrl+o opens the rest. */
export const FOLD_AT = 8;
export const FOLD_SHOW = 6;

export function folds(text: string): boolean {
  return text.split('\n').length > FOLD_AT;
}

function Folded({ text, testId }: { text: string; testId: string }) {
  const lines = text.split('\n');
  if (lines.length <= FOLD_AT) return <>{text}</>;
  const more = lines.length - FOLD_SHOW;
  return (
    <>
      {lines.slice(0, FOLD_SHOW).join('\n')}
      <span className="inbox-more" data-testid={testId}>
        {`\n… ${String(more)} more lines `}
        <Kbd>ctrl o</Kbd>
      </span>
    </>
  );
}

/** Words answer it (a question), not only its options. */
export function takesWords(c: CardRow): boolean {
  return c.approval !== true;
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
      return `${agent}: ${kind}`;
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

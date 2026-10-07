// One inbox item drawn as a card: its title (the TUI's kind_title), the
// project, its age, the question, its numbered options and its acts. No
// list, no keys, no state: the ⌘I inbox (Inbox.tsx) mounts it for the
// current item with its answer field as `children`, and the capsule's
// bottom cards (src/capsule, amb-web) mount it alone. Owner: amb-home.
import type { ReactNode } from 'react';
import type { Card as CardRow } from '@/proto';
import { Card, Kbd, Opts } from '@/ds';
import { cardKey } from './order';

export interface InboxCardActs {
  /** an option picked (a click; the keys are the mounting screen's) */
  pick: (n: number) => void;
  /** close it without answering */
  close?: () => void;
  /** open it in bise's window (a card outside the window) */
  open?: () => void;
  /** it points at a page block: open that page */
  openPage?: (url: string) => void;
}

export interface InboxCardProps {
  card: CardRow;
  /** its project's name ("acme"); none: the id */
  project?: string;
  acts: InboxCardActs;
  /** the option the keyboard is on (none: no option on) */
  on?: number | null;
  /** now, for its age */
  now: number;
  /** the hint line; none: the inbox's keys for this card */
  keys?: ReactNode;
  /** under the options: the inbox's answer field */
  children?: ReactNode;
  /** more cards behind it */
  stacked?: boolean;
  /** a long question folded (false) or whole (true; ctrl+o, bar I8);
   * none: always whole (the capsule's card) */
  full?: boolean;
  /** default `inbox.card.<project>-<id>`; its options are `<testId>.opt.<n>` */
  testId?: string;
}

export function InboxCard({ card, project, acts, on = null, now, keys, children, stacked, full, testId }: InboxCardProps) {
  const id = testId ?? `inbox.card.${cardKey(card)}`;
  const page = card.page;
  return (
    <Card
      lead={dotOf(card)}
      who={kindTitle(card.kind, card.agent)}
      rest={` · ${project ?? card.project}`}
      k={age(now - card.since_ms)}
      q={full === false ? <Folded text={card.question} testId={`${id}.more`} /> : card.question}
      keys={keys ?? hints(card)}
      stacked={stacked}
      testId={id}
    >
      {card.options.length > 0 && <Opts items={card.options.map((o) => ({ n: o.n, text: o.label, on: o.n === on }))} onPick={acts.pick} testId={`${id}.opt`} />}
      {children}
      {(acts.close ?? acts.open ?? (page != null ? acts.openPage : undefined)) !== undefined && (
        <div className="inbox-acts">
          {page != null && acts.openPage && (
            <button type="button" data-testid={`${id}.page`} onClick={() => acts.openPage?.(page.url)}>
              open its page
            </button>
          )}
          {acts.open && (
            <button type="button" data-testid={`${id}.open`} onClick={acts.open}>
              open in bise
            </button>
          )}
          {acts.close && (
            <button type="button" data-testid={`${id}.close`} onClick={acts.close}>
              close without answering
            </button>
          )}
        </div>
      )}
    </Card>
  );
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

function hints(c: CardRow): ReactNode {
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

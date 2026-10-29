// The selection pop (lead m_11968, the TUI's quote.rs pill, designer m_11973's words and order):
// over text selected in the thread or lines picked in a review,
// ' type to ask about it · tab quote · cmd+c copy ' in the TUI, here 'type to ask about it · tab quote · ⌘C copy'
// (tab is the quote key in both, main m_12004; the desktop's key words are its key bar's: 'tab', '⌘C').
// Each part is a control: a click on the ask words or on 'tab quote' quotes the selection into the
// composer at the caret (nothing typed), a click on '⌘C copy' copies it. A press never takes the
// focus or the selection (they are what it acts on). Designer's order rule (m_11973): when the pop
// must shrink, '⌘C copy' goes first, then 'tab quote'. Owner: amb-web.
import type { MouseEvent, ReactNode } from 'react';
import './quote.css';
import { Press } from '@/ds';

/** The words (one place, so the thread's pop and the review's read the same). */
export const QW = {
  ask: (to?: string): string => (to === undefined ? 'type to ask about it' : `type to ask ${to} about it`),
  key: 'tab quote',
  copy: '⌘C copy',
} as const;

export interface QuotePopProps {
  /** the agent the review's quote goes to; the thread's: none (its own) */
  readonly to?: string;
  readonly onAsk: () => void;
  readonly onCopy: () => void;
  readonly testId: string;
}

const keep = (e: MouseEvent): void => {
  // the selection and the composer's caret stay where they are
  e.preventDefault();
};

export function QuotePop({ to, onAsk, onCopy, testId }: QuotePopProps): ReactNode {
  return (
    <span className="q-pop" data-testid={testId} onMouseDown={keep}>
      <Press tabIndex={-1} look="q-part" data-testid={`${testId}.ask`} onMouseDown={keep} onClick={onAsk}>
        {QW.ask(to)}
      </Press>
      <span className="q-dot q-key"> · </span>
      <Press tabIndex={-1} look="q-part q-key" data-testid={`${testId}.key`} onMouseDown={keep} onClick={onAsk}>
        {QW.key}
      </Press>
      <span className="q-dot q-copy"> · </span>
      <Press tabIndex={-1} look="q-part q-copy" data-testid={`${testId}.copy`} onMouseDown={keep} onClick={onCopy}>
        {QW.copy}
      </Press>
    </span>
  );
}

/** The selection's words to his clipboard (the app's copy: the fence in test mode). */
export function copyText(text: string): void {
  const b = (window as Partial<Window>).bise;
  if (b !== undefined) void b.copy(text);
  else void navigator.clipboard.writeText(text);
}

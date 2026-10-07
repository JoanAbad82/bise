// The selection pop (lead m_11968, the TUI's quote.rs pill, designer m_11973's words and order):
// over text selected in the thread or lines picked in a review, ' type to ask about it · ⌘C copy '.
// Each part is a control: a click on the ask words quotes the selection into the composer at
// the caret (nothing typed), a click on '⌘C copy' copies it. A press never takes the focus or
// the selection (they are what it acts on). The quote key ('<key> quote', between the two)
// comes when main picks it (quote-keys sets it for the TUI; same key in both). Owner: amb-web.
import type { MouseEvent, ReactNode } from 'react';
import './quote.css';

/** The words (one place, so the thread's pop and the review's read the same). */
export const QW = {
  ask: (to?: string): string => (to === undefined ? 'type to ask about it' : `type to ask ${to} about it`),
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
      <button type="button" tabIndex={-1} className="q-part" data-testid={`${testId}.ask`} onMouseDown={keep} onClick={onAsk}>
        {QW.ask(to)}
      </button>
      <span className="q-dot"> · </span>
      <button type="button" tabIndex={-1} className="q-part" data-testid={`${testId}.copy`} onMouseDown={keep} onClick={onCopy}>
        {QW.copy}
      </button>
    </span>
  );
}

/** The selection's words to his clipboard (the app's copy: the fence in test mode). */
export function copyText(text: string): void {
  const b = (window as Partial<Window>).bise;
  if (b !== undefined) void b.copy(text);
  else void navigator.clipboard.writeText(text);
}

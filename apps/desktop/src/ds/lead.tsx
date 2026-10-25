// src/ds · PageLead: the top of a page that is no thread (bise fait mac, page native-mac §6,
// designer's lead rule on #5): one sentence (15/22, text-2), then a facts line of live numbers
// (13/18, text-3) 4 below it. The page's name is in the window's bar, never a second time here.
// The accent only on what waits on him: wrap that part of the facts in <LeadWait>. It replaces
// PageHero's card on every page (nm-pages-a, nm-pages-b). Pure render of its props. Owner: nm-ds.
import type { ReactNode } from "react";

export interface PageLeadProps {
  /** one sentence: what this place is, in his words */
  sentence: ReactNode;
  /** live numbers ('3 waiting · the oldest 21 d ago'); none when the place has none */
  facts?: ReactNode;
  testId?: string;
}

export function PageLead({ sentence, facts, testId }: PageLeadProps) {
  return (
    <header className="b-lead" data-testid={testId}>
      <p className="say">{sentence}</p>
      {facts != null && <p className="facts">{facts}</p>}
    </header>
  );
}

/** the part of a lead's facts that waits on him: the accent's only use in a lead */
export function LeadWait({ children }: { children: ReactNode }) {
  return <span className="wait">{children}</span>;
}

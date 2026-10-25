// src/ds · PageBanner: the head of every page that is no thread (bise fait mac, designer's rule
// m_42762, Gabriel's note m_42718): one card the content area's width, 24 from its edges, 200 high
// (160 under a 1000 content area). Left, its text: the page's title, its sentence, its facts (the
// accent only on what waits on him: <BannerWait>). Right, its visual in a 360 x 176 box (264 x 132
// narrow, none under 760): the page's bims vignette, a live canvas, or the page's line icon at 64
// when it has none, never an empty box. No buttons in it: the page's actions stay in its row under
// it. On a column page the title starts on the column's text edge; on a full-width page 32 in. It
// ends where the right side's world leaves room (gutter). Pure render of its props. Owner: nm-pages-a.
import type { CSSProperties, ReactNode } from "react";
import { AppIcon, type AppIconName } from "./icons-app";

export interface PageBannerProps {
  /** what this page is: its name ('Inbox') */
  title: ReactNode;
  /** one sentence: what this place is, in his words (2 lines at most) */
  sentence: ReactNode;
  /** live numbers ('3 waiting · the oldest 21 d ago'); none when the place has none */
  facts?: ReactNode;
  /** the right box's content: a vignette, a live canvas; none: the line icon */
  visual?: ReactNode;
  /** the page's line icon, drawn at 64 when it has no visual */
  icon: AppIconName;
  /** 'column': the title on the page's one column's text edge; 'page' (a full-width page): 32 in */
  edge?: "column" | "page";
  /** px the right side keeps free at the window's right edge (useSideLayout's gutter when it shows) */
  gutter?: number;
  testId?: string;
}

export function PageBanner({ title, sentence, facts, visual, icon, edge = "column", gutter = 0, testId }: PageBannerProps) {
  const style = gutter > 0 ? ({ "--banner-gutter": `${String(gutter)}px` } as CSSProperties) : undefined;
  return (
    <header className="b-banner" data-edge={edge} style={style} data-testid={testId}>
      <div className="in">
        <div className="txt">
          <h1 className="title">{title}</h1>
          <p className="say">{sentence}</p>
          {facts != null && <p className="facts">{facts}</p>}
        </div>
        <div className="vis" aria-hidden="true" data-testid={testId === undefined ? undefined : `${testId}.visual`} data-fallback={visual == null || undefined}>
          {visual ?? <AppIcon name={icon} />}
        </div>
      </div>
    </header>
  );
}

/** the part of a banner's facts that waits on him: the accent's only use in a banner */
export function BannerWait({ children }: { children: ReactNode }) {
  return <span className="wait">{children}</span>;
}

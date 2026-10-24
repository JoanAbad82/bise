// src/ds · PageHero: what a place is, said for good (designer's 'dialogs and page heroes' rules,
// docs/brand/design-system.md; mock page-hero, Gabriel's pick: the card). The first block of every
// full page (inbox, artifacts, scheduled, processes, agents, archived, each settings section) and,
// at its dialog size, of a dialog. Its name, one sentence in his words, a facts line of live
// numbers (the accent only on what waits on him: wrap that part in <HeroWait>), and a slot for a
// bims-world vignette (a still from the bims renderer; until those exist the hero is text-only,
// its words full width). Permanent: no ×, no 'got it', no setting hides it; it scrolls away with
// the page. Pure render of its props.
import type { ReactNode } from "react";
import { cx } from "./cx";

export interface PageHeroProps {
  /** the place's name (t-22 600; dialog t-17) */
  name: ReactNode;
  /** one sentence, ≤ 56 ch: what this place is */
  sentence: ReactNode;
  /** live numbers, t-13 text-3; none when the place has no live number */
  facts?: ReactNode;
  /** the bims-world still: page 220 × 132 at the card's right, dialog 64 px left of the name */
  vignette?: ReactNode;
  /** page: a card on --c-raised; dialog: no card */
  size?: "page" | "dialog";
  testId?: string;
}

export function PageHero({ name, sentence, facts, vignette, size = "page", testId }: PageHeroProps) {
  return (
    <header className={cx("b-hero", size === "dialog" && "dialog")} data-testid={testId}>
      <div className="words">
        <div className="name">{name}</div>
        <p className="say">{sentence}</p>
        {facts != null && <p className="facts">{facts}</p>}
      </div>
      {vignette != null && <div className="vig" aria-hidden="true">{vignette}</div>}
    </header>
  );
}

/** the part of a facts line that waits on him: the accent's only use in a hero */
export function HeroWait({ children }: { children: ReactNode }) {
  return <span className="wait">{children}</span>;
}

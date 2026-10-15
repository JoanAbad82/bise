// Slide: one line of words that takes its room, cut with '…' at rest, and slides to show the rest
// while its row is hovered or keyboard-focused (Gabriel: "slider au hover pour défiler et afficher le
// reste"). Ported from Vibe Work's ds AuraTextHoverScroll (~/mistral/dashboard, ts/packages/ui
// text-hover-scroll): 44 px a second, 80 ms before it starts, ease-in-out, back at the same pace when
// the pointer leaves. The row is the nearest `[data-slide-row]` (the whole row's hover moves it), else
// the line itself. Under reduced motion nothing moves: the '…' stays and the whole words go in the
// line's title. Its measure and its way back: hooks.ts. Owner: amb-kit.
import { useRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "./cx";
import { reducedMotion, useOverflow, useSlideBack } from "./hooks";

/** Vibe Work's pace: pixels a second. */
export const SLIDE_PX_PER_S = 44;
/** What the hover waits before the words move, ms (Vibe Work's). */
export const SLIDE_DELAY_MS = 80;

/** How long the slide over `over` hidden pixels takes, ms. Pure. */
export function slideMs(over: number): number {
  return over > 0 ? Math.round((over / SLIDE_PX_PER_S) * 1000) : 0;
}

export interface SlideProps {
  children: ReactNode;
  /** the line's own look (its color, size, flex in its row) */
  className?: string;
  testId?: string;
  /** the whole words, for the title under reduced motion (a cut line's only way to say the rest) */
  full?: string;
}

/** One line that slides on its row's hover to show what its '…' hides. */
export function Slide({ children, className, testId, full }: SlideProps) {
  const box = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const over = useOverflow(box, inner, [children]);
  // the way back keeps the line whole (no '…') until it is home, as Vibe Work's
  const back = useSlideBack(box, inner, over > 0);
  const style = { "--slide-ms": `${String(slideMs(over))}ms`, "--slide-delay": `${String(SLIDE_DELAY_MS)}ms` } as CSSProperties;
  return (
    <span
      ref={box}
      className={cx("b-slide", className)}
      style={style}
      data-over={over > 0 || undefined}
      data-back={back || undefined}
      title={over > 0 && full !== undefined && reducedMotion() ? full : undefined}
      data-testid={testId}
    >
      <span ref={inner} className="b-slide-in">
        {children}
      </span>
    </span>
  );
}

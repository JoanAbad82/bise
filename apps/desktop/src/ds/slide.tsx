// Slide: one line of words that takes its room, cut after a whole word with '…' at rest (designer
// m_23711, kept in m_26248), and slides to show the rest
// while its row is hovered or keyboard-focused (Gabriel: "slider au hover pour défiler et afficher le
// reste"). Ported from Vibe Work's ds AuraTextHoverScroll (~/mistral/dashboard, ts/packages/ui
// text-hover-scroll): 44 px a second, linear (slide-fix: eased over a long line it barely moved while
// hovered), 250 ms before it starts (designer m_26921: at Vibe Work's 80 ms a pointer crossing the
// bar set every row sliding); it holds at the end; home in --d-fast when the pointer leaves, never
// sliding after. The row is the nearest `[data-slide-row]` (the whole row's hover moves it), else
// the line itself. Under reduced motion nothing moves: the '…' stays and the whole words go in the
// line's title. Its measure and its way back: hooks.ts. Owner: amb-kit.
import { useRef, type CSSProperties } from "react";
import { cx } from "./cx";
import { reducedMotion, textWidth, useRoom, useSlideHold } from "./hooks";

/** Vibe Work's pace: pixels a second. */
export const SLIDE_PX_PER_S = 44;
/** What the hover waits before the words move, ms: a pointer crossing the bar moves none (designer m_26921). */
export const SLIDE_DELAY_MS = 250;

/** How long the slide over `over` hidden pixels takes, ms. Pure. */
export function slideMs(over: number): number {
  return over > 0 ? Math.round((over / SLIDE_PX_PER_S) * 1000) : 0;
}

/**
 * Whole words that fit `avail` (desktop-agents-bar §2, designer m_23711): the text, else its longest
 * run of whole words with '…', else '' (not even one whole word fits: the words go whole, never a
 * cut word). Pure.
 */
export function wholeWords(text: string, avail: number, width: (s: string) => number): string {
  if (width(text) <= avail) return text;
  const words = text.split(/\s+/u).filter((x) => x !== "");
  for (let k = words.length - 1; k >= 1; k--) {
    const cut = `${words.slice(0, k).join(" ")}…`;
    if (width(cut) <= avail) return cut;
  }
  return "";
}

export interface SlideProps {
  /** its words, on one line */
  text: string;
  /** the line's own look (its color, size, flex in its row) */
  className?: string;
  testId?: string;
}

/** One line that slides on its row's hover to show what its '…' hides. */
export function Slide({ text, className, testId }: SlideProps) {
  const box = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const room = useRoom(box);
  // a box with no width yet (not laid out) shows its words whole: the CSS clips them
  const measured = room.avail !== Infinity && room.avail > 0 && room.font !== "";
  const width = measured ? textWidth(room.font) : null;
  const over = width === null ? 0 : Math.max(0, Math.ceil(width(text) - room.avail));
  const cut = width === null || over === 0 ? text : wholeWords(text, room.avail, width);
  // held or on its way back: the whole words, sliding; at rest: whole words with '…'
  const { held, back } = useSlideHold(box, inner, over > 0);
  const shown = held || back ? text : cut;
  const style = { "--slide-ms": `${String(slideMs(over))}ms`, "--slide-delay": `${String(SLIDE_DELAY_MS)}ms` } as CSSProperties;
  return (
    <span
      ref={box}
      className={cx("b-slide", className)}
      style={style}
      data-over={over > 0 || undefined}
      data-back={back || undefined}
      title={over > 0 && reducedMotion() ? text : undefined}
      aria-label={shown === text ? undefined : text}
      data-testid={testId}
    >
      <span ref={inner} className="b-slide-in" aria-hidden={shown === text ? undefined : true}>
        {shown}
      </span>
    </span>
  );
}

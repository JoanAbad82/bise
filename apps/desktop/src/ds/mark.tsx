// src/ds · bise's ':*' (designer's desktop-delight v2 and bise-presence v10): two round eyes and a
// three-line star, drawn in SVG in currentColor (the caller picks the ink: text-3 in a row), the
// accent when something waits on him. While bise works its star turns (1.6 s); the pointer on it:
// a wink, ';*' for 200 ms, once per hover. Under reduced motion it holds still (css/mark.css).
// One drawing for every place: the sidebar, the rail and the heads at 14 px, the presence
// (capsule, tray, onboarding) at its sizes. Owner: amb-kit.
import { cx } from "./cx";

export interface BiseMarkProps {
  /** something waits on him: the accent */
  waits?: boolean;
  /** bise works: its star turns */
  working?: boolean;
  /** the wink on hover (default on) */
  wink?: boolean;
  /** its box, in px (default 14) */
  size?: number;
  /** its hover tip's words (the TipLayer's data-tip) */
  tip?: string | undefined;
  testId?: string | undefined;
}

/** The star's stroke for a size: thicker as it gets small, so it holds at 14 px (designer v10). Pure. */
export function markStroke(size: number): number {
  if (size <= 16) return 11;
  if (size <= 30) return 9;
  return 7;
}

/** bise's ':*'. */
export function BiseMark({ waits = false, working = false, wink = true, size = 14, tip, testId }: BiseMarkProps) {
  const w = markStroke(size);
  return (
    <span
      className={cx("b-bise", waits && "waits", working && "working", wink && "winks")}
      style={{ width: size, height: size }}
      data-tip={tip === undefined || tip === "" ? undefined : tip}
      data-testid={testId}
      data-waits={waits || undefined}
      data-working={working || undefined}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <g className="b-bise-eyes">
          <rect x="21" y="28.5" width="15" height="15" rx="7.5" />
          <rect x="21" y="58.5" width="15" height="15" rx="7.5" />
          {/* the wink's ';': a comma's tail under the lower eye */}
          <path className="b-bise-wink" d="M33 70 Q32 80 24 85" strokeWidth={w * 0.8} />
        </g>
        <g className="b-bise-star" strokeWidth={w}>
          <line x1="64" y1="39" x2="64" y2="73" />
          <line x1="64" y1="39" x2="64" y2="73" transform="rotate(60 64 56)" />
          <line x1="64" y1="39" x2="64" y2="73" transform="rotate(120 64 56)" />
        </g>
      </svg>
    </span>
  );
}

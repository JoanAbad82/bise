// src/ds · bise's ':*' (designer's desktop-delight v2 and bise-presence v10): two round eyes and a
// star, drawn in SVG from the shared geometry (src/shared/mark.ts) in currentColor (the caller
// picks the ink: text-3 in a row). One drawing for every place: the sidebar, the rail and the
// heads at 14 px, the presence (the capsule at 26 px; the tray draws the same numbers as images).
//   - waits: the star in the accent (the eyes stay ink); `kiss` changing while it waits gives the
//     two kisses, two short beats (1 → 1.25 → 1, 140 ms each, 120 ms apart), once, then still;
//   - working: the star turns in steps, like the terminal's spinner;
//   - listening: the eyes follow his voice like a meter (`level`, 0..1);
//   - speaking: the star beats once per `beat` change (a chunk of the answer);
//   - live (the presence): at rest the eyes blink (4 s) and the star sways ±7° (3 s); not under 16 px;
//   - arms (1b, the star is the team): one branch per running agent, a waiting one's in the accent;
//   - the pointer on it: a wink, ';*' for 200 ms, once per hover.
// Under reduced motion it holds still: the colour and the shapes only (css/mark.css). Owner: amb-kit.
import type { CSSProperties } from "react";
import { ARM, armAngles, EYE_R, EYES, markStroke, PLAIN_ARMS, STAR } from "@/shared/mark";
import { cx } from "./cx";

export { markStroke };

/** One branch of the star (1b): its agent runs, or waits on him. */
export type MarkArm = "run" | "wait";

export interface BiseMarkProps {
  /** something waits on him: the star in the accent */
  waits?: boolean;
  /** the current wait's key: a new one while `waits` plays the two kisses once */
  kiss?: string | number;
  /** bise works: its star turns in steps */
  working?: boolean;
  /** he talks: the eyes follow `level` */
  listening?: boolean;
  /** his voice, 0..1 */
  level?: number;
  /** bise answers: the star beats once each time this changes */
  beat?: number;
  /** the presence: blinks and sways at rest */
  live?: boolean;
  /** the team (1b): one branch per running agent; none, the plain star */
  arms?: readonly MarkArm[];
  /** the wink on hover (default on) */
  wink?: boolean;
  /** its box, in px (default 14) */
  size?: number;
  /** its hover tip's words (the TipLayer's data-tip) */
  tip?: string | undefined;
  testId?: string | undefined;
}

const [CX, CY] = STAR;
const MOTION_MIN = 16;

/** bise's ':*'. */
export function BiseMark({ waits = false, kiss, working = false, listening = false, level = 0, beat, live = false, arms, wink = true, size = 14, tip, testId }: BiseMarkProps) {
  const w = markStroke(size);
  const branches: readonly MarkArm[] = arms !== undefined && arms.length > 0 ? arms : Array.from({ length: PLAIN_ARMS }, () => "run");
  const angles = armAngles(branches.length);
  const lv = listening ? Math.max(0, Math.min(1, level)) : 0;
  const eye = (k: number): CSSProperties | undefined => (listening ? { transform: `scaleY(${String(1 + lv * k)})` } : undefined);
  const moves = size > MOTION_MIN;
  return (
    <span
      className={cx("b-bise", waits && "waits", working && "working", listening && "listening", live && moves && "live", wink && "winks")}
      style={{ width: size, height: size }}
      data-tip={tip === undefined || tip === "" ? undefined : tip}
      data-testid={testId}
      data-waits={waits || undefined}
      data-working={working || undefined}
      data-arms={arms === undefined ? undefined : arms.length}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <g>
          {EYES.map(([x, y], i) => (
            <rect key={i} className="b-bise-eye" x={x - EYE_R} y={y - EYE_R} width={EYE_R * 2} height={EYE_R * 2} rx={EYE_R} style={eye(i === 0 ? 0.9 : 0.7)} />
          ))}
          {/* the wink's ';': a comma's tail under the lower eye */}
          <path className="b-bise-wink" d="M33 70 Q32 80 24 85" strokeWidth={w * 0.8} />
        </g>
        {/* the kiss and the beat restart their one-shot animation on a new key */}
        <g className="b-bise-kiss" key={waits ? `k${String(kiss ?? "")}` : "k"}>
          <g className="b-bise-beat" key={`b${String(beat ?? "")}`}>
            <g className="b-bise-star" strokeWidth={w}>
              {/* the rotation on a group: a branch's own CSS animation (1b's pace) would replace a transform on the line */}
              {angles.map((a, i) => (
                <g key={i} transform={a === 0 ? undefined : `rotate(${String(a)} ${String(CX)} ${String(CY)})`}>
                  <line className={cx("b-bise-arm", `a${String(i % 4)}`, branches[i] === "wait" && "wait")} x1={CX} y1={CY - ARM} x2={CX} y2={CY + ARM} />
                </g>
              ))}
            </g>
          </g>
        </g>
      </svg>
    </span>
  );
}

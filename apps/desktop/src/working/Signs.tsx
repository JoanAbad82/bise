// The working signs as drawn (designer's desktop-working page): Gust (the working row's 5 cells),
// Breath (one cell: right bar rows, the head chip, spotlight rows), MarkBreath (a project's mark
// in the sidebar: the breath at 220 ms, text-2), Pulse (a running tool's '∿',
// a starting agent's '·'). Each draws its cells once, then the window's clock (clock.ts) writes
// their text and tone in place at every change: no React render per frame. Mono, a fixed box
// (5ch or 1ch): nothing around moves. aria-hidden: the words around say what it is.
// Owner: amb-web.
import { useLayoutEffect, useRef } from "react";
import { watchMotion, motionNow } from "./clock";
import {
  type Cell,
  type Motion,
  breathCell,
  gustCells,
  markBreathCell,
  pulseCell,
} from "./gust";
import "./working.css";

function useCells(cells: (m: Motion) => readonly Cell[]): {
  ref: React.RefObject<HTMLSpanElement | null>;
  first: readonly Cell[];
} {
  const ref = useRef<HTMLSpanElement | null>(null);
  // `cells` is one of this file's module constants: the effect runs once per sign
  useLayoutEffect(
    () =>
      watchMotion((m) => {
        const box = ref.current;
        if (box === null) return;
        const now = cells(m);
        box.dataset.still = m.still ? "true" : "false";
        now.forEach((c, i) => {
          const el = box.children[i] as HTMLElement | undefined;
          if (el === undefined) return;
          if (el.textContent !== c.g) el.textContent = c.g;
          if (el.dataset.tone !== c.tone) el.dataset.tone = c.tone;
        });
      }),
    [cells],
  );
  return { ref, first: cells(motionNow()) };
}

function Cells({
  cells,
  size,
  testId,
}: {
  cells: (m: Motion) => readonly Cell[];
  size: "gust" | "one";
  testId?: string | undefined;
}) {
  const { ref, first } = useCells(cells);
  return (
    <span
      ref={ref}
      className={`wk-sign wk-${size}`}
      aria-hidden="true"
      data-testid={testId}
    >
      {first.map((c, i) => (
        <span key={i} data-tone={c.tone}>
          {c.g}
        </span>
      ))}
    </span>
  );
}

const breath = (m: Motion): readonly Cell[] => [breathCell(m)];
const tool = (m: Motion): readonly Cell[] => [pulseCell("tool", m)];
const starting = (m: Motion): readonly Cell[] => [pulseCell("starting", m)];

/** The working row's gust: the TUI's 5 cells, 110 ms a frame (calm while he types). */
export function Gust({ testId }: { testId?: string }) {
  return <Cells cells={gustCells} size="gust" testId={testId} />;
}

/** The 1-cell breath of a working agent (· ~ ∿ ≈ ∿ ~), the hush while he types. */
export function Breath({ testId }: { testId?: string }) {
  return <Cells cells={breath} size="one" testId={testId} />;
}

const markBreath = (m: Motion): readonly Cell[] => [markBreathCell(m)];

/** A project's working mark in the sidebar: the breath at 220 ms a frame, in text-2. */
export function MarkBreath({ testId }: { testId?: string }) {
  return <Cells cells={markBreath} size="one" testId={testId} />;
}

/** A pulse: a running tool's '∿' (ink / text-2) or a starting agent's '·' (text-2 / text-3). */
export function Pulse({
  kind,
  testId,
}: {
  kind: "tool" | "starting";
  testId?: string;
}) {
  return (
    <Cells
      cells={kind === "tool" ? tool : starting}
      size="one"
      testId={testId}
    />
  );
}

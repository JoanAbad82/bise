// Above the composer's box, out of PmField.tsx: the chips' strip, the queue and a one-line note.
import type { JSX } from "react";
import { chipStrip, type Chip } from "../message";

/** Above the box: the chips' strip (`▤ 1 “first words…”  240 lines · 9.8 kB`) and the queue. */
export function Strip({
  chips,
  queued,
  note,
  testId,
}: {
  chips: readonly Chip[];
  queued: readonly string[];
  note: string | null;
  testId: string;
}): JSX.Element {
  return (
    <div className="b-composer-strip" data-testid={`${testId}.strip`}>
      {note !== null && (
        <div className="n" data-testid={`${testId}.note`}>
          {note}
        </div>
      )}
      {queued.map((q, i) => (
        <div
          key={`q${i}`}
          className="q"
          data-testid={`${testId}.queued.${i + 1}`}
        >
          {q}
          <span className="k">queued · sent when this turn ends · ↑ edit</span>
        </div>
      ))}
      {/* an image has no strip line in the window: its chip and thumbnail say it (designer m_13808;
          the TUI keeps its '[Image #1] name' line, it has no thumbnail) */}
      {/* nor a file (file-chips, designer m_21765): its chip has its icon and name, like an image's */}
      {chips
        .filter((c) => c.kind !== "image" && c.kind !== "file")
        .map((c) => (
          <div key={c.n} className="c" data-testid={`${testId}.strip.${c.n}`}>
            {chipStrip(c)}
          </div>
        ))}
    </div>
  );
}

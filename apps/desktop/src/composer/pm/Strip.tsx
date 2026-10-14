// Above the composer's box, out of PmField.tsx: a one-line note (the chips are the attachment list
// inside the box, AttachList.tsx; the queued messages are the screen's drawer, QueueDrawer.tsx).
import type { JSX } from "react";

/** Above the box: a note ('no undo: …', the no-vision line). */
export function Strip({ note, testId }: { note: string; testId: string }): JSX.Element {
  return (
    <div className="b-composer-strip" data-testid={`${testId}.strip`}>
      <div className="n" data-testid={`${testId}.note`}>
        {note}
      </div>
    </div>
  );
}

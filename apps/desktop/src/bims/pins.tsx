// A new project's welcome pins (page new-project-home, pick A; designer m_38070): three numbered
// discs over the office, '1' over the lead's head, '2' on an empty desk (Office.ghosts), '3' on the
// inbox tray of main's desk, each matched by its line in the legend under the office. Ink on the
// page's colour, never the accent (bims law 3: the pills are the only UI colours on the office).
// Placed by hand at each frame (Office.tsx's draw), so they follow a pinch. Owner: project-home.
import type { OfficeRenderer } from './model';

/** px over the lead's head the '1' sits (its disc's middle) */
const OVER_HEAD = 6;
/** px over a floor point the '2' and '3' sit (on the piece, not under it) */
const OVER_FLOOR = 10;
/** the most ghost desks a welcome asks about (bims/ghosts.ts WELCOME_GHOSTS) */
const GHOSTS_MAX = 8;

export type PinPoint = { readonly x: number; readonly y: number } | null;

/** Where the three pins go now, css px from the canvas's top left; null: off view. Pure but for the renderer's reads. */
export function pinPoints(r: Pick<OfficeRenderer, 'headOf' | 'pointOf'>, lead: string | null): readonly [PinPoint, PinPoint, PinPoint] {
  const head = lead === null ? null : r.headOf(lead);
  // the empty desk nearest the camera (the lowest on the canvas)
  let desk: PinPoint = null;
  for (let i = 0; i < GHOSTS_MAX; i++) {
    const p = r.pointOf({ ghost: i });
    if (p !== null && (desk === null || p.y > desk.y)) desk = p;
  }
  const tray = r.pointOf('tray');
  return [
    head === null ? null : { x: head.x, y: head.y - OVER_HEAD },
    desk === null ? null : { x: desk.x, y: desk.y - OVER_FLOOR },
    // on the tray itself: main's desk carries it, the '1' sits higher over the lead's head
    tray === null ? null : { x: tray.x, y: tray.y },
  ];
}

/** the pins' elements to their points (hidden off view) */
export function placePins(box: HTMLElement, at: readonly PinPoint[]): void {
  box.querySelectorAll<HTMLElement>('[data-pin]').forEach((el, i) => {
    const p = at[i] ?? null;
    el.style.visibility = p === null ? 'hidden' : '';
    if (p !== null) el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, -50%)`;
  });
}

/** the three discs, placed by placePins */
export function Pins({ boxRef }: { boxRef: (el: HTMLDivElement | null) => void }) {
  return (
    <div ref={boxRef} className="bims-pins" aria-hidden="true" data-testid="welcome.pins">
      {[1, 2, 3].map((n) => (
        <span key={n} className="bims-pin" data-pin={n} style={{ visibility: 'hidden' }}>
          {n}
        </span>
      ))}
    </div>
  );
}

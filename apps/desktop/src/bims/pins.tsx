// A new project's welcome pins (page new-project-home, pick A; designer m_38070): three numbered
// discs over the office, '1' over the lead's head, '2' on an empty desk (Office.ghosts), '3' on the
// inbox tray of main's desk, each matched by its line in the legend under the office. Ink on the
// page's colour, never the accent (bims law 3: the pills are the only UI colours on the office).
// Placed by hand at each frame (Office.tsx's draw), so they follow a pinch; drawn over the bims'
// pills, and lifted 4 px clear of one they'd sit on (liftPins, designer m_38798). Owner: project-home.
import type { OfficeRenderer } from './model';

/** px over the lead's head the '1' sits (its disc's middle) */
const OVER_HEAD = 6;
/** px over a floor point the '2' and '3' sit (on the piece, not under it) */
const OVER_FLOOR = 10;
/** px over the inbox's top tray the '3' sits: one pin's height, so the stand shows (bims m_38246) */
const OVER_TRAY = 18;
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
    // over the top tray, as the '1' over the head
    tray === null ? null : { x: tray.x, y: tray.y - OVER_TRAY },
  ];
}

/** a pin's disc (office.css .bims-pin), and how clear of a pill it stops (tags.ts TAG_INSET) */
const PIN = 18;
const CLEAR = 4;

export interface PillBox {
  readonly left: number;
  readonly top: number;
  readonly w: number;
  readonly h: number;
}

/**
 * The pins drawn over the bims' pills (designer m_38798: the lead's '?' hid its '1'): a pin that
 * meets a pill lifts to stop 4 px above it, as a pill stops above the map chip. Pure.
 */
export function liftPins(at: readonly PinPoint[], pills: readonly PillBox[]): PinPoint[] {
  return at.map((p) => {
    if (p === null) return null;
    let y = p.y;
    // a lift can meet a pill placed above the first: try each in turn, highest last
    for (const k of [...pills].sort((a, b) => b.top - a.top)) {
      const meets = p.x - PIN / 2 < k.left + k.w && k.left < p.x + PIN / 2 && y - PIN / 2 < k.top + k.h && k.top < y + PIN / 2;
      if (meets) y = k.top - CLEAR - PIN / 2;
    }
    return y === p.y ? p : { x: p.x, y };
  });
}

/** the bims' '?' / '✗' pills in the office's overlay, css px from its top left */
function pillsIn(box: HTMLElement): PillBox[] {
  const overlay = box.parentElement;
  if (overlay === null) return [];
  const o = overlay.getBoundingClientRect();
  return [...overlay.querySelectorAll<HTMLElement>('.bims-tag [data-pill]')].map((el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left - o.left, top: r.top - o.top, w: r.width, h: r.height };
  });
}

/** the pins' elements to their points (hidden off view), lifted over the pills they'd sit under */
export function placePins(box: HTMLElement, points: readonly PinPoint[]): void {
  const at = liftPins(points, pillsIn(box));
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

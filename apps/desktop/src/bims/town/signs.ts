// Where each office's sign goes (bims m_30199: « like map labels »): every sign tries four spots
// round its office's anchor (above, right, below, left) and takes the first that is free and inside
// the town; at the town's fit a sign with no free spot drops to its pills alone (its name comes
// back on hover or zoomed in); a sign with pills never drops (its pills go above, overlap or not);
// one without pills and no room is left out. Pure, no DOM. Owner: maps-e.

export interface SignIn {
  readonly id: string;
  /** the anchor: over its office's back wall, css px */
  readonly x: number;
  readonly y: number;
  /** the whole sign's size, and its pills' alone (0: no pill) */
  readonly w: number;
  readonly h: number;
  readonly pillW: number;
  readonly pillH: number;
  /** placed first: the hovered or dived one 0, with pills 1, the others 2 */
  readonly rank: number;
}

export interface SignAt {
  readonly left: number;
  readonly top: number;
  /** its pills alone (no room for its name at the fit) */
  readonly compact: boolean;
}

interface Box {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

/** the room kept between a sign and its anchor, and between two signs */
const GAP = 4;

/** the four spots round the anchor, in order: above, right, below, left */
function spots(s: SignIn, w: number, h: number): Box[] {
  return [
    { x0: s.x - w / 2, y0: s.y - h - GAP, x1: s.x + w / 2, y1: s.y - GAP },
    { x0: s.x + GAP * 2, y0: s.y - h / 2, x1: s.x + GAP * 2 + w, y1: s.y + h / 2 },
    { x0: s.x - w / 2, y0: s.y + GAP, x1: s.x + w / 2, y1: s.y + GAP + h },
    { x0: s.x - GAP * 2 - w, y0: s.y - h / 2, x1: s.x - GAP * 2, y1: s.y + h / 2 },
  ];
}

const meets = (a: Box, b: Box): boolean => a.x0 < b.x1 + GAP && b.x0 < a.x1 + GAP && a.y0 < b.y1 + GAP && b.y0 < a.y1 + GAP;

/**
 * Every sign's place in a W × H town. `fit`: the whole town shows (a sign with no room keeps its
 * pills alone); zoomed in, a sign with no free spot goes above its anchor anyway. Pure.
 */
export function placeSigns(ins: readonly SignIn[], W: number, H: number, fit: boolean): ReadonlyMap<string, SignAt> {
  const taken: Box[] = [];
  const out = new Map<string, SignAt>();
  const inside = (b: Box): boolean => b.x0 >= 0 && b.y0 >= 0 && b.x1 <= W && b.y1 <= H;
  const free = (b: Box): boolean => inside(b) && !taken.some((t) => meets(t, b));
  const take = (id: string, b: Box, compact: boolean): void => {
    taken.push(b);
    out.set(id, { left: b.x0, top: b.y0, compact });
  };
  const order = [...ins].sort((a, b) => a.rank - b.rank || a.y - b.y || a.x - b.x);
  for (const s of order) {
    const whole = spots(s, s.w, s.h).find(free);
    if (whole !== undefined) {
      take(s.id, whole, false);
      continue;
    }
    if (!fit) {
      // zoomed in: its name shows, above its office, as the office's own labels do
      const above = spots(s, s.w, s.h)[0];
      if (above !== undefined) take(s.id, above, false);
      continue;
    }
    if (s.pillW <= 0) continue;
    const small = spots(s, s.pillW, s.pillH);
    const pill = small.find(free) ?? small[0];
    if (pill !== undefined) take(s.id, pill, true);
  }
  return out;
}

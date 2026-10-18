// Where each office's sign goes (bims m_30199: « like map labels »; m_31373: no mark over another,
// none without its name). The live bims' labels are placed first and win (Town.tsx gives their
// boxes). Then every sign, in rank, tries spots round its office's anchor (above, right, below,
// left; a live office's only above its back wall, where its bims are not), each also slid back
// inside the seen area if it passes an edge by less than half its width; first whole, then compact (its
// name and its pills, without ∿ n). A sign with no free spot hides whole: never over another mark,
// never a bare pill, never a cut name. Pure, no DOM. Owner: maps-e.

export interface SignIn {
  readonly id: string;
  /** the anchor: over its office's back wall, css px */
  readonly x: number;
  readonly y: number;
  /** the whole sign's size, and its compact one's width (its name and pills: no ∿ n) */
  readonly w: number;
  readonly h: number;
  readonly compactW: number;
  /** its office is posed live (its bims walk under the anchor): the sign goes above it only */
  readonly live: boolean;
  /** placed first: the hovered or dived one 0, with pills 1, the others 2 */
  readonly rank: number;
}

export interface SignAt {
  readonly left: number;
  readonly top: number;
  /** its name and pills alone (no room for the whole sign) */
  readonly compact: boolean;
}

/** a mark's box, css px: the signs' and the bims' labels' (taken before the signs) */
export interface Box {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

/** the room kept between a sign and its anchor, and between two signs */
const GAP = 4;

/** a live office's sign: above its back wall, one and two sign heights higher if its bims' labels are there */
const LIVE_STEPS = 3;

/** the spots round the anchor, in order: above, right, below, left; a live office's: above, higher, higher */
function spots(s: SignIn, w: number, h: number): Box[] {
  const above = (k: number): Box => ({ x0: s.x - w / 2, y0: s.y - h - GAP - k * (h + GAP), x1: s.x + w / 2, y1: s.y - GAP - k * (h + GAP) });
  if (s.live) return Array.from({ length: LIVE_STEPS }, (_, k) => above(k));
  return [
    above(0),
    { x0: s.x + GAP * 2, y0: s.y - h / 2, x1: s.x + GAP * 2 + w, y1: s.y + h / 2 },
    { x0: s.x - w / 2, y0: s.y + GAP, x1: s.x + w / 2, y1: s.y + GAP + h },
    { x0: s.x - GAP * 2 - w, y0: s.y - h / 2, x1: s.x - GAP * 2, y1: s.y + h / 2 },
  ];
}

/** a spot past the seen area's left or right edge slid back inside, if by less than half its width (it still reads as its office's) */
function slid(b: Box, area: Box): Box | null {
  const w = b.x1 - b.x0;
  const dx = b.x0 < area.x0 ? area.x0 - b.x0 : b.x1 > area.x1 ? area.x1 - b.x1 : 0;
  if (dx === 0 || Math.abs(dx) >= w / 2 || w > area.x1 - area.x0) return null;
  return { ...b, x0: b.x0 + dx, x1: b.x1 + dx };
}

const meets = (a: Box, b: Box): boolean => a.x0 < b.x1 + GAP && b.x0 < a.x1 + GAP && a.y0 < b.y1 + GAP && b.y0 < a.y1 + GAP;

/**
 * Every sign's place inside `area` (the part of the town seen: Town.tsx takes off what the bar clips
 * or covers), round the marks `taken` already (the live bims' labels: they win). A sign missing
 * from the result hides whole. Pure.
 */
export function placeSigns(ins: readonly SignIn[], area: Box, taken: readonly Box[] = []): ReadonlyMap<string, SignAt> {
  const marks: Box[] = [...taken];
  const out = new Map<string, SignAt>();
  const inside = (b: Box): boolean => b.x0 >= area.x0 && b.y0 >= area.y0 && b.x1 <= area.x1 && b.y1 <= area.y1;
  const free = (b: Box): boolean => inside(b) && !marks.some((t) => meets(t, b));
  const find = (s: SignIn, w: number): Box | undefined => {
    for (const b of spots(s, w, s.h)) {
      const at = inside(b) ? b : slid(b, area);
      if (at !== null && free(at)) return at;
    }
    return undefined;
  };
  const order = [...ins].sort((a, b) => a.rank - b.rank || a.y - b.y || a.x - b.x);
  for (const s of order) {
    const whole = find(s, s.w);
    const compact = whole === undefined && s.compactW > 0 && s.compactW < s.w ? find(s, s.compactW) : undefined;
    const b = whole ?? compact;
    if (b === undefined) continue;
    marks.push(b);
    out.set(s.id, { left: b.x0, top: b.y0, compact: whole === undefined });
  }
  return out;
}

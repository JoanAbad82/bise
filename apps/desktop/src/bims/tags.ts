// Where the office's tags go (designer via bims-qa m_27793): each over its bim's head, held inside
// the office; tags never overlap. A '?' / '✗' pill alone never moves and is placed first (it is
// what needs him); a label that meets one placed before moves up one label height, then down, and
// gets a 1 px leader to its bim; when two moves don't find room, the office lists every tag in a
// column at its left edge instead, each with its leader. The cut of a long line is here too: whole
// words, one glued '…'. Pure: sizes in css px come in, positions go out. Owner: bims-lead.

/** One tag to place: its bim's head (x, y: the tag's bottom sits there), its measured size. */
export interface TagIn {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** a pill alone (no line): placed first, never moved */
  readonly pill: boolean;
}

/** Where a tag goes: its top left, and whether it was moved off its bim (a leader then joins them). */
export interface TagOut {
  readonly left: number;
  readonly top: number;
  readonly lead: boolean;
}

/** px kept between a tag and the office's edges */
export const TAG_INSET = 4;
/** px between two tags of the column */
const GAP = 2;

/** A tag's left edge: centred on the head at x, held TAG_INSET px inside a box `box` px wide. */
export function tagLeft(x: number, w: number, box: number): number {
  const left = x - w / 2;
  if (box <= 0) return left;
  return Math.max(TAG_INSET, Math.min(left, box - TAG_INSET - w));
}

interface Rect {
  readonly left: number;
  readonly top: number;
  readonly w: number;
  readonly h: number;
}
const meets = (a: Rect, b: Rect): boolean => a.left < b.left + b.w && b.left < a.left + a.w && a.top < b.top + b.h && b.top < a.top + a.h;

/**
 * Every tag's place in a box `boxW` × `boxH`: in the order given (the caller gives the newest and
 * the hovered first), pills alone before the rest. `column` true: the column fallback was taken.
 */
export function placeTags(tags: readonly TagIn[], boxW: number, boxH: number): { readonly at: ReadonlyMap<string, TagOut>; readonly column: boolean } {
  const order = [...tags.filter((t) => t.pill), ...tags.filter((t) => !t.pill)];
  const placed: Rect[] = [];
  const at = new Map<string, TagOut>();
  const inside = (r: Rect) => boxH <= 0 || (r.top >= 0 && r.top + r.h <= boxH);
  for (const t of order) {
    const left = tagLeft(t.x, t.w, boxW);
    const home = { left, top: t.y - t.h, w: t.w, h: t.h };
    const tries = t.pill ? [home] : [home, { ...home, top: home.top - t.h }, { ...home, top: home.top + t.h }];
    const ok = tries.find((r, i) => (i === 0 || inside(r)) && !placed.some((p) => meets(p, r)));
    if (ok === undefined) {
      if (t.pill) {
        placed.push(home);
        at.set(t.name, { left: home.left, top: home.top, lead: false });
        continue;
      }
      return { at: column(order), column: true };
    }
    placed.push(ok);
    at.set(t.name, { left: ok.left, top: ok.top, lead: ok !== home });
  }
  return { at, column: false };
}

/** The fallback: every tag in a column at the office's left edge, in order, each with its leader. */
function column(order: readonly TagIn[]): ReadonlyMap<string, TagOut> {
  const at = new Map<string, TagOut>();
  let top = TAG_INSET;
  for (const t of order) {
    at.set(t.name, { left: TAG_INSET, top, lead: true });
    top += t.h + GAP;
  }
  return at;
}

/**
 * A line cut to `max` px: whole words, then one glued '…' ('no access to the…', never ' …' nor a
 * word cut mid-way); a first word longer than the room is cut by characters. `width` measures a
 * string in the tag's font.
 */
export function cutWords(text: string, max: number, width: (s: string) => number): string {
  if (max <= 0 || width(text) <= max) return text;
  const words = text.split(' ');
  for (let n = words.length - 1; n > 0; n--) {
    const s = `${words.slice(0, n).join(' ').replace(/[\s·,:;-]+$/u, '')}…`;
    if (width(s) <= max) return s;
  }
  let s = words[0] ?? '';
  while (s.length > 1 && width(`${s}…`) > max) s = s.slice(0, -1);
  return `${s}…`;
}

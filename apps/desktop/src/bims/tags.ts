// Where the office's tags go (designer m_27793, m_27799): each over its bim's head, inside the
// office; tags never overlap. A '?' / '✗' pill alone never moves (but stays inside) and is placed
// first: it is what needs him. Then the labels in their rank (the hovered one, then bims with a
// pill, then working ones, then the quiet ones): one that meets a tag placed before tries up one
// label height, down one, up two, down two, half its width left and right, with a 1 px leader to
// its bim once moved; one that still finds no room is left out and counted (the office says
// '+N names · hover a bim'), so it is a quiet bim that drops, never one that waits on him. The cut
// of a long line is here too: whole words, one glued '…'. Pure: sizes in css px in, positions
// out. Owner: bims-lead.

/** One tag to place: its bim's head (x, y: the tag's bottom sits there), its measured size. */
export interface TagIn {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** a pill alone (no line): placed first, never moved */
  readonly pill: boolean;
  /** its place in line for room, lower first (Office.tsx tagRank) */
  readonly rank: number;
}

/** Where a tag goes: its top left, and whether it was moved off its bim (a leader then joins them). */
export interface TagOut {
  readonly left: number;
  readonly top: number;
  readonly lead: boolean;
}

/** px kept between a tag and the office's edges */
export const TAG_INSET = 4;
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
 * Every tag's place in a box `boxW` × `boxH`: pills alone first, then the rest by rank (the given
 * order among equals). `left`: how many labels found no room (they are not in `at`).
 */
export function placeTags(tags: readonly TagIn[], boxW: number, boxH: number): { readonly at: ReadonlyMap<string, TagOut>; readonly left: number } {
  const byRank = [...tags].sort((a, b) => a.rank - b.rank);
  const order = [...byRank.filter((t) => t.pill), ...byRank.filter((t) => !t.pill)];
  const placed: Rect[] = [];
  const at = new Map<string, TagOut>();
  let left = 0;
  const inside = (r: Rect) => boxH <= 0 || (r.top >= 0 && r.top + r.h <= boxH);
  for (const t of order) {
    const x = tagLeft(t.x, t.w, boxW);
    const home = { left: x, top: t.y - t.h, w: t.w, h: t.h };
    if (t.pill) {
      // never moved off its bim, but never out of the office either
      const top = boxH <= 0 ? home.top : Math.max(TAG_INSET, Math.min(home.top, boxH - TAG_INSET - t.h));
      placed.push({ ...home, top });
      at.set(t.name, { left: x, top, lead: false });
      continue;
    }
    const side = (dx: number) => ({ ...home, left: tagLeft(t.x + dx, t.w, boxW) });
    const tries = [home, ...[-1, 1, -2, 2].map((k) => ({ ...home, top: home.top + k * t.h })), side(-t.w / 2), side(t.w / 2)];
    const ok = tries.find((r) => inside(r) && !placed.some((p) => meets(p, r)));
    if (ok === undefined) {
      left++;
      continue;
    }
    placed.push(ok);
    at.set(t.name, { left: ok.left, top: ok.top, lead: ok.top !== home.top || Math.abs(ok.left - home.left) > 0.5 });
  }
  return { at, left };
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

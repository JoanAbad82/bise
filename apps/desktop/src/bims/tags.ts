// Where the office's tags go (designer m_27793, m_27799): each over its bim's head, inside the
// office; tags never overlap (bims m_31446). A '?' / '✗' pill alone is placed first and never
// yields to a name: it is what needs him; it stays inside, and one that meets a pill placed before
// (two bims side by side) steps aside, beside it, up or down, with its leader (never hidden). Then
// the labels in their rank (the hovered one, then bims with a
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
/** px between two pills that met (one stepped aside) */
const PILL_GAP = 2;
/** A tag's left edge: centred on the head at x, held TAG_INSET px inside a box `box` px wide. */
export function tagLeft(x: number, w: number, box: number): number {
  const left = x - w / 2;
  if (box <= 0) return left;
  return Math.max(TAG_INSET, Math.min(left, box - TAG_INSET - w));
}

/** A rect no tag draws under (the office's corner chips: the map, '⤢ fit'), css px in the office. */
export type KeepRect = Rect;

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
export function placeTags(tags: readonly TagIn[], boxW: number, boxH: number, keep: readonly KeepRect[] = []): { readonly at: ReadonlyMap<string, TagOut>; readonly left: number } {
  const byRank = [...tags].sort((a, b) => a.rank - b.rank);
  const order = [...byRank.filter((t) => t.pill), ...byRank.filter((t) => !t.pill)];
  // the corner chips are placed first: a label meets them as it meets a tag
  const placed: Rect[] = [...keep];
  // a pill that meets a chip slides along its edge past it, toward the office's middle
  const past = (r: Rect): Rect => {
    const k = keep.find((c) => meets(c, r));
    if (k === undefined) return r;
    const right = k.left + k.w / 2 < boxW / 2;
    return { ...r, left: right ? k.left + k.w + PILL_GAP : k.left - r.w - PILL_GAP };
  };
  const at = new Map<string, TagOut>();
  let left = 0;
  const inside = (r: Rect) => boxH <= 0 || (r.top >= 0 && r.top + r.h <= boxH);
  for (const t of order) {
    const x = tagLeft(t.x, t.w, boxW);
    const home = { left: x, top: t.y - t.h, w: t.w, h: t.h };
    if (t.pill) {
      // over its bim, never out of the office, never hidden; a name never moves it, but one that meets
      // a pill placed before (two bims side by side) steps aside: beside it, then up, then down
      const clamp = (top: number): number => (boxH <= 0 ? top : Math.max(TAG_INSET, Math.min(top, boxH - TAG_INSET - t.h)));
      const own = { ...home, top: clamp(home.top) };
      const by = (dx: number, dy: number): Rect => ({ ...own, left: tagLeft(t.x + dx, t.w, boxW), top: clamp(own.top + dy) });
      const tries = [own, by(t.w + PILL_GAP, 0), by(-t.w - PILL_GAP, 0), by(0, -t.h - PILL_GAP), by(0, t.h + PILL_GAP), by(t.w + PILL_GAP, -t.h - PILL_GAP), by(-t.w - PILL_GAP, -t.h - PILL_GAP)];
      // each try first slid past a chip it would sit under (an edge pill near a bottom corner)
      const ok = tries.map(past).find((r) => !placed.some((p) => meets(p, r))) ?? past(own);
      placed.push(ok);
      at.set(t.name, { left: ok.left, top: ok.top, lead: ok !== own });
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
 * A text on at most `lines` lines of `max` px (the hover card's title): words wrapped whole, the
 * last line cut as cutWords does (one glued '…') when the text needs more. A word longer than a
 * line is cut on its own line. Pure.
 */
export function cutLines(text: string, max: number, lines: number, width: (s: string) => number): string[] {
  const words = text.split(' ').filter((w) => w !== '');
  if (words.length === 0) return [];
  if (max <= 0) return [words.join(' ')];
  const out: string[] = [];
  let i = 0;
  while (i < words.length && out.length < lines - 1) {
    let line = words[i] ?? '';
    i++;
    while (i < words.length && width(`${line} ${words[i] ?? ''}`) <= max) line = `${line} ${words[i++] ?? ''}`;
    out.push(width(line) <= max ? line : cutWords(line, max, width));
  }
  if (i < words.length) out.push(cutWords(words.slice(i).join(' '), max, width));
  return out;
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

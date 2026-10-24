// A bim's question in a comic bubble over its head (Gabriel via main m_39500: « une petite bulle un
// peu style BD au-dessus de la tête […] jusqu'à ce qu'il obtienne une réponse »), as well as its
// line in the feed: from the feed's '? checkout · words' line until its answer is in the bim's hands
// (his plane's catch), else until the line stops waiting. It sits over the bim's '?' pill (or its
// head), never on its face or its pill: over it, else beside it, its tail to the bim. Pure: askAt
// (when, which words, its pop), askBox (where); overlay.ts draws it. Owner: hero-town.
import { FEED, KILN, NOTES } from './cast';

/** the pop in, s (a little overshoot), and the pop out once answered, s */
export const ASK_IN_S = 0.25;
export const ASK_OUT_S = 0.2;

export interface Ask {
  readonly office: string;
  readonly bim: string;
  readonly words: string;
  /** its size, 0..1 (the pop in and out) */
  readonly scale: number;
}

/** when an ask line's bim has its answer: his plane to it caught, else the line answered. Pure. */
export function heardAt(l: (typeof FEED)[number] & { readonly who: 'ask' }): number {
  const plane = NOTES.find((n) => n.from === 'you' && n.to === l.bim && n.at >= l.at && n.flight !== undefined);
  return plane?.flight !== undefined ? plane.at + plane.flight.dur : l.until;
}

/** the back-out ease of the pop in: 0 -> ~1.08 -> 1 */
const backOut = (x: number): number => {
  const c = 1.7;
  const u = x - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};

/** the question a bim asks at film time T (one at a time), null none. Pure. */
export function askAt(T: number): Ask | null {
  for (const l of FEED) {
    if (l.who !== 'ask' || T < l.at) continue;
    // gone on the catch: the pop out ends there, so the catch reads as 'answered' (designer m_39582)
    const end = heardAt(l);
    if (T >= end) continue;
    const scale = Math.min(backOut(Math.min(1, (T - l.at) / ASK_IN_S)), (end - T) / ASK_OUT_S);
    return { office: KILN, bim: l.bim, words: l.words, scale };
  }
  return null;
}

/** px between the bubble's tail and what it sits over, and kept from the frame's edges */
export const ASK_GAP = 3;
export const ASK_INSET = 4;
/** the tail's length, px (its tip is ASK_GAP over the pill), and how far from a corner it stays */
export const ASK_TAIL = 7;
const TAIL_MIN = 12;

/** where the bubble goes: its top left, and its tail's x from its left (its tip points to the bim) */
export interface AskBox {
  readonly left: number;
  readonly top: number;
  readonly tail: number;
  /** beside the pill, not over it (no room over): its tail points down to that side */
  readonly side: 'over' | 'right' | 'left';
}

/**
 * The bubble's place for a bim whose head is at `head` (its top: the face is under it) under its tag
 * `tag` (its '?' pill, the rect placeTags gave it; null: no tag, the head alone), the bubble `w` × `h`
 * with its tail, in a frame `boxW` × `boxH`. Over the tag, centred on the head, held inside the frame;
 * no room over it: beside the tag, its bottom at the head's top, so neither the face nor the pill is
 * ever under it. Pure.
 */
export function askBox(head: { x: number; y: number }, tag: { left: number; top: number; w: number; h: number } | null, w: number, h: number, boxW: number, boxH: number): AskBox {
  const under = tag === null ? head.y : Math.min(head.y, tag.top);
  const clampX = (l: number): number => Math.max(ASK_INSET, Math.min(l, boxW - ASK_INSET - w));
  const tailOf = (left: number): number => Math.max(TAIL_MIN, Math.min(w - TAIL_MIN, head.x - left));
  const top = under - ASK_GAP - h;
  if (top >= ASK_INSET || boxH <= 0) {
    const left = clampX(head.x - w / 2);
    return { left, top, tail: tailOf(left), side: 'over' };
  }
  // beside: the tag's own row, from the head's top up, on the side with more room
  const r = tag === null ? { left: head.x, w: 0 } : tag;
  const sideTop = Math.max(ASK_INSET, head.y - h);
  const right = r.left + r.w + ASK_GAP;
  const leftSide = r.left - ASK_GAP - w;
  const roomRight = boxW - ASK_INSET - (right + w);
  const roomLeft = leftSide - ASK_INSET;
  // neither side has room (a narrow frame, the bim at its top middle): the side with more, held inside
  if (roomRight >= 0 || (roomLeft < 0 && roomRight >= roomLeft)) return { left: clampX(right), top: sideTop, tail: TAIL_MIN, side: 'right' };
  return { left: clampX(leftSide), top: sideTop, tail: w - TAIL_MIN, side: 'left' };
}

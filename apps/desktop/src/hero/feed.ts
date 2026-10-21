// The hero film's feed (bims-film v13, designer m_31640): the app's composer, small, bottom-right of
// the town: his lines to bise (typed in its field, held there to be read, then sent: a bubble that
// stays), bise's replies, and bise's waiting lines ('? checkout · words', the answer's field or its
// numbered choices), the last FEED_ROWS of them; each of his lines takes its ✓ when its crate is in.
// The field's send button (Gabriel via main m_36299): as he sends, it presses and folds into his paper
// plane (fold.ts), and that plane is the 3D one from the next frame on (film.ts sendButton, drawn
// over the page: TownOpts.planesOver); a new button comes back after. Empty again at the fold.
// feedAt is pure (tested); makeFeed draws it. Owner: hero-town.
import { FEED, NOTES, PAGE, type Line } from './cast';
import { foldShape, type Launch } from './fold';

/** the lines shown at once (designer: 3-4 lines) */
export const FEED_ROWS = 4;
/** typing: s per character, at most TYPE_MAX_S a line (bims-film v9: 1.2 s for the first) */
const TYPE_S = 0.03;
const TYPE_MAX_S = 1.2;
/** the send: the button presses and folds into the plane over SEND_S before it leaves, s */
export const SEND_S = 0.35;
/** a new send button comes back this long after the plane left, s */
const BACK_S = 0.3;

export interface FeedRow {
  readonly key: string;
  readonly who: 'you' | 'bise' | 'ask';
  readonly words: string;
  /** a waiting line's bim ('? checkout · words') while it waits */
  readonly asks: string | null;
  readonly choices: readonly string[];
  /** the picked choice (1-based), 0 none yet */
  readonly picked: number;
  readonly ticked: boolean;
}

export interface FeedState {
  readonly rows: readonly FeedRow[];
  /** what his field shows: his line being typed or held to be read, else its placeholder */
  readonly typing: string;
  readonly placeholder: string;
  /** the send button: its fold into the plane (0..1, null not folding), its fade back in (0..1, null shown whole) */
  readonly send: { readonly fold: number | null; readonly back: number | null };
}

/** when his line is sent: SEND_S before its plane leaves (the button's fold) */
export const sentAt = (l: Extract<Line, { who: 'you' }>): number => (l.plane === undefined ? l.at + Math.min(TYPE_MAX_S, l.words.length * TYPE_S) : l.plane - SEND_S);
/** when his line is typed: TYPE_S a character, at most TYPE_MAX_S, never past its send */
const typeEnd = (l: Extract<Line, { who: 'you' }>): number => Math.min(l.at + Math.min(TYPE_MAX_S, l.words.length * TYPE_S), sentAt(l));

/** the send button at T: folding over SEND_S before each of his planes leaves, back in BACK_S after. Pure. */
function sendAt(T: number): FeedState['send'] {
  for (const n of NOTES) {
    if (n.from !== 'you' || n.flight === undefined) continue;
    if (T >= n.at - SEND_S && T < n.at) return { fold: (T - (n.at - SEND_S)) / SEND_S, back: null };
    const b = (T - n.at) / BACK_S;
    if (b >= 0 && b < 1) return { fold: null, back: b };
  }
  return { fold: null, back: null };
}

/** The feed at film time T. Pure. */
export function feedAt(T: number): FeedState {
  if (T >= PAGE.fold) return { rows: [], typing: '', placeholder: 'to bise', send: { fold: null, back: null } };
  const rows: FeedRow[] = [];
  let typing = '';
  let placeholder = 'to bise';
  FEED.forEach((l, i) => {
    if (T < l.at) return;
    const key = `l${i}`;
    if (l.who === 'you') {
      const end = typeEnd(l);
      // typed, then held whole in the field until he sends it (Gabriel: « pas assez de temps pour lire »)
      if (T < sentAt(l)) {
        typing = T < end ? l.words.slice(0, Math.ceil(((T - l.at) / Math.max(1e-6, end - l.at)) * l.words.length)) : l.words;
        return;
      }
      rows.push({ key, who: 'you', words: l.words, asks: null, choices: [], picked: 0, ticked: l.tick !== undefined && T >= l.tick });
      return;
    }
    if (l.who === 'bise') {
      rows.push({ key, who: 'bise', words: l.words, asks: null, choices: [], picked: 0, ticked: l.tick !== undefined && T >= l.tick });
      return;
    }
    const waiting = T < l.until;
    if (waiting && l.field !== undefined) placeholder = l.field;
    const picked = l.pick !== undefined && T >= l.pick.at ? l.pick.n : 0;
    rows.push({ key, who: 'ask', words: l.words, asks: waiting ? l.bim : null, choices: waiting ? (l.choices ?? []) : [], picked, ticked: false });
  });
  return { rows: rows.slice(-FEED_ROWS), typing, placeholder, send: sendAt(T) };
}

export interface Feed {
  /** its panel (the film fades it in and out with the build) */
  readonly root: HTMLElement;
  /** its send button (film.ts: where the 3D plane leaves) */
  readonly sendButton: HTMLElement;
  /** the feed at film time T; `launch`: the 3D plane the button folds into (its length and heading), null not known */
  draw(T: number, launch?: (rect: DOMRect) => Launch | null): void;
  dispose(): void;
}

const SVG = 'http://www.w3.org/2000/svg';
/** the send button's arrow (a small paper-plane arrow, pointing right) */
const ARROW = 'M3 10 L17 4 L12 16 L10 11 Z';

/** the arrow's box in the button, css px (ARROW drawn at +4, +4): what lifts and folds into the dart */
const GLYPH = { x: 7, y: 8, w: 14, h: 12 } as const;
/** ARROW's own corners in GLYPH (tail's left tip, nose, tail's right tip, notch): the fold starts as the arrow, never a box */
const ARROW_PTS: readonly (readonly [number, number])[] = [
  [0, 6],
  [14, 0],
  [9, 12],
  [7, 7],
];

/**
 * the button's arrow folding into the dart (fold.ts; bims m_36638): white paper with its ink edge
 * from the first frame, lifting off the button (which stays a button), its polygon and crease in its svg
 */
function drawFold(svg: SVGSVGElement, f: number, l: Launch | null): void {
  const poly = svg.querySelector('polygon');
  const line = svg.querySelector('line');
  if (l === null) return;
  const shape = foldShape(f, GLYPH.w, GLYPH.h, l, ARROW_PTS);
  const at = ([x, y]: readonly [number, number]): string => `${(x + GLYPH.x).toFixed(1)},${(y + GLYPH.y).toFixed(1)}`;
  poly?.setAttribute('points', shape.points.map(at).join(' '));
  line?.setAttribute('x1', (shape.spine.a[0] + GLYPH.x).toFixed(1));
  line?.setAttribute('y1', (shape.spine.a[1] + GLYPH.y).toFixed(1));
  line?.setAttribute('x2', (shape.spine.b[0] + GLYPH.x).toFixed(1));
  line?.setAttribute('y2', (shape.spine.b[1] + GLYPH.y).toFixed(1));
  line?.style.setProperty('opacity', shape.spine.alpha.toFixed(3));
}

/** The feed's DOM in the hero's box (compact on a phone: hero.css). */
export function makeFeed(box: HTMLElement): Feed {
  const root = document.createElement('div');
  root.className = 'bh-feed';
  root.setAttribute('aria-hidden', 'true');
  const list = document.createElement('div');
  list.className = 'bh-feed-rows';
  const input = document.createElement('div');
  input.className = 'bh-feed-input';
  const field = document.createElement('div');
  field.className = 'bh-feed-field';
  // the send button: its arrow, and the paper it folds into (fold.ts) over it
  const send = document.createElement('div');
  send.className = 'bh-feed-send';
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'bh-send-svg');
  const arrow = document.createElementNS(SVG, 'path');
  arrow.setAttribute('d', ARROW);
  arrow.setAttribute('class', 'bh-send-arrow');
  svg.append(document.createElementNS(SVG, 'polygon'), document.createElementNS(SVG, 'line'), arrow);
  send.append(svg);
  input.append(field, send);
  root.append(list, input);
  box.append(root);
  const els = new Map<string, HTMLDivElement>();
  let last = '';

  return {
    root,
    sendButton: send,
    draw(T, launch) {
      const s = feedAt(T);
      // the button: pressed and folding, gone while its plane leaves, back in after
      const fold = s.send.fold;
      send.className = `bh-feed-send${fold !== null ? ' folding' : ''}${s.send.back !== null ? ' back' : ''}`;
      send.style.setProperty('--back', s.send.back === null ? '1' : s.send.back.toFixed(3));
      if (fold !== null) drawFold(svg, fold, launch?.(send.getBoundingClientRect()) ?? null);
      const sig = JSON.stringify({ ...s, send: null });
      if (sig === last) return;
      last = sig;
      const keep = new Set(s.rows.map((r) => r.key));
      for (const [k, el] of els) {
        if (keep.has(k)) continue;
        el.remove();
        els.delete(k);
      }
      for (const r of s.rows) {
        let el = els.get(r.key);
        if (el === undefined) {
          el = document.createElement('div');
          els.set(r.key, el);
        }
        // moved only when out of place: moving a row restarts its fade in (every typed letter re-added
        // every row, so the panel stood empty under his typing: designer m_32270)
        const at = s.rows.indexOf(r);
        if (list.children[at] !== el) list.insertBefore(el, list.children[at] ?? null);
        el.className = `bh-feed-row ${r.who}${r.asks !== null ? ' waiting' : ''}`;
        el.replaceChildren();
        if (r.asks !== null) {
          const q = document.createElement('span');
          q.className = 'bh-feed-ask';
          q.textContent = '?';
          el.append(q, `${r.asks} · ${r.words}`);
        } else el.append(r.words);
        if (r.choices.length > 0) {
          const cs = document.createElement('span');
          cs.className = 'bh-feed-choices';
          r.choices.forEach((c, i) => {
            const b = document.createElement('span');
            b.className = `bh-feed-choice${r.picked === i + 1 ? ' picked' : ''}`;
            b.textContent = `${String(i + 1)} ${c}`;
            cs.append(b);
          });
          el.append(cs);
        }
        if (r.ticked) {
          const t = document.createElement('span');
          t.className = 'bh-feed-tick';
          t.textContent = '✓';
          el.append(t);
        }
      }
      field.textContent = s.typing === '' ? s.placeholder : s.typing;
      field.classList.toggle('empty', s.typing === '');
    },
    dispose() {
      root.remove();
    },
  };
}

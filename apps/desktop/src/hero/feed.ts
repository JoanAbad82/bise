// The hero film's feed (bims-film v13, designer m_31640): the app's composer, small, bottom-left of
// the town over its faded edge: his lines to bise (typed in its field, then sent), bise's replies,
// and bise's waiting lines ('? checkout · words', the answer's field or its numbered choices), the
// last FEED_ROWS of them; each of his lines takes its ✓ when its crate is in. A line he sends folds
// into his plane (the 3D plane leaves from under the feed: run.ts FEED_X). Empty again at the fold.
// feedAt is pure (tested); makeFeed draws it. Owner: hero-town.
import { FEED, PAGE, type Line } from './cast';
import { dart, FOLD_LINE_S, foldShape, SPAN, WORDS, type Launch } from './fold';

/** the lines shown at once (designer: 3-4 lines) */
export const FEED_ROWS = 4;
/** typing: s per character, at most TYPE_MAX_S a line (bims-film v9: 1.2 s for the first) */
const TYPE_S = 0.03;
const TYPE_MAX_S = 1.2;
/** a sent line comes back in the feed this long after its plane left, s (the fold took it) */
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
  /** its fold into the plane, 0..1, null when not folding */
  readonly folding: number | null;
  /** its fade back in once its plane left, 0..1, null when shown whole */
  readonly back: number | null;
}

export interface FeedState {
  readonly rows: readonly FeedRow[];
  /** what his field shows: his line being typed, else its placeholder */
  readonly typing: string;
  readonly placeholder: string;
}

/** when his line is typed: TYPE_S a character, at most TYPE_MAX_S, and before its fold starts (FOLD_LINE_S before its plane) */
const typeEnd = (l: Line): number => {
  const end = l.at + Math.min(TYPE_MAX_S, l.words.length * TYPE_S);
  return l.who === 'you' && l.plane !== undefined ? Math.min(end, l.plane - FOLD_LINE_S) : end;
};

/** The feed at film time T. Pure. */
export function feedAt(T: number): FeedState {
  if (T >= PAGE.fold) return { rows: [], typing: '', placeholder: 'to bise' };
  const rows: FeedRow[] = [];
  let typing = '';
  let placeholder = 'to bise';
  FEED.forEach((l, i) => {
    if (T < l.at) return;
    const key = `l${i}`;
    if (l.who === 'you') {
      const end = typeEnd(l);
      if (T < end) {
        typing = l.words.slice(0, Math.ceil(((T - l.at) / (end - l.at)) * l.words.length));
        return;
      }
      // it folds over the FOLD_LINE_S before its plane leaves, and comes back in after (the 3D plane took over)
      const f = l.plane === undefined ? null : (T - (l.plane - FOLD_LINE_S)) / FOLD_LINE_S;
      const b = l.plane === undefined ? null : (T - l.plane) / BACK_S;
      rows.push({
        key,
        who: 'you',
        words: l.words,
        asks: null,
        choices: [],
        picked: 0,
        ticked: l.tick !== undefined && T >= l.tick,
        folding: f !== null && f >= 0 && f < 1 ? f : null,
        back: b !== null && b >= 0 && b < 1 ? b : null,
      });
      return;
    }
    if (l.who === 'bise') {
      rows.push({ key, who: 'bise', words: l.words, asks: null, choices: [], picked: 0, ticked: l.tick !== undefined && T >= l.tick, folding: null, back: null });
      return;
    }
    const waiting = T < l.until;
    if (waiting && l.field !== undefined) placeholder = l.field;
    const picked = l.pick !== undefined && T >= l.pick.at ? l.pick.n : 0;
    rows.push({ key, who: 'ask', words: l.words, asks: waiting ? l.bim : null, choices: waiting ? (l.choices ?? []) : [], picked, ticked: false, folding: null, back: null });
  });
  return { rows: rows.slice(-FEED_ROWS), typing, placeholder };
}

export interface Feed {
  /** its panel (the film fades it in and out with the build) */
  readonly root: HTMLElement;
  /** the feed at film time T; `launch`: where the 3D plane of a folding row leaves (its rect on the page), null not known */
  draw(T: number, launch?: (rowKey: string, rect: DOMRect) => Launch | null): void;
  /**
   * his 3D planes still under the panel (the canvas is under it): drawn as their dart over it, clipped
   * to it, so the plane flies out of his box (their nose and tail, css px from the panel's top left)
   */
  lift(planes: readonly { readonly nose: { readonly x: number; readonly y: number }; readonly tail: { readonly x: number; readonly y: number } }[]): void;
  dispose(): void;
}

const SVG = 'http://www.w3.org/2000/svg';

/** a folding row's dart (fold.ts), drawn over its bubble: its polygon and its crease */
function drawFold(el: HTMLElement, f: number, l: Launch | null): void {
  let svg = el.querySelector<SVGSVGElement>('svg.bh-fold');
  if (l === null || f < WORDS) {
    svg?.remove();
    return;
  }
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const shape = foldShape(f, w, h, l);
  if (svg === null) {
    svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'bh-fold');
    svg.append(document.createElementNS(SVG, 'polygon'), document.createElementNS(SVG, 'line'));
    el.append(svg);
  }
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  svg.style.setProperty('--paper', `${(shape.paper * 100).toFixed(1)}%`);
  const poly = svg.querySelector('polygon');
  const line = svg.querySelector('line');
  poly?.setAttribute('points', shape.points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '));
  line?.setAttribute('x1', shape.spine.a[0].toFixed(1));
  line?.setAttribute('y1', shape.spine.a[1].toFixed(1));
  line?.setAttribute('x2', shape.spine.b[0].toFixed(1));
  line?.setAttribute('y2', shape.spine.b[1].toFixed(1));
  line?.style.setProperty('opacity', shape.spine.alpha.toFixed(3));
}

/** The feed's DOM in the hero's box (hidden under 860 px by the css). */
export function makeFeed(box: HTMLElement): Feed {
  const root = document.createElement('div');
  root.className = 'bh-feed';
  root.setAttribute('aria-hidden', 'true');
  const list = document.createElement('div');
  list.className = 'bh-feed-rows';
  const field = document.createElement('div');
  field.className = 'bh-feed-field';
  // the lifting darts: over the rows, clipped to the panel
  const lifts = document.createElementNS(SVG, 'svg');
  lifts.setAttribute('class', 'bh-lift');
  root.append(list, field, lifts);
  box.append(root);
  const els = new Map<string, HTMLDivElement>();
  let last = '';

  return {
    root,
    draw(T, launch) {
      const s = feedAt(T);
      const sig = JSON.stringify(s);
      // a fold redraws its dart every frame (the camera moves its heading); else only on a change
      const folding = s.rows.some((r) => r.folding !== null);
      if (sig === last && !folding) return;
      root.classList.toggle('has-fold', folding);
      const same = sig === last;
      last = sig;
      if (same) {
        for (const r of s.rows) {
          const el = els.get(r.key);
          if (el && r.folding !== null) drawFold(el, r.folding, launch?.(r.key, el.getBoundingClientRect()) ?? null);
        }
        return;
      }
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
        el.className = `bh-feed-row ${r.who}${r.asks !== null ? ' waiting' : ''}${r.folding !== null ? ' folding' : ''}${r.folding !== null && r.folding >= WORDS ? ' folded' : ''}${r.back !== null ? ' back' : ''}`;
        // the words fade over the fold's first WORDS, then the dart is the bubble; back in once the plane left
        el.style.setProperty('--words', r.folding !== null ? Math.max(0, 1 - r.folding / WORDS).toFixed(3) : r.back !== null ? r.back.toFixed(3) : '1');
        el.replaceChildren();
        if (r.asks !== null) {
          const q = document.createElement('span');
          q.className = 'bh-feed-ask';
          q.textContent = '?';
          el.append(q, `${r.asks} · ${r.words}`);
        } else {
          const w = document.createElement('span');
          w.className = 'bh-feed-words';
          w.textContent = r.words;
          el.append(w);
        }
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
        if (r.folding !== null) drawFold(el, r.folding, launch?.(r.key, el.getBoundingClientRect()) ?? null);
      }
      field.textContent = s.typing === '' ? s.placeholder : s.typing;
      field.classList.toggle('empty', s.typing === '');
    },
    lift(planes) {
      const w = root.clientWidth;
      const h = root.clientHeight;
      lifts.setAttribute('viewBox', `0 0 ${String(w)} ${String(h)}`);
      while (lifts.children.length > planes.length) lifts.lastElementChild?.remove();
      while (lifts.children.length < planes.length) lifts.append(document.createElementNS(SVG, 'polygon'));
      planes.forEach((p, i) => {
        const len = Math.hypot(p.nose.x - p.tail.x, p.nose.y - p.tail.y);
        const pts = len < 1 ? [] : dart((p.nose.x + p.tail.x) / 2, (p.nose.y + p.tail.y) / 2, { len, hx: (p.nose.x - p.tail.x) / len, hy: (p.nose.y - p.tail.y) / len }, SPAN);
        lifts.children[i]?.setAttribute('points', pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '));
      });
    },
    dispose() {
      root.remove();
    },
  };
}

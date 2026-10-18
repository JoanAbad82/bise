// The hero film's feed (bims-film v13, designer m_31640): the app's composer, small, bottom-left of
// the town over its faded edge: his lines to bise (typed in its field, then sent), bise's replies,
// and bise's waiting lines ('? checkout · words', the answer's field or its numbered choices), the
// last FEED_ROWS of them; each of his lines takes its ✓ when its crate is in. A line he sends folds
// into his plane (the 3D plane leaves from under the feed: run.ts FEED_X). Empty again at the fold.
// feedAt is pure (tested); makeFeed draws it. Owner: hero-town.
import { FEED, PAGE, type Line } from './cast';

/** the lines shown at once (designer: 3-4 lines) */
export const FEED_ROWS = 4;
/** typing: s per character, at most TYPE_MAX_S a line (bims-film v9: 1.2 s for the first) */
const TYPE_S = 0.03;
const TYPE_MAX_S = 1.2;
/** a sent line's fold into its plane, s */
export const FOLD_LINE_S = 0.4;

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
}

export interface FeedState {
  readonly rows: readonly FeedRow[];
  /** what his field shows: his line being typed, else its placeholder */
  readonly typing: string;
  readonly placeholder: string;
}

const typeEnd = (l: Line): number => l.at + Math.min(TYPE_MAX_S, l.words.length * TYPE_S);

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
      const f = l.plane === undefined ? null : (T - l.plane) / FOLD_LINE_S;
      rows.push({ key, who: 'you', words: l.words, asks: null, choices: [], picked: 0, ticked: l.tick !== undefined && T >= l.tick, folding: f !== null && f >= 0 && f < 1 ? f : null });
      return;
    }
    if (l.who === 'bise') {
      rows.push({ key, who: 'bise', words: l.words, asks: null, choices: [], picked: 0, ticked: l.tick !== undefined && T >= l.tick, folding: null });
      return;
    }
    const waiting = T < l.until;
    if (waiting && l.field !== undefined) placeholder = l.field;
    const picked = l.pick !== undefined && T >= l.pick.at ? l.pick.n : 0;
    rows.push({ key, who: 'ask', words: l.words, asks: waiting ? l.bim : null, choices: waiting ? (l.choices ?? []) : [], picked, ticked: false, folding: null });
  });
  return { rows: rows.slice(-FEED_ROWS), typing, placeholder };
}

export interface Feed {
  /** its panel (the film fades it in and out with the build) */
  readonly root: HTMLElement;
  draw(T: number): void;
  dispose(): void;
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
  root.append(list, field);
  box.append(root);
  const els = new Map<string, HTMLDivElement>();
  let last = '';

  return {
    root,
    draw(T) {
      const s = feedAt(T);
      const sig = JSON.stringify(s);
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
        list.append(el);
        el.className = `bh-feed-row ${r.who}${r.asks !== null ? ' waiting' : ''}${r.folding !== null ? ' folding' : ''}`;
        el.style.setProperty('--fold', r.folding === null ? '0' : r.folding.toFixed(3));
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

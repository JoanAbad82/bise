// kiln, scenario A's mini app (bims-film v11, from 0:52): the shop the agents ship for a pottery
// studio, on localhost:5173: pots with prices, add to cart, the cart's drawer, a fake checkout,
// 'order #1042 confirmed'. The hero mounts `el` in its overlay (its rise, scale and fold are
// hero-town's); the film drives it with at(s), seekable; the visitor can click it for real (then
// 'touch', and the film's next at() takes it back). Plain DOM, its own lazy chunk: imports nothing
// from the rest of hero/ or bims/. The shop's rules and the script are model.ts's. Owner: kiln-app.
import css from './kiln.css?inline';
import {
  CONFIRM_MS,
  EMPTY,
  LAYOUTS,
  PRODUCTS,
  STILL,
  cardW,
  count,
  cursorAt,
  fxAt,
  lines,
  payTop,
  reduce,
  stateAt,
  total,
  type Action,
  type Cursor,
  type Fx,
  type KilnItem,
  type KilnSize,
  type KilnState,
} from './model';

export type { KilnItem, KilnSize } from './model';

/** the page's design sizes, css px: the hero scales it with a transform */
export const KILN_SIZES: Readonly<Record<KilnSize, { readonly w: number; readonly h: number }>> = LAYOUTS;

export interface Kiln {
  /** the whole page, KILN_SIZES[size] css px */
  readonly el: HTMLElement;
  setTheme(t: 'light' | 'dark'): void;
  /** full (the end shot) or compact (a window under 520 wide) */
  setSize(size: KilnSize): void;
  /** the film's state s seconds after the page appeared; before 0 it is empty */
  at(s: number): void;
  /** the visitor clicked it for real */
  on(ev: 'touch', fn: () => void): () => void;
  destroy(): void;
}

const SVG = 'http://www.w3.org/2000/svg';

/** the pots (viewBox 0 0 100 70), each in its glaze (designer m_31718); 's' parts are strokes */
const POTS: Readonly<Record<KilnItem, readonly [string, readonly string[]]>> = {
  mug: ['#d8c3a0', ['M36 22h26v30a5 5 0 0 1-5 5H41a5 5 0 0 1-5-5z', 'sM62 29h4a7 7 0 0 1 0 14h-4']],
  bowl: ['#b9b4ac', ['M26 32h48c0 13-11 21-24 21S26 45 26 32z', 'M43 53h14v3H43z']],
  'tall-vase': ['#a7c2ad', ['M44 8h12v5c7 5 10 15 10 25s-3 17-7 20H41c-4-3-7-10-7-20s3-20 10-25z']],
  'pour-over': ['#7d4b33', ['M34 14h32l-9 15H43z', 'M41 31h18l5 27H36z']],
  plate: ['#eadcc2', ['M18 44a32 9 0 1 0 64 0a32 9 0 1 0-64 0z', 'M32 44a18 4.5 0 1 0 36 0a18 4.5 0 1 0-36 0z']],
  'bud-vase': ['#3f5f9e', ['M47 16h6v7c6 4 9 11 9 18s-4 15-12 15-12-8-12-15 3-14 9-18z']],
};

const CURSOR = 'M1 1v17l4.5-4.2 3.2 6.6 2.8-1.3-3.1-6.4h6.2z';

function node(tag: string, cls = '', text = ''): HTMLElement {
  const e = document.createElement(tag);
  if (cls !== '') e.className = cls;
  if (text !== '') e.textContent = text;
  return e;
}

function svg(cls: string, viewBox: string, parts: readonly string[], fill?: string): SVGSVGElement {
  const s = document.createElementNS(SVG, 'svg');
  s.setAttribute('class', cls);
  s.setAttribute('viewBox', viewBox);
  s.setAttribute('aria-hidden', 'true');
  for (const d of parts) {
    const p = document.createElementNS(SVG, 'path');
    const stroke = d.startsWith('s');
    p.setAttribute('d', stroke ? d.slice(1) : d);
    if (fill) p.setAttribute(stroke ? 'stroke' : 'fill', fill);
    if (stroke) p.setAttribute('class', 's');
    s.append(p);
  }
  return s;
}

const euros = (n: number): string => `€${n}`;

export function makeKiln(opts: { theme: 'light' | 'dark'; size?: KilnSize }): Kiln {
  const el = node('div', 'kn');
  el.dataset.theme = opts.theme;
  const style = node('style');
  style.textContent = css;

  const bar = node('div', 'kn-bar');
  bar.append(node('i'), node('i'), node('i'), node('span', 'kn-url', 'localhost:5173'));

  const head = node('div', 'kn-head');
  const cart = node('div', 'kn-cart');
  cart.dataset.act = 'cart';
  const pill = node('span', 'kn-pill');
  cart.append(node('span', '', 'cart'), pill);
  head.append(node('span', 'kn-logo', 'kiln'), node('span', 'kn-nav', 'shop about'), cart);

  const main = node('div', 'kn-main');
  const grid = node('div', 'kn-grid');
  const addOf = new Map<KilnItem, HTMLElement>();
  for (const p of PRODUCTS) {
    const card = node('div', 'kn-card');
    if (!LAYOUTS.compact.items.includes(p.id)) card.dataset.big = '';
    const tile = node('div', 'kn-tile');
    const [glaze, parts] = POTS[p.id];
    tile.append(svg('', '0 0 100 70', parts, glaze));
    const info = node('div', 'kn-info');
    info.append(node('span', 'kn-name', p.name), node('span', 'kn-price', euros(p.price)));
    const add = node('div', 'kn-add');
    add.dataset.add = p.id;
    card.append(tile, info, add);
    grid.append(card);
    addOf.set(p.id, add);
  }

  const pay = node('div', 'kn-pay');
  const sum = node('div', 'kn-sum');
  const field = (k: string, v: string): HTMLElement => {
    const f = node('div', 'kn-field');
    f.append(node('span', '', k), node('b', '', v));
    return f;
  };
  const payBtn = node('div', 'kn-go');
  payBtn.dataset.act = 'pay';
  pay.append(node('div', 'kn-ptitle', 'checkout'), sum, field('name', 'Ana'), field('card', '•••• 4242'), payBtn);

  const ok = node('div', 'kn-ok');
  const keepBtn = node('div', 'kn-keep', 'keep shopping');
  keepBtn.dataset.act = 'keep';
  ok.append(node('div', 'kn-tick', '✓'), node('div', 'kn-otitle', 'order #1042 confirmed'), node('div', 'kn-mail', 'a confirmation mail is on its way.'), keepBtn);
  main.append(grid, pay, ok);

  const drawer = node('div', 'kn-drawer');
  const dhead = node('div', 'kn-dhead');
  const x = node('span', 'kn-x', '✕');
  x.dataset.act = 'close';
  dhead.append(node('span', '', 'your cart'), x);
  const list = node('div');
  const tot = node('div', 'kn-total');
  const totV = node('span');
  tot.append(node('span', '', 'total'), totV);
  const go = node('div', 'kn-go');
  go.dataset.act = 'checkout';
  drawer.append(dhead, list, tot, node('div', 'kn-ship', 'ships in the EU only'), go);

  const cur = svg('kn-cur', '0 0 18 24', [CURSOR]);
  el.append(style, bar, head, main, drawer, cur);

  let L = LAYOUTS[opts.size ?? 'full'];
  const size = (k: KilnSize): void => {
    L = LAYOUTS[k];
    el.classList.toggle('compact', k === 'compact');
    const vars: Record<string, number | null> = {
      w: L.w, h: L.h, bar: L.bar, head: L.head, m: L.margin, gap: L.gap, cols: L.cols, cardh: L.cardH,
      pad: L.pad, tileh: L.tileH, sidew: L.sideW, btnw: L.btnW, btnh: L.btnH, cartw: L.cartW,
      drawerw: L.drawerW, payw: L.payW, payh: L.payH, paytop: payTop(L) - L.bar - L.head, cardw: cardW(L),
    };
    for (const [k2, v] of Object.entries(vars)) {
      el.style.setProperty(`--k-${k2}`, v === null ? '0' : k2 === 'cols' ? String(v) : `${v}px`);
    }
  };
  size(opts.size ?? 'full');

  let state: KilnState = EMPTY;
  let film = true;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const added = new Set<KilnItem>();
  const fns = new Set<() => void>();
  let lastCount = -1;

  const draw = (fx: Fx, cursor: Cursor | null): void => {
    el.dataset.view = state.view;
    el.classList.toggle('open', state.open);
    el.classList.toggle('kn-live', !film);
    const n = count(state);
    pill.textContent = n > 0 ? String(n) : '';
    pill.style.transform = fx.bump > 0 ? `scale(${(1 + 0.25 * fx.bump).toFixed(3)})` : '';
    pill.classList.remove('bump');
    if (!film && n > lastCount && lastCount >= 0) {
      // a reflow between, so the bump's animation starts again
      void pill.getBoundingClientRect();
      pill.classList.add('bump');
    }
    lastCount = n;
    cart.classList.toggle('down', fx.press === 'cart');
    for (const [id, b] of addOf) {
      const on = fx.added.includes(id);
      b.classList.toggle('added', on);
      b.classList.toggle('down', fx.press === id);
      b.textContent = on ? '✓ added' : '+ add';
    }
    list.replaceChildren(
      ...lines(state).map(({ p, n: k }) => {
        const r = node('div', 'kn-line');
        r.append(node('span', '', k > 1 ? `${p.name} × ${k}` : p.name), node('span', '', euros(p.price * k)));
        return r;
      }),
    );
    const t = euros(total(state));
    totV.textContent = t;
    go.textContent = 'checkout';
    go.classList.toggle('down', fx.press === 'checkout');
    drawer.style.transform = film && state.open && fx.slide < 1 ? `translateX(${((1 - fx.slide) * 105).toFixed(1)}%)` : '';
    const k = state.cart.length;
    sum.textContent = `${k} ${k === 1 ? 'item' : 'items'} · ${t}`;
    payBtn.textContent = state.view === 'paying' ? 'paying…' : `pay ${t}`;
    payBtn.classList.toggle('down', fx.press === 'pay');
    cur.style.display = cursor ? '' : 'none';
    if (cursor) cur.style.transform = `translate(${cursor.x.toFixed(1)}px,${cursor.y.toFixed(1)}px) scale(${cursor.down ? 0.88 : 1})`;
  };

  const later = (ms: number, fn: () => void): void => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };
  const stopLive = (): void => {
    for (const t of timers) clearTimeout(t);
    timers.clear();
    added.clear();
  };
  const live = (): Fx => ({ ...STILL, added: [...added] });

  /** a real click: the same reducer as the film's script, no fake cursor, and the hero is told */
  const visit = (a: Action): void => {
    const next = reduce(state, a);
    if (next === state) return;
    if (film) {
      stopLive();
      film = false;
    }
    state = next;
    if (a.t === 'add') {
      const id = a.id;
      added.add(id);
      later(1200, () => {
        added.delete(id);
        draw(live(), null);
      });
    }
    if (state.view === 'paying') {
      later(CONFIRM_MS, () => {
        state = reduce(state, { t: 'confirm' });
        draw(live(), null);
      });
    }
    draw(live(), null);
    for (const fn of fns) fn();
  };

  const ACTS: Readonly<Record<string, Action>> = {
    cart: { t: 'openCart' },
    close: { t: 'closeCart' },
    checkout: { t: 'checkout' },
    pay: { t: 'pay' },
    keep: { t: 'keepShopping' },
  };
  const onClick = (e: MouseEvent): void => {
    const t = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-act],[data-add]') : null;
    if (!t) return;
    const id = PRODUCTS.find((p) => p.id === t.dataset.add)?.id;
    if (id) visit({ t: 'add', id });
    const a = t.dataset.act === undefined ? undefined : ACTS[t.dataset.act];
    if (!id && a) visit(a);
  };
  // the town under it must not take a click on the page for a drag, nor the page its focus
  const keep = (e: Event): void => {
    e.stopPropagation();
  };
  const noFocus = (e: MouseEvent): void => {
    e.preventDefault();
  };
  el.addEventListener('click', onClick);
  el.addEventListener('pointerdown', keep);
  el.addEventListener('mousedown', noFocus);

  let lastS = -1;
  draw(STILL, null);

  return {
    el,
    setTheme(t) {
      el.dataset.theme = t;
    },
    setSize(k) {
      size(k);
      if (film) this.at(lastS);
    },
    at(s) {
      stopLive();
      film = true;
      lastS = s;
      state = stateAt(s);
      lastCount = -1;
      draw(s < 0 ? STILL : fxAt(s), cursorAt(L, s));
    },
    on(_ev, fn) {
      fns.add(fn);
      return () => {
        fns.delete(fn);
      };
    },
    destroy() {
      stopLive();
      fns.clear();
      el.removeEventListener('click', onClick);
      el.removeEventListener('pointerdown', keep);
      el.removeEventListener('mousedown', noFocus);
      el.remove();
    },
  };
}

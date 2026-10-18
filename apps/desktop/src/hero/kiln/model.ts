// kiln's shop, pure (scenario A's mini app, kiln.ts draws it): the state, the one reducer both the
// visitor's clicks and the film's script go through, and the script itself as timed actions, so
// at(s) is a fold from empty (seekable: at(4) then at(1) is at(1) fresh). Also the fake cursor's
// path and the short feedbacks (pressed, '✓ added', the count's bump, the drawer's slide) as
// functions of s, on the page's two fixed layouts (LAYOUTS: kiln.ts hands their numbers to
// kiln.css, so the cursor aims where things are). Owner: kiln-app.

export type KilnItem = 'mug' | 'bowl' | 'tall-vase' | 'pour-over' | 'plate' | 'bud-vase';

export interface Product {
  readonly id: KilnItem;
  readonly name: string;
  /** euros */
  readonly price: number;
}

/** the full grid, 3 x 2, in reading order (designer m_31718) */
export const PRODUCTS: readonly Product[] = [
  { id: 'mug', name: 'speckled mug', price: 28 },
  { id: 'bowl', name: 'ash bowl', price: 34 },
  { id: 'tall-vase', name: 'tall vase', price: 62 },
  { id: 'pour-over', name: 'pour-over set', price: 48 },
  { id: 'plate', name: 'side plate', price: 22 },
  { id: 'bud-vase', name: 'bud vase', price: 26 },
];

export type KilnSize = 'full' | 'compact';

export interface Layout {
  readonly w: number;
  readonly h: number;
  /** the browser's bar, then the shop's header */
  readonly bar: number;
  readonly head: number;
  readonly margin: number;
  readonly gap: number;
  readonly cols: number;
  readonly cardH: number;
  readonly pad: number;
  /** the pot's tile: over the name (full) or beside it, this wide (compact) */
  readonly tileH: number;
  readonly sideW: number | null;
  readonly btnW: number | null;
  readonly btnH: number;
  readonly cartW: number;
  readonly drawerW: number;
  readonly payW: number;
  readonly payH: number;
  readonly items: readonly KilnItem[];
}

/** full: the end shot, 3 x 2; compact: a window under 520 wide (phones), 2 x 2 (designer m_31727) */
export const LAYOUTS: Readonly<Record<KilnSize, Layout>> = {
  full: {
    w: 600, h: 400, bar: 32, head: 44, margin: 16, gap: 12, cols: 3, cardH: 136, pad: 8,
    tileH: 64, sideW: null, btnW: null, btnH: 28, cartW: 76, drawerW: 240, payW: 300, payH: 206,
    items: PRODUCTS.map((p) => p.id),
  },
  compact: {
    w: 400, h: 300, bar: 28, head: 40, margin: 10, gap: 8, cols: 2, cardH: 102, pad: 8,
    tileH: 86, sideW: 52, btnW: 84, btnH: 28, cartW: 76, drawerW: 230, payW: 290, payH: 206,
    items: ['mug', 'bowl', 'tall-vase', 'bud-vase'],
  },
};

/** shop: the grid; checkout: the pay card; paying: the fake server has it; done: confirmed */
export type View = 'shop' | 'checkout' | 'paying' | 'done';

export interface KilnState {
  /** what is in the cart, in the order it was added */
  readonly cart: readonly KilnItem[];
  /** the cart's drawer is open (over the grid) */
  readonly open: boolean;
  readonly view: View;
}

export type Action =
  | { readonly t: 'add'; readonly id: KilnItem }
  | { readonly t: 'openCart' }
  | { readonly t: 'closeCart' }
  | { readonly t: 'checkout' }
  | { readonly t: 'pay' }
  | { readonly t: 'confirm' }
  | { readonly t: 'keepShopping' }
  | { readonly t: 'reset' };

export const EMPTY: KilnState = { cart: [], open: false, view: 'shop' };

/** what a click (or the script) does; a pay freezes the cart, a confirmed order empties it */
export function reduce(s: KilnState, a: Action): KilnState {
  switch (a.t) {
    case 'reset':
      return EMPTY;
    case 'keepShopping':
      return s.view === 'done' ? EMPTY : s;
    case 'add':
      return s.view === 'shop' ? { ...s, cart: [...s.cart, a.id] } : s;
    case 'openCart':
      return s.view === 'shop' && !s.open ? { ...s, open: true } : s;
    case 'closeCart':
      return s.open ? { ...s, open: false } : s;
    case 'checkout':
      return s.open && s.cart.length > 0 ? { ...s, open: false, view: 'checkout' } : s;
    case 'pay':
      return s.view === 'checkout' ? { ...s, view: 'paying' } : s;
    case 'confirm':
      return s.view === 'paying' ? { ...s, view: 'done' } : s;
  }
}

/** the count on the cart: a confirmed order empties it */
export function count(s: KilnState): number {
  return s.view === 'done' ? 0 : s.cart.length;
}

export function product(id: KilnItem): Product {
  return PRODUCTS.find((p) => p.id === id) ?? { id, name: id, price: 0 };
}

export function total(s: KilnState): number {
  return s.cart.reduce((n, id) => n + product(id).price, 0);
}

/** the cart's lines: each item once, with how many, in the grid's order */
export function lines(s: KilnState): readonly { readonly p: Product; readonly n: number }[] {
  return PRODUCTS.map((p) => ({ p, n: s.cart.filter((id) => id === p.id).length })).filter((l) => l.n > 0);
}

/** the fake server's answer to a real pay, ms */
export const CONFIRM_MS = 700;

/** the script's beats, s since the page appeared (bims-film v11, m_31723: mug 1.2, cart 2.0,
 *  checkout ~3.2, confirmed 4.2; designer's pay card fits between) */
export const BEATS = { add: 1.2, cart: 2.0, checkout: 2.7, pay: 3.5, confirmed: 4.2 } as const;

const SCRIPT: readonly { readonly at: number; readonly a: Action }[] = [
  { at: BEATS.add, a: { t: 'add', id: 'mug' } },
  { at: BEATS.cart, a: { t: 'openCart' } },
  { at: BEATS.checkout, a: { t: 'checkout' } },
  { at: BEATS.pay, a: { t: 'pay' } },
  { at: BEATS.confirmed, a: { t: 'confirm' } },
];

/** the shop s seconds into the script; before 0 it is empty */
export function stateAt(s: number): KilnState {
  return SCRIPT.filter((b) => b.at <= s).reduce((st, b) => reduce(st, b.a), EMPTY);
}

export interface Spot {
  readonly x: number;
  readonly y: number;
}

const top = (L: Layout): number => L.bar + L.head;

export function cardW(L: Layout): number {
  return (L.w - 2 * L.margin - (L.cols - 1) * L.gap) / L.cols;
}

/** a product's 'add' button's middle, css px; off the grid (compact's missing pots) is the first's */
export function addSpot(L: Layout, id: KilnItem): Spot {
  const i = Math.max(0, L.items.indexOf(id));
  const w = cardW(L);
  const x0 = L.margin + (i % L.cols) * (w + L.gap);
  const y0 = top(L) + L.margin + Math.floor(i / L.cols) * (L.cardH + L.gap);
  const y = y0 + L.cardH - L.pad - L.btnH / 2;
  if (L.sideW === null || L.btnW === null) return { x: x0 + w / 2, y };
  return { x: x0 + L.pad + L.sideW + 10 + L.btnW / 2, y };
}

/** the cart's middle, in the shop's header, css px */
export function cartSpot(L: Layout): Spot {
  return { x: L.w - L.margin - L.cartW / 2, y: L.bar + L.head / 2 };
}

/** the drawer's checkout button's middle, css px (16 from the drawer's bottom, 38 tall) */
export function checkoutSpot(L: Layout): Spot {
  return { x: L.w - L.drawerW / 2, y: L.h - 16 - 19 };
}

/** where the pay card's top sits, css px: in the middle of the page under the header */
export function payTop(L: Layout): number {
  return top(L) + (L.h - top(L) - L.payH) / 2;
}

/** the pay card's button's middle, css px (16 from the card's bottom, 38 tall) */
export function paySpot(L: Layout): Spot {
  return { x: L.w / 2, y: payTop(L) + L.payH - 16 - 19 };
}

export interface Cursor extends Spot {
  /** the button is down: a press shows on the cursor and under it */
  readonly down: boolean;
}

/** a press (its pressed look) lasts a click */
const PRESS_S = 0.16;
/** '+ add' reads '✓ added' this long (designer m_31718) */
export const ADDED_S = 1.2;
/** the count's bump (designer m_31718) */
export const BUMP_S = 0.12;
/** the drawer's slide in */
export const SLIDE_S = 0.18;

const ease = (u: number): number => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

interface Key extends Spot {
  readonly t: number;
}

/** the cursor's path: holds at each key, eased between; it comes in from under the right corner */
function path(L: Layout): readonly Key[] {
  const tip = (t: number, p: Spot, dx = 5, dy = 3): Key => ({ t, x: p.x + dx, y: p.y + dy });
  const add = addSpot(L, 'mug');
  const B = BEATS;
  return [
    { t: 0, x: L.w + 30, y: L.h + 40 },
    tip(0.95, add),
    tip(B.add + 0.15, add),
    tip(B.cart - 0.12, cartSpot(L)),
    tip(B.cart + 0.15, cartSpot(L)),
    tip(B.checkout - 0.1, checkoutSpot(L)),
    tip(B.checkout + 0.15, checkoutSpot(L)),
    tip(B.pay - 0.12, paySpot(L)),
    tip(B.confirmed, paySpot(L)),
    tip(B.confirmed + 0.7, paySpot(L), L.w * 0.2, L.h * 0.16),
  ];
}

/** the fake cursor s seconds into the script; none before 0 */
export function cursorAt(L: Layout, s: number): Cursor | null {
  if (s < 0) return null;
  const down = pressAt(s) !== null;
  let prev: Key | null = null;
  for (const k of path(L)) {
    if (s <= k.t) {
      if (!prev) return { x: k.x, y: k.y, down };
      const u = ease((s - prev.t) / (k.t - prev.t));
      return { x: prev.x + (k.x - prev.x) * u, y: prev.y + (k.y - prev.y) * u, down };
    }
    prev = k;
  }
  return prev ? { x: prev.x, y: prev.y, down } : null;
}

export type Press = KilnItem | 'cart' | 'checkout' | 'pay';

/** the short looks s seconds into the script: what is pressed, which buttons read '✓ added', the
 *  count's bump (0-1) and the drawer's slide (1 = in) */
export interface Fx {
  readonly press: Press | null;
  readonly added: readonly KilnItem[];
  readonly bump: number;
  readonly slide: number;
}

export function pressAt(s: number): Press | null {
  const on = (t: number): boolean => s >= t && s < t + PRESS_S;
  if (on(BEATS.add)) return 'mug';
  if (on(BEATS.cart)) return 'cart';
  if (on(BEATS.checkout)) return 'checkout';
  if (on(BEATS.pay)) return 'pay';
  return null;
}

export function fxAt(s: number): Fx {
  const b = (s - BEATS.add) / BUMP_S;
  return {
    press: pressAt(s),
    added: s >= BEATS.add && s < BEATS.add + ADDED_S ? ['mug'] : [],
    bump: b >= 0 && b < 1 ? Math.sin(Math.PI * b) : 0,
    slide: ease((s - BEATS.cart) / SLIDE_S),
  };
}

/** the looks when nothing moves (a visitor's clicks: their motion is css's) */
export const STILL: Fx = { press: null, added: [], bump: 0, slide: 1 };

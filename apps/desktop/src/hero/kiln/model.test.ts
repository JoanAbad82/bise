import { describe, expect, it } from 'vitest';
import {
  BEATS,
  EMPTY,
  LAYOUTS,
  addSpot,
  cartSpot,
  checkoutSpot,
  count,
  cursorAt,
  fxAt,
  paySpot,
  reduce,
  stateAt,
  total,
  type Action,
  type Spot,
} from './model';

const clicks = (as: readonly Action[]) => as.reduce(reduce, EMPTY);
const PATH: readonly Action[] = [{ t: 'add', id: 'mug' }, { t: 'openCart' }, { t: 'checkout' }, { t: 'pay' }, { t: 'confirm' }];

describe('kiln shop', () => {
  it('the script reads: empty, a mug in the cart, the cart open, checkout, paying, confirmed', () => {
    expect(stateAt(-1)).toEqual(EMPTY);
    expect(stateAt(0)).toEqual(EMPTY);
    expect(stateAt(1.5)).toEqual({ cart: ['mug'], open: false, view: 'shop' });
    expect(stateAt(2.2)).toEqual({ cart: ['mug'], open: true, view: 'shop' });
    expect(stateAt(3.2)).toEqual({ cart: ['mug'], open: false, view: 'checkout' });
    expect(stateAt(3.8)).toEqual({ cart: ['mug'], open: false, view: 'paying' });
    expect(stateAt(4.2)).toEqual({ cart: ['mug'], open: false, view: 'done' });
    expect(stateAt(60)).toEqual(stateAt(4.2));
  });

  it("the film's states are the clicks' states at every beat, and reset is empty", () => {
    const beats = [BEATS.add, BEATS.cart, BEATS.checkout, BEATS.pay, BEATS.confirmed];
    beats.forEach((t, i) => {
      expect(stateAt(t)).toEqual(clicks(PATH.slice(0, i + 1)));
    });
    expect(reduce(stateAt(4.2), { t: 'reset' })).toEqual(stateAt(0));
  });

  it('checkout needs an open cart with something in it; pay freezes the cart; a confirmed order empties the count', () => {
    expect(clicks([{ t: 'openCart' }, { t: 'checkout' }]).view).toBe('shop');
    expect(clicks([{ t: 'add', id: 'bowl' }, { t: 'checkout' }]).view).toBe('shop');
    const paying = clicks([{ t: 'add', id: 'tall-vase' }, { t: 'add', id: 'mug' }, { t: 'openCart' }, { t: 'checkout' }, { t: 'pay' }]);
    expect(total(paying)).toBe(90);
    expect(reduce(paying, { t: 'add', id: 'bowl' })).toBe(paying);
    expect(reduce(paying, { t: 'pay' })).toBe(paying);
    const done = reduce(paying, { t: 'confirm' });
    expect(count(paying)).toBe(2);
    expect(count(done)).toBe(0);
    expect(reduce(done, { t: 'keepShopping' })).toEqual(EMPTY);
    expect(reduce(paying, { t: 'keepShopping' })).toBe(paying);
  });

  it('in both sizes the cursor comes in from off the page and is on each button at its click', () => {
    const near = (p: Spot | null, q: Spot): boolean => p !== null && Math.abs(p.x - q.x) < 12 && Math.abs(p.y - q.y) < 8;
    for (const L of [LAYOUTS.full, LAYOUTS.compact]) {
      expect(cursorAt(L, -0.1)).toBeNull();
      const c0 = cursorAt(L, 0);
      expect(c0 !== null && (c0.x > L.w || c0.y > L.h)).toBe(true);
      expect(near(cursorAt(L, BEATS.add), addSpot(L, 'mug'))).toBe(true);
      expect(near(cursorAt(L, BEATS.cart), cartSpot(L))).toBe(true);
      expect(near(cursorAt(L, BEATS.checkout), checkoutSpot(L))).toBe(true);
      expect(near(cursorAt(L, BEATS.pay), paySpot(L))).toBe(true);
      expect(cursorAt(L, BEATS.pay)?.down).toBe(true);
      expect(cursorAt(L, 2.5)?.down).toBe(false);
    }
  });

  it("the short looks: '✓ added' 1.2 s, the count's bump, the drawer's slide", () => {
    expect(fxAt(1.0)).toMatchObject({ added: [], bump: 0, press: null });
    expect(fxAt(1.26)).toMatchObject({ added: ['mug'], press: 'mug' });
    expect(fxAt(1.26).bump).toBeGreaterThan(0.9);
    expect(fxAt(2.5).added).toEqual([]);
    expect(fxAt(2.05).slide).toBeLessThan(1);
    expect(fxAt(2.5).slide).toBe(1);
  });
});

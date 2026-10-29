// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeKiln, type Kiln } from './kiln';
import { CONFIRM_MS } from './model';

const made: Kiln[] = [];
const kiln = (): Kiln => {
  const k = makeKiln({ theme: 'light' });
  document.body.append(k.el);
  made.push(k);
  return k;
};
const q = (k: Kiln, sel: string): HTMLElement => {
  const e = k.el.querySelector<HTMLElement>(sel);
  if (!e) throw new Error(`no ${sel}`);
  return e;
};
/** what the page shows, the fake cursor and the short looks aside */
const seen = (k: Kiln) => ({
  view: k.el.dataset.view,
  open: k.el.classList.contains('open'),
  count: q(k, '.kn-pill').textContent,
  cart: [...k.el.querySelectorAll('.kn-line')].map((l) => l.textContent),
  pay: q(k, '.kn-pay .kn-go').textContent,
});

afterEach(() => {
  for (const k of made.splice(0)) k.destroy();
  vi.useRealTimers();
});

describe('kiln page', () => {
  it('shows the bar, the shop and its six pots with prices', () => {
    const k = kiln();
    expect(q(k, '.kn-url').textContent).toBe('localhost:5173');
    expect(q(k, '.kn-logo').textContent).toBe('kiln');
    expect([...k.el.querySelectorAll('.kn-card')].map((c) => c.querySelector('.kn-info')?.textContent)).toEqual([
      'speckled mug€28',
      'ash bowl€34',
      'tall vase€62',
      'pour-over set€48',
      'side plate€22',
      'bud vase€26',
    ]);
  });

  it('at(s): the film at 0, 1.5, 2.2, 3.2 and 4.2', () => {
    const k = kiln();
    k.at(0);
    expect(seen(k)).toMatchObject({ view: 'shop', open: false, count: '' });
    k.at(1.5);
    expect(seen(k)).toMatchObject({ view: 'shop', count: '1' });
    expect(q(k, '[data-add="mug"]').textContent).toBe('✓ added');
    k.at(2.2);
    expect(seen(k)).toMatchObject({ open: true, cart: ['speckled mug€28'] });
    k.at(3.2);
    expect(seen(k)).toMatchObject({ view: 'checkout', open: false, pay: 'pay €28' });
    k.at(4.2);
    expect(seen(k)).toMatchObject({ view: 'done', count: '' });
    expect(q(k, '.kn-otitle').textContent).toBe('order #1042 confirmed');
  });

  it('seeks back: at(4) then at(1) is at(1) fresh, cursor and all; at(-1) is empty', () => {
    const fresh = kiln();
    fresh.at(1);
    const seeked = kiln();
    seeked.at(4);
    seeked.at(1);
    expect(seeked.el.outerHTML).toBe(fresh.el.outerHTML);
    seeked.at(-1);
    expect(seen(seeked)).toMatchObject({ view: 'shop', count: '' });
    expect(q(seeked, '.kn-cur').style.display).toBe('none');
  });

  it("the visitor's clicks give the film's states, emit touch, and the next at() takes it back", () => {
    vi.useFakeTimers();
    const clicked = kiln();
    const film = kiln();
    const touch = vi.fn();
    clicked.on('touch', touch);
    clicked.at(0.5);
    q(clicked, '[data-act="cart"]').click();
    q(clicked, '[data-act="checkout"]').click();
    expect(seen(clicked).view).toBe('shop');
    q(clicked, '[data-act="close"]').click();
    touch.mockClear();
    const steps: readonly [string, number][] = [
      ['[data-add="mug"]', 1.5],
      ['[data-act="cart"]', 2.2],
      ['[data-act="checkout"]', 3.2],
      ['[data-act="pay"]', 3.8],
    ];
    for (const [sel, t] of steps) {
      q(clicked, sel).click();
      film.at(t);
      expect(seen(clicked)).toEqual(seen(film));
    }
    expect(touch).toHaveBeenCalledTimes(4);
    expect(q(clicked, '.kn-cur').style.display).toBe('none');
    vi.advanceTimersByTime(CONFIRM_MS);
    film.at(4.2);
    expect(seen(clicked)).toEqual(seen(film));
    q(clicked, '[data-act="keep"]').click();
    film.at(0);
    expect(seen(clicked)).toEqual(seen(film));
    clicked.at(1);
    film.at(1);
    expect(clicked.el.outerHTML).toBe(film.el.outerHTML);
  });

  it("a film's at() drops a visitor's order on its way", () => {
    vi.useFakeTimers();
    const k = kiln();
    for (const sel of ['[data-add="bowl"]', '[data-act="cart"]', '[data-act="checkout"]', '[data-act="pay"]']) q(k, sel).click();
    k.at(1.5);
    vi.advanceTimersByTime(CONFIRM_MS * 2);
    expect(seen(k)).toMatchObject({ view: 'shop', count: '1' });
  });

  it('a click does not reach the town under it; setTheme, setSize and destroy', () => {
    const k = kiln();
    const town = vi.fn();
    document.body.addEventListener('pointerdown', town);
    q(k, '.kn-card').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(town).not.toHaveBeenCalled();
    document.body.removeEventListener('pointerdown', town);
    k.setTheme('dark');
    expect(k.el.dataset.theme).toBe('dark');
    k.setSize('compact');
    expect(k.el.classList.contains('compact')).toBe(true);
    expect(k.el.style.getPropertyValue('--k-w')).toBe('400px');
    k.destroy();
    expect(k.el.isConnected).toBe(false);
  });
});

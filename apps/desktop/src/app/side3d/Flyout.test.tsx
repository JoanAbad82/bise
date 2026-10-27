// @vitest-environment happy-dom
// A side row's tip only while its title is cut, the whole title then (designer m_46988, ui-review
// m_46955 nit b: 'vite''s tip covered the row above). happy-dom has no layout nor ResizeObserver: a
// stand-in observer calls back on observe, and the title's box says its widths as Chromium would.
// Mutation: SideRow's tip back to tipAttrs(tip) turns the whole-title case red.
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntityMenu } from '@/ds';
import { isCut, SideRow } from './Flyout';

const seen: { el: Element; cb: () => void }[] = [];
class FakeObserver {
  constructor(private readonly cb: () => void) {}
  observe(el: Element) {
    seen.push({ el, cb: this.cb });
    this.cb();
  }
  disconnect() {}
}

beforeEach(() => {
  seen.length = 0;
  // the title's widths, as a cut or whole line box would measure
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, get(this: HTMLElement) { return Number(this.dataset.sw ?? 0); } });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get(this: HTMLElement) { return Number(this.dataset.cw ?? 0); } });
  vi.stubGlobal('ResizeObserver', FakeObserver);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollWidth');
  Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
});

const menu = { onContextMenu: () => undefined } as unknown as EntityMenu;

function row(sw: number, cw: number) {
  const v = render(<SideRow pic={null} title={<span>vite</span>} sub="perf" tip="vite --port 5173" label="vite" onClick={() => undefined} menu={menu} testId="r" />);
  const l1 = v.getByTestId('r').querySelector('.s3-row-l1') as HTMLElement;
  l1.dataset.sw = String(sw);
  l1.dataset.cw = String(cw);
  // the box changed: the observer calls back
  act(() => {
    for (const s of seen) if (s.el === l1) s.cb();
  });
  return v.getByTestId('r').querySelector('[data-row]') as HTMLElement;
}

describe('a side row\'s tip', () => {
  it('isCut: what the line holds is wider than it shows', () => {
    expect(isCut({ scrollWidth: 120, clientWidth: 100 })).toBe(true);
    expect(isCut({ scrollWidth: 100, clientWidth: 100 })).toBe(false);
  });

  it('a whole title: no tip', () => {
    expect(row(28, 28).hasAttribute('data-tip')).toBe(false);
  });

  it('a cut title: the tip holds it whole', () => {
    expect(row(300, 160).dataset.tip).toBe('vite --port 5173');
  });

  it('a title cut inside its line (an artifact chip\'s title takes the ellipsis, ui-review m_47044): the tip too', () => {
    const v = render(<SideRow pic={null} title={<span className="b-artchip"><span className="b-artchip-title">the full profiling report of the hub under load</span></span>} sub="doc" tip="the full profiling report of the hub under load" label="report" onClick={() => undefined} menu={menu} testId="a" />);
    const t = v.getByTestId('a').querySelector('.b-artchip-title') as HTMLElement;
    t.dataset.sw = '420';
    t.dataset.cw = '180';
    act(() => {
      for (const s of seen) s.cb();
    });
    expect((v.getByTestId('a').querySelector('[data-row]') as HTMLElement).dataset.tip).toBe('the full profiling report of the hub under load');
  });
});

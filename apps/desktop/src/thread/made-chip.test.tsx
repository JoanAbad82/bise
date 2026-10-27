// @vitest-environment happy-dom
// chip-wrap (his « petit bug d'ui sur les references a des artifacts dans l'historique quand le text
// wrap »): an artifact's chip in the thread is one line; a long title takes the … in its own box and
// the chip's tip holds it whole, only while cut (designer m_46988). happy-dom has no layout nor
// ResizeObserver: a stand-in observer calls back on observe, and the title's box says its widths as
// Chromium would. Mutation: MadeChip's title back to a bare text node (no .th-made-title) turns the
// cut case red.
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MadeChip } from './rows-news';

const seen: (() => void)[] = [];
class FakeObserver {
  constructor(private readonly cb: () => void) {}
  observe() {
    seen.push(this.cb);
    this.cb();
  }
  disconnect() {}
}

beforeEach(() => {
  seen.length = 0;
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

const TITLE = 'carte des trajets vélo depuis le 36 rue de Montreuil';

/** The chip at a column where its title measures `sw` and shows `cw`. */
function chip(sw: number, cw: number) {
  const v = render(<MadeChip kind="image" title={TITLE} meta="image · v2" onClick={() => undefined} testId="thread.artifact.7" />);
  const t = v.container.querySelector<HTMLElement>('.th-made-title');
  if (t !== null) {
    t.dataset.sw = String(sw);
    t.dataset.cw = String(cw);
  }
  // the column changed: the observer calls back
  act(() => {
    for (const cb of seen) cb();
  });
  return v;
}

describe("an artifact's chip in the thread (chip-wrap)", () => {
  it('a cut title: its own box takes the …, the tip holds it whole, the meta stays beside it', () => {
    const v = chip(420, 180);
    const name = v.getByTestId('thread.artifact.7');
    expect(name.querySelector('.th-made-title')?.textContent).toBe(TITLE);
    expect(name.dataset.tip).toBe(TITLE);
    expect(v.container.querySelector('.th-made-meta')?.textContent).toBe('image · v2');
  });

  it('a whole title: no tip', () => {
    const v = chip(180, 180);
    expect(v.getByTestId('thread.artifact.7').hasAttribute('data-tip')).toBe(false);
  });
});

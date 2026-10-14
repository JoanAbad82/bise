// @vitest-environment happy-dom
// The one tip layer: 400 ms cold, warm moves between marks, never interactive, gone on leave, a
// press, a scroll; its words follow a mark's that change.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tipAttrs } from '@/ds';
import { readFileSync } from 'node:fs';
import { TipLayer } from './TipLayer';

const TIPS_CSS = readFileSync('src/ds/css/tips.css', 'utf8');

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function marks(a = '4 agents working') {
  return render(
    <div>
      <span data-testid="a" {...tipAttrs(a)}>
        ∿ <b data-testid="a.inner">4</b>
      </span>
      <span data-testid="b" {...tipAttrs('2 waiting for you')}>
        2
      </span>
      <span data-testid="plain">acme</span>
      <TipLayer />
    </div>,
  );
}

const tip = () => document.querySelector<HTMLElement>('[data-testid="tip"]');
const over = (el: Element, from: Element | null = null) => {
  fireEvent.pointerOver(el, { relatedTarget: from });
};

describe('TipLayer', () => {
  it('shows a mark’s words after 400 ms, in body, as a tooltip', () => {
    const v = marks();
    over(v.getByTestId('a'));
    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(tip()).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(tip()?.getAttribute('role')).toBe('tooltip');
    expect(tip()?.textContent).toBe('4 agents working');
    expect(tip()?.parentElement).toBe(document.body);
  });

  it('a child of the mark is the mark: no blink', () => {
    const v = marks();
    over(v.getByTestId('a'));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    const first = tip();
    over(v.getByTestId('a.inner'), v.getByTestId('a'));
    expect(tip()).toBe(first);
  });

  it('from one mark to the next: the next at once (warm), and for 1 s after one closes', () => {
    const v = marks();
    over(v.getByTestId('a'));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    over(v.getByTestId('b'), v.getByTestId('a'));
    expect(tip()?.textContent).toBe('2 waiting for you');
    over(v.getByTestId('plain'), v.getByTestId('b'));
    expect(tip()).toBeNull();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    over(v.getByTestId('a'), v.getByTestId('plain'));
    expect(tip()?.textContent).toBe('4 agents working');
  });

  it('hides on leave, on a press, on a scroll, out of the window', () => {
    const v = marks();
    const show = () => {
      over(v.getByTestId('a'));
      act(() => {
        vi.advanceTimersByTime(1400);
      });
      expect(tip()).not.toBeNull();
    };
    show();
    over(v.getByTestId('plain'), v.getByTestId('a'));
    expect(tip()).toBeNull();
    show();
    fireEvent.pointerDown(v.getByTestId('a'));
    expect(tip()).toBeNull();
    show();
    fireEvent.scroll(document);
    expect(tip()).toBeNull();
    show();
    fireEvent.pointerOut(v.getByTestId('a'), { relatedTarget: null });
    expect(tip()).toBeNull();
  });

  it('never interactive: the ds tip has pointer-events none', () => {
    expect(TIPS_CSS).toMatch(/\.b-tip\{[^}]*pointer-events:none/);
  });

  it('a mark’s words that change while it shows: the tip follows', async () => {
    const v = marks();
    over(v.getByTestId('a'));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    v.getByTestId('a').setAttribute('data-tip', '5 agents working');
    await act(async () => {
      await Promise.resolve();
    });
    expect(tip()?.textContent).toBe('5 agents working');
  });

  it('a key at its right', () => {
    const v = render(
      <div>
        <span data-testid="k" {...tipAttrs('sidebar', '⌘\\')} />
        <TipLayer />
      </div>,
    );
    over(v.getByTestId('k'));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(tip()?.querySelector('.k')?.textContent).toBe('⌘\\');
  });
});

// @vitest-environment happy-dom
// A column's border he drags (designer m_19374, m_48013): no line at rest, the line only after
// 120 ms of hover, none if he leaves before; the outer card's border widens as it moves left.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Splitter } from './Splitter';

const hot = (el: HTMLElement): boolean => el.classList.contains('is-hot');

describe('a column border', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows its line only after 120 ms of hover, never for a pass under that', () => {
    const { getByTestId } = render(<Splitter edge="outer" width={292} onWidth={() => undefined} onReset={() => undefined} label="w" testId="split" />);
    const el = getByTestId('split');
    fireEvent.pointerEnter(el);
    act(() => {
      vi.advanceTimersByTime(119);
    });
    expect(hot(el)).toBe(false);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(hot(el)).toBe(true);
    fireEvent.pointerLeave(el);
    expect(hot(el)).toBe(false);
    // a pass: in and out before 120 ms, no line after
    fireEvent.pointerEnter(el);
    act(() => {
      vi.advanceTimersByTime(80);
    });
    fireEvent.pointerLeave(el);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(hot(el)).toBe(false);
  });

  it("the outer card's border: ← widens it, → narrows it, by 16", () => {
    const asks: number[] = [];
    const { getByTestId } = render(<Splitter edge="outer" width={292} onWidth={(w) => asks.push(w)} onReset={() => undefined} label="w" testId="split" />);
    fireEvent.keyDown(getByTestId('split'), { key: 'ArrowLeft' });
    fireEvent.keyDown(getByTestId('split'), { key: 'ArrowRight' });
    expect(asks).toEqual([308, 276]);
  });
});
